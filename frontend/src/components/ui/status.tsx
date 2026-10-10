// avoid-ai-design-ignore-file: I3 -- status must not rely on colour alone; Check is the literal meaning here
import { AlertTriangle, Check, CircleSlash, Loader2 } from "lucide-react"

export type StatusTone = "ok" | "warn" | "bad" | "neutral" | "busy"

const TONE_TEXT: Record<StatusTone, string> = {
  ok: "text-ok",
  warn: "text-warn",
  bad: "text-bad",
  neutral: "text-ink-2",
  busy: "text-accent-deep",
}

const ICONS: Record<StatusTone, { icon: typeof Check; label: string }> = {
  ok: { icon: Check, label: "OK" },
  warn: { icon: AlertTriangle, label: "Warning" },
  bad: { icon: AlertTriangle, label: "Error" },
  neutral: { icon: CircleSlash, label: "Inactive" },
  busy: { icon: Loader2, label: "In progress" },
}

/**
 * Status is an icon plus text, never colour alone and never a boxed chip:
 * chips are kept for the few places that need to scan as a column.
 */
export function StatusBadge({ tone, children, icon = true }: { tone: StatusTone; children: string; icon?: boolean }) {
  const { icon: Icon, label } = ICONS[tone]
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${TONE_TEXT[tone]}`}>
      {icon ? <Icon size={12} strokeWidth={2.2} aria-label={label} className={tone === "busy" ? "animate-spin" : ""} /> : null}
      {children}
    </span>
  )
}
