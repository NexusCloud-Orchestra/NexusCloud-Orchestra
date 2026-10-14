import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { MENU_EXIT_MS, usePresence } from "../../hooks/use-presence"

export interface MenuItem {
  label: string
  onSelect: () => void
  tone?: "default" | "danger"
  disabled?: boolean
}

export function Menu({ trigger, items, label }: { trigger: ReactNode; items: MenuItem[]; label: string }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const { mounted, closing } = usePresence(open, MENU_EXIT_MS)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      const root = rootRef.current
      const menuItems = [...(root?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])') ?? [])]
      const index = menuItems.indexOf(document.activeElement as HTMLButtonElement)
      if (event.key === "Escape" || event.key === "Tab") {
        setOpen(false)
        if (event.key === "Escape") root?.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]')?.focus()
      } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault()
        const next = event.key === "Home" ? 0 : event.key === "End" ? menuItems.length - 1
          : (index + (event.key === "ArrowDown" ? 1 : -1) + menuItems.length) % menuItems.length
        menuItems[next]?.focus()
      }
    }
    rootRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus()
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
      {mounted ? (
        <div
          role="menu"
          className={`absolute right-0 top-full z-40 mt-1.5 min-w-44 max-w-[calc(100vw-24px)] rounded-xl border border-line bg-surface py-1.5 shadow-pop ${closing ? "nc-menu-exit" : "nc-menu-enter"}`}
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
                rootRef.current?.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]')?.focus()
              }}
              className={`block min-h-10 w-full px-3.5 py-2 text-left text-base transition-colors duration-base hover:bg-raise disabled:cursor-not-allowed disabled:text-ink-3 ${
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
