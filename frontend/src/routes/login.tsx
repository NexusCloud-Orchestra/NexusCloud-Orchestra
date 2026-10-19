import { useState } from "react"
import type { FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import { AuthLayout } from "./auth-layout"
import { useAuth } from "../state/auth"
import { useTheme, THEME_STORAGE_KEY } from "../state/theme"
import { ApiError } from "../api/client"
import { cn } from "../lib/utils"

export function LoginPage() {
  const { signIn } = useAuth()
  const { setTheme } = useTheme()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rateLimited, setRateLimited] = useState(false)
  const [busy, setBusy] = useState(false)

  const isComplete = email.trim().length > 0 && password.length > 0

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setError(null)
    setRateLimited(false)
    setBusy(true)
    try {
      await signIn(email, password)
      setTheme("light")
      try {
        localStorage.removeItem(THEME_STORAGE_KEY)
        localStorage.setItem(THEME_STORAGE_KEY, "light")
      } catch (_) {}
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
      title="Sign in"
      description="Welcome back to your cloud workspace."
      footer={
        <>
          New to NexusCloud?{" "}
          <Link
            to="/register"
            className="font-bold text-[#B38A1E] hover:text-[#8C6D1F] transition-colors underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5 sm:gap-6" aria-busy={busy}>
        {/* Email Field */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-email" className="text-xs font-mono font-bold uppercase tracking-wider text-regal-navy">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            disabled={busy}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError(null)
            }}
            className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-[#0F172A] placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-regal-navy focus:ring-2 focus:ring-regal-navy/20 transition-all duration-150 shadow-2xs"
          />
        </div>

        {/* Password Field */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="text-xs font-mono font-bold uppercase tracking-wider text-regal-navy">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-royal-gold hover:text-royal-gold/80 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              disabled={busy}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(null)
              }}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 sm:py-3 pr-11 text-sm sm:text-base font-semibold text-[#0F172A] placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-regal-navy focus:ring-2 focus:ring-regal-navy/20 transition-all duration-150 shadow-2xs"
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
        </div>

        {/* Error message */}
        {error ? (
          <p
            id="login-error"
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 font-semibold"
          >
            {error}
            {rateLimited ? " Too many attempts — wait a minute and try again." : ""}
          </p>
        ) : null}

        {/* Submit button */}
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
                <span>Signing in…</span>
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </div>
      </form>
    </AuthLayout>
  )
}
