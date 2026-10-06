import { useState } from "react"
import type { FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { AuthLayout } from "./auth-layout"
import { Field, Input } from "../components/ui/field"
import { Button } from "../components/ui/button"
import { resetPassword } from "../api/auth"
import { ApiError } from "../api/client"

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get("token") ?? ""
  const email = params.get("email") ?? ""
  const [newPassword, setNewPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
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
      setError(caught instanceof ApiError ? caught.message : "Could not reach the API.")
    } finally {
      setBusy(false)
    }
  }

  if (!token || !email) {
    return (
      <AuthLayout title="Reset password" description="This link is missing its reset token.">
        <p className="text-base text-ink-2">
          Request a new link from{" "}
          <Link to="/forgot-password" className="font-medium text-accent hover:text-accent-deep">
            reset password
          </Link>
          .
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Set a new password" description={`Resetting the password for ${email}.`}>
      {done ? (
        <div className="rounded-md border border-ok-line bg-ok-wash px-4 py-3.5 text-base text-ink-2">
          <p className="font-medium text-ok">Password updated</p>
          <p className="mt-1">All sessions were signed out.</p>
          <Button variant="primary" size="sm" className="mt-3" onClick={() => navigate("/login")}>
            Sign in
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Field
            label="New password"
            htmlFor="reset-password"
            hint="At least 8 characters, up to 72 UTF-8 bytes"
            error={error}
          >
            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              invalid={Boolean(error)}
            />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" loading={busy} disabled={!newPassword}>
              Update password
            </Button>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}
