import json
from typing import List
from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.connection import CloudConnection, Provider
from app.models.quota import QuotaSnapshot, TierType
from app.models.audit import AuditLog, AuditAction
from app.schemas.connection import ConnectionCreate, ConnectionResponse
from app.core.vault import encrypt

router = APIRouter(prefix="/connections", tags=["Connections"])


@router.get("", response_model=List[ConnectionResponse])
async def list_connections(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all cloud connections for the current user."""
    result = await db.execute(
        select(CloudConnection)
        .where(CloudConnection.user_id == current_user.id)
        .where(CloudConnection.is_active == True)
        .order_by(CloudConnection.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=ConnectionResponse, status_code=201)
async def create_connection(
    payload: ConnectionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new cloud connection and initialize its storage quota snapshot."""
    # Convert credentials dict to JSON string and encrypt it
    creds_json = json.dumps(payload.credentials)
    encrypted_creds = encrypt(creds_json)

    connection = CloudConnection(
        user_id=current_user.id,
        provider=payload.provider,
        display_name=payload.display_name,
        bucket_name=payload.bucket_name,
        region=payload.region,
        encrypted_creds=encrypted_creds,
        is_active=True,
    )
    db.add(connection)
    await db.flush()  # Generate connection.id

    # Determine default storage limit based on provider free tier (in bytes)
    # AWS/GCP/Azure: 5GB, R2/B2: 10GB, Oracle: 20GB, IBM: 25GB
    gb = 1024 * 1024 * 1024
    limits = {
        Provider.AWS: 5 * gb,
        Provider.GCP: 5 * gb,
        Provider.AZURE: 5 * gb,
        Provider.R2: 10 * gb,
        Provider.B2: 10 * gb,
        Provider.ORACLE: 20 * gb,
        Provider.IBM: 25 * gb,
    }
    limit_bytes = limits.get(payload.provider, 10 * gb)

    # Create initial quota snapshot
    quota_snapshot = QuotaSnapshot(
        connection_id=connection.id,
        used_bytes=0,
        free_bytes=limit_bytes,
        limit_bytes=limit_bytes,
        tier_type=TierType.ALWAYS_FREE,
        polled_at=datetime.now(timezone.utc),
    )
    db.add(quota_snapshot)

    # Create audit log
    db.add(
        AuditLog(
            user_id=current_user.id,
            action=AuditAction.CONNECT,
            resource_id=str(connection.id),
            meta={"provider": payload.provider.value, "display_name": payload.display_name},
        )
    )

    return connection


@router.delete("/{connection_id}", status_code=204)
async def delete_connection(
    connection_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a cloud connection and log audit trail."""
    result = await db.execute(
        select(CloudConnection)
        .where(CloudConnection.id == connection_id)
        .where(CloudConnection.user_id == current_user.id)
    )
    connection = result.scalar_one_or_none()

    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cloud connection not found",
        )

    # Delete connection (relationship cascade handles deleting quota snapshots and files)
    await db.delete(connection)

    # Create audit log
    db.add(
        AuditLog(
            user_id=current_user.id,
            action=AuditAction.DISCONNECT,
            resource_id=str(connection_id),
            meta={"provider": connection.provider.value, "display_name": connection.display_name},
        )
    )

    return None
