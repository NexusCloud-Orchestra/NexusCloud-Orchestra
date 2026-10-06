import asyncio
import logging
from datetime import datetime, timezone
from sqlalchemy import delete, select

from app.core.security import decrypt_credentials
from app.db.models import AccessRevocation, CloudConnection, FileRecord, PasswordReset, RefreshSession
from app.db.session import SessionLocal
from app.services.providers import provider_for
from app.services.quota import invalidate_quota
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


async def _cleanup():
    async with SessionLocal() as db:
        files = (await db.scalars(select(FileRecord).where(
            FileRecord.status.in_(("pending", "cleanup_failed")),
            FileRecord.upload_expires_at < datetime.now(timezone.utc)
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
        await db.commit()
    for user_id in affected:
        await invalidate_quota(user_id)
    return len(files)


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
