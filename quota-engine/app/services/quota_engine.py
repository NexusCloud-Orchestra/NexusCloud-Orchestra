"""
Quota Engine — Redis cache-aside layer for the Quota Engine service.

Architecture
------------
This module sits between the HTTP router and the database, providing a
cache-aside read pattern backed by Redis.

Cache key format : quota:{connection_id}
                   where connection_id is the integer primary-key of the
                   quota row (used as a stable, human-readable identifier).

Cache value      : JSON string  {"free_bytes": ..., "used_bytes": ...,
                                  "polled_at": ...}

TTL              : 900 seconds (15 minutes)

Cache-aside flow
----------------
  Request
    |
    v
  Redis GET quota:{connection_id}
    |
    +-- HIT  ─────────────────────────────────────→ return cached dict
    |
    +-- MISS
          |
          v
        Existing quota_service.get_quota_summary(db, user_id)
          |
          v
        Build cache payload
          |
          v
        Redis SETEX quota:{connection_id} 900 <json>
          |
          v
        return fresh dict

Design decisions
----------------
* Redis errors are caught and logged — they never propagate to the caller.
  A Redis outage degrades gracefully to a cache miss (DB is always the
  source of truth).
* The connection_id used as the cache key is the database primary-key of
  the quota row, giving us a stable, collision-free identifier.
* No application startup code is changed — imports are safe at module level.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.services import quota_service
from app.services.redis_client import redis_client

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
CACHE_TTL: int = 900          # seconds (15 minutes)
KEY_PREFIX: str = "quota"     # Redis key namespace


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _cache_key(connection_id: int | str) -> str:
    """Build the canonical Redis key for a quota entry."""
    return f"{KEY_PREFIX}:{connection_id}"


def _safe_redis_get(key: str) -> dict[str, Any] | None:
    """
    Retrieve and deserialise a cached quota dict from Redis.

    Returns None on cache miss OR on any Redis / JSON error so that the
    caller always falls back to the database safely.
    """
    try:
        raw = redis_client.get(key)
        if raw is None:
            return None
        return json.loads(raw)
    except Exception as exc:
        logger.warning("[Redis] GET %s failed: %s", key, exc)
        return None


def _safe_redis_setex(key: str, ttl: int, payload: dict[str, Any]) -> None:
    """
    Serialise and store a quota dict in Redis with a TTL.

    Errors are logged but never re-raised so the caller's return path is
    unaffected if Redis is temporarily unavailable.
    """
    try:
        redis_client.setex(key, ttl, json.dumps(payload))
        logger.debug("[Redis] SETEX %s (TTL=%ds)", key, ttl)
    except Exception as exc:
        logger.warning("[Redis] SETEX %s failed: %s", key, exc)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def poll_connection(connection_id: int | str) -> dict[str, Any] | None:
    """
    Return the cached quota entry for *connection_id* if one exists.

    This is a pure cache-read — it performs no database queries and no
    provider calls.  Use it when you only want to inspect what is currently
    in the cache without triggering a refresh.

    Returns:
        dict  if the key exists in Redis, e.g.
              {"free_bytes": 5368709120, "used_bytes": 1073741824,
               "polled_at": "2026-08-26T18:00:00+00:00"}
        None  if the key is absent or Redis is unavailable.
    """
    key = _cache_key(connection_id)
    cached = _safe_redis_get(key)
    if cached is not None:
        logger.debug("[Cache] HIT  %s", key)
    else:
        logger.debug("[Cache] MISS %s", key)
    return cached


async def get_cached_quota(
    connection_id: int,
    user_id: int,
    db: AsyncSession,
) -> dict[str, Any] | None:
    """
    Cache-aside read for a user's quota.

    1. Check Redis for ``quota:{connection_id}``.
    2. On HIT  → return the cached dict immediately.
    3. On MISS → fetch from the database via quota_service, build the
                 cache payload, write it to Redis with a 900-second TTL,
                 and return the fresh dict.

    Args:
        connection_id:  Stable identifier used as the Redis cache key.
                        In the quota-engine context this is the database
                        primary-key of the Quota row.
        user_id:        The user whose quota is being queried.
        db:             An active async SQLAlchemy session.

    Returns:
        dict with keys ``free_bytes``, ``used_bytes``, ``polled_at`` on
        success; None if no quota record exists for the user.
    """
    key = _cache_key(connection_id)

    # --- Step 1: cache read ---
    cached = _safe_redis_get(key)
    if cached is not None:
        logger.info("[Cache] HIT  %s", key)
        return cached

    logger.info("[Cache] MISS %s  — querying database", key)

    # --- Step 2: database fallback using existing quota_service ---
    summary = await quota_service.get_quota_summary(db, user_id)
    if summary is None:
        # No quota exists for this user — nothing to cache.
        return None

    # --- Step 3: build cache payload ---
    payload: dict[str, Any] = {
        "free_bytes": summary.remaining_storage,
        "used_bytes": summary.used_storage,
        "polled_at": datetime.now(timezone.utc).isoformat(),
    }

    # --- Step 4: write to Redis with TTL ---
    _safe_redis_setex(key, CACHE_TTL, payload)
    logger.info("[Cache] WRITE %s (TTL=%ds)", key, CACHE_TTL)

    return payload


async def poll_all_user_connections(
    user_id: int,
    db: AsyncSession,
) -> list[dict[str, Any]]:
    """
    Return quota cache entries for all connections belonging to *user_id*.

    In the quota-engine's simplified data model a user has at most one quota
    row, so this function returns a list with zero or one entry.  The list
    shape keeps the API consistent with the main NexusCloud app's multi-
    connection model where a user can have several cloud connections.

    For each quota found:
    - The cache key uses the database quota row ``id`` as the connection_id.
    - If the entry is already cached it is returned directly (cache HIT).
    - If not cached it is fetched from the DB and stored (cache MISS then
      WRITE).

    Args:
        user_id:  The user whose connections/quotas are being polled.
        db:       An active async SQLAlchemy session.

    Returns:
        A list of quota dicts.  Each dict has the shape:
        {
            "connection_id": <int>,
            "free_bytes": <int>,
            "used_bytes": <int>,
            "polled_at": <ISO-8601 string>,
        }
    """
    # Fetch the single quota row for this user from the DB.
    quota = await quota_service.get_quota(db, user_id)
    if quota is None:
        logger.info("[QuotaEngine] user_id=%d has no quota — skipping poll", user_id)
        return []

    connection_id = quota.id   # quota PK is used as the cache key

    cached = await get_cached_quota(connection_id, user_id, db)
    if cached is None:
        return []

    return [{"connection_id": connection_id, **cached}]


def invalidate_quota_cache(connection_id: int | str) -> bool:
    """
    Explicitly remove a quota entry from the cache.

    Call this after a quota is modified (e.g. PUT /quota/{user_id} or a
    file upload that changes used_storage) so that the next read fetches
    fresh data from the database instead of stale cached values.

    Returns:
        True if the key existed and was deleted; False otherwise.
    """
    key = _cache_key(connection_id)
    try:
        deleted = redis_client.delete(key)
        if deleted:
            logger.info("[Cache] INVALIDATED %s", key)
        return bool(deleted)
    except Exception as exc:
        logger.warning("[Cache] INVALIDATE %s failed: %s", key, exc)
        return False
