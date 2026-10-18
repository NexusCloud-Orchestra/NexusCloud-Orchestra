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


@pytest.mark.asyncio
async def test_password_hashing_does_not_block_event_loop(client, monkeypatch):
    import time

    import app.core.security as security
    from tests.conftest import signup
    await signup(client, "loop-probe@example.com")
    monkeypatch.setattr(security.bcrypt, "checkpw", lambda *a: time.sleep(0.5) or False)
    login = asyncio.create_task(client.post("/api/v1/auth/login", json={"email": "loop-probe@example.com", "password": "SecurePassword123!"}))
    started = time.perf_counter()
    await asyncio.sleep(0.05)
    assert (await client.get("/")).status_code == 200
    assert time.perf_counter() - started < 0.2
    assert not login.done()
    assert (await login).status_code == 401


@pytest.mark.asyncio
async def test_unknown_email_still_runs_password_check(client, monkeypatch):
    import app.api.v1.routes.auth as auth_routes
    calls = []
    real = auth_routes.verify_password_async

    async def spy(password, digest):
        calls.append(digest)
        return await real(password, digest)

    monkeypatch.setattr(auth_routes, "verify_password_async", spy)
    response = await client.post("/api/v1/auth/login", json=LOGIN)
    assert response.status_code == 401
    assert calls == [auth_routes.DUMMY_PASSWORD_HASH]


@pytest.mark.asyncio
async def test_livez_ok_when_database_down(client, monkeypatch):
    import app.main as main_module

    def broken():
        raise RuntimeError("db down")

    monkeypatch.setattr(main_module, "SessionLocal", broken)
    assert (await client.get("/livez")).json() == {"status": "ok"}
    for path in ("/readyz", "/health"):
        response = await client.get(path)
        assert response.status_code == 503
        assert response.json()["error"]["message"] == "Dependency unavailable"


@pytest.mark.asyncio
async def test_readyz_ok_and_redis_down(client, monkeypatch):
    assert (await client.get("/readyz")).json() == {"status": "ok"}
    assert (await client.get("/health")).status_code == 200
    assert (await client.get("/redis-health")).status_code == 404

    class BrokenRedis:
        async def ping(self):
            raise ConnectionError("redis down")

    monkeypatch.setattr(redis_module, "get_redis", lambda: BrokenRedis())
    assert (await client.get("/readyz")).status_code == 503
    assert (await client.get("/livez")).status_code == 200


def test_init_sentry_noop_without_dsn(monkeypatch):
    from app.core.config import settings
    from app.core.observability import init_sentry

    monkeypatch.setattr(settings, "SENTRY_DSN", "")
    assert init_sentry("api") is False


def test_init_sentry_disables_locals_and_bodies(monkeypatch):
    import sentry_sdk

    from app.core.config import settings
    from app.core.observability import init_sentry

    captured = {}
    monkeypatch.setattr(sentry_sdk, "init", lambda **kwargs: captured.update(kwargs))
    monkeypatch.setattr(sentry_sdk, "set_tag", lambda *args: None)
    monkeypatch.setattr(settings, "SENTRY_DSN", "https://public@sentry.example.com/1")
    assert init_sentry("api") is True
    assert captured["include_local_variables"] is False
    assert captured["max_request_body_size"] == "never"
    assert captured["send_default_pii"] is False


def test_scrub_event_removes_secrets():
    from app.core.observability import scrub_event

    event = {
        "request": {
            "cookies": {"nc_refresh": "abc"},
            "query_string": "sig=secret",
            "headers": {"Authorization": "Bearer x", "cookie": "nc_refresh=abc", "X-NC-CSRF": "t", "Accept": "*/*"},
        },
        "breadcrumbs": [{"message": "GET https://b.example/o?X-Amz-Signature=deadbeef"}],
        "extra": {"note": "cookie nc_refresh=abc", "ok": "fine"},
    }
    scrubbed = scrub_event(event, {})
    assert "cookies" not in scrubbed["request"]
    assert "query_string" not in scrubbed["request"]
    assert scrubbed["request"]["headers"] == {"Accept": "*/*"}
    assert scrubbed["breadcrumbs"][0]["message"] == "[scrubbed]"
    assert scrubbed["extra"] == {"note": "[scrubbed]", "ok": "fine"}
