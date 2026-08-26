"""
Redis client configuration for the Quota Engine.

This module is the single source of truth for the Redis connection.
It loads REDIS_URL from the environment, constructs a redis-py client,
and exposes a lightweight connectivity check helper.

Business logic (cache reads/writes) lives in quota_engine.py — not here.
"""

import os
import logging

import redis
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Connection configuration
# ---------------------------------------------------------------------------
# Read from .env. Falls back to the standard local default so the app
# remains startable without Redis configured, though caching will be skipped.
REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# ---------------------------------------------------------------------------
# Redis client singleton
# ---------------------------------------------------------------------------
# decode_responses=True means Redis values come back as Python str objects
# instead of raw bytes — consistent with how we serialise JSON strings.
redis_client: redis.Redis = redis.Redis.from_url(
    REDIS_URL,
    decode_responses=True,
)


# ---------------------------------------------------------------------------
# Connectivity test helper
# ---------------------------------------------------------------------------

def ping_redis() -> bool:
    """
    Send a PING to Redis and return True if it responds.

    This is a *best-effort* check intended for development diagnostics and
    optional health-check endpoints.  It will NOT raise an unhandled
    exception — callers receive False when Redis is unreachable so that the
    rest of the application can continue without caching.

    Usage:
        from app.services.redis_client import ping_redis
        if ping_redis():
            print("Redis is reachable")
    """
    try:
        response = redis_client.ping()
        if response:
            logger.info("[Redis] PING -> PONG  Connected to %s", REDIS_URL)
        return bool(response)
    except redis.exceptions.ConnectionError as exc:
        logger.warning("[Redis] PING failed -- Redis unavailable: %s", exc)
        return False
    except Exception as exc:  # pragma: no cover
        logger.warning("[Redis] Unexpected error during PING: %s", exc)
        return False
