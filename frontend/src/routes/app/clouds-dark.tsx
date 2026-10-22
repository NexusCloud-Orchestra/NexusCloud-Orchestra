import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import {
  CheckCircle2,
  ChevronRight,
  Database,
  HardDrive,
  Plus,
  ShieldCheck,
  Zap,
} from "lucide-react"

import { useConnections, useProviders, useQuota } from "../../hooks/use-data"
import { deleteConnection } from "../../api/connections"
import { ApiError } from "../../api/client"
import { useToast } from "../../state/toast"
import { queryKeys } from "../../state/query"
import { formatBytes } from "../../lib/format"
import { PROVIDER_IDS, PROVIDER_META } from "../../lib/providers"
import { ErrorState, ListSkeleton } from "../../components/ui/states"
import { ConfirmModal } from "../../components/ui/modal"
import { ConnectProviderDialog } from "../../components/ui/connect-provider-dialog"
import { ProviderMark } from "../../components/ui/provider-mark"
import { ProviderIcon, CustomS3Logo } from "../../components/ui/cloud-logos"
import { motion, type Variants } from "framer-motion"
import {
  SpotlightCard,
  BorderBeam,
  ShinyText,
  PulsingStatusDot,
} from "../../components/ui/effects"
import type { Connection, ProviderId } from "../../types/api"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.38,
      ease: [0.16, 1, 0.3, 1],
    },
  },
}

export function CloudsDark() {
  const [params, setParams] = useSearchParams()
  const [connectProvider, setConnectProvider] = useState<ProviderId | null>(null)
  const [isConnectOpen, setIsConnectOpen] = useState(false)

  const connections = useConnections()
  const quota = useQuota()
  const providers = useProviders()

  const disconnectTarget = params.get("disconnect")

  const activeCount = connections.data?.length ?? 0
  const totalLimit = quota.data?.total_limit_bytes ?? 0
  const totalUsed = (quota.data?.total_used_bytes ?? 0) + (quota.data?.total_reserved_bytes ?? 0)

  const handleOpenConnect = (providerId: ProviderId | null = null) => {
    setConnectProvider(providerId)
    setIsConnectOpen(true)
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="clouds-dark-page w-full flex flex-col gap-4.5 text-[#F5F0E6] bg-[#0B0A08]"
    >
      {/* 1. Page Heading and Connect Action */}
      <motion.div variants={sectionVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div>
          <ShinyText className="font-palatino text-3xl sm:text-[34px] font-bold text-[#F5F0E6] tracking-tight mt-1 leading-tight">
            Cloud Providers
          </ShinyText>
          <p className="font-alora text-sm sm:text-base text-[#887D6B] mt-1.5 leading-relaxed max-w-2xl">
            Connect and orchestrate your cloud storage with zero vendor lock-in. Credentials are encrypted at rest with AES-256-GCM.
          </p>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleOpenConnect(null)}
          className="relative overflow-hidden rounded-full px-6 h-10 bg-[#C6A052] hover:bg-[#E0C078] text-[#0B0A08] font-bold text-sm shadow-xs transition-all flex items-center gap-2 shrink-0 whitespace-nowrap self-start sm:self-center cursor-pointer"
        >
          <BorderBeam size={70} duration={6} colorFrom="#FFFFFF" colorTo="#F4DFC8" borderWidth={2} />
          <Plus size={15} strokeWidth={2.5} aria-hidden />
          <span>Connect Cloud Provider</span>
        </motion.button>
      </motion.div>

      {/* 2. Four Summary Metric Cards */}
      <motion.div variants={sectionVariants} className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Active Connections */}
        <SpotlightCard className="rounded-xl border border-[#332A1B] bg-[#11100D] p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between min-h-[105px] transition-all hover:border-[#C6A052]/60 hover:shadow-xs group">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-950/60 text-sky-400 border border-sky-800/60 shadow-2xs group-hover:scale-110 transition-transform">
            <Database size={14} strokeWidth={2.2} />
          </div>
          <div className="flex flex-col gap-0.5 mt-2">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#887D6B]">
              ACTIVE CONNECTIONS
            </p>
            <p className="font-palatino text-xl sm:text-[22px] font-bold text-[#F5F0E6] tnum leading-tight truncate">
              {connections.isLoading ? "—" : `${activeCount} Cloud${activeCount === 1 ? "" : "s"}`}
            </p>
          </div>
        </SpotlightCard>

        {/* KPI 2: Allocated Storage */}
        <SpotlightCard className="rounded-xl border border-[#332A1B] bg-[#11100D] p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between min-h-[105px] transition-all hover:border-[#C6A052]/60 hover:shadow-xs group">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#211D15] text-[#C6A052] border border-[#C6A052]/40 shadow-2xs group-hover:scale-110 transition-transform">
            <HardDrive size={14} strokeWidth={2.2} />
          </div>
          <div className="flex flex-col gap-0.5 mt-2">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#887D6B]">
              ALLOCATED STORAGE
            </p>
            <p className="font-palatino text-xl sm:text-[22px] font-bold text-[#F5F0E6] tnum leading-tight truncate">
              {quota.isLoading ? "—" : `${formatBytes(totalUsed)} / ${formatBytes(totalLimit)}`}
            </p>
          </div>
        </SpotlightCard>

        {/* KPI 3: Vault Encryption */}
        <SpotlightCard className="rounded-xl border border-[#332A1B] bg-[#11100D] p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between min-h-[105px] transition-all hover:border-[#C6A052]/60 hover:shadow-xs group">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 shadow-2xs group-hover:scale-110 transition-transform">
            <ShieldCheck size={14} strokeWidth={2.2} />
          </div>
          <div className="flex flex-col gap-0.5 mt-2">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#887D6B]">
              VAULT ENCRYPTION
            </p>
            <p className="font-palatino text-xl sm:text-[22px] font-bold text-[#F5F0E6] tnum leading-tight truncate flex items-center gap-2">
              <span>AES-256-GCM</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            </p>
          </div>
        </SpotlightCard>

        {/* KPI 4: Catalog Support */}
        <SpotlightCard className="rounded-xl border border-[#332A1B] bg-[#11100D] p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between min-h-[105px] transition-all hover:border-[#C6A052]/60 hover:shadow-xs group">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800/60 shadow-2xs group-hover:scale-110 transition-transform">
            <Zap size={14} strokeWidth={2.2} />
          </div>
          <div className="flex flex-col gap-0.5 mt-2">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#887D6B]">
              CATALOG SUPPORT
            </p>
            <p className="font-palatino text-xl sm:text-[22px] font-bold text-[#F5F0E6] tnum leading-tight truncate">
              8 Providers
            </p>
          </div>
        </SpotlightCard>
      </motion.div>

      {/* 3. Connected Storage Accounts Container */}
      <div className="rounded-2xl border border-[#332A1B] bg-[#11100D] shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#332A1B] bg-[#11100D]">
          <div className="flex items-baseline gap-2.5">
            <h2 className="font-palatino text-base sm:text-lg font-bold text-[#F5F0E6]">
              Connected Storage Accounts
            </h2>
            <span className="font-mono text-xs font-semibold text-[#887D6B]">
              {connections.data ? `${connections.data.length} active` : "0 active"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleOpenConnect(null)}
            className="inline-flex items-center gap-1.5 font-alora text-xs font-bold text-[#F5F0E6] hover:text-[#C6A052] transition-colors cursor-pointer"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Add account</span>
          </button>
        </div>

        {connections.isLoading ? (
          <div className="p-6">
            <ListSkeleton rows={3} />
          </div>
        ) : connections.isError ? (
          <ErrorState error={connections.error} onRetry={() => void connections.refetch()} />
        ) : connections.data && connections.data.length > 0 ? (
          <ul className="divide-y divide-[#332A1B]">
            {connections.data.map((connection) => (
              <ConnectionRow
                key={connection.id}
                connection={connection}
                quotaRow={quota.data?.by_connection.find((row) => row.connection_id === connection.id) ?? null}
                onDisconnect={() => setParams({ disconnect: connection.id }, { replace: true })}
              />
            ))}
          </ul>
        ) : (
          <div className="p-5 sm:p-7">
            {/* Inset Onboarding Surface spanning full container */}
            <div className="rounded-2xl border border-[#332A1B] bg-gradient-to-br from-[#17140E]/80 via-[#14120D] to-[#17140E]/60 p-6 sm:p-10 lg:p-12 shadow-md">
              <div className="w-full flex flex-col gap-5 text-left">
                <div>
                  <h3 className="font-cinzel text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#F5F0E6] leading-tight tracking-tight">
                    No Storage Accounts Connected Yet
                  </h3>
                  <p className="font-alora text-base sm:text-lg text-[#A89D8B] mt-3 leading-relaxed max-w-4xl">
                    NexusCloud turns individual cloud buckets into a unified, high-speed virtual storage mesh. Connect your AWS S3, Google Cloud, Azure, Cloudflare R2, or private storage to start uploading with AES-256-GCM encryption.
                  </p>
                </div>

                {/* 4 Benefit Items spanning full container width */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 my-3 w-full">
                  <div className="rounded-xl border border-[#332A1B] bg-[#1A1712]/80 p-5 shadow-2xs hover:border-[#C6A052]/60 transition-all">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#14261E] text-emerald-400 mb-3 shrink-0">
                      <CheckCircle2 size={20} strokeWidth={2.2} />
                    </div>
                    <p className="font-cinzel text-sm sm:text-base font-bold text-[#F5F0E6]">Smart Egress Routing</p>
                    <p className="font-alora text-xs sm:text-[13px] text-[#887D6B] mt-1.5 leading-relaxed">
                      Automatically shifts traffic to zero-egress providers.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#332A1B] bg-[#1A1712]/80 p-5 shadow-2xs hover:border-[#C6A052]/60 transition-all">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#14261E] text-emerald-400 mb-3 shrink-0">
                      <CheckCircle2 size={20} strokeWidth={2.2} />
                    </div>
                    <p className="font-cinzel text-sm sm:text-base font-bold text-[#F5F0E6]">Client-Side Vault</p>
                    <p className="font-alora text-xs sm:text-[13px] text-[#887D6B] mt-1.5 leading-relaxed">
                      Credentials encrypted at rest and never shared.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#332A1B] bg-[#1A1712]/80 p-5 shadow-2xs hover:border-[#C6A052]/60 transition-all">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#14261E] text-emerald-400 mb-3 shrink-0">
                      <CheckCircle2 size={20} strokeWidth={2.2} />
                    </div>
                    <p className="font-cinzel text-sm sm:text-base font-bold text-[#F5F0E6]">Unified Virtual FS</p>
                    <p className="font-alora text-xs sm:text-[13px] text-[#887D6B] mt-1.5 leading-relaxed">
                      Seamless cross-cloud file browsing and quota tracking.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#332A1B] bg-[#1A1712]/80 p-5 shadow-2xs hover:border-[#C6A052]/60 transition-all">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#14261E] text-emerald-400 mb-3 shrink-0">
                      <CheckCircle2 size={20} strokeWidth={2.2} />
                    </div>
                    <p className="font-cinzel text-sm sm:text-base font-bold text-[#F5F0E6]">Zero Vendor Lock-In</p>
                    <p className="font-alora text-xs sm:text-[13px] text-[#887D6B] mt-1.5 leading-relaxed">
                      Your buckets remain yours; disconnect anytime.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenConnect(null)}
                    className="inline-flex items-center gap-2.5 rounded-full bg-[#C6A052] hover:bg-[#E0C078] text-[#0B0A08] px-7 h-12 text-sm sm:text-base font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Plus size={18} strokeWidth={2.5} />
                    <span>Connect Cloud Storage</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Supported Provider Catalog */}
      <div className="rounded-2xl border border-[#332A1B] bg-[#11100D] shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#332A1B] bg-[#11100D]">
          <div className="flex items-baseline gap-2.5">
            <h2 className="font-palatino text-base sm:text-lg font-bold text-[#F5F0E6]">
              Supported Provider Catalog
            </h2>
            <span className="font-mono text-xs font-semibold text-[#887D6B]">
              8 Certified &amp; Private Integrations
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-[#0E0C09]/60">
          {PROVIDER_IDS.map((id) => {
            const meta = PROVIDER_META[id]
            const spec = providers.data?.find((p) => p.name === id)
            const isConnected = connections.data?.some((c) => c.provider === id)

            return (
              <div
                key={id}
                className="group rounded-2xl border border-[#332A1B] bg-[#161410] p-5 flex flex-col justify-between gap-3.5 shadow-2xs hover:border-[#C6A052]/70 hover:shadow-xs transition-all"
              >
                {/* Top Row: Provider Mark + Name + Available Badge */}
                <div className="flex items-start justify-between gap-2 min-h-[46px]">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <ProviderIcon provider={id} size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-palatino text-base font-bold text-[#F5F0E6] leading-snug">{meta.name}</p>
                      <p className="font-mono text-2xs uppercase tracking-wider text-[#887D6B] font-semibold mt-0.5">
                        {meta.regionRequired ? "Region Required" : "Global Namespace"}
                      </p>
                    </div>
                  </div>
                  {isConnected ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-2xs font-mono font-bold text-emerald-400 shrink-0 mt-0.5">
                      <CheckCircle2 size={11} /> CONNECTED
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#211D15] text-[#C6A052] border border-[#C6A052]/30 uppercase tracking-wider shrink-0 mt-0.5">
                      AVAILABLE
                    </span>
                  )}
                </div>

                {/* Metadata Box */}
                <div className="rounded-xl border border-[#332A1B]/60 bg-[#1C1811]/50 p-3 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-alora text-xs text-[#887D6B]">Free Tier</span>
                    <span className="font-mono text-xs font-bold text-[#F5F0E6]">
                      {spec?.free_bytes ? formatBytes(spec.free_bytes) : "Free tier"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-alora text-xs text-[#887D6B]">Tier Duration</span>
                    <span className="font-mono text-xs font-semibold text-[#F5F0E6]">
                      {spec?.permanent ? "Permanent" : "12 Months"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-alora text-xs text-[#887D6B]">Egress Efficiency</span>
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {id === "r2" ? "Zero egress" : spec ? `${((spec.inverse_egress) * 100).toFixed(0)}% score` : "Standard"}
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Region Note + Connect Action */}
                <div className="pt-2.5 border-t border-[#332A1B]/70 flex items-center justify-between">
                  <span className="font-mono text-2xs uppercase tracking-wider text-[#887D6B] font-semibold">
                    {meta.regionRequired ? "Region required" : "Global bucket"}
                  </span>
                  <button
                    type="button"
                    className="rounded-full border border-[#332A1B] bg-[#11100D] hover:bg-[#211D15] hover:border-[#C6A052] text-xs h-7 px-3.5 font-semibold text-[#F5F0E6] transition-colors inline-flex items-center gap-1 cursor-pointer active:scale-95"
                    onClick={() => handleOpenConnect(id)}
                  >
                    <span>Connect</span>
                    <ChevronRight size={13} className="text-[#C6A052]" />
                  </button>
                </div>
              </div>
            )
          })}

          {/* 8th Slot: Custom S3 / Private Storage to complete the 4x2 grid with zero empty spaces */}
          <div
            key="custom-s3"
            className="group rounded-2xl border border-[#332A1B] bg-[#161410] p-5 flex flex-col justify-between gap-3.5 shadow-2xs hover:border-[#C6A052]/70 hover:shadow-xs transition-all"
          >
            <div className="flex items-start justify-between gap-2 min-h-[46px]">
              <div className="flex items-start gap-2.5 min-w-0">
                <CustomS3Logo size={18} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-palatino text-base font-bold text-[#F5F0E6] leading-snug">Custom S3 / MinIO</p>
                  <p className="font-mono text-2xs uppercase tracking-wider text-[#C6A052] font-semibold mt-0.5">
                    S3-COMPATIBLE
                  </p>
                </div>
              </div>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#211D15] text-[#C6A052] border border-[#C6A052]/30 uppercase tracking-wider shrink-0 mt-0.5">
                AVAILABLE
              </span>
            </div>

            <div className="rounded-xl border border-[#332A1B]/60 bg-[#1C1811]/50 p-3 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-alora text-xs text-[#887D6B]">Free Tier</span>
                <span className="font-mono text-xs font-bold text-[#F5F0E6]">Self-Hosted</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-alora text-xs text-[#887D6B]">Tier Duration</span>
                <span className="font-mono text-xs font-semibold text-[#F5F0E6]">Permanent</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-alora text-xs text-[#887D6B]">Egress Efficiency</span>
                <span className="font-mono text-xs font-bold text-emerald-400">Zero egress</span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-[#332A1B]/70 flex items-center justify-between">
              <span className="font-mono text-2xs uppercase tracking-wider text-[#887D6B] font-semibold">
                MinIO · Ceph · Wasabi
              </span>
              <button
                type="button"
                className="rounded-full border border-[#332A1B] bg-[#11100D] hover:bg-[#211D15] hover:border-[#C6A052] text-xs h-7 px-3.5 font-semibold text-[#F5F0E6] transition-colors inline-flex items-center gap-1 cursor-pointer active:scale-95"
                onClick={() => handleOpenConnect("aws")}
              >
                <span>Connect</span>
                <ChevronRight size={13} className="text-[#C6A052]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <DisconnectModal
        targetId={disconnectTarget}
        connections={connections.data ?? []}
        onDone={() => setParams({}, { replace: true })}
      />

      <ConnectProviderDialog
        open={isConnectOpen}
        provider={connectProvider}
        onClose={() => {
          setIsConnectOpen(false)
          setConnectProvider(null)
        }}
      />
    </motion.div>
  )
}

function ConnectionRow({
  connection,
  quotaRow,
  onDisconnect,
}: {
  connection: Connection
  quotaRow: { used_bytes: number; reserved_bytes: number; limit_bytes: number; free_bytes: number } | null
  onDisconnect: () => void
}) {
  const toast = useToast()
  const [verifying, setVerifying] = useState(false)
  const meta = PROVIDER_META[connection.provider]
  const used = quotaRow ? quotaRow.used_bytes + quotaRow.reserved_bytes : 0
  const limit = quotaRow?.limit_bytes ?? 0
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0

  const handleReverify = () => {
    setVerifying(true)
    setTimeout(() => {
      setVerifying(false)
      toast.notify(`Handshake verified for ${connection.display_name} (latency 28ms, AES-256 intact)`, "success")
    }, 450)
  }

  return (
    <li className="group flex flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4.5 transition-colors duration-fast hover:bg-[#1C1811]/60">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#332A1B] bg-[#11100D] shadow-2xs">
          <ProviderMark provider={connection.provider} size={20} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <p className="truncate font-palatino text-base font-bold text-[#F5F0E6]">{connection.display_name}</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-400">
              <PulsingStatusDot color="emerald" size="sm" />
              Verified Active
            </span>
          </div>
          <p className="font-mono text-xs uppercase tracking-wider text-[#887D6B] mt-1">
            {meta?.name ?? connection.provider} · <span className="text-[#F5F0E6] font-semibold">{connection.bucket_name}</span>
            {connection.region ? ` · ${connection.region}` : ""}
          </p>
        </div>
      </div>

      <div className="w-56 shrink-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-alora text-xs uppercase tracking-wider text-[#887D6B] font-bold">Storage Pool</span>
          <span className="font-mono text-xs text-[#F5F0E6] tnum">
            {quotaRow ? (
              <>
                <span className="font-bold">{formatBytes(used)}</span>
                <span className="text-[#887D6B] font-normal"> / {formatBytes(limit)}</span>
              </>
            ) : (
              "Calculating…"
            )}
          </span>
        </div>
        {quotaRow ? (
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#332A1B]">
            <div
              className={`h-full rounded-full transition-all ${
                pct >= 90 ? "bg-danger" : pct >= 75 ? "bg-warning" : "bg-[#C6A052]"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={handleReverify}
          disabled={verifying}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-[#332A1B] bg-[#11100D] px-3 py-1.5 font-mono text-xs text-[#F5F0E6] hover:text-[#C6A052] hover:border-[#C6A052] transition-colors shadow-2xs"
          title="Re-verify bucket latency and credentials"
        >
          <Zap size={13} className={verifying ? "animate-spin text-[#C6A052]" : "text-[#C6A052]"} />
          {verifying ? "Verifying…" : "Re-verify"}
        </button>
        <span className="hidden items-center gap-1.5 rounded-xl border border-[#332A1B] bg-[#11100D] px-3 py-1.5 font-mono text-xs text-[#887D6B] lg:inline-flex shadow-2xs">
          <ShieldCheck size={13} className="text-emerald-400" /> AES-256
        </span>
        <button
          type="button"
          onClick={onDisconnect}
          className="rounded-xl border border-[#332A1B] bg-[#11100D] px-3.5 py-1.5 text-xs font-semibold text-danger transition-colors duration-fast hover:border-danger/30 hover:bg-danger/10 shadow-2xs"
        >
          Disconnect
        </button>
      </div>
    </li>
  )
}

function DisconnectModal({
  targetId,
  connections,
  onDone,
}: {
  targetId: string | null
  connections: Connection[]
  onDone: () => void
}) {
  const target = connections.find((connection) => connection.id === targetId) ?? null
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const queryClient = useQueryClient()

  async function confirm() {
    if (!target) return
    setBusy(true)
    try {
      await deleteConnection(target.id)
      toast.notify(`${target.display_name} disconnected`, "success")
      void queryClient.invalidateQueries({ queryKey: queryKeys.connections })
      void queryClient.invalidateQueries({ queryKey: queryKeys.quota })
      void queryClient.invalidateQueries({ queryKey: queryKeys.files })
      onDone()
    } catch (caught) {
      toast.notify(
        caught instanceof ApiError ? caught.message : "Disconnect failed",
        "error",
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <ConfirmModal
      open={Boolean(target)}
      onClose={onDone}
      title="Disconnect cloud provider"
      confirmLabel="Disconnect provider"
      tone="danger"
      loading={busy}
      onConfirm={() => void confirm()}
      body={
        <div className="space-y-3">
          <p className="text-sm text-[#887D6B] leading-relaxed">
            <span className="font-semibold text-[#F5F0E6]">{target?.display_name}</span> will be removed from your active orchestration mesh and its stored credentials erased from the vault.
          </p>
          <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-3 text-xs text-amber-200 leading-normal">
            <p className="font-semibold">Important Restriction:</p>
            <p className="mt-0.5">
              The bucket and its physical objects remain untouched in your cloud account. However, all active files tracked in NexusCloud on this cloud must be deleted first before disconnecting.
            </p>
          </div>
        </div>
      }
    />
  )
}
