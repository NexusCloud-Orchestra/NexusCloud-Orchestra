import asyncio
import time
from collections import defaultdict

from fastapi import HTTPException
from redis.asyncio import Redis
from app.core.config import settings


class RateLimiter:
    def __init__(self):
        self._entries: dict[str, tuple[int, float]] = {}
        self._lock = asyncio.Lock()

    async def check(self, key: str, limit: int, window: int = 60):
        client = Redis.from_url(settings.REDIS_URL, socket_connect_timeout=0.2, socket_timeout=0.2)
        try:
            count = await client.incr(key)
            if count == 1:
                await client.expire(key, window)
        except Exception:
            async with self._lock:
                count, until = self._entries.get(key, (0, time.monotonic() + window))
                if until <= time.monotonic():
                    count, until = 0, time.monotonic() + window
                count += 1
                self._entries[key] = (count, until)
                if len(self._entries) > 10000:
                    self._entries = {k: v for k, v in self._entries.items() if v[1] > time.monotonic()}
        finally:
            await client.aclose()
        if count > limit:
            raise HTTPException(429, "Too many requests. Try again shortly.")


limiter = RateLimiter()
