import { useMemo } from "react"
import { useAuditLogs } from "../../hooks/use-data"
import { formatTime } from "../../lib/format"
import { PageHeader } from "../../components/layout/shell"
import { Panel, PanelHeader } from "../../components/ui/panel"
import { EmptyState, ErrorState } from "../../components/ui/states"

const EVENT_LABELS: Record<string, { label: string; group: "files" | "clouds" | "account" }> = {
  UPLOAD: { label: "Upload completed", group: "files" },
  UPLOAD_REQUEST: { label: "Upload slot requested", group: "files" },
  UPLOAD_CANCEL: { label: "Upload cancelled", group: "files" },
  DOWNLOAD: { label: "Download issued", group: "files" },
  DELETE: { label: "File deleted", group: "files" },
  CONNECT: { label: "Cloud connected", group: "clouds" },
  DISCONNECT: { label: "Cloud disconnected", group: "clouds" },
  LOGIN: { label: "Signed in", group: "account" },
  LOGOUT: { label: "Signed out", group: "account" },
  REGISTER: { label: "Account created", group: "account" },
  PASSWORD_CHANGE: { label: "Password changed", group: "account" },
  PASSWORD_RESET: { label: "Password reset", group: "account" },
  PLAN_CHANGE: { label: "Plan changed", group: "account" },
}

export function ActivityPage() {
  const audit = useAuditLogs()

  const groups = useMemo<Array<[string, NonNullable<typeof audit.data>]>>(() => {
    const byDay = new Map<string, NonNullable<typeof audit.data>>()
    for (const event of audit.data ?? []) {
      const day = formatDateDay(event.created_at)
      const bucket = byDay.get(day) ?? []
      bucket.push(event)
      byDay.set(day, bucket)
    }
    return [...byDay.entries()]
  }, [audit.data]) // eslint-disable-line react-hooks/exhaustive-deps -- audit.data is the only input used

  return (
    <div className="animate-fade-rise flex flex-col gap-6">
      <PageHeader
        kicker="Ledger"
        title="Activity"
        description="Backend audit trail: file operations, cloud lifecycle and account events. Newest first, capped at 100 entries."
      />

      {audit.isLoading ? (
        <Panel>
          <div className="px-4 py-6">
            <div className="flex flex-col gap-3" role="status" aria-label="Loading activity">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="h-10 animate-pulse-soft rounded-sm bg-line" />
              ))}
            </div>
        </div>
        </Panel>
      ) : audit.isError ? (
        <Panel>
          <ErrorState error={audit.error} onRetry={() => void audit.refetch()} />
        </Panel>
      ) : groups.length === 0 ? (
        <Panel>
          <EmptyState
            title="No activity yet"
            body="Operations will appear here as they occur — uploads, downloads, cloud connections and account changes."
          />
        </Panel>
      ) : (
        groups.map(([day, events]) => (
          <section key={day} className="grid grid-cols-[80px_1fr] gap-0 sm:grid-cols-[120px_1fr]">
            <div className="pt-1">
              <p className="label-caps sticky top-16">{day}</p>
            </div>
            <Panel>
              <PanelHeader title={`${events.length} events`} />
              <ol className="px-4 py-3">
                {events.map((event, index) => {
                  const meta = EVENT_LABELS[event.action] ?? { label: event.action, group: "account" as const }
                  return (
                    <li key={event.id} className="relative flex gap-3.5 pb-4 last:pb-0">
                      {index < events.length - 1 ? (
                        <span className="absolute left-[3.5px] top-3.5 h-full w-px bg-line" aria-hidden />
                      ) : null}
                      <span className="relative mt-1 h-2 w-2 shrink-0 rounded-full border border-line-strong bg-surface" aria-hidden />
                      <div className="min-w-0 flex-1 border-b border-line/60 pb-3.5 last:border-b-0">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                          <p className="text-base font-medium text-ink">{meta.label}</p>
                          <p className="font-mono text-2xs text-ink-3 tnum">{formatTime(event.created_at)}</p>
                        </div>
                        <p className="mt-0.5 font-mono text-2xs text-ink-3">
                          {event.action}
                          {event.resource_id ? ` · ${event.resource_id.slice(0, 8)}` : ""}
                          {event.ip_address ? ` · ${event.ip_address}` : ""}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </Panel>
          </section>
        ))
      )}
    </div>
  )
}

function formatDateDay(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date)
}
