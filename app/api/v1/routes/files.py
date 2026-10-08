from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import contains_eager, selectinload

from app.core.deps import audit, current_user
from app.core.security import decrypt_credentials
from app.db.models import CloudConnection, FileManifest, FileRecord, Quota, User
from app.db.session import get_db
from app.schemas import (
    FileOut, RouteCandidateOut, RouteComponents, RoutePreviewIn, RoutePreviewOut, RouteWeights, UploadIn, UploadOut,
)
from app.services.catalog import PLANS, PROVIDERS
from app.services.providers import LocalProvider, provider_for
from app.services.quota import invalidate_quota, quota_usage
from app.services.router import (
    WEIGHT_CAPACITY, WEIGHT_EGRESS, WEIGHT_FIT, WEIGHT_PERMANENCE, Candidate, Evaluation, SmartRouter,
)

router = APIRouter(prefix="/files", tags=["files"])

BLOCK_NO_CONNECTIONS = "no_connections"
BLOCK_PLAN_LIMIT = "plan_limit"
BLOCK_NO_SINGLE_CLOUD = "no_single_cloud"
BLOCK_INSUFFICIENT = "insufficient_quota"
BLOCK_MESSAGES = {
    BLOCK_NO_CONNECTIONS: "Connect a cloud before uploading",
    BLOCK_PLAN_LIMIT: "Plan storage limit exceeded. Upgrade your plan or delete files.",
    BLOCK_NO_SINGLE_CLOUD: "No single cloud has enough free space for this file",
    BLOCK_INSUFFICIENT: "Insufficient connected cloud quota",
}


@dataclass(frozen=True)
class Placement:
    evaluations: list[Evaluation]
    selected: Evaluation | None
    blocked: str | None


async def _file(db: AsyncSession, user_id: UUID, file_id: UUID, lock: bool = False):
    statement = select(FileRecord, CloudConnection).join(FileRecord.connection).options(contains_eager(FileRecord.connection)).where(
        FileRecord.id == file_id, FileRecord.user_id == user_id, CloudConnection.user_id == user_id,
        FileRecord.manifest_id.is_(None),
    )
    if lock:
        statement = statement.with_for_update()
    result = (await db.execute(statement)).first()
    if not result:
        raise HTTPException(404, "File not found")
    return result


async def _placement(db: AsyncSession, user: User, size_bytes: int) -> Placement:
    """Collect routing inputs exactly as the upload path sees them and score every active connection."""
    connections = (await db.scalars(select(CloudConnection).where(
        CloudConnection.user_id == user.id, CloudConnection.is_active.is_(True)
    ).order_by(CloudConnection.created_at))).all()
    usage = await quota_usage(db, user.id)
    committed = usage.total_active + usage.total_pending
    plan_limit = PLANS[user.plan].max_bytes
    candidates = []
    for connection in connections:
        consumed = usage.consumed(connection.id)
        candidates.append(Candidate(connection, max(0, PROVIDERS[connection.provider].free_bytes - consumed)))
    router_ = SmartRouter()
    evaluations = router_.evaluate(candidates, size_bytes)
    blocked = None
    if not connections:
        blocked = BLOCK_NO_CONNECTIONS
    elif plan_limit is not None and committed + size_bytes > plan_limit:
        blocked = BLOCK_PLAN_LIMIT
    selected = None if blocked else router_.best(evaluations)
    if blocked is None and selected is None:
        total_free = sum(c.free_bytes for c in candidates)
        blocked = BLOCK_NO_SINGLE_CLOUD if total_free >= size_bytes else BLOCK_INSUFFICIENT
    return Placement(evaluations, selected, blocked)


@router.post("/route-preview", response_model=RoutePreviewOut)
async def route_preview(body: RoutePreviewIn, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    """Read-only Smart Router decision. Creates no reservation and issues no URL."""
    placement = await _placement(db, user, body.size_bytes)
    ranked = sorted(
        placement.evaluations,
        key=lambda e: (e.eligible, e.score or 0.0, str(e.candidate.connection.id)),
        reverse=True,
    )
    return RoutePreviewOut(
        size_bytes=body.size_bytes,
        selected_connection_id=placement.selected.candidate.connection.id if placement.selected else None,
        blocked_reason=placement.blocked,
        message=BLOCK_MESSAGES.get(placement.blocked),
        weights=RouteWeights(capacity=WEIGHT_CAPACITY, egress=WEIGHT_EGRESS, permanence=WEIGHT_PERMANENCE, fit=WEIGHT_FIT),
        candidates=[
            RouteCandidateOut(
                connection_id=e.candidate.connection.id,
                provider=e.candidate.connection.provider,
                display_name=e.candidate.connection.display_name,
                free_bytes=e.candidate.free_bytes,
                eligible=e.eligible,
                score=round(e.score, 4) if e.score is not None else None,
                components=RouteComponents(
                    capacity=round(e.capacity, 4), egress=round(e.egress, 4),
                    permanence=round(e.permanence, 4), fit=round(e.fit, 4),
                ) if e.eligible else None,
            )
            for e in ranked
        ],
    )


@router.post("/upload-request", response_model=UploadOut)
async def upload_request(body: UploadIn, request: Request, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    # Lock the user row so concurrent upload reservations cannot overbook the plan.
    user = await db.scalar(select(User).where(User.id == user.id).with_for_update())
    placement = await _placement(db, user, body.size_bytes)
    if placement.selected is None:
        raise HTTPException(400, BLOCK_MESSAGES[placement.blocked])
    connection = placement.selected.candidate.connection
    file = FileRecord(
        user_id=user.id, connection_id=connection.id, original_name=body.original_name,
        object_key=f"{user.id}/{uuid4()}", size_bytes=body.size_bytes, mime_type=body.mime_type,
        status="pending", upload_expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
    )
    db.add(file)
    await db.flush()
    try:
        url, headers = await provider_for(connection.provider).upload_url(
            connection, decrypt_credentials(connection.encrypted_creds), file.object_key, file.mime_type, file.id
        )
    except Exception:
        await db.rollback()
        raise HTTPException(502, "Could not create cloud upload URL")
    audit(db, request, user.id, "UPLOAD_REQUEST", str(file.id))
    await db.commit()
    await invalidate_quota(user.id)
    return UploadOut(
        file_id=file.id, provider=connection.provider, bucket_name=connection.bucket_name,
        upload_url=url, expires_at=file.upload_expires_at, required_headers=headers,
        connection_id=connection.id,
    )


@router.post("/cancel-upload/{file_id}", status_code=204)
async def cancel_upload(file_id: UUID, request: Request, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    """Release a pending reservation after a failed or abandoned browser PUT."""
    await db.scalar(select(User).where(User.id == user.id).with_for_update())
    file, connection = await _file(db, user.id, file_id, True)
    if file.status != "pending":
        raise HTTPException(409, "Only pending uploads can be cancelled")
    try:
        provider = provider_for(connection.provider)
        credentials = decrypt_credentials(connection.encrypted_creds)
        if await provider.exists(connection, credentials, file.object_key, file.id):
            await provider.delete(connection, credentials, file.object_key, file.id)
        file.status = "cancelled"
    except Exception:
        # The cleanup worker retries cleanup_failed records; disconnect stays blocked until it succeeds.
        file.status = "cleanup_failed"
        file.upload_expires_at = datetime.now(timezone.utc)
    audit(db, request, user.id, "UPLOAD_CANCEL", str(file.id))
    await db.commit()
    await invalidate_quota(user.id)


@router.post("/confirm-upload/{file_id}", response_model=FileOut)
async def confirm_upload(file_id: UUID, request: Request, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    await db.scalar(select(User).where(User.id == user.id).with_for_update())
    file, connection = await _file(db, user.id, file_id, True)
    if file.status == "active":
        return file
    if file.status != "pending" or file.upload_expires_at.replace(tzinfo=timezone.utc) <= datetime.now(timezone.utc):
        raise HTTPException(409, "Upload request has expired")
    try:
        exists = await provider_for(connection.provider).exists(
            connection, decrypt_credentials(connection.encrypted_creds), file.object_key, file.id
        )
    except Exception:
        raise HTTPException(502, "Could not verify cloud upload")
    if not exists:
        raise HTTPException(409, "Upload has not completed")
    provider = provider_for(connection.provider)
    if not isinstance(provider, LocalProvider):
        try:
            actual_size = await provider.size(connection, decrypt_credentials(connection.encrypted_creds), file.object_key, file.id)
        except Exception:
            raise HTTPException(502, "Could not verify cloud object size")
        if actual_size != file.size_bytes:
            raise HTTPException(409, "Uploaded size differs from the declared size")
    quota = await db.scalar(select(Quota).where(Quota.user_id == user.id).with_for_update())
    quota.used_bytes += file.size_bytes
    file.status = "active"
    file.uploaded_at = datetime.now(timezone.utc)
    audit(db, request, user.id, "UPLOAD", str(file.id))
    await db.commit()
    await invalidate_quota(user.id)
    return file


@router.get("", response_model=list[FileOut])
async def list_files(user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    single = (await db.scalars(
        select(FileRecord).options(selectinload(FileRecord.connection))
        .where(FileRecord.user_id == user.id, FileRecord.status == "active", FileRecord.manifest_id.is_(None))
        .order_by(FileRecord.uploaded_at.desc())
    )).all()
    striped = (await db.scalars(
        select(FileManifest).where(FileManifest.user_id == user.id, FileManifest.status == "active")
        .order_by(FileManifest.uploaded_at.desc())
    )).all()
    return sorted([*single, *striped], key=lambda file: file.uploaded_at, reverse=True)


@router.get("/download/{file_id}")
async def download_file(file_id: UUID, request: Request, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    file, connection = await _file(db, user.id, file_id)
    if file.status != "active":
        raise HTTPException(404, "File not found")
    try:
        url = await provider_for(connection.provider).download_url(
            connection, decrypt_credentials(connection.encrypted_creds), file.object_key, file.id
        )
    except Exception:
        raise HTTPException(502, "Could not create cloud download URL")
    audit(db, request, user.id, "DOWNLOAD", str(file.id))
    await db.commit()
    return {"download_url": url, "expires_in_seconds": 3600}


@router.delete("/{file_id}", status_code=204)
async def delete_file(file_id: UUID, request: Request, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    await db.scalar(select(User).where(User.id == user.id).with_for_update())
    file, connection = await _file(db, user.id, file_id, True)
    if file.status != "active":
        raise HTTPException(404, "File not found")
    try:
        await provider_for(connection.provider).delete(
            connection, decrypt_credentials(connection.encrypted_creds), file.object_key, file.id
        )
    except Exception:
        raise HTTPException(502, "Could not delete cloud object")
    quota = await db.scalar(select(Quota).where(Quota.user_id == user.id).with_for_update())
    quota.used_bytes = max(0, quota.used_bytes - file.size_bytes)
    file.status = "deleted"
    audit(db, request, user.id, "DELETE", str(file.id))
    await db.commit()
    await invalidate_quota(user.id)
