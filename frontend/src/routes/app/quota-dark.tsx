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
import { PanelHeader } from "../../components/ui/panel"
import { ErrorState, ListSkeleton } from "../../components/ui/states"
import { Button } from "../../components/ui/button"
import { ProviderBadge } from "../../components/ui/cloud-logos"

export function QuotaDark() {
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
    <div className="quota-dark-page animate-fade-rise flex flex-col gap-4 sm:gap-4.5 pb-6 text-[#F5F0E6] bg-[#0B0A08]">
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
        <div className="rounded-xl border border-[#332A1B] bg-[#11100D] text-[#F5F0E6] shadow-md overflow-hidden">
          <div className="p-6">
            <ListSkeleton rows={3} />
          </div>
        </div>
      ) : quota.isError ? (
        <div className="rounded-xl border border-[#332A1B] bg-[#11100D] text-[#F5F0E6] shadow-md overflow-hidden">
          <ErrorState error={quota.error} onRetry={() => void quota.refetch()} />
        </div>
      ) : data ? (
        <>
          {/* Storage Pool KPI Metrics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Measured Stored */}
            <div className="rounded-2xl border border-[#332A1B] bg-[#11100D] p-6 shadow-2xs flex flex-col justify-between min-h-[145px] hover:border-[#C6A052]/60 hover:shadow-xs transition-all">
              <div className="flex items-center justify-between">
                <span className="font-alora text-xs sm:text-sm font-bold uppercase tracking-wider text-[#887D6B]">
                  Measured Stored
                </span>
                <span className="h-3 w-3 rounded-full bg-[#C6A052] shadow-xs" title="Committed files" />
              </div>
              <div className="mt-2">
                <p className="font-palatino text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F0E6] tnum leading-tight">
                  {formatBytes(used)}
                </p>
                <p className="mt-1 font-alora text-xs sm:text-sm text-[#887D6B]">
                  Committed files in buckets
                </p>
              </div>
            </div>

            {/* Card 2: In-Flight Reserved */}
            <div className="rounded-2xl border border-[#332A1B] bg-[#11100D] p-6 shadow-2xs flex flex-col justify-between min-h-[145px] hover:border-[#C6A052]/60 hover:shadow-xs transition-all">
              <div className="flex items-center justify-between">
                <span className="font-alora text-xs sm:text-sm font-bold uppercase tracking-wider text-[#887D6B]">
                  In-Flight Reserved
                </span>
                <span className="h-3 w-3 rounded-full bg-[#E0C078] shadow-xs" title="Active upload tickets" />
              </div>
              <div className="mt-2">
                <p className="font-palatino text-3xl sm:text-4xl font-bold tracking-tight text-[#C6A052] tnum leading-tight">
                  {formatBytes(reserved)}
                </p>
                <p className="mt-1 font-alora text-xs sm:text-sm text-[#887D6B]">
                  Active presigned upload tickets
                </p>
              </div>
            </div>

            {/* Card 3: Available Headroom */}
            <div className="rounded-2xl border border-[#332A1B] bg-[#11100D] p-6 shadow-2xs flex flex-col justify-between min-h-[145px] hover:border-[#C6A052]/60 hover:shadow-xs transition-all">
              <div className="flex items-center justify-between">
                <span className="font-alora text-xs sm:text-sm font-bold uppercase tracking-wider text-[#887D6B]">
                  Available Headroom
                </span>
                <span className="h-3 w-3 rounded-full bg-[#2EC496] shadow-xs" title="Free capacity" />
              </div>
              <div className="mt-2">
                <p className="font-palatino text-3xl sm:text-4xl font-bold tracking-tight text-[#2EC496] tnum leading-tight">
                  {formatBytes(free)}
                </p>
                <p className="mt-1 font-alora text-xs sm:text-sm text-[#887D6B]">
                  Unallocated across providers
                </p>
              </div>
            </div>

            {/* Card 4: Total Pool Limit */}
            <div className="rounded-2xl border border-[#332A1B] bg-[#11100D] p-6 shadow-2xs flex flex-col justify-between min-h-[145px] hover:border-[#C6A052]/60 hover:shadow-xs transition-all">
              <div className="flex items-center justify-between">
                <span className="font-alora text-xs sm:text-sm font-bold uppercase tracking-wider text-[#887D6B]">
                  Total Pool Limit
                </span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-[#211D15] text-[#A77B26] border border-[#C49A3A]/30">
                  {formatPercent(usagePct)} used
                </span>
              </div>
              <div className="mt-2">
                <p className="font-palatino text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F0E6] tnum leading-tight">
                  {formatBytes(limit)}
                </p>
                <p className="mt-1 font-alora text-xs sm:text-sm text-[#887D6B]">
                  {data.plan ? `Plan: ${data.plan.toUpperCase()}` : "Active Pool"}
                  {data.plan_limit_bytes ? ` (Capped at ${formatBytes(data.plan_limit_bytes)})` : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Master Utilization Segmented Visual Bar */}
          <div className="rounded-xl border border-[#332A1B] bg-[#11100D] text-[#F5F0E6] shadow-md overflow-hidden">
            <PanelHeader
              title={<span className="font-palatino text-lg font-bold text-[#F5F0E6]">Storage Pool Utilization</span>}
              meta={limit > 0 ? `${formatBytes(used + reserved)} allocated of ${formatBytes(limit)} pool` : "No limits configured"}
              actions={
                <span className="font-mono text-xs font-bold text-[#F5F0E6] bg-[#211D15] px-2.5 py-1 rounded-lg border border-[#332A1B]">
                  {formatPercent(usagePct)} Utilized
                </span>
              }
            />
            <div className="p-6 flex flex-col gap-5">
              {/* Segmented Bar */}
              <div
                className="h-4.5 w-full overflow-hidden rounded-full bg-[#211D15] border border-[#332A1B] flex shadow-inner"
                role="progressbar"
                aria-valuenow={usagePct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                {/* Measured Used */}
                <div
                  className="h-full bg-[#C6A052] transition-all duration-slow"
                  style={{ width: `${usedPct}%` }}
                  title={`Measured: ${formatBytes(used)}`}
                />
                {/* Reserved In-Flight */}
                <div
                  className="h-full bg-[#E0C078] transition-all duration-slow"
                  style={{ width: `${reservedPct}%` }}
                  title={`Reserved: ${formatBytes(reserved)}`}
                />
              </div>

              {/* Legend with exact breakdowns */}
              <div className="flex flex-wrap items-center justify-between gap-y-3 pt-2 border-t border-[#332A1B] text-sm">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2.5">
                    <span className="h-3 w-3 rounded-xs bg-[#C6A052] shrink-0" />
                    <span className="font-alora text-[#B8AE9B]">
                      Committed: <strong className="font-mono text-[#F5F0E6]">{formatBytes(used)}</strong> ({usedPct.toFixed(1)}%)
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="h-3 w-3 rounded-xs bg-[#E0C078] shrink-0" />
                    <span className="font-alora text-[#B8AE9B]">
                      Reserved: <strong className="font-mono text-[#F5F0E6]">{formatBytes(reserved)}</strong> ({reservedPct.toFixed(1)}%)
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="h-3 w-3 rounded-xs bg-[#211D15] border border-[#332A1B] shrink-0" />
                    <span className="font-alora text-[#887D6B]">
                      Free Headroom: <strong className="font-mono text-[#B8AE9B]">{formatBytes(free)}</strong>
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
                <div className="flex flex-col gap-2.5 pt-3 border-t border-[#332A1B]/80">
                  <div className="flex items-center justify-between">
                    <span className="font-alora text-xs font-bold uppercase tracking-wider text-[#887D6B]">
                      Multi-Cloud Capacity Distribution by Provider
                    </span>
                    <span className="font-mono text-xs text-[#B8AE9B]">
                      {data.by_connection.length} Endpoint{data.by_connection.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="h-3.5 w-full overflow-hidden rounded-full bg-[#211D15] border border-[#332A1B] flex">
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
                          <span className="font-semibold text-[#F5F0E6]">{row.display_name}</span>
                          <span className="text-[#887D6B]">({formatBytes(row.limit_bytes)})</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Per-Provider Storage Allocation Breakdown */}
          <div className="rounded-xl border border-[#332A1B] bg-[#11100D] text-[#F5F0E6] shadow-md overflow-hidden">
            <PanelHeader
              title={<span className="font-palatino text-lg font-bold text-[#F5F0E6]">Per-Cloud Capacity Breakdown</span>}
              meta={`${data.by_connection.length} connected storage endpoint${data.by_connection.length === 1 ? "" : "s"}`}
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/app/clouds")}
                  className="font-alora text-xs font-semibold text-[#F5F0E6] hover:text-[#C6A052]"
                >
                  Manage connections
                </Button>
              }
            />

            {hasConnections ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[#332A1B] bg-[#211D15]/70 font-alora text-xs font-bold tracking-wider uppercase text-[#887D6B]">
                    <tr>
                      <th className="py-3.5 pl-6 pr-3">Cloud Storage Connection</th>
                      <th className="py-3.5 px-3">Committed Data</th>
                      <th className="py-3.5 px-3">Reserved</th>
                      <th className="py-3.5 px-3">Free Capacity</th>
                      <th className="py-3.5 px-3">Provider Cap</th>
                      <th className="py-3.5 px-3 text-right pr-6">Utilization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#332A1B]/60 font-alora">
                    {data.by_connection.map((row) => {
                      const rowTotal = row.limit_bytes
                      const rowUsed = row.used_bytes
                      const rowReserved = row.reserved_bytes
                      const rowAllocated = rowUsed + rowReserved
                      const rowPct = rowTotal > 0 ? Math.min(100, (rowAllocated / rowTotal) * 100) : 0

                      return (
                        <tr key={row.connection_id} className="transition-colors hover:bg-[#211D15]/50">
                          <td className="py-4 pl-6 pr-3">
                            <div className="flex items-center gap-3">
                              <ProviderBadge provider={row.provider} />
                              <div>
                                <p className="font-palatino text-sm font-bold text-[#F5F0E6]">{row.display_name}</p>
                                <p className="font-mono text-xs text-[#887D6B]">
                                  ID: {row.connection_id.slice(0, 8)}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-3 font-mono text-xs font-medium text-[#F5F0E6]">
                            {formatBytes(rowUsed)}
                          </td>

                          <td className="py-4 px-3 font-mono text-xs text-[#887D6B]">
                            {rowReserved > 0 ? (
                              <span className="text-[#C6A052] font-semibold">+{formatBytes(rowReserved)}</span>
                            ) : (
                              "—"
                            )}
                          </td>

                          <td className="py-4 px-3 font-mono text-xs text-[#2EC496] font-semibold">
                            {formatBytes(row.free_bytes)}
                          </td>

                          <td className="py-4 px-3 font-mono text-xs text-[#B8AE9B]">
                            {formatBytes(rowTotal)}
                          </td>

                          <td className="py-4 px-3 pr-6 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <div className="h-2 w-28 overflow-hidden rounded-full bg-[#E8E0D1]">
                                <div
                                  className={`h-full rounded-full ${
                                    rowPct >= 90 ? "bg-danger" : rowPct >= 75 ? "bg-warning" : "bg-[#C6A052]"
                                  }`}
                                  style={{ width: `${rowPct}%` }}
                                />
                              </div>
                              <span className="font-mono text-xs font-bold text-[#F5F0E6] w-12 text-right">
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
                <div className="h-13 w-13 rounded-2xl bg-[#211D15] text-[#F5F0E6] flex items-center justify-center mb-3 border border-[#332A1B]">
                  <Server size={24} />
                </div>
                <h3 className="font-palatino text-xl font-bold text-[#F5F0E6]">No cloud accounts connected</h3>
                <p className="font-alora text-sm text-[#887D6B] max-w-md mt-1 mb-4 leading-relaxed">
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
          </div>

          {/* Technical Capacity Governance Notes */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 font-alora">
            <div className="rounded-2xl border border-[#332A1B] bg-[#11100D] p-5.5 shadow-2xs flex gap-3.5 items-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#211D15] text-[#F5F0E6] border border-[#332A1B]">
                <HardDrive size={18} />
              </div>
              <div>
                <p className="font-palatino text-base font-bold text-[#F5F0E6]">Measured Usage</p>
                <p className="mt-1 text-xs text-[#887D6B] leading-relaxed">
                  Represents actual object bytes committed and indexed in your cloud buckets. Never estimated or simulated.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#332A1B] bg-[#11100D] p-5.5 shadow-2xs flex gap-3.5 items-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#211D15] text-[#C6A052] border border-[#332A1B]">
                <Zap size={18} />
              </div>
              <div>
                <p className="font-palatino text-base font-bold text-[#F5F0E6]">Reserved In-Flight</p>
                <p className="mt-1 text-xs text-[#887D6B] leading-relaxed">
                  Temporarily locked storage for active presigned URLs. Unused reservations expire automatically after 15 minutes.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#332A1B] bg-[#11100D] p-5.5 shadow-2xs flex gap-3.5 items-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="font-palatino text-base font-bold text-[#F5F0E6]">Zero Lock-In Architecture</p>
                <p className="mt-1 text-xs text-[#887D6B] leading-relaxed">
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
