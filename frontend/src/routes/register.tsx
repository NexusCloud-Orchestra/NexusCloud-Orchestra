import { useState } from "react"
import type { FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import { AuthLayout } from "./auth-layout"
import { useAuth } from "../state/auth"
import { ApiError } from "../api/client"
import { cn } from "../lib/utils"

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
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function update(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => ({ ...current, [key]: undefined }))
    setError(null)
  }

  const isComplete =
    values.first_name.trim().length > 0 &&
    values.last_name.trim().length > 0 &&
    values.email.trim().length > 0 &&
    values.password.length >= 8

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
          <Link
            to="/login"
            className="font-bold text-[#B38A1E] hover:text-[#8C6D1F] transition-colors underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4 sm:gap-5" aria-busy={busy}>
        {/* First & Last Name */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reg-first" className="text-xs font-mono font-bold uppercase tracking-wider text-regal-navy">
              First name
            </label>
            <input
              id="reg-first"
              type="text"
              required
              disabled={busy}
              placeholder="First name"
              value={values.first_name}
              onChange={(e) => update("first_name", e.target.value)}
              className={cn(
                "w-full bg-white border rounded-lg px-3.5 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-[#0F172A] placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-regal-navy focus:ring-2 focus:ring-regal-navy/20 transition-all duration-150 shadow-2xs",
                fieldErrors.first_name ? "border-rose-400 bg-rose-50/20" : "border-slate-300"
              )}
            />
            {fieldErrors.first_name && <p className="text-2xs font-mono font-bold text-rose-600">{fieldErrors.first_name}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="reg-last" className="text-xs font-mono font-bold uppercase tracking-wider text-regal-navy">
              Last name
            </label>
            <input
              id="reg-last"
              type="text"
              required
              disabled={busy}
              placeholder="Last name"
              value={values.last_name}
              onChange={(e) => update("last_name", e.target.value)}
              className={cn(
                "w-full bg-white border rounded-lg px-3.5 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-[#0F172A] placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-regal-navy focus:ring-2 focus:ring-regal-navy/20 transition-all duration-150 shadow-2xs",
                fieldErrors.last_name ? "border-rose-400 bg-rose-50/20" : "border-slate-300"
              )}
            />
            {fieldErrors.last_name && <p className="text-2xs font-mono font-bold text-rose-600">{fieldErrors.last_name}</p>}
          </div>
        </div>

        {/* Email Address */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reg-email" className="text-xs font-mono font-bold uppercase tracking-wider text-regal-navy">
            Email address
          </label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            required
            disabled={busy}
            placeholder="you@example.com"
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
            className={cn(
              "w-full bg-white border rounded-lg px-3.5 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-[#0F172A] placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-regal-navy focus:ring-2 focus:ring-regal-navy/20 transition-all duration-150 shadow-2xs",
              fieldErrors.email ? "border-rose-400 bg-rose-50/20" : "border-slate-300"
            )}
          />
          {fieldErrors.email && <p className="text-2xs font-mono font-bold text-rose-600">{fieldErrors.email}</p>}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reg-pass" className="text-xs font-mono font-bold uppercase tracking-wider text-regal-navy">
            Password
          </label>
          <div className="relative">
            <input
              id="reg-pass"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              disabled={busy}
              placeholder="At least 8 characters"
              value={values.password}
              onChange={(e) => update("password", e.target.value)}
              className={cn(
                "w-full bg-white border rounded-lg px-3.5 py-2.5 sm:py-3 pr-11 text-sm sm:text-base font-semibold text-[#0F172A] placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-regal-navy focus:ring-2 focus:ring-regal-navy/20 transition-all duration-150 shadow-2xs",
                fieldErrors.password ? "border-rose-400 bg-rose-50/20" : "border-slate-300"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-regal-navy transition-colors p-1.5"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {fieldErrors.password && <p className="text-2xs font-mono font-bold text-rose-600">{fieldErrors.password}</p>}
        </div>


        {error && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 font-semibold">
            {error}
          </p>
        )}

        <div className="pt-2 sm:pt-3">
          <button
            type="submit"
            disabled={busy || !isComplete}
            className={cn(
              "w-full rounded-2xl py-4 sm:py-4.5 text-base sm:text-[17px] font-bold transition-all duration-200 flex items-center justify-center gap-2",
              isComplete
                ? "bg-[#16213E] text-white hover:bg-[#0E1528] active:scale-[0.99] shadow-md shadow-[#16213E]/15 cursor-pointer"
                : "bg-[#CBD5E1] text-[#475569] cursor-not-allowed"
            )}
          >
            {busy ? (
              <>
                <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>Creating account…</span>
              </>
            ) : (
              "Create account"
            )}
          </button>
        </div>
      </form>
    </AuthLayout>
  )
}
