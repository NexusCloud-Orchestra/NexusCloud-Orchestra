import asyncio
import logging
from datetime import datetime, timezone
from sqlalchemy import delete, select

from app.core.security import decrypt_credentials
from app.db.models import AccessRevocation, CloudConnection, FileManifest, FileRecord, PasswordReset, Quota, RefreshSession
from app.db.session import SessionLocal
from app.services.providers import provider_for
from app.services.quota import invalidate_quota
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


async def _cleanup():
    async with SessionLocal() as db:
        files = (await db.scalars(select(FileRecord).where(
            FileRecord.status.in_(("pending", "cleanup_failed")),
            FileRecord.upload_expires_at < datetime.now(timezone.utc),
            FileRecord.manifest_id.is_(None),
        ).with_for_update(skip_locked=True).limit(500))).all()
        affected = set()
        for file in files:
            connection = await db.get(CloudConnection, file.connection_id)
            try:
                if connection and connection.encrypted_creds:
                    provider = provider_for(connection.provider)
                    credentials = decrypt_credentials(connection.encrypted_creds)
                    if await provider.exists(connection, credentials, file.object_key, file.id):
                        await provider.delete(connection, credentials, file.object_key, file.id)
                file.status = "expired"
            except Exception:
                logger.exception("Expired object cleanup failed for file %s", file.id)
                file.status = "cleanup_failed"
            affected.add(file.user_id)
        manifests = (await db.scalars(select(FileManifest).where(
            FileManifest.status.in_(("pending", "cleanup_pending", "cleanup_failed")),
            FileManifest.upload_expires_at < datetime.now(timezone.utc),
        ).with_for_update(skip_locked=True).limit(100))).all()
        for manifest in manifests:
            chunks = (await db.scalars(select(FileRecord).where(FileRecord.manifest_id == manifest.id))).all()
            try:
                for chunk in chunks:
                    connection = await db.get(CloudConnection, chunk.connection_id)
                    if not connection or not connection.encrypted_creds:
                        raise RuntimeError("Cloud credentials missing during striped cleanup")
                    await provider_for(connection.provider).delete(
                        connection, decrypt_credentials(connection.encrypted_creds), chunk.object_key, chunk.id,
                    )
                charged = sum(chunk.size_bytes for chunk in chunks if chunk.status == "active")
                if charged:
                    quota = await db.scalar(select(Quota).where(Quota.user_id == manifest.user_id).with_for_update())
                    quota.used_bytes = max(0, quota.used_bytes - charged)
                final = "deleted" if charged else "cancelled" if manifest.status == "cleanup_pending" else "expired"
                manifest.status = final
                for chunk in chunks:
                    chunk.status = final
            except Exception:
                logger.exception("Striped cleanup failed for manifest %s", manifest.id)
                manifest.status = "cleanup_failed"
            affected.add(manifest.user_id)
        await db.commit()
    for user_id in affected:
        await invalidate_quota(user_id)
    return len(files) + len(manifests)


async def _purge_expired_tokens():
    """Revocation, refresh and reset rows are useless after expiry; keep the tables bounded."""
    now = datetime.now(timezone.utc)
    async with SessionLocal() as db:
        removed = 0
        for model in (AccessRevocation, RefreshSession, PasswordReset):
            result = await db.execute(delete(model).where(model.expires_at < now))
            removed += result.rowcount or 0
        await db.commit()
    return removed


@celery_app.task(name="app.workers.tasks.purge_expired_tokens")
def purge_expired_tokens():
    return asyncio.run(_purge_expired_tokens())


@celery_app.task(name="app.workers.tasks.cleanup_expired_uploads")
def cleanup_expired_uploads():
    return asyncio.run(_cleanup())
