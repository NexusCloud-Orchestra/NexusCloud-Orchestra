import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"
import { X } from "lucide-react"

export interface Toast {
  id: number
  tone: "neutral" | "success" | "error"
  message: string
}

interface ToastApi {
  notify: (message: string, tone?: Toast["tone"]) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const TONE_STYLES: Record<Toast["tone"], string> = {
  neutral: "border-line",
  success: "border-ok-line",
  error: "border-bad-line",
}

const TONE_DOT: Record<Toast["tone"], string> = {
  neutral: "bg-ink-3",
  success: "bg-ok",
  error: "bg-bad",
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback(
    (message: string, tone: Toast["tone"] = "neutral") => {
      counter.current += 1
      const id = counter.current
      setToasts((current) => [...current.slice(-3), { id, tone, message }])
      window.setTimeout(() => dismiss(id), 4200)
    },
    [dismiss],
  )

  const api = useMemo<ToastApi>(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 left-1/2 z-[70] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-slide-up pointer-events-auto flex items-center gap-2.5 rounded-md border bg-surface px-3.5 py-2.5 shadow-toast ${TONE_STYLES[toast.tone]}`}
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TONE_DOT[toast.tone]}`} aria-hidden />
            <p className="flex-1 text-sm text-ink">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="rounded-xs p-1 text-ink-3 transition-colors duration-fast hover:text-ink"
            >
              <X size={12} strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast must be used inside ToastProvider")
  return context
}
