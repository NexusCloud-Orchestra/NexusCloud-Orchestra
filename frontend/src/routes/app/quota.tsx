import { Link, useNavigate } from "react-router-dom"
import {
  HardDrive,
  Plus,
  Server,
  ShieldCheck,
  Zap,
} from "lucide-react"

import { useQuota } from "../../hooks/use-data"
import { formatBytes, formatPercent } from "../../lib/format"
import { providerName, PROVIDER_META } from "../../lib/providers"
import { PageHeader } from "../../components/layout/shell"
import { Panel, PanelHeader } from "../../components/ui/panel"
import { ErrorState, ListSkeleton } from "../../components/ui/states"
import { Button } from "../../components/ui/button"
import { ProviderMark } from "../../components/ui/provider-mark"

export function QuotaPage() {
  const quota = useQuota()
  const navigate = useNavigate()

  const data = quota.data
  const used = data?.total_used_bytes ?? 0
  const reserved = data?.total_reserved_bytes ?? 0
  const free = data?.total_free_bytes ?? 0
  const limit = data?.total_limit_bytes ?? 0
  const usagePct = data?.usage_percentage ?? 0

  const hasConnections = (data?.by_connection.length ?? 0) > 0

  // Derived percent widths for segmented bar
  const usedPct = limit > 0 ? (used / limit) * 100 : 0
  const reservedPct = limit > 0 ? (reserved / limit) * 100 : 0

  return (
    <div className="animate-fade-rise flex flex-col gap-6">
      <PageHeader
        kicker="Capacity Management"
        title="Storage Capacity"
        description="Aggregated multi-cloud storage pool across your connected clouds, derived from provider allowances and governed by your plan."
        actions={
          <Button
            variant="gold"
            size="md"
            onClick={() => navigate("/app/clouds?connect=1")}
            className="shadow-sm font-bold"
          >
            <Plus size={14} className="mr-1.5" aria-hidden />
            Connect Cloud Provider
          </Button>
        }
      />

      {quota.isLoading ? (
        <Panel>
          <div className="p-6">
            <ListSkeleton rows={3} />
          </div>
        </Panel>
      ) : quota.isError ? (
        <Panel>
          <ErrorState error={quota.error} onRetry={() => void quota.refetch()} />
        </Panel>
      ) : data ? (
        <>
          {/* Storage Pool KPI Metrics */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="nc-card p-5 flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-2xs uppercase tracking-wider text-muted-slate font-semibold">
                  Measured Stored
                </span>
                <span className="h-2.5 w-2.5 rounded-full bg-regal-navy" />
              </div>
              <div>
                <p className="font-palatino text-3xl font-bold tracking-tight text-regal-navy tnum">
                  {formatBytes(used)}
                </p>
                <p className="mt-1 text-2xs text-muted-slate font-mono">Committed files in buckets</p>
              </div>
            </div>

            <div className="nc-card p-5 flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-2xs uppercase tracking-wider text-muted-slate font-semibold">
                  In-Flight Reserved
                </span>
                <span className="h-2.5 w-2.5 rounded-full bg-royal-gold" />
              </div>
              <div>
                <p className="font-palatino text-3xl font-bold tracking-tight text-royal-gold tnum">
                  {formatBytes(reserved)}
                </p>
                <p className="mt-1 text-2xs text-muted-slate font-mono">Active presigned upload tickets</p>
              </div>
            </div>

            <div className="nc-card p-5 flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-2xs uppercase tracking-wider text-muted-slate font-semibold">
                  Available Headroom
                </span>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </div>
              <div>
                <p className="font-palatino text-3xl font-bold tracking-tight text-emerald-700 tnum">
                  {formatBytes(free)}
                </p>
                <p className="mt-1 text-2xs text-muted-slate font-mono">Unallocated across providers</p>
              </div>
            </div>

            <div className="nc-card p-4.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-mono text-2xs uppercase tracking-wider text-muted-slate font-semibold">
                  Total Pool Limit
                </span>
                <span className="font-mono text-2xs text-muted-slate font-semibold">{formatPercent(usagePct)} used</span>
              </div>
              <div>
                <p className="font-palatino text-3xl font-bold tracking-tight text-regal-navy tnum">
                  {formatBytes(limit)}
                </p>
                <p className="mt-1 text-2xs text-muted-slate font-mono">
                  {data.plan ? `Plan: ${data.plan.toUpperCase()}` : "Active Pool"}
                  {data.plan_limit_bytes ? ` (Capped at ${formatBytes(data.plan_limit_bytes)})` : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Master Utilization Segmented Visual Bar */}
          <Panel>
            <PanelHeader
              title="Storage Pool Utilization"
              meta={limit > 0 ? `${formatBytes(used + reserved)} allocated of ${formatBytes(limit)} pool` : "No limits configured"}
              actions={
                <span className="font-mono text-xs font-bold text-regal-navy">
                  {formatPercent(usagePct)} Utilized
                </span>
              }
            />
            <div className="p-5 flex flex-col gap-4">
              {/* Segmented Bar */}
              <div className="h-4 w-full overflow-hidden rounded-full bg-line flex" role="progressbar" aria-valuenow={usagePct} aria-valuemin={0} aria-valuemax={100}>
                {/* Measured Used */}
                <div
                  className="h-full bg-regal-navy transition-all duration-slow"
                  style={{ width: `${usedPct}%` }}
                  title={`Measured: ${formatBytes(used)}`}
                />
                {/* Reserved In-Flight */}
                <div
                  className="h-full bg-royal-gold transition-all duration-slow"
                  style={{ width: `${reservedPct}%` }}
                  title={`Reserved: ${formatBytes(reserved)}`}
                />
              </div>

              {/* Legend with exact breakdowns */}
              <div className="flex flex-wrap items-center justify-between gap-y-2 pt-1 border-t border-border text-xs">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-regal-navy shrink-0" />
                    <span className="text-slate-text">
                      Committed: <strong className="font-mono text-ink">{formatBytes(used)}</strong> ({usedPct.toFixed(1)}%)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-royal-gold shrink-0" />
                    <span className="text-slate-text">
                      Reserved: <strong className="font-mono text-ink">{formatBytes(reserved)}</strong> ({reservedPct.toFixed(1)}%)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-line border border-border shrink-0" />
                    <span className="text-muted-slate">
                      Free Headroom: <strong className="font-mono text-slate-text">{formatBytes(free)}</strong>
                    </span>
                  </div>
                </div>

                <Link
                  to="/app/settings"
                  className="font-mono text-2xs text-royal-gold font-semibold hover:underline"
                >
                  Manage Tier Limits in Settings →
                </Link>
              </div>

              {/* Multi-Cloud Provider Composition Distribution */}
              {hasConnections && limit > 0 ? (
                <div className="flex flex-col gap-2 pt-3 border-t border-border/80">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xs uppercase tracking-wider text-muted-slate font-bold">
                      Multi-Cloud Capacity Distribution by Provider
                    </span>
                    <span className="font-mono text-2xs text-slate-text">
                      {data.by_connection.length} Endpoint{data.by_connection.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-line flex">
                    {data.by_connection.map((row) => {
                      const sharePct = limit > 0 ? (row.limit_bytes / limit) * 100 : 0
                      const marker = PROVIDER_META[row.provider]?.marker ?? "#142B4A"
                      return (
                        <div
                          key={row.connection_id}
                          className="h-full transition-all"
                          style={{ width: `${Math.max(2, sharePct)}%`, backgroundColor: marker }}
                          title={`${row.display_name}: ${formatBytes(row.limit_bytes)} (${sharePct.toFixed(1)}%)`}
                        />
                      )
                    })}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {data.by_connection.map((row) => {
                      const marker = PROVIDER_META[row.provider]?.marker ?? "#142B4A"
                      return (
                        <div key={row.connection_id} className="flex items-center gap-1.5 font-mono text-[10px]">
                          <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: marker }} />
                          <span className="font-semibold text-regal-navy">{row.display_name}</span>
                          <span className="text-muted-slate">({formatBytes(row.limit_bytes)})</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </Panel>

          {/* Per-Provider Storage Allocation Breakdown */}
          <Panel>
            <PanelHeader
              title="Per-Cloud Capacity Breakdown"
              meta={`${data.by_connection.length} connected storage endpoint${data.by_connection.length === 1 ? "" : "s"}`}
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/app/clouds")}
                >
                  Manage connections
                </Button>
              }
            />

            {hasConnections ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-ivory/60 font-mono text-2xs uppercase tracking-wider text-muted-slate">
                    <tr>
                      <th className="py-2.5 pl-5 pr-3">Cloud Storage Connection</th>
                      <th className="py-2.5 px-3">Committed Data</th>
                      <th className="py-2.5 px-3">Reserved</th>
                      <th className="py-2.5 px-3">Free Capacity</th>
                      <th className="py-2.5 px-3">Provider Cap</th>
                      <th className="py-2.5 px-3 text-right pr-5">Utilization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-sans">
                    {data.by_connection.map((row) => {
                      const rowTotal = row.limit_bytes
                      const rowUsed = row.used_bytes
                      const rowReserved = row.reserved_bytes
                      const rowAllocated = rowUsed + rowReserved
                      const rowPct = rowTotal > 0 ? Math.min(100, (rowAllocated / rowTotal) * 100) : 0

                      return (
                        <tr key={row.connection_id} className="transition-colors hover:bg-raise">
                          <td className="py-3.5 pl-5 pr-3">
                            <div className="flex items-center gap-2.5">
                              <ProviderMark provider={row.provider} size={16} />
                              <div>
                                <p className="font-semibold text-regal-navy">{row.display_name}</p>
                                <p className="font-mono text-2xs text-muted-slate uppercase">
                                  {providerName(row.provider)}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3 font-mono text-xs font-medium text-regal-navy">
                            {formatBytes(rowUsed)}
                          </td>

                          <td className="py-3.5 px-3 font-mono text-xs text-muted-slate">
                            {rowReserved > 0 ? (
                              <span className="text-royal-gold font-medium">+{formatBytes(rowReserved)}</span>
                            ) : (
                              "—"
                            )}
                          </td>

                          <td className="py-3.5 px-3 font-mono text-xs text-emerald-700 font-medium">
                            {formatBytes(row.free_bytes)}
                          </td>

                          <td className="py-3.5 px-3 font-mono text-xs text-slate-text">
                            {formatBytes(rowTotal)}
                          </td>

                          <td className="py-3.5 px-3 pr-5 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-line">
                                <div
                                  className={`h-full rounded-full ${
                                    rowPct >= 90 ? "bg-danger" : rowPct >= 75 ? "bg-warning" : "bg-regal-navy"
                                  }`}
                                  style={{ width: `${rowPct}%` }}
                                />
                              </div>
                              <span className="font-mono text-xs font-bold text-regal-navy w-12 text-right">
                                {rowPct.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center flex flex-col items-center">
                <div className="h-12 w-12 rounded-xl bg-corn-silk text-regal-navy flex items-center justify-center mb-3">
                  <Server size={22} />
                </div>
                <h3 className="font-semibold text-regal-navy text-base">No cloud accounts connected</h3>
                <p className="text-muted-slate text-sm max-w-md mt-1 mb-4">
                  Connect cloud providers to assemble your multi-cloud storage pool. Storage quotas and free-tier balances will appear here in real time.
                </p>
                <Button
                  variant="gold"
                  size="sm"
                  onClick={() => navigate("/app/clouds?connect=1")}
                >
                  <Plus size={13} className="mr-1" /> Connect cloud provider
                </Button>
              </div>
            )}
          </Panel>

          {/* Technical Capacity Governance Notes */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="nc-card p-4 flex gap-3 items-start">
              <HardDrive size={18} className="text-regal-navy shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-regal-navy">Measured Usage</p>
                <p className="mt-1 text-2xs text-muted-slate leading-relaxed">
                  Represents actual object bytes committed and indexed in your cloud buckets. Never estimated or simulated.
                </p>
              </div>
            </div>

            <div className="nc-card p-4 flex gap-3 items-start">
              <Zap size={18} className="text-royal-gold shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-regal-navy">Reserved In-Flight</p>
                <p className="mt-1 text-2xs text-muted-slate leading-relaxed">
                  Temporarily locked storage for active presigned URLs. Unused reservations expire automatically after 15 minutes.
                </p>
              </div>
            </div>

            <div className="nc-card p-4 flex gap-3 items-start">
              <ShieldCheck size={18} className="text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-regal-navy">Zero Lock-In Architecture</p>
                <p className="mt-1 text-2xs text-muted-slate leading-relaxed">
                  NexusCloud is purely an orchestration mesh. Your buckets and objects remain 100% under your cloud account credentials.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
