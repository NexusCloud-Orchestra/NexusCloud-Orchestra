from datetime import timedelta

import pytest
from sqlalchemy import select, update

from app.core.config import Settings
from app.db.models import AuditLog, RefreshSession, User
from tests.conftest import signup

CSRF = {"X-NC-CSRF": "1"}


def refresh_cookie(response) -> str:
    for header in response.headers.get_list("set-cookie"):
        if header.startswith("nc_refresh="):
            return header
    raise AssertionError(f"no nc_refresh cookie in {response.headers.get_list('set-cookie')}")


def cookie_value(response) -> str:
    return refresh_cookie(response).split(";", 1)[0].split("=", 1)[1]


async def replay(client, token):
    # An explicit Cookie header overrides the jar, so this sends exactly `token`.
    return await client.post("/api/v1/auth/refresh", headers={**CSRF, "Cookie": f"nc_refresh={token}"})


async def test_login_sets_httponly_cookie_and_hides_refresh_token(client):
    await client.post("/api/v1/auth/register", json={
        "first_name": "Test", "last_name": "User", "email": "c@example.com", "password": "SecurePassword123!"
    })
    response = await client.post("/api/v1/auth/login", json={"email": "c@example.com", "password": "SecurePassword123!"})
    body = response.json()
    assert "refresh_token" not in body and body["expires_in"] == 900 and body["token_type"] == "bearer"
    cookie = refresh_cookie(response)
    for attribute in ("nc_refresh=", "HttpOnly", "SameSite=strict", "Path=/api/v1/auth"):
        assert attribute in cookie, cookie
    assert "Secure" not in cookie


async def test_refresh_requires_csrf_header(client):
    await signup(client, "csrf@example.com")
    missing = await client.post("/api/v1/auth/refresh")
    assert missing.status_code == 403
    assert missing.json()["error"]["code"] == "csrf_required"
    response = await client.post("/api/v1/auth/refresh", headers=CSRF)
    assert response.status_code == 200, response.text
    assert "refresh_token" not in response.json()


async def test_refresh_without_cookie_is_unauthorized(client):
    assert (await client.post("/api/v1/auth/refresh", headers=CSRF)).status_code == 401


async def test_refresh_reuse_within_grace_does_not_revoke_family(client):
    await signup(client, "grace@example.com")
    old = client.cookies.get("nc_refresh")
    rotated = await client.post("/api/v1/auth/refresh", headers=CSRF)
    assert rotated.status_code == 200
    new = cookie_value(rotated)
    assert new != old
    assert (await replay(client, old)).status_code == 401
    assert (await replay(client, new)).status_code == 200
    me = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {rotated.json()['access_token']}"})
    assert me.status_code == 200


async def test_refresh_reuse_after_grace_revokes_family(client):
    await signup(client, "reuse@example.com")
    old = client.cookies.get("nc_refresh")
    rotated = await client.post("/api/v1/auth/refresh", headers=CSRF)
    assert rotated.status_code == 200
    new = cookie_value(rotated)
    async with client.test_session_factory() as db:
        session = await db.scalar(select(RefreshSession).where(RefreshSession.revoked_reason == "rotated"))
        await db.execute(update(RefreshSession).where(RefreshSession.id == session.id).values(
            revoked_at=session.revoked_at - timedelta(seconds=31)
        ))
        await db.commit()
    assert (await replay(client, old)).status_code == 401
    assert (await replay(client, new)).status_code == 401
    # Outstanding access tokens die with the family.
    me = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {rotated.json()['access_token']}"})
    assert me.status_code == 401
    async with client.test_session_factory() as db:
        assert await db.scalar(select(AuditLog.id).where(AuditLog.action == "SESSION_REUSE_DETECTED"))
        reasons = set((await db.scalars(select(RefreshSession.revoked_reason))).all())
        assert reasons == {"rotated", "reuse"}


async def test_replaying_dead_family_token_does_not_log_out_new_sessions(client):
    await signup(client, "dead@example.com")
    old = client.cookies.get("nc_refresh")
    assert (await client.post("/api/v1/auth/refresh", headers=CSRF)).status_code == 200
    async with client.test_session_factory() as db:
        session = await db.scalar(select(RefreshSession).where(RefreshSession.revoked_reason == "rotated"))
        await db.execute(update(RefreshSession).where(RefreshSession.id == session.id).values(
            revoked_at=session.revoked_at - timedelta(seconds=31)
        ))
        await db.commit()
    assert (await replay(client, old)).status_code == 401  # first detection kills the family
    login = await client.post("/api/v1/auth/login", json={"email": "dead@example.com", "password": "SecurePassword123!"})
    assert login.status_code == 200
    second_family = cookie_value(login)
    async with client.test_session_factory() as db:
        version = await db.scalar(select(User.token_version).where(User.email == "dead@example.com"))
    assert (await replay(client, old)).status_code == 401  # the family is already dead
    async with client.test_session_factory() as db:
        assert await db.scalar(select(User.token_version).where(User.email == "dead@example.com")) == version
        audits = (await db.scalars(select(AuditLog.id).where(AuditLog.action == "SESSION_REUSE_DETECTED"))).all()
        assert len(audits) == 1  # only the replay that killed a live family is audited
    me = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {login.json()['access_token']}"})
    assert me.status_code == 200
    assert (await replay(client, second_family)).status_code == 200


async def test_login_starts_a_new_family(client):
    await signup(client, "family@example.com")
    await client.post("/api/v1/auth/login", json={"email": "family@example.com", "password": "SecurePassword123!"})
    async with client.test_session_factory() as db:
        families = (await db.scalars(select(RefreshSession.family_id))).all()
        assert len(families) == 2 and len(set(families)) == 2


async def test_logout_clears_cookie(client):
    tokens = await signup(client, "logout@example.com")
    token = client.cookies.get("nc_refresh")
    response = await client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {tokens['access_token']}"})
    assert response.status_code == 204
    cookie = refresh_cookie(response)
    assert "Max-Age=0" in cookie and "Path=/api/v1/auth" in cookie
    assert (await client.post("/api/v1/auth/refresh", headers=CSRF)).status_code == 401
    assert (await replay(client, token)).status_code == 401
    async with client.test_session_factory() as db:
        assert (await db.scalars(select(RefreshSession.revoked_reason))).all() == ["logout"]


async def test_change_password_revokes_with_reason_and_clears_cookie(client):
    tokens = await signup(client, "pw@example.com")
    token = client.cookies.get("nc_refresh")
    response = await client.post("/api/v1/auth/change-password", headers={"Authorization": f"Bearer {tokens['access_token']}"}, json={
        "current_password": "SecurePassword123!", "new_password": "AnotherPassword456!"
    })
    assert response.status_code == 200, response.text
    assert "Max-Age=0" in refresh_cookie(response)
    assert (await replay(client, token)).status_code == 401
    async with client.test_session_factory() as db:
        assert (await db.scalars(select(RefreshSession.revoked_reason))).all() == ["password"]


def test_cookie_secure_defaults_by_environment():
    assert Settings(SECRET_KEY="x" * 40, ENCRYPTION_KEY="y" * 40).cookie_secure is False
    assert Settings(ENVIRONMENT="production", SECRET_KEY="x" * 40, ENCRYPTION_KEY="y" * 40).cookie_secure is True
    assert Settings(COOKIE_SECURE=True, SECRET_KEY="x" * 40, ENCRYPTION_KEY="y" * 40).cookie_secure is True


def test_production_rejects_insecure_cookie():
    unsafe = Settings(
        ENVIRONMENT="production", COOKIE_SECURE=False, SECRET_KEY="x" * 40, ENCRYPTION_KEY="y" * 40,
        PUBLIC_API_URL="https://api.example.com", FRONTEND_URL="https://app.example.com",
        CORS_ORIGINS="https://app.example.com", SMTP_HOST="smtp.example.com", SMTP_FROM="no-reply@example.com",
        LOCAL_STORAGE_ENABLED=False,
    )
    with pytest.raises(ValueError, match="COOKIE_SECURE"):
        unsafe.assert_safe()
