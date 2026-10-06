import { Link } from "react-router-dom"
import { ArrowRight, ArrowUpRight, CircleSlash, HardDrive } from "lucide-react"
import { useAuth } from "../../state/auth"
import { useAuditLogs, useConnections, useFiles, useQuota } from "../../hooks/use-data"
import { formatBytes, formatPercent, formatRelative, formatTime } from "../../lib/format"
import { providerName } from "../../lib/providers"
import { PageHeader } from "../../components/layout/shell"
import { Panel, PanelHeader } from "../../components/ui/panel"
import { EmptyState, ErrorState, ListSkeleton, StatSkeleton } from "../../components/ui/states"
import { ProgressBar } from "../../components/ui/progress"
import { Button } from "../../components/ui/button"

const AUDIT_LABELS: Record<string, { label: string; kind: string }> = {
  UPLOAD: { label: "Upload completed", kind: "file" },
  DOWNLOAD: { label: "Download issued", kind: "file" },
  DELETE: { label: "File deleted", kind: "file" },
  UPLOAD_REQUEST: { label: "Upload requested", kind: "file" },
  UPLOAD_CANCEL: { label: "Upload cancelled", kind: "file" },
  CONNECT: { label: "Cloud connected", kind: "cloud" },
  DISCONNECT: { label: "Cloud disconnected", kind: "cloud" },
  LOGIN: { label: "Signed in", kind: "auth" },
  LOGOUT: { label: "Signed out", kind: "auth" },
  REGISTER: { label: "Account created", kind: "auth" },
  PASSWORD_CHANGE: { label: "Password changed", kind: "auth" },
  PASSWORD_RESET: { label: "Password reset", kind: "auth" },
  PLAN_CHANGE: { label: "Plan changed", kind: "account" },
}

export function OverviewPage() {
  const { user } = useAuth()
  const quota = useQuota()
  const files = useFiles()
  const connections = useConnections()
  const audit = useAuditLogs()

  const attention: string[] = []
  if (quota.data && quota.data.total_limit_bytes > 0) {
    const usedPct = (quota.data.total_used_bytes / quota.data.total_limit_bytes) * 100
    if (usedPct >= 90) attention.push(`Storage is ${formatPercent(usedPct)} full — delete files or upgrade the plan.`)
  }
  if (connections.data && connections.data.length === 0) attention.push("No clouds connected — uploads need at least one.")
  if (quota.data && quota.data.total_reserved_bytes > 0) attention.push("A pending upload is reserving capacity.")

  const recentFiles = (files.data ?? []).slice(0, 5)
  const recentEvents = (audit.data ?? []).slice(0, 7)

  return (
    <div className="animate-fade-rise flex flex-col gap-8">
      <PageHeader
        kicker="Overview"
        title={`Storage plane${user ? ` — ${user.first_name} ${user.last_name}` : ""}`}
        description="Live state of your connected clouds, files and capacity."
        actions={
          <>
            <Link
              to="/app/clouds?connect=1"
              className="inline-flex h-7 items-center rounded-sm border border-line-strong bg-surface px-2.5 text-sm font-medium text-ink transition-all duration-fast ease-out hover:border-ink-3 hover:bg-raise active:translate-y-px"
            >
              Connect cloud
            </Link>
            <Button size="sm" variant="primary" onClick={() => window.dispatchEvent(new CustomEvent("nc:open-upload"))}>
              Upload file
            </Button>
          </>
        }
      />

      {/* Attention strip: only real conditions, never fabricated alerts. */}
      {attention.length > 0 ? (
        <div className="flex flex-col divide-y divide-line rounded-md border border-warn-line bg-warn-wash px-4">
          {attention.map((message) => (
            <p key={message} className="flex items-center gap-2 py-2 text-base text-warn">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warn" aria-hidden />
              {message}
            </p>
          ))}
        </div>
      ) : null}

      {/* Storage: the primary visualization. Large numeric hierarchy + capacity bar. */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          {quota.isLoading ? (
            <StatSkeleton />
          ) : quota.isError ? (
            <ErrorState error={quota.error} onRetry={() => void quota.refetch()} />
          ) : quota.data ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
                <div>
                  <p className="label-caps">Used</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tighter text-ink tnum">
                    {formatBytes(quota.data.total_used_bytes)}
                  </p>
                </div>
                <div>
                  <p className="label-caps">Capacity</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tighter text-ink-3 tnum">
                    {formatBytes(quota.data.total_limit_bytes)}
                  </p>
                </div>
                <div>
                  <p className="label-caps">Reserved</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tighter text-ink-3 tnum">
                    {formatBytes(quota.data.total_reserved_bytes)}
                  </p>
                </div>
                <div className="ml-auto">
                  <p className="label-caps">Utilization</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tighter text-accent-deep tnum">
                    {formatPercent(quota.data.usage_percentage)}
                  </p>
                </div>
              </div>
              <ProgressBar
                value={quota.data.usage_percentage}
                tone={quota.data.usage_percentage >= 90 ? "bad" : quota.data.usage_percentage >= 75 ? "warn" : "accent"}
                className="h-2"
              />
              <p className="font-mono text-2xs uppercase tracking-kicker text-ink-3">
                {quota.data.plan ? `plan ${quota.data.plan}` : "plan —"} ·{" "}
                {quota.data.plan_limit_bytes ? `plan cap ${formatBytes(quota.data.plan_limit_bytes)}` : "no plan cap"}
              </p>
            </div>
          ) : null}
        </div>

        {/* Providers: compact distribution, not cards. */}
        <div>
          <p className="label-caps mb-3">Connected clouds</p>
          {connections.isLoading ? (
            <ListSkeleton rows={2} />
          ) : connections.isError ? (
            <ErrorState error={connections.error} onRetry={() => void connections.refetch()} />
          ) : connections.data && connections.data.length > 0 ? (
            <ul className="flex flex-col">
              {connections.data.map((connection) => {
                const row = quota.data?.by_connection.find((entry) => entry.connection_id === connection.id)
                const used = row ? row.used_bytes + row.reserved_bytes : 0
                const limit = row?.limit_bytes ?? 0
                const pct = limit > 0 ? (used / limit) * 100 : 0
                return (
                  <li key={connection.id} className="flex items-center justify-between gap-3 border-b border-line py-2 last:border-b-0">
                    <div className="min-w-0">
                      <p className="truncate text-base font-medium text-ink">{connection.display_name}</p>
                      <p className="font-mono text-2xs uppercase tracking-kicker text-ink-3">
                        {providerName(connection.provider)}
                      </p>
                    </div>
                    <div className="w-24 shrink-0">
                      <ProgressBar value={pct} tone={pct >= 90 ? "warn" : "accent"} className="h-1" />
                      <p className="mt-1 text-right font-mono text-2xs text-ink-3 tnum">{formatBytes(used)}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="rounded-md border border-dashed border-line-strong px-4 py-6">
              <EmptyState
                title="No clouds connected"
                body="Connect a provider to route uploads to it."
                action={
                  <Link
                    to="/app/clouds?connect=1"
                    className="inline-flex h-7 items-center rounded-sm border border-accent bg-accent px-2.5 text-sm font-medium text-white transition-all duration-fast ease-out hover:border-accent-deep hover:bg-accent-deep active:translate-y-px"
                  >
                    Connect cloud
                  </Link>
                }
              />
            </div>
          )}
        </div>
      </section>

      {/* Two-column editorial section: recent files + activity. */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Recent files"
            actions={
              <Link
                to="/app/files"
                className="inline-flex items-center gap-1 text-sm text-accent transition-colors duration-fast hover:text-accent-deep"
              >
                All files <ArrowUpRight size={11} aria-hidden />
              </Link>
            }
          />
          {files.isLoading ? (
            <ListSkeleton rows={3} />
          ) : files.isError ? (
            <ErrorState error={files.error} onRetry={() => void files.refetch()} />
          ) : recentFiles.length > 0 ? (
            <ul className="divide-y divide-line">
              {recentFiles.map((file) => (
                <li key={file.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-base text-ink">{file.original_name}</p>
                    <p className="font-mono text-2xs uppercase tracking-kicker text-ink-3">
                      {providerName(file.provider)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-sm text-ink tnum">{formatBytes(file.size_bytes)}</p>
                    <p className="font-mono text-2xs text-ink-3">{formatRelative(file.uploaded_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No files yet" body="Uploads land on the cloud the router selects." />
          )}
        </Panel>

        <Panel>
          <PanelHeader
            title="Recent activity"
            actions={
              <Link
                to="/app/activity"
                className="inline-flex items-center gap-1 text-sm text-accent transition-colors duration-fast hover:text-accent-deep"
              >
                Full timeline <ArrowUpRight size={11} aria-hidden />
              </Link>
            }
          />
          {audit.isLoading ? (
            <ListSkeleton rows={4} />
          ) : audit.isError ? (
            <ErrorState error={audit.error} onRetry={() => void audit.refetch()} />
          ) : recentEvents.length > 0 ? (
            <ol className="flex flex-col px-4 py-3">
              {recentEvents.map((event, index) => {
                const meta = AUDIT_LABELS[event.action] ?? { label: event.action, kind: "system" }
                return (
                  <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
                    {index < recentEvents.length - 1 ? (
                      <span className="absolute left-[3px] top-3 h-full w-px bg-line" aria-hidden />
                    ) : null}
                    <span className="relative mt-1 h-[7px] w-[7px] shrink-0 rounded-full border border-line-strong bg-surface" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-base text-ink">
                        {meta.label}
                        {event.resource_id ? <span className="font-mono text-2xs text-ink-3"> · {event.resource_id.slice(0, 8)}</span> : null}
                      </p>
                      <p className="font-mono text-2xs text-ink-3">
                        {formatTime(event.created_at)} · {formatRelative(event.created_at)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ol>
          ) : (
            <EmptyState title="No activity yet" body="Operations will appear here as they happen." />
          )}
        </Panel>
      </section>

      {/* System line: plan state + quick links, kept minimal. */}
      <section className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-line pt-5">
        <span className="inline-flex items-center gap-2 text-base text-ink-2">
          <HardDrive size={13} className="text-ink-3" aria-hidden />
          {files.data ? `${files.data.length} file${files.data.length === 1 ? "" : "s"} under management` : "— files"}
        </span>
        <span className="inline-flex items-center gap-2 text-base text-ink-2">
          <CircleSlash size={13} className="text-ink-3" aria-hidden />
          {connections.data ? `${connections.data.length} cloud${connections.data.length === 1 ? "" : "s"} connected` : "— clouds"}
        </span>
        <Link
          to="/app/quota"
          className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors duration-fast hover:text-accent-deep"
        >
          View quota <ArrowRight size={12} aria-hidden />
        </Link>
      </section>
    </div>
  )
}
