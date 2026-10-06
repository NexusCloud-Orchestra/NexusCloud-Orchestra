from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import audit, current_user
from app.core.security import decrypt_credentials
from app.db.models import CloudConnection, FileRecord, Quota, User
from app.db.session import get_db
from app.schemas import FileOut, UploadIn, UploadOut
from app.services.catalog import PLANS, PROVIDERS
from app.services.providers import LocalProvider, provider_for
from app.services.quota import invalidate_quota
from app.services.router import Candidate, SmartRouter

router = APIRouter(prefix="/files", tags=["files"])


async def _file(db: AsyncSession, user_id: UUID, file_id: UUID, lock: bool = False):
    statement = select(FileRecord, CloudConnection).join(CloudConnection, FileRecord.connection_id == CloudConnection.id).where(
        FileRecord.id == file_id, FileRecord.user_id == user_id, CloudConnection.user_id == user_id
    )
    if lock:
        statement = statement.with_for_update()
    result = (await db.execute(statement)).first()
    if not result:
        raise HTTPException(404, "File not found")
    return result


@router.post("/upload-request", response_model=UploadOut)
async def upload_request(body: UploadIn, request: Request, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    # Lock the user row so concurrent upload reservations cannot overbook the plan.
    user = await db.scalar(select(User).where(User.id == user.id).with_for_update())
    connections = (await db.scalars(select(CloudConnection).where(CloudConnection.user_id == user.id, CloudConnection.is_active.is_(True)))).all()
    if not connections:
        raise HTTPException(400, "Connect a cloud before uploading")
    usage_rows = (await db.execute(
        select(FileRecord.connection_id, FileRecord.status, func.sum(FileRecord.size_bytes))
        .where(FileRecord.user_id == user.id, FileRecord.status.in_(("active", "pending")))
        .group_by(FileRecord.connection_id, FileRecord.status)
    )).all()
    usage = {(connection_id, status): amount for connection_id, status, amount in usage_rows}
    active_total = sum(amount for _, status, amount in usage_rows if status == "active")
    pending_total = sum(amount for _, status, amount in usage_rows if status == "pending")
    plan_limit = PLANS[user.plan].max_bytes
    if plan_limit is not None and active_total + pending_total + body.size_bytes > plan_limit:
        raise HTTPException(400, "Plan storage limit exceeded. Upgrade your plan or delete files.")
    candidates = []
    total_free = 0
    for connection in connections:
        consumed = usage.get((connection.id, "active"), 0) + usage.get((connection.id, "pending"), 0)
        free = max(0, PROVIDERS[connection.provider].free_bytes - consumed)
        total_free += free
        candidates.append(Candidate(connection, free))
    selected = SmartRouter().select(candidates, body.size_bytes)
    if selected is None:
        if total_free >= body.size_bytes:
            raise HTTPException(400, "No single cloud has enough free space for this file")
        raise HTTPException(400, "Insufficient connected cloud quota")
    connection = selected.connection
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
        upload_url=url, expires_at=file.upload_expires_at, required_headers=headers
    )


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
    return (await db.scalars(select(FileRecord).where(FileRecord.user_id == user.id, FileRecord.status == "active").order_by(FileRecord.uploaded_at.desc()))).all()


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
