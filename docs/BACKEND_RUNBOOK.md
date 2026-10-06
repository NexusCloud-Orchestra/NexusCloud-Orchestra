# Backend runbook

Copy `.env.example` to `.env` and replace both secrets with independent random values. For local development, start PostgreSQL and Redis and set `DATABASE_URL` and `REDIS_URL` accordingly. `LOCAL_STORAGE_ENABLED=true` enables a local signed data-plane emulator for the repository's `tests/test_flow.py`; leave it false for real providers. In production set `ENVIRONMENT=production`, HTTPS `PUBLIC_API_URL` and `FRONTEND_URL`, `SMTP_HOST`/`SMTP_FROM`, and explicit HTTPS `CORS_ORIGINS`.

Run:

```bash
uv sync --extra test
uv run alembic upgrade head
uv run uvicorn app.main:app --host 0.0.0.0 --port 7575 --no-access-log
uv run celery -A app.workers.celery_app:celery_app worker -B --loglevel=info
```

The worker clears expired upload reservations and attempts to remove orphaned uploaded objects every five minutes. Failed cloud cleanup is retried on the next run. Avoid `worker -B` on multiple replicas; run a single beat scheduler if scaling workers. Tests use SQLite and fakeredis:

```bash
uv run pytest tests/test_backend.py
```

Two old root migrations in `alembic/versions` conflict and describe incompatible schemas. They are preserved for reference. `alembic.ini` now points to a new baseline in `alembic/backend_versions`. This baseline is for a **new database**. An existing database created by either old lineage needs a planned data migration before switching; do not apply the new baseline to it.

Cloud buckets/containers must allow browser PUT with the provider's `required_headers`. Signed URLs keep file bytes outside the NexusCloud production API. Oracle OCI PARs may require separate lifecycle management depending on bucket policy. The service currently estimates provider free-tier capacity rather than reading billing entitlements, so quotas are admission estimates, not provider-enforced guarantees.

The orchestrator uses its own quota service and tables. The older standalone `quota-engine/` directory is preserved but not invoked by the new API.
