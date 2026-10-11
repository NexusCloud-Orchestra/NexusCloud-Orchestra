import { useState } from "react"
import type { FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AuthLayout } from "./auth-layout"
import { Field, Input } from "../components/ui/field"
import { Button } from "../components/ui/button"
import { useAuth } from "../state/auth"
import { ApiError } from "../api/client"
import { PasswordInput } from "../components/ui/password-input"

interface FieldErrors {
  first_name?: string
  last_name?: string
  email?: string
  password?: string
}

export function RegisterPage() {
  const { signUp, signIn } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({ first_name: "", last_name: "", email: "", password: "" })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function update(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => ({ ...current, [key]: undefined }))
    setError(null)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setFieldErrors({})
    setError(null)
    if (values.password.length < 8) {
      setFieldErrors({ password: "Use at least 8 characters" })
      return
    }
    setBusy(true)
    try {
      await signUp(values)
      await signIn(values.email, values.password)
      navigate("/app", { replace: true })
    } catch (caught) {
      if (caught instanceof ApiError) {
        if (caught.status === 422 && caught.details) {
          const mapped: FieldErrors = {}
          for (const issue of caught.details) {
            const key = issue.field.replace(/^body\./, "") as keyof FieldErrors
            if (key in values) mapped[key] = issue.message
          }
          setFieldErrors(mapped)
          if (Object.keys(mapped).length === 0) setError(caught.message)
        } else {
          setError(caught.message)
        }
      } else {
        setError("We couldn’t connect. Please try again in a moment.")
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Create account"
      description="One account. All your cloud storage."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-accent transition-colors duration-fast hover:text-accent-deep">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="auth-form flex flex-col gap-5" aria-busy={busy}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" htmlFor="register-first" error={fieldErrors.first_name}>
            <Input
              id="register-first"
              autoComplete="given-name"
              required
              disabled={busy}
              placeholder="First name"
              value={values.first_name}
              onChange={(event) => update("first_name", event.target.value)}
              invalid={Boolean(fieldErrors.first_name)}
              aria-describedby={fieldErrors.first_name ? "register-first-feedback" : undefined}
            />
          </Field>
          <Field label="Last name" htmlFor="register-last" error={fieldErrors.last_name}>
            <Input
              id="register-last"
              autoComplete="family-name"
              required
              disabled={busy}
              placeholder="Last name"
              value={values.last_name}
              onChange={(event) => update("last_name", event.target.value)}
              invalid={Boolean(fieldErrors.last_name)}
              aria-describedby={fieldErrors.last_name ? "register-last-feedback" : undefined}
            />
          </Field>
        </div>
        <Field label="Email address" htmlFor="register-email" error={fieldErrors.email}>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            required
            disabled={busy}
            placeholder="you@example.com"
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "register-email-feedback" : undefined}
          />
        </Field>
        <Field
          label="Password"
          htmlFor="register-password"
          hint="Use at least 8 characters."
          error={fieldErrors.password}
        >
          <PasswordInput
            id="register-password"
            autoComplete="new-password"
            required
            disabled={busy}
            minLength={8}
            placeholder="Create a password"
            value={values.password}
            onChange={(event) => update("password", event.target.value)}
            invalid={Boolean(fieldErrors.password)}
            aria-describedby="register-password-feedback"
          />
        </Field>
        {error ? (
          <p role="alert" className="rounded-sm border border-bad-line bg-bad-wash px-3 py-2 text-sm text-bad">
            {error}
          </p>
        ) : null}
        <div className="auth-submit-row">
          <Button type="submit" variant="primary" loading={busy} disabled={!values.email || !values.password}>
            {busy ? "Creating account…" : "Create account"}
          </Button>
        </div>
      </form>
    </AuthLayout>
  )
}
