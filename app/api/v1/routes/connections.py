from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.deps import audit, current_user
from app.core.security import encrypt_credentials
from app.db.models import CloudConnection, FileRecord, User
from app.db.session import get_db
from app.schemas import ConnectionIn, ConnectionOut
from app.services.catalog import PLANS
from app.services.providers import provider_for
from app.services.quota import invalidate_quota

router = APIRouter(prefix="/connections", tags=["connections"])


@router.post("", response_model=ConnectionOut, status_code=201)
async def create_connection(body: ConnectionIn, request: Request, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.id == user.id).with_for_update())
    count = await db.scalar(select(func.count()).select_from(CloudConnection).where(CloudConnection.user_id == user.id, CloudConnection.is_active.is_(True)))
    limit = PLANS[user.plan].max_connections
    if limit is not None and count >= limit:
        raise HTTPException(403, "Connection limit reached. Upgrade your plan to add more clouds.")
    if body.provider in ("b2", "ibm", "oracle") and not body.region:
        raise HTTPException(422, "Region is required for this provider")
    try:
        provider = provider_for(body.provider)
        provider.validate(body.credentials)
    except ValueError as exc:
        raise HTTPException(422, str(exc))
    connection = CloudConnection(
        user_id=user.id, provider=body.provider, display_name=body.display_name.strip(),
        bucket_name=body.bucket_name, region=body.region, encrypted_creds=encrypt_credentials(body.credentials),
    )
    try:
        await provider.verify_connection(connection, body.credentials)
    except Exception:
        raise HTTPException(502, "Could not validate cloud credentials and bucket access")
    db.add(connection)
    await db.flush()
    audit(db, request, user.id, "CONNECT", str(connection.id))
    await db.commit()
    await invalidate_quota(user.id)
    return connection


@router.get("", response_model=list[ConnectionOut])
async def list_connections(user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    return (await db.scalars(select(CloudConnection).where(CloudConnection.user_id == user.id, CloudConnection.is_active.is_(True)).order_by(CloudConnection.created_at.desc()))).all()


@router.delete("/{connection_id}", status_code=204)
async def delete_connection(connection_id: UUID, request: Request, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    connection = await db.scalar(select(CloudConnection).where(CloudConnection.id == connection_id, CloudConnection.user_id == user.id, CloudConnection.is_active.is_(True)).with_for_update())
    if not connection:
        raise HTTPException(404, "Connection not found")
    active_files = await db.scalar(select(func.count()).select_from(FileRecord).where(FileRecord.connection_id == connection.id, FileRecord.user_id == user.id, FileRecord.status.in_(("active", "pending", "cleanup_pending", "cleanup_failed"))))
    if active_files:
        raise HTTPException(409, "Delete files or wait for pending upload cleanup before disconnecting")
    connection.is_active = False
    connection.encrypted_creds = None
    audit(db, request, user.id, "DISCONNECT", str(connection.id))
    await db.commit()
    await invalidate_quota(user.id)
