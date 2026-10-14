import { useEffect, useRef } from "react"
import type { ReactNode } from "react"
import { createPortal } from "react-dom"
import { DIALOG_EXIT_MS, usePresence } from "../../hooks/use-presence"
import { Button } from "./button"

import { AlertTriangle, X } from "lucide-react"

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  body?: ReactNode
  confirmLabel: string
  tone?: "primary" | "danger"
  loading?: boolean
  disabled?: boolean
  onConfirm: () => void
  /** Alternative to `body` when extra controls (e.g. a password field) are needed. */
  children?: ReactNode
}

export function ConfirmModal({
  open,
  onClose,
  title,
  description,
  body,
  confirmLabel,
  tone = "primary",
  loading = false,
  disabled = false,
  onConfirm,
  children,
}: ConfirmModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  // Stay mounted through the exit transition; `open` drives enter/exit.
  const { mounted, closing } = usePresence(open, DIALOG_EXIT_MS)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onClose()
      if (event.key !== "Tab") return
      const items = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
      )
      if (!items?.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    const timer = window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>("button:not([disabled]), input:not([disabled])")?.focus(), 0)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      window.clearTimeout(timer)
      previous?.focus()
    }
  }, [open, onClose, loading])

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="presentation">
      <div
        className={`absolute inset-0 bg-brand-strong/40 backdrop-blur-xs ${closing ? "nc-backdrop-exit" : "nc-backdrop-enter"}`}
        onClick={() => { if (!loading) onClose() }}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-busy={loading || undefined}
        className={`relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-surface shadow-pop ${closing ? "nc-dialog-exit" : "nc-dialog-enter"}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            {tone === "danger" ? (
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-bad-line bg-bad-wash text-bad">
                <AlertTriangle size={14} strokeWidth={2} aria-hidden />
              </span>
            ) : null}
            <div className="min-w-0">
              <h2 className="text-md font-semibold tracking-tight text-ink">{title}</h2>
              {description ? <p className="mt-0.5 text-sm text-ink-3">{description}</p> : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close dialog"
            className="-mr-1 -mt-1 rounded-md p-1.5 text-ink-3 transition-colors duration-fast hover:bg-raise hover:text-ink disabled:opacity-50"
          >
            <X size={15} />
          </button>
        </div>
        {body || children ? (
          <div className="px-5 py-4 text-base leading-relaxed text-ink-2 [&_p+p]:mt-2.5">
            {body}
            {children}
          </div>
        ) : null}
        <div className="flex justify-end gap-2.5 border-t border-line bg-raise/50 px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button size="sm" variant={tone === "danger" ? "danger" : "primary"} loading={loading} disabled={disabled || loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
