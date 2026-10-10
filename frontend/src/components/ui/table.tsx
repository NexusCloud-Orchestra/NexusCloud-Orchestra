import type { ReactNode } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

type Align = "left" | "right"

const ALIGN: Record<Align, string> = { left: "text-left", right: "text-right" }
const HIDE = { sm: "hidden sm:table-cell", md: "hidden md:table-cell", lg: "hidden lg:table-cell" } as const

/** Plain column header. `hideBelow` collapses the column on narrow screens. */
export function Th({
  children,
  align = "left",
  hideBelow,
  className = "",
}: {
  children?: ReactNode
  align?: Align
  hideBelow?: keyof typeof HIDE
  className?: string
}) {
  return (
    <th scope="col" className={`meta-label px-3 py-2 font-medium first:pl-1 last:pr-1 ${ALIGN[align]} ${hideBelow ? HIDE[hideBelow] : ""} ${className}`}>
      {children}
    </th>
  )
}

/** Column header that sorts the table. The state is exposed through aria-sort. */
export function SortableTh({
  label,
  active,
  dir,
  onSort,
  align = "left",
  hideBelow,
}: {
  label: string
  active: boolean
  dir: "asc" | "desc"
  onSort: () => void
  align?: Align
  hideBelow?: keyof typeof HIDE
}) {
  const Icon = dir === "asc" ? ChevronUp : ChevronDown
  return (
    <th
      scope="col"
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      className={`meta-label px-3 py-1 font-medium first:pl-1 last:pr-1 ${ALIGN[align]} ${hideBelow ? HIDE[hideBelow] : ""}`}
    >
      <button
        type="button"
        onClick={onSort}
        className={`inline-flex items-center gap-1 rounded-xs py-1 transition-colors duration-fast ease-out hover:text-ink ${
          active ? "text-ink" : ""
        } ${align === "right" ? "flex-row-reverse" : ""}`}
      >
        {label}
        <Icon size={12} aria-hidden className={active ? "opacity-100" : "opacity-0"} />
      </button>
    </th>
  )
}
