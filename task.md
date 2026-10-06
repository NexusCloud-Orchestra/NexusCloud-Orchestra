# NexusCloud backend build

Source of truth: `docs/context.md`, `docs/PRD.md`, `docs/BRD.md`.

## Phase 1 — Foundation
- [x] Configuration and production safety checks
- [x] Async database models, session, migrations
- [x] Cryptography, typed schemas, service boundaries

## Phase 2 — Identity
- [x] Registration, login, access/refresh rotation, logout
- [x] Password reset/change, plans, audit trail

## Phase 3 — Cloud connections
- [x] Encrypted credentials and connection lifecycle
- [x] Provider strategy implementations and catalog

## Phase 4 — Files and quota
- [x] Smart placement router and quota reservation
- [x] Signed upload/download, confirmation, deletion
- [x] Quota summary and cache invalidation

## Phase 5 — Guardrails
- [x] Rate limits, CORS, security headers, request IDs, error envelope
- [x] Input limits, user isolation, audit logging

## Phase 6 — Operations
- [x] Expired upload cleanup task, migrations, Docker and runbook

## Phase 7 — Verification
- [x] End-to-end and security tests

## Phase 8 — Frontend handoff
- [x] API contract, flows and page features for Kimi

## Phase 9 — PRD/BRD gap closure (2026-10-06)
- [x] Read-only Smart Router preview `POST /files/route-preview` exposing ranking and weighted components (FR-001, PRD "explain the decision"); upload path now shares the same placement function
- [x] `POST /files/cancel-upload/{id}` releases a pending reservation immediately after a failed browser PUT
- [x] `POST /auth/delete-account` (BRD 11.1 right to deletion), password-confirmed, blocked while cloud objects are tracked
- [x] Additive fields: `File.provider`, `UploadTicket.connection_id`, `QuotaSummary.{total_reserved_bytes,plan,plan_limit_bytes}`; typed `QuotaSummaryOut` response model
- [x] Structured logs include `user_id` and `duration_ms` (NFR-005)
- [x] Hourly worker purge of expired access revocations, refresh sessions and reset tokens
- [x] Rate limit also covers `change-password` and `delete-account` (password-verifying endpoints)
- [x] Frontend wired: Smart Routing page uses the preview (no more reserving dry run), upload queue cancels failed reservations, files show `provider`, Settings has account deletion

## Phase 10 — Production image release (2026-10-06)
- [x] Locked, non-root API image and static frontend image with SPA routing and health endpoint
- [x] Local Compose web service and documented migration/startup sequence
- [x] PR checks and tag-triggered GHCR image publication; compatible frontend dependency security updates
- [ ] Run image smoke tests and configure the target environment's deployment rollout

## Verification log

- 2026-10-05: New baseline migration applied to temporary SQLite database; `alembic check` found no model drift.
- 2026-10-05: Python package wheel built successfully.
- 2026-10-05: Eight SQLite/fakeredis/offline-provider tests passed: full file lifecycle, user isolation, token rotation/logout, plan guard, input and signed-URL guards, rate limiting, single-use password reset, S3/Azure signing, and production configuration checks.
- 2026-10-05: Docker Compose configuration validated.
- 2026-10-05: Original `tests/test_flow.py` passed against a live localhost API with a fresh temporary SQLite database and local signed storage.
- 2026-10-06: 13 backend tests passed (5 new: route preview, cancel upload, file provider, account deletion, token purge). `alembic check` reports no drift (no schema change). `tests/test_flow.py` passed against live uvicorn. Frontend `npm run build` passed.
- 2026-10-06: Locked Python sync, fresh SQLite migration/drift check, wheel build, clean frontend install/build, and workflow/Compose YAML parsing passed. Image builds could not run: Docker daemon access and Compose plugin are unavailable.
- 2026-10-05: Disabled server access logs after finding they exposed signed URL query tokens; structured application logs omit query strings.

## Boundaries and follow-up

- Live AWS/Azure/GCP/R2/B2/OCI/IBM credentials, PostgreSQL, Redis and Docker were unavailable for live integration in this environment. Provider-specific classes are implemented but real-cloud behavior still needs sandbox tests with credentials.
- The two legacy Alembic roots conflict. The new migration lineage is for a fresh database; existing installations need a data migration.
- Paid upgrades are blocked until verified billing is integrated. Team seats, 2FA, API keys, live analytics and file splitting are later PRD phases without a backend contract yet.
- React Router 6 and Vite 5 still have npm audit advisories that require major-version migrations; compatible dependency updates cleared the other reported advisories.
- The platform uses an in-process quota service against its own database; the existing standalone `quota-engine/` is not wired into this API.
- PRD US-006 asks both for immediate credential purge on disconnect and continued access to files on that cloud. Those requirements conflict. The implemented safe behavior returns 409 until files are removed, then purges credentials.
