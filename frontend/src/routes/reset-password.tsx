import { useState } from "react"
import type { FormEvent } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { AuthLayout } from "./auth-layout"
import { Field } from "../components/ui/field"
import { PasswordInput } from "../components/ui/password-input"
import { Button } from "../components/ui/button"
import { resetPassword } from "../api/auth"
import { ApiError } from "../api/client"
import { AuthNotice } from "./auth-notice"

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get("token") ?? ""
  const email = params.get("email") ?? ""
  const [newPassword, setNewPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setError(null)
    if (newPassword.length < 8) {
      setError("Use at least 8 characters")
      return
    }
    setBusy(true)
    try {
      await resetPassword({ email, token, new_password: newPassword })
      setDone(true)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "We couldn’t connect. Please try again in a moment.")
    } finally {
      setBusy(false)
    }
  }

  if (!token || !email) {
    return (
      <AuthLayout title="Let’s try a fresh link." description="This password reset link is incomplete.">
        <AuthNotice kind="invalid" title="Request a new reset link">
          <p>Enter your account email again and we’ll help you get back into your workspace.</p>
          <Link to="/forgot-password" className="auth-state-action">
            Get a new link
          </Link>
        </AuthNotice>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Set a new password" description={`Resetting the password for ${email}.`}>
      {done ? (
        <AuthNotice kind="success" title="You’re ready to go.">
          <p>Your password has been updated and your previous sessions have been signed out.</p>
          <Link to="/login" className="auth-state-action">Back to sign in</Link>
        </AuthNotice>
      ) : (
        <form onSubmit={onSubmit} className="auth-form flex flex-col gap-5" aria-busy={busy}>
          <Field
            label="New password"
            htmlFor="reset-password"
            hint="Use at least 8 characters."
            error={error}
          >
            <PasswordInput
              id="reset-password"
              autoComplete="new-password"
              required
              disabled={busy}
              minLength={8}
              placeholder="Create a new password"
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value)
                setError(null)
              }}
              invalid={Boolean(error)}
              aria-describedby="reset-password-feedback"
            />
          </Field>
          <div className="auth-submit-row">
            <Button type="submit" variant="primary" loading={busy} disabled={!newPassword}>
              {busy ? "Updating your password…" : "Update password"}
            </Button>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}
