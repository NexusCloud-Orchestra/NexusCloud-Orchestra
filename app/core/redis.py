import asyncio
import weakref

from redis.asyncio import Redis

from app.core.config import settings

# One client per running event loop: Celery tasks call asyncio.run (a new loop each time),
# and an asyncio Redis client's connections are bound to the loop that created them.
_clients: "weakref.WeakKeyDictionary[asyncio.AbstractEventLoop, Redis]" = weakref.WeakKeyDictionary()


def get_redis() -> Redis:
    loop = asyncio.get_running_loop()  # RuntimeError when no loop is running
    client = _clients.get(loop)
    if client is None:
        client = Redis.from_url(settings.REDIS_URL, socket_connect_timeout=0.2, socket_timeout=0.2)
        _clients[loop] = client
    return client


async def close_redis() -> None:
    """Close this loop's client; its connections pin the loop, so the weak cache entry alone never dies."""
    client = _clients.pop(asyncio.get_running_loop(), None)
    if client is not None:
        await client.aclose()
