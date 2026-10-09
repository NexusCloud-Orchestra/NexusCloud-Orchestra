// Runtime configuration.
//   Default (live): catalog from the NexusCloud API via the same-origin proxy in serve.py
//                   (backend VITE_API_URL = https://190zfn3m-7575.inc1.devtunnels.ms).
//   ?api=<origin>  : call that API origin directly (it must allow this page's origin in CORS_ORIGINS).
//   ?offline=1     : frontend-only, no backend calls.
(() => {
  const q = new URLSearchParams(location.search);
  const APP_URL = "https://190zfn3m-5173.inc1.devtunnels.ms"; // authenticated React app (login/register)
  const offline = q.has("offline");
  const api = q.get("api");
  window.NEXUS_CONFIG = {
    offline,
    apiBase: offline ? null : (api ? api.replace(/\/$/, "") : "") + "/api/v1",
    routes: offline
      ? { login: "#top", register: "#top" }
      : { login: APP_URL + "/login", register: APP_URL + "/register" },
  };
})();
