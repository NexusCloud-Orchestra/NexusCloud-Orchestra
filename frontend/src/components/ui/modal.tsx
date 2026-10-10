// avoid-ai-design-ignore-file: K3 -- blur only on the overlay scrim, over live content (DESIGN.md: Elevation)
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
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
      if (event.key !== "Tab" || !dialogRef.current) return
      // Keep Tab inside the dialog while it is modal.
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]",
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    // Prefer a field supplied by the caller; otherwise the confirm button.
    const timer = window.setTimeout(() => {
      const field = dialogRef.current?.querySelector<HTMLElement>("input, textarea, select")
      ;(field ?? confirmRef.current)?.focus()
    }, 0)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      window.clearTimeout(timer)
      opener?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="presentation">
      <div className="animate-fade-in absolute inset-0 bg-night/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-scale-in relative w-full max-w-md rounded-md border border-line bg-surface shadow-pop"
      >
        <div className="border-b border-line px-5 py-3.5">
          <h2 className="text-md font-semibold tracking-tight text-ink">{title}</h2>
        </div>
        {body || children ? (
          <div className="flex flex-col gap-3 px-5 py-4 text-base text-ink-2">
            {body}
            {children}
          </div>
        ) : null}
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
