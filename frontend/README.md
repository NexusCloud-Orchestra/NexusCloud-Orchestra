# NexusCloud Orchestra — frontend

React 18 + Vite 5 + TypeScript + TanStack Query. Light-only design system in
`src/styles/index.css` and `tailwind.config.ts`. Every API call goes through
`src/api/client.ts` (bearer auth, error normalization, coordinated token
refresh). The full endpoint inventory and live-verified contract notes are in
`docs/frontend-api-audit.md`.

```bash
npm install
npm run dev            # http://localhost:5173
VITE_API_URL=http://127.0.0.1:7576 npm run dev   # non-default API port
npm run typecheck && npm run lint && npm run build
```

Uploads use presigned URLs: the browser PUTs directly to the destination cloud
(`XMLHttpRequest`, real progress), then confirms with the API. Bearer tokens
never touch upload/download URLs; the access token stays in memory, the refresh
token in sessionStorage.

Local end-to-end stack (matches the backend runbook):

```bash
# repo root: SQLite + local signed storage emulator
LOCAL_STORAGE_ENABLED=true PUBLIC_API_URL=http://127.0.0.1:7576 \
  .venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 7576
# then the dev server with VITE_API_URL=http://127.0.0.1:7576
```
