import { useEffect, useState } from "react"

// Exit durations (ms). Dialogs close slightly faster than they open.
export const DIALOG_EXIT_MS = 170
export const MENU_EXIT_MS = 120

/**
 * Keeps an overlay mounted while its exit animation plays, so the closing
 * transition can render before the node is removed. `closing` selects the exit
 * class. Reduced-motion users unmount immediately.
 */
export function usePresence(open: boolean, exitMs: number) {
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      setClosing(false)
      return
    }
    if (!mounted) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    setClosing(true)
    const timer = window.setTimeout(() => {
      setMounted(false)
      setClosing(false)
    }, reduced ? 0 : exitMs)
    return () => window.clearTimeout(timer)
  }, [open, mounted, exitMs])

  return { mounted, closing }
}
