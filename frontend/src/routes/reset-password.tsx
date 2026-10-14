import { useState } from "react"
import type { FormEvent } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import { AuthLayout } from "./auth-layout"
import { resetPassword } from "../api/auth"
import { ApiError } from "../api/client"
import { AuthNotice } from "./auth-notice"
import { cn } from "../lib/utils"

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get("token") ?? ""
  const email = params.get("email") ?? ""
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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
          <Link to="/forgot-password" className="auth-state-action bg-[#16213E] text-white rounded-xl">
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
          <Link to="/login" className="auth-state-action bg-[#16213E] text-white rounded-xl">
            Back to sign in
          </Link>
        </AuthNotice>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-5 sm:gap-6" aria-busy={busy}>
          <div className="flex flex-col gap-2">
            <label htmlFor="reset-pass" className="text-sm sm:text-[15px] font-bold text-[#1E293B]">
              New password
            </label>
            <div className="relative">
              <input
                id="reset-pass"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                disabled={busy}
                minLength={8}
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  setError(null)
                }}
                className="w-full bg-transparent border-b-2 border-[#CBD5E1] py-3 sm:py-3.5 pr-11 text-base sm:text-[17px] font-semibold text-[#0F172A] placeholder-[#64748B] placeholder:text-sm sm:placeholder:text-base focus:outline-none focus:border-[#C59B27] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#0F172A] transition-colors p-1.5"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {error && <p className="text-xs font-semibold text-rose-500">{error}</p>}
          </div>

          <div className="pt-2 sm:pt-3">
            <button
              type="submit"
              disabled={busy || newPassword.length < 8}
              className={cn(
                "w-full rounded-2xl py-4 sm:py-4.5 text-base sm:text-[17px] font-bold transition-all duration-200 flex items-center justify-center gap-2",
                newPassword.length >= 8
                  ? "bg-[#16213E] text-white hover:bg-[#0E1528] active:scale-[0.99] shadow-md shadow-[#16213E]/15 cursor-pointer"
                  : "bg-[#CBD5E1] text-[#475569] cursor-not-allowed"
              )}
            >
              {busy ? "Updating your password…" : "Update password"}
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}
