import json
import logging
from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models import CloudConnection, FileRecord, Quota, User
from app.schemas import QuotaSummaryOut
from app.services.catalog import PLANS, PROVIDERS

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class QuotaUsage:
    active: dict[UUID, int]
    pending: dict[UUID, int]

    @property
    def total_active(self) -> int:
        return sum(self.active.values())

    @property
    def total_pending(self) -> int:
        return sum(self.pending.values())

    def consumed(self, connection_id: UUID) -> int:
        return self.active.get(connection_id, 0) + self.pending.get(connection_id, 0)


async def quota_usage(db: AsyncSession, user_id: UUID) -> QuotaUsage:
    rows = (await db.execute(
        select(FileRecord.connection_id, FileRecord.status, func.sum(FileRecord.size_bytes))
        .where(FileRecord.user_id == user_id, FileRecord.status.in_(("active", "pending")))
        .group_by(FileRecord.connection_id, FileRecord.status)
    )).all()
    active: dict[UUID, int] = {}
    pending: dict[UUID, int] = {}
    for connection_id, status, amount in rows:
        (active if status == "active" else pending)[connection_id] = amount
    return QuotaUsage(active, pending)


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
            try:
                result = json.loads(cached)
                QuotaSummaryOut.model_validate(result)
                return result
            except (ValueError, TypeError):
                logger.warning("Invalid quota cache entry for user %s", user.id)
    except Exception:
        logger.warning("Quota cache unavailable")
    finally:
        await client.aclose()
    connections = (await db.scalars(select(CloudConnection).where(CloudConnection.user_id == user.id, CloudConnection.is_active.is_(True)))).all()
    quota = await db.scalar(select(Quota).where(Quota.user_id == user.id))
    usage = await quota_usage(db, user.id)
    by_connection = []
    available_total = 0
    provider_limit_total = 0
    reserved_total = 0
    for connection in connections:
        used = usage.active.get(connection.id, 0)
        reserved = usage.pending.get(connection.id, 0)
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
        "total_reserved_bytes": reserved_total, "plan": user.plan, "plan_limit_bytes": plan_limit,
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
