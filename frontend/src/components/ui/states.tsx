import type { ReactNode } from "react"
import { RotateCw } from "lucide-react"
import { Button } from "./button"

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse-soft rounded-sm bg-line ${className}`} />
}

/** List-shaped skeleton that matches the rows it will replace. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className="divide-y divide-line">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-4 w-4 rounded-xs" />
          <Skeleton className="h-3.5 w-1/3 max-w-52" />
          <div className="ml-auto flex items-center gap-6">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function StatSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-3">
      <Skeleton className="h-3 w-3/4 max-w-md" />
      <Skeleton className="h-8 w-full" />
    </div>
  )
}

/** Left-aligned, compact. Says what is missing and what to do, nothing more. */
export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-1 py-8">
      <p className="text-md font-medium text-ink">{title}</p>
      <p className="max-w-prose text-base text-ink-2">{body}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}

export function ErrorState({
  title = "Could not load this view",
  error,
  onRetry,
}: {
  title?: string
  error: unknown
  onRetry?: () => void
}) {
  const message = error instanceof Error ? error.message : "Something went wrong."
  return (
    <div role="alert" className="flex flex-col items-start gap-1 py-8">
      <p className="text-md font-medium text-bad">{title}</p>
      <p className="max-w-prose text-base text-ink-2">{message}</p>
      {onRetry ? (
        <Button size="sm" variant="secondary" className="mt-3" onClick={onRetry}>
          <RotateCw size={12} aria-hidden />
          Try again
        </Button>
      ) : null}
    </div>
  )
}
