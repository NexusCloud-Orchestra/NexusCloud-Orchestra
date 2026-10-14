import { cn } from "../../lib/utils"
import { AlertTriangle, CloudOff, Search, RefreshCw, Inbox } from "lucide-react"

/* ── Skeleton base ── */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[#FAF6ED]", className)}
      {...props}
    />
  )
}

export function StatSkeleton() {
  return (
    <div className="rounded-xl border border-[#E8E0D1] bg-white p-5 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-[#E8E0D1]/60">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3.5">
          <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-2.5 w-24" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  )
}

/* ── Compact, purposeful Empty State ── */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  body,
  action,
  className,
}: {
  icon?: React.ElementType
  title: string
  description?: string
  body?: string
  action?: React.ReactNode
  className?: string
}) {
  const desc = description ?? body
  return (
    <div className={cn("flex flex-col items-center justify-center py-8 sm:py-10 px-4 text-center max-w-md mx-auto", className)}>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E8E0D1] bg-[#FAF6ED] text-[#68768A] mb-3">
        <Icon size={19} strokeWidth={1.8} />
      </div>
      <p className="text-sm font-bold text-[#142B4A]">{title}</p>
      {desc ? <p className="mt-1 text-xs text-[#68768A] leading-relaxed max-w-sm">{desc}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

/* ── Error State ── */
export function ErrorState({
  message,
  error,
  onRetry,
}: {
  message?: string
  error?: Error | unknown
  onRetry?: () => void
}) {
  const displayMessage =
    message ??
    (error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : undefined) ??
    "An unexpected error occurred."
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center max-w-md mx-auto">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#C43D4B]/30 bg-[#C43D4B]/10 text-[#C43D4B] mb-3">
        <AlertTriangle size={19} strokeWidth={1.8} />
      </div>
      <p className="text-sm font-bold text-[#142B4A]">Something went wrong</p>
      <p className="mt-1 text-xs text-[#68768A] max-w-xs">{displayMessage}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#142B4A] hover:text-[#C49A3A] transition-colors"
        >
          <RefreshCw size={12} />
          Try again
        </button>
      ) : null}
    </div>
  )
}

/* ── No-connection State ── */
export function NoCloudState({ action }: { action?: React.ReactNode }) {
  return (
    <EmptyState
      icon={CloudOff}
      title="No cloud providers connected"
      description="Connect a cloud account to start orchestrating storage with the smart router."
      action={action}
    />
  )
}

/* ── No-results State ── */
export function NoResultsState({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={Search}
      title="No matching files"
      description={query ? `Nothing matched “${query}”. Try adjusting your search or filters.` : "Try adjusting your filters."}
    />
  )
}
