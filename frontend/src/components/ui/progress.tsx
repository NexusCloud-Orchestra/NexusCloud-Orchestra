export function ProgressBar({
  value,
  indeterminate = false,
  tone = "accent",
  className = "",
  label,
}: {
  /** 0-100. */
  value?: number
  indeterminate?: boolean
  tone?: "accent" | "warn" | "bad" | "ok"
  className?: string
  label?: string
}) {
  const toneClass = tone === "accent" ? "bg-accent" : tone === "warn" ? "bg-warn" : tone === "bad" ? "bg-bad" : "bg-ok"
  const clamped = Math.max(0, Math.min(100, value ?? 0))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={indeterminate ? undefined : Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`relative h-1.5 w-full overflow-hidden rounded-full bg-line ${className}`}
    >
      {indeterminate ? (
        <div className={`animate-indeterminate absolute inset-y-0 left-0 w-1/3 rounded-full ${toneClass}`} />
      ) : (
        <div className={`h-full origin-left rounded-full transition-[width] duration-slow ease-out ${toneClass}`} style={{ width: `${clamped}%` }} />
      )}
    </div>
  )
}

/** Used (solid) plus reserved (translucent) over a track, sized to a cloud's limit. */
export function CapacityBar({
  used,
  reserved = 0,
  limit,
  label,
  className = "",
}: {
  used: number
  reserved?: number
  limit: number
  label: string
  className?: string
}) {
  const pct = (value: number) => (limit > 0 ? Math.min(100, (value / limit) * 100) : 0)
  const usedPct = pct(used)
  const total = pct(used + reserved)
  const tone = total >= 90 ? "bg-bad" : total >= 75 ? "bg-warn" : "bg-accent"
  return (
    <div
      role="img"
      aria-label={label}
      className={`flex h-1.5 w-full overflow-hidden rounded-full bg-line ${className}`}
    >
      <div className={`h-full ${tone}`} style={{ width: `${usedPct}%` }} />
      <div className={`h-full ${tone} opacity-40`} style={{ width: `${Math.max(0, total - usedPct)}%` }} />
    </div>
  )
}
