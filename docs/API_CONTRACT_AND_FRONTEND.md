# NexusCloud API contract and frontend handoff

This file is the implementation contract for the Kimi frontend agent. Source requirements: `context.md`, `PRD.md`, and `BRD.md`. The running backend's OpenAPI document at `/openapi.json` is authoritative for field-level validation.

## Environment and conventions

- API origin: `http://localhost:7575` in development. Base path: `/api/v1`. Production requires HTTPS.
- JSON endpoints use `Content-Type: application/json`. Authenticated endpoints use `Authorization: Bearer <access_token>`.
- IDs are UUID strings. Timestamps are ISO 8601 UTC. Byte counts are integers; use 1 GiB = 1,073,741,824 bytes for display.
- Responses carry `X-Request-ID`. CORS is allowed only for configured origins.
- Error shape: `{"error":{"code":"conflict","message":"...","request_id":"...","details":[{"field":"body.email","message":"..."}]}}`. `details` appears only for validation errors.
- Handle 400, 401, 403, 404, 409, 411, 413, 422, 429 and 502. JSON writes require `Content-Length` and are limited to 64 KiB. On 429 respect `Retry-After`.
- Never log or retain cloud credentials beyond the connection form submission. Never send bearer tokens to a cloud upload/download URL.

## Authentication and account

| Method | Path | Request | Success |
|---|---|---|---|
| POST | `/auth/register` | `{first_name,last_name,email,password}` | 201 `User` |
| POST | `/auth/login` | `{email,password}` | 200 `Tokens` |
| POST | `/auth/refresh` | `{refresh_token}` | 200 `Tokens` (old refresh token immediately invalid) |
| POST | `/auth/logout` | Bearer access token | 204; all refresh sessions revoked, access tokens invalidated |
| GET | `/auth/me` | Bearer | 200 `User` |
| POST | `/auth/forgot-password` | `{email}` | 200 generic message for existing/nonexisting email |
| POST | `/auth/reset-password` | `{email,token,new_password}` | 200 message |
| POST | `/auth/change-password` | Bearer + `{current_password,new_password}` | 200; sign in again |
| POST | `/auth/plan` | Bearer + `{plan}` | 200 `User`; downgrades checked; paid upgrades currently return 403 until billing is integrated |
| GET | `/auth/audit-logs` | Bearer | 200 array of `AuditLog`, newest first, max 100 |
| POST | `/auth/delete-account` | Bearer + `{password}` | 204; 400 wrong password; 409 while active, pending or cleanup-failed files remain. Erases profile, connections, encrypted credentials, file metadata, sessions and audit log |

`User`: `{id,first_name,last_name,email,plan,created_at}`. Plans: `free`, `starter`, `pro`, `team`. Password minimum is 8 characters and maximum is 72 UTF-8 bytes. `Tokens`: `{access_token,refresh_token,token_type:"bearer"}`. Access expires in 30 minutes, refresh in 7 days. On a 401, perform a single coordinated refresh attempt and retry the original request once; otherwise clear auth and navigate to login. Store refresh tokens securely; an httpOnly cookie/BFF is preferred for production. This API currently returns the refresh token in JSON, so if using a browser-only SPA keep it in memory where possible and recognize that page reload will require login. Do not put access or refresh tokens in URLs or localStorage.

`AuditLog`: `{id,action,resource_id,ip_address,user_agent,created_at}`. The reset URL sent by email should navigate to `/reset-password?token=...&email=...`. Password recovery needs SMTP configuration on the backend; if SMTP is not configured in development, the generic endpoint response still appears but no mail is sent.

## Provider connections

| Method | Path | Request | Success |
|---|---|---|---|
| GET | `/providers` | none | 200 catalog array |
| GET | `/plans` | none | 200 plan catalog array |
| POST | `/connections` | Bearer + `ConnectionCreate` | 201 `Connection` |
| GET | `/connections` | Bearer | 200 `Connection[]` (active only) |
| DELETE | `/connections/{id}` | Bearer | 204; 409 if active files remain |

`ConnectionCreate`:

```json
{
  "provider": "aws",
  "display_name": "Personal S3",
  "bucket_name": "my-bucket",
  "region": "us-east-1",
  "credentials": {
    "aws_access_key_id": "...",
    "aws_secret_access_key": "..."
  }
}
```

`Connection`: `{id,provider,display_name,bucket_name,region,is_active,created_at}`. Credentials are never returned. Provider values: `aws`, `azure`, `gcp`, `r2`, `b2`, `oracle`, `ibm`. Credential forms:

| Provider | `credentials` keys | `region` |
|---|---|---|
| AWS S3 | `aws_access_key_id`, `aws_secret_access_key` | AWS region, e.g. `us-east-1` |
| Cloudflare R2 | `aws_access_key_id`, `aws_secret_access_key`, `account_id` (32 hex characters) | optional |
| Backblaze B2 | `aws_access_key_id`, `aws_secret_access_key` | required B2 S3 region |
| IBM COS | `aws_access_key_id`, `aws_secret_access_key` | required IBM COS region |
| Azure Blob | `account_name`, `account_key` | optional; bucket name is container |
| GCP GCS | `service_account_json` (JSON string) | optional |
| Oracle OCI | `tenancy_id`, `user_id`, `fingerprint`, `private_key`, `namespace` | required OCI region |

The backend does not accept custom endpoints. Connection creation checks provider bucket access in real-cloud mode. Show the provider's free-tier estimate as an estimate, since the API does not query each provider's billing/actual remaining free tier. Free users may connect 2 clouds. Starter permits 7. A failed connection or a 502 means the user may need to check credentials, bucket access, region and CORS configuration.

## Files and storage

| Method | Path | Request | Success |
|---|---|---|---|
| POST | `/files/route-preview` | Bearer + `{size_bytes}` | 200 `RoutePreview` (read-only; reserves nothing, issues no URL) |
| POST | `/files/upload-request` | Bearer + `{original_name,size_bytes,mime_type}` | 200 `UploadTicket` |
| POST | `/files/confirm-upload/{file_id}` | Bearer | 200 `File` |
| POST | `/files/cancel-upload/{file_id}` | Bearer | 204; releases a pending reservation; 409 if not pending |
| GET | `/files` | Bearer | 200 `File[]` (active only) |
| GET | `/files/download/{file_id}` | Bearer | 200 `{download_url,expires_in_seconds:3600}` |
| DELETE | `/files/{file_id}` | Bearer | 204 |
| GET | `/quota/summary` | Bearer | 200 `QuotaSummary` |

`UploadTicket`: `{file_id,provider,bucket_name,upload_url,expires_at,required_headers,connection_id}`. Upload URL expires in at most 15 minutes. `File`: `{id,original_name,size_bytes,mime_type,status,uploaded_at,connection_id,provider}`.

`RoutePreview`: `{size_bytes,selected_connection_id,blocked_reason,message,weights:{capacity,egress,permanence,fit},candidates:[{connection_id,provider,display_name,free_bytes,eligible,score,components}]}`. It runs the same placement code as `upload-request` against current usage. `blocked_reason` is `null` or one of `no_connections`, `plan_limit`, `no_single_cloud`, `insufficient_quota`; `message` is then the exact text `upload-request` would return with HTTP 400. Candidates are ranked by score (ineligible last). `components` are the weighted contributions and sum to `score`; they are `null` for ineligible candidates. A later `upload-request` can choose differently if usage changes in between. Upload request accepts a file from 1 byte through 5 GiB; filenames cannot contain path separators or control characters.

Upload flow:

1. Call `POST /files/upload-request` with the browser file's name, exact byte length and MIME type. If `file.type` is empty, use `application/octet-stream`.
2. Use `XMLHttpRequest` to `PUT` the actual file bytes directly to `upload_url`, applying every `required_headers` entry exactly. Track progress via `xhr.upload.onprogress`. Do **not** add the NexusCloud bearer token. Configure CORS on the destination cloud bucket/container to allow the frontend origin, `PUT` and required headers. The URL may be on an entirely different host.
3. Only after a successful 2xx PUT, call `POST /files/confirm-upload/{file_id}`. On 409, the object has not appeared, its size differs, or the ticket expired. Request a new ticket if it expired.
   If the PUT fails, the user aborts, or confirmation returns 409, call `POST /files/cancel-upload/{file_id}` so the reservation is released immediately instead of after the 15-minute expiry sweep. Do not cancel after a transient confirmation failure (network/502); retry confirmation instead.
4. Refresh `/files` and `/quota/summary` after confirmation or deletion.

For download, call `/files/download/{id}` and navigate to or fetch `download_url` immediately. It expires in at most 60 minutes. Avoid persisting signed URLs. Failed confirmation should leave the file out of the active list; the backend releases its pending reservation after expiry cleanup.

`QuotaSummary` example:

```json
{
  "total_used_bytes": 120,
  "total_free_bytes": 5368709000,
  "total_limit_bytes": 5368709120,
  "usage_percentage": 0,
  "by_connection": [{
    "connection_id": "UUID",
    "provider": "aws",
    "display_name": "Personal S3",
    "used_bytes": 120,
    "reserved_bytes": 0,
    "limit_bytes": 5368709120,
    "free_bytes": 5368709000
  }]
}
```

`QuotaSummary` also carries `total_reserved_bytes` (pending upload reservations), `plan` and `plan_limit_bytes` (`null` when the plan has no byte cap).

The connection capacity figures are provider free-tier estimates, not live cloud billing balances. Pending uploads reserve capacity. A plan may lower the total usable limit below the sum of connected clouds.

## Frontend pages and behaviors

Use the PRD dual-shell design: public shell for Landing, Login, Register, Forgot Password, Reset Password; authenticated shell with responsive sidebar and top navbar. The following can be built against the current backend:

| Page | Implement against API |
|---|---|
| Landing | Product overview, provider catalog, pricing from `/providers` and `/plans`, login/register CTAs |
| Dashboard | `GET /auth/me`, `/quota/summary`, `/files` recent items, `/auth/audit-logs` activity |
| Files | Drag/drop and browse, XHR PUT progress, active file table, download, delete and errors |
| Clouds / Connect Cloud | Provider cards, credential wizard, connection list, safe disconnect action |
| Storage | Quota donut and per-connection capacity breakdown |
| Subscription | Plan catalog and current plan; explain that paid upgrades are unavailable until billing is wired |
| Settings / Profile | Profile display, password change and sign-in again, account deletion |
| Smart Routing | `POST /files/route-preview` decision, ranking and per-factor score components |
| Account Security | Login/activity history via audit logs, logout; label unsupported controls clearly |
| Help | Static setup/CORS and credential guides, links to service health |

Do not invent live analytics, bandwidth benchmarks, AI insights, 2FA, API keys, session management, team membership, file splitting, paid checkout or billing status. They appear as later-phase ideas in the PRD but have no API contract yet. Hide or label them as unavailable; never show fake values.

## Health and development

`GET /health` checks the database; `GET /redis-health` checks Redis. `/docs` provides interactive OpenAPI. With `LOCAL_STORAGE_ENABLED=true` in development only, provider connections use signed `/api/v1/local-objects/{id}` URLs so the full flow can run without real cloud credentials. This local data route must remain disabled in production and does not represent the Zero Data Touch production architecture.
