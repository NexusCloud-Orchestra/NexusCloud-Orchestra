import type { ReactNode } from "react"

/**
 * A ruled group. One level only: a Panel never contains another Panel.
 * Most structure comes from hairlines and spacing, not boxes.
 */
export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`surface rounded-md border border-line ${className}`}>{children}</section>
}

export function PanelHeader({
  title,
  meta,
  actions,
}: {
  title: ReactNode
  meta?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="flex min-h-11 items-center justify-between gap-4 border-b border-line px-4 py-2">
      <div className="flex min-w-0 items-baseline gap-3">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {meta ? <div className="truncate text-sm text-ink-3 tnum">{meta}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  )
}

/** Unboxed section: a title over a hairline, for content that should sit on the page itself. */
export function Section({
  title,
  meta,
  actions,
  children,
  className = "",
}: {
  title: ReactNode
  meta?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={className}>
      <header className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
        <div className="flex min-w-0 items-baseline gap-3">
          <h2 className="text-md font-semibold text-ink">{title}</h2>
          {meta ? <div className="truncate text-sm text-ink-3 tnum">{meta}</div> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-3 text-sm">{actions}</div> : null}
      </header>
      {children}
    </section>
  )
}

export function Divider({ className = "" }: { className?: string }) {
  return <div role="presentation" className={`h-px bg-line ${className}`} />
}
