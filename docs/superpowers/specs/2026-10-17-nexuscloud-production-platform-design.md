# NexusCloud Production Platform — Design Spec

- **Date:** 2026-10-17
- **Status:** Draft, awaiting owner review
- **Supersedes:** nothing; builds on the current `dev` branch (commit `3e3d2ee`)

## 1. Intent

### What the owner asked for
- Make NexusCloud a production-ready product, launched publicly.
- Promote and pilot it with the owner's college; anyone outside the college can also use it.
- College projects should be able to use NexusCloud ("deployed on this").
- Proper OOP, SOLID, system design, a security and governance layer, guardrails, reliable cloud connectivity.
- Users can connect their own hosted server.

### Decisions made during brainstorming
| Topic | Decision |
|---|---|
| "Deploy projects on this" | **Staged.** Phase scope here = NexusCloud as a storage backend for projects (API keys + SDK). App hosting (PaaS) is a separate future spec. |
| Tenancy | **Open signup.** Personal workspace for everyone; anyone can create an Organization; the owner's college is the pilot org with email-domain auto-join. |
| Own hosted server | **S3-compatible endpoints** (MinIO, Garage, Ceph RGW, SeaweedFS, NAS S3). Outbound agent for NAT'd servers is a future phase. |
| Hosting | **Portable.** Containers + 12-factor config; start on free tiers; managed services (KMS, Cloud SQL) are optional adapters. |
| Architecture | **Modular monolith, hexagonal layers.** No microservices. |

### Success criteria
1. All P0/P1 findings from the 2026-10-17 audit are fixed and covered by tests.
2. A student can: sign up → verify email → join college org → create project → connect MinIO or a public cloud → issue an API key → upload/download from their own app via SDK.
3. No tenant can read or modify another tenant's data (proven by an automated isolation test suite).
4. Self-hosted endpoints cannot be used to reach private, loopback, or metadata addresses from the API server (proven by an SSRF test table).
5. CI runs against real PostgreSQL, Redis and MinIO; import-boundary rules enforce the module architecture.
6. The platform runs on free-tier infrastructure with documented upgrade paths.

### Non-goals (this spec)
- App hosting / build pipelines / custom domains (future spec "Product B").
- Outbound storage agent for NAT'd servers (future).
- Erasure coding / replication (future; striping keeps its current no-redundancy semantics and is labeled as such in the UI).
- Paid billing integration. Tiers exist; payment does not.
- SSO (SAML/OIDC). Email-domain auto-join only.
- Custom role builder.

## 2. Phasing

Each phase gets its own implementation plan and ships independently.

| Phase | Scope | Exit criteria |
|---|---|---|
| **0 Harden** | Audit P0/P1 fixes; Postgres+Redis in CI; liveness/readiness; Sentry; proxy-aware IP | Audit items 1–12 closed with tests |
| **1 Restructure** | Hexagonal modules; file state machine; provider adapter registry; reservation ledger; repo hygiene | Behavior parity; existing tests pass; import-linter green |
| **2 Tenancy + governance** | Orgs, projects, memberships, invites, RBAC, policy engine, API keys, super-admin, abuse guardrails | Isolation + permission-matrix suites green |
| **3 Bring your own server** | `s3_compatible` provider, SSRF guard, CORS check, health checker, envelope-encrypted vault, MinIO guide | SSRF table green; MinIO E2E green |
| **4 Developer platform** | Public API v1 for API keys, JS + Python SDKs, multipart/resumable uploads, idempotency keys, docs | SDK E2E against staging |
| **5 Launch** | Deployment, onboarding, terms/privacy, status page, pilot org setup | Pilot cohort onboarded |

## 3. Architecture

### 3.1 Layout

```
app/
  main.py                 # composition root: container wiring, routers, middleware
  core/                   # config, logging, error mapping, request context, DI container
  shared/                 # Entity, ValueObject, DomainError hierarchy, Clock, IdGenerator, UnitOfWork, Outbox
  modules/
    identity/             # users, email verification, sessions (refresh cookie), passwords, API keys
    tenancy/              # organizations, projects, memberships, invites, domain auto-join
    governance/           # permissions, role table, policy engine, quotas, rate limits
    storage/              # connections, files, manifests, placement, striping, cleanup, health
    audit/                # append-only audit events and queries
    platform_admin/       # superadmin: suspend, abuse reports, tier changes, global limits
  workers/                # Celery tasks: thin wrappers that call application use cases
```

Each module:

```
<module>/
  domain/          entities, value objects, state machines, domain events (no framework imports)
  application/     use cases (one class per use case, `execute(command) -> result`)
                   ports/ (abstract base classes the use cases depend on)
  infrastructure/  SQLAlchemy models + repositories, SDK adapters, Redis, KMS
  api/             FastAPI router + Pydantic request/response DTOs
```

### 3.2 Dependency rules (enforced by `import-linter` in CI)
- `domain` imports only `shared` and the standard library.
- `application` imports `domain`, `shared`, and its own `ports`.
- `infrastructure` implements ports; may import SDKs and SQLAlchemy.
- `api` imports `application` only (plus DTOs). Routes never touch sessions, models, or SDKs.
- Cross-module calls go through the other module's application interface (e.g. `storage` calls `governance.Authorizer`), never its tables.
- `main.py` is the only place concrete classes are wired to ports.

### 3.3 SOLID mapping
- **S:** one use case per class; one adapter per provider family; one policy per class.
- **O:** new provider = new adapter registered in `ProviderRegistry`; new policy = new `Policy` subclass added to the engine config.
- **L:** every `StorageProvider` adapter passes the same contract test suite.
- **I:** narrow ports (`FileRepository`, `CredentialVault`, `Presigner`, `ObjectInspector`) rather than one god interface.
- **D:** use cases receive ports via constructor injection from the container.

### 3.4 Request pipeline
`RequestID → BodyLimit → ClientIP (trusted proxies) → Authenticate (cookie session | API key) → RateLimit (IP + actor) → use case [Authorize → Policies → domain logic → UnitOfWork commit (+ outbox)] → Audit`

Middleware is pure ASGI (not `BaseHTTPMiddleware`).

### 3.5 Runtime
- `api` container (uvicorn, `--proxy-headers`, trusted proxy list from config).
- `worker` container (Celery), `beat` container (exactly one).
- `migrate` one-shot job run before deploy.
- PostgreSQL 16, Redis 7. Optional: Cloud KMS, Sentry, OTLP collector.
- The worker uses its own engine with `NullPool`, one event loop per process (no per-task `asyncio.run` against a shared pool).
- Redis: one shared connection pool created in lifespan.

## 4. Identity

- **Sessions:** access JWT (15 min) in memory on the client; refresh token in an `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth` cookie. Refresh-token **family** tracking: reuse of a rotated token revokes the whole family and audits `SESSION_REUSE_DETECTED`.
- Cross-tab refresh coordinated with `BroadcastChannel` + Web Locks; the cookie removes the shared-storage race.
- `dev_token` URL login is deleted. No tokens in URLs, `localStorage`, or logs.
- Passwords: bcrypt cost 12 in a worker thread; constant-time login path (dummy hash on unknown email); breached-password check against the k-anonymity HIBP range API (fail-open on outage).
- Email verification is required before connecting storage, creating API keys, or creating orgs.
- Login lockout: exponential backoff per account + per IP; Cloudflare Turnstile on signup, and on login after 3 failures.
- **API keys:** format `nc_live_<key_id>_<secret>`; store `key_id` + SHA-256 of secret; shown once; project-scoped; scopes `files:read`, `files:write`, `files:delete`; optional expiry; `last_used_at`; per-key rate limit; instant revocation.

## 5. Tenancy

### 5.1 Model
```
User ─< Membership(org_role) >─ Organization(tier, verified_domain?) ─< Project ─< ProjectMember(project_role)
Organization ─< Connection (org-shared, granted to projects)   Project ─< Connection (project-owned)
Project ─< File, Manifest, ApiKey
```
- Signup auto-creates a personal org (`kind=personal`) with one default project. A personal org cannot add members.
- Organizations have `tier ∈ {standard, verified}`; superadmin grants `verified`.
- **Domain auto-join:** a verified org may claim email domains (proved by superadmin approval, or a DNS TXT record). Users with a verified email on that domain see a "Join <Org>" prompt; the org setting chooses instant join or admin approval.
- Invites: signed, single-use, 7-day expiry, bound to the invited email.
- Every repository method takes the tenant scope (`org_id`/`project_id`) as a required argument; there is no unscoped query method on tenant data.

### 5.2 Migration of existing data
Each existing user gets a personal org + default project; existing connections and files are moved into that project. Done in an expand → backfill → contract migration sequence.

## 6. Governance

### 6.1 Roles and permissions
| Scope | Role | Grants |
|---|---|---|
| Org | owner | all org + project permissions, delete org, transfer ownership |
| Org | admin | manage members, invites, org policies, org connections, all projects, read audit |
| Org | member | access to projects they are a member of |
| Project | maintainer | manage project connections, API keys, project members, project policies |
| Project | developer | file upload, download, delete; read connections |
| Project | viewer | file list, download |
| Platform | superadmin | suspend/unsuspend users and orgs, tiers, domain approval, abuse reports, global limits, read all audit |

- Code checks `Permission` enums (`FILE_UPLOAD`, `FILE_DELETE`, `CONNECTION_MANAGE`, `APIKEY_MANAGE`, `MEMBER_MANAGE`, `POLICY_MANAGE`, `AUDIT_READ`, …), resolved through a single role→permission table.
- API keys carry scopes that are intersected with the issuing project's permissions.
- Superadmin is a flag on `User`, settable only via a CLI command run against the database (never via API).

### 6.2 Policy engine
- `Policy.evaluate(ctx) -> Allow | Deny(code, message, limit)`; the engine evaluates all applicable policies and returns the first deny.
- Layering: platform → tier → org → project. A lower layer can only tighten a limit; attempts to loosen are rejected at write time.
- Initial policies: storage bytes quota; file count; max file size; MIME/extension allow/deny list (executables denied by default on org-shared connections); provider allowlist; retention days; striping allowed; max projects per org; max API keys per project.

### 6.3 Default limits (configurable)
| | standard | verified |
|---|---|---|
| Projects per org | 3 | 50 |
| API keys per project | 2 | 10 |
| Requests/min per actor | 100 | 600 |
| Max file size | 1 GiB | 5 GiB (single), 5 GiB striped |
| Org members | 5 | 2000 |

(The bytes quota stays bounded by the user's own connected capacity; NexusCloud stores no bytes.)

### 6.4 Abuse controls
- Suspension of a user/org revokes sessions and API keys immediately and blocks new URL issuance.
- `POST /abuse-reports` (authenticated or Turnstile-protected), reviewed in the superadmin console.
- Signed download URLs are short-lived (≤ 15 min for API keys, ≤ 60 min for sessions).

### 6.5 Audit
- Append-only `audit_events` table (no UPDATE/DELETE grants for the app role): `id, occurred_at, actor_type (user|api_key|system), actor_id, org_id, project_id, action, target_type, target_id, result, ip, user_agent, request_id, metadata(jsonb, allowlisted keys)`.
- Never stores credentials, tokens, file contents, or signed URLs.
- Org admins query their org; superadmin queries all. Retention: 1 year, then purge job.

## 7. Storage and connectivity

### 7.1 Provider model
- `ConnectionSpec`: `provider_type ∈ {aws_s3, s3_compatible, r2, b2, ibm_cos, gcs, azure_blob, oci}`, `endpoint?`, `bucket`, `region?`, `declared_capacity_bytes?`, `credential_ref`.
- Ports: `Presigner` (`presign_put`, `presign_get`, `presign_multipart`), `ObjectInspector` (`head`, `usage?`), `ObjectDeleter`, `ConnectionVerifier` (`verify`, `check_cors`).
- Adapters: `S3FamilyAdapter` (aws_s3, s3_compatible, r2, b2, ibm_cos via endpoint strategies), `GcsAdapter`, `AzureBlobAdapter`, `OciAdapter`. Clients are cached per connection with a TTL; all SDK calls (including signing) run in threads.
- Every adapter passes a shared contract test suite (MinIO in CI for the S3 family; recorded fakes for others).

### 7.2 Self-hosted endpoint guardrails (`EndpointGuard`)
- Scheme `https` only in production; publicly trusted TLS; port 443 or 9000; no userinfo, path, query or fragment.
- Resolve DNS on every server-side call; reject if **any** resolved address is loopback, RFC1918, link-local, CGNAT (100.64/10), unique-local IPv6, multicast, unspecified, or the metadata address `169.254.169.254` / `fd00:ec2::254`.
- Connect to the validated IP with SNI/Host set to the original hostname (custom transport), defeating DNS rebinding.
- No redirect following; connect timeout 3 s, read timeout 10 s; response body cap 1 MiB for control-plane calls.
- Operator-level `PRIVATE_ENDPOINT_ALLOWLIST` (CIDRs) for on-premises deployments; empty by default.
- Docs: Cloudflare Tunnel recipe for MinIO behind NAT; one-command `docker compose` MinIO with TLS via the tunnel.

### 7.3 Verification on connect
1. `EndpointGuard` checks. 2. Credentials work on the bucket (head/put/get/delete of a probe object, then delete). 3. CORS includes the NexusCloud web origin with `PUT, GET` and the required headers; if not, return an actionable `cors_misconfigured` error with the exact JSON/XML to paste. 4. Warn (not block) if the credentials can list all buckets.

### 7.4 Capacity
- Public clouds: catalog free-tier value is the default; user may lower it.
- Self-hosted: user must declare capacity; where `usage()` is available it is checked nightly.
- The placement router uses `min(declared, catalog) - ledger_committed - ledger_reserved`.

### 7.5 Health
- Worker probes each active connection every 5 min (head of bucket, ≤ 3 s).
- States `healthy | degraded | unreachable` with a per-connection circuit breaker (open after 3 consecutive failures, half-open after 5 min).
- Placement excludes non-healthy connections. Owners are notified on transition to `unreachable`.

### 7.6 Credential vault
- Envelope encryption: per-connection data key (AES-256-GCM); data key wrapped by `KeyManager` (`CloudKmsKeyManager` or `LocalKeyManager` with a versioned master key set from env).
- Ciphertext header: `version byte | key_id | wrapped_dek | nonce | ciphertext`.
- AAD = `connection_id || org_id`.
- Rotation: new master key version → background re-wrap job. Decryption only inside adapter calls; audited as `CREDENTIAL_USE` (sampled to 1 per connection per hour).

## 8. File lifecycle and data flow

### 8.1 State machine (domain class `FileLifecycle`)
`RESERVED → VERIFYING → ACTIVE → DELETING → DELETED`
`RESERVED | VERIFYING → CLEANUP_PENDING → CLEANED` (cancel, expiry, or failed verify)
`ACTIVE → DELETING` also via retention expiry.
- `CLEANUP_PENDING` waits until every issued URL has expired before deleting objects (fixes the single-file cancel orphan).
- `DELETING` is persisted before any provider delete (fixes delete ordering).
- Failed cleanup/delete retries with exponential backoff; after 10 attempts the record is flagged and alerted.
- Single and striped files share the lifecycle; a striped manifest owns its chunks' lifecycle.

### 8.2 Upload
1. `RequestUpload`: authorize → policies → choose placement (health-aware) → ledger `reserve` → persist `RESERVED` + outbox event → commit. No network I/O inside the transaction.
2. Presign outside the transaction. S3 family: sign `Content-Length` and `x-amz-checksum-sha256` when the client supplies a checksum; Azure: `Content-MD5`; GCS: `x-goog-hash` where supported.
3. Files > 64 MiB use multipart/resumable (S3 multipart, GCS resumable session, Azure block list), parts of 16 MiB, up to 4 in parallel, per-part retry, resume from local state after reload.
4. `ConfirmUpload`: provider HEAD(s) outside any transaction → short transaction re-reads the record `FOR UPDATE`, re-checks state, transitions `VERIFYING → ACTIVE`, ledger `commit`.

### 8.3 Quota ledger
- `quota_ledger(id, project_id, connection_id, file_id, kind ∈ {reserve, commit, release}, bytes, created_at)`; balances derived by aggregation and cached in Redis.
- Nightly reconciliation compares ledger totals with `usage()` and file records; drift is logged and surfaced to superadmin.

### 8.4 Reliability primitives
- **Outbox:** `outbox_events` written in the same transaction; worker dispatches to audit, notifications, webhooks (webhooks are future). At-least-once; consumers idempotent.
- **Idempotency keys:** `Idempotency-Key` header on all mutating endpoints; stored response for 24 h keyed by `(actor, key)`.
- Frontend upload queue limits concurrency to 3 files.

## 9. Error model
`DomainError` → `NotFound`, `Forbidden`, `Unauthenticated`, `PolicyViolation(code, limit)`, `Conflict`, `ValidationFailed`, `RateLimited(retry_after)`, `ProviderUnavailable`, `ProviderRejected`. A single mapper produces `{"error": {"code", "message", "request_id", "details?"}}`. Provider exception text and stack traces never reach clients.

## 10. Observability and operations
- JSON logs with `request_id`, `actor`, `org_id`, `project_id`.
- OpenTelemetry tracing (FastAPI, SQLAlchemy, httpx/botocore) exported via OTLP when configured.
- Prometheus `/metrics` (internal only): HTTP latency/errors, uploads by outcome, provider call latency/errors by type, Celery queue depth, `cleanup_flagged` gauge, ledger drift.
- Sentry for API, worker and frontend (free tier).
- `/livez` (process only) and `/readyz` (DB + Redis).
- Nginx: security headers in every location (via include), CSP, HSTS; SPA lazy-loads `/app` routes; same-origin `/api` proxy option so one image serves any environment.
- Landing animation frames replaced by a compressed video/AVIF sequence served with long cache; frames removed from the repo.

## 11. Security baseline (beyond the above)
- CORS: explicit origins; credentials allowed only for the web origin (cookie refresh).
- CSRF: refresh/logout endpoints require `SameSite=Strict` cookie + custom header check.
- Secrets only via env/secret manager; startup refuses placeholder or weak secrets in production (existing `assert_safe`, extended).
- Dependency, container (Trivy) and secret (gitleaks) scanning in CI.
- Postgres app role has no DDL rights; migrations use a separate role.
- Backups: daily logical dump + point-in-time where the host supports it; restore drill documented.

## 12. Testing strategy
| Layer | Tooling | Covers |
|---|---|---|
| Domain unit | pytest | lifecycle transitions, policies, placement, striping, ledger math |
| Application | pytest + in-memory fakes | every use case incl. failure paths |
| Integration | pytest + Postgres, Redis, MinIO service containers | repositories, locking/concurrency (parallel reservations cannot overbook), outbox, worker tasks |
| Contract | shared suite per `StorageProvider` adapter | presign/head/delete semantics |
| Security | pytest tables | SSRF endpoint table, tenant isolation for every route with foreign IDs, role×permission matrix, session reuse, API-key scopes |
| Frontend | Vitest | upload queue, multipart resume, striping index |
| E2E | Playwright | signup → verify → project → connect MinIO → upload → download → delete |

CI gates: ruff, mypy (strict on `domain`/`application`), import-linter, `tsc`, eslint, pip-audit, npm audit, Trivy, gitleaks, Alembic upgrade + check on Postgres.

## 13. Repository hygiene (Phase 1)
Remove `quota-engine/`, legacy `alembic/versions/` and tracked `.pyc`, committed `storage/` fixtures, root `task.md`/`design.md` duplicates; move `aiosqlite` to test extras; add `CONTRIBUTING.md`, `SECURITY.md`; align versions; untrack heavy landing media.

## 14. Risks
| Risk | Mitigation |
|---|---|
| Restructure regresses behavior | Phase 1 is behavior-preserving; existing 22 tests plus new integration tests gate it |
| Tenancy migration of existing data | expand → backfill → contract; dry run against a production snapshot |
| SSRF bypass | defense in depth: guard + pinned-IP transport + no redirects + egress network policy where host supports it |
| Free-tier limits (DB connections, Redis commands) | pool sizing per instance, Redis used only for cache/rate limits/broker, documented upgrade path |
| Striping data loss | UI labels striping as non-redundant; erasure coding is the next storage feature after launch |
| Scope creep toward app hosting | explicitly out of scope; separate spec |
