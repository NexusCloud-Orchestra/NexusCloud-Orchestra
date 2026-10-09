import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"

// The SPA calls the API origin directly (VITE_API_URL) so CORS and signed-URL
// behavior match production. The static landing page (public/landing) fetches
// its public catalog from same-origin /api/v1, so dev proxies /api and /health
// to the same backend.
export default defineConfig(({ mode }) => {
  const apiUrl = loadEnv(mode, ".", "").VITE_API_URL || "http://localhost:7575"
  const proxy = { target: apiUrl, changeOrigin: true, headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" } }
  return {
    plugins: [react()],
    server: { port: 5173, proxy: { "/api": proxy, "/health": proxy } },
    build: { target: "es2020", sourcemap: false },
  }
})
