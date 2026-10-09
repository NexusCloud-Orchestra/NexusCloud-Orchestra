import { useEffect, useRef } from "react"
import type { ReactNode } from "react"
import { createPortal } from "react-dom"
import { Button } from "./button"

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  title: string
  body?: ReactNode
  confirmLabel: string
  tone?: "primary" | "danger"
  loading?: boolean
  onConfirm: () => void
  /** Alternative to `body` when extra controls (e.g. a password field) are needed. */
  children?: ReactNode
}

export function ConfirmModal({
  open,
  onClose,
  title,
  body,
  confirmLabel,
  tone = "primary",
  loading = false,
  onConfirm,
  children,
}: ConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    const timer = window.setTimeout(() => confirmRef.current?.focus(), 0)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      window.clearTimeout(timer)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="presentation">
      <div className="animate-fade-in absolute inset-0 bg-night/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-scale-in relative w-full max-w-md rounded-md border border-line bg-surface shadow-pop"
      >
        <div className="border-b border-line px-5 py-3.5">
          <h2 className="text-md font-semibold tracking-tight text-ink">{title}</h2>
        </div>
        {(body ?? children) ? <div className="px-5 py-4 text-base text-ink-2 [&_p+p]:mt-2">{body ?? children}</div> : null}
        {children}
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" variant={tone === "danger" ? "danger" : "primary"} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
