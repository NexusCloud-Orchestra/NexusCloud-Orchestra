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
