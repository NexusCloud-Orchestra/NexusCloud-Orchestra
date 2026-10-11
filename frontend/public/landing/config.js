// Runtime configuration.
(() => {
  const q = new URLSearchParams(location.search);
  const offline = q.has("offline");
  const api = q.get("api");
  const defaultApi = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? `${location.protocol}//${location.hostname}:7575`
    : "";
  const apiOrigin = api ? api.replace(/\/$/, "") : defaultApi;
  window.NEXUS_CONFIG = {
    offline,
    apiBase: offline ? null : `${apiOrigin}/api/v1`,
    routes: offline
      ? { login: "#top", register: "#top" }
      : { login: "/login", register: "/register" },
  };
})();
