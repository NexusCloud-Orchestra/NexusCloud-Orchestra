import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"

export interface MenuItem {
  label: string
  onSelect: () => void
  tone?: "default" | "danger"
  disabled?: boolean
}

export function Menu({ trigger, items, label }: { trigger: ReactNode; items: MenuItem[]; label: string }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex"
      >
        {trigger}
      </button>
      {open ? (
        <div
          role="menu"
          className="animate-scale-in absolute right-0 top-full z-40 mt-1 min-w-40 rounded-md border border-line bg-surface py-1 shadow-pop"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false)
                item.onSelect()
              }}
              className={`block w-full px-3 py-1.5 text-left text-base transition-colors duration-fast hover:bg-raise disabled:cursor-not-allowed disabled:text-ink-3 ${
                item.tone === "danger" ? "text-bad hover:bg-bad-wash" : "text-ink"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
