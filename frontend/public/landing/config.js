// Runtime configuration.
//   Default (live): catalog from the NexusCloud API via same-origin /api/v1 (Vite dev proxy / nginx).
//   Login/Register go to the React app on the same origin (/login, /register).
//   ?api=<origin>  : call that API origin directly (it must allow this page's origin in CORS_ORIGINS).
//   ?app=<origin>  : send Login/Register to a React app on another origin.
//   ?offline=1     : frontend-only, no backend calls.
(() => {
  const q = new URLSearchParams(location.search);
  const APP_URL = (q.get("app") || "").replace(/\/$/, ""); // "" = same origin as this page
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
