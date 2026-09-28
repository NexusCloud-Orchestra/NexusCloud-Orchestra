"""
Celery tasks for the Quota Engine worker.

Tasks are automatically discovered by the Celery worker because
``app.worker.tasks`` is listed in ``celery_app.include``.

Add new domain tasks (quota resets, usage aggregation, etc.) in this module.
"""

import logging
from datetime import datetime, timezone

from app.worker.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.worker.tasks.test_quota_task", bind=True)
def test_quota_task(self) -> dict:
    """
    Smoke-test task that verifies the Celery + Redis pipeline end-to-end.

    Returns a dict with the task id and an ISO timestamp so that callers
    can confirm the result was stored in the Redis backend.
    """
    executed_at = datetime.now(timezone.utc).isoformat()
    logger.info("[Celery] test_quota_task executing — task_id=%s", self.request.id)

    result = {
        "status": "success",
        "message": "Quota worker is working",
        "task_id": self.request.id,
        "executed_at": executed_at,
    }

    logger.info("[Celery] test_quota_task completed — %s", result)
    return result