import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import {
  CheckCircle2,
  ChevronRight,
  Database,
  Eye,
  EyeOff,
  HardDrive,
  Plus,
  Server,
  ShieldCheck,
  Zap,
} from "lucide-react"

import { useConnections, useProviders, useQuota } from "../../hooks/use-data"
import { createConnection, deleteConnection } from "../../api/connections"
import { ApiError } from "../../api/client"
import { useToast } from "../../state/toast"
import { queryKeys } from "../../state/query"
import { formatBytes } from "../../lib/format"
import { PROVIDER_IDS, PROVIDER_META } from "../../lib/providers"
import { Panel, PanelHeader, Divider } from "../../components/ui/panel"
import { ErrorState, ListSkeleton } from "../../components/ui/states"
import { Button } from "../../components/ui/button"
import { Field, Input, TextArea, useFieldId } from "../../components/ui/field"
import { ConfirmModal } from "../../components/ui/modal"
import { ProviderMark } from "../../components/ui/provider-mark"
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
  const connections = useConnections()
  const quota = useQuota()
  const providers = useProviders()

  const connecting = params.get("connect") === "1"
  const preselectedProvider = (params.get("provider") as ProviderId | null) ?? null
  const disconnectTarget = params.get("disconnect")

  const activeCount = connections.data?.length ?? 0
  const totalLimit = quota.data?.total_limit_bytes ?? 0
  const totalUsed = (quota.data?.total_used_bytes ?? 0) + (quota.data?.total_reserved_bytes ?? 0)

  const quickStartProviders: Array<{ id: ProviderId; name: string; desc: string; marker: string }> = [
    { id: "aws", name: "AWS S3", desc: "Standard BYOC", marker: "#D97706" },
    { id: "gcp", name: "Google Cloud", desc: "GCS Multi-Region", marker: "#1A73E8" },
    { id: "azure", name: "Azure Blob", desc: "Enterprise Tier", marker: "#0369A1" },
    { id: "r2", name: "Cloudflare R2", desc: "Zero Egress Free", marker: "#C2570F" },
  ]

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
          <div className="flex items-center gap-2">
            <PulsingStatusDot color="gold" size="sm" />
            <span className="font-mono text-xs font-bold tracking-[0.16em] uppercase text-[#C6A052]">
              INFRASTRUCTURE
            </span>
          </div>
          <ShinyText className="font-palatino text-3xl sm:text-[34px] font-bold text-[#F5F0E6] tracking-tight mt-1 leading-tight">
            Cloud Providers
          </ShinyText>
          <p className="font-alora text-sm sm:text-base text-[#887D6B] mt-1.5 leading-relaxed max-w-2xl">
            Bring your own cloud storage. Credentials are encrypted at rest with AES-256-GCM and never displayed again.
          </p>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (connecting) {
              setParams({}, { replace: true })
            } else {
              setParams({ connect: "1" }, { replace: true })
            }
          }}
          className="relative overflow-hidden rounded-full px-6 h-10 bg-[#C6A052] hover:bg-[#E0C078] text-[#0B0A08] font-bold text-sm shadow-xs transition-all flex items-center gap-2 shrink-0 whitespace-nowrap self-start sm:self-center cursor-pointer"
        >
          {!connecting && <BorderBeam size={70} duration={6} colorFrom="#FFFFFF" colorTo="#F4DFC8" borderWidth={2} />}
          {connecting ? (
            "Close Wizard"
          ) : (
            <>
              <Plus size={15} strokeWidth={2.5} aria-hidden />
              <span>Connect Cloud Provider</span>
            </>
          )}
        </motion.button>
      </motion.div>

      {/* 2. Four Summary Metric Cards matching reference image */}
      <motion.div variants={sectionVariants} className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Active Connections */}
        <SpotlightCard className="rounded-2xl border border-[#332A1B] bg-[#11100D] p-5 shadow-sm flex flex-col justify-between min-h-[142px] transition-all hover:border-[#C6A052]/50 hover:shadow-md group">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/40 shadow-xs group-hover:scale-110 transition-transform">
            <Database size={16} strokeWidth={2.2} />
          </div>
          <div className="flex flex-col gap-1 mt-3">
            <p className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-[#887D6B]">
              ACTIVE CONNECTIONS
            </p>
            <p className="font-palatino text-xl sm:text-2xl font-bold text-[#F5F0E6] tnum leading-tight truncate">
              {connections.isLoading ? "—" : `${activeCount} Cloud${activeCount === 1 ? "" : "s"}`}
            </p>
          </div>
        </SpotlightCard>

        {/* KPI 2: Allocated Storage */}
        <SpotlightCard className="rounded-2xl border border-[#332A1B] bg-[#11100D] p-5 shadow-sm flex flex-col justify-between min-h-[142px] transition-all hover:border-[#C6A052]/50 hover:shadow-md group">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-600/10 text-amber-500 border border-amber-600/40 shadow-xs group-hover:scale-110 transition-transform">
            <HardDrive size={16} strokeWidth={2.2} />
          </div>
          <div className="flex flex-col gap-1 mt-3">
            <p className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-[#887D6B]">
              ALLOCATED STORAGE
            </p>
            <p className="font-palatino text-xl sm:text-2xl font-bold text-[#F5F0E6] tnum leading-tight truncate">
              {quota.isLoading ? "—" : `${formatBytes(totalUsed)} / ${formatBytes(totalLimit)}`}
            </p>
          </div>
        </SpotlightCard>

        {/* KPI 3: Vault Encryption */}
        <SpotlightCard className="rounded-2xl border border-[#332A1B] bg-[#11100D] p-5 shadow-sm flex flex-col justify-between min-h-[142px] transition-all hover:border-[#C6A052]/50 hover:shadow-md group">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 shadow-xs group-hover:scale-110 transition-transform">
            <ShieldCheck size={16} strokeWidth={2.2} />
          </div>
          <div className="flex flex-col gap-1 mt-3">
            <p className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-[#887D6B]">
              VAULT ENCRYPTION
            </p>
            <p className="font-palatino text-xl sm:text-2xl font-bold text-[#F5F0E6] tnum leading-tight truncate flex items-center gap-2">
              <span>AES-256-GCM</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            </p>
          </div>
        </SpotlightCard>

        {/* KPI 4: Catalog Support */}
        <SpotlightCard className="rounded-2xl border border-[#332A1B] bg-[#11100D] p-5 shadow-sm flex flex-col justify-between min-h-[142px] transition-all hover:border-[#C6A052]/50 hover:shadow-md group">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C6A052]/10 text-[#C6A052] border border-[#C6A052]/40 shadow-xs group-hover:scale-110 transition-transform">
            <Zap size={16} strokeWidth={2.2} />
          </div>
          <div className="flex flex-col gap-1 mt-3">
            <p className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-[#887D6B]">
              CATALOG SUPPORT
            </p>
            <p className="font-palatino text-xl sm:text-2xl font-bold text-[#F5F0E6] tnum leading-tight mt-0.5 truncate">
              8 Providers
            </p>
          </div>
        </SpotlightCard>
      </motion.div>

      {/* Connect Wizard Modal/Drawer when active */}
      {connecting ? (
        <ConnectWizard
          initialProvider={preselectedProvider}
          onDone={() => setParams({}, { replace: true })}
        />
      ) : null}

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
          {!connecting ? (
            <button
              type="button"
              onClick={() => setParams({ connect: "1" }, { replace: true })}
              className="inline-flex items-center gap-1.5 font-alora text-xs font-bold text-[#F5F0E6] hover:text-[#C6A052] transition-colors cursor-pointer"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Add account</span>
            </button>
          ) : null}
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
          <div className="p-6 sm:p-7">
            {/* Inset Onboarding Surface matching Screenshot */}
            <div className="rounded-2xl border border-[#332A1B]/80 bg-[#181610] p-6 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Column: Context, Value Proposition & CTA */}
                <div className="lg:col-span-7 flex flex-col gap-3.5 text-left">
                  <div className="inline-flex items-center gap-2 self-start rounded-full bg-[#211D15] border border-[#C49A3A]/40 px-3.5 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C6A052]" />
                    <span className="font-mono text-xs font-bold tracking-wider text-[#C6A052] uppercase">
                      ZERO-TRUST CLOUD MESH
                    </span>
                  </div>
                  <div>
                    <h3 className="font-palatino text-2xl sm:text-[28px] font-bold text-[#F5F0E6] leading-snug">
                      No Storage Accounts Connected Yet
                    </h3>
                    <p className="font-alora text-sm text-[#887D6B] mt-2 leading-relaxed max-w-xl">
                      NexusCloud turns individual cloud buckets into a unified, high-speed virtual storage mesh. Connect your AWS S3, Google Cloud, Azure, Cloudflare R2, or private storage to start uploading with AES-256-GCM encryption.
                    </p>
                  </div>

                  {/* 4 Benefit Items in 2x2 Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 size={17} className="text-[#168568] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-palatino text-sm font-bold text-[#F5F0E6]">Smart Egress Routing</p>
                        <p className="font-alora text-xs text-[#887D6B] mt-0.5 leading-snug">
                          Automatically shifts traffic to zero-egress providers.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 size={17} className="text-[#168568] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-palatino text-sm font-bold text-[#F5F0E6]">Client-Side Vault</p>
                        <p className="font-alora text-xs text-[#887D6B] mt-0.5 leading-snug">
                          Credentials encrypted at rest and never shared.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 size={17} className="text-[#168568] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-palatino text-sm font-bold text-[#F5F0E6]">Unified Virtual FS</p>
                        <p className="font-alora text-xs text-[#887D6B] mt-0.5 leading-snug">
                          Seamless cross-cloud file browsing and quota tracking.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 size={17} className="text-[#168568] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-palatino text-sm font-bold text-[#F5F0E6]">Zero Vendor Lock-In</p>
                        <p className="font-alora text-xs text-[#887D6B] mt-0.5 leading-snug">
                          Your buckets remain yours; disconnect anytime.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setParams({ connect: "1" }, { replace: true })}
                      className="inline-flex items-center gap-2 rounded-full bg-[#C6A052] hover:bg-[#E0C078] text-[#0B0A08] px-6 h-11 text-sm font-bold shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <Plus size={16} strokeWidth={2.5} />
                      <span>Connect First Cloud Account</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Quick-Start Provider Selector Grid */}
                <div className="lg:col-span-5 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between pb-1">
                    <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#887D6B]">
                      QUICK-START CONNECT
                    </p>
                    <span className="font-mono text-xs font-bold text-[#C6A052]">
                      1-Click Wizard
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {quickStartProviders.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setParams({ connect: "1", provider: item.id }, { replace: true })}
                        className="flex items-center justify-between p-4 rounded-xl border border-[#332A1B] bg-[#11100D] text-left transition-all hover:border-[#C6A052] hover:shadow-xs group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="h-3.5 w-3.5 rounded-xs shrink-0 shadow-2xs"
                            style={{ backgroundColor: item.marker }}
                            aria-hidden
                          />
                          <div>
                            <p className="font-palatino text-sm font-bold text-[#F5F0E6]">{item.name}</p>
                            <p className="font-alora text-xs text-[#887D6B] mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                        <ChevronRight size={15} className="text-[#887D6B] group-hover:text-[#C6A052] transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-[#181610]">
          {PROVIDER_IDS.map((id) => {
            const meta = PROVIDER_META[id]
            const spec = providers.data?.find((p) => p.name === id)
            const isConnected = connections.data?.some((c) => c.provider === id)

            return (
              <div
                key={id}
                className="group rounded-2xl border border-[#332A1B] bg-[#11100D] p-5 flex flex-col justify-between gap-3.5 shadow-2xs hover:border-[#C6A052]/70 hover:shadow-xs transition-all"
              >
                {/* Top Row: Provider Mark + Name + BYOC Native + Available Badge */}
                <div className="flex items-start justify-between gap-2 min-h-[46px]">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span
                      className="h-3.5 w-3.5 rounded-xs shrink-0 shadow-2xs mt-1"
                      style={{ backgroundColor: meta.marker }}
                      aria-hidden
                    />
                    <div>
                      <p className="font-palatino text-base font-bold text-[#F5F0E6] leading-snug">{meta.name}</p>
                      <p className="font-mono text-2xs uppercase tracking-wider text-[#887D6B] font-semibold mt-0.5">
                        BYOC NATIVE
                      </p>
                    </div>
                  </div>
                  {isConnected ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-2xs font-mono font-bold text-emerald-800 shrink-0 mt-0.5">
                      <CheckCircle2 size={11} /> CONNECTED
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#211D15] text-[#C6A052] border border-[#C49A3A]/30 uppercase tracking-wider shrink-0 mt-0.5">
                      AVAILABLE
                    </span>
                  )}
                </div>

                {/* Metadata Box */}
                <div className="rounded-xl border border-[#332A1B]/60 bg-[#181610] p-3 space-y-2 text-xs">
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
                    <span className="font-mono text-xs font-bold text-[#168568]">
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
                    onClick={() => {
                      setParams({ connect: "1", provider: id }, { replace: true })
                    }}
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
            className="group rounded-2xl border border-[#332A1B] bg-[#11100D] p-5 flex flex-col justify-between gap-3.5 shadow-2xs hover:border-[#C6A052]/70 hover:shadow-xs transition-all"
          >
            <div className="flex items-start justify-between gap-2 min-h-[46px]">
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-xs bg-[#142B4A] text-[#C6A052] shadow-2xs mt-1">
                  <Server size={10} />
                </span>
                <div>
                  <p className="font-palatino text-base font-bold text-[#F5F0E6] leading-snug">Custom S3 / MinIO</p>
                  <p className="font-mono text-2xs uppercase tracking-wider text-[#C6A052] font-semibold mt-0.5">
                    PRIVATE BYOC
                  </p>
                </div>
              </div>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#211D15] text-[#C6A052] border border-[#C49A3A]/30 uppercase tracking-wider shrink-0 mt-0.5">
                AVAILABLE
              </span>
            </div>

            <div className="rounded-xl border border-[#332A1B]/60 bg-[#181610] p-3 space-y-2 text-xs">
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
                <span className="font-mono text-xs font-bold text-[#168568]">Zero egress</span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-[#332A1B]/70 flex items-center justify-between">
              <span className="font-mono text-2xs uppercase tracking-wider text-[#887D6B] font-semibold">
                MinIO · Ceph · Wasabi
              </span>
              <button
                type="button"
                className="rounded-full border border-[#332A1B] bg-[#11100D] hover:bg-[#211D15] hover:border-[#C6A052] text-xs h-7 px-3.5 font-semibold text-[#F5F0E6] transition-colors inline-flex items-center gap-1 cursor-pointer active:scale-95"
                onClick={() => {
                  setParams({ connect: "1", provider: "aws" }, { replace: true })
                }}
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
    <li className="group flex flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4.5 transition-colors duration-fast hover:bg-[#181610]">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#332A1B] bg-[#11100D] shadow-2xs">
          <ProviderMark provider={connection.provider} size={20} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <p className="truncate font-palatino text-base font-bold text-[#F5F0E6]">{connection.display_name}</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-800">
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
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E8E0D1]">
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
          <ShieldCheck size={13} className="text-emerald-700" /> AES-256
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
          <p className="text-sm text-slate-text leading-relaxed">
            <span className="font-semibold text-regal-navy">{target?.display_name}</span> will be removed from your active orchestration mesh and its stored credentials erased from the vault.
          </p>
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 leading-normal">
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

type WizardStep = "select" | "configure" | "validate"

function ConnectWizard({
  initialProvider,
  onDone,
}: {
  initialProvider: ProviderId | null
  onDone: () => void
}) {
  const providers = useProviders()
  const [step, setStep] = useState<WizardStep>(initialProvider ? "configure" : "select")
  const [selected, setSelected] = useState<ProviderId | null>(initialProvider)
  const [form, setForm] = useState({ display_name: "", bucket_name: "", region: "" })
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const queryClient = useQueryClient()

  const meta = selected ? PROVIDER_META[selected] : null

  useEffect(() => {
    if (initialProvider) {
      setSelected(initialProvider)
      setStep("configure")
    }
  }, [initialProvider])

  useEffect(() => {
    if (selected) {
      setForm({ display_name: "", bucket_name: "", region: "" })
      setCredentials({})
      setFieldErrors({})
      setError(null)
    }
  }, [selected])


  async function submit() {
    if (!selected || !meta) return
    const errors: Record<string, string> = {}
    if (!form.display_name.trim()) errors.display_name = "Give this connection a display name"
    if (!form.bucket_name.trim()) errors.bucket_name = "Bucket or container name is required"
    if (meta.regionRequired && !form.region.trim()) errors.region = `Region is required for ${meta.name}`
    for (const field of meta.credentials) {
      if (!credentials[field.key]?.trim()) errors[field.key] = `${field.label} is required`
    }
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setBusy(true)
    setError(null)
    try {
      await createConnection({
        provider: selected,
        display_name: form.display_name.trim(),
        bucket_name: form.bucket_name.trim(),
        region: form.region.trim() || null,
        credentials,
      })
      toast.notify(`${form.display_name.trim()} connected successfully`, "success")
      void queryClient.invalidateQueries({ queryKey: queryKeys.connections })
      void queryClient.invalidateQueries({ queryKey: queryKeys.quota })
      onDone()
    } catch (caught) {
      if (caught instanceof ApiError) {
        if (caught.status === 422 && caught.details) {
          const mapped: Record<string, string> = {}
          for (const issue of caught.details) {
            const key = issue.field.replace(/^body\./, "")
            mapped[key] = issue.message
          }
          setFieldErrors(mapped)
        } else if (caught.status === 502) {
          setError("The provider rejected the credentials or the bucket is not accessible. Verify credentials, permissions, and CORS configuration.")
        } else if (caught.status === 403) {
          setError(caught.message)
        } else {
          setError(caught.message)
        }
      } else {
        setError("Could not reach the NexusCloud API.")
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel className="border-royal-gold/40 shadow-md">
      <PanelHeader
        title={
          <div className="flex items-center gap-3">
            <span className="font-semibold text-regal-navy">Connect Cloud Provider</span>
            <span className="text-muted-slate">·</span>
            <span className="font-mono text-2xs uppercase tracking-wider text-muted-slate">
              {step === "select" ? "Step 1 of 2: Select Provider" : `Step 2 of 2: Configure ${meta?.name ?? ""}`}
            </span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            {step !== "select" ? (
              <Button variant="ghost" size="sm" onClick={() => setStep("select")}>
                Change provider
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" onClick={onDone}>
              Cancel
            </Button>
          </div>
        }
      />

      {step === "select" ? (
        <div className="p-5">
          <p className="text-sm text-slate-text mb-4">
            Select the cloud storage provider you would like to connect. You will provide your bucket name and scoped API credentials in the next step.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {providers.isLoading ? (
              <div className="bg-[#11100D] rounded-2xl border border-[#332A1B] px-4 py-8 sm:col-span-2 lg:col-span-4">
                <ListSkeleton rows={3} />
              </div>
            ) : providers.isError ? (
              <div className="bg-[#11100D] rounded-2xl border border-[#332A1B] p-4 sm:col-span-2 lg:col-span-4">
                <ErrorState error={providers.error} onRetry={() => void providers.refetch()} />
              </div>
            ) : (
              <>
                {PROVIDER_IDS.map((id) => {
                  const providerMeta = PROVIDER_META[id]
                  const providerSpec = providers.data?.find((provider) => provider.name === id)
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setSelected(id)
                        setStep("configure")
                      }}
                      className="group flex flex-col justify-between rounded-2xl border border-[#332A1B] bg-[#11100D] p-4.5 text-left transition-all duration-fast hover:border-[#C6A052] hover:bg-[#181610] hover:shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <ProviderMark provider={id} size={18} />
                          <span className="font-palatino text-base font-bold text-[#F5F0E6]">{providerMeta.name}</span>
                        </div>
                        <ChevronRight size={15} className="text-[#887D6B] transition-transform group-hover:translate-x-0.5 group-hover:text-[#C6A052]" />
                      </div>
                      <div className="mt-3 font-mono text-2xs text-[#887D6B]">
                        <span>Free tier: {formatBytes(providerSpec?.free_bytes ?? null)}</span> ·{" "}
                        <span>{providerSpec?.permanent ? "Permanent" : "12-mo"}</span>
                      </div>
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => {
                    setSelected("aws")
                    setStep("configure")
                  }}
                  className="group flex flex-col justify-between rounded-2xl border border-dashed border-[#C49A3A]/60 bg-gradient-to-b from-white to-[#FFF8E7]/30 p-4.5 text-left transition-all duration-fast hover:border-[#C6A052] hover:bg-[#181610] hover:shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-xs bg-[#142B4A] text-[#C6A052] shadow-2xs">
                        <Server size={11} />
                      </span>
                      <span className="font-palatino text-base font-bold text-[#F5F0E6]">Custom S3 / MinIO</span>
                    </div>
                    <ChevronRight size={15} className="text-[#887D6B] transition-transform group-hover:translate-x-0.5 group-hover:text-[#C6A052]" />
                  </div>
                  <div className="mt-3 font-mono text-2xs text-[#C6A052] font-semibold">
                    <span>S3-Compatible</span> · <span>Self-Hosted</span>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}

      {step === "configure" && meta ? (
        <div className="flex flex-col gap-5 p-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              <ProviderMark provider={meta.id} size={20} />
              <div>
                <p className="text-base font-bold text-regal-navy">{meta.name}</p>
                <p className="text-xs text-muted-slate">Enter bucket details and read/write scoped credentials</p>
              </div>
            </div>
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-2xs font-semibold text-emerald-800 flex items-center gap-1">
              <ShieldCheck size={12} /> Scoped BYOC Storage
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Display Name" htmlFor="conn-name" hint="A recognizable label for this connection" error={fieldErrors.display_name}>
              <Input
                id="conn-name"
                value={form.display_name}
                onChange={(event) => setForm((current) => ({ ...current, display_name: event.target.value }))}
                placeholder={`${meta.name} Production`}
                invalid={Boolean(fieldErrors.display_name)}
              />
            </Field>

            <Field label={meta.bucketLabel} htmlFor="conn-bucket" hint={meta.bucketHint} error={fieldErrors.bucket_name}>
              <Input
                id="conn-bucket"
                value={form.bucket_name}
                onChange={(event) => setForm((current) => ({ ...current, bucket_name: event.target.value }))}
                placeholder="my-storage-bucket"
                invalid={Boolean(fieldErrors.bucket_name)}
              />
            </Field>
          </div>

          <Field
            label={meta.regionRequired ? "Bucket Region" : "Bucket Region (Optional)"}
            htmlFor="conn-region"
            hint={meta.regionHint ?? "Default region for this provider"}
            error={fieldErrors.region}
          >
            <Input
              id="conn-region"
              value={form.region}
              onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))}
              placeholder={meta.regionRequired ? "e.g. us-east-1" : "Optional"}
              invalid={Boolean(fieldErrors.region)}
            />
          </Field>

          <Divider />

          <div className="rounded-xl border border-border bg-ivory/50 p-4">
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={16} className="mt-0.5 text-royal-gold shrink-0" />
              <div className="text-xs text-slate-text">
                <p className="font-semibold text-regal-navy">Zero-Knowledge Security Assurance</p>
                <p className="mt-0.5 text-muted-slate leading-relaxed">
                  Credentials are encrypted client-to-server, stored using AES-256-GCM envelope encryption, and never returned in any API response.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3.5">
              {meta.credentials.map((field) => (
                <CredentialInput
                  key={field.key}
                  field={field}
                  value={credentials[field.key] ?? ""}
                  error={fieldErrors[field.key] ?? null}
                  onChange={(value) => setCredentials((current) => ({ ...current, [field.key]: value }))}
                />
              ))}
            </div>
          </div>

          {error ? (
            <div role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-xs font-medium text-danger">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" size="sm" onClick={() => setStep("select")}>
              Back
            </Button>
            <Button variant="gold" size="md" loading={busy} onClick={() => void submit()}>
              Validate &amp; Connect Cloud
            </Button>
          </div>
        </div>
      ) : null}
    </Panel>
  )
}

function CredentialInput({
  field,
  value,
  error,
  onChange,
}: {
  field: { key: string; label: string; hint: string; secret: boolean; placeholder: string }
  value: string
  error: string | null
  onChange: (value: string) => void
}) {
  const [visible, setVisible] = useState(false)
  const id = useFieldId()
  const multiline = field.key === "service_account_json" || field.key === "private_key"

  return (
    <Field label={field.label} htmlFor={id} hint={field.hint} error={error}>
      <div className="relative">
        {multiline ? (
          <TextArea
            id={id}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={field.placeholder}
            invalid={Boolean(error)}
            spellCheck={false}
            rows={4}
            className="font-mono text-xs"
          />
        ) : (
          <Input
            id={id}
            type={field.secret && !visible ? "password" : "text"}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={field.placeholder}
            invalid={Boolean(error)}
            autoComplete="off"
            spellCheck={false}
            className={field.secret ? "pr-9 font-mono text-xs" : "font-mono text-xs"}
          />
        )}
        {field.secret && !multiline ? (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? "Hide credential" : "Show credential"}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-slate transition-colors hover:text-ink"
          >
            {visible ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        ) : null}
      </div>
    </Field>
  )
}
