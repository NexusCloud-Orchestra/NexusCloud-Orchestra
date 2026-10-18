import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Awaitable, Callable, TypeVar

from sqlalchemy import delete, select

from app.core.redis import close_redis
from app.core.security import decrypt_credentials
from app.db.models import (
    AccessRevocation, CloudConnection, FileManifest, FileRecord, PasswordReset, Quota, RefreshSession, User,
)
from app.services.providers import provider_for
from app.services.quota import invalidate_quota
from app.workers.celery_app import celery_app
from app.workers.db import worker_session

logger = logging.getLogger(__name__)

T = TypeVar("T")

SINGLE_FILE_FINAL_STATUS = {
    "pending": "expired",
    "cleanup_pending": "cancelled",
    "cleanup_failed": "cancelled",
    "deleting": "deleted",
}


# Leased rows get upload_expires_at pushed this far ahead so other sweeps skip them during provider I/O.
CLEANUP_LEASE = timedelta(minutes=5)


def _locked(model, row_id):
    return select(model).where(model.id == row_id).with_for_update().execution_options(populate_existing=True)


async def _lease(now):
    """Short transaction: claim eligible rows by extending their expiry, then release every lock."""
    async with worker_session() as db:
        # upload_expires_at is the signed PUT URL's expiry (or the delete request time for deleting files),
        # so no browser can still write the object once it has passed.
        files = (await db.scalars(select(FileRecord).where(
            FileRecord.status.in_(tuple(SINGLE_FILE_FINAL_STATUS)),
            FileRecord.upload_expires_at < now,
            FileRecord.manifest_id.is_(None),
        ).with_for_update(skip_locked=True).limit(500))).all()
        manifests = (await db.scalars(select(FileManifest).where(
            FileManifest.status.in_(("pending", "cleanup_pending", "cleanup_failed")),
            FileManifest.upload_expires_at < now,
        ).with_for_update(skip_locked=True).limit(100))).all()
        leased_files, leased_manifests = [], []
        for file in files:
            leased_files.append((file, file.status, await db.get(CloudConnection, file.connection_id)))
            # A lease must not revive an expired pending upload, or a late confirm could activate it mid-delete.
            if file.status == "pending":
                file.status = "cleanup_pending"
            file.upload_expires_at = now + CLEANUP_LEASE
        for manifest in manifests:
            chunks = (await db.scalars(select(FileRecord).where(FileRecord.manifest_id == manifest.id))).all()
            leased_manifests.append((manifest, manifest.status, [
                (chunk, await db.get(CloudConnection, chunk.connection_id)) for chunk in chunks
            ]))
            if manifest.status == "pending":
                manifest.status = "cleanup_pending"
                for chunk in chunks:
                    chunk.status = "cleanup_pending"
            manifest.upload_expires_at = now + CLEANUP_LEASE
        await db.commit()
    return leased_files, leased_manifests


async def _finish_file(file, original, deleted):
    async with worker_session() as db:
        await db.scalar(select(User).where(User.id == file.user_id).with_for_update())
        current = await db.scalar(_locked(FileRecord, file.id))
        if current is None or current.status != file.status:
            return  # The API finished this file while we were talking to the provider.
        if not deleted:
            # A failed delete stays deleting so its bytes remain charged until the object is gone.
            if current.status != "deleting":
                current.status = "cleanup_failed"
        else:
            if original == "deleting":
                quota = await db.scalar(select(Quota).where(Quota.user_id == current.user_id).with_for_update())
                quota.used_bytes = max(0, quota.used_bytes - current.size_bytes)
            current.status = SINGLE_FILE_FINAL_STATUS[original]
        await db.commit()


async def _finish_manifest(manifest, original, deleted):
    async with worker_session() as db:
        await db.scalar(select(User).where(User.id == manifest.user_id).with_for_update())
        current = await db.scalar(_locked(FileManifest, manifest.id))
        if current is None or current.status != manifest.status:
            return
        if not deleted:
            current.status = "cleanup_failed"
            await db.commit()
            return
        chunks = (await db.scalars(
            select(FileRecord).where(FileRecord.manifest_id == current.id)
            .with_for_update().execution_options(populate_existing=True)
        )).all()
        charged = sum(chunk.size_bytes for chunk in chunks if chunk.status == "active")
        if charged:
            quota = await db.scalar(select(Quota).where(Quota.user_id == current.user_id).with_for_update())
            quota.used_bytes = max(0, quota.used_bytes - charged)
        final = "deleted" if charged else "cancelled" if original == "cleanup_pending" else "expired"
        current.status = final
        for chunk in chunks:
            chunk.status = final
        await db.commit()


async def _cleanup():
    files, manifests = await _lease(datetime.now(timezone.utc))
    for file, original, connection in files:
        try:
            if connection and connection.encrypted_creds:
                provider = provider_for(connection.provider)
                credentials = decrypt_credentials(connection.encrypted_creds)
                if await provider.exists(connection, credentials, file.object_key, file.id):
                    await provider.delete(connection, credentials, file.object_key, file.id)
            deleted = True
        except Exception:
            logger.exception("Object cleanup failed for file %s", file.id)
            deleted = False
        await _finish_file(file, original, deleted)
    for manifest, original, chunks in manifests:
        try:
            for chunk, connection in chunks:
                if not connection or not connection.encrypted_creds:
                    raise RuntimeError("Cloud credentials missing during striped cleanup")
                await provider_for(connection.provider).delete(
                    connection, decrypt_credentials(connection.encrypted_creds), chunk.object_key, chunk.id,
                )
            deleted = True
        except Exception:
            logger.exception("Striped cleanup failed for manifest %s", manifest.id)
            deleted = False
        await _finish_manifest(manifest, original, deleted)
    for user_id in {file.user_id for file, _, _ in files} | {manifest.user_id for manifest, _, _ in manifests}:
        await invalidate_quota(user_id)
    return len(files) + len(manifests)


async def _purge_expired_tokens():
    """Revocation, refresh and reset rows are useless after expiry; keep the tables bounded."""
    now = datetime.now(timezone.utc)
    async with worker_session() as db:
        removed = 0
        for model in (AccessRevocation, RefreshSession, PasswordReset):
            result = await db.execute(delete(model).where(model.expires_at < now))
            removed += result.rowcount or 0
        await db.commit()
    return removed


def run_task(coro_fn: Callable[[], Awaitable[T]]) -> T:
    """Run one task in a fresh loop and close that loop's Redis client before the loop is discarded."""
    async def _wrapper():
        try:
            return await coro_fn()
        finally:
            await close_redis()

    return asyncio.run(_wrapper())


@celery_app.task(name="app.workers.tasks.purge_expired_tokens")
def purge_expired_tokens():
    return run_task(_purge_expired_tokens)


@celery_app.task(name="app.workers.tasks.cleanup_expired_uploads")
def cleanup_expired_uploads():
    return run_task(_cleanup)
