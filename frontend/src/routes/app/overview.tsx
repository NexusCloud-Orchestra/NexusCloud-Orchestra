import { Link } from "react-router-dom"
import { useAuth } from "../../state/auth"
import { useAuditLogs, useConnections, useFiles, useQuota } from "../../hooks/use-data"
import { formatBytes, formatPercent, formatRelative, formatTime } from "../../lib/format"
import { providerName } from "../../lib/providers"
import { PageHeader } from "../../components/layout/shell"
import { Section } from "../../components/ui/panel"
import { EmptyState, ErrorState, ListSkeleton, StatSkeleton } from "../../components/ui/states"
import { CapacityBar } from "../../components/ui/progress"
import { Stat } from "../../components/ui/stat"
import { auditLabel } from "../../lib/audit"
import { Button, buttonClass } from "../../components/ui/button"
import { ProviderMark } from "../../components/ui/provider-mark"
import { Meta } from "../../components/ui/meta"

export function OverviewPage() {
  const { user } = useAuth()
  const quota = useQuota()
  const files = useFiles()
  const connections = useConnections()
  const audit = useAuditLogs()

  const attention: string[] = []
  if (quota.data && quota.data.total_limit_bytes > 0 && quota.data.usage_percentage >= 90) {
    attention.push(`Storage is ${formatPercent(quota.data.usage_percentage)} full. Delete files or change plan.`)
  }
  if (quota.data && quota.data.total_reserved_bytes > 0) attention.push("A pending upload is reserving capacity.")

  const cloudCount = connections.data?.length ?? 0
  const fileCount = files.data?.length ?? 0
  const recentFiles = (files.data ?? []).slice(0, 6)
  const recentEvents = (audit.data ?? []).slice(0, 8)
  const setupDone = cloudCount > 0

  return (
    <div className="animate-fade-rise flex flex-col gap-8">
      <PageHeader
        title={user ? `Hello, ${user.first_name}` : "Overview"}
        actions={
          <>
            <Link to="/app/clouds?connect=1" className={buttonClass("secondary")}>
              Connect cloud
            </Link>
            <Button size="sm" variant="primary" onClick={() => window.dispatchEvent(new CustomEvent("nc:open-upload"))}>
              Upload file
            </Button>
          </>
        }
      />

      {attention.length > 0 ? (
        <ul className="flex flex-col gap-1 border-l-2 border-warn pl-3" aria-label="Needs attention">
          {attention.map((message) => (
            <li key={message} className="text-base text-warn">
              {message}
            </li>
          ))}
        </ul>
      ) : null}

      {/* Capacity: where free space is, as one strip and one sentence. */}
      <section aria-labelledby="capacity-title" className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="capacity-title" className="text-md font-semibold text-ink">
            Capacity
          </h2>
          <Link to="/app/quota" className="text-sm font-medium text-accent hover:text-accent-deep">
            Quota details
          </Link>
        </div>
        {quota.isLoading || connections.isLoading ? (
          <StatSkeleton />
        ) : quota.isError ? (
          <ErrorState error={quota.error} onRetry={() => void quota.refetch()} />
        ) : quota.data && quota.data.by_connection.length > 0 ? (
          <>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
              <Stat term="Used" value={formatBytes(quota.data.total_used_bytes)} />
              <Stat term="Free" value={formatBytes(quota.data.total_free_bytes)} tone="text-ok" />
              <Stat
                term="Reserved by uploads"
                value={formatBytes(quota.data.total_reserved_bytes)}
                tone={quota.data.total_reserved_bytes > 0 ? "text-accent-deep" : "text-ink"}
              />
              <Stat term="Clouds" value={cloudCount} hint={`${formatBytes(quota.data.total_limit_bytes)} usable`} />
            </dl>
            <CapacityBar
              used={quota.data.total_used_bytes}
              reserved={quota.data.total_reserved_bytes}
              limit={quota.data.total_limit_bytes}
              label={`${formatPercent(quota.data.usage_percentage)} of capacity used`}
              className="h-2"
            />
          </>
        ) : (
          <SetupList done={setupDone} />
        )}
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-12">
        <Section
          title="Recent files"
          meta={files.data ? `${fileCount} total` : undefined}
          actions={
            <Link to="/app/files" className="font-medium text-accent hover:text-accent-deep">
              All files
            </Link>
          }
        >
          {files.isLoading ? (
            <ListSkeleton rows={3} />
          ) : files.isError ? (
            <ErrorState error={files.error} onRetry={() => void files.refetch()} />
          ) : recentFiles.length > 0 ? (
            <ul>
              {recentFiles.map((file) => (
                <li key={file.id} className="row flex items-center gap-3 px-1 py-2.5">
                  <ProviderMark provider={file.provider} size={10} />
                  <div className="min-w-0 flex-1">
                    <Link to={`/app/files?file=${file.id}`} className="block truncate text-base text-ink hover:text-accent">
                      {file.original_name}
                    </Link>
                    <p className="text-sm text-ink-3">{providerName(file.provider)}</p>
                  </div>
                  <Meta
                    className="shrink-0 text-right text-sm text-ink-3 tnum"
                    items={[<span className="font-mono text-ink">{formatBytes(file.size_bytes)}</span>, formatRelative(file.uploaded_at)]}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No files yet" body="Uploads land on the cloud the router selects." />
          )}
        </Section>

        <Section
          title="Activity"
          actions={
            <Link to="/app/activity" className="font-medium text-accent hover:text-accent-deep">
              Full log
            </Link>
          }
        >
          {audit.isLoading ? (
            <ListSkeleton rows={4} />
          ) : audit.isError ? (
            <ErrorState error={audit.error} onRetry={() => void audit.refetch()} />
          ) : recentEvents.length > 0 ? (
            <ul>
              {recentEvents.map((event) => (
                <li key={event.id} className="row flex items-baseline justify-between gap-3 px-1 py-2">
                  <span className="min-w-0 truncate text-base text-ink">{auditLabel(event.action)}</span>
                  <span className="shrink-0 font-mono text-xs text-ink-3 tnum" title={formatRelative(event.created_at)}>
                    {formatTime(event.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No activity yet" body="Operations appear here as they happen." />
          )}
        </Section>
      </div>
    </div>
  )
}

/** Empty account: the real path to a first routed file, as a short checklist. */
function SetupList({ done }: { done: boolean }) {
  return (
    <ol className="flex max-w-xl flex-col gap-3 text-base">
      <li className="flex items-start gap-3">
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${done ? "bg-ok" : "bg-accent"}`} aria-hidden />
        <div>
          <p className="font-medium text-ink">Connect a cloud</p>
          <p className="text-ink-2">Give NexusCloud a bucket and scoped keys. Capacity appears here once one is connected.</p>
          {!done ? (
            <Link to="/app/clouds?connect=1" className={`${buttonClass("primary")} mt-2`}>
              Connect cloud
            </Link>
          ) : null}
        </div>
      </li>
      <li className="flex items-start gap-3">
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-line-strong" aria-hidden />
        <div>
          <p className="font-medium text-ink">Preview a placement</p>
          <p className="text-ink-2">
            The <Link to="/app/router" className="text-accent hover:text-accent-deep">Router</Link> shows which cloud a file of any size would go to, and why.
          </p>
        </div>
      </li>
      <li className="flex items-start gap-3">
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-line-strong" aria-hidden />
        <div>
          <p className="font-medium text-ink">Upload a file</p>
          <p className="text-ink-2">Files go straight from your browser to the chosen cloud. Large files stripe across two providers.</p>
        </div>
      </li>
    </ol>
  )
}
