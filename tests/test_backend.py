import os
import base64
import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from urllib.parse import parse_qs, urlsplit

os.environ["SECRET_KEY"] = "test-access-secret-0123456789abcdef0123456789"
os.environ["ENCRYPTION_KEY"] = "test-encryption-secret-0123456789abcdef"

import pytest
import pytest_asyncio
import fakeredis.aioredis
import jwt
from redis.asyncio import Redis
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import Settings, settings
from app.core.security import issue_token, parse_token
from app.db.base import Base
from app.db.session import get_db
from app.main import app
import app.main as main_module
import app.api.v1.routes.auth as auth_routes
from app.services.router import Candidate, SmartRouter
from app.services.striping import CHUNK_BYTES, index_hash, manifest_index_hash, place_chunks
from app.services.catalog import PROVIDERS
from app.services.providers import AzureProvider, GCPProvider, S3Provider
from app.services.providers import LocalProvider
from app.db.models import FileManifest, FileRecord
import app.workers.tasks as worker_tasks


@pytest_asyncio.fixture
async def client(tmp_path, monkeypatch):
    redis_server = fakeredis.FakeServer()
    monkeypatch.setattr(Redis, "from_url", lambda *args, **kwargs: fakeredis.aioredis.FakeRedis(server=redis_server))
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'test.db'}")
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async def override_db():
        async with factory() as db:
            yield db

    app.dependency_overrides[get_db] = override_db
    monkeypatch.setattr(main_module, "SessionLocal", factory)
    monkeypatch.setattr(settings, "LOCAL_STORAGE_ENABLED", True)
    monkeypatch.setattr(settings, "LOCAL_STORAGE_PATH", str(tmp_path / "storage"))
    monkeypatch.setattr(settings, "PUBLIC_API_URL", "http://testserver")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as test_client:
        test_client.test_session_factory = factory
        yield test_client
    app.dependency_overrides.clear()
    await engine.dispose()


async def signup(client, email):
    response = await client.post("/api/v1/auth/register", json={
        "first_name": "Test", "last_name": "User", "email": email, "password": "SecurePassword123!"
    })
    assert response.status_code == 201, response.text
    response = await client.post("/api/v1/auth/login", json={"email": email, "password": "SecurePassword123!"})
    assert response.status_code == 200, response.text
    return response.json()


@pytest.mark.asyncio
async def test_full_flow_and_isolation(client):
    tokens = await signup(client, "one@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    other = await signup(client, "two@example.com")
    other_headers = {"Authorization": f"Bearer {other['access_token']}"}
    response = await client.post("/api/v1/connections", headers=headers, json={
        "provider": "aws", "display_name": "Test AWS", "bucket_name": "test-bucket", "region": "us-east-1",
        "credentials": {"aws_access_key_id": "test", "aws_secret_access_key": "secret"}
    })
    assert response.status_code == 201, response.text
    connection_id = response.json()["id"]
    assert "credentials" not in response.json()
    assert (await client.get("/api/v1/connections", headers=other_headers)).json() == []
    response = await client.post("/api/v1/files/upload-request", headers=headers, json={
        "original_name": "hello.txt", "size_bytes": 120, "mime_type": "text/plain"
    })
    assert response.status_code == 200, response.text
    upload = response.json()
    assert upload["provider"] == "aws"
    pending_quota = (await client.get("/api/v1/quota/summary", headers=headers)).json()
    assert pending_quota["total_limit_bytes"] == 5 * 1024**3
    assert pending_quota["total_free_bytes"] == pending_quota["total_limit_bytes"] - 120
    assert (await client.post(f"/api/v1/files/confirm-upload/{upload['file_id']}", headers=headers)).status_code == 409
    assert (await client.get(f"/api/v1/files/download/{upload['file_id']}", headers=other_headers)).status_code == 404
    content = b"hello cloud"
    response = await client.put(upload["upload_url"], content=content)
    assert response.status_code == 200, response.text
    assert (await client.post(f"/api/v1/files/confirm-upload/{upload['file_id']}", headers=headers)).json()["status"] == "active"
    summary = (await client.get("/api/v1/quota/summary", headers=headers)).json()
    assert summary["total_used_bytes"] == 120
    assert summary["total_free_bytes"] == summary["total_limit_bytes"] - 120
    assert (await client.delete(f"/api/v1/connections/{connection_id}", headers=headers)).status_code == 409
    download = (await client.get(f"/api/v1/files/download/{upload['file_id']}", headers=headers)).json()
    assert (await client.get(download["download_url"])).content == content
    assert (await client.delete(f"/api/v1/files/{upload['file_id']}", headers=other_headers)).status_code == 404
    assert (await client.delete(f"/api/v1/files/{upload['file_id']}", headers=headers)).status_code == 204
    assert (await client.get("/api/v1/files", headers=headers)).json() == []
    assert (await client.get("/api/v1/quota/summary", headers=headers)).json()["total_used_bytes"] == 0
    assert (await client.delete(f"/api/v1/connections/{connection_id}", headers=headers)).status_code == 204


@pytest.mark.asyncio
async def test_quota_summary_recovers_from_invalid_cache(client):
    tokens = await signup(client, "quota-cache@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    user_id = (await client.get("/api/v1/auth/me", headers=headers)).json()["id"]
    redis = Redis.from_url(settings.REDIS_URL)
    try:
        for malformed in ("not json", '{"by_connection": []}'):
            await redis.set(f"quota:{user_id}", malformed)
            response = await client.get("/api/v1/quota/summary", headers=headers)
            assert response.status_code == 200, response.text
            assert response.json()["total_used_bytes"] == 0
            assert response.json()["plan"] == "free"
    finally:
        await redis.aclose()


@pytest.mark.asyncio
async def test_refresh_rotation_logout_and_plan_guard(client):
    tokens = await signup(client, "auth@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    assert (await client.post("/api/v1/auth/plan", headers=headers, json={"plan": "pro"})).status_code == 403
    rotated = await client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert rotated.status_code == 200, rotated.text
    assert (await client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})).status_code == 401
    new_headers = {"Authorization": f"Bearer {rotated.json()['access_token']}"}
    assert (await client.post("/api/v1/auth/logout", headers=new_headers)).status_code == 204
    assert (await client.get("/api/v1/auth/me", headers=new_headers)).status_code == 401
    assert (await client.post("/api/v1/auth/refresh", json={"refresh_token": rotated.json()["refresh_token"]})).status_code == 401


@pytest.mark.asyncio
async def test_connection_cap_input_and_signed_url_guard(client):
    tokens = await signup(client, "limits@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    assert (await client.post("/api/v1/files/upload-request", headers=headers, json={
        "original_name": "one.txt", "size_bytes": 1, "mime_type": "text/plain"
    })).status_code == 400
    for index in range(2):
        response = await client.post("/api/v1/connections", headers=headers, json={
            "provider": "aws", "display_name": f"Cloud {index}", "bucket_name": "test-bucket",
            "credentials": {"aws_access_key_id": "test", "aws_secret_access_key": "secret"}
        })
        assert response.status_code == 201, response.text
    response = await client.post("/api/v1/connections", headers=headers, json={
        "provider": "aws", "display_name": "Cloud 3", "bucket_name": "test-bucket",
        "credentials": {"aws_access_key_id": "test", "aws_secret_access_key": "secret"}
    })
    assert response.status_code == 403
    assert "Upgrade" in response.json()["error"]["message"]
    bad = await client.post("/api/v1/files/upload-request", headers=headers, json={
        "original_name": "../escape", "size_bytes": 1, "mime_type": "text/plain"
    })
    assert bad.status_code == 422
    response = await client.post("/api/v1/files/upload-request", headers=headers, json={
        "original_name": "valid.txt", "size_bytes": 1, "mime_type": "text/plain"
    })
    assert response.status_code == 200
    ticket = response.json()
    assert (await client.put(ticket["upload_url"].replace("token=", "token=x"))).status_code == 403
    assert (await client.post("/api/v1/files/confirm-upload/" + ticket["file_id"], headers=headers)).status_code == 409
    assert (await client.get("/api/v1/quota/summary", headers=headers)).json()["total_used_bytes"] == 0


@pytest.mark.asyncio
async def test_auth_rate_limit(client):
    for _ in range(10):
        response = await client.post("/api/v1/auth/forgot-password", json={"email": "nobody@example.com"})
        assert response.status_code == 200
    response = await client.post("/api/v1/auth/forgot-password", headers={"Origin": "http://localhost:5173"}, json={"email": "nobody@example.com"})
    assert response.status_code == 429
    assert response.headers["Retry-After"] == "60"
    assert response.headers["Access-Control-Allow-Origin"] == "http://localhost:5173"


@pytest.mark.asyncio
async def test_password_reset_is_single_use(client, monkeypatch):
    await signup(client, "recovery@example.com")
    delivered = {}
    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.test")
    monkeypatch.setattr(auth_routes, "send_reset_email", lambda email, token: delivered.update(email=email, token=token))
    response = await client.post("/api/v1/auth/forgot-password", json={"email": "recovery@example.com"})
    assert response.status_code == 200
    assert delivered["email"] == "recovery@example.com"
    body = {"email": "recovery@example.com", "token": delivered["token"], "new_password": "NewSecurePassword123!"}
    assert (await client.post("/api/v1/auth/reset-password", json=body)).status_code == 200
    assert (await client.post("/api/v1/auth/reset-password", json=body)).status_code == 400
    assert (await client.post("/api/v1/auth/login", json={
        "email": "recovery@example.com", "password": "SecurePassword123!"
    })).status_code == 401
    assert (await client.post("/api/v1/auth/login", json={
        "email": "recovery@example.com", "password": "NewSecurePassword123!"
    })).status_code == 200


def test_router_prefers_free_egress():
    class Connection:
        def __init__(self, provider, id):
            self.provider, self.id = provider, id
    selected = SmartRouter().select([Candidate(Connection("aws", "a"), 100), Candidate(Connection("r2", "r"), 100)], 20)
    assert selected.connection.provider == "r2"


def test_stripe_placement_uses_tail_on_small_secondary_cloud():
    aws = SimpleNamespace(provider="aws", id=uuid.uuid4())
    r2 = SimpleNamespace(provider="r2", id=uuid.uuid4())
    free = {
        aws.id: 3 * CHUNK_BYTES + 1,
        r2.id: 1,
    }
    used = {connection.id: PROVIDERS[connection.provider].free_bytes - free[connection.id] for connection in (aws, r2)}
    chosen = place_chunks([aws, r2], used, [CHUNK_BYTES, CHUNK_BYTES, 1])
    assert chosen is not None
    assert [connection.provider for connection in chosen] == ["aws", "aws", "r2"]


def test_tokens_require_expiry_signature_and_type():
    user_id = uuid.uuid4()
    token, _, _ = issue_token(user_id, 0, "access", timedelta(minutes=1))
    assert parse_token(token, "access")["sub"] == str(user_id)
    with pytest.raises(ValueError):
        parse_token(token, "refresh")
    missing_expiry = jwt.encode(
        {"sub": str(user_id), "jti": "test", "typ": "access", "ver": 0},
        settings.SECRET_KEY,
        algorithm="HS256",
    )
    with pytest.raises(ValueError):
        parse_token(missing_expiry, "access")
    unsigned = jwt.encode(
        {"sub": str(user_id), "jti": "test", "typ": "access", "ver": 0, "exp": 4102444800},
        key="",
        algorithm="none",
    )
    with pytest.raises(ValueError):
        parse_token(unsigned, "access")


@pytest.mark.asyncio
async def test_provider_signing_contracts():
    connection = SimpleNamespace(bucket_name="example-bucket", region="us-east-1")
    url, headers = await S3Provider().upload_url(connection, {
        "aws_access_key_id": "test-key", "aws_secret_access_key": "test-secret"
    }, "user-id/object-id", "text/plain", uuid.uuid4())
    query = parse_qs(urlsplit(url).query)
    assert query["X-Amz-Expires"] == ["900"]
    assert headers == {"Content-Type": "text/plain"}
    azure = AzureProvider()
    azure_connection = SimpleNamespace(bucket_name="example-container")
    azure_creds = {"account_name": "testaccount", "account_key": base64.b64encode(b"x" * 32).decode()}
    url, headers = await azure.upload_url(azure_connection, azure_creds, "user-id/object-id", "text/plain", uuid.uuid4())
    assert urlsplit(url).hostname == "testaccount.blob.core.windows.net"
    assert parse_qs(urlsplit(url).query)["sp"] == ["cw"]
    assert headers["x-ms-blob-type"] == "BlockBlob"
    with pytest.raises(ValueError):
        GCPProvider().validate({"service_account_json": '{"type":"service_account","token_uri":"http://localhost/steal"}'})


def test_production_rejects_insecure_configuration():
    with pytest.raises(ValueError):
        Settings(_env_file=None, ENVIRONMENT="production", SECRET_KEY="a" * 40, ENCRYPTION_KEY="b" * 40).assert_safe()
    safe = Settings(
        _env_file=None, ENVIRONMENT="production", SECRET_KEY="a" * 40, ENCRYPTION_KEY="b" * 40,
        PUBLIC_API_URL="https://api.example.com", FRONTEND_URL="https://app.example.com",
        CORS_ORIGINS="https://app.example.com", SMTP_HOST="smtp.example.com", SMTP_FROM="security@example.com",
    )
    safe.assert_safe()


async def connect(client, headers, provider, name, **extra):
    credentials = {"aws_access_key_id": "test", "aws_secret_access_key": "secret"}
    if provider == "r2":
        credentials["account_id"] = "0" * 32
    response = await client.post("/api/v1/connections", headers=headers, json={
        "provider": provider, "display_name": name, "bucket_name": "test-bucket", "region": "us-east-1",
        "credentials": credentials, **extra,
    })
    assert response.status_code == 201, response.text
    return response.json()["id"]


@pytest.mark.asyncio
async def test_route_preview_explains_decision_without_reserving(client):
    tokens = await signup(client, "router@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    empty = (await client.post("/api/v1/files/route-preview", headers=headers, json={"size_bytes": 10})).json()
    assert empty["blocked_reason"] == "no_connections"
    assert empty["candidates"] == [] and empty["selected_connection_id"] is None
    aws = await connect(client, headers, "aws", "S3")
    r2 = await connect(client, headers, "r2", "R2")
    preview = await client.post("/api/v1/files/route-preview", headers=headers, json={"size_bytes": 1024})
    assert preview.status_code == 200, preview.text
    body = preview.json()
    assert body["selected_connection_id"] == r2 and body["blocked_reason"] is None
    assert body["weights"] == {"capacity": 0.4, "egress": 0.3, "permanence": 0.2, "fit": 0.1}
    assert [c["connection_id"] for c in body["candidates"]] == [r2, aws]
    for candidate in body["candidates"]:
        assert abs(sum(candidate["components"].values()) - candidate["score"]) < 1e-3
    # Preview must not reserve capacity.
    assert (await client.get("/api/v1/quota/summary", headers=headers)).json()["total_reserved_bytes"] == 0
    ticket = (await client.post("/api/v1/files/upload-request", headers=headers, json={
        "original_name": "a.bin", "size_bytes": 1024, "mime_type": "application/octet-stream"
    })).json()
    # The real upload path makes the same decision the preview reported.
    assert ticket["connection_id"] == r2 and ticket["provider"] == "r2"
    too_big = (await client.post("/api/v1/files/route-preview", headers=headers, json={"size_bytes": 5 * 1024**3})).json()
    assert too_big["blocked_reason"] == "plan_limit" and too_big["selected_connection_id"] is None
    assert too_big["message"].startswith("Plan storage limit")
    assert (await client.post("/api/v1/files/route-preview", headers=headers, json={"size_bytes": 0})).status_code == 422
    assert (await client.post("/api/v1/files/route-preview", json={"size_bytes": 1})).status_code == 401


@pytest.mark.asyncio
async def test_cancel_upload_releases_reservation(client):
    tokens = await signup(client, "cancel@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    other = await signup(client, "cancel-other@example.com")
    other_headers = {"Authorization": f"Bearer {other['access_token']}"}
    connection_id = await connect(client, headers, "aws", "S3")
    ticket = (await client.post("/api/v1/files/upload-request", headers=headers, json={
        "original_name": "big.bin", "size_bytes": 4096, "mime_type": "application/octet-stream"
    })).json()
    summary = (await client.get("/api/v1/quota/summary", headers=headers)).json()
    assert summary["total_reserved_bytes"] == 4096 and summary["by_connection"][0]["reserved_bytes"] == 4096
    assert summary["plan"] == "free" and summary["plan_limit_bytes"] == 5 * 1024**3
    assert (await client.delete(f"/api/v1/connections/{connection_id}", headers=headers)).status_code == 409
    assert (await client.post(f"/api/v1/files/cancel-upload/{ticket['file_id']}", headers=other_headers)).status_code == 404
    assert (await client.post(f"/api/v1/files/cancel-upload/{ticket['file_id']}", headers=headers)).status_code == 204
    assert (await client.post(f"/api/v1/files/cancel-upload/{ticket['file_id']}", headers=headers)).status_code == 409
    assert (await client.post(f"/api/v1/files/confirm-upload/{ticket['file_id']}", headers=headers)).status_code == 409
    assert (await client.get("/api/v1/quota/summary", headers=headers)).json()["total_reserved_bytes"] == 0
    assert (await client.delete(f"/api/v1/connections/{connection_id}", headers=headers)).status_code == 204


@pytest.mark.asyncio
async def test_striped_file_lifecycle_and_hash_index(client):
    tokens = await signup(client, "stripe@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    other = await signup(client, "stripe-other@example.com")
    other_headers = {"Authorization": f"Bearer {other['access_token']}"}
    aws = await connect(client, headers, "aws", "S3")
    r2 = await connect(client, headers, "r2", "R2")
    pieces = [b"a" * CHUNK_BYTES, b"last chunk"]
    sizes_and_hashes = [(len(piece), hashlib.sha256(piece).hexdigest()) for piece in pieces]
    response = await client.post("/api/v1/files/striped-upload-request", headers=headers, json={
        "original_name": "striped.bin", "size_bytes": sum(map(len, pieces)),
        "mime_type": "application/octet-stream",
        "chunks": [{"size_bytes": size, "sha256": digest} for size, digest in sizes_and_hashes],
    })
    assert response.status_code == 200, response.text
    ticket = response.json()
    assert ticket["index_version"] == 2
    assert ticket["index_hash"] == manifest_index_hash(sum(map(len, pieces)), [
        (chunk["size_bytes"], chunk["sha256"], uuid.UUID(chunk["chunk_id"]),
         uuid.UUID(chunk["connection_id"]), chunk["provider"])
        for chunk in ticket["chunks"]
    ])
    assert {chunk["connection_id"] for chunk in ticket["chunks"]} == {aws, r2}
    assert (await client.get("/api/v1/quota/summary", headers=headers)).json()["total_reserved_bytes"] == sum(map(len, pieces))
    assert (await client.post(f"/api/v1/files/striped/{ticket['file_id']}/confirm", headers=headers, json={})).status_code == 409
    assert (await client.get(f"/api/v1/files/striped/{ticket['file_id']}/manifest", headers=other_headers)).status_code == 404
    for index, piece in enumerate(pieces):
        path = f"/api/v1/files/striped/{ticket['file_id']}/chunks/{index}/upload-url"
        assert (await client.get(path, headers=other_headers)).status_code == 404
        signed = (await client.get(path, headers=headers)).json()
        uploaded = await client.put(signed["url"], content=piece, headers=signed["required_headers"])
        assert uploaded.status_code == 200, uploaded.text
    confirmed = await client.post(f"/api/v1/files/striped/{ticket['file_id']}/confirm", headers=headers, json={})
    assert confirmed.status_code == 200, confirmed.text
    assert confirmed.json()["storage_mode"] == "striped"
    listing = (await client.get("/api/v1/files", headers=headers)).json()
    assert len(listing) == 1 and listing[0]["provider"] == "multi"
    assert (await client.get("/api/v1/quota/summary", headers=headers)).json()["total_used_bytes"] == sum(map(len, pieces))
    manifest = (await client.get(f"/api/v1/files/striped/{ticket['file_id']}/manifest", headers=headers)).json()
    assert manifest["index_version"] == 2 and manifest["index_hash"] == ticket["index_hash"]
    assert [(chunk["size_bytes"], chunk["sha256"]) for chunk in manifest["chunks"]] == sizes_and_hashes
    for index, piece in enumerate(pieces):
        signed = (await client.get(
            f"/api/v1/files/striped/{ticket['file_id']}/chunks/{index}/download-url", headers=headers
        )).json()
        assert (await client.get(signed["url"])).content == piece
    assert (await client.delete(f"/api/v1/files/striped/{ticket['file_id']}", headers=other_headers)).status_code == 404
    assert (await client.delete(f"/api/v1/files/striped/{ticket['file_id']}", headers=headers)).status_code == 204
    assert (await client.get("/api/v1/quota/summary", headers=headers)).json()["total_used_bytes"] == 0
    assert (await client.get("/api/v1/files", headers=headers)).json() == []
    assert (await client.delete(f"/api/v1/connections/{aws}", headers=headers)).status_code == 204
    assert (await client.delete(f"/api/v1/connections/{r2}", headers=headers)).status_code == 204


@pytest.mark.asyncio
async def test_striped_index_rejects_changed_placement(client):
    tokens = await signup(client, "stripe-index@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    aws = await connect(client, headers, "aws", "S3")
    r2 = await connect(client, headers, "r2", "R2")
    ticket = (await client.post("/api/v1/files/striped-upload-request", headers=headers, json={
        "original_name": "index.bin", "size_bytes": CHUNK_BYTES + 1,
        "mime_type": "application/octet-stream",
        "chunks": [
            {"size_bytes": CHUNK_BYTES, "sha256": hashlib.sha256(b"a").hexdigest()},
            {"size_bytes": 1, "sha256": hashlib.sha256(b"b").hexdigest()},
        ],
    })).json()
    assert (await client.get(f"/api/v1/files/striped/{ticket['file_id']}/chunks/0/upload-url", headers=headers)).status_code == 200
    async with client.test_session_factory() as db:
        chunk = await db.get(FileRecord, uuid.UUID(ticket["chunks"][0]["chunk_id"]))
        chunk.connection_id = uuid.UUID(r2 if ticket["chunks"][0]["connection_id"] == aws else aws)
        await db.commit()
    assert (await client.get(f"/api/v1/files/striped/{ticket['file_id']}/manifest", headers=headers)).status_code == 503
    assert (await client.get(f"/api/v1/files/striped/{ticket['file_id']}/chunks/0/upload-url", headers=headers)).status_code == 503


@pytest.mark.asyncio
async def test_legacy_stripe_index_remains_readable(client):
    tokens = await signup(client, "stripe-v1@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    await connect(client, headers, "aws", "S3")
    await connect(client, headers, "r2", "R2")
    pieces = [b"a" * CHUNK_BYTES, b"b"]
    ticket = (await client.post("/api/v1/files/striped-upload-request", headers=headers, json={
        "original_name": "legacy.bin", "size_bytes": sum(map(len, pieces)),
        "mime_type": "application/octet-stream",
        "chunks": [{"size_bytes": len(piece), "sha256": hashlib.sha256(piece).hexdigest()} for piece in pieces],
    })).json()
    async with client.test_session_factory() as db:
        manifest = await db.get(FileManifest, uuid.UUID(ticket["file_id"]))
        manifest.index_version = 1
        manifest.index_hash = index_hash([
            (chunk["size_bytes"], chunk["sha256"]) for chunk in ticket["chunks"]
        ])
        await db.commit()
    for index, piece in enumerate(pieces):
        signed = (await client.get(
            f"/api/v1/files/striped/{ticket['file_id']}/chunks/{index}/upload-url", headers=headers
        )).json()
        assert (await client.put(signed["url"], content=piece, headers=signed["required_headers"])).status_code == 200
    assert (await client.post(f"/api/v1/files/striped/{ticket['file_id']}/confirm", headers=headers)).status_code == 200
    response = await client.get(f"/api/v1/files/striped/{ticket['file_id']}/manifest", headers=headers)
    assert response.status_code == 200 and response.json()["index_version"] == 1


@pytest.mark.asyncio
async def test_striped_cancel_after_partial_upload_blocks_old_url_and_releases_quota(client, monkeypatch):
    tokens = await signup(client, "stripe-cancel@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    aws = await connect(client, headers, "aws", "S3")
    r2 = await connect(client, headers, "r2", "R2")
    pieces = [b"a" * CHUNK_BYTES, b"tail"]
    ticket = (await client.post("/api/v1/files/striped-upload-request", headers=headers, json={
        "original_name": "cancel.bin", "size_bytes": sum(map(len, pieces)),
        "mime_type": "application/octet-stream",
        "chunks": [{"size_bytes": len(piece), "sha256": hashlib.sha256(piece).hexdigest()} for piece in pieces],
    })).json()
    url = (await client.get(
        f"/api/v1/files/striped/{ticket['file_id']}/chunks/0/upload-url", headers=headers
    )).json()
    assert (await client.put(url["url"], content=pieces[0], headers=url["required_headers"])).status_code == 200
    assert (await client.post(f"/api/v1/files/striped/{ticket['file_id']}/cancel", headers=headers)).status_code == 204
    assert (await client.put(url["url"], content=pieces[0], headers=url["required_headers"])).status_code == 404
    assert (await client.post(f"/api/v1/files/striped/{ticket['file_id']}/confirm", headers=headers)).status_code == 409
    assert (await client.get("/api/v1/quota/summary", headers=headers)).json()["total_reserved_bytes"] == 0
    assert (await client.delete(f"/api/v1/connections/{aws}", headers=headers)).status_code == 409
    async with client.test_session_factory() as db:
        manifest = await db.get(FileManifest, uuid.UUID(ticket["file_id"]))
        manifest.upload_expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
        await db.commit()
    monkeypatch.setattr(worker_tasks, "SessionLocal", client.test_session_factory)
    assert await worker_tasks._cleanup() == 1
    assert (await client.delete(f"/api/v1/connections/{aws}", headers=headers)).status_code == 204
    assert (await client.delete(f"/api/v1/connections/{r2}", headers=headers)).status_code == 204


@pytest.mark.asyncio
async def test_striped_partial_delete_is_retried_by_worker(client, monkeypatch):
    tokens = await signup(client, "stripe-retry@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    await connect(client, headers, "aws", "S3")
    await connect(client, headers, "r2", "R2")
    pieces = [b"a" * CHUNK_BYTES, b"tail"]
    ticket = (await client.post("/api/v1/files/striped-upload-request", headers=headers, json={
        "original_name": "retry.bin", "size_bytes": sum(map(len, pieces)),
        "mime_type": "application/octet-stream",
        "chunks": [{"size_bytes": len(piece), "sha256": hashlib.sha256(piece).hexdigest()} for piece in pieces],
    })).json()
    for index, piece in enumerate(pieces):
        url = (await client.get(
            f"/api/v1/files/striped/{ticket['file_id']}/chunks/{index}/upload-url", headers=headers
        )).json()
        assert (await client.put(url["url"], content=piece, headers=url["required_headers"])).status_code == 200
    assert (await client.post(f"/api/v1/files/striped/{ticket['file_id']}/confirm", headers=headers)).status_code == 200

    original_delete = LocalProvider.delete
    calls = 0

    async def fail_second_delete(self, connection, credentials, object_key, file_id):
        nonlocal calls
        calls += 1
        if calls == 2:
            raise RuntimeError("simulated provider failure")
        return await original_delete(self, connection, credentials, object_key, file_id)

    monkeypatch.setattr(LocalProvider, "delete", fail_second_delete)
    response = await client.delete(f"/api/v1/files/striped/{ticket['file_id']}", headers=headers)
    assert response.status_code == 502
    assert (await client.get("/api/v1/files", headers=headers)).json() == []
    assert (await client.get("/api/v1/quota/summary", headers=headers)).json()["total_used_bytes"] == sum(map(len, pieces))
    monkeypatch.setattr(LocalProvider, "delete", original_delete)
    monkeypatch.setattr(worker_tasks, "SessionLocal", client.test_session_factory)
    async with client.test_session_factory() as db:
        manifest = await db.get(FileManifest, uuid.UUID(ticket["file_id"]))
        manifest.upload_expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
        await db.commit()
    assert await worker_tasks._cleanup() == 1
    assert (await client.get("/api/v1/quota/summary", headers=headers)).json()["total_used_bytes"] == 0


@pytest.mark.asyncio
async def test_striped_rejects_malformed_manifest_without_reserving_quota(client):
    tokens = await signup(client, "stripe-invalid@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    await connect(client, headers, "aws", "S3")
    await connect(client, headers, "r2", "R2")
    valid_hash = hashlib.sha256(b"a").hexdigest()
    base = {
        "original_name": "invalid.bin", "size_bytes": CHUNK_BYTES + 1,
        "mime_type": "application/octet-stream",
        "chunks": [
            {"size_bytes": CHUNK_BYTES, "sha256": valid_hash},
            {"size_bytes": 1, "sha256": valid_hash},
        ],
    }
    for chunks in (
        base["chunks"][:1],
        [{**base["chunks"][0], "size_bytes": CHUNK_BYTES - 1}, base["chunks"][1]],
        [{**base["chunks"][0], "sha256": valid_hash.upper()}, base["chunks"][1]],
    ):
        response = await client.post(
            "/api/v1/files/striped-upload-request", headers=headers, json={**base, "chunks": chunks}
        )
        assert response.status_code == 422
    assert (await client.get("/api/v1/quota/summary", headers=headers)).json()["total_reserved_bytes"] == 0


@pytest.mark.asyncio
async def test_file_listing_includes_provider(client):
    tokens = await signup(client, "listing@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    await connect(client, headers, "aws", "S3")
    ticket = (await client.post("/api/v1/files/upload-request", headers=headers, json={
        "original_name": "x.txt", "size_bytes": 3, "mime_type": "text/plain"
    })).json()
    assert (await client.put(ticket["upload_url"], content=b"abc", headers=ticket["required_headers"])).status_code == 200
    confirmed = (await client.post(f"/api/v1/files/confirm-upload/{ticket['file_id']}", headers=headers)).json()
    assert confirmed["provider"] == "aws"
    files = (await client.get("/api/v1/files", headers=headers)).json()
    assert [(f["original_name"], f["provider"]) for f in files] == [("x.txt", "aws")]


@pytest.mark.asyncio
async def test_delete_account_requires_password_and_empty_storage(client):
    tokens = await signup(client, "erase@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    connection_id = await connect(client, headers, "aws", "S3")
    ticket = (await client.post("/api/v1/files/upload-request", headers=headers, json={
        "original_name": "x.txt", "size_bytes": 3, "mime_type": "text/plain"
    })).json()
    wrong = await client.post("/api/v1/auth/delete-account", headers=headers, json={"password": "nope-nope"})
    assert wrong.status_code == 400
    blocked = await client.post("/api/v1/auth/delete-account", headers=headers, json={"password": "SecurePassword123!"})
    assert blocked.status_code == 409
    await client.post(f"/api/v1/files/cancel-upload/{ticket['file_id']}", headers=headers)
    erased = await client.post("/api/v1/auth/delete-account", headers=headers, json={"password": "SecurePassword123!"})
    assert erased.status_code == 204, erased.text
    assert (await client.get("/api/v1/auth/me", headers=headers)).status_code == 401
    assert (await client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})).status_code == 401
    assert (await client.post("/api/v1/auth/login", json={
        "email": "erase@example.com", "password": "SecurePassword123!"
    })).status_code == 401
    # The email can be registered again because no metadata survives.
    await signup(client, "erase@example.com")
    assert connection_id


@pytest.mark.asyncio
async def test_worker_purges_expired_tokens(client, monkeypatch):
    from datetime import datetime, timedelta, timezone
    import app.workers.tasks as tasks
    from app.db.models import RefreshSession
    from sqlalchemy import func, select
    monkeypatch.setattr(tasks, "SessionLocal", main_module.SessionLocal)
    tokens = await signup(client, "purge@example.com")
    async with main_module.SessionLocal() as db:
        session = await db.scalar(select(RefreshSession))
        session.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
        await db.commit()
    assert await tasks._purge_expired_tokens() == 1
    async with main_module.SessionLocal() as db:
        assert await db.scalar(select(func.count()).select_from(RefreshSession)) == 0
    assert (await client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})).status_code == 401
