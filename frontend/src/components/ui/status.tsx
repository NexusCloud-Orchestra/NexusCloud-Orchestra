import { cn } from "../../lib/utils"

/* Badge with explicit status + label (for files list, clouds etc) */
const statusStyles: Record<string, string> = {
  ok:      "bg-ok/10 text-ok border-ok/25",
  warn:    "bg-warn/10 text-warn border-warn/25",
  bad:     "bg-bad/10 text-bad border-bad/25",
  neutral: "bg-raise text-ink-2 border-line",
  brand:   "bg-brand/10 text-brand border-brand/25",
}

const dotStyles: Record<string, string> = {
  ok:      "bg-ok",
  warn:    "bg-warn",
  bad:     "bg-bad",
  neutral: "bg-ink-3",
  brand:   "bg-brand",
}

export function StatusBadge({
  status,
  label,
  tone,
  children,
  className,
}: {
  status?: keyof typeof statusStyles
  label?: string
  tone?: string
  children?: React.ReactNode
  className?: string
}) {
  const resolvedStatus = status ?? tone ?? "neutral"
  const styles = statusStyles[resolvedStatus] ?? statusStyles.neutral
  const dot = dotStyles[resolvedStatus] ?? dotStyles.neutral
  const text = label ?? children

  return (
    <span className={cn("badge border", styles, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", dot)} />
      {text}
    </span>
  )
}

/* Legacy alias */
export { StatusBadge as StatusPill }
