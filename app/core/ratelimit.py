import asyncio
import time
from collections import defaultdict

from fastapi import HTTPException
from app.core import redis as shared_redis


class RateLimiter:
    def __init__(self):
        self._entries: dict[str, tuple[int, float]] = {}
        self._lock = asyncio.Lock()

    async def check(self, key: str, limit: int, window: int = 60):
        try:
            client = shared_redis.get_redis()
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
        if count > limit:
            raise HTTPException(429, "Too many requests. Try again shortly.")


limiter = RateLimiter()
