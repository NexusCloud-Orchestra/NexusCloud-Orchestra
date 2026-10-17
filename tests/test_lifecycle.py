import uuid
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import select

from app.core.config import settings
from app.db.models import FileRecord, Quota
from app.services.providers import LocalProvider
from app.services.quota import invalidate_quota
import app.workers.tasks as worker_tasks
from tests.conftest import AWS_CONNECTION, signup


async def _setup(client, email):
    tokens = await signup(client, email)
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    response = await client.post("/api/v1/connections", headers=headers, json=AWS_CONNECTION)
    assert response.status_code == 201, response.text
    return headers, response.json()["id"]


async def _upload(client, headers, content, confirm=True):
    ticket = (await client.post("/api/v1/files/upload-request", headers=headers, json={
        "original_name": "file.bin", "size_bytes": len(content), "mime_type": "application/octet-stream",
    })).json()
    assert (await client.put(ticket["upload_url"], content=content)).status_code == 200
    if confirm:
        confirmed = await client.post(f"/api/v1/files/confirm-upload/{ticket['file_id']}", headers=headers)
        assert confirmed.status_code == 200, confirmed.text
    return ticket["file_id"]


def _object_path(file_id):
    from pathlib import Path
    return Path(settings.LOCAL_STORAGE_PATH) / f"{file_id}.bin"


async def _record(client, file_id) -> FileRecord:
    async with client.test_session_factory() as db:
        return await db.get(FileRecord, uuid.UUID(file_id))


async def _expire(client, file_id):
    async with client.test_session_factory() as db:
        file = await db.get(FileRecord, uuid.UUID(file_id))
        file.upload_expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
        await db.commit()


def _failing_once(monkeypatch):
    original = LocalProvider.delete
    calls = 0

    async def fail_first(self, connection, credentials, object_key, file_id):
        nonlocal calls
        calls += 1
        if calls == 1:
            raise RuntimeError("simulated provider failure")
        return await original(self, connection, credentials, object_key, file_id)

    monkeypatch.setattr(LocalProvider, "delete", fail_first)


@pytest.mark.asyncio
async def test_cancel_upload_defers_delete_until_url_expiry(client, monkeypatch):
    headers, _ = await _setup(client, "cancel-defer@example.com")
    file_id = await _upload(client, headers, b"x" * 64, confirm=False)
    signed_expiry = (await _record(client, file_id)).upload_expires_at
    assert (await client.post(f"/api/v1/files/cancel-upload/{file_id}", headers=headers)).status_code == 204
    # The signed PUT URL stays valid until it expires, so the object must outlive the cancel.
    assert _object_path(file_id).is_file()
    record = await _record(client, file_id)
    assert record.status == "cleanup_pending"
    assert record.upload_expires_at == signed_expiry
    assert (await client.get("/api/v1/quota/summary", headers=headers)).json()["total_reserved_bytes"] == 0

    monkeypatch.setattr(worker_tasks, "worker_session", client.test_session_factory)
    assert await worker_tasks._cleanup() == 0
    assert _object_path(file_id).is_file()
    await _expire(client, file_id)
    assert await worker_tasks._cleanup() == 1
    assert not _object_path(file_id).exists()
    assert (await _record(client, file_id)).status == "cancelled"


@pytest.mark.asyncio
async def test_delete_failure_is_retried_by_worker(client, monkeypatch):
    headers, _ = await _setup(client, "delete-retry@example.com")
    file_id = await _upload(client, headers, b"y" * 100)
    _failing_once(monkeypatch)
    response = await client.delete(f"/api/v1/files/{file_id}", headers=headers)
    assert response.status_code == 502
    assert response.json()["error"]["message"] == "Could not delete cloud object; cleanup will retry"
    assert (await _record(client, file_id)).status == "deleting"
    assert (await client.get("/api/v1/files", headers=headers)).json() == []
    # A file being deleted still occupies cloud space until the object is gone.
    assert (await client.get("/api/v1/quota/summary", headers=headers)).json()["total_used_bytes"] == 100
    assert (await client.delete(f"/api/v1/files/{file_id}", headers=headers)).status_code == 404

    monkeypatch.setattr(worker_tasks, "worker_session", client.test_session_factory)
    assert await worker_tasks._cleanup() == 1
    assert not _object_path(file_id).exists()
    assert (await _record(client, file_id)).status == "deleted"
    assert (await client.get("/api/v1/quota/summary", headers=headers)).json()["total_used_bytes"] == 0
    async with client.test_session_factory() as db:
        quota = await db.scalar(select(Quota).where(Quota.user_id == (await _record(client, file_id)).user_id))
        assert quota.used_bytes == 0


@pytest.mark.asyncio
async def test_delete_success_commits_deleted(client):
    headers, connection_id = await _setup(client, "delete-ok@example.com")
    file_id = await _upload(client, headers, b"z" * 10)
    assert (await client.delete(f"/api/v1/files/{file_id}", headers=headers)).status_code == 204
    assert not _object_path(file_id).exists()
    assert (await _record(client, file_id)).status == "deleted"
    assert (await client.get("/api/v1/quota/summary", headers=headers)).json()["total_used_bytes"] == 0
    assert (await client.delete(f"/api/v1/connections/{connection_id}", headers=headers)).status_code == 204


@pytest.mark.asyncio
async def test_quota_summary_derives_usage_from_files(client):
    headers, _ = await _setup(client, "derived@example.com")
    file_id = await _upload(client, headers, b"q" * 120)
    user_id = (await _record(client, file_id)).user_id
    async with client.test_session_factory() as db:
        quota = await db.scalar(select(Quota).where(Quota.user_id == user_id))
        quota.used_bytes = 999
        await db.commit()
    await invalidate_quota(user_id)
    summary = (await client.get("/api/v1/quota/summary", headers=headers)).json()
    assert summary["total_used_bytes"] == 120


@pytest.mark.asyncio
async def test_disconnect_blocked_while_file_deleting(client, monkeypatch):
    headers, connection_id = await _setup(client, "disconnect-deleting@example.com")
    file_id = await _upload(client, headers, b"d" * 30)
    _failing_once(monkeypatch)
    assert (await client.delete(f"/api/v1/files/{file_id}", headers=headers)).status_code == 502
    assert (await _record(client, file_id)).status == "deleting"
    assert (await client.delete(f"/api/v1/connections/{connection_id}", headers=headers)).status_code == 409
    response = await client.post("/api/v1/auth/delete-account", headers=headers, json={"password": "SecurePassword123!"})
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_confirm_after_concurrent_cancel_conflicts(client, monkeypatch):
    headers, _ = await _setup(client, "confirm-race@example.com")
    file_id = await _upload(client, headers, b"c" * 48, confirm=False)
    original = LocalProvider.exists

    async def cancel_then_exists(self, connection, credentials, object_key, file_id_):
        # The user cancels while confirm is talking to the provider.
        assert (await client.post(f"/api/v1/files/cancel-upload/{file_id}", headers=headers)).status_code == 204
        return await original(self, connection, credentials, object_key, file_id_)

    monkeypatch.setattr(LocalProvider, "exists", cancel_then_exists)
    response = await client.post(f"/api/v1/files/confirm-upload/{file_id}", headers=headers)
    assert response.status_code == 409
    assert response.json()["error"]["message"] == "Upload is no longer pending"
    assert (await _record(client, file_id)).status == "cleanup_pending"
    assert (await client.get("/api/v1/quota/summary", headers=headers)).json()["total_used_bytes"] == 0
