import asyncio
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import audit, current_user
from app.core.security import decrypt_credentials
from app.db.models import CloudConnection, FileManifest, FileRecord, Quota, User
from app.db.session import get_db
from app.schemas import FileOut, SignedChunkOut, StripedChunkOut, StripedManifestOut, StripedUploadIn, StripedUploadOut
from app.services.catalog import PLANS, PROVIDERS
from app.services.providers import provider_for
from app.services.quota import invalidate_quota, quota_usage
from app.services.striping import manifest_index_hash, place_chunks, validate_manifest

router = APIRouter(prefix="/files", tags=["files"])
SESSION_HOURS = 24


async def _manifest(db: AsyncSession, user_id: UUID, manifest_id: UUID, lock: bool = False) -> FileManifest:
    query = (
        select(FileManifest)
        .options(selectinload(FileManifest.chunks).selectinload(FileRecord.connection))
        .where(FileManifest.id == manifest_id, FileManifest.user_id == user_id)
    )
    if lock:
        query = query.with_for_update()
    manifest = await db.scalar(query)
    if manifest is None:
        raise HTTPException(404, "File not found")
    try:
        validate_manifest(manifest)
    except ValueError:
        raise HTTPException(503, "Stored file index is inconsistent")
    return manifest


def _ordered(manifest: FileManifest) -> list[FileRecord]:
    return sorted(manifest.chunks, key=lambda chunk: chunk.chunk_index)


def _chunk(manifest: FileManifest, index: int) -> FileRecord:
    if index < 0 or index >= manifest.chunk_count:
        raise HTTPException(404, "Chunk not found")
    return _ordered(manifest)[index]


def _chunk_out(chunk: FileRecord) -> StripedChunkOut:
    return StripedChunkOut(
        index=chunk.chunk_index, chunk_id=chunk.id, connection_id=chunk.connection_id,
        provider=chunk.connection.provider, size_bytes=chunk.size_bytes, sha256=chunk.sha256,
    )


@router.post("/striped-upload-request", response_model=StripedUploadOut)
async def request_striped_upload(
    body: StripedUploadIn, request: Request,
    user: User = Depends(current_user), db: AsyncSession = Depends(get_db),
):
    user = await db.scalar(select(User).where(User.id == user.id).with_for_update())
    connections = (await db.scalars(select(CloudConnection).where(
        CloudConnection.user_id == user.id, CloudConnection.is_active.is_(True)
    ).order_by(CloudConnection.created_at))).all()
    if len({connection.provider for connection in connections}) < 2:
        raise HTTPException(400, "Connect two different cloud providers to stripe a file")
    usage = await quota_usage(db, user.id)
    plan_limit = PLANS[user.plan].max_bytes
    if plan_limit is not None and usage.total_active + usage.total_pending + body.size_bytes > plan_limit:
        raise HTTPException(400, "Plan storage limit exceeded")
    occupied = {connection.id: usage.consumed(connection.id) for connection in connections}
    assignments = place_chunks(connections, occupied, [chunk.size_bytes for chunk in body.chunks])
    if assignments is None:
        raise HTTPException(400, "At least two cloud providers need enough quota for these chunks")

    expires = datetime.now(timezone.utc) + timedelta(hours=SESSION_HOURS)
    manifest = FileManifest(
        user_id=user.id, original_name=body.original_name, size_bytes=body.size_bytes,
        mime_type=body.mime_type, index_hash="0" * 64, index_version=2,
        chunk_count=len(body.chunks), status="pending", upload_expires_at=expires,
    )
    db.add(manifest)
    await db.flush()
    placed = []
    for index, (chunk, connection) in enumerate(zip(body.chunks, assignments, strict=True)):
        chunk_id = uuid4()
        placed.append((chunk.size_bytes, chunk.sha256, chunk_id, connection.id, connection.provider))
        db.add(FileRecord(
            id=chunk_id,
            user_id=user.id, connection_id=connection.id, manifest_id=manifest.id, chunk_index=index,
            sha256=chunk.sha256, original_name=body.original_name,
            object_key=f"{user.id}/{manifest.id}/{index}-{uuid4()}",
            size_bytes=chunk.size_bytes, mime_type="application/octet-stream",
            status="pending", upload_expires_at=expires,
        ))
    manifest.index_hash = manifest_index_hash(manifest.size_bytes, placed)
    await db.flush()
    result = await _manifest(db, user.id, manifest.id)
    audit(db, request, user.id, "STRIPED_UPLOAD_REQUEST", str(manifest.id))
    await db.commit()
    await invalidate_quota(user.id)
    return StripedUploadOut(
        file_id=manifest.id, index_version=manifest.index_version, index_hash=manifest.index_hash, expires_at=expires,
        chunks=[_chunk_out(chunk) for chunk in _ordered(result)],
    )


@router.get("/striped/{manifest_id}/chunks/{index}/upload-url", response_model=SignedChunkOut)
async def chunk_upload_url(
    manifest_id: UUID, index: int,
    user: User = Depends(current_user), db: AsyncSession = Depends(get_db),
):
    await db.scalar(select(User).where(User.id == user.id).with_for_update())
    manifest = await _manifest(db, user.id, manifest_id, lock=True)
    if manifest.status != "pending" or manifest.upload_expires_at.replace(tzinfo=timezone.utc) <= datetime.now(timezone.utc):
        raise HTTPException(409, "Striped upload has expired")
    chunk = _chunk(manifest, index)
    try:
        url, headers = await provider_for(chunk.connection.provider).upload_url(
            chunk.connection, decrypt_credentials(chunk.connection.encrypted_creds),
            chunk.object_key, chunk.mime_type, chunk.id,
        )
    except Exception:
        raise HTTPException(502, "Could not create cloud upload URL")
    # Hold the user lock through URL issuance so cancellation's 15-minute
    # cleanup delay starts after the last URL can have been issued.
    await db.commit()
    return SignedChunkOut(url=url, required_headers=headers, expires_in_seconds=900)


@router.post("/striped/{manifest_id}/confirm", response_model=FileOut)
async def confirm_striped_upload(
    manifest_id: UUID, request: Request,
    user: User = Depends(current_user), db: AsyncSession = Depends(get_db),
):
    await db.scalar(select(User).where(User.id == user.id).with_for_update())
    manifest = await _manifest(db, user.id, manifest_id, lock=True)
    if manifest.status == "active":
        return manifest
    if manifest.status != "pending" or manifest.upload_expires_at.replace(tzinfo=timezone.utc) <= datetime.now(timezone.utc):
        raise HTTPException(409, "Striped upload has expired")
    semaphore = asyncio.Semaphore(8)

    async def verify(chunk: FileRecord) -> bool:
        async with semaphore:
            provider = provider_for(chunk.connection.provider)
            credentials = decrypt_credentials(chunk.connection.encrypted_creds)
            if not await provider.exists(chunk.connection, credentials, chunk.object_key, chunk.id):
                return False
            return await provider.size(chunk.connection, credentials, chunk.object_key, chunk.id) == chunk.size_bytes

    try:
        verified = await asyncio.gather(*(verify(chunk) for chunk in manifest.chunks))
    except Exception:
        raise HTTPException(502, "Could not verify cloud chunks")
    if not all(verified):
        raise HTTPException(409, "One or more chunks are missing or have the wrong size")
    quota = await db.scalar(select(Quota).where(Quota.user_id == user.id).with_for_update())
    quota.used_bytes += manifest.size_bytes
    uploaded = datetime.now(timezone.utc)
    manifest.status = "active"
    manifest.uploaded_at = uploaded
    for chunk in manifest.chunks:
        chunk.status = "active"
        chunk.uploaded_at = uploaded
    audit(db, request, user.id, "STRIPED_UPLOAD", str(manifest.id))
    await db.commit()
    await invalidate_quota(user.id)
    return manifest


@router.get("/striped/{manifest_id}/manifest", response_model=StripedManifestOut)
async def get_striped_manifest(
    manifest_id: UUID, user: User = Depends(current_user), db: AsyncSession = Depends(get_db),
):
    manifest = await _manifest(db, user.id, manifest_id)
    if manifest.status != "active":
        raise HTTPException(404, "File not found")
    return StripedManifestOut(
        file_id=manifest.id, index_version=manifest.index_version,
        original_name=manifest.original_name, mime_type=manifest.mime_type,
        size_bytes=manifest.size_bytes, index_hash=manifest.index_hash,
        chunks=[_chunk_out(chunk) for chunk in _ordered(manifest)],
    )


@router.get("/striped/{manifest_id}/chunks/{index}/download-url", response_model=SignedChunkOut)
async def chunk_download_url(
    manifest_id: UUID, index: int,
    user: User = Depends(current_user), db: AsyncSession = Depends(get_db),
):
    manifest = await _manifest(db, user.id, manifest_id)
    if manifest.status != "active":
        raise HTTPException(404, "File not found")
    chunk = _chunk(manifest, index)
    try:
        url = await provider_for(chunk.connection.provider).download_url(
            chunk.connection, decrypt_credentials(chunk.connection.encrypted_creds), chunk.object_key, chunk.id,
        )
    except Exception:
        raise HTTPException(502, "Could not create cloud download URL")
    return SignedChunkOut(url=url, expires_in_seconds=3600)


async def _remove_striped(
    manifest_id: UUID, expected: str, final: str, action: str,
    request: Request, user: User, db: AsyncSession,
) -> None:
    await db.scalar(select(User).where(User.id == user.id).with_for_update())
    manifest = await _manifest(db, user.id, manifest_id, lock=True)
    if manifest.status != expected:
        raise HTTPException(409 if expected == "pending" else 404, "File is not in the required state")
    # Persist cleanup intent before touching clouds so a failed delete can be retried.
    manifest.status = "cleanup_failed"
    manifest.upload_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    await db.commit()
    try:
        for chunk in manifest.chunks:
            await provider_for(chunk.connection.provider).delete(
                chunk.connection, decrypt_credentials(chunk.connection.encrypted_creds),
                chunk.object_key, chunk.id,
            )
    except Exception:
        raise HTTPException(502, "Could not remove all cloud chunks; cleanup will retry")
    await db.scalar(select(User).where(User.id == user.id).with_for_update())
    manifest = await _manifest(db, user.id, manifest_id, lock=True)
    charged = sum(chunk.size_bytes for chunk in manifest.chunks if chunk.status == "active")
    if charged:
        quota = await db.scalar(select(Quota).where(Quota.user_id == user.id).with_for_update())
        quota.used_bytes = max(0, quota.used_bytes - charged)
    for chunk in manifest.chunks:
        chunk.status = final
    manifest.status = final
    audit(db, request, user.id, action, str(manifest.id))
    await db.commit()
    await invalidate_quota(user.id)


@router.post("/striped/{manifest_id}/cancel", status_code=204)
async def cancel_striped_upload(
    manifest_id: UUID, request: Request,
    user: User = Depends(current_user), db: AsyncSession = Depends(get_db),
):
    await db.scalar(select(User).where(User.id == user.id).with_for_update())
    manifest = await _manifest(db, user.id, manifest_id, lock=True)
    if manifest.status != "pending":
        raise HTTPException(409, "Only pending striped uploads can be cancelled")
    # Cloud-issued PUT URLs cannot be revoked. Keep credentials available and sweep
    # after every previously issued 15-minute URL has expired.
    manifest.status = "cleanup_pending"
    manifest.upload_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    for chunk in manifest.chunks:
        chunk.status = "cleanup_pending"
    audit(db, request, user.id, "STRIPED_UPLOAD_CANCEL", str(manifest.id))
    await db.commit()
    await invalidate_quota(user.id)


@router.delete("/striped/{manifest_id}", status_code=204)
async def delete_striped_file(
    manifest_id: UUID, request: Request,
    user: User = Depends(current_user), db: AsyncSession = Depends(get_db),
):
    await _remove_striped(manifest_id, "active", "deleted", "STRIPED_DELETE", request, user, db)
