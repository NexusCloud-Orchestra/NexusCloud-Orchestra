from celery import Celery
from app.core.config import settings

celery_app = Celery("nexuscloud", broker=settings.REDIS_URL, include=["app.workers.tasks"])
celery_app.conf.update(
    task_serializer="json", accept_content=["json"], timezone="UTC", enable_utc=True,
    beat_schedule={"cleanup-expired-uploads": {"task": "app.workers.tasks.cleanup_expired_uploads", "schedule": 300.0}},
)
