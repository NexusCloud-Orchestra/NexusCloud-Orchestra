import { Link } from "react-router-dom"
import { useQuota } from "../../hooks/use-data"
import { formatBytes, formatPercent } from "../../lib/format"
import { providerName } from "../../lib/providers"
import { PageHeader } from "../../components/layout/shell"
import { Panel, PanelHeader } from "../../components/ui/panel"
import { EmptyState, ErrorState, ListSkeleton } from "../../components/ui/states"
import { ProgressBar } from "../../components/ui/progress"
import { ProviderMark } from "../../components/ui/provider-mark"

function toneFor(percentage: number): "accent" | "warn" | "bad" {
  if (percentage >= 90) return "bad"
  if (percentage >= 75) return "warn"
  return "accent"
}

export function QuotaPage() {
  const quota = useQuota()

  return (
    <div className="animate-fade-rise flex flex-col gap-6">
      <PageHeader
        kicker="Capacity"
        title="Quota"
        description="Free-tier estimates from your connected clouds, capped by your plan."
      />

      {quota.isLoading ? (
        <Panel>
          <div className="px-4 py-6">
            <ListSkeleton rows={3} />
          </div>
        </Panel>
      ) : quota.isError ? (
        <Panel>
          <ErrorState error={quota.error} onRetry={() => void quota.refetch()} />
        </Panel>
      ) : quota.data ? (
        <>
          {/* Primary numeric hierarchy */}
          <section className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
                <div>
                  <p className="label-caps">Used</p>
                  <p className="mt-1 font-display text-4xl font-bold tracking-tight text-ink tnum">
                    {formatBytes(quota.data.total_used_bytes)}
                  </p>
                </div>
                <div>
                  <p className="label-caps">Reserved (pending uploads)</p>
                  <p className="mt-1 font-display text-4xl font-bold tracking-tight text-ink-3 tnum">
                    {formatBytes(quota.data.total_reserved_bytes)}
                  </p>
                </div>
                <div>
                  <p className="label-caps">Free</p>
                  <p className="mt-1 font-display text-4xl font-bold tracking-tight text-ok tnum">
                    {formatBytes(quota.data.total_free_bytes)}
                  </p>
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="label-caps">Total capacity · {formatBytes(quota.data.total_limit_bytes)}</span>
                  <span className="font-mono text-sm text-ink-2 tnum">{formatPercent(quota.data.usage_percentage)}</span>
                </div>
                <ProgressBar value={quota.data.usage_percentage} tone={toneFor(quota.data.usage_percentage)} className="h-2.5" />
              </div>
              <p className="font-mono text-2xs uppercase tracking-kicker text-ink-3">
                {quota.data.plan ? `plan ${quota.data.plan}` : "plan —"}
                {quota.data.plan_limit_bytes ? ` · plan cap ${formatBytes(quota.data.plan_limit_bytes)}` : " · no plan cap"}
                {" · estimates are provider free tiers, not live billing"}
              </p>
            </div>

            <aside className="flex flex-col justify-center gap-3 border-l-0 border-line pl-0 lg:border-l lg:pl-8">
              <p className="label-caps">Plan</p>
              <p className="font-display text-2xl font-bold tracking-tight text-ink">{quota.data.plan ?? "—"}</p>
              {quota.data.plan_limit_bytes ? (
                <p className="text-base text-ink-2">
                  This plan caps usable capacity at {formatBytes(quota.data.plan_limit_bytes)} even if connected
                  clouds offer more.
                </p>
              ) : (
                <p className="text-base text-ink-2">This plan has no byte cap.</p>
              )}
              <Link
                to="/app/settings"
                className="text-sm font-medium text-accent transition-colors duration-fast hover:text-accent-deep"
              >
                Manage plan in Settings →
              </Link>
            </aside>
          </section>

          {/* Per-connection breakdown */}
          <Panel>
            <PanelHeader title="By connection" meta={`${quota.data.by_connection.length} clouds`} />
            {quota.data.by_connection.length > 0 ? (
              <ul className="flex flex-col">
                {quota.data.by_connection.map((row) => {
                  const total = row.limit_bytes
                  const used = row.used_bytes
                  const reserved = row.reserved_bytes
                  const usedPct = total > 0 ? (used / total) * 100 : 0
                  const reservedPct = total > 0 ? (reserved / total) * 100 : 0
                  return (
                    <li key={row.connection_id} className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line px-4 py-3.5 last:border-b-0">
                      <div className="flex min-w-0 flex-1 items-center gap-2.5">
                        <ProviderMark provider={row.provider} size={12} />
                        <div className="min-w-0">
                          <p className="truncate text-base font-medium text-ink">{row.display_name}</p>
                          <p className="font-mono text-2xs uppercase tracking-kicker text-ink-3">
                            {providerName(row.provider)}
                          </p>
                        </div>
                      </div>
                      <div className="w-full max-w-md flex-1">
                        <div className="flex h-2 w-full overflow-hidden rounded-full bg-line" role="img" aria-label={`${row.display_name} usage`}>
                          <div className="h-full bg-accent" style={{ width: `${usedPct}%` }} />
                          <div className="h-full bg-accent/35" style={{ width: `${reservedPct}%` }} />
                        </div>
                      </div>
                      <div className="flex shrink-0 items-baseline gap-4 font-mono text-sm tnum">
                        <span className="text-ink">{formatBytes(used)}</span>
                        {reserved > 0 ? <span className="text-accent-deep">+{formatBytes(reserved)}</span> : null}
                        <span className="text-ink-3">/ {formatBytes(total)}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <EmptyState
                title="No connected clouds"
                body="Connect a provider to see its capacity here."
              />
            )}
          </Panel>
        </>
      ) : null}
    </div>
  )
}
