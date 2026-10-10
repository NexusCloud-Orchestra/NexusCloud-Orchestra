import { useMemo, useState } from "react"
import { useAuditLogs } from "../../hooks/use-data"
import { formatDateDay, formatRelative, formatTime } from "../../lib/format"
import { PageHeader } from "../../components/layout/shell"
import { EmptyState, ErrorState, Skeleton } from "../../components/ui/states"
import { FilterBar } from "../../components/ui/tabs"
import type { AuditLog } from "../../types/api"
import { auditGroup, auditLabel } from "../../lib/audit"
import type { AuditGroup } from "../../lib/audit"

type Group = AuditGroup

const FILTERS: Array<{ id: "all" | Group; label: string }> = [
  { id: "all", label: "All" },
  { id: "files", label: "Files" },
  { id: "clouds", label: "Clouds" },
  { id: "account", label: "Account" },
]

export function ActivityPage() {
  const audit = useAuditLogs()
  const [filter, setFilter] = useState<"all" | Group>("all")

  const groups = useMemo(() => {
    const byDay = new Map<string, AuditLog[]>()
    for (const event of audit.data ?? []) {
      const group = auditGroup(event.action)
      if (filter !== "all" && group !== filter) continue
      const day = formatDateDay(event.created_at)
      byDay.set(day, [...(byDay.get(day) ?? []), event])
    }
    return [...byDay.entries()]
  }, [audit.data, filter])

  const total = audit.data?.length ?? 0
  const counts = useMemo(() => {
    const result: Record<Group, number> = { files: 0, clouds: 0, account: 0 }
    for (const event of audit.data ?? []) result[auditGroup(event.action)] += 1
    return result
  }, [audit.data])

  return (
    <div className="animate-fade-rise flex flex-col gap-6">
      <PageHeader title="Activity" description="Audit trail from the backend. Newest first, capped at 100 entries." />

      <FilterBar
        label="Filter events"
        value={filter}
        onChange={setFilter}
        items={FILTERS.map((item) => ({
          ...item,
          count: audit.data ? (item.id === "all" ? total : counts[item.id]) : undefined,
        }))}
      />

      {audit.isLoading ? (
        <div role="status" aria-label="Loading activity" className="flex flex-col gap-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      ) : audit.isError ? (
        <ErrorState error={audit.error} onRetry={() => void audit.refetch()} />
      ) : groups.length === 0 ? (
        <EmptyState
          title={filter === "all" ? "No activity yet" : "No events in this group"}
          body={filter === "all" ? "Uploads, downloads, cloud changes and sign-ins appear here." : "Try another group or show all events."}
        />
      ) : (
        groups.map(([day, events]) => (
          <section key={day} aria-label={day}>
            <h2 className="sticky top-14 z-10 flex items-baseline gap-3 border-b border-line bg-night py-2 text-sm font-medium text-ink-2">
              {day}
              <span className="font-normal text-ink-3 tnum">{events.length}</span>
            </h2>
            <ol>
              {events.map((event) => {
                const label = auditLabel(event.action)
                return (
                  <li key={event.id} className="row grid grid-cols-[56px_minmax(0,1fr)] items-baseline gap-x-4 px-1 py-2.5 sm:grid-cols-[64px_minmax(0,1fr)_auto]">
                    <time dateTime={event.created_at} className="font-mono text-xs text-ink-3 tnum" title={formatRelative(event.created_at)}>
                      {formatTime(event.created_at)}
                    </time>
                    <p className="min-w-0 truncate text-base text-ink">{label}</p>
                    <p className="col-start-2 truncate font-mono text-xs text-ink-3 sm:col-start-auto sm:text-right">
                      {[event.action, event.resource_id?.slice(0, 8), event.ip_address].filter(Boolean).join("  ")}
                    </p>
                  </li>
                )
              })}
            </ol>
          </section>
        ))
      )}
    </div>
  )
}
