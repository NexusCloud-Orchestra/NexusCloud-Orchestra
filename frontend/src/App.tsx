import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { RouterProvider, createBrowserRouter, Navigate, Outlet } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import { createQueryClient, queryKeys } from "./state/query"
import { AuthProvider, useAuth } from "./state/auth"
import { ToastProvider } from "./state/toast"
import { quotaSummary } from "./api/quota"
import { UploadProvider } from "./state/uploads"
import { ErrorBoundary } from "./components/layout/error-boundary"
import { AppShell } from "./components/layout/shell"
import { CommandPalette } from "./components/layout/command-palette"
import { LoginPage } from "./routes/login"
import { RegisterPage } from "./routes/register"
import { ForgotPasswordPage } from "./routes/forgot-password"
import { ResetPasswordPage } from "./routes/reset-password"
import { OverviewPage } from "./routes/app/overview"
import { FilesPage } from "./routes/app/files"
import { CloudsPage } from "./routes/app/clouds"
import { RouterPage } from "./routes/app/router"
import { QuotaPage } from "./routes/app/quota"
import { ActivityPage } from "./routes/app/activity"
import { SettingsPage } from "./routes/app/settings"

const queryClient = createQueryClient()

/** Gates the authenticated shell until the session restore has resolved. */
function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  if (status === "restoring") {
    return <SessionRestoreSkeleton />
  }
  if (status === "anonymous") {
    return <Navigate to="/login" replace />
  }
  return children
}

function SessionRestoreSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="flex h-14 items-center border-b border-line px-5">
        <div className="h-3 w-28 animate-pulse-soft rounded-sm bg-line" />
      </div>
      <div className="mx-auto w-full max-w-content flex-1 px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4" role="status" aria-label="Restoring session">
          <div className="h-6 w-44 animate-pulse-soft rounded-sm bg-line" />
          <div className="h-24 w-full max-w-xl animate-pulse-soft rounded-md bg-line" />
          <div className="h-40 w-full animate-pulse-soft rounded-md bg-line" />
        </div>
      </div>
    </div>
  )
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { status } = useAuth()
  if (status === "authenticated") return <Navigate to="/app" replace />
  return <>{children}</>
}

// The marketing landing page is the static scroll-driven page in public/landing/
// (270-frame canvas sequence); it is served outside the SPA bundle.
const LANDING_URL = "/landing/index.html"

function LandingRedirect() {
  useEffect(() => {
    window.location.replace(LANDING_URL)
  }, [])
  return null
}

function AuthenticatedApp() {
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setPaletteOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  // Keep quota data warm for the shell; invalidation happens after mutations.
  useEffect(() => {
    void queryClient.prefetchQuery({ queryKey: queryKeys.quota, queryFn: quotaSummary })
  }, [])

  return (
    <UploadProvider queryClient={queryClient}>
      <AppShell onOpenPalette={() => setPaletteOpen(true)}>
        <Outlet />
      </AppShell>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </UploadProvider>
  )
}

const router = createBrowserRouter(
  [{
    path: "/",
    element: <LandingRedirect />,
  },
  {
    path: "/login",
    element: (
      <PublicOnly>
        <LoginPage />
      </PublicOnly>
    ),
  },
  {
    path: "/register",
    element: (
      <PublicOnly>
        <RegisterPage />
      </PublicOnly>
    ),
  },
  {
    path: "/forgot-password",
    element: (
      <PublicOnly>
        <ForgotPasswordPage />
      </PublicOnly>
    ),
  },
  {
    path: "/reset-password",
    element: (
      <PublicOnly>
        <ResetPasswordPage />
      </PublicOnly>
    ),
  },
  {
    path: "/app",
    element: (
      <RequireAuth>
        <AuthenticatedApp />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <OverviewPage /> },
      { path: "files", element: <FilesPage /> },
      { path: "clouds", element: <CloudsPage /> },
      { path: "router", element: <RouterPage /> },
      { path: "quota", element: <QuotaPage /> },
      { path: "activity", element: <ActivityPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "*", element: <Navigate to="/app" replace /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
  ],
  {
    // Opt into the v7 router behaviors early to keep the console clean.
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  },
)

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
