import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import { Link } from "react-router-dom"
import { AuthLayout } from "./auth-layout"
import { Field, Input } from "../components/ui/field"
import { Button } from "../components/ui/button"
import { forgotPassword } from "../api/auth"
import { ApiError } from "../api/client"
import { AuthNotice } from "./auth-notice"

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const returnToEmail = useRef(false)

  useEffect(() => {
    if (!sent && returnToEmail.current) {
      emailRef.current?.focus()
      returnToEmail.current = false
    }
  }, [sent])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setError(null)
    setBusy(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "We couldn’t connect. Please try again in a moment.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Let’s get you back in."
      description="Enter your account email and we’ll help you reset your password."
      footer={<Link to="/login">Back to sign in</Link>}
    >
      {sent ? (
        <AuthNotice kind="inbox" title="Check your inbox">
          <p>
            If an account exists for <strong>{email}</strong>, you’ll receive a link to reset your password.
          </p>
          <p className="auth-notice-hint">Can’t find the email? Check your spam folder.</p>
          <button type="button" className="auth-state-link" onClick={() => {
            returnToEmail.current = true
            setSent(false)
          }}>Try a different email</button>
        </AuthNotice>
      ) : (
        <form onSubmit={onSubmit} className="auth-form flex flex-col gap-5" aria-busy={busy}>
          <Field label="Email address" htmlFor="forgot-email" error={error}>
            <Input
              ref={emailRef}
              id="forgot-email"
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
              aria-describedby={error ? "forgot-email-feedback" : undefined}
            />
          </Field>
          <div className="auth-submit-row">
            <Button type="submit" variant="primary" loading={busy} disabled={!email}>
              {busy ? "Sending your link…" : "Send reset link"}
            </Button>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}
