import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// The SPA calls the API origin directly (no dev proxy) so CORS and signed-URL
// behavior match production. Override with VITE_API_URL when the backend runs
// on a non-default port.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: { target: "es2020", sourcemap: false },
})
