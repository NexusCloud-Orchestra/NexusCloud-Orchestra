import { useRef } from "react"
import type { KeyboardEvent, ReactNode } from "react"

export interface TabItem<T extends string> {
  id: T
  label: string
}

/**
 * Switches between panels of one page (Settings sections). Roving tabindex with arrow keys,
 * Home and End. `side` lays the tabs out as a column from md up and a scrolling row below.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  prefix,
  side = false,
}: {
  items: Array<TabItem<T>>
  value: T
  onChange: (id: T) => void
  label: string
  /** Unique per page; ties each tab to its TabPanel. */
  prefix: string
  side?: boolean
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = items.findIndex((item) => item.id === value)
    let next = index
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % items.length
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + items.length) % items.length
    else if (event.key === "Home") next = 0
    else if (event.key === "End") next = items.length - 1
    else return
    event.preventDefault()
    const target = items[next]
    if (!target) return
    onChange(target.id)
    refs.current[target.id]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={
        side
          ? "flex gap-1 overflow-x-auto border-b border-line md:flex-col md:overflow-visible md:border-b-0"
          : "flex gap-1 overflow-x-auto border-b border-line"
      }
    >
      {items.map((item) => {
        const selected = item.id === value
        return (
          <button
            key={item.id}
            ref={(node) => {
              refs.current[item.id] = node
            }}
            type="button"
            role="tab"
            id={`${prefix}-tab-${item.id}`}
            aria-selected={selected}
            aria-controls={`${prefix}-panel-${item.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={`whitespace-nowrap px-3 py-2 text-left text-base transition-colors duration-fast ease-out ${
              side ? "-mb-px border-b-2 md:mb-0 md:-ml-px md:border-b-0 md:border-l-2" : "-mb-px border-b-2"
            } ${selected ? "border-accent font-medium text-ink" : "border-transparent text-ink-2 hover:text-ink"}`}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

export function TabPanel({ prefix, id, children }: { prefix: string; id: string; children: ReactNode }) {
  return (
    <div role="tabpanel" id={`${prefix}-panel-${id}`} aria-labelledby={`${prefix}-tab-${id}`} tabIndex={0} className="outline-offset-4">
      {children}
    </div>
  )
}

/** Filters one list. Not tabs: nothing swaps panels, so each option is a toggle button. */
export function FilterBar<T extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: Array<{ id: T; label: string; count?: number }>
  value: T
  onChange: (id: T) => void
  label: string
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-x-1 border-b border-line">
      {items.map((item) => {
        const selected = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(item.id)}
            className={`-mb-px inline-flex items-baseline gap-1.5 border-b-2 px-3 py-2 text-base transition-colors duration-fast ease-out ${
              selected ? "border-accent font-medium text-ink" : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            {item.label}
            {item.count !== undefined ? <span className="font-mono text-xs text-ink-3 tnum">{item.count}</span> : null}
          </button>
        )
      })}
    </div>
  )
}
