export function ProgressBar({
  value,
  indeterminate = false,
  tone = "accent",
  className = "",
}: {
  /** 0–100. */
  value?: number
  indeterminate?: boolean
  tone?: "accent" | "warn" | "bad" | "ok"
  className?: string
}) {
  const toneClass = tone === "accent" ? "bg-accent" : tone === "warn" ? "bg-warn" : tone === "bad" ? "bg-bad" : "bg-ok"
  const clamped = Math.max(0, Math.min(100, value ?? 0))
  return (
    <div
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`relative h-1.5 w-full overflow-hidden rounded-full bg-line ${className}`}
    >
      {indeterminate ? (
        <div className={`animate-indeterminate absolute inset-y-0 left-0 w-1/3 rounded-full ${toneClass}`} />
      ) : (
        <div
          className={`animate-bar-grow h-full origin-left rounded-full ${toneClass}`}
          style={{ width: `${clamped}%` }}
        />
      )}
    </div>
  )
}
