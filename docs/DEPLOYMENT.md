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

Every pull request and push to `dev` or `main` runs the backend tests, a fresh SQLite migration and drift check, a Python wheel build, the frontend typecheck and build, and both container builds.
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

Run `alembic upgrade head` once with the API image and the production database settings before starting API replicas.
The current baseline is for a new database; installations on either legacy Alembic lineage need a planned data migration first.

Run Celery workers from the same API image. Keep exactly one beat scheduler (`worker -B` on a single worker or a separate beat process).
The frontend's `/healthz` and API's `/health` endpoints can be used for service health checks.
The workflow publishes images; deploying them to a cloud environment still requires the target account's credentials and rollout configuration.
