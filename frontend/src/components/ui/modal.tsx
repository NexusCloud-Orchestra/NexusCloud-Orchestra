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
  const panelRef = useRef<HTMLDivElement>(null)

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

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="presentation">
      <div className="animate-fade-in absolute inset-0 bg-deep/40 backdrop-blur-sm" onClick={() => { if (!loading) onClose() }} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-scale-in relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-md border border-line bg-surface shadow-pop"
      >
        <div className="border-b border-line px-5 py-3.5">
          <h2 className="text-md font-semibold tracking-tight text-ink">{title}</h2>
        </div>
        {body || children ? <div className="px-5 py-4 text-base text-ink-2 [&_p+p]:mt-2">{body}{children}</div> : null}
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
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
