from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.connection import CloudConnection, Provider
from app.models.quota import QuotaSnapshot
from fastapi import HTTPException


async def select_best_connection(user_id, file_size: int, db: AsyncSession) -> CloudConnection:
    """Smart routing algorithm to select the best storage connection for an upload.
    
    Scores each active cloud connection based on:
    - 40% Free Quota Left
    - 30% Egress Cost
    - 20% Tier Permanence
    - 10% File-to-Quota Fit
    """
    # Fetch active connections
    result = await db.execute(
        select(CloudConnection)
        .where(CloudConnection.user_id == user_id)
        .where(CloudConnection.is_active == True)
    )
    connections = result.scalars().all()
    if not connections:
        raise HTTPException(
            status_code=400,
            detail="No cloud connections active. Please add a connection first."
        )

    scored_connections = []

    # Score each connection
    for conn in connections:
        # Get latest QuotaSnapshot
        snap_res = await db.execute(
            select(QuotaSnapshot)
            .where(QuotaSnapshot.connection_id == conn.id)
            .order_by(QuotaSnapshot.polled_at.desc())
            .limit(1)
        )
        snapshot = snap_res.scalar_one_or_none()

        if not snapshot:
            gb = 1024 * 1024 * 1024
            used_bytes = 0
            limit_bytes = 10 * gb
            free_bytes = limit_bytes
        else:
            used_bytes = snapshot.used_bytes
            limit_bytes = snapshot.limit_bytes
            free_bytes = snapshot.free_bytes

        # Exclude connection if the file exceeds remaining free bytes
        if free_bytes < file_size:
            continue

        # Define provider scores (egress cost and permanence on a 1-10 scale)
        if conn.provider == Provider.R2:
            egress_score = 10.0     # $0 egress
            permanence_score = 10.0 # Permanent free tier
        elif conn.provider == Provider.ORACLE:
            egress_score = 10.0     # $0 egress
            permanence_score = 10.0 # Permanent free tier
        elif conn.provider == Provider.B2:
            egress_score = 10.0     # $0 egress (via CF)
            permanence_score = 9.0  # Very stable
        elif conn.provider == Provider.IBM:
            egress_score = 6.0      # Partial free tier egress
            permanence_score = 9.0  # Stable
        elif conn.provider == Provider.AWS:
            egress_score = 3.0      # High egress ($0.09/GB)
            permanence_score = 5.0  # 12-month limit on free tier
        elif conn.provider == Provider.AZURE:
            egress_score = 3.5      # High egress ($0.087/GB)
            permanence_score = 5.0  # 12-month limit on free tier
        elif conn.provider == Provider.GCP:
            egress_score = 2.0      # Very high egress ($0.12/GB)
            permanence_score = 9.0  # Permanent free tier
        else:
            egress_score = 5.0
            permanence_score = 5.0

        # A. Free Quota Left (40% weight): ratio of free bytes to limit bytes
        free_ratio = (free_bytes / limit_bytes) if limit_bytes > 0 else 0.0
        free_quota_score = free_ratio * 10.0

        # B. Egress Cost (30% weight) - egress_score (0-10)
        # C. Tier Permanence (20% weight) - permanence_score (0-10)

        # D. File-to-Quota Fit (10% weight): prefer storage that isn't overwhelmed by the upload
        fit_score = (1.0 - (file_size / free_bytes)) * 10.0 if free_bytes > 0 else 0.0

        # Final score calculation
        final_score = (
            (free_quota_score * 0.40) +
            (egress_score * 0.30) +
            (permanence_score * 0.20) +
            (fit_score * 0.10)
        )
        scored_connections.append((final_score, conn))

    if not scored_connections:
        raise HTTPException(
            status_code=400,
            detail="No cloud storage connection has enough free space for this file size."
        )

    # Sort connections by score descending and return the top connection
    scored_connections.sort(key=lambda x: x[0], reverse=True)
    return scored_connections[0][1]
