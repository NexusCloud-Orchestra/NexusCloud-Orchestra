import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import * as Sentry from "@sentry/react"
import { App } from "./App"
import "./styles/index.css"

const sentryDsn = import.meta.env.VITE_SENTRY_DSN
if (sentryDsn) {
  Sentry.init({ dsn: sentryDsn, environment: import.meta.env.MODE, sendDefaultPii: false })
}

const container = document.getElementById("root")
if (!container) throw new Error("Root container missing")

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
