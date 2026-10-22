import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AnimatePresence, motion, type Variants } from "framer-motion"
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Cpu,
  Loader2,
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
import { PanelHeader } from "../../components/ui/panel"
import { ErrorState, ListSkeleton } from "../../components/ui/states"
import { StatusBadge } from "../../components/ui/status"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/field"
import { ProviderMark } from "../../components/ui/provider-mark"
import {
  SpotlightCard,
  BorderBeam,
  ShinyText,
  TiltCard,
  NumberTicker,
  PulsingStatusDot,
} from "../../components/ui/effects"
import { cn } from "../../lib/utils"

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

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
}

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.42,
      ease: [0.16, 1, 0.3, 1],
    },
  },
}

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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="router-light-page w-full flex flex-col gap-4.5 pb-8 text-[#142B4A] bg-[#FFFDF8]"
    >
      <PageHeader
        kicker="Placement Engine"
        title="Smart Router"
        description="Simulate real-time multi-cloud placement decisions based on server-side scoring across capacity, egress, permanence, and quota fit."
      />

      {/* ── Orchestrator Telemetry Ribbon ── */}
      <motion.div
        variants={sectionVariants}
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-[#E8E0D1] bg-[#FAF6ED]/90 backdrop-blur-md text-xs font-mono shadow-2xs"
      >
        <div className="flex items-center gap-2.5">
          <PulsingStatusDot color="gold" size="sm" />
          <span className="font-semibold text-[#142B4A] tracking-wide">
            ORCHESTRATOR ENGINE ACTIVE
          </span>
          <span className="text-[#A77B26]">·</span>
          <span className="text-[#526686] hidden sm:inline">
            Deterministic Multi-Criteria Optimization (MCO-v2)
          </span>
        </div>
        <div className="flex items-center gap-3 text-2xs text-[#68768A]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Zero-Egress Priority
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            Live Quota Telemetry
          </span>
        </div>
      </motion.div>

      {/* ── 1. Simulator Request Workspace with Interactive Spotlight ── */}
      <motion.div variants={sectionVariants}>
        <SpotlightCard className="rounded-2xl border border-[#E8E0D1] bg-white text-[#142B4A] shadow-xs overflow-hidden">
          <PanelHeader
            title="Placement Simulation Parameters"
            meta="Evaluates against real live connected bucket quotas"
          />

          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              {/* Input with Unit selector */}
              <div className="flex flex-col gap-1.5 flex-1 max-w-md">
                <label htmlFor="sim-size-val" className="text-xs font-semibold uppercase tracking-wider text-[#68768A] font-mono">
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
                      className="h-10 w-full rounded-lg border border-[#E8E0D1] bg-white px-3 text-sm font-semibold text-[#142B4A] focus:border-[#C49A3A] focus:outline-none transition-colors"
                      aria-label="File size unit"
                    >
                      <option value="B">Bytes</option>
                      <option value="KB">KB</option>
                      <option value="MB">MB</option>
                      <option value="GB">GB</option>
                    </select>
                  </div>
                </div>
                <p className="font-mono text-2xs text-[#68768A]">
                  Calculated payload:{" "}
                  <span className="font-medium text-[#142B4A]">
                    {calculatedBytes ? `${calculatedBytes.toLocaleString()} bytes (${formatBytes(calculatedBytes)})` : "Invalid size"}
                  </span>
                </p>
              </div>

              {/* Quick Presets with Sliding Spring Indicator Animation */}
              <div className="flex flex-col gap-1.5">
                <span className="text-2xs font-semibold uppercase tracking-wider text-[#68768A] font-mono">
                  Quick Size Presets
                </span>
                <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-[#FAF6ED] border border-[#E8E0D1]">
                  {PRESET_SIZES.map((preset) => {
                    const isPresetActive = Number.parseFloat(sizeValue) === preset.value && sizeUnit === preset.unit
                    return (
                      <motion.button
                        key={preset.label}
                        type="button"
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => applyPreset(preset.value, preset.unit)}
                        className={cn(
                          "relative rounded-lg px-3 py-1.5 text-xs font-mono font-medium transition-colors select-none cursor-pointer",
                          isPresetActive ? "text-[#142B4A] font-bold" : "text-[#68768A] hover:text-[#142B4A]"
                        )}
                      >
                        {isPresetActive && (
                          <motion.div
                            layoutId="activeRouterPresetLight"
                            className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#C49A3A] to-[#E0C078] shadow-xs"
                            transition={{ type: "spring", stiffness: 450, damping: 28 }}
                          />
                        )}
                        <span className="relative z-1 flex items-center gap-1">
                          <span>{preset.label}</span>
                          <span className={isPresetActive ? "text-[#142B4A]/80 font-bold" : "text-[#8A96A8]"}>({preset.desc})</span>
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Submit Action with Spring Micro-interaction & Halo */}
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="relative group"
              >
                <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#C49A3A] to-[#E0C078] opacity-0 blur-sm group-hover:opacity-35 transition-opacity duration-300 pointer-events-none" />
                <Button
                  type="submit"
                  variant="gold"
                  size="lg"
                  disabled={!calculatedBytes || !hasConnections}
                  className="relative shadow-md font-bold px-6 h-11 min-w-[195px] shrink-0"
                >
                  {preview.isFetching ? (
                    <Loader2 size={14} className="mr-2 animate-spin text-[#142B4A]" aria-hidden />
                  ) : (
                    <Play size={14} className="mr-2 fill-current" aria-hidden />
                  )}
                  <span>Evaluate Placement</span>
                </Button>
              </motion.div>
            </div>
          </form>
        </SpotlightCard>
      </motion.div>

      {/* ── Prerequisite Check: No Connections ── */}
      {!hasConnections && !connections.isLoading ? (
        <motion.div variants={sectionVariants}>
          <div className="rounded-2xl border border-[#E8E0D1] bg-gradient-to-b from-white via-[#FAF7F2]/40 to-white text-[#142B4A] shadow-xs overflow-hidden">
            <div className="p-8 sm:p-12 lg:p-14 text-center flex flex-col items-center justify-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#FFF8E7] to-[#FDF0D0] border border-[#C49A3A]/40 text-[#C49A3A] flex items-center justify-center mb-4.5 shadow-sm">
                <Server size={30} strokeWidth={2} />
              </div>
              <h3 className="font-cinzel text-xl sm:text-2xl lg:text-[26px] font-bold text-[#142B4A] tracking-tight leading-snug">
                Prerequisite: Connect a Cloud Storage Provider
              </h3>
              <p className="font-alora text-base sm:text-[17px] text-[#526071] max-w-3xl mt-3 mb-7 leading-relaxed">
                The Smart Router evaluates candidates dynamically by querying live free-tier balances and network egress coefficients across your connected clouds. Connect at least one cloud provider to run placement simulations.
              </p>
              <button
                type="button"
                onClick={() => navigate("/app/clouds?connect=1")}
                className="inline-flex items-center gap-2.5 rounded-xl bg-[#142B4A] hover:bg-[#0B1B32] text-white px-7 h-12 text-sm sm:text-base font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>Connect Cloud Provider</span>
                <ArrowRight size={16} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}

      {/* ── 2. Decision Results with Smooth Seamless Updates ── */}
      {submittedBytes !== null && hasConnections ? (
        <motion.div variants={sectionVariants}>
          {preview.isLoading && !preview.data ? (
            <div className="rounded-2xl border border-[#E8E0D1] bg-white text-[#142B4A] shadow-xs overflow-hidden">
              <div className="p-6">
                <ListSkeleton rows={3} />
                <p className="mt-4 text-center font-mono text-xs text-[#68768A] animate-pulse">
                  Running server-side multi-factor scoring against active cloud endpoints…
                </p>
              </div>
            </div>
          ) : preview.isError && !preview.data ? (
            <div className="rounded-2xl border border-[#E8E0D1] bg-white text-[#142B4A] shadow-xs overflow-hidden">
              <ErrorState error={preview.error} onRetry={() => void preview.refetch()} />
            </div>
          ) : preview.data ? (
            <div className={cn("transition-opacity duration-200", preview.isFetching && "opacity-80")}>
              <RouteDecision preview={preview.data} onReplay={() => setSubmittedBytes(calculatedBytes)} />
            </div>
          ) : null}
        </motion.div>
      ) : null}

      {/* ── 3. Policy Engine Blueprint with Interactive Weights ── */}
      <motion.div variants={sectionVariants}>
        <div className="rounded-2xl border border-[#E8E0D1] bg-white text-[#142B4A] shadow-xs overflow-hidden">
          <PanelHeader
            title="Placement Scoring Methodology"
            meta="Server-side algorithm · Fixed mathematical weights"
          />
          <div className="p-5">
            <p className="text-xs text-[#68768A] leading-relaxed mb-4">
              When an upload request arrives, the NexusCloud Smart Router calculates an overall fitness score <span className="font-mono text-[#142B4A] font-semibold">S ∈ [0, 1]</span> for every connected cloud using the deterministic weighted formula below. The highest scoring cloud receives the presigned upload URL.
            </p>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {ROUTE_WEIGHTS.map((weight) => (
                <motion.div
                  key={weight.key}
                  whileHover={{ scale: 1.03, y: -3 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="group relative overflow-hidden rounded-xl border border-[#E8E0D1] bg-gradient-to-b from-[#FFFDF8] to-[#FAF6ED] p-3.5 sm:p-4 flex flex-col justify-between shadow-2xs hover:border-[#C49A3A] hover:shadow-md transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#C49A3A]/10 to-transparent rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div>
                    <div className="flex items-baseline justify-between mb-1.5">
                      <ShinyText className="font-mono text-2xl font-bold tracking-tight">
                        {(weight.weight * 100).toFixed(0)}%
                      </ShinyText>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#A77B26] font-bold bg-[#FFF8E7] px-2 py-0.5 rounded-md border border-[#C49A3A]/30 shadow-2xs">
                        Weight {(weight.weight).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-[#142B4A]">{weight.label}</p>
                  </div>

                  {/* Visual Weight Progress Meter */}
                  <div className="my-2.5 h-1.5 w-full bg-[#E8E0D1] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#C49A3A] to-[#E0C078] rounded-full transition-all duration-700"
                      style={{ width: `${weight.weight * 100}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-[#68768A] leading-relaxed">
                    {weight.key === "capacity" && "Scores relative free capacity against the emptiest available connected cloud."}
                    {weight.key === "egress" && "Rewards zero-egress providers (e.g. Cloudflare R2) and penalizes heavy egress rates."}
                    {weight.key === "permanence" && "Prioritizes permanent always-free tiers over 12-month promotional trials."}
                    {weight.key === "fit" && "Calculates optimal storage density to minimize quota fragmentation."}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function RouteDecision({
  preview,
  onReplay,
}: {
  preview: NonNullable<ReturnType<typeof useRoutePreview>["data"]>
  onReplay: () => void
}) {
  const [isReplaying, setIsReplaying] = useState(false)
  const selected = preview.candidates.find(
    (candidate) => candidate.connection_id === preview.selected_connection_id,
  )

  const handleReplayClick = () => {
    setIsReplaying(true)
    onReplay()
    setTimeout(() => setIsReplaying(false), 500)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Blocked Alert if applicable */}
      {preview.blocked_reason ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-danger/30 bg-danger/10 p-5 flex items-start gap-3 shadow-md"
        >
          <ShieldAlert size={20} className="text-danger shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-danger">Upload Blocked</p>
            <p className="text-xs text-[#526686] mt-0.5">{preview.message ?? "File exceeds available storage limits across all connected clouds."}</p>
            <p className="font-mono text-2xs text-[#68768A] mt-1 uppercase">Reason code: {preview.blocked_reason}</p>
          </div>
        </motion.div>
      ) : null}

      {/* ── Recommended Placement Hero Card with 3D Tilt & Living BorderBeam ── */}
      {selected ? (
        <TiltCard maxTilt={5} className="rounded-2xl shadow-xl">
          <div className="relative overflow-hidden rounded-2xl border border-[#C49A3A]/60 bg-gradient-to-br from-[#142B4A] via-[#10243E] to-[#0B1A2F] text-white p-6.5 shadow-2xl">
            <BorderBeam size={180} duration={7} colorFrom="#E0C078" colorTo="transparent" />

            {/* Ethereal background radial light */}
            <div
              className="absolute -top-20 -right-20 w-96 h-96 pointer-events-none rounded-full blur-3xl opacity-30 animate-pulse-soft"
              style={{ background: "radial-gradient(circle, rgba(196,154,58,0.6) 0%, transparent 70%)" }}
            />

            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
              <Cpu size={210} />
            </div>

            <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C49A3A]/20 border border-[#C49A3A]/50 px-2.5 py-0.5 font-mono text-2xs font-bold uppercase tracking-wider text-[#F5D78E] shadow-xs">
                    <Sparkles size={11} className="text-[#F5D78E] animate-spin-slow" />
                    Recommended Placement · Winner
                  </span>
                  <span className="font-mono text-2xs text-[#8A96A8] hidden sm:inline">
                    Deterministic Score Rank #1
                  </span>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={selected.connection_id}
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="flex items-center gap-4 mt-1"
                  >
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-md">
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#C49A3A]/25 to-transparent pointer-events-none" />
                      <ProviderMark provider={selected.provider} size={30} />
                    </div>
                    <div>
                      <h3 className="font-palatino text-2xl lg:text-3xl font-bold tracking-tight text-white drop-shadow-xs">
                        {selected.display_name}
                      </h3>
                      <p className="font-mono text-2xs text-[#E0D8C8] uppercase tracking-wider mt-0.5 flex items-center gap-2">
                        <span>{formatBytes(selected.free_bytes)} free capacity</span>
                        <span>·</span>
                        <span className="text-[#E0C078] font-semibold">{selected.provider}</span>
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Score & Component Summary with Spring Number Ticker */}
              <div className="flex flex-col lg:items-end gap-2.5 bg-black/25 border border-white/15 rounded-2xl p-4.5 backdrop-blur-md shadow-inner">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-2xs uppercase tracking-wider text-[#E0D8C8]/80">Winning Score:</span>
                  <span className="font-mono text-3xl font-bold text-[#F5D78E] drop-shadow-sm flex items-center">
                    <NumberTicker value={selected.score ?? 0} decimals={3} />
                  </span>
                  <span className="font-mono text-2xs text-white/50">/ 1.000</span>
                </div>

                {selected.components ? (
                  <div className="flex flex-wrap gap-2 font-mono text-2xs text-[#E0D8C8]/90">
                    <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg border border-white/15 hover:border-emerald-400/60 transition-colors">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Cap: <strong className="text-white">+{selected.components.capacity?.toFixed(3) ?? "0"}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg border border-white/15 hover:border-[#E0C078]/60 transition-colors">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E0C078]" />
                      Egress: <strong className="text-white">+{selected.components.egress?.toFixed(3) ?? "0"}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg border border-white/15 hover:border-sky-400/60 transition-colors">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                      Perm: <strong className="text-white">+{selected.components.permanence?.toFixed(3) ?? "0"}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg border border-white/15 hover:border-purple-400/60 transition-colors">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      Fit: <strong className="text-white">+{selected.components.fit?.toFixed(3) ?? "0"}</strong>
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </TiltCard>
      ) : null}

      {/* ── Candidate Evaluation Table with Gliding Progress Meters & Energy Gauges ── */}
      <div className="rounded-2xl border border-[#E8E0D1] bg-white shadow-xs overflow-hidden">
        <PanelHeader
          title="Candidate Evaluation Breakdown"
          meta={`${formatBytes(preview.size_bytes)} payload · ${preview.candidates.length} cloud${preview.candidates.length === 1 ? "" : "s"} evaluated`}
          actions={
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReplayClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E0D1] hover:border-[#C49A3A] bg-[#FAF6ED] hover:bg-[#FFF8E7] text-xs font-mono font-semibold text-[#142B4A] transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCw size={12} className={cn("transition-transform duration-500", isReplaying && "rotate-180")} aria-hidden />
              <span>Re-evaluate</span>
            </motion.button>
          }
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#E8E0D1] bg-[#FAF6ED] font-mono text-2xs uppercase tracking-wider text-[#68768A]">
              <tr>
                <th className="py-3 pl-5 pr-3">Rank</th>
                <th className="py-3 px-3">Candidate Cloud</th>
                <th className="py-3 px-3">Free Capacity</th>
                <th className="py-3 px-3">Composite Score Gauge</th>
                <th className="py-3 px-3 text-right pr-5">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E0D1] font-sans">
              {preview.candidates.map((candidate, index) => {
                const isSelected = candidate.connection_id === preview.selected_connection_id
                const score = candidate.score ?? 0

                return (
                  <motion.tr
                    key={candidate.connection_id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.28, delay: index * 0.04 }}
                    className={cn(
                      "transition-all duration-200",
                      isSelected
                        ? "bg-[#FAF6ED]/95 font-medium border-l-4 border-[#C49A3A] shadow-xs"
                        : "hover:bg-[#FAF6ED]/50"
                    )}
                  >
                    <td className="py-4 pl-5 pr-3 font-mono text-xs">
                      {isSelected ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-[#C49A3A] to-[#A77B26] text-white font-bold text-2xs shadow-xs">
                          #1
                        </span>
                      ) : (
                        <span className="text-[#68768A] font-medium pl-1">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-3">
                      <div className="flex items-center gap-3">
                        <div className="p-1 rounded-lg bg-[#FAF6ED] border border-[#E8E0D1]">
                          <ProviderMark provider={candidate.provider} size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-[#142B4A] flex items-center gap-1.5">
                            {candidate.display_name}
                            {isSelected && (
                              <Award size={13} className="text-[#C49A3A]" />
                            )}
                          </p>
                          <p className="font-mono text-2xs text-[#68768A] uppercase">{candidate.provider} storage</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-3 font-mono text-xs text-[#526686]">
                      {formatBytes(candidate.free_bytes)}
                    </td>

                    <td className="py-4 px-3">
                      <div className="flex flex-col gap-1.5 max-w-sm">
                        <div className="flex items-center gap-3">
                          <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-[#E8E0D1] flex shadow-inner">
                            {candidate.components ? (
                              <>
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-500 transition-all duration-600 ease-out"
                                  style={{ width: `${Math.min(100, (candidate.components.capacity ?? 0) * 100)}%` }}
                                  title={`Capacity: +${candidate.components.capacity?.toFixed(3)}`}
                                />
                                <div
                                  className="h-full bg-gradient-to-r from-[#C49A3A] to-[#E0C078] transition-all duration-600 ease-out"
                                  style={{ width: `${Math.min(100, (candidate.components.egress ?? 0) * 100)}%` }}
                                  title={`Egress: +${candidate.components.egress?.toFixed(3)}`}
                                />
                                <div
                                  className="h-full bg-gradient-to-r from-sky-600 to-sky-500 transition-all duration-600 ease-out"
                                  style={{ width: `${Math.min(100, (candidate.components.permanence ?? 0) * 100)}%` }}
                                  title={`Permanence: +${candidate.components.permanence?.toFixed(3)}`}
                                />
                                <div
                                  className="h-full bg-gradient-to-r from-purple-600 to-purple-500 transition-all duration-600 ease-out"
                                  style={{ width: `${Math.min(100, (candidate.components.fit ?? 0) * 100)}%` }}
                                  title={`Fit: +${candidate.components.fit?.toFixed(3)}`}
                                />
                              </>
                            ) : (
                              <div
                                className={`h-full rounded-full transition-all duration-600 ease-out ${
                                  isSelected ? "bg-gradient-to-r from-[#C49A3A] to-[#E0C078]" : "bg-[#68768A]/35"
                                }`}
                                style={{ width: `${Math.max(4, score * 100)}%` }}
                              />
                            )}
                            {/* High-tech sheen highlight line */}
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />
                          </div>
                          <span className="font-mono text-xs text-[#142B4A] font-bold w-14 text-right transition-colors duration-200">
                            <NumberTicker value={score} decimals={3} />
                          </span>
                        </div>
                        {candidate.components ? (
                          <div className="flex items-center gap-2.5 font-mono text-[9px] text-[#68768A]">
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />Cap</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#C49A3A]" />Egress</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-600" />Perm</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-600" />Fit</span>
                          </div>
                        ) : null}
                      </div>
                    </td>

                    <td className="py-4 px-3 pr-5 text-right">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#C49A3A]/20 px-3 py-1 font-mono text-2xs font-bold text-[#142B4A] border border-[#C49A3A]/40 shadow-xs">
                          <CheckCircle2 size={12} className="text-[#142B4A]" /> Selected
                        </span>
                      ) : candidate.eligible ? (
                        <StatusBadge tone="neutral">Eligible</StatusBadge>
                      ) : (
                        <StatusBadge tone="warn">Ineligible</StatusBadge>
                      )}
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
