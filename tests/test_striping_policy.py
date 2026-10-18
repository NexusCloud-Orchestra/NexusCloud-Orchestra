import hashlib
import uuid
from types import SimpleNamespace

import pytest
from sqlalchemy import select

from app.db.models import AuditLog
from app.services.striping import CHUNK_BYTES, place_chunks
from tests.conftest import enable_striping, signup
from tests.test_backend import connect

STRIPE_BODY = {
    "original_name": "big.bin", "size_bytes": CHUNK_BYTES + 1, "mime_type": "application/octet-stream",
    "chunks": [
        {"size_bytes": CHUNK_BYTES, "sha256": hashlib.sha256(b"a").hexdigest()},
        {"size_bytes": 1, "sha256": hashlib.sha256(b"b").hexdigest()},
    ],
}


async def _user(client, email):
    tokens = await signup(client, email)
    return {"Authorization": f"Bearer {tokens['access_token']}"}


@pytest.mark.asyncio
async def test_striping_disabled_by_default(client):
    headers = await _user(client, "stripe-off@example.com")
    await connect(client, headers, "r2", "R2")
    await connect(client, headers, "b2", "B2")
    assert (await client.get("/api/v1/auth/me", headers=headers)).json()["striping_enabled"] is False
    response = await client.post("/api/v1/files/striped-upload-request", headers=headers, json=STRIPE_BODY)
    assert response.status_code == 403
    assert response.json()["error"]["message"] == "Striping is disabled. Enable it in Settings to split large files across clouds."


@pytest.mark.asyncio
async def test_preferences_enable_striping(client):
    headers = await _user(client, "stripe-pref@example.com")
    response = await client.patch("/api/v1/auth/preferences", headers=headers, json={"striping_enabled": True})
    assert response.status_code == 200, response.text
    assert response.json()["striping_enabled"] is True
    assert (await client.get("/api/v1/auth/me", headers=headers)).json()["striping_enabled"] is True
    async with client.test_session_factory() as db:
        actions = (await db.scalars(select(AuditLog.action))).all()
    assert "PREFERENCES_UPDATE" in actions


@pytest.mark.asyncio
async def test_striping_ignores_temporary_free_tiers(client):
    headers = await _user(client, "stripe-temp@example.com")
    await enable_striping(client, headers)
    await connect(client, headers, "aws", "S3")
    await connect(client, headers, "azure", "Azure")
    response = await client.post("/api/v1/files/striped-upload-request", headers=headers, json=STRIPE_BODY)
    assert response.status_code == 400
    assert response.json()["error"]["message"] == "Striping needs two permanent-tier providers (R2, B2, GCS, Oracle, IBM)"


def test_place_chunks_never_uses_non_permanent_connections():
    connections = [SimpleNamespace(provider=name, id=uuid.uuid4()) for name in ("r2", "b2", "aws")]
    chosen = place_chunks(connections, {}, [CHUNK_BYTES] * 6)
    assert chosen is not None
    assert {connection.provider for connection in chosen} == {"r2", "b2"}
