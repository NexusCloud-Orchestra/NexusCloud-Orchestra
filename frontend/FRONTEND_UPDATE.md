# Frontend update log

All changes made to the `frontend/` app in this pass, aligned to `docs/API_CONTRACT_AND_FRONTEND.md`.

## 1. API layer (new)

`src/lib/api.js` — single API client for `/api/v1`:

- Tokens held in memory only (no `localStorage`, never in URLs), per contract.
- Error envelope parsing: `{error:{code,message,details?}}`, plus FastAPI `detail` fallback.
- Handles 400/401/403/404/409/411/413/422/429/502 with human messages; 429 reads `Retry-After`.
- On 401: one coordinated refresh (`/auth/refresh`, single-flight), retry original request once, otherwise clear tokens and dispatch `nexus:unauthorized`.
- Endpoint wrappers: `authApi`, `catalogApi` (`/providers`, `/plans`), `connectionApi`, `fileApi`, `quotaApi`.
- `uploadToSignedUrl()` — XHR `PUT` to the signed URL, applies every `required_headers` entry, progress callback, no bearer token sent to the cloud host.

`src/lib/utils.js` — `formatBytes` (1 GiB = 1,073,741,824 B), `formatDate`, `timeAgo`, `planLabel`, `detailsToFieldErrors` (maps 422 `details` to field errors), appearance settings helpers (`loadSettings`, `saveSettings`, `applySettings`, accent palette).

## 2. Auth state + routing (new)

- `src/auth/AuthContext.jsx` — session context (login/logout/register/me) on top of the API client.
- `src/auth/Guards.jsx` — `RequireAuth` and `GuestOnly` route guards with a full-page spinner while the session restores.
- `src/App.jsx` — rewritten: public shell (`/`, `/login`, `/register`, `/forgot-password`, `/reset-password`) and authenticated shell (`/dashboard`, `/files`, `/storage`, `/clouds`, `/connect-cloud`, `/subscription`, `/security`, `/profile`, `/help`) behind the guards; applies persisted appearance settings at boot.
- Removed demo/mock login fallback and `localStorage` token storage.

## 3. Design system — refined glassmorphism (new)

- `src/css/app.css` — one token set for both themes: translucent `--glass-bg`/`--glass-border` surfaces with `backdrop-filter: blur + saturate`, ambient aurora-gradient background with faint grid, glass cards/buttons/inputs/badges/alerts/modals/tables/progress/skeletons, density + high-contrast + reduced-motion + focus-indicator data-attribute switches, responsive grids.
- `src/css/shell.css` — glass sidebar (collapsible, mobile drawer with backdrop) and sticky glass navbar with user menu.
- `src/css/auth.css` — split-screen auth layout (dark brand panel, floating glass cloud-orchestration diagram, animated signal dots).
- `src/css/landing.css` — landing page styles (glass nav, hero, feature grid, provider tiles, pricing cards).

## 4. Shared components (new/rewritten)

- `components/AuthLayout.jsx` — shared split-screen for all auth pages with provider icons and SVG diagram.
- `components/Logo.jsx`, `components/Modal.jsx`, `components/Alert.jsx`, `components/EmptyState.jsx`, `components/PasswordInput.jsx` (show/hide toggle), `components/DonutChart.jsx` (SVG donut with per-connection arcs), `components/providers.jsx` (provider icon/name map for aws/azure/gcp/r2/b2/oracle/ibm).
- `components/Sidebar.jsx` — rewritten: grouped nav (Overview / Cloud / Account), active-state accent rail, collapse toggle, mobile drawer.
- `components/Navbar.jsx` — rewritten: page titles, theme toggle, user avatar menu (Profile, Account Security, Sign out).

## 5. Pages rebuilt against the contract

- `Login.jsx` — real `/auth/login` via context, field + envelope errors, redirect-back after login; demo-mode removed.
- `Register.jsx` — `/auth/register`, password rules per contract (min 8 chars, max 72 UTF-8 bytes) with live checklist.
- `ForgotPassword.jsx` — `/auth/forgot-password`, generic success copy (no account enumeration), dev SMTP caveat note.
- `ResetPassword.jsx` — reads `?token&email` from the reset URL, calls `/auth/reset-password`, live password rules.
- `Home.jsx` — landing page rendering the live `/providers` and `/plans` catalogs (free-tier bytes, connections, seats) with graceful offline states.
- `Dashboard.jsx` — `GET /auth/me` (via context), `/quota/summary`, `/files`, `/auth/audit-logs`: KPI cards, usage donut, per-cloud usage bars, recent files, real audit-trail activity. Mock "AI Insights" and fake health metrics removed.
- `Files.jsx` — full contract upload flow: drag/drop + browse, client-side guards (1 B–5 GiB, no path separators), `POST /files/upload-request` -> XHR `PUT` with `required_headers` + progress -> `POST /files/confirm-upload/{id}`; download via signed URL opened immediately; delete with confirm modal; `/files` + `/quota/summary` refreshed after mutations.
- `Clouds.jsx` — connection cards with provider icon, bucket, region, usage bar; disconnect modal that surfaces the 409 "delete files first" case.

## Still in progress

- `Storage.jsx` (quota donut + per-connection breakdown), `ConnectCloud.jsx` (per-provider credential wizard), `Subscription.jsx` (`/plans` + `/auth/plan`, paid upgrades labeled unavailable), `AccountSecurity.jsx` (audit logs + change password), `Profile.jsx`, `HelpSupport.jsx`.

## Compliance notes

- No invented features: analytics, 2FA, API keys, billing, sessions, team seats are hidden or labeled unavailable until a backend contract exists.
- Refresh tokens are in memory only — a full page reload requires signing in again (documented contract trade-off for browser-only SPAs).
