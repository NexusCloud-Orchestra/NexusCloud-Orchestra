import os
import base64
import uuid
from types import SimpleNamespace
from urllib.parse import parse_qs, urlsplit

os.environ["SECRET_KEY"] = "test-access-secret-0123456789abcdef0123456789"
os.environ["ENCRYPTION_KEY"] = "test-encryption-secret-0123456789abcdef"

import pytest
import pytest_asyncio
import fakeredis.aioredis
from redis.asyncio import Redis
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import Settings, settings
from app.db.base import Base
from app.db.session import get_db
from app.main import app
import app.main as main_module
import app.api.v1.routes.auth as auth_routes
from app.services.router import Candidate, SmartRouter
from app.services.providers import AzureProvider, GCPProvider, S3Provider


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
