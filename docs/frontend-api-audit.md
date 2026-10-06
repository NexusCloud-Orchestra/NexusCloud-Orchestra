# Frontend API audit

Verified against the running backend (`uvicorn app.main:app`, SQLite + `LOCAL_STORAGE_ENABLED=true`)
on 2026-10-06. Source of truth: `app/` implementation and `/openapi.json`; contract doc:
`docs/API_CONTRACT_AND_FRONTEND.md`.

## Endpoints in use

| Method | Path | Used by |
|---|---|---|
| POST | `/api/v1/auth/register` | Register |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh` | Token refresh (rotation) |
| POST | `/api/v1/auth/logout` | Sign out |
| GET | `/api/v1/auth/me` | Session restore, shell |
| POST | `/api/v1/auth/forgot-password` | Forgot password |
| POST | `/api/v1/auth/reset-password` | Reset password |
| POST | `/api/v1/auth/change-password` | Settings |
| POST | `/api/v1/auth/plan` | Settings (plan display; paid upgrades 403) |
| GET | `/api/v1/auth/audit-logs` | Activity, Overview |
| POST | `/api/v1/auth/delete-account` | Settings |
| GET | `/api/v1/providers` | Landing, Connect flow |
| GET | `/api/v1/plans` | Landing, Settings |
| POST | `/api/v1/connections` | Connect wizard |
| GET | `/api/v1/connections` | Clouds, Router, Quota |
| DELETE | `/api/v1/connections/{id}` | Clouds (409 while files remain) |
| POST | `/api/v1/files/route-preview` | Router |
| POST | `/api/v1/files/upload-request` | Upload queue |
| POST | `/api/v1/files/confirm-upload/{file_id}` | Upload queue |
| POST | `/api/v1/files/cancel-upload/{file_id}` | Upload queue (failure/abort) |
| GET | `/api/v1/files` | Files, Overview |
| GET | `/api/v1/files/download/{file_id}` | Files |
| DELETE | `/api/v1/files/{file_id}` | Files |
| GET | `/api/v1/quota/summary` | Quota, Overview, Clouds |
| GET | `/health`, `/redis-health` | Landing status note (not fetched by the SPA) |

Not integrated (no backend contract yet): file splitting, 2FA, API keys, team seats, billing,
live analytics. The UI must not render placeholders for these.

## Findings from live verification

1. **Bodyless POST returns 411.** The guardrail middleware requires `Content-Length` on every
   `POST`/`PUT` under `/api/v1`. `fetch` omits `Content-Length` for bodyless requests, so every
   `POST` — including `logout`, `confirm-upload`, `cancel-upload`, `plan`, `delete-account` — must
   send a JSON body (the client sends `{}` with `Content-Type: application/json`).
2. **Auth error envelope.** All errors are
   `{"error":{"code","message","request_id","details?":[{"field","message"}]}}`;
   `details` only for 422 validation errors. Field paths look like `body.email`.
3. **Token rotation.** `/auth/refresh` invalidates the presented refresh token immediately.
   A single coordinated refresh per 401 must be shared across concurrent requests, then the
   original request retried once.
4. **Logout revokes everything.** `POST /auth/logout` invalidates the access token (jti
   revocation) and all refresh sessions. In-app "sign out everywhere" semantics on password
   change/reset follow from the backend revoking sessions.
5. **Rate limiting.** 10 req/min per IP on register/login/refresh/forgot/reset/change-password/
   delete-account. 429 carries `Retry-After: 60`; surface it, do not retry-loop.
6. **Upload contract.** `upload-request` → browser `PUT` to `upload_url` with exactly
   `required_headers` (no bearer token) → `confirm-upload`. Confirm 409 means the object is
   missing/size-mismatched/expired. After a failed/aborted PUT, call `cancel-upload`
   (409 if not pending — treat as already resolved). After a *transient* confirm failure
   (network/5xx), retry confirm; do not cancel.
7. **Upload URL host.** Signed URLs are absolute, built from backend `PUBLIC_API_URL`. The bucket
   (or dev local-objects route) must allow the frontend origin for `PUT` + `Content-Type`.
8. **Quota semantics.** `total_limit_bytes` is `min(sum of provider estimates, plan cap)`.
   `total_reserved_bytes` counts pending tickets, including stale ones until the 15-minute expiry
   sweep runs, so reserved may briefly over-report. `usage_percentage` is used/total limit.
9. **Route preview.** Read-only; weights are fixed (capacity .40, egress .30, permanence .20,
   fit .10). Candidate `components` sum to `score` and are `null` for ineligible candidates.
   Ineligible candidates are ranked last. A later `upload-request` may choose differently if
   usage changed. `blocked_reason`: `no_connections`, `plan_limit`, `no_single_cloud`,
   `insufficient_quota` (with human `message`).
10. **Connections.** Provider `region` is required for `b2`, `ibm`, `oracle` (422 otherwise).
    R2 needs a 32-hex `account_id`. Disconnect returns 409 while active/pending/cleanup-failed
    files remain. Paid plan upgrades return 403 until billing exists.
11. **Pagination.** `GET /files` and `/auth/audit-logs` are unpaginated (audit capped at 100,
    newest first). The file browser does client-side filtering/sorting only.
12. **Validation limits.** Password 8–128 chars, ≤72 UTF-8 bytes. Uploads 1 B–5 GiB. Filenames
    ≤255 chars, no `/`, `\`, or control characters. Bucket name `[A-Za-z0-9][A-Za-z0-9._-]{0,254}`.
    JSON bodies ≤64 KiB.
13. **Reserved emails.** The email validator rejects reserved/special-use TLDs (e.g. `.test`);
    registration errors surface as 422 `details` on `body.email`.

## Environment notes (this machine, not repo defects)

- Port 7575 was occupied by a stale process serving an older build; the verified instance ran on
  7576 (`PUBLIC_API_URL` must match the API origin or signed upload URLs point elsewhere).
- Without SMTP, `/auth/forgot-password` still returns the generic 200 message; no mail is sent.
