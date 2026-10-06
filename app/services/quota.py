import json
import logging
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models import CloudConnection, FileRecord, Quota, User
from app.services.catalog import PLANS, PROVIDERS

logger = logging.getLogger(__name__)


def redis_client():
    from redis.asyncio import Redis
    return Redis.from_url(settings.REDIS_URL, socket_connect_timeout=0.2, socket_timeout=0.2)


async def invalidate_quota(user_id: UUID) -> None:
    client = redis_client()
    try:
        await client.delete(f"quota:{user_id}")
    except Exception:
        logger.warning("Quota cache unavailable")
    finally:
        await client.aclose()


async def quota_summary(db: AsyncSession, user: User) -> dict:
    client = redis_client()
    try:
        cached = await client.get(f"quota:{user.id}")
        if cached:
            return json.loads(cached)
    except Exception:
        logger.warning("Quota cache unavailable")
    finally:
        await client.aclose()
    connections = (await db.scalars(select(CloudConnection).where(CloudConnection.user_id == user.id, CloudConnection.is_active.is_(True)))).all()
    quota = await db.scalar(select(Quota).where(Quota.user_id == user.id))
    usage_rows = (await db.execute(
        select(FileRecord.connection_id, FileRecord.status, func.sum(FileRecord.size_bytes))
        .where(FileRecord.user_id == user.id, FileRecord.status.in_(("active", "pending")))
        .group_by(FileRecord.connection_id, FileRecord.status)
    )).all()
    usage = {(connection_id, status): amount for connection_id, status, amount in usage_rows}
    by_connection = []
    available_total = 0
    provider_limit_total = 0
    reserved_total = 0
    for connection in connections:
        used = usage.get((connection.id, "active"), 0)
        reserved = usage.get((connection.id, "pending"), 0)
        limit = PROVIDERS[connection.provider].free_bytes
        provider_limit_total += limit
        reserved_total += reserved
        free = max(0, limit - used - reserved)
        available_total += free
        by_connection.append({
            "connection_id": str(connection.id), "provider": connection.provider,
            "display_name": connection.display_name, "used_bytes": used,
            "reserved_bytes": reserved, "limit_bytes": limit, "free_bytes": free,
        })
    plan_limit = PLANS[user.plan].max_bytes
    total_limit = min(provider_limit_total, plan_limit) if plan_limit is not None else provider_limit_total
    total_free = min(available_total, max(0, total_limit - quota.used_bytes - reserved_total))
    result = {
        "total_used_bytes": quota.used_bytes, "total_free_bytes": total_free,
        "total_limit_bytes": total_limit, "usage_percentage": round(100 * quota.used_bytes / total_limit, 2) if total_limit else 0,
        "by_connection": by_connection,
    }
    client = redis_client()
    try:
        await client.set(f"quota:{user.id}", json.dumps(result), ex=900)
    except Exception:
        logger.warning("Quota cache unavailable")
    finally:
        await client.aclose()
    return result
