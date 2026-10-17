import base64
import uuid
from types import SimpleNamespace

import pytest

from app.services import providers
from app.services.client_cache import ClientCache, client_key, provider_clients
from app.services.providers import AzureProvider, S3Provider


@pytest.fixture(autouse=True)
def _reset_clients():
    provider_clients.clear()
    yield
    provider_clients.clear()


def test_client_cache_reuses_until_ttl():
    now = [0.0]
    cache = ClientCache(ttl_seconds=300.0, clock=lambda: now[0])
    first = cache.get_or_create(("k",), object)
    now[0] = 299
    assert cache.get_or_create(("k",), object) is first
    now[0] = 301
    assert cache.get_or_create(("k",), object) is not first


def test_client_cache_evicts_lru():
    cache = ClientCache(maxsize=2)
    a = cache.get_or_create(("a",), object)
    b = cache.get_or_create(("b",), object)
    assert cache.get_or_create(("a",), object) is a
    cache.get_or_create(("c",), object)
    assert cache.get_or_create(("a",), object) is a
    assert cache.get_or_create(("b",), object) is not b


def test_client_cache_keys_on_credentials():
    connection = SimpleNamespace(id=uuid.uuid4())
    one = client_key("S3Provider", connection, {"secret": "one"})
    two = client_key("S3Provider", connection, {"secret": "two"})
    assert one != two
    assert "one" not in repr(one)
    cache = ClientCache()
    assert cache.get_or_create(one, object) is not cache.get_or_create(two, object)


@pytest.mark.asyncio
async def test_s3_client_reused_across_calls(monkeypatch):
    calls = []
    real = providers.boto3.client
    monkeypatch.setattr(providers.boto3, "client", lambda *a, **k: calls.append(1) or real(*a, **k))
    connection = SimpleNamespace(id=uuid.uuid4(), bucket_name="b", region="us-east-1")
    creds = {"aws_access_key_id": "k", "aws_secret_access_key": "s"}
    provider = S3Provider()
    await provider.upload_url(connection, creds, "x/y", "text/plain", uuid.uuid4())
    await provider.download_url(connection, creds, "x/y", uuid.uuid4())
    assert len(calls) == 1


@pytest.mark.asyncio
async def test_signing_runs_off_event_loop(monkeypatch):
    import threading
    main = threading.get_ident()
    seen = []
    real = providers.generate_blob_sas
    monkeypatch.setattr(providers, "generate_blob_sas", lambda **k: seen.append(threading.get_ident()) or real(**k))
    creds = {"account_name": "testaccount", "account_key": base64.b64encode(b"x" * 32).decode()}
    await AzureProvider().download_url(SimpleNamespace(bucket_name="c"), creds, "k", uuid.uuid4())
    assert seen and seen[0] != main


@pytest.mark.asyncio
async def test_client_construction_runs_off_event_loop(monkeypatch):
    import threading
    main = threading.get_ident()
    seen = []
    real = providers.boto3.client
    monkeypatch.setattr(providers.boto3, "client", lambda *a, **k: seen.append(threading.get_ident()) or real(*a, **k))
    connection = SimpleNamespace(id=uuid.uuid4(), bucket_name="b", region="us-east-1")
    await S3Provider().client(connection, {"aws_access_key_id": "k", "aws_secret_access_key": "s"})
    assert seen and seen[0] != main
