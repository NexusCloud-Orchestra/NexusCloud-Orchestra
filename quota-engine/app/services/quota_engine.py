"""
Quota Engine — Redis cache-aside layer for the Quota Engine service.

Architecture
------------
This module sits between the HTTP router and the database, providing a
cache-aside read pattern backed by Redis.

Two cache key schemes are used:

  1. ``quota:{user_id}``  (used by get_cached_quota)
     ─────────────────────────────────────────────
     Key used by the public summary route
     (GET /quota/{user_id}/summary).  The user_id is the application-level
     identifier passed in the URL, making the cache key predictable without
     a database round-trip.

     Cache value:
         {
             "user_id": <int>,
             "total_storage": <int>,
             "used_bytes": <int>,
             "free_bytes": <int>,
             "usage_percentage": <float>,
             "polled_at": <ISO-8601 string>
         }

  2. ``quota:{connection_id}``  (used by poll_connection / poll_all_user_connections)
     ──────────────────────────────────────────────────────────────────────────────
     Legacy key used by internal polling helpers.  connection_id is the
     integer primary-key of the Quota row.

TTL              : 900 seconds (15 minutes) for both schemes.

Cache-aside flow (get_cached_quota)
-----------------------------------
  Request
    |
    v
  Redis GET quota:{user_id}
    |
    +-- HIT  ─────────────────────────────────────→ return cached dict
    |
    +-- MISS
          |
          v
        quota_service.get_quota_summary(db, user_id)
          |
          v
        Build cache payload
          |
          v
        Redis SETEX quota:{user_id} 900 <json>
          |
          v
        return fresh dict

Design decisions
----------------
* Redis errors are caught and logged — they never propagate to the caller.
  A Redis outage degrades gracefully to a cache miss (DB is always the
  source of truth).
* Corrupt or undecodable JSON in Redis is treated as a cache miss rather
  than crashing the API.  The bad key is discarded and the DB is queried.
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

    Cache key: ``quota:{connection_id}``  (uses the Quota row PK)

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
    user_id: int,
    redis: Any,
    db: AsyncSession,
) -> dict[str, Any] | None:
    """
    Cache-aside read for a user's quota summary.

    This is the primary caching entry-point used by the summary route
    (GET /quota/{user_id}/summary).  It uses ``quota:{user_id}`` as the
    Redis key so that cache lookups need no prior DB round-trip.

    Flow
    ----
    1. Check Redis for ``quota:{user_id}``.
    2. CACHE HIT  → deserialise the cached JSON and return immediately.
       Logs: ``[Cache] CACHE HIT  quota:{user_id}``
    3. CACHE MISS → call quota_service.get_quota_summary(), build the
                    cache payload, store it with a 900-second TTL, and
                    return the fresh payload.
       Logs: ``[Cache] CACHE MISS quota:{user_id} — querying database``
             ``[Cache] WRITE quota:{user_id} (TTL=900s)``

    If the cached value exists but cannot be decoded as JSON (corrupt data),
    it is treated as a CACHE MISS rather than crashing the API.  The bad
    key is over-written with fresh data on the next write.

    Args:
        user_id:  The user whose quota is being queried.  Also used as
                  the Redis cache key suffix (``quota:{user_id}``).
        redis:    A redis-py (or compatible) client instance injected
                  via FastAPI's Depends mechanism.
        db:       An active async SQLAlchemy session.

    Returns:
        dict containing quota summary fields on success::

            {
                "user_id": int,
                "total_storage": int,
                "used_bytes": int,
                "free_bytes": int,
                "usage_percentage": float,
                "polled_at": str   # ISO-8601 UTC timestamp
            }

        None if no quota record exists for the user.
    """
    key = _cache_key(user_id)   # → "quota:{user_id}"

    # ------------------------------------------------------------------
    # Step 1: Try Redis first.
    # ------------------------------------------------------------------
    raw: str | None = None
    try:
        raw = redis.get(key)
    except Exception as redis_exc:
        logger.warning("[Redis] GET %s failed: %s", key, redis_exc)

    if raw is not None:
        try:
            cached = json.loads(raw)
            logger.info("[Cache] CACHE HIT  %s", key)
            return cached
        except (json.JSONDecodeError, TypeError, ValueError) as decode_exc:
            # Corrupt cache entry — treat as a miss rather than crashing.
            logger.warning(
                "[Cache] CACHE HIT %s — JSON decode failed (%s); treating as CACHE MISS",
                key,
                decode_exc,
            )
            # Fall through to DB query; the key will be overwritten below.

    logger.info("[Cache] CACHE MISS %s — querying database", key)

    # ------------------------------------------------------------------
    # Step 2: Database fallback — delegate to the existing service.
    # ------------------------------------------------------------------
    summary = await quota_service.get_quota_summary(db, user_id)
    if summary is None:
        # No quota exists for this user — nothing to cache.
        return None

    # ------------------------------------------------------------------
    # Step 3: Build the cache payload.
    # Includes all QuotaSummary fields plus polled_at so callers receive
    # the full picture without an extra DB query.
    # ------------------------------------------------------------------
    payload: dict[str, Any] = {
        "user_id": summary.user_id,
        "total_storage": summary.total_storage,
        "used_bytes": summary.used_storage,
        "free_bytes": summary.remaining_storage,
        "usage_percentage": summary.usage_percentage,
        "polled_at": datetime.now(timezone.utc).isoformat(),
    }

    # ------------------------------------------------------------------
    # Step 4: Write to Redis with a 900-second TTL.
    # ------------------------------------------------------------------
    try:
        redis.setex(key, CACHE_TTL, json.dumps(payload))
        logger.info("[Cache] WRITE %s (TTL=%ds)", key, CACHE_TTL)
    except Exception as write_exc:
        logger.warning("[Redis] SETEX %s failed: %s", key, write_exc)

    return payload


async def _get_cached_quota_by_connection_id(
    connection_id: int,
    user_id: int,
    db: AsyncSession,
) -> dict[str, Any] | None:
    """
    Internal cache-aside helper that uses ``quota:{connection_id}`` as the key.

    This is the original implementation preserved for use by
    ``poll_all_user_connections``.  New callers should prefer
    ``get_cached_quota`` (which keys on ``quota:{user_id}``).
    """
    key = _cache_key(connection_id)

    # --- Step 1: cache read ---
    cached = _safe_redis_get(key)
    if cached is not None:
        logger.info("[Cache] CACHE HIT  %s", key)
        return cached

    logger.info("[Cache] CACHE MISS %s — querying database", key)

    # --- Step 2: database fallback using existing quota_service ---
    summary = await quota_service.get_quota_summary(db, user_id)
    if summary is None:
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

    cached = await _get_cached_quota_by_connection_id(connection_id, user_id, db)
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
