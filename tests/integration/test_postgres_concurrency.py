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
