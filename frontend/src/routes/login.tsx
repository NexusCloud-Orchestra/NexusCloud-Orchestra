import { useState } from "react"
import type { FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AuthLayout } from "./auth-layout"
import { Field, Input } from "../components/ui/field"
import { Button } from "../components/ui/button"
import { useAuth } from "../state/auth"
import { ApiError } from "../api/client"

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [rateLimited, setRateLimited] = useState(false)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setRateLimited(false)
    setBusy(true)
    try {
      await signIn(email, password)
      navigate("/app", { replace: true })
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message)
        setRateLimited(caught.status === 429)
      } else {
        setError("Could not reach the API. Check that the backend is running.")
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      description="Access the storage control plane for your connected clouds."
      footer={
        <>
          No account?{" "}
          <Link to="/register" className="font-medium text-accent transition-colors duration-fast hover:text-accent-deep">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="Email" htmlFor="login-email">
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            invalid={Boolean(error)}
          />
        </Field>
        <Field label="Password" htmlFor="login-password">
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            invalid={Boolean(error)}
          />
        </Field>
        {error ? (
          <p role="alert" className="rounded-sm border border-bad-line bg-bad-wash px-3 py-2 text-sm text-bad">
            {error}
            {rateLimited ? " Too many attempts — wait a minute and try again." : ""}
          </p>
        ) : null}
        <div className="flex items-center justify-between">
          <Link
            to="/forgot-password"
            className="text-sm text-ink-2 transition-colors duration-fast hover:text-ink"
          >
            Forgot password?
          </Link>
          <Button type="submit" variant="primary" loading={busy} disabled={!email || !password}>
            Sign in
          </Button>
        </div>
      </form>
    </AuthLayout>
  )
}
