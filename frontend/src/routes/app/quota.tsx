import { Link } from "react-router-dom"
import { useQuota } from "../../hooks/use-data"
import { formatBytes, formatPercent } from "../../lib/format"
import { providerName } from "../../lib/providers"
import { PageHeader } from "../../components/layout/shell"
import { EmptyState, ErrorState, ListSkeleton, StatSkeleton } from "../../components/ui/states"
import { CapacityBar } from "../../components/ui/progress"
import { ProviderMark } from "../../components/ui/provider-mark"
import { buttonClass } from "../../components/ui/button"
import { Stat } from "../../components/ui/stat"
import { Th } from "../../components/ui/table"

export function QuotaPage() {
  const quota = useQuota()
  const data = quota.data

  return (
    <div className="animate-fade-rise flex flex-col gap-8">
      <PageHeader
        title="Quota"
        description="Free-tier estimates from your connected clouds, capped by your plan. These are not live billing balances."
      />

      {quota.isLoading ? (
        <>
          <StatSkeleton />
          <ListSkeleton rows={3} />
        </>
      ) : quota.isError ? (
        <ErrorState error={quota.error} onRetry={() => void quota.refetch()} />
      ) : data ? (
        <>
          <section aria-label="Totals" className="flex flex-col gap-4">
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
              <Stat term="Used" value={formatBytes(data.total_used_bytes)} />
              <Stat term="Reserved by pending uploads" value={formatBytes(data.total_reserved_bytes)} tone="text-accent-deep" />
              <Stat term="Free" value={formatBytes(data.total_free_bytes)} tone="text-ok" />
              <Stat term="Usable limit" value={formatBytes(data.total_limit_bytes)} />
            </dl>
            <CapacityBar
              used={data.total_used_bytes}
              reserved={data.total_reserved_bytes}
              limit={data.total_limit_bytes}
              label={`${formatPercent(data.usage_percentage)} of usable capacity`}
              className="h-2.5"
            />
            <p className="text-sm text-ink-2 tnum">
              {data.plan_limit_bytes ? (
                <>
                  The <span className="capitalize">{data.plan ?? "current"}</span> plan caps storage at{" "}
                  <span className="font-mono text-ink">{formatBytes(data.plan_limit_bytes)}</span>, even if connected clouds offer more.{" "}
                </>
              ) : (
                <>This plan has no byte cap. </>
              )}
              <Link to="/app/settings" className="font-medium text-accent hover:text-accent-deep">
                Change plan
              </Link>
            </p>
          </section>

          <section aria-label="By cloud">
            <div className="flex items-baseline justify-between border-b border-line pb-2">
              <h2 className="text-md font-semibold text-ink">By cloud</h2>
              <p className="text-sm text-ink-3 tnum">{data.by_connection.length} connected</p>
            </div>
            {data.by_connection.length > 0 ? (
              <table className="w-full border-collapse">
                <caption className="sr-only">Used, reserved and free capacity per connected cloud</caption>
                <thead className="sr-only sm:not-sr-only">
                  <tr className="border-b border-line">
                    <Th>Cloud</Th>
                    <Th hideBelow="md" className="w-1/3">Usage</Th>
                    <Th align="right">Used</Th>
                    <Th align="right" hideBelow="sm">Reserved</Th>
                    <Th align="right">Free</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_connection.map((row) => (
                    <tr key={row.connection_id} className="row">
                      <td className="px-1 py-3">
                        <span className="flex items-center gap-2.5">
                          <ProviderMark provider={row.provider} size={12} />
                          <span className="min-w-0">
                            <span className="block truncate text-base font-medium text-ink">{row.display_name}</span>
                            <span className="text-sm text-ink-3">{providerName(row.provider)}</span>
                          </span>
                        </span>
                      </td>
                      <td className="hidden px-3 py-3 md:table-cell">
                        <CapacityBar used={row.used_bytes} reserved={row.reserved_bytes} limit={row.limit_bytes} label={`${row.display_name} usage`} />
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm text-ink tnum">{formatBytes(row.used_bytes)}</td>
                      <td className="hidden px-3 py-3 text-right font-mono text-sm tnum text-ink-2 sm:table-cell">
                        {row.reserved_bytes > 0 ? `+${formatBytes(row.reserved_bytes)}` : "0 B"}
                      </td>
                      <td className="px-1 py-3 text-right font-mono text-sm text-ink-2 tnum">
                        {formatBytes(row.free_bytes)}
                        <span className="text-ink-3"> of {formatBytes(row.limit_bytes)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState
                title="No connected clouds"
                body="Connect a provider to see its capacity here."
                action={
                  <Link to="/app/clouds?connect=1" className={buttonClass("primary")}>
                    Connect cloud
                  </Link>
                }
              />
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
