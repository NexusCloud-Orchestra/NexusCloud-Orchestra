import { AlertTriangle, Check, CircleSlash, Loader2 } from "lucide-react"

export type StatusTone = "ok" | "warn" | "bad" | "neutral" | "busy"

const TONE_CHIP: Record<StatusTone, string> = {
  ok: "border-ok-line bg-ok-wash text-ok",
  warn: "border-warn-line bg-warn-wash text-warn",
  bad: "border-bad-line bg-bad-wash text-bad",
  neutral: "border-line bg-raise text-ink-2",
  busy: "border-accent-line bg-accent-wash text-accent-deep",
}

const TONE_ICON: Record<StatusTone, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  bad: "bg-bad",
  neutral: "bg-ink-3",
  busy: "bg-accent",
}

const ICONS: Record<StatusTone, { icon: typeof Check; label: string }> = {
  ok: { icon: Check, label: "OK" },
  warn: { icon: AlertTriangle, label: "Warning" },
  bad: { icon: AlertTriangle, label: "Error" },
  neutral: { icon: CircleSlash, label: "Inactive" },
  busy: { icon: Loader2, label: "In progress" },
}

/**
 * Connection and operation status must never rely on color alone:
 * dot + icon + text.
 */
export function StatusBadge({
  tone,
  children,
  icon = true,
}: {
  tone: StatusTone
  children: string
  icon?: boolean
}) {
  const { icon: Icon, label } = ICONS[tone]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-xs border px-1.5 py-0.5 text-2xs font-medium uppercase tracking-kicker ${TONE_CHIP[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${TONE_ICON[tone]}`} aria-hidden />
      {icon ? <Icon size={10} strokeWidth={2.4} aria-label={label} className={tone === "busy" ? "animate-spin" : ""} /> : null}
      {children}
    </span>
  )
}
