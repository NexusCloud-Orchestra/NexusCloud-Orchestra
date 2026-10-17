import asyncio

import pytest

from tests.conftest import AWS_CONNECTION, signup


@pytest.mark.postgres
async def test_parallel_upload_requests_cannot_overbook_plan(client):
    tokens = await signup(client, "race@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    await client.post("/api/v1/connections", headers=headers, json=AWS_CONNECTION)
    body = {"original_name": "a.bin", "size_bytes": 1024**3, "mime_type": "application/octet-stream"}
    results = await asyncio.gather(*(client.post("/api/v1/files/upload-request", headers=headers, json=body) for _ in range(10)))
    assert sorted(r.status_code for r in results) == [200] * 5 + [400] * 5


@pytest.mark.postgres
def test_cleanup_task_runs_repeatedly_in_fresh_event_loops(monkeypatch):
    import os

    import fakeredis.aioredis
    from sqlalchemy.ext.asyncio import create_async_engine

    import app.core.redis as redis_module
    import app.workers.tasks as worker_tasks
    from app.core.config import settings
    from app.db.base import Base
    from app.workers.db import reset_worker_engine

    url = os.environ["TEST_DATABASE_URL"]

    async def create_schema():
        engine = create_async_engine(url)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        await engine.dispose()

    asyncio.run(create_schema())
    server = fakeredis.FakeServer()
    monkeypatch.setattr(redis_module, "get_redis", lambda: fakeredis.aioredis.FakeRedis(server=server))
    monkeypatch.setattr(settings, "DATABASE_URL", url)
    reset_worker_engine()
    try:
        for _ in range(3):
            assert isinstance(worker_tasks.cleanup_expired_uploads(), int)
            assert isinstance(worker_tasks.purge_expired_tokens(), int)
    finally:
        reset_worker_engine()


def _block_exists(monkeypatch):
    from app.services.providers import LocalProvider

    original = LocalProvider.exists
    entered, release = asyncio.Event(), asyncio.Event()

    async def blocked(self, connection, credentials, object_key, file_id):
        entered.set()
        await release.wait()
        return await original(self, connection, credentials, object_key, file_id)

    monkeypatch.setattr(LocalProvider, "exists", blocked)
    return entered, release


async def _assert_user_not_locked(client, headers, confirm, entered, release):
    """While confirm waits on the provider, another locking request for the same user must not queue behind it."""
    task = asyncio.create_task(confirm)
    try:
        await asyncio.wait_for(entered.wait(), 2)
        other = await asyncio.wait_for(client.post("/api/v1/files/upload-request", headers=headers, json={
            "original_name": "other.bin", "size_bytes": 10, "mime_type": "application/octet-stream",
        }), 2)
        assert other.status_code == 200, other.text
    finally:
        release.set()
        response = await task
    assert response.status_code == 200, response.text


@pytest.mark.postgres
async def test_confirm_does_not_hold_user_lock_during_provider_call(client, monkeypatch):
    tokens = await signup(client, "confirm-lock@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    await client.post("/api/v1/connections", headers=headers, json=AWS_CONNECTION)
    content = b"p" * 32
    ticket = (await client.post("/api/v1/files/upload-request", headers=headers, json={
        "original_name": "a.bin", "size_bytes": len(content), "mime_type": "application/octet-stream",
    })).json()
    assert (await client.put(ticket["upload_url"], content=content)).status_code == 200
    entered, release = _block_exists(monkeypatch)
    confirm = client.post(f"/api/v1/files/confirm-upload/{ticket['file_id']}", headers=headers)
    await _assert_user_not_locked(client, headers, confirm, entered, release)


@pytest.mark.postgres
async def test_striped_confirm_does_not_hold_user_lock_during_provider_call(client, monkeypatch):
    import hashlib

    from app.services.striping import CHUNK_BYTES

    tokens = await signup(client, "striped-lock@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    credentials = {"aws_access_key_id": "test", "aws_secret_access_key": "secret"}
    await client.post("/api/v1/connections", headers=headers, json=AWS_CONNECTION)
    response = await client.post("/api/v1/connections", headers=headers, json={
        **AWS_CONNECTION, "provider": "r2", "display_name": "R2", "credentials": {**credentials, "account_id": "0" * 32},
    })
    assert response.status_code == 201, response.text
    pieces = [b"a" * CHUNK_BYTES, b"tail"]
    response = await client.post("/api/v1/files/striped-upload-request", headers=headers, json={
        "original_name": "striped.bin", "size_bytes": sum(map(len, pieces)), "mime_type": "application/octet-stream",
        "chunks": [{"size_bytes": len(piece), "sha256": hashlib.sha256(piece).hexdigest()} for piece in pieces],
    })
    assert response.status_code == 200, response.text
    ticket = response.json()
    for index, piece in enumerate(pieces):
        signed = (await client.get(f"/api/v1/files/striped/{ticket['file_id']}/chunks/{index}/upload-url", headers=headers)).json()
        assert (await client.put(signed["url"], content=piece, headers=signed["required_headers"])).status_code == 200
    entered, release = _block_exists(monkeypatch)
    confirm = client.post(f"/api/v1/files/striped/{ticket['file_id']}/confirm", headers=headers)
    await _assert_user_not_locked(client, headers, confirm, entered, release)
