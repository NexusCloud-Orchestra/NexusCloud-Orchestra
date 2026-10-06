import { useState } from "react"
import type { FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AuthLayout } from "./auth-layout"
import { Field, Input } from "../components/ui/field"
import { Button } from "../components/ui/button"
import { useAuth } from "../state/auth"
import { ApiError } from "../api/client"

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
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
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
        setError("Could not reach the API. Check that the backend is running.")
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Create account"
      description="Connect the cloud storage you already own and manage it from one control plane."
      footer={
        <>
          Already registered?{" "}
          <Link to="/login" className="font-medium text-accent transition-colors duration-fast hover:text-accent-deep">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" htmlFor="register-first" error={fieldErrors.first_name}>
            <Input
              id="register-first"
              autoComplete="given-name"
              required
              value={values.first_name}
              onChange={(event) => update("first_name", event.target.value)}
              invalid={Boolean(fieldErrors.first_name)}
            />
          </Field>
          <Field label="Last name" htmlFor="register-last" error={fieldErrors.last_name}>
            <Input
              id="register-last"
              autoComplete="family-name"
              required
              value={values.last_name}
              onChange={(event) => update("last_name", event.target.value)}
              invalid={Boolean(fieldErrors.last_name)}
            />
          </Field>
        </div>
        <Field label="Email" htmlFor="register-email" error={fieldErrors.email}>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            required
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            invalid={Boolean(fieldErrors.email)}
          />
        </Field>
        <Field
          label="Password"
          htmlFor="register-password"
          hint="At least 8 characters, up to 72 UTF-8 bytes"
          error={fieldErrors.password}
        >
          <Input
            id="register-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={values.password}
            onChange={(event) => update("password", event.target.value)}
            invalid={Boolean(fieldErrors.password)}
          />
        </Field>
        {error ? (
          <p role="alert" className="rounded-sm border border-bad-line bg-bad-wash px-3 py-2 text-sm text-bad">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={busy} disabled={!values.email || !values.password}>
            Create account
          </Button>
        </div>
      </form>
    </AuthLayout>
  )
}
