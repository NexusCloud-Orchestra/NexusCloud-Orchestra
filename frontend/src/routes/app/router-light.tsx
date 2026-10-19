import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Play,
  RotateCw,
  Server,
  ShieldAlert,
  Sparkles,
} from "lucide-react"

import { useConnections, useRoutePreview } from "../../hooks/use-data"
import { formatBytes } from "../../lib/format"
import { ROUTE_WEIGHTS } from "../../lib/providers"
import { PageHeader } from "../../components/layout/shell"
import { Panel, PanelHeader } from "../../components/ui/panel"
import { ErrorState, ListSkeleton } from "../../components/ui/states"
import { StatusBadge } from "../../components/ui/status"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/field"
import { ProviderMark } from "../../components/ui/provider-mark"

type SizeUnit = "B" | "KB" | "MB" | "GB"

const UNIT_MULTIPLIERS: Record<SizeUnit, number> = {
  B: 1,
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
}

const PRESET_SIZES = [
  { label: "1 MB", value: 1, unit: "MB" as SizeUnit, desc: "Doc" },
  { label: "10 MB", value: 10, unit: "MB" as SizeUnit, desc: "Photo" },
  { label: "50 MB", value: 50, unit: "MB" as SizeUnit, desc: "Asset" },
  { label: "250 MB", value: 250, unit: "MB" as SizeUnit, desc: "Video" },
  { label: "1 GB", value: 1, unit: "GB" as SizeUnit, desc: "Dataset" },
  { label: "4.2 GB", value: 4.2, unit: "GB" as SizeUnit, desc: "Image" },
]

export function RouterLight() {
  const navigate = useNavigate()
  const connections = useConnections()

  const [sizeValue, setSizeValue] = useState<string>("10")
  const [sizeUnit, setSizeUnit] = useState<SizeUnit>("MB")
  const [submittedBytes, setSubmittedBytes] = useState<number | null>(10 * 1024 * 1024)

  const preview = useRoutePreview(submittedBytes)

  // Calculate current integer bytes
  const calculatedBytes = useMemo(() => {
    const num = Number.parseFloat(sizeValue)
    if (!Number.isFinite(num) || num <= 0) return null
    const bytes = Math.round(num * UNIT_MULTIPLIERS[sizeUnit])
    // Limit to max 5 GiB
    return Math.min(bytes, 5 * 1024 ** 3)
  }, [sizeValue, sizeUnit])

  const hasConnections = (connections.data?.length ?? 0) > 0

  function applyPreset(val: number, unit: SizeUnit) {
    setSizeValue(String(val))
    setSizeUnit(unit)
    const bytes = Math.round(val * UNIT_MULTIPLIERS[unit])
    setSubmittedBytes(bytes)
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (calculatedBytes) {
      setSubmittedBytes(calculatedBytes)
    }
  }

  return (
    <div className="animate-fade-rise flex flex-col gap-4 sm:gap-4.5 pb-6">
      <PageHeader
        kicker="Placement Engine"
        title="Smart Router"
        description="Simulate real-time multi-cloud placement decisions based on server-side scoring across capacity, egress, permanence, and quota fit."
      />

      {/* Simulator Request Workspace */}
      <Panel>
        <PanelHeader
          title="Placement Simulation Parameters"
          meta="Evaluates against real live connected bucket quotas"
        />

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            {/* Input with Unit selector */}
            <div className="flex flex-col gap-1.5 flex-1 max-w-md">
              <label htmlFor="sim-size-val" className="text-xs font-semibold uppercase tracking-wider text-muted-slate font-mono">
                Simulated File Size
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="sim-size-val"
                    type="number"
                    step="any"
                    min="0.1"
                    value={sizeValue}
                    onChange={(e) => setSizeValue(e.target.value)}
                    placeholder="10"
                    className="font-mono text-base font-medium"
                  />
                </div>
                <div className="w-28 shrink-0">
                  <select
                    value={sizeUnit}
                    onChange={(e) => setSizeUnit(e.target.value as SizeUnit)}
                    className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-regal-navy focus:border-royal-gold focus:outline-none"
                    aria-label="File size unit"
                  >
                    <option value="B">Bytes</option>
                    <option value="KB">KB</option>
                    <option value="MB">MB</option>
                    <option value="GB">GB</option>
                  </select>
                </div>
              </div>
              <p className="font-mono text-2xs text-muted-slate">
                Calculated payload:{" "}
                <span className="font-medium text-regal-navy">
                  {calculatedBytes ? `${calculatedBytes.toLocaleString()} bytes (${formatBytes(calculatedBytes)})` : "Invalid size"}
                </span>
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-col gap-1.5">
              <span className="text-2xs font-semibold uppercase tracking-wider text-muted-slate font-mono">
                Quick Size Presets
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SIZES.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset.value, preset.unit)}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-mono font-medium transition-colors ${
                      Number.parseFloat(sizeValue) === preset.value && sizeUnit === preset.unit
                        ? "border-royal-gold bg-corn-silk text-regal-navy font-bold shadow-xs"
                        : "border-border bg-surface text-slate-text hover:border-royal-gold/60 hover:bg-raise"
                    }`}
                  >
                    {preset.label} <span className="text-muted-slate font-normal">({preset.desc})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Action */}
              <Button
                type="submit"
                variant="gold"
                size="lg"
                disabled={!calculatedBytes || !hasConnections}
                loading={preview.isLoading || preview.isFetching}
                className="shadow-md font-bold px-6 h-11"
              >
                <Play size={14} className="mr-2 fill-current" aria-hidden />
                Evaluate Placement
              </Button>
          </div>
        </form>
      </Panel>

      {/* Prerequisite Check: No Connections */}
      {!hasConnections && !connections.isLoading ? (
        <Panel className="border-amber-200 bg-amber-50/40">
          <div className="p-8 text-center flex flex-col items-center">
            <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
              <Server size={22} />
            </div>
            <h3 className="font-bold text-regal-navy text-base">Prerequisite: Connect a Cloud Storage Provider</h3>
            <p className="text-slate-text text-sm max-w-lg mt-1.5 mb-5 leading-relaxed">
              The Smart Router evaluates candidates dynamically by querying live free-tier balances and network egress coefficients across your connected clouds. Connect at least one cloud provider to run placement simulations.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/app/clouds?connect=1")}
            >
              Connect Cloud Provider <ArrowRight size={13} className="ml-1" />
            </Button>
          </div>
        </Panel>
      ) : null}

      {/* Decision Results */}
      {submittedBytes !== null && hasConnections ? (
        preview.isLoading || preview.isFetching ? (
          <Panel>
            <div className="p-6">
              <ListSkeleton rows={3} />
              <p className="mt-4 text-center font-mono text-xs text-muted-slate animate-pulse">
                Running server-side multi-factor scoring against active cloud endpoints…
              </p>
            </div>
          </Panel>
        ) : preview.isError ? (
          <Panel>
            <ErrorState error={preview.error} onRetry={() => void preview.refetch()} />
          </Panel>
        ) : preview.data ? (
          <RouteDecision preview={preview.data} onReplay={() => setSubmittedBytes(calculatedBytes)} />
        ) : null
      ) : null}

      {/* Policy Engine Blueprint */}
      <Panel>
        <PanelHeader
          title="Placement Scoring Methodology"
          meta="Server-side algorithm · Fixed mathematical weights"
        />
        <div className="p-5">
          <p className="text-xs text-muted-slate leading-relaxed mb-4">
            When an upload request arrives, the NexusCloud Smart Router calculates an overall fitness score <span className="font-mono text-ink font-semibold">S ∈ [0, 1]</span> for every connected cloud using the deterministic weighted formula below. The highest scoring cloud receives the presigned upload URL.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ROUTE_WEIGHTS.map((weight) => (
              <div key={weight.key} className="nc-card p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="font-mono text-xl font-bold text-regal-navy">
                      {(weight.weight * 100).toFixed(0)}%
                    </span>
                    <span className="font-mono text-2xs uppercase tracking-wider text-royal-gold font-semibold">
                      Weight {(weight.weight).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-regal-navy">{weight.label}</p>
                </div>
                <p className="mt-2 text-2xs text-muted-slate leading-normal">
                  {weight.key === "capacity" && "Scores relative free capacity against the emptiest available connected cloud."}
                  {weight.key === "egress" && "Reward zero-egress providers (e.g. Cloudflare R2) and penalize heavy egress rates."}
                  {weight.key === "permanence" && "Prioritizes permanent always-free tiers over 12-month promotional trials."}
                  {weight.key === "fit" && "Calculates optimal storage density to minimize quota fragmentation."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  )
}

function RouteDecision({
  preview,
  onReplay,
}: {
  preview: NonNullable<ReturnType<typeof useRoutePreview>["data"]>
  onReplay: () => void
}) {
  const selected = preview.candidates.find(
    (candidate) => candidate.connection_id === preview.selected_connection_id,
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Blocked Alert if applicable */}
      {preview.blocked_reason ? (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 flex items-start gap-3">
          <ShieldAlert size={20} className="text-danger shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-danger">Upload Blocked</p>
            <p className="text-xs text-slate-text mt-0.5">{preview.message ?? "File exceeds available storage limits across all connected clouds."}</p>
            <p className="font-mono text-2xs text-muted-slate mt-1 uppercase">Reason code: {preview.blocked_reason}</p>
          </div>
        </div>
      ) : null}

      {/* Recommended Placement Hero Card */}
      {selected ? (
        <div className="nc-card bg-deep-navy text-white p-6 shadow-lg border-royal-gold/40 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 opacity-10 pointer-events-none">
            <Cpu size={180} />
          </div>

          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-royal-gold/20 border border-royal-gold/40 px-3 py-1 text-2xs font-bold uppercase tracking-wider text-royal-gold w-fit">
                <Sparkles size={11} /> Recommended Cloud Placement
              </div>

              <div className="flex items-center gap-3 mt-1">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <ProviderMark provider={selected.provider} size={22} />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold tracking-tight text-white">
                    {selected.display_name}
                  </h3>
                  <p className="font-mono text-2xs text-corn-silk/80 uppercase tracking-wider">
                    {formatBytes(selected.free_bytes)} free capacity · {selected.provider}
                  </p>
                </div>
              </div>
            </div>

            {/* Score & Component Summary */}
            <div className="flex flex-col lg:items-end gap-2 bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xs uppercase tracking-wider text-corn-silk/80">Winning Score:</span>
                <span className="font-mono text-2xl font-bold text-royal-gold">
                  {selected.score ? selected.score.toFixed(3) : "—"}
                </span>
                <span className="font-mono text-2xs text-white/50">/ 1.000</span>
              </div>

              {selected.components ? (
                <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-2xs text-corn-silk/70">
                  <span>Cap: <strong className="text-white">+{selected.components.capacity?.toFixed(3) ?? "0"}</strong></span>
                  <span>Egress: <strong className="text-white">+{selected.components.egress?.toFixed(3) ?? "0"}</strong></span>
                  <span>Perm: <strong className="text-white">+{selected.components.permanence?.toFixed(3) ?? "0"}</strong></span>
                  <span>Fit: <strong className="text-white">+{selected.components.fit?.toFixed(3) ?? "0"}</strong></span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Candidate Evaluation Table */}
      <Panel>
        <PanelHeader
          title="Candidate Evaluation Breakdown"
          meta={`${formatBytes(preview.size_bytes)} payload · ${preview.candidates.length} cloud${preview.candidates.length === 1 ? "" : "s"} evaluated`}
          actions={
            <Button variant="ghost" size="sm" onClick={onReplay}>
              <RotateCw size={11} className="mr-1" aria-hidden />
              Re-evaluate
            </Button>
          }
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-ivory/60 font-mono text-2xs uppercase tracking-wider text-muted-slate">
              <tr>
                <th className="py-2.5 pl-5 pr-3">Rank</th>
                <th className="py-2.5 px-3">Candidate Cloud</th>
                <th className="py-2.5 px-3">Free Capacity</th>
                <th className="py-2.5 px-3">Composite Score</th>
                <th className="py-2.5 px-3 text-right pr-5">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-sans">
              {preview.candidates.map((candidate, index) => {
                const isSelected = candidate.connection_id === preview.selected_connection_id
                const score = candidate.score ?? 0

                return (
                  <tr
                    key={candidate.connection_id}
                    className={`transition-colors ${
                      isSelected ? "bg-corn-silk/50 font-medium" : "hover:bg-raise"
                    }`}
                  >
                    <td className="py-3.5 pl-5 pr-3 font-mono text-xs text-muted-slate">
                      {String(index + 1).padStart(2, "0")}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <ProviderMark provider={candidate.provider} size={16} />
                        <div>
                          <p className="font-semibold text-regal-navy">{candidate.display_name}</p>
                          <p className="font-mono text-2xs text-muted-slate uppercase">{candidate.provider} storage</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-mono text-xs text-slate-text">
                      {formatBytes(candidate.free_bytes)}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex flex-col gap-1 max-w-xs">
                        <div className="flex items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-line flex">
                            {candidate.components ? (
                              <>
                                <div
                                  className="h-full bg-emerald-500"
                                  style={{ width: `${Math.min(100, (candidate.components.capacity ?? 0) * 100)}%` }}
                                  title={`Capacity: +${candidate.components.capacity?.toFixed(3)}`}
                                />
                                <div
                                  className="h-full bg-royal-gold"
                                  style={{ width: `${Math.min(100, (candidate.components.egress ?? 0) * 100)}%` }}
                                  title={`Egress: +${candidate.components.egress?.toFixed(3)}`}
                                />
                                <div
                                  className="h-full bg-blue-500"
                                  style={{ width: `${Math.min(100, (candidate.components.permanence ?? 0) * 100)}%` }}
                                  title={`Permanence: +${candidate.components.permanence?.toFixed(3)}`}
                                />
                                <div
                                  className="h-full bg-purple-500"
                                  style={{ width: `${Math.min(100, (candidate.components.fit ?? 0) * 100)}%` }}
                                  title={`Fit: +${candidate.components.fit?.toFixed(3)}`}
                                />
                              </>
                            ) : (
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isSelected ? "bg-royal-gold" : "bg-muted-slate/40"
                                }`}
                                style={{ width: `${Math.max(4, score * 100)}%` }}
                              />
                            )}
                          </div>
                          <span className="font-mono text-xs text-regal-navy font-bold w-12 text-right">
                            {score.toFixed(3)}
                          </span>
                        </div>
                        {candidate.components ? (
                          <div className="flex items-center gap-2 font-mono text-[9px] text-muted-slate">
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Cap</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-royal-gold" />Egress</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />Perm</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" />Fit</span>
                          </div>
                        ) : null}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 pr-5 text-right">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-royal-gold/15 px-2.5 py-1 font-mono text-2xs font-bold text-royal-gold border border-royal-gold/30">
                          <CheckCircle2 size={11} /> Selected
                        </span>
                      ) : candidate.eligible ? (
                        <StatusBadge tone="neutral">Eligible</StatusBadge>
                      ) : (
                        <StatusBadge tone="warn">Ineligible</StatusBadge>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
