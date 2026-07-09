import json
import os
import uuid
from typing import List
from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import FileResponse as FastAPIFileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.connection import CloudConnection
from app.models.file_record import FileRecord, FileStatus
from app.models.quota import QuotaSnapshot, TierType
from app.models.audit import AuditLog, AuditAction
from app.schemas.file import FileUploadRequest, FileUploadResponse, FileResponse
from app.services.router import select_best_connection
from app.services.providers import get_provider
from app.core.vault import decrypt

router = APIRouter(prefix="/files", tags=["Files"])

# Directory to save mock files locally
MOCK_STORAGE_DIR = "/mnt/D/NexusCloud/storage"
os.makedirs(MOCK_STORAGE_DIR, exist_ok=True)


@router.get("", response_model=List[FileResponse])
async def list_files(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all active files uploaded by the user."""
    result = await db.execute(
        select(FileRecord)
        .options(selectinload(FileRecord.connection))
        .where(FileRecord.user_id == current_user.id)
        .where(FileRecord.status == FileStatus.ACTIVE)
        .order_by(FileRecord.created_at.desc())
    )
    records = result.scalars().all()
    
    response = []
    for record in records:
        response.append(
            FileResponse(
                id=record.id,
                user_id=record.user_id,
                connection_id=record.connection_id,
                provider=record.connection.provider.value,
                connection_name=record.connection.display_name,
                object_key=record.object_key,
                original_name=record.original_name,
                size_bytes=record.size_bytes,
                mime_type=record.mime_type,
                status=record.status,
                created_at=record.created_at,
            )
        )
    return response


@router.post("/upload-request", response_model=FileUploadResponse)
async def request_upload(
    payload: FileUploadRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Determine the best cloud provider for the upload, reserve a FileRecord, and generate an upload URL."""
    # Use smart router to select the best active connection
    connection = await select_best_connection(current_user.id, payload.size_bytes, db)

    # Generate a unique key for the cloud storage object
    file_uuid = uuid.uuid4()
    extension = os.path.splitext(payload.original_name)[1]
    object_key = f"{current_user.id}/{file_uuid}{extension}"

    # Decrypt connection credentials
    creds_dict = json.loads(decrypt(connection.encrypted_creds))
    provider_client = get_provider(connection.provider, creds_dict, connection.region)

    # Generate presigned upload URL
    upload_url = await provider_client.get_presigned_upload_url(
        bucket=connection.bucket_name,
        object_key=object_key,
    )

    # Save initial pending file record
    file_record = FileRecord(
        id=file_uuid,
        user_id=current_user.id,
        connection_id=connection.id,
        object_key=object_key,
        original_name=payload.original_name,
        size_bytes=payload.size_bytes,
        mime_type=payload.mime_type or "application/octet-stream",
        status=FileStatus.PENDING,
        is_chunked=False,
    )
    db.add(file_record)
    await db.commit()

    return FileUploadResponse(
        file_id=file_record.id,
        connection_id=connection.id,
        provider=connection.provider.value,
        bucket_name=connection.bucket_name,
        upload_url=upload_url,
    )


@router.post("/confirm-upload/{file_id}", response_model=FileResponse)
async def confirm_upload(
    file_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a pending upload as ACTIVE and update connection quota stats."""
    # Fetch file record
    file_res = await db.execute(
        select(FileRecord)
        .options(selectinload(FileRecord.connection))
        .where(FileRecord.id == file_id)
        .where(FileRecord.user_id == current_user.id)
    )
    file_record = file_res.scalar_one_or_none()

    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File record not found",
        )

    if file_record.status == FileStatus.ACTIVE:
        # Already confirmed
        return FileResponse(
            id=file_record.id,
            user_id=file_record.user_id,
            connection_id=file_record.connection_id,
            provider=file_record.connection.provider.value,
            connection_name=file_record.connection.display_name,
            object_key=file_record.object_key,
            original_name=file_record.original_name,
            size_bytes=file_record.size_bytes,
            mime_type=file_record.mime_type,
            status=file_record.status,
            created_at=file_record.created_at,
        )

    # Update status
    file_record.status = FileStatus.ACTIVE

    # Fetch latest quota snapshot for this connection to update it
    snapshot_res = await db.execute(
        select(QuotaSnapshot)
        .where(QuotaSnapshot.connection_id == file_record.connection_id)
        .order_by(QuotaSnapshot.polled_at.desc())
        .limit(1)
    )
    snapshot = snapshot_res.scalar_one_or_none()

    if snapshot:
        # Create a new updated snapshot
        new_used = snapshot.used_bytes + file_record.size_bytes
        new_free = max(0, snapshot.limit_bytes - new_used)
        
        new_snapshot = QuotaSnapshot(
            connection_id=file_record.connection_id,
            used_bytes=new_used,
            free_bytes=new_free,
            limit_bytes=snapshot.limit_bytes,
            tier_type=snapshot.tier_type,
            polled_at=datetime.now(timezone.utc),
        )
        db.add(new_snapshot)

    # Create audit log
    db.add(
        AuditLog(
            user_id=current_user.id,
            action=AuditAction.UPLOAD,
            resource_id=str(file_id),
            meta={"filename": file_record.original_name, "size": file_record.size_bytes},
        )
    )
    await db.commit()

    return FileResponse(
        id=file_record.id,
        user_id=file_record.user_id,
        connection_id=file_record.connection_id,
        provider=file_record.connection.provider.value,
        connection_name=file_record.connection.display_name,
        object_key=file_record.object_key,
        original_name=file_record.original_name,
        size_bytes=file_record.size_bytes,
        mime_type=file_record.mime_type,
        status=file_record.status,
        created_at=file_record.created_at,
    )


@router.get("/download/{file_id}")
async def download_file(
    file_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a presigned download URL for the file and log audit events."""
    file_res = await db.execute(
        select(FileRecord)
        .options(selectinload(FileRecord.connection))
        .where(FileRecord.id == file_id)
        .where(FileRecord.user_id == current_user.id)
        .where(FileRecord.status == FileStatus.ACTIVE)
    )
    file_record = file_res.scalar_one_or_none()

    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active file record not found",
        )

    # Decrypt credentials and get provider client
    connection = file_record.connection
    creds_dict = json.loads(decrypt(connection.encrypted_creds))
    provider_client = get_provider(connection.provider, creds_dict, connection.region)

    # Generate download URL
    download_url = await provider_client.get_presigned_download_url(
        bucket=connection.bucket_name,
        object_key=file_record.object_key,
    )

    # Log audit
    db.add(
        AuditLog(
            user_id=current_user.id,
            action=AuditAction.DOWNLOAD,
            resource_id=str(file_id),
            meta={"filename": file_record.original_name},
        )
    )
    await db.commit()

    return {"download_url": download_url}


@router.delete("/{file_id}", status_code=204)
async def delete_file(
    file_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a file from the cloud provider, mark as DELETED, and release quota space."""
    file_res = await db.execute(
        select(FileRecord)
        .options(selectinload(FileRecord.connection))
        .where(FileRecord.id == file_id)
        .where(FileRecord.user_id == current_user.id)
        .where(FileRecord.status == FileStatus.ACTIVE)
    )
    file_record = file_res.scalar_one_or_none()

    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active file record not found",
        )

    # Delete object from provider
    connection = file_record.connection
    creds_dict = json.loads(decrypt(connection.encrypted_creds))
    provider_client = get_provider(connection.provider, creds_dict, connection.region)
    
    await provider_client.delete_object(
        bucket=connection.bucket_name,
        object_key=file_record.object_key,
    )

    # Update file status
    file_record.status = FileStatus.DELETED

    # Release quota space
    snapshot_res = await db.execute(
        select(QuotaSnapshot)
        .where(QuotaSnapshot.connection_id == file_record.connection_id)
        .order_by(QuotaSnapshot.polled_at.desc())
        .limit(1)
    )
    snapshot = snapshot_res.scalar_one_or_none()

    if snapshot:
        new_used = max(0, snapshot.used_bytes - file_record.size_bytes)
        new_free = snapshot.limit_bytes - new_used
        new_snapshot = QuotaSnapshot(
            connection_id=file_record.connection_id,
            used_bytes=new_used,
            free_bytes=new_free,
            limit_bytes=snapshot.limit_bytes,
            tier_type=snapshot.tier_type,
            polled_at=datetime.now(timezone.utc),
        )
        db.add(new_snapshot)

    # Log audit
    db.add(
        AuditLog(
            user_id=current_user.id,
            action=AuditAction.DELETE,
            resource_id=str(file_id),
            meta={"filename": file_record.original_name},
        )
    )
    await db.commit()

    return None


# ── Mock Storage Endpoints ─────────────────────────────────────────

@router.put("/mock-upload/{user_id}/{filename}")
async def mock_upload(user_id: str, filename: str, request: Request):
    """Receive a binary file payload and write it locally for simulated cloud storage."""
    # Build target file path
    user_dir = os.path.join(MOCK_STORAGE_DIR, user_id)
    os.makedirs(user_dir, exist_ok=True)
    target_path = os.path.join(user_dir, filename)

    # Read binary stream and write to file
    body = await request.body()
    with open(target_path, "wb") as f:
        f.write(body)

    return {"status": "success", "message": f"Successfully uploaded {filename} locally."}


@router.get("/mock-download/{user_id}/{filename}")
async def mock_download(user_id: str, filename: str):
    """Serve a locally stored file for mock download purposes."""
    target_path = os.path.join(MOCK_STORAGE_DIR, user_id, filename)
    if not os.path.exists(target_path):
        raise HTTPException(
            status_code=404,
            detail="Local file not found",
        )
    return FastAPIFileResponse(target_path, filename=filename)
