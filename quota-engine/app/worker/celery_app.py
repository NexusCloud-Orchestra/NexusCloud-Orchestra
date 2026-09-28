"""
Celery application factory for the Quota Engine worker.

Redis is used as both the message broker and the result backend.
The REDIS_URL is read from the environment (via .env) so that the
same configuration is shared between the FastAPI app and the worker.
"""

from celery import Celery
import os

from dotenv import load_dotenv

# Load .env before reading env vars so REDIS_URL is populated correctly
# when the worker is started from the command line.
load_dotenv()

REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# ---------------------------------------------------------------------------
# Celery application
# ---------------------------------------------------------------------------
celery_app = Celery(
    "quota_engine",
    broker=REDIS_URL,
    backend=REDIS_URL,
    # Explicit include ensures the worker discovers tasks even without
    # importing them from outside the worker package.
    include=["app.worker.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Prevent tasks from being silently swallowed; re-raise on failure.
    task_track_started=True,
)