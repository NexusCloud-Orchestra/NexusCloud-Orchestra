import type { ReactNode } from "react"

/**
 * A bordered surface group — used only where a resource or state is genuinely
 * isolated, per the design rules. Most structure comes from hairlines and
 * whitespace, not boxes.
 */
export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-md border border-line bg-surface ${className}`}>{children}</section>
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
    <header className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
      <div className="flex min-w-0 items-baseline gap-3">
        <h2 className="label-caps !text-ink-2">{title}</h2>
        {meta ? <div className="truncate font-mono text-2xs text-ink-3 tnum">{meta}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  )
}

export function Divider({ className = "" }: { className?: string }) {
  return <div role="presentation" className={`h-px bg-line ${className}`} />
}
