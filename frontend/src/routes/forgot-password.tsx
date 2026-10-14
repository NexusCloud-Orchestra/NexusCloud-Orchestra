import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import { Link } from "react-router-dom"
import { AuthLayout } from "./auth-layout"
import { forgotPassword } from "../api/auth"
import { ApiError } from "../api/client"
import { AuthNotice } from "./auth-notice"
import { cn } from "../lib/utils"

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
      title="Reset password"
      description="Enter your account email and we’ll help you reset your password."
      footer={
        <Link
          to="/login"
          className="font-bold text-[#B38A1E] hover:text-[#8C6D1F] transition-colors underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <AuthNotice kind="inbox" title="Check your inbox">
          <p>
            If an account exists for <strong>{email}</strong>, you’ll receive a link to reset your password.
          </p>
          <p className="auth-notice-hint">Can’t find the email? Check your spam folder.</p>
          <button
            type="button"
            className="auth-state-link text-[#B38A1E] font-bold hover:text-[#8C6D1F] transition-colors"
            onClick={() => {
              returnToEmail.current = true
              setSent(false)
            }}
          >
            Try a different email
          </button>
        </AuthNotice>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-5 sm:gap-6" aria-busy={busy}>
          <div className="flex flex-col gap-2">
            <label htmlFor="forgot-email" className="text-sm sm:text-[15px] font-bold text-[#1E293B]">
              Email address
            </label>
            <input
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
              className="w-full bg-transparent border-b-2 border-[#CBD5E1] py-3 sm:py-3.5 text-base sm:text-[17px] font-semibold text-[#0F172A] placeholder-[#64748B] placeholder:text-sm sm:placeholder:text-base focus:outline-none focus:border-[#C59B27] transition-colors"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 font-semibold">
              {error}
            </p>
          )}

          <div className="pt-2 sm:pt-3">
            <button
              type="submit"
              disabled={busy || !email}
              className={cn(
                "w-full rounded-2xl py-4 sm:py-4.5 text-base sm:text-[17px] font-bold transition-all duration-200 flex items-center justify-center gap-2",
                email
                  ? "bg-[#16213E] text-white hover:bg-[#0E1528] active:scale-[0.99] shadow-md shadow-[#16213E]/15 cursor-pointer"
                  : "bg-[#CBD5E1] text-[#475569] cursor-not-allowed"
              )}
            >
              {busy ? "Sending your link…" : "Send reset link"}
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}
