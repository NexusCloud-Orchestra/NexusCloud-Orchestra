import { useState } from "react"
import type { FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AuthLayout } from "./auth-layout"
import { Field, Input } from "../components/ui/field"
import { Button } from "../components/ui/button"
import { useAuth } from "../state/auth"
import { ApiError } from "../api/client"
import { ArrowRight } from "lucide-react"
import { PasswordInput } from "../components/ui/password-input"

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
    if (busy) return
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
        setError("We couldn’t connect. Please try again in a moment.")
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back."
      description="Sign in to bring your clouds back together."
      footer={
        <>
          New to NexusCloud?{" "}
          <Link to="/register" className="font-medium text-accent transition-colors duration-fast hover:text-accent-deep">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="auth-form flex flex-col gap-5" aria-busy={busy}>
        <Field label="Email address" htmlFor="login-email">
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            disabled={busy}
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setError(null)
            }}
            invalid={Boolean(error)}
            aria-describedby={error ? "login-error" : undefined}
          />
        </Field>
        <div className="auth-password-field">
          <div className="auth-password-recovery">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
          <Field label="Password" htmlFor="login-password">
            <PasswordInput
              id="login-password"
              autoComplete="current-password"
              required
              disabled={busy}
              placeholder="Enter your password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setError(null)
              }}
              invalid={Boolean(error)}
              aria-describedby={error ? "login-error" : undefined}
            />
          </Field>
        </div>
        {error ? (
          <p id="login-error" role="alert" className="rounded-sm border border-bad-line bg-bad-wash px-3 py-2 text-sm text-bad">
            {error}
            {rateLimited ? " Too many attempts — wait a minute and try again." : ""}
          </p>
        ) : null}
        <div className="auth-submit-row">
          <Button type="submit" variant="primary" loading={busy} disabled={!email || !password}>
            {busy ? "Signing you in…" : <>Sign in to your workspace <ArrowRight size={17} /></>}
          </Button>
        </div>
      </form>
    </AuthLayout>
  )
}
