import { cn } from "../../lib/utils"

interface ProgressProps {
  value: number
  max?: number
  className?: string
  variant?: "brand" | "ok" | "warn" | "bad" | "gold"
}

const fillVariants: Record<string, string> = {
  brand: "from-brand to-brand-2",
  ok:    "from-ok/80 to-ok",
  warn:  "from-warn/80 to-warn",
  bad:   "from-bad/80 to-bad",
  gold:  "from-gold/80 to-gold",
}

export function Progress({ value, max = 100, className, variant = "brand" }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn("nc-progress-track", className)}
    >
      <div
        className={cn("nc-progress-fill bg-gradient-to-r", fillVariants[variant])}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function ProgressBar({
  value,
  tone = "brand",
  className,
}: {
  value: number
  tone?: "brand" | "ok" | "warn" | "bad" | "gold" | "neutral" | "accent"
  className?: string
}) {
  const variantMap: Record<string, "brand" | "ok" | "warn" | "bad" | "gold"> = {
    brand: "brand",
    ok: "ok",
    warn: "warn",
    bad: "bad",
    gold: "gold",
    neutral: "brand",
    accent: "brand",
  }
  return <Progress value={value} variant={variantMap[tone] ?? "brand"} className={className} />
}
