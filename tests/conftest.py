import os

os.environ["SECRET_KEY"] = "test-access-secret-0123456789abcdef0123456789"
os.environ["ENCRYPTION_KEY"] = "test-encryption-secret-0123456789abcdef"

import fakeredis.aioredis
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import settings
from app.db.base import Base
from app.db.session import get_db
from app.main import app
import app.main as main_module
import app.core.redis as redis_module

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL")

AWS_CONNECTION = {
    "provider": "aws", "display_name": "Test AWS", "bucket_name": "test-bucket", "region": "us-east-1",
    "credentials": {"aws_access_key_id": "test", "aws_secret_access_key": "secret"}
}


def _assert_disposable_database(url: str) -> None:
    """drop_all wipes every table: only run it on a test database or the local/CI container default."""
    parsed = make_url(url)
    database = parsed.database or ""
    if "test" in database or (database == "postgres" and parsed.host in ("localhost", "127.0.0.1")):
        return
    pytest.exit(
        f"Refusing to drop tables on non-test database {parsed.render_as_string(hide_password=True)}; "
        "use a database whose name contains 'test' or the local postgres container"
    )


def pytest_sessionstart(session):
    # Checked before any test runs: the client fixture drops all tables on TEST_DATABASE_URL.
    if TEST_DATABASE_URL:
        _assert_disposable_database(TEST_DATABASE_URL)


def pytest_collection_modifyitems(config, items):
    if TEST_DATABASE_URL:
        return
    skip = pytest.mark.skip(reason="TEST_DATABASE_URL not set")
    for item in items:
        if "postgres" in item.keywords:
            item.add_marker(skip)


@pytest_asyncio.fixture
async def client(tmp_path, monkeypatch):
    redis_server = fakeredis.FakeServer()
    monkeypatch.setattr(redis_module, "get_redis", lambda: fakeredis.aioredis.FakeRedis(server=redis_server))
    engine = create_async_engine(TEST_DATABASE_URL or f"sqlite+aiosqlite:///{tmp_path / 'test.db'}")
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as conn:
        if TEST_DATABASE_URL:
            await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async def override_db():
        async with factory() as db:
            yield db

    app.dependency_overrides[get_db] = override_db
    monkeypatch.setattr(main_module, "SessionLocal", factory)
    monkeypatch.setattr(settings, "LOCAL_STORAGE_ENABLED", True)
    monkeypatch.setattr(settings, "LOCAL_STORAGE_PATH", str(tmp_path / "storage"))
    monkeypatch.setattr(settings, "PUBLIC_API_URL", "http://testserver")
    # The test client talks plain http://testserver; a Secure cookie would never be sent back.
    monkeypatch.setattr(settings, "COOKIE_SECURE", False)
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


async def enable_striping(client, headers):
    response = await client.patch("/api/v1/auth/preferences", headers=headers, json={"striping_enabled": True})
    assert response.status_code == 200, response.text
