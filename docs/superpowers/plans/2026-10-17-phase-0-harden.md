# Phase 0 — Harden Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close every P0/P1 audit finding so NexusCloud is safe to launch for individual users, with tests running against real PostgreSQL in CI.

**Architecture:** Behavior-preserving fixes inside the current flat layout (`app/core`, `app/services`, `app/api/v1/routes`). No module restructure here — that is Phase 1. Each task fixes one failure class and pins it with tests; concurrency fixes are proven on Postgres, where `SELECT … FOR UPDATE` is real.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2 async (asyncpg / aiosqlite), Alembic, Celery, Redis, pytest + pytest-asyncio + fakeredis; React 18 + Vite + TypeScript, Vitest; Nginx; GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-17-nexuscloud-production-platform-design.md` (Phase 0 row of §2; §3.5, §4, §8.1, §10, §11).

## Global Constraints

- Python dependencies are added with `uv add` (runtime) or `uv add --optional test` (test) so `uv.lock` stays locked; CI runs `uv sync --locked`.
- Error responses keep the existing envelope `{"error": {"code", "message", "request_id", "details?"}}`.
- Access token TTL **15 minutes**; refresh token TTL **7 days**.
- Refresh cookie: name `nc_refresh`, `HttpOnly`, `SameSite=Strict`, `Path=/api/v1/auth`, `Secure` when `COOKIE_SECURE` is true.
- CSRF header on `/auth/refresh`: `X-NC-CSRF: 1`.
- Refresh-token reuse grace window: **30 seconds**.
- No tokens in URLs, `localStorage`, `sessionStorage`, or logs.
- Provider client cache: max **256** entries, TTL **300 s**.
- Tests that need real row locks are marked `@pytest.mark.postgres` and skipped unless `TEST_DATABASE_URL` is set; CI always sets it.
- Never commit to `dev` directly; work on a branch.

## Review Focus

1. **Two tabs refreshing at once** — a user with two tabs must not be logged out or have their session family revoked. Pinned by Task 2 (`test_refresh_reuse_within_grace_does_not_revoke_family`) and Task 3 (`refreshSession serializes across tabs with Web Locks`).
2. **Users returning with the old frontend's `localStorage` token** — they become anonymous cleanly, the legacy keys are erased, nothing crashes. Pinned by Task 3 (`clears legacy stored refresh tokens on load`).
3. **Local development over `http://localhost`** — login must still work when cookies cannot be `Secure`. Pinned by Task 2 (`test_cookie_secure_defaults_by_environment`).
4. **Spoofed `X-Forwarded-For` from an untrusted peer** — must not let a client dodge the rate limit. Pinned by Task 4 (`test_untrusted_forwarded_header_is_ignored`).
5. **Confirm racing a cancel** — exactly one wins; the loser gets 409; no quota double-count. Pinned by Task 8 (`test_confirm_after_concurrent_cancel_conflicts`).
6. **Student enables striping but only has AWS + Azure connected** — large uploads quietly use a single cloud instead of failing. Pinned by Task 12 (`shouldStripe` false with `["aws","azure"]`, `test_striping_ignores_temporary_free_tiers`).

---

## File Structure

| File | Responsibility |
|---|---|
| `tests/conftest.py` (create) | Shared `client` fixture (SQLite or Postgres), `signup` helper, `postgres` marker |
| `tests/test_backend.py` (modify) | Drop the fixture/helper now in conftest; update auth assertions |
| `tests/test_sessions.py` (create) | Cookie sessions, CSRF, reuse detection |
| `tests/test_guardrails.py` (create) | Client IP, rate limits, non-blocking hashing, probes, Sentry scrubbing |
| `tests/test_lifecycle.py` (create) | Cancel/delete lifecycle, derived quota, lock-free confirm |
| `tests/test_provider_clients.py` (create) | Client cache |
| `tests/integration/test_postgres_concurrency.py` (create) | Overbooking, lock-hold, worker loop tests |
| `app/core/config.py` (modify) | New settings |
| `app/core/redis.py` (create) | One Redis client per event loop |
| `app/core/client_ip.py` (create) | Trusted-proxy client IP resolution |
| `app/core/observability.py` (create) | Sentry init + scrubbing |
| `app/core/security.py` (modify) | Async hashing, dummy hash |
| `app/api/v1/routes/auth.py` (modify) | Cookie issuance, refresh families |
| `app/services/auth.py` (modify) | `create_tokens`, `rotate_refresh`, `revoke_sessions` |
| `app/services/client_cache.py` (create) | TTL/LRU cache for SDK clients |
| `app/services/providers.py` (modify) | Cached clients, threaded signing |
| `app/api/v1/routes/files.py`, `striped.py` (modify) | Lock-free verification, lifecycle states |
| `app/services/quota.py` (modify) | Derived usage, shared Redis |
| `app/workers/db.py` (create), `tasks.py` (modify) | Worker sessions, new cleanup states |
| `alembic/backend_versions/0004_refresh_families.py` (create) | `family_id`, `revoked_reason` |
| `frontend/src/api/client.ts`, `auth.ts` (modify) | Cookie refresh, Web Locks, no storage |
| `frontend/src/api/client.test.ts` (create) | Vitest for the session client |
| `frontend/nginx.conf`, `frontend/nginx/security-headers.conf.template` (create), `frontend/Dockerfile` | Headers on every location, CSP |
| `docker-compose.yml`, `Dockerfile`, `.github/workflows/verify-and-publish.yml` | migrate/beat services, probes, Postgres CI |

---

### Task 1: Shared test fixture and Postgres in CI

**Files:**
- Create: `tests/conftest.py`, `tests/integration/__init__.py`, `tests/integration/test_postgres_concurrency.py`
- Modify: `tests/test_backend.py` (remove `client` fixture and `signup`, import nothing they need from conftest — pytest injects fixtures; `signup` becomes a conftest-level function imported as `from tests.conftest import signup`), `pyproject.toml` (pytest config), `.github/workflows/verify-and-publish.yml`
- Move: `tests/test_flow.py` → `scripts/e2e_smoke.py` (it is a manual script against a running server, not a pytest test)

**Interfaces:**
- Produces: fixture `client` (an `httpx.AsyncClient` with attribute `test_session_factory: async_sessionmaker`); `async def signup(client, email: str) -> dict` (returns login JSON); marker `postgres`; env `TEST_DATABASE_URL` (asyncpg URL to a disposable DB).

- [ ] **Step 1: Create `tests/conftest.py`** with the existing fixture body moved verbatim from `tests/test_backend.py:37-57`, changed so the engine URL is `os.environ.get("TEST_DATABASE_URL")` or the SQLite tmp path; on Postgres run `Base.metadata.drop_all` then `create_all` at fixture start. Register marker `postgres` and auto-skip marked tests when `TEST_DATABASE_URL` is unset (`pytest_collection_modifyitems`). Add to `pyproject.toml`: `[tool.pytest.ini_options] asyncio_mode = "auto"`, `markers = ["postgres: needs real PostgreSQL row locks"]`.

- [ ] **Step 2: Run the existing suite on SQLite**

Run: `uv run --extra test pytest -q`
Expected: `22 passed` (moved test_flow no longer collected).

- [ ] **Step 3: Write the failing overbooking test** in `tests/integration/test_postgres_concurrency.py`:

```python
@pytest.mark.postgres
async def test_parallel_upload_requests_cannot_overbook_plan(client):
    tokens = await signup(client, "race@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    await client.post("/api/v1/connections", headers=headers, json=AWS_CONNECTION)  # same payload as test_full_flow
    body = {"original_name": "a.bin", "size_bytes": 1024**3, "mime_type": "application/octet-stream"}
    results = await asyncio.gather(*(client.post("/api/v1/files/upload-request", headers=headers, json=body) for _ in range(10)))
    assert sorted(r.status_code for r in results) == [200] * 5 + [400] * 5
```

- [ ] **Step 4: Run it against a local Postgres**

Run: `docker run -d --rm --name nc-pg -e POSTGRES_PASSWORD=pg -p 55432:5432 postgres:16-alpine && TEST_DATABASE_URL=postgresql+asyncpg://postgres:pg@localhost:55432/postgres uv run --extra test pytest -q`
Expected: all pass, including the new test (the user-row lock already exists; this pins it). If it fails, the existing locking is broken — stop and report.

- [ ] **Step 5: Update CI `backend` job.** Add services `postgres:16-alpine` (password `pg`, health `pg_isready`) and `redis:7-alpine`; set `TEST_DATABASE_URL=postgresql+asyncpg://postgres:pg@localhost:5432/postgres` and `TEST_REDIS_URL=redis://localhost:6379/15`; run `uv run --frozen pytest -q` (whole `tests/`); change the migration step's `DATABASE_URL` to the Postgres URL against a fresh database `nc_migrations` (create with `psql`) and keep `alembic upgrade head && alembic check`. In the `frontend` job add `npm run lint` before build.

- [ ] **Step 6: Commit**

```bash
git add tests pyproject.toml scripts/e2e_smoke.py .github/workflows/verify-and-publish.yml
git commit -m "test: shared fixture, Postgres-backed suite in CI"
```

---

### Task 2: Refresh token in an HttpOnly cookie with family reuse detection

**Files:**
- Create: `alembic/backend_versions/0004_refresh_families.py`, `tests/test_sessions.py`
- Modify: `app/core/config.py`, `app/db/models.py:116-123`, `app/services/auth.py`, `app/api/v1/routes/auth.py:43-81`, `app/schemas.py:51-72`, `app/main.py:105-111`, `tests/conftest.py` (set `COOKIE_SECURE=False` for http://testserver), `tests/test_backend.py:131-142`

**Interfaces:**
- Produces settings: `COOKIE_SECURE: bool | None = None` (property `cookie_secure -> bool`: explicit value, else `production`), `COOKIE_DOMAIN: str | None = None`, `REFRESH_REUSE_GRACE_SECONDS: int = 30`; `ACCESS_TOKEN_TTL_MINUTES` default → `15`. `assert_safe` rejects `COOKIE_SECURE is False` in production.
- Produces model: `RefreshSession.family_id: Uuid (not null, indexed)`, `RefreshSession.revoked_reason: str | None` (`"rotated" | "logout" | "reuse" | "password"`).
- Produces: `TokenOut = {access_token: str, token_type: "bearer", expires_in: int}` (no `refresh_token`). `async def create_tokens(db, user, family_id: UUID | None = None) -> tuple[TokenOut, str]` returns the response body and the raw refresh token. `async def revoke_sessions(db, user, reason: str) -> None`. `def set_refresh_cookie(response: Response, token: str) -> None`, `def clear_refresh_cookie(response: Response) -> None` in `app/services/auth.py`.
- `/auth/refresh` takes no body; reads cookie `nc_refresh`; requires header `X-NC-CSRF: 1` (else 403 `csrf_required`).
- CORS: `allow_credentials=True`; add `X-NC-CSRF` to `allow_headers`.

- [ ] **Step 1: Write failing tests** in `tests/test_sessions.py`:

```python
async def test_login_sets_httponly_cookie_and_hides_refresh_token(client):
    body = await signup(client, "c@example.com")
    assert "refresh_token" not in body and body["expires_in"] == 900
    # assert the login response's set-cookie contains: nc_refresh=, HttpOnly, SameSite=strict, Path=/api/v1/auth

async def test_refresh_requires_csrf_header(client):
    await signup(client, "csrf@example.com")
    assert (await client.post("/api/v1/auth/refresh")).status_code == 403
    assert (await client.post("/api/v1/auth/refresh", headers={"X-NC-CSRF": "1"})).status_code == 200

async def test_refresh_reuse_within_grace_does_not_revoke_family(client):
    # capture old cookie value, rotate once, replay old within 30 s -> 401; the new cookie still refreshes -> 200

async def test_refresh_reuse_after_grace_revokes_family(client, monkeypatch):
    # rotate, then move RefreshSession.revoked_at back 31 s in the DB, replay old -> 401,
    # the newest cookie -> 401, and an audit row with action "SESSION_REUSE_DETECTED" exists

async def test_logout_clears_cookie(client):
    # logout response set-cookie has nc_refresh with Max-Age=0; refresh afterwards -> 401

def test_cookie_secure_defaults_by_environment():
    assert Settings(SECRET_KEY="x"*40, ENCRYPTION_KEY="y"*40).cookie_secure is False
    assert Settings(ENVIRONMENT="production", SECRET_KEY="x"*40, ENCRYPTION_KEY="y"*40).cookie_secure is True
```

Use the response `set-cookie` header for assertions (exact attribute strings above). Replays send the old value with `cookies={"nc_refresh": old}` on a fresh request.

- [ ] **Step 2: Run to confirm failure**

Run: `uv run --extra test pytest tests/test_sessions.py -q`
Expected: FAIL (no cookie, `refresh_token` present).

- [ ] **Step 3: Write migration `0004_refresh_families`** (`down_revision = "0003_manifest_index_v2"`): add `family_id` nullable, backfill `UPDATE refresh_sessions SET family_id = id`, then set not-null + index `ix_refresh_sessions_family_id`; add `revoked_reason String(20)` nullable. Use `op.batch_alter_table` so SQLite works.

- [ ] **Step 4: Implement.** Refresh flow in `routes/auth.py::refresh`: look up session by token hash `FOR UPDATE`. If `revoked_at` is set: when `revoked_reason == "rotated"` and `now - revoked_at > REFRESH_REUSE_GRACE_SECONDS`, revoke every unrevoked session with that `family_id` (`reason="reuse"`), bump `user.token_version`, audit `SESSION_REUSE_DETECTED`, commit; always respond 401. Otherwise rotate: mark old `revoked_reason="rotated"`, issue new token in the same family. Login starts a new family. Logout and password change/reset call `revoke_sessions(reason="logout"|"password")` and clear the cookie.

- [ ] **Step 5: Update `tests/test_backend.py::test_refresh_rotation_logout_and_plan_guard`** to use the cookie + `X-NC-CSRF` instead of the JSON body; keep its assertions' intent (old token rejected, logout kills the session).

- [ ] **Step 6: Run all tests**

Run: `uv run --extra test pytest -q && uv run alembic upgrade head` (against SQLite: `DATABASE_URL=sqlite+aiosqlite:///./ci-migration.db`) then `uv run alembic check`
Expected: all pass; "No new upgrade operations detected."

- [ ] **Step 7: Commit**

```bash
git commit -am "feat(auth): HttpOnly refresh cookie with family reuse detection"
```

---

### Task 3: Frontend session client without stored tokens

**Files:**
- Modify: `frontend/src/api/client.ts:41-215`, `frontend/src/api/auth.ts`, `frontend/src/types/api.ts` (`Tokens` → `{access_token, token_type, expires_in}`), `frontend/package.json` (scripts `"test": "vitest run"`; devDeps `vitest`, `jsdom`), `frontend/vite.config.ts` (`test: { environment: "jsdom" }`), `.github/workflows/verify-and-publish.yml` (frontend job: `npm test`)
- Create: `frontend/src/api/client.test.ts`

**Interfaces:**
- Consumes: Task 2's `/auth/refresh` contract (cookie + `X-NC-CSRF: 1`, body `{access_token, expires_in}`).
- Produces: `refreshSession(): Promise<boolean>`, `setAccessToken`, `getAccessToken`, `clearSession(): void` (replaces `clearPersistedSession`). `readPersistedRefreshToken` and `persistRefreshToken` are deleted. Default `BASE_URL` becomes `http://localhost:7575` (same site as the Vite dev server so `SameSite=Strict` works).

- [ ] **Step 1: Write failing Vitest tests** in `client.test.ts` (stub `fetch` with `vi.fn`):

```ts
it("refreshSession sends credentials and the CSRF header", ...)      // fetch called with credentials:"include", headers X-NC-CSRF:"1", no body
it("concurrent refreshSession calls share one request", ...)          // 3 parallel calls -> fetch called once
it("refreshSession serializes across tabs with Web Locks", ...)       // navigator.locks.request stub called with "nc-refresh"
it("never writes tokens to web storage", ...)                         // spy localStorage/sessionStorage.setItem -> never called after login + refresh
it("clears legacy stored refresh tokens on load", ...)                // pre-set localStorage "nc.refresh" and sessionStorage "nc.refresh"; import module; both removed
it("ignores a dev_token query parameter", ...)                        // location ?dev_token=x -> no fetch with that value, not stored
```

- [ ] **Step 2: Run to confirm failure**

Run: `cd frontend && npm test`
Expected: FAIL.

- [ ] **Step 3: Implement.** Delete the `dev_token` block and both storage functions. On module load, remove `nc.refresh` from both storages inside `try/catch`. `refreshSession` keeps its in-tab single-flight, and wraps the fetch in `navigator.locks.request("nc-refresh", …)` when `navigator.locks` exists. All `fetch` calls in `execute` use `credentials: "include"`. `auth.ts::login` only sets the access token; `logout` calls `clearSession()`.

- [ ] **Step 4: Run tests, lint, build**

Run: `npm test && npm run lint && VITE_API_URL=https://api.example.com npm run build`
Expected: all pass. Then `grep -rn "localStorage\|sessionStorage\|dev_token" src --include=*.ts --include=*.tsx | grep -v test` prints only the legacy-cleanup lines.

- [ ] **Step 5: Commit**

```bash
git commit -am "fix(frontend): cookie-based refresh, remove dev_token and stored tokens"
```

---

### Task 4: Proxy-aware client IP, shared Redis, auth rate-limit scope

**Files:**
- Create: `app/core/redis.py`, `app/core/client_ip.py`, `tests/test_guardrails.py`
- Modify: `app/core/config.py`, `app/core/ratelimit.py`, `app/services/quota.py:47-59,62-113`, `app/main.py:69-102,154-164`, `app/core/deps.py:38-44`, `tests/conftest.py` (monkeypatch `app.core.redis.get_redis` to a FakeRedis instead of `Redis.from_url`), `tests/test_backend.py` (the cache test uses `get_redis()`), `Dockerfile` (CMD unchanged except keep `--no-access-log`)

**Interfaces:**
- Produces: setting `TRUSTED_PROXIES: str = "127.0.0.1"` (comma-separated IPs/CIDRs). `def client_ip(request: Request) -> str` — if the direct peer is in `TRUSTED_PROXIES`, return the right-most `X-Forwarded-For` entry that is not itself trusted; otherwise the peer address. `def get_redis() -> Redis` — one client per running event loop (`WeakKeyDictionary` keyed by `asyncio.get_running_loop()`), `socket_connect_timeout=0.2, socket_timeout=0.2`; never closed per call.
- `audit()` and the limiter use `client_ip(request)`.
- Auth rate-limited paths: register, login, forgot-password, reset-password, change-password, delete-account. `/auth/refresh` is removed from the list.

- [ ] **Step 1: Write failing tests** (build per-test `AsyncClient(transport=ASGITransport(app=app, client=(peer, 1234)))`):

```python
async def test_forwarded_ip_from_trusted_proxy_gets_separate_budget(...)  # peer 127.0.0.1, XFF 203.0.113.1 x10 ok, XFF 203.0.113.2 still ok
async def test_untrusted_forwarded_header_is_ignored(...)                 # peer 198.51.100.7 rotating XFF values -> 11th login is 429
async def test_refresh_is_not_ip_rate_limited(...)                        # 15 refresh calls from one IP -> none 429
def test_get_redis_reuses_client_within_a_loop()                          # two calls in one loop -> same object; asyncio.run twice -> different objects
```

- [ ] **Step 2: Run to confirm failure**

Run: `uv run --extra test pytest tests/test_guardrails.py -q`
Expected: FAIL.

- [ ] **Step 3: Implement** `client_ip` with `ipaddress.ip_network(..., strict=False)` membership; `get_redis`; switch `ratelimit.py`, `quota.py`, and `/redis-health` to `get_redis()` and drop their `aclose()` calls.

- [ ] **Step 4: Run all tests**

Run: `uv run --extra test pytest -q`
Expected: all pass.

- [ ] **Step 5: Document** `TRUSTED_PROXIES` in `.env.example` with the comment `# Comma-separated proxy IPs/CIDRs whose X-Forwarded-For is trusted (e.g. your load balancer range)`.

- [ ] **Step 6: Commit**

```bash
git commit -am "fix(guardrails): trusted-proxy client IP, shared Redis client, refresh not IP-limited"
```

---

### Task 5: Non-blocking, constant-time password checks

**Files:**
- Modify: `app/core/security.py:15-23`, `app/api/v1/routes/auth.py` (register, login, reset, change, delete-account), `tests/test_guardrails.py`

**Interfaces:**
- Produces: `async def hash_password_async(password: str) -> str`, `async def verify_password_async(password: str, digest: str) -> bool` (both `asyncio.to_thread`), module constant `DUMMY_PASSWORD_HASH: str` (bcrypt cost 12 hash computed once at import). Sync versions remain for scripts.

- [ ] **Step 1: Write failing tests**

```python
async def test_password_hashing_does_not_block_event_loop(client, monkeypatch):
    # monkeypatch bcrypt.checkpw to time.sleep(0.5) then return False
    # start a login task; then GET "/" must complete in < 0.2 s while login is in flight
async def test_unknown_email_still_runs_password_check(client, monkeypatch):
    # spy on verify_password_async; login with unknown email -> 401 and spy called once with DUMMY_PASSWORD_HASH
```

- [ ] **Step 2: Run to confirm failure** — `uv run --extra test pytest tests/test_guardrails.py -q -k password` → FAIL.
- [ ] **Step 3: Implement**; routes await the async versions; login verifies against `DUMMY_PASSWORD_HASH` when the user is missing or inactive.
- [ ] **Step 4: Run all tests** — `uv run --extra test pytest -q` → pass.
- [ ] **Step 5: Commit** — `git commit -am "fix(auth): run bcrypt off the event loop, equalize unknown-email timing"`

---

### Task 6: Worker database sessions, separate migrate and beat services

**Files:**
- Create: `app/workers/db.py`
- Modify: `app/workers/tasks.py`, `docker-compose.yml`, `docs/DEPLOYMENT.md` (worker/beat/migrate section), `tests/integration/test_postgres_concurrency.py`

**Interfaces:**
- Produces: `def worker_session() -> AsyncSession` — sessions from an `async_sessionmaker` over an engine built with `poolclass=NullPool` (engine cached per process). `_cleanup()` and `_purge_expired_tokens()` use `worker_session()` instead of `SessionLocal`. Tests monkeypatch `app.workers.tasks.worker_session`.

- [ ] **Step 1: Write the failing test**

```python
@pytest.mark.postgres
def test_cleanup_task_runs_repeatedly_in_fresh_event_loops(monkeypatch):
    # point settings.DATABASE_URL at TEST_DATABASE_URL (schema created by a sync helper using asyncio.run(create_all))
    # call worker_tasks.cleanup_expired_uploads() three times in a row -> each returns an int, no RuntimeError
```

(Sync test: `cleanup_expired_uploads()` itself calls `asyncio.run`.)

- [ ] **Step 2: Run to confirm failure** — with `TEST_DATABASE_URL` set → FAIL with "attached to a different loop" or "another operation is in progress". If it passes before the fix, keep the test and note it in the commit message.
- [ ] **Step 3: Implement `app/workers/db.py`** and switch both task coroutines to it.
- [ ] **Step 4: Update `docker-compose.yml`:** add `migrate` (API image, `command: ["alembic", "upgrade", "head"]`, `restart: "no"`); `api` and `worker` depend on `migrate: {condition: service_completed_successfully}`; worker command drops `-B`; add `beat` service (`celery -A app.workers.celery_app:celery_app beat -s /tmp/celerybeat-schedule`); `api` healthcheck `["CMD", "python", "-c", "import urllib.request,sys; urllib.request.urlopen('http://127.0.0.1:7575/readyz', timeout=2)"]`.
- [ ] **Step 5: Verify** — `POSTGRES_PASSWORD=x docker compose config -q` exits 0; `TEST_DATABASE_URL=… uv run --extra test pytest -q` passes.
- [ ] **Step 6: Commit** — `git commit -am "fix(worker): NullPool sessions per task; compose migrate and beat services"`

---

### Task 7: Safe cancel/delete lifecycle and derived quota

**Files:**
- Modify: `app/api/v1/routes/files.py:149-168,235-252`, `app/services/quota.py:34-44,62-113`, `app/workers/tasks.py:16-66`, `app/api/v1/routes/connections.py:58`, `app/api/v1/routes/auth.py:158-160`, `tests/test_backend.py` (`test_cancel_upload_releases_reservation` expects `cleanup_pending`), `tests/test_lifecycle.py`

**Interfaces:**
- Single-file statuses used: `pending → active → deleting → deleted`; `pending → cleanup_pending → cancelled`; `pending → expired`; `cleanup_failed` (retry).
- `cancel_upload`: sets `cleanup_pending`; keeps `upload_expires_at` (it equals the signed URL's expiry); makes no provider call.
- `delete_file`: commit `deleting` (with `upload_expires_at = now`) → provider delete → commit `deleted` + quota decrement. Provider failure: respond 502 `"Could not delete cloud object; cleanup will retry"`, record stays `deleting`.
- Worker `_cleanup` single-file query covers `pending`, `cleanup_pending`, `cleanup_failed`, `deleting` past `upload_expires_at`; final status `expired` (from pending), `cancelled` (from cleanup_pending / cleanup_failed), `deleted` + quota decrement (from deleting).
- `quota_usage`: active totals include statuses `("active", "deleting")`.
- Blocking-status set for disconnect and delete-account becomes `("active", "pending", "deleting", "cleanup_pending", "cleanup_failed")`, defined once as `BLOCKING_FILE_STATUSES` in `app/services/quota.py`.
- `quota_summary.total_used_bytes = usage.total_active` (no longer `Quota.used_bytes`).

- [ ] **Step 1: Write failing tests**

```python
async def test_cancel_upload_defers_delete_until_url_expiry(client, monkeypatch):
    # request upload, PUT bytes, cancel -> 204; object still exists; status cleanup_pending; quota reserved == 0
    # set upload_expires_at in the past; run worker_tasks._cleanup(); object gone; status "cancelled"
async def test_delete_failure_is_retried_by_worker(client, monkeypatch):
    # active file; LocalProvider.delete raises once -> 502; status "deleting"; file absent from GET /files
    # worker _cleanup -> status "deleted"; quota total_used_bytes == 0
async def test_quota_summary_derives_usage_from_files(client):
    # active 120-byte file; set Quota.used_bytes = 999 directly in DB; invalidate cache; summary total_used_bytes == 120
async def test_disconnect_blocked_while_file_deleting(client, monkeypatch):  # 409
```

- [ ] **Step 2: Run to confirm failure** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run all tests** (SQLite and Postgres) → pass.
- [ ] **Step 5: Commit** — `git commit -am "fix(files): defer cancel cleanup past URL expiry, two-phase delete, derived usage"`

---

### Task 8: No provider network I/O while holding row locks

**Files:**
- Modify: `app/api/v1/routes/files.py:171-202`, `app/api/v1/routes/striped.py:111-172`, `tests/test_lifecycle.py`, `tests/integration/test_postgres_concurrency.py`

**Interfaces:**
- Pattern for `confirm_upload`, `confirm_striped_upload`, `chunk_upload_url`: (1) read the record **without** `FOR UPDATE`, validate state, call the provider; (2) `await db.rollback()` to end the read transaction; (3) lock user row + record, re-check that status is still `pending` and unexpired (return the record if already `active`; otherwise 409 `"Upload is no longer pending"`), then mutate and commit. For `chunk_upload_url` step 3 only re-checks state (no mutation) — the existing comment about holding the lock through URL issuance is replaced by the cleanup-delay rule in Task 7, which already waits a full URL lifetime.

- [ ] **Step 1: Write failing tests**

```python
async def test_confirm_after_concurrent_cancel_conflicts(client, monkeypatch):
    # LocalProvider.exists patched to cancel the same upload via the API before returning True
    # confirm -> 409; file status is "cleanup_pending"; quota total_used_bytes == 0
@pytest.mark.postgres
async def test_confirm_does_not_hold_user_lock_during_provider_call(client, monkeypatch):
    # LocalProvider.exists patched to await an asyncio.Event
    # start confirm; while blocked, a second upload-request for the same user completes within 2 s (asyncio.wait_for)
    # then set the event; confirm returns 200
@pytest.mark.postgres
async def test_striped_confirm_does_not_hold_user_lock_during_provider_call(client, monkeypatch):  # same shape for the striped route
```

- [ ] **Step 2: Run to confirm failure** — `uv run --extra test pytest tests/test_lifecycle.py -q` (and with `TEST_DATABASE_URL`) → FAIL.
- [ ] **Step 3: Implement** the pattern in all three handlers.
- [ ] **Step 4: Run all tests** (SQLite and Postgres) → pass.
- [ ] **Step 5: Commit** — `git commit -am "fix(files): verify with providers outside row-locked transactions"`

---

### Task 9: Cached SDK clients and threaded signing

**Files:**
- Create: `app/services/client_cache.py`, `tests/test_provider_clients.py`
- Modify: `app/services/providers.py`

**Interfaces:**
- Produces: `class ClientCache: __init__(self, maxsize: int = 256, ttl_seconds: float = 300.0, clock: Callable[[], float] = time.monotonic)`, `get_or_create(self, key: tuple, factory: Callable[[], T]) -> T` (thread-safe via `threading.Lock`, LRU eviction). Module instance `provider_clients = ClientCache()`.
- Cache key: `(provider_name, str(connection.id), sha256(json.dumps(credentials, sort_keys=True)))`.
- `S3Provider.client`, `GCPProvider._client`, Azure `BlobServiceClient` construction and OCI client construction go through `provider_clients`. `generate_presigned_url`, GCS `generate_signed_url`, and Azure `generate_blob_sas` run under `asyncio.to_thread`.

- [ ] **Step 1: Write failing tests**

```python
def test_client_cache_reuses_until_ttl():      # fake clock: same object at t=0 and t=299; new object at t=301
def test_client_cache_evicts_lru():             # maxsize=2: a, b, touch a, add c -> b evicted
def test_client_cache_keys_on_credentials():   # same connection, different secret -> different client
async def test_s3_client_reused_across_calls(monkeypatch):  # count boto3.client calls over upload_url + download_url -> 1
```

- [ ] **Step 2: Run to confirm failure** → FAIL.
- [ ] **Step 3: Implement.** Existing `test_provider_signing_contracts` must still pass unchanged.
- [ ] **Step 4: Run all tests** → pass.
- [ ] **Step 5: Commit** — `git commit -am "perf(providers): cache SDK clients, sign URLs off the event loop"`

---

### Task 10: Liveness/readiness probes and Sentry

**Files:**
- Create: `app/core/observability.py`
- Modify: `app/main.py:48-53,144-164`, `app/workers/celery_app.py`, `pyproject.toml` (`uv add "sentry-sdk[fastapi,celery]"`), `app/core/config.py` (`SENTRY_DSN: str = ""`, `SENTRY_TRACES_SAMPLE_RATE: float = 0.0`), `frontend/src/main.tsx`, `frontend/package.json` (`@sentry/react`), `.github/workflows/verify-and-publish.yml` (smoke test curls `/livez` and `/readyz`), `tests/test_guardrails.py`

**Interfaces:**
- Routes: `GET /livez` → `{"status": "ok"}` with no dependency checks; `GET /readyz` → checks DB `SELECT 1` and Redis `PING`, 503 `"Dependency unavailable"` on either failure; `/health` stays as an alias of `/readyz` (existing probes); `/redis-health` is removed.
- `def init_sentry(component: Literal["api", "worker"]) -> bool` — returns False and does nothing when `SENTRY_DSN` is empty; sets `send_default_pii=False`, `environment=settings.ENVIRONMENT`, `before_send=scrub_event`.
- `def scrub_event(event: dict, hint: dict) -> dict` — removes `request.cookies`, the `Authorization`, `Cookie`, `X-NC-CSRF` headers, and `request.query_string`; replaces any string value containing `nc_refresh=` or `X-Amz-Signature` with `"[scrubbed]"`.
- Worker calls `init_sentry("worker")` from a `celery.signals.worker_process_init` handler; API calls it in `lifespan`.
- Frontend initializes `@sentry/react` only when `import.meta.env.VITE_SENTRY_DSN` is set, with `sendDefaultPii: false`.

- [ ] **Step 1: Write failing tests**

```python
async def test_livez_ok_when_database_down(client, monkeypatch):     # SessionLocal patched to raise -> /livez 200, /readyz 503
def test_init_sentry_noop_without_dsn():                              # returns False
def test_scrub_event_removes_secrets():                               # cookies, Authorization, query_string gone; signed URL string scrubbed
```

- [ ] **Step 2: Run to confirm failure** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run backend tests, frontend build** — `uv run --extra test pytest -q`; `cd frontend && npm run build` → pass.
- [ ] **Step 5: Commit** — `git commit -am "feat(ops): liveness/readiness probes and scrubbed Sentry reporting"`

---

### Task 11: Nginx security headers on every response, with CSP

**Files:**
- Create: `frontend/nginx/security-headers.conf.template`
- Modify: `frontend/nginx.conf` → `frontend/nginx/default.conf.template` (moved), `frontend/Dockerfile`, `docker-compose.yml` (`web.environment.CSP_CONNECT_SRC`), `.github/workflows/verify-and-publish.yml` (smoke asserts)

**Interfaces:**
- The official nginx image renders `/etc/nginx/templates/*.template` with `envsubst` at start. Dockerfile copies both templates there and sets `ENV CSP_CONNECT_SRC="'self' https:"` and `ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/conf.d`. `default.conf.template` contains `include /etc/nginx/conf.d/security-headers.conf;` at server level **and** inside every `location` that has its own `add_header`.
- `security-headers.conf.template` exact headers (all with `always`):
  - `X-Content-Type-Options "nosniff"`
  - `X-Frame-Options "DENY"`
  - `Referrer-Policy "no-referrer"`
  - `Strict-Transport-Security "max-age=31536000; includeSubDomains"`
  - `Permissions-Policy "camera=(), microphone=(), geolocation=()"`
  - `Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src ${CSP_CONNECT_SRC}; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'"`
- `connect-src` must allow `https:` because browsers PUT directly to user-chosen storage endpoints. Compose sets `CSP_CONNECT_SRC="'self' https: http://localhost:7575"` for local use.

- [ ] **Step 1: Add failing smoke assertions** in the CI `images` job after the existing curls:

```bash
for path in /app/files /landing/index.html /health "/assets/$(curl -s http://127.0.0.1:8080/app/files | grep -o 'assets/index-[^"]*\.js' | head -1 | cut -d/ -f2)"; do
  headers=$(curl -sI "http://127.0.0.1:8080$path")
  echo "$headers" | grep -qi '^content-security-policy:.*frame-ancestors' || { echo "missing CSP on $path"; exit 1; }
  echo "$headers" | grep -qi '^x-frame-options: DENY' || { echo "missing XFO on $path"; exit 1; }
done
```

- [ ] **Step 2: Run locally to confirm failure** — `docker build -t nc-web frontend --build-arg VITE_API_URL=https://api.example.com && docker run -d --rm -p 8080:8080 --name nc-web nc-web` then the loop above → fails on `/app/files`.
- [ ] **Step 3: Implement** the templates and Dockerfile change.
- [ ] **Step 4: Verify** — rebuild, rerun the loop → no output, exit 0. Open `http://localhost:8080/landing/index.html` and `/app/login` in a browser (or the `run` skill) and confirm the console shows no CSP violations; if the landing page needs an additional source, add only that source and note it in the commit.
- [ ] **Step 5: Commit** — `git commit -am "fix(web): security headers and CSP on every nginx location"`

---

### Task 12: Striping opt-in, permanent tiers only, honest labels

**Files:**
- Create: `alembic/backend_versions/0005_user_striping_preference.py`, `tests/test_striping_policy.py`
- Modify: `app/db/models.py` (User), `app/schemas.py` (`UserOut`, new `PreferencesIn`), `app/api/v1/routes/auth.py` (preferences route), `app/api/v1/routes/striped.py:59-83`, `app/services/striping.py:88-143`, `frontend/src/state/uploads.tsx:244-256`, `frontend/src/routes/app/settings.tsx`, `frontend/src/routes/app/files.tsx`, `frontend/src/types/api.ts`, `frontend/src/lib/providers.ts`

**Interfaces:**
- Consumes: Task 2 migration chain (`down_revision = "0004_refresh_families"`).
- Produces: `User.striping_enabled: bool` (not null, server default `false`); `UserOut.striping_enabled: bool`; `PATCH /api/v1/auth/preferences` with body `PreferencesIn {striping_enabled: bool}` → `UserOut`, audited as `PREFERENCES_UPDATE`.
- `def eligible_for_striping(connection) -> bool` in `app/services/striping.py`: true when `PROVIDERS[connection.provider].permanent`. `place_chunks` and the "two providers" check in `request_striped_upload` consider only eligible connections.
- `request_striped_upload` returns 403 `"Striping is disabled. Enable it in Settings to split large files across clouds."` when `user.striping_enabled` is false, and 400 `"Striping needs two permanent-tier providers (R2, B2, GCS, Oracle, IBM)"` when fewer than two eligible providers exist.
- Frontend: stripe only when `user.striping_enabled` and the connected providers include ≥ 2 distinct permanent ones (`isPermanentProvider(id: ProviderId): boolean` added to `lib/providers.ts`, mirroring the backend catalog); otherwise use the single-cloud path. Settings shows a switch "Split large files across clouds" with the description exactly: "Faster use of free space, but files are not backed up: losing any connected cloud loses every split file stored on it." Files list shows a "Not backed up" badge on `storage_mode === "striped"` rows.

- [ ] **Step 1: Write failing backend tests** in `tests/test_striping_policy.py`:

```python
async def test_striping_disabled_by_default(client):
    # two permanent connections (r2 + b2 with LocalProvider), striped-upload-request -> 403; /auth/me striping_enabled is False
async def test_preferences_enable_striping(client):
    # PATCH /auth/preferences {"striping_enabled": true} -> 200, body striping_enabled True; audit row PREFERENCES_UPDATE
async def test_striping_ignores_temporary_free_tiers(client):
    # striping enabled; connections aws + azure (non-permanent) -> striped request 400 with the permanent-tier message
def test_place_chunks_never_uses_non_permanent_connections():
    # connections r2, b2, aws; place_chunks(...) assigns no chunk to the aws connection
```

- [ ] **Step 2: Run to confirm failure** — `uv run --extra test pytest tests/test_striping_policy.py -q` → FAIL. Existing striped tests in `tests/test_backend.py` will also need `striping_enabled` set first: add a `enable_striping(client, headers)` helper in `tests/conftest.py` and call it in those tests.
- [ ] **Step 3: Implement backend** (migration with `server_default=sa.false()`, model, schema, route, eligibility filter).
- [ ] **Step 4: Run all backend tests** — `uv run --extra test pytest -q` → pass; `alembic upgrade head && alembic check` on SQLite → clean.
- [ ] **Step 5: Write failing Vitest tests** in `frontend/src/state/uploads.test.ts` for the pure routing helper `export function shouldStripe(fileSize: number, user: Pick<User, "striping_enabled">, providers: ProviderId[]): boolean` (extracted from `uploads.tsx`): false when disabled; false with `["aws","azure"]`; false for files ≤ 16 MiB; true with `["r2","b2"]` and a 20 MiB file when enabled.
- [ ] **Step 6: Implement frontend** (`shouldStripe`, settings switch calling the preferences route then `refreshUser()`, badge).
- [ ] **Step 7: Verify** — `cd frontend && npm test && npm run lint && npm run build` → pass.
- [ ] **Step 8: Commit** — `git commit -am "fix(storage): make striping opt-in on permanent tiers only, label non-redundant files"`

---

## Spec coverage check (Phase 0)

| Spec / audit item | Task |
|---|---|
| Audit 1 dev_token backdoor | 3 |
| Audit 2 refresh token storage, §4 cookie sessions | 2, 3 |
| Audit 3 proxy IP / refresh rate limit | 4 |
| Audit 4 worker event loop, §3.5 worker NullPool | 6 |
| Audit 5 nginx headers, §10 CSP/HSTS | 11 |
| Audit 6 bcrypt blocking / timing | 5 |
| Audit 7 locks during network I/O | 8 |
| Audit 8 cancel orphan, §8.1 CLEANUP_PENDING | 7 |
| Audit 9 delete ordering, §8.1 DELETING | 7 |
| Audit 10 dual usage source (interim; ledger is Phase 1) | 7 |
| Audit 11 SDK clients / Redis per call, §3.5 shared Redis | 4, 9 |
| Audit 12 refresh reuse detection, §4 families | 2 |
| Postgres + Redis in CI, §12 | 1 |
| `/livez` `/readyz`, Sentry, §10 | 10 |
| §3.5 migrate job, single beat | 6 |
| §7.7 interim rule: striping opt-in, permanent tiers, labels | 12 |

Deferred by the spec to later phases: redundancy modes/scrubbing/repair (Phase 3.5), hexagonal restructure, quota ledger, outbox, idempotency keys, multipart uploads, OpenTelemetry/Prometheus, lockout + Turnstile, email verification.
