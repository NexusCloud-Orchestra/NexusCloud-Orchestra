import type { ReactNode } from "react"

/** Inline metadata as separate items spaced apart, instead of strings joined with middle dots. */
export function Meta({ items, className = "" }: { items: Array<ReactNode | null | undefined | false>; className?: string }) {
  const shown = items.filter((item) => item !== null && item !== undefined && item !== false && item !== "")
  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-3 gap-y-0.5 ${className}`}>
      {shown.map((item, index) => (
        <span key={index}>{item}</span>
      ))}
    </span>
  )
}
