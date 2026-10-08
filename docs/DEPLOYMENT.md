# Production image release

The API and browser app are separate container images. The API image includes the locked Python environment and Alembic migrations. The web image serves the Vite build through unprivileged Nginx.

## Local builds

```bash
docker build -t nexuscloud-api:local .
docker build --build-arg VITE_API_URL=https://api.example.com -t nexuscloud-web:local ./frontend
```

The web build requires the public API origin; Vite embeds it in browser code. Use the same origin for `PUBLIC_API_URL` in the API service.

For local Compose, set `.env` from `.env.example`, then start the database, apply the fresh baseline, and start the product:

```bash
docker compose build
docker compose run --rm api alembic upgrade head
docker compose up -d
```
The web UI is available on port 8080. `PUBLIC_API_URL` must be reachable by the user's browser.

## Automated checks

Every pull request and push to `dev` or `main` audits locked Python runtime dependencies and production frontend dependencies, runs backend tests, a fresh SQLite migration and drift check, a Python wheel build, the frontend typecheck and build, and both container builds. CI also starts the built images, applies a fresh API migration, checks `/health` on both services, and verifies SPA route fallback.
Tagged pushes run those checks before image publication.

## Release images

Set the repository Actions variable `VITE_API_URL` to the production HTTPS API origin before creating a `v*` tag. The workflow fails before publishing if it is unset.
Tags publish `ghcr.io/<owner>/<repo>-api:<tag>` and `ghcr.io/<owner>/<repo>-web:<tag>` using `GITHUB_TOKEN`; the owner and repository name are lowercased.
The tag identifies the tested source revision. Configure package visibility and deployment access in GitHub for the target environment.

## Runtime

Run the API on port 7575 and the web image on port 8080 behind HTTPS. Supply runtime settings through the deployment platform, never as image build arguments.

- Set independent `SECRET_KEY` and `ENCRYPTION_KEY` values and a PostgreSQL `DATABASE_URL`.
- Set `REDIS_URL`, `PUBLIC_API_URL`, `FRONTEND_URL`, and explicit HTTPS `CORS_ORIGINS`.
- Set `SMTP_HOST` and `SMTP_FROM` so password recovery works in production.
- Leave `LOCAL_STORAGE_ENABLED=false`; make each cloud bucket allow the browser's signed PUT headers through CORS.

## Cross-cloud striping

Files larger than 16 MiB are striped when the account has at least two active, different provider types. The browser hashes 16 MiB chunks, requests placement, uploads each chunk directly to its assigned BYOC bucket, and confirms the manifest. Upload and retrieval share a versioned index that commits to ordered content and cloud placement; see [the stripe index specification](STRIPING.md). The API stores placement metadata and hashes, not file bytes.

This is striping, not replication or erasure coding: losing any chunk makes the file unavailable. Supported browsers save verified chunks incrementally; other browsers can download up to 512 MiB through a bounded in-memory fallback. Cloud providers can honor an issued signed PUT URL until its 15-minute expiry. Cancelling a striped upload releases its quota reservation immediately but blocks disconnect/account deletion until the cleanup worker sweeps the chunks after that window. Keep Celery beat and workers healthy; alert on `cleanup_failed` rows. The API verifies object existence and size at confirmation, but cannot independently verify the client-asserted content hash without reading the object.

Run `alembic upgrade head` once with the API image and the production database settings before starting API replicas.
The current baseline is for a new database; installations on either legacy Alembic lineage need a planned data migration first.

Run Celery workers from the same API image. Keep exactly one beat scheduler (`worker -B` on a single worker or a separate beat process).
The frontend's `/health` and API's `/health` endpoints can be used for service health checks.
The workflow publishes images; deploying them to a cloud environment still requires the target account's credentials and rollout configuration.

## Live provider acceptance

Run `scripts/live_provider_smoke.py` against a deployed API for each provider that must be supported at launch. It creates a temporary account, connects one bucket, uploads and downloads 1 KiB through signed URLs, verifies quota changes, and removes the file, connection, and account. Use a dedicated test bucket with browser PUT/GET CORS configured. The script reports any resource it could not remove.

```bash
export NEXUS_API_URL=https://api.example.com
export NEXUS_PROVIDER=aws
export NEXUS_BUCKET=dedicated-test-bucket
export NEXUS_REGION=us-east-1
export NEXUS_PROVIDER_CREDENTIALS_JSON='{"aws_access_key_id":"...","aws_secret_access_key":"..."}'
uv run python scripts/live_provider_smoke.py
```

Set provider-specific credential fields as documented by the connection API. Do not add real credentials to source control or CI logs. Repeat for at least three launch providers and record the tested image tag, provider, region, and result.
