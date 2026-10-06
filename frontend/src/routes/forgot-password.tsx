import { useState } from "react"
import type { FormEvent } from "react"
import { Link } from "react-router-dom"
import { AuthLayout } from "./auth-layout"
import { Field, Input } from "../components/ui/field"
import { Button } from "../components/ui/button"
import { forgotPassword } from "../api/auth"
import { ApiError } from "../api/client"

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not reach the API.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Reset password"
      description="Enter the account email. If it exists, a reset link will be sent."
    >
      {sent ? (
        <div className="rounded-md border border-line bg-surface px-4 py-3.5 text-base text-ink-2">
          <p className="font-medium text-ink">Check your inbox</p>
          <p className="mt-1">
            If an account exists for {email}, a reset link is on its way. The link opens a page where a new
            password can be set.
          </p>
          <p className="mt-2 text-sm text-ink-3">
            Note: password email requires SMTP to be configured on the backend. Without it, no mail is sent.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Field label="Email" htmlFor="forgot-email" error={error}>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              invalid={Boolean(error)}
            />
          </Field>
          <div className="flex items-center justify-between">
            <Link to="/login" className="text-sm text-ink-2 transition-colors duration-fast hover:text-ink">
              Back to sign in
            </Link>
            <Button type="submit" variant="primary" loading={busy} disabled={!email}>
              Send reset link
            </Button>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}
