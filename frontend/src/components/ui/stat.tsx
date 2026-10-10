import type { ReactNode } from "react"

/** One labelled figure. Render inside a <dl>. */
export function Stat({
  term,
  value,
  hint,
  tone = "text-ink",
}: {
  term: string
  value: ReactNode
  hint?: ReactNode
  tone?: string
}) {
  return (
    <div>
      <dt className="text-sm text-ink-3">{term}</dt>
      <dd className={`mt-1 text-2xl font-semibold tracking-tight tnum ${tone}`}>{value}</dd>
      {hint ? <dd className="mt-0.5 text-sm text-ink-3">{hint}</dd> : null}
    </div>
  )
}
