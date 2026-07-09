from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.connection import CloudConnection
from app.models.quota import QuotaSnapshot
from app.schemas.quota import QuotaSummaryResponse, QuotaConnectionDetail

router = APIRouter(prefix="/quota", tags=["Quota"])


@router.get("/summary", response_model=QuotaSummaryResponse)
async def get_quota_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve aggregate and provider-specific storage quota details for the user."""
    # Fetch all active connections for the user
    connections_res = await db.execute(
        select(CloudConnection)
        .where(CloudConnection.user_id == current_user.id)
        .where(CloudConnection.is_active == True)
    )
    connections = connections_res.scalars().all()

    total_used = 0
    total_free = 0
    total_limit = 0
    by_connection_details = []

    for conn in connections:
        # Fetch latest quota snapshot for this connection
        snapshot_res = await db.execute(
            select(QuotaSnapshot)
            .where(QuotaSnapshot.connection_id == conn.id)
            .order_by(QuotaSnapshot.polled_at.desc())
            .limit(1)
        )
        snapshot = snapshot_res.scalar_one_or_none()

        if not snapshot:
            # Fallback if no snapshot exists
            gb = 1024 * 1024 * 1024
            used_bytes = 0
            limit_bytes = 10 * gb
            free_bytes = limit_bytes
            tier = "always_free"
        else:
            used_bytes = snapshot.used_bytes
            free_bytes = snapshot.free_bytes
            limit_bytes = snapshot.limit_bytes
            tier = snapshot.tier_type.value

        total_used += used_bytes
        total_free += free_bytes
        total_limit += limit_bytes

        by_connection_details.append(
            QuotaConnectionDetail(
                connection_id=conn.id,
                display_name=conn.display_name,
                provider=conn.provider.value,
                bucket_name=conn.bucket_name,
                used_bytes=used_bytes,
                free_bytes=free_bytes,
                limit_bytes=limit_bytes,
                tier_type=tier,
            )
        )

    return QuotaSummaryResponse(
        total_used_bytes=total_used,
        total_free_bytes=total_free,
        total_limit_bytes=total_limit,
        by_connection=by_connection_details,
    )
