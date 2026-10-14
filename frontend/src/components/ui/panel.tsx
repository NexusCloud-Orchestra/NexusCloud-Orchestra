import { cn } from "../../lib/utils"

interface PanelHeaderProps {
  title?: React.ReactNode
  meta?: React.ReactNode
  actions?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function Panel({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("nc-card overflow-hidden", className)} {...props}>
      {children}
    </div>
  )
}

export function PanelHeader({ title, meta, actions, children, className }: PanelHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5", className)}>
      <div className="flex items-center gap-3 min-w-0">
        {title && <span className="font-semibold text-sm text-ink truncate">{title}</span>}
        {meta && <span className="font-mono text-2xs text-ink-3">{meta}</span>}
        {children}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px bg-line", className)} />
}
