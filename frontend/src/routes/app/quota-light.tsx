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
import { PROVIDER_META } from "../../lib/providers"
import { PageHeader } from "../../components/layout/shell"
import { Panel, PanelHeader } from "../../components/ui/panel"
import { ErrorState, ListSkeleton } from "../../components/ui/states"
import { Button } from "../../components/ui/button"
import { ProviderBadge } from "../../components/ui/cloud-logos"

export function QuotaLight() {
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
    <div className="animate-fade-rise flex flex-col gap-4 sm:gap-4.5 pb-6">
      <PageHeader
        kicker="Capacity Management"
        title="Storage Capacity"
        description="Aggregated multi-cloud storage pool across your connected clouds, derived from provider allowances and governed by your plan."
        actions={
          <Button
            variant="gold"
            size="md"
            onClick={() => navigate("/app/clouds?connect=1")}
            className="shadow-sm font-bold text-sm h-11 px-5"
          >
            <Plus size={16} className="mr-2" aria-hidden />
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Measured Stored */}
            <div className="rounded-2xl border border-[#E8E0D1] bg-white p-6 shadow-2xs flex flex-col justify-between min-h-[145px] hover:border-[#C49A3A]/60 hover:shadow-xs transition-all">
              <div className="flex items-center justify-between">
                <span className="font-alora text-xs sm:text-sm font-bold uppercase tracking-wider text-[#68768A]">
                  Measured Stored
                </span>
                <span className="h-3 w-3 rounded-full bg-[#142B4A] shadow-xs" title="Committed files" />
              </div>
              <div className="mt-2">
                <p className="font-palatino text-3xl sm:text-4xl font-bold tracking-tight text-[#142B4A] tnum leading-tight">
                  {formatBytes(used)}
                </p>
                <p className="mt-1 font-alora text-xs sm:text-sm text-[#68768A]">
                  Committed files in buckets
                </p>
              </div>
            </div>

            {/* Card 2: In-Flight Reserved */}
            <div className="rounded-2xl border border-[#E8E0D1] bg-white p-6 shadow-2xs flex flex-col justify-between min-h-[145px] hover:border-[#C49A3A]/60 hover:shadow-xs transition-all">
              <div className="flex items-center justify-between">
                <span className="font-alora text-xs sm:text-sm font-bold uppercase tracking-wider text-[#68768A]">
                  In-Flight Reserved
                </span>
                <span className="h-3 w-3 rounded-full bg-[#C49A3A] shadow-xs" title="Active upload tickets" />
              </div>
              <div className="mt-2">
                <p className="font-palatino text-3xl sm:text-4xl font-bold tracking-tight text-[#C49A3A] tnum leading-tight">
                  {formatBytes(reserved)}
                </p>
                <p className="mt-1 font-alora text-xs sm:text-sm text-[#68768A]">
                  Active presigned upload tickets
                </p>
              </div>
            </div>

            {/* Card 3: Available Headroom */}
            <div className="rounded-2xl border border-[#E8E0D1] bg-white p-6 shadow-2xs flex flex-col justify-between min-h-[145px] hover:border-[#C49A3A]/60 hover:shadow-xs transition-all">
              <div className="flex items-center justify-between">
                <span className="font-alora text-xs sm:text-sm font-bold uppercase tracking-wider text-[#68768A]">
                  Available Headroom
                </span>
                <span className="h-3 w-3 rounded-full bg-[#168568] shadow-xs" title="Free capacity" />
              </div>
              <div className="mt-2">
                <p className="font-palatino text-3xl sm:text-4xl font-bold tracking-tight text-[#168568] tnum leading-tight">
                  {formatBytes(free)}
                </p>
                <p className="mt-1 font-alora text-xs sm:text-sm text-[#68768A]">
                  Unallocated across providers
                </p>
              </div>
            </div>

            {/* Card 4: Total Pool Limit */}
            <div className="rounded-2xl border border-[#E8E0D1] bg-white p-6 shadow-2xs flex flex-col justify-between min-h-[145px] hover:border-[#C49A3A]/60 hover:shadow-xs transition-all">
              <div className="flex items-center justify-between">
                <span className="font-alora text-xs sm:text-sm font-bold uppercase tracking-wider text-[#68768A]">
                  Total Pool Limit
                </span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-[#FFF8E7] text-[#A77B26] border border-[#C49A3A]/30">
                  {formatPercent(usagePct)} used
                </span>
              </div>
              <div className="mt-2">
                <p className="font-palatino text-3xl sm:text-4xl font-bold tracking-tight text-[#142B4A] tnum leading-tight">
                  {formatBytes(limit)}
                </p>
                <p className="mt-1 font-alora text-xs sm:text-sm text-[#68768A]">
                  {data.plan ? `Plan: ${data.plan.toUpperCase()}` : "Active Pool"}
                  {data.plan_limit_bytes ? ` (Capped at ${formatBytes(data.plan_limit_bytes)})` : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Master Utilization Segmented Visual Bar */}
          <Panel>
            <PanelHeader
              title={<span className="font-palatino text-lg font-bold text-[#142B4A]">Storage Pool Utilization</span>}
              meta={limit > 0 ? `${formatBytes(used + reserved)} allocated of ${formatBytes(limit)} pool` : "No limits configured"}
              actions={
                <span className="font-mono text-xs font-bold text-[#142B4A] bg-[#FAF6ED] px-2.5 py-1 rounded-lg border border-[#E8E0D1]">
                  {formatPercent(usagePct)} Utilized
                </span>
              }
            />
            <div className="p-6 flex flex-col gap-5">
              {/* Segmented Bar */}
              <div
                className="h-4.5 w-full overflow-hidden rounded-full bg-[#FAF6ED] border border-[#E8E0D1] flex shadow-inner"
                role="progressbar"
                aria-valuenow={usagePct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                {/* Measured Used */}
                <div
                  className="h-full bg-[#142B4A] transition-all duration-slow"
                  style={{ width: `${usedPct}%` }}
                  title={`Measured: ${formatBytes(used)}`}
                />
                {/* Reserved In-Flight */}
                <div
                  className="h-full bg-[#C49A3A] transition-all duration-slow"
                  style={{ width: `${reservedPct}%` }}
                  title={`Reserved: ${formatBytes(reserved)}`}
                />
              </div>

              {/* Legend with exact breakdowns */}
              <div className="flex flex-wrap items-center justify-between gap-y-3 pt-2 border-t border-[#E8E0D1] text-sm">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2.5">
                    <span className="h-3 w-3 rounded-xs bg-[#142B4A] shrink-0" />
                    <span className="font-alora text-[#344256]">
                      Committed: <strong className="font-mono text-[#142B4A]">{formatBytes(used)}</strong> ({usedPct.toFixed(1)}%)
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="h-3 w-3 rounded-xs bg-[#C49A3A] shrink-0" />
                    <span className="font-alora text-[#344256]">
                      Reserved: <strong className="font-mono text-[#142B4A]">{formatBytes(reserved)}</strong> ({reservedPct.toFixed(1)}%)
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="h-3 w-3 rounded-xs bg-[#FAF6ED] border border-[#E8E0D1] shrink-0" />
                    <span className="font-alora text-[#68768A]">
                      Free Headroom: <strong className="font-mono text-[#344256]">{formatBytes(free)}</strong>
                    </span>
                  </div>
                </div>

                <Link
                  to="/app/settings"
                  className="font-alora text-xs sm:text-sm text-[#A77B26] font-semibold hover:underline"
                >
                  Manage Tier Limits in Settings →
                </Link>
              </div>

              {/* Multi-Cloud Provider Composition Distribution */}
              {hasConnections && limit > 0 ? (
                <div className="flex flex-col gap-2.5 pt-3 border-t border-[#E8E0D1]/80">
                  <div className="flex items-center justify-between">
                    <span className="font-alora text-xs font-bold uppercase tracking-wider text-[#68768A]">
                      Multi-Cloud Capacity Distribution by Provider
                    </span>
                    <span className="font-mono text-xs text-[#344256]">
                      {data.by_connection.length} Endpoint{data.by_connection.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="h-3.5 w-full overflow-hidden rounded-full bg-[#FAF6ED] border border-[#E8E0D1] flex">
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
                        <div key={row.connection_id} className="flex items-center gap-1.5 font-mono text-xs">
                          <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: marker }} />
                          <span className="font-semibold text-[#142B4A]">{row.display_name}</span>
                          <span className="text-[#68768A]">({formatBytes(row.limit_bytes)})</span>
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
              title={<span className="font-palatino text-lg font-bold text-[#142B4A]">Per-Cloud Capacity Breakdown</span>}
              meta={`${data.by_connection.length} connected storage endpoint${data.by_connection.length === 1 ? "" : "s"}`}
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/app/clouds")}
                  className="font-alora text-xs font-semibold text-[#142B4A] hover:text-[#C49A3A]"
                >
                  Manage connections
                </Button>
              }
            />

            {hasConnections ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[#E8E0D1] bg-[#FAF6ED]/70 font-alora text-xs font-bold tracking-wider uppercase text-[#68768A]">
                    <tr>
                      <th className="py-3.5 pl-6 pr-3">Cloud Storage Connection</th>
                      <th className="py-3.5 px-3">Committed Data</th>
                      <th className="py-3.5 px-3">Reserved</th>
                      <th className="py-3.5 px-3">Free Capacity</th>
                      <th className="py-3.5 px-3">Provider Cap</th>
                      <th className="py-3.5 px-3 text-right pr-6">Utilization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E0D1]/60 font-alora">
                    {data.by_connection.map((row) => {
                      const rowTotal = row.limit_bytes
                      const rowUsed = row.used_bytes
                      const rowReserved = row.reserved_bytes
                      const rowAllocated = rowUsed + rowReserved
                      const rowPct = rowTotal > 0 ? Math.min(100, (rowAllocated / rowTotal) * 100) : 0

                      return (
                        <tr key={row.connection_id} className="transition-colors hover:bg-[#FAF6ED]/50">
                          <td className="py-4 pl-6 pr-3">
                            <div className="flex items-center gap-3">
                              <ProviderBadge provider={row.provider} />
                              <div>
                                <p className="font-palatino text-sm font-bold text-[#142B4A]">{row.display_name}</p>
                                <p className="font-mono text-xs text-[#68768A]">
                                  ID: {row.connection_id.slice(0, 8)}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-3 font-mono text-xs font-medium text-[#142B4A]">
                            {formatBytes(rowUsed)}
                          </td>

                          <td className="py-4 px-3 font-mono text-xs text-[#68768A]">
                            {rowReserved > 0 ? (
                              <span className="text-[#C49A3A] font-semibold">+{formatBytes(rowReserved)}</span>
                            ) : (
                              "—"
                            )}
                          </td>

                          <td className="py-4 px-3 font-mono text-xs text-[#168568] font-semibold">
                            {formatBytes(row.free_bytes)}
                          </td>

                          <td className="py-4 px-3 font-mono text-xs text-[#344256]">
                            {formatBytes(rowTotal)}
                          </td>

                          <td className="py-4 px-3 pr-6 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <div className="h-2 w-28 overflow-hidden rounded-full bg-[#E8E0D1]">
                                <div
                                  className={`h-full rounded-full ${
                                    rowPct >= 90 ? "bg-danger" : rowPct >= 75 ? "bg-warning" : "bg-[#142B4A]"
                                  }`}
                                  style={{ width: `${rowPct}%` }}
                                />
                              </div>
                              <span className="font-mono text-xs font-bold text-[#142B4A] w-12 text-right">
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
                <div className="h-13 w-13 rounded-2xl bg-[#FFF8E7] text-[#142B4A] flex items-center justify-center mb-3 border border-[#E8E0D1]">
                  <Server size={24} />
                </div>
                <h3 className="font-palatino text-xl font-bold text-[#142B4A]">No cloud accounts connected</h3>
                <p className="font-alora text-sm text-[#68768A] max-w-md mt-1 mb-4 leading-relaxed">
                  Connect cloud providers to assemble your multi-cloud storage pool. Storage quotas and free-tier balances will appear here in real time.
                </p>
                <Button
                  variant="gold"
                  size="md"
                  onClick={() => navigate("/app/clouds?connect=1")}
                  className="font-bold text-sm h-11 px-5"
                >
                  <Plus size={15} className="mr-1.5" /> Connect cloud provider
                </Button>
              </div>
            )}
          </Panel>

          {/* Technical Capacity Governance Notes */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 font-alora">
            <div className="rounded-2xl border border-[#E8E0D1] bg-white p-5.5 shadow-2xs flex gap-3.5 items-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FAF6ED] text-[#142B4A] border border-[#E8E0D1]">
                <HardDrive size={18} />
              </div>
              <div>
                <p className="font-palatino text-base font-bold text-[#142B4A]">Measured Usage</p>
                <p className="mt-1 text-xs text-[#68768A] leading-relaxed">
                  Represents actual object bytes committed and indexed in your cloud buckets. Never estimated or simulated.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E8E0D1] bg-white p-5.5 shadow-2xs flex gap-3.5 items-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF8E7] text-[#C49A3A] border border-[#E8E0D1]">
                <Zap size={18} />
              </div>
              <div>
                <p className="font-palatino text-base font-bold text-[#142B4A]">Reserved In-Flight</p>
                <p className="mt-1 text-xs text-[#68768A] leading-relaxed">
                  Temporarily locked storage for active presigned URLs. Unused reservations expire automatically after 15 minutes.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E8E0D1] bg-white p-5.5 shadow-2xs flex gap-3.5 items-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="font-palatino text-base font-bold text-[#142B4A]">Zero Lock-In Architecture</p>
                <p className="mt-1 text-xs text-[#68768A] leading-relaxed">
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
