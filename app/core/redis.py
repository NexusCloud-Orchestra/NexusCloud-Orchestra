import logging
import redis.asyncio as aioredis
from app.core.config import settings

logger = logging.getLogger(__name__)

# Fallback in-memory store
_memory_store = {}


class RedisClient:
    def __init__(self):
        try:
            self.client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        except Exception as e:
            logger.warning(f"Failed to initialize Redis client: {e}. Using in-memory fallback.")
            self.client = None

    async def get(self, key: str) -> str | None:
        if self.client:
            try:
                return await self.client.get(key)
            except Exception as e:
                logger.error(f"Redis get error: {e}")
        return _memory_store.get(key)

    async def set(self, key: str, value: str, ex: int | None = None) -> None:
        if self.client:
            try:
                await self.client.set(key, value, ex=ex)
                return
            except Exception as e:
                logger.error(f"Redis set error: {e}")
        _memory_store[key] = value

    async def delete(self, key: str) -> None:
        if self.client:
            try:
                await self.client.delete(key)
                return
            except Exception as e:
                logger.error(f"Redis delete error: {e}")
        _memory_store.pop(key, None)


redis_client = RedisClient()
