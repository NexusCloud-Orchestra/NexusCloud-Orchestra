from celery import Celery
from celery.signals import worker_process_init

from app.core.config import settings
from app.core.observability import init_sentry

celery_app = Celery("nexuscloud", broker=settings.REDIS_URL, include=["app.workers.tasks"])
celery_app.conf.update(
    task_serializer="json", accept_content=["json"], timezone="UTC", enable_utc=True,
    beat_schedule={
        "cleanup-expired-uploads": {"task": "app.workers.tasks.cleanup_expired_uploads", "schedule": 300.0},
        "purge-expired-tokens": {"task": "app.workers.tasks.purge_expired_tokens", "schedule": 3600.0},
    },
)


@worker_process_init.connect
def _init_worker_sentry(**_):
    init_sentry("worker")
