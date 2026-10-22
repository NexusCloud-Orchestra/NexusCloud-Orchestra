import { useMemo, useState } from "react"
import {
  Activity,
  Cloud,
  Download,
  Key,
  LogIn,
  LogOut,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  Upload,
} from "lucide-react"

import { useAuditLogs } from "../../hooks/use-data"
import { formatDateTime, formatRelative } from "../../lib/format"
import { PageHeader } from "../../components/layout/shell"
import { Panel, PanelHeader } from "../../components/ui/panel"
import { ErrorState, ListSkeleton } from "../../components/ui/states"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/field"

interface ActionMeta {
  label: string
  group: "files" | "clouds" | "account"
  tone: "ok" | "neutral" | "warn" | "danger"
  icon: typeof Activity
}

const EVENT_METAS: Record<string, ActionMeta> = {
  UPLOAD: { label: "File Upload Completed", group: "files", tone: "ok", icon: Upload },
  UPLOAD_REQUEST: { label: "Upload Slot Reserved", group: "files", tone: "neutral", icon: Upload },
  UPLOAD_CANCEL: { label: "Upload Cancelled", group: "files", tone: "warn", icon: Upload },
  DOWNLOAD: { label: "Download URL Issued", group: "files", tone: "neutral", icon: Download },
  DELETE: { label: "File Deleted", group: "files", tone: "danger", icon: Trash2 },
  CONNECT: { label: "Cloud Provider Connected", group: "clouds", tone: "ok", icon: Cloud },
  DISCONNECT: { label: "Cloud Provider Disconnected", group: "clouds", tone: "warn", icon: Cloud },
  LOGIN: { label: "User Signed In", group: "account", tone: "neutral", icon: LogIn },
  LOGOUT: { label: "User Signed Out", group: "account", tone: "neutral", icon: LogOut },
  REGISTER: { label: "Account Registered", group: "account", tone: "ok", icon: Shield },
  PASSWORD_CHANGE: { label: "Password Changed", group: "account", tone: "warn", icon: Key },
  PASSWORD_RESET: { label: "Password Reset Requested", group: "account", tone: "warn", icon: Key },
  PLAN_CHANGE: { label: "Subscription Plan Updated", group: "account", tone: "neutral", icon: Activity },
}

export function ActivityLight() {
  const audit = useAuditLogs()
  const [filter, setFilter] = useState<"all" | "files" | "clouds" | "account">("all")
  const [search, setSearch] = useState("")

  const filteredData = useMemo(() => {
    if (!audit.data) return []
    return audit.data.filter((e) => {
      const meta = EVENT_METAS[e.action] ?? { group: "account" }
      const matchesGroup = filter === "all" || meta.group === filter
      if (!matchesGroup) return false

      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        e.action.toLowerCase().includes(q) ||
        (e.resource_id && e.resource_id.toLowerCase().includes(q)) ||
        (e.ip_address && e.ip_address.toLowerCase().includes(q)) ||
        (meta && 'label' in meta && meta.label.toLowerCase().includes(q))
      )
    })
  }, [audit.data, filter, search])

  const totalCount = audit.data?.length ?? 0
  const fileEventsCount = audit.data?.filter((e) => (EVENT_METAS[e.action]?.group ?? "account") === "files").length ?? 0
  const cloudEventsCount = audit.data?.filter((e) => (EVENT_METAS[e.action]?.group ?? "account") === "clouds").length ?? 0
  const securityEventsCount = audit.data?.filter((e) => (EVENT_METAS[e.action]?.group ?? "account") === "account").length ?? 0

  return (
    <div className="animate-fade-rise flex flex-col gap-4 sm:gap-4.5 pb-6">
      <PageHeader
        kicker="Audit Trail"
        title="Activity Log"
        description="Immutable audit ledger recording file transactions, cloud connections, and security events. Up to 100 recent events."
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void audit.refetch()}
            loading={audit.isFetching}
          >
            <RefreshCw size={12} className="mr-1.5" />
            Refresh
          </Button>
        }
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-[#E8E0D1] bg-white p-3.5 shadow-2xs flex flex-col justify-between min-h-[82px]">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#68768A] font-bold">TOTAL LOGGED</p>
          <p className="mt-1 font-palatino text-xl sm:text-2xl font-bold text-[#142B4A] tnum leading-tight">{totalCount}</p>
        </div>
        <div className="rounded-xl border border-[#E8E0D1] bg-white p-3.5 shadow-2xs flex flex-col justify-between min-h-[82px]">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#68768A] font-bold">FILE OPERATIONS</p>
          <p className="mt-1 font-palatino text-xl sm:text-2xl font-bold text-[#142B4A] tnum leading-tight">{fileEventsCount}</p>
        </div>
        <div className="rounded-xl border border-[#E8E0D1] bg-white p-3.5 shadow-2xs flex flex-col justify-between min-h-[82px]">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#68768A] font-bold">CLOUD MESH EVENTS</p>
          <p className="mt-1 font-palatino text-xl sm:text-2xl font-bold text-[#142B4A] tnum leading-tight">{cloudEventsCount}</p>
        </div>
        <div className="rounded-xl border border-[#E8E0D1] bg-white p-3.5 shadow-2xs flex flex-col justify-between min-h-[82px]">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#68768A] font-bold">SECURITY &amp; AUTH</p>
          <p className="mt-1 font-palatino text-xl sm:text-2xl font-bold text-[#142B4A] tnum leading-tight">{securityEventsCount}</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <Panel>
        <div className="p-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border bg-ivory/40">
          {/* Category Filter Chips with Live Badge Counts */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "All Events", count: totalCount },
              { id: "files", label: "File Mesh", count: fileEventsCount },
              { id: "clouds", label: "Cloud Mesh", count: cloudEventsCount },
              { id: "account", label: "Security & Auth", count: securityEventsCount },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilter(cat.id as typeof filter)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  filter === cat.id
                    ? "bg-regal-navy text-white shadow-xs"
                    : "border border-border bg-white text-muted-slate hover:bg-raise hover:text-ink"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] font-bold ${
                    filter === cat.id ? "bg-white/20 text-white" : "bg-corn-silk text-regal-navy"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box & Clear */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-slate" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by action or IP…"
                className="pl-8.5 h-8.5 text-xs"
              />
            </div>
            {search ? (
              <Button variant="ghost" size="sm" onClick={() => setSearch("")} className="text-2xs font-mono h-8.5 px-2">
                Clear
              </Button>
            ) : null}
          </div>
        </div>

        {/* Audit Log Table */}
        <PanelHeader
          title="Audit Ledger"
          meta={`${filteredData.length} event${filteredData.length === 1 ? "" : "s"} shown`}
        />

        {audit.isLoading ? (
          <div className="p-5">
            <ListSkeleton rows={4} />
          </div>
        ) : audit.isError ? (
          <ErrorState error={audit.error} onRetry={() => void audit.refetch()} />
        ) : filteredData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-ivory/60 font-mono text-2xs uppercase tracking-wider text-muted-slate">
                <tr>
                  <th className="py-2.5 pl-5 pr-3">Event</th>
                  <th className="py-2.5 px-3">Resource Target</th>
                  <th className="py-2.5 px-3">Network IP</th>
                  <th className="py-2.5 px-3">Client Agent</th>
                  <th className="py-2.5 px-3 text-right pr-5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-sans">
                {filteredData.map((event) => {
                  const meta = EVENT_METAS[event.action] ?? {
                    label: event.action,
                    group: "account" as const,
                    tone: "neutral" as const,
                    icon: Activity,
                  }
                  const Icon = meta.icon

                  return (
                    <tr key={event.id} className="transition-colors hover:bg-raise">
                      <td className="py-3 pl-5 pr-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                              meta.tone === "ok"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : meta.tone === "danger"
                                  ? "bg-danger/10 text-danger border border-danger/20"
                                  : meta.tone === "warn"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-surface text-regal-navy border border-border"
                            }`}
                          >
                            <Icon size={14} />
                          </div>
                          <div>
                            <p className="font-semibold text-regal-navy text-xs sm:text-sm">{meta.label}</p>
                            <p className="font-mono text-2xs text-muted-slate uppercase">{event.action}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-xs text-slate-text">
                        {event.resource_id ? (
                          <span className="rounded bg-ivory border border-border px-1.5 py-0.5 text-2xs">
                            {event.resource_id.slice(0, 12)}…
                          </span>
                        ) : (
                          <span className="text-muted-slate">—</span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono text-xs text-slate-text">
                        {event.ip_address || "—"}
                      </td>

                      <td className="py-3 px-3 text-2xs text-muted-slate max-w-[200px] truncate" title={event.user_agent ?? ""}>
                        {cleanUserAgent(event.user_agent)}
                      </td>

                      <td className="py-3 px-3 pr-5 text-right font-mono text-xs text-slate-text">
                        <div>{formatDateTime(event.created_at)}</div>
                        <div className="text-2xs text-muted-slate font-sans">{formatRelative(event.created_at)}</div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="h-10 w-10 rounded-xl bg-ivory text-muted-slate flex items-center justify-center mb-2">
              <Activity size={20} />
            </div>
            <p className="font-semibold text-regal-navy text-sm">No events match criteria</p>
            <p className="text-xs text-muted-slate mt-0.5 mb-3">
              {search ? `No activity found matching "${search}"` : "No activity recorded in this category yet."}
            </p>
            {(search || filter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("")
                  setFilter("all")
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </Panel>
    </div>
  )
}

function cleanUserAgent(ua: string | null): string {
  if (!ua) return "—"
  if (ua.includes("Chrome")) return "Chrome Browser"
  if (ua.includes("Firefox")) return "Firefox Browser"
  if (ua.includes("Safari")) return "Safari Browser"
  if (ua.includes("Edge")) return "Edge Browser"
  if (ua.includes("curl") || ua.includes("python")) return "API Client"
  return ua.slice(0, 24)
}
