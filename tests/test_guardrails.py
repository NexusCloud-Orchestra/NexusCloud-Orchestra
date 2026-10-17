import asyncio

import pytest
from httpx import ASGITransport, AsyncClient

import app.core.redis as redis_module
from app.main import app

LOGIN = {"email": "nobody@example.com", "password": "WrongPassword123!"}


def peer_client(peer):
    return AsyncClient(transport=ASGITransport(app=app, client=(peer, 1234)), base_url="http://testserver")


async def login_statuses(http, forwarded):
    return [(await http.post("/api/v1/auth/login", json=LOGIN, headers={"X-Forwarded-For": f})).status_code for f in forwarded]


@pytest.mark.asyncio
async def test_forwarded_ip_from_trusted_proxy_gets_separate_budget(client):
    async with peer_client("127.0.0.1") as http:
        assert 429 not in await login_statuses(http, ["203.0.113.1"] * 10)
        assert await login_statuses(http, ["203.0.113.1"]) == [429]
        assert await login_statuses(http, ["203.0.113.2"]) != [429]


@pytest.mark.asyncio
async def test_untrusted_forwarded_header_is_ignored(client):
    async with peer_client("198.51.100.7") as http:
        statuses = await login_statuses(http, [f"203.0.113.{i}" for i in range(1, 12)])
    assert 429 not in statuses[:10]
    assert statuses[10] == 429


@pytest.mark.asyncio
async def test_refresh_is_not_ip_rate_limited(client):
    from tests.conftest import signup
    await signup(client, "refresh-limit@example.com")
    for _ in range(15):
        response = await client.post("/api/v1/auth/refresh", headers={"X-NC-CSRF": "1"})
        assert response.status_code != 429


def test_get_redis_reuses_client_within_a_loop():
    async def two():
        return redis_module.get_redis(), redis_module.get_redis()

    a, b = asyncio.run(two())
    assert a is b
    c, _ = asyncio.run(two())
    assert c is not a


def test_get_redis_requires_running_loop():
    with pytest.raises(RuntimeError):
        redis_module.get_redis()
