import { Link } from "react-router-dom"
import {
  Activity,
  Check,
  ChevronDown,
  ChevronRight,
  Cloud,
  Download,
  FileText,
  Folder,
  HardDrive,
  Layers,
  List,
  Lock,
  MoreVertical,
  PieChart,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Zap,
} from "lucide-react"
import { motion, type Variants } from "framer-motion"

import { OrbitingCloudHero } from "../../components/overview/OrbitingCloudHero"
import { ProviderIcon, ProviderBadge } from "../../components/ui/cloud-logos"
import { cn } from "../../lib/utils"
import {
  SpotlightCard,
  BorderBeam,
  ShinyText,
  PulsingStatusDot,
  GridBeams,
} from "../../components/ui/effects"
import { useOverviewData } from "./use-overview-data"

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
      duration: 0.38,
      ease: [0.16, 1, 0.3, 1],
    },
  },
}

export function OverviewDark() {
  const {
    navigate,
    audit,
    objectFilter,
    setObjectFilter,
    providerFilter,
    setProviderFilter,
    storageModeFilter,
    setStorageModeFilter,
    fileTypeFilter,
    setFileTypeFilter,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    hoveredDistributionId,
    setHoveredDistributionId,
    selectedItemId,
    setSelectedItemId,
    activeTab,
    setActiveTab,
    downloadingId,
    filteredItems,
    selectedItem,
    handleDownload,
    totalStoredFormatted,
    usableCapacityFormatted,
    connectedCloudsCount,
    activeRoutingCount,
    activeDistributionItem,
    STORAGE_DISTRIBUTION,
  } = useOverviewData()

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="overview-dark-page flex flex-col gap-3.5 sm:gap-4 pb-6 font-alora text-[#F5F0E6] bg-[#0B0A08]"
    >
      {/* ── 1. DARK HERO CONTROL PLANE ── */}
      <motion.section
        variants={sectionVariants}
        className="relative overflow-hidden rounded-2xl border border-[#3A2E1E] bg-gradient-to-br from-[#1A1610] via-[#12100C] to-[#0A0907] p-5 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(224,192,120,0.12)]"
      >
        <GridBeams variant="dark" />
        {/* Ambient warm champagne radial glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[680px] h-[340px] pointer-events-none rounded-full blur-3xl opacity-40"
          style={{
            background: "radial-gradient(ellipse at center, rgba(198,160,82,0.22) 0%, rgba(128,97,44,0.10) 45%, transparent 70%)"
          }}
        />

        <div className="relative z-1 grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
          {/* Left: Hero Copy and Actions */}
          <div className="flex flex-col justify-between lg:col-span-5 space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#C6A052]/40 bg-[#211D15] px-3 py-1 text-[10px] font-mono font-bold tracking-wider uppercase text-[#C6A052] mb-3 shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C6A052] animate-pulse" />
                NexusCloud Command Hub
              </div>
              <h1 className="font-palatino text-2xl sm:text-3xl lg:text-[27px] font-bold tracking-tight text-[#F5F0E6] leading-tight mb-2.5">
                Your Cloud Workspace, <ShinyText>Orchestrated.</ShinyText>
              </h1>
              <p className="font-alora text-xs sm:text-[13px] text-[#B8AE9B] leading-relaxed mb-5 max-w-lg">
                Unify, manage, and orchestrate multi-cloud storage across all providers. Automate placement, slash egress fees, and monitor capacity in one control plane.
              </p>

              {/* Action Buttons in Dark Theme */}
              <div className="flex flex-wrap items-center gap-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/app/clouds?connect=1")}
                  className="relative overflow-hidden inline-flex h-9 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#C6A052] to-[#E0C078] px-5 text-xs font-bold text-[#0B0A08] shadow-[0_2px_16px_rgba(198,160,82,0.4)] transition-all hover:brightness-110 font-alora cursor-pointer"
                >
                  <BorderBeam size={60} duration={8} colorFrom="#FFFDF8" colorTo="transparent" />
                  <Plus size={14} className="text-[#0B0A08]" strokeWidth={2.5} />
                  <span>Connect Cloud Provider</span>
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/app/router")}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-[#3A2E1E] bg-[#1E1912] px-5 text-xs font-semibold text-[#F5F0E6] shadow-xs transition-all hover:border-[#C6A052] hover:bg-[#2A2218] font-alora cursor-pointer"
                >
                  <Settings size={14} className="text-[#C6A052]" />
                  <span>Explore Smart Router</span>
                </motion.button>
              </div>
            </div>

            {/* 4 Feature Highlights in Dark Mode */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#332A1B]/80">
              <div className="flex items-center gap-2.5 min-w-0 group cursor-default">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-[#251F16] to-[#18140E] border border-[#3A2E1E] text-[#C6A052] group-hover:scale-105 group-hover:border-[#C6A052]/60 transition-all shadow-2xs">
                  <Cloud size={13} />
                </div>
                <div className="min-w-0">
                  <p className="font-alora text-xs font-bold text-[#F5F0E6] leading-tight truncate">Multi-Cloud</p>
                  <p className="font-alora text-[10px] text-[#887D6B] leading-tight mt-0.5 truncate">Single storage pool</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 min-w-0 group cursor-default">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-[#251F16] to-[#18140E] border border-[#3A2E1E] text-[#C6A052] group-hover:scale-105 group-hover:border-[#C6A052]/60 transition-all shadow-2xs">
                  <Zap size={13} />
                </div>
                <div className="min-w-0">
                  <p className="font-alora text-xs font-bold text-[#F5F0E6] leading-tight truncate">Smart Placement</p>
                  <p className="font-alora text-[10px] text-[#887D6B] leading-tight mt-0.5 truncate">AI routing</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 min-w-0 group cursor-default">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-[#251F16] to-[#18140E] border border-[#3A2E1E] text-[#C6A052] group-hover:scale-105 group-hover:border-[#C6A052]/60 transition-all shadow-2xs">
                  <Lock size={13} />
                </div>
                <div className="min-w-0">
                  <p className="font-alora text-xs font-bold text-[#F5F0E6] leading-tight truncate">Zero Lock-in</p>
                  <p className="font-alora text-[10px] text-[#887D6B] leading-tight mt-0.5 truncate">Your credentials</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 min-w-0 group cursor-default">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-[#251F16] to-[#18140E] border border-[#3A2E1E] text-[#C6A052] group-hover:scale-105 group-hover:border-[#C6A052]/60 transition-all shadow-2xs">
                  <ShieldCheck size={13} />
                </div>
                <div className="min-w-0">
                  <p className="font-alora text-xs font-bold text-[#F5F0E6] leading-tight truncate">Enterprise</p>
                  <p className="font-alora text-[10px] text-[#887D6B] leading-tight mt-0.5 truncate">AES-256 encrypted</p>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Interactive Orbiting Multi-Cloud Hero */}
          <div className="flex items-center justify-center lg:col-span-4 py-1">
            <OrbitingCloudHero />
          </div>

          {/* Right: Multi-Cloud Summary Box in Dark Theme */}
          <SpotlightCard className="flex flex-col justify-between rounded-xl border border-[#3A2E1E] bg-gradient-to-b from-[#1C1812] to-[#12100C] p-4 sm:p-4.5 shadow-[0_6px_24px_rgba(0,0,0,0.45)] lg:col-span-3 min-h-[224px] hover:border-[#C6A052]/50 transition-all">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#251F16] border border-[#C6A052]/40 text-[#C6A052] shadow-2xs">
                  <Plus size={12} />
                </div>
                <h3 className="font-palatino font-bold text-sm text-[#F5F0E6]">
                  Multi-Cloud Mesh
                </h3>
              </div>

              <ul className="space-y-2.5 text-xs text-[#B8AE9B] font-alora leading-normal">
                <li className="flex items-start gap-2">
                  <Check size={13} className="text-[#2EC496] shrink-0 mt-0.5" />
                  <span>Single storage pool across providers</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={13} className="text-[#2EC496] shrink-0 mt-0.5" />
                  <span>Zero lock-in, intelligent routing</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={13} className="text-[#2EC496] shrink-0 mt-0.5" />
                  <span>Secure &amp; encrypted by default</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={13} className="text-[#2EC496] shrink-0 mt-0.5" />
                  <span>Presigned direct transfers (0 egress)</span>
                </li>
              </ul>
            </div>

            <div className="pt-3 mt-3 border-t border-[#332A1B] flex items-center justify-between text-xs">
              <span className="font-mono uppercase tracking-wider text-[#C6A052] text-[10px] font-bold">Active Mesh</span>
              <span className="flex items-center gap-1.5 text-[#2EC496] font-medium font-alora text-[11px]">
                <PulsingStatusDot color="emerald" /> 100% Operational
              </span>
            </div>
          </SpotlightCard>
        </div>
      </motion.section>

      {/* ── 2. FOUR DARK KPI CARDS ── */}
      <motion.section variants={sectionVariants} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: TOTAL STORED DATA */}
        <SpotlightCard className="flex flex-col justify-between rounded-xl border border-[#332A1B] bg-[#11100D] p-3.5 shadow-sm hover:border-[#C6A052]/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md min-h-[126px]">
          <div className="flex items-center justify-between">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#211D15] border border-[#332A1B] text-[#C6A052]">
              <HardDrive size={13} />
            </div>
            <span className="flex items-center gap-0.5 rounded-full border border-[#2EC496]/40 bg-[#2EC496]/15 px-2 py-0.5 text-[10px] font-bold text-[#2EC496] font-alora">
              ↑ 12%
            </span>
          </div>

          <div className="flex items-end justify-between mt-2.5 gap-2">
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold tracking-wider uppercase text-[#887D6B]">
                TOTAL STORED DATA
              </p>
              <p className="font-palatino font-bold text-xl sm:text-[22px] text-[#F5F0E6] tracking-tight mt-0.5">
                {totalStoredFormatted}
              </p>
              <p className="font-alora text-[11px] text-[#887D6B] mt-0.5 truncate">Across connected clouds</p>
            </div>

            {/* Donut Gauge with Obsidian Track */}
            <div className="flex flex-col items-center shrink-0">
              <div className="relative h-10 w-10">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#332A1B"
                    strokeWidth="3.4"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#C6A052"
                    strokeWidth="3.4"
                    strokeDasharray="68, 100"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-palatino font-bold text-[10px] text-[#F5F0E6]">
                  68%
                </div>
              </div>
            </div>
          </div>
        </SpotlightCard>

        {/* KPI 2: USABLE CAPACITY */}
        <SpotlightCard className="flex flex-col justify-between rounded-xl border border-[#332A1B] bg-[#11100D] p-3.5 shadow-sm hover:border-[#C6A052]/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md min-h-[126px]">
          <div className="flex items-center justify-between">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#211D15] border border-[#332A1B] text-[#C6A052]">
              <Layers size={13} />
            </div>
            <span className="font-alora text-[10px] font-semibold text-[#C6A052] bg-[#C6A052]/15 border border-[#C6A052]/35 px-2 py-0.5 rounded-full">
              Free Tier Pool
            </span>
          </div>

          <div className="flex items-end justify-between mt-2.5 gap-2">
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold tracking-wider uppercase text-[#887D6B]">
                USABLE CAPACITY
              </p>
              <p className="font-palatino font-bold text-xl sm:text-[22px] text-[#F5F0E6] tracking-tight mt-0.5">
                {usableCapacityFormatted}
              </p>
              <p className="font-alora text-[11px] text-[#887D6B] mt-0.5 truncate">Zero-egress pool</p>
            </div>

            <div className="flex items-end gap-1 h-8 shrink-0 pb-0.5">
              <span className="w-1.5 rounded-t-xs bg-[#C6A052]/30 h-[8px]" />
              <span className="w-1.5 rounded-t-xs bg-[#C6A052]/50 h-[14px]" />
              <span className="w-1.5 rounded-t-xs bg-[#C6A052]/70 h-[20px]" />
              <span className="w-1.5 rounded-t-xs bg-[#C6A052] h-[26px]" />
              <span className="w-1.5 rounded-t-xs bg-[#E0C078] h-[32px]" />
            </div>
          </div>
        </SpotlightCard>

        {/* KPI 3: CONNECTED CLOUDS */}
        <SpotlightCard className="flex flex-col justify-between rounded-xl border border-[#332A1B] bg-[#11100D] p-3.5 shadow-sm hover:border-[#C6A052]/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md min-h-[126px]">
          <div className="flex items-center justify-between">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#211D15] border border-[#332A1B] text-[#C6A052]">
              <Cloud size={13} />
            </div>
            <Link
              to="/app/clouds"
              title="Manage Cloud Providers"
              className="flex h-5 w-5 items-center justify-center rounded-full text-[#887D6B] hover:text-[#F5F0E6] hover:bg-[#211D15] transition-colors"
            >
              <ChevronRight size={13} />
            </Link>
          </div>

          <div className="flex items-end justify-between mt-2.5 gap-2">
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold tracking-wider uppercase text-[#887D6B]">
                CONNECTED CLOUDS
              </p>
              <p className="font-palatino font-bold text-xl sm:text-[22px] text-[#F5F0E6] tracking-tight mt-0.5">
                {connectedCloudsCount}
              </p>
              <p className="font-alora text-[11px] text-[#887D6B] mt-0.5 truncate">Active and healthy</p>
            </div>

            <div className="flex items-center -space-x-1.5 shrink-0 pb-0.5">
              <div
                title="AWS S3 Connected"
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#11100D] bg-[#181610] shadow-sm ring-1 ring-[#3A2E1E] hover:scale-115 hover:z-10 transition-all cursor-default"
              >
                <ProviderIcon provider="aws" size={15} />
              </div>
              <div
                title="Google Cloud Connected"
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#11100D] bg-[#181610] shadow-sm ring-1 ring-[#3A2E1E] hover:scale-115 hover:z-10 transition-all cursor-default"
              >
                <ProviderIcon provider="gcp" size={15} />
              </div>
              <div
                title="Microsoft Azure Connected"
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#11100D] bg-[#181610] shadow-sm ring-1 ring-[#3A2E1E] hover:scale-115 hover:z-10 transition-all cursor-default"
              >
                <ProviderIcon provider="azure" size={15} />
              </div>
            </div>
          </div>
        </SpotlightCard>

        {/* KPI 4: ACTIVE ROUTING */}
        <SpotlightCard className="flex flex-col justify-between rounded-xl border border-[#332A1B] bg-[#11100D] p-3.5 shadow-sm hover:border-[#C6A052]/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md min-h-[126px]">
          <div className="flex items-center justify-between">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#211D15] border border-[#332A1B] text-[#C6A052]">
              <Zap size={13} />
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-[#2EC496]/40 bg-[#2EC496]/15 px-2 py-0.5 text-[10px] font-semibold text-[#2EC496] font-alora">
              <PulsingStatusDot color="emerald" />
              Live Mesh
            </span>
          </div>

          <div className="flex items-end justify-between mt-2.5 gap-2">
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold tracking-wider uppercase text-[#887D6B]">
                ACTIVE ROUTING
              </p>
              <p className="font-palatino font-bold text-xl sm:text-[22px] text-[#F5F0E6] tracking-tight mt-0.5">
                {activeRoutingCount}
              </p>
              <p className="font-alora text-[11px] text-[#887D6B] mt-0.5 truncate">Smart placement on</p>
            </div>

            <div className="h-7 w-18 shrink-0 pb-0.5">
              <svg viewBox="0 0 100 40" className="h-full w-full overflow-visible">
                <path
                  d="M0 32 L25 24 L50 28 L75 12 L100 6"
                  fill="none"
                  stroke="#C6A052"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="0" cy="32" r="2" fill="#C6A052" />
                <circle cx="25" cy="24" r="2" fill="#C6A052" />
                <circle cx="50" cy="28" r="2" fill="#C6A052" />
                <circle cx="75" cy="12" r="2" fill="#C6A052" />
                <circle cx="100" cy="6" r="2.8" fill="#E0C078" />
              </svg>
            </div>
          </div>
        </SpotlightCard>
      </motion.section>

      {/* ── 3. DARK FILTER TOOLBAR ── */}
      <motion.section variants={sectionVariants} className="flex flex-wrap items-center justify-between gap-2.5 font-alora">
        <div className="flex flex-wrap items-center gap-2">
          {/* Object Type Capsule with Sliding Active Pill */}
          <div className="inline-flex h-8 items-center rounded-lg border border-[#332A1B] bg-[#11100D] p-0.5 shadow-xs relative">
            {(
              [
                { id: "all", label: "All Objects" },
                { id: "files", label: "Files" },
                { id: "folders", label: "Folders" },
              ] as const
            ).map((tab) => {
              const isActive = objectFilter === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setObjectFilter(tab.id)}
                  className={cn(
                    "relative h-full flex items-center rounded-md px-2.5 text-xs font-semibold transition-colors cursor-pointer",
                    isActive ? "text-[#0B0A08] font-bold" : "text-[#887D6B] hover:text-[#F5F0E6]"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeFilterPillDark"
                      className="absolute inset-0 rounded-md bg-[#C6A052] shadow-xs"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span className="relative z-1">{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Provider Select Dropdown */}
          <div className="relative">
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="inline-flex h-8 appearance-none items-center rounded-lg border border-[#332A1B] bg-[#11100D] pl-2.5 pr-7 text-xs font-medium text-[#F5F0E6] hover:border-[#C6A052] focus:outline-none cursor-pointer shadow-xs font-alora transition-colors"
            >
              <option value="all">All Providers</option>
              <option value="aws">AWS S3</option>
              <option value="gcp">Google Cloud</option>
              <option value="azure">Azure Blob</option>
              <option value="oracle">Oracle Cloud</option>
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#887D6B]" />
          </div>

          {/* Storage Mode Dropdown */}
          <div className="relative">
            <select
              value={storageModeFilter}
              onChange={(e) => setStorageModeFilter(e.target.value)}
              className="inline-flex h-8 appearance-none items-center rounded-lg border border-[#332A1B] bg-[#11100D] pl-2.5 pr-7 text-xs font-medium text-[#F5F0E6] hover:border-[#C6A052] focus:outline-none cursor-pointer shadow-xs font-alora transition-colors"
            >
              <option value="all">All Storage Modes</option>
              <option value="Standard">Standard Tier</option>
              <option value="Cool">Cool Tier</option>
              <option value="Archive">Archive Tier</option>
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#887D6B]" />
          </div>

          {/* File Types Dropdown */}
          <div className="relative">
            <select
              value={fileTypeFilter}
              onChange={(e) => setFileTypeFilter(e.target.value)}
              className="inline-flex h-8 appearance-none items-center rounded-lg border border-[#332A1B] bg-[#11100D] pl-2.5 pr-7 text-xs font-medium text-[#F5F0E6] hover:border-[#C6A052] focus:outline-none cursor-pointer shadow-xs font-alora transition-colors"
            >
              <option value="all">All File Types</option>
              <option value="pdf">PDF Documents</option>
              <option value="csv">CSV Datasets</option>
              <option value="zip">ZIP Archives</option>
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#887D6B]" />
          </div>
        </div>

        {/* Right Toolbar Controls in Dark */}
        <div className="flex items-center gap-2">
          <div className="relative w-44 sm:w-52 lg:w-60">
            <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#887D6B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files…"
              className="h-8 w-full rounded-lg border border-[#332A1B] bg-[#11100D] pl-8 pr-2.5 text-xs text-[#F5F0E6] placeholder:text-[#887D6B] focus:border-[#C6A052] focus:outline-none shadow-xs font-alora transition-colors"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "border-[#C6A052] bg-[#C6A052] text-[#0B0A08]"
                  : "border-[#332A1B] bg-[#11100D] text-[#887D6B] hover:bg-[#211D15]"
              }`}
              title="List view"
            >
              <List size={13} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "border-[#C6A052] bg-[#C6A052] text-[#0B0A08]"
                  : "border-[#332A1B] bg-[#11100D] text-[#887D6B] hover:bg-[#211D15]"
              }`}
              title="Grid view"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                <rect x="2" y="2" width="5" height="5" rx="1" />
                <rect x="9" y="2" width="5" height="5" rx="1" />
                <rect x="2" y="9" width="5" height="5" rx="1" />
                <rect x="9" y="9" width="5" height="5" rx="1" />
              </svg>
            </button>
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "size")}
              className="inline-flex h-8 appearance-none items-center rounded-lg border border-[#332A1B] bg-[#11100D] pl-2.5 pr-6 text-xs font-medium text-[#F5F0E6] hover:border-[#C6A052] focus:outline-none cursor-pointer shadow-xs font-alora transition-colors"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="size">Size</option>
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[#887D6B]" />
          </div>
        </div>
      </motion.section>

      {/* ── 4. DARK INTEGRATED FILE WORKSPACE ── */}
      <motion.section variants={sectionVariants} className="grid grid-cols-1 gap-3.5 lg:grid-cols-12 items-start font-alora">
        {/* Left Panel: Table in Dark */}
        <div className="overflow-hidden rounded-xl border border-[#332A1B] bg-[#11100D] shadow-md lg:col-span-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#332A1B] bg-[#181610] font-mono text-[10px] font-bold tracking-wider uppercase text-[#887D6B]">
                <tr>
                  <th className="py-2.5 pl-3 pr-2 w-8">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      className="rounded-xs border-[#332A1B] bg-[#11100D] text-[#C6A052] focus:ring-[#C6A052]"
                    />
                  </th>
                  <th className="py-2.5 px-3 font-bold text-[#F5F0E6]">Name</th>
                  <th className="py-2.5 px-3 font-bold text-[#F5F0E6]">Provider</th>
                  <th className="py-2.5 px-3 font-bold text-[#F5F0E6]">Storage Mode</th>
                  <th className="py-2.5 px-3 font-bold text-right text-[#F5F0E6]">Size</th>
                  <th className="py-2.5 px-3 font-bold text-[#F5F0E6]">Last Modified</th>
                  <th className="py-2.5 pr-3 pl-1 w-8 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#332A1B] font-alora">
                {filteredItems.map((item) => {
                  const isSelected = selectedItemId === item.id

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItemId((prev) => (prev === item.id ? null : item.id))}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#211D15] font-semibold text-[#F5F0E6]"
                          : "hover:bg-[#181610] text-[#B8AE9B]"
                      }`}
                    >
                      <td className="py-2.5 pl-3 pr-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => setSelectedItemId((prev) => (prev === item.id ? null : item.id))}
                          aria-label={`Select ${item.name}`}
                          className="rounded-xs border-[#332A1B] bg-[#11100D] text-[#C6A052] focus:ring-[#C6A052]"
                        />
                      </td>

                      <td className="py-2.5 px-3 min-w-[160px]">
                        <div className="flex items-center gap-2">
                          {item.type === "folder" ? (
                            <Folder size={14} className="text-[#C6A052] shrink-0 fill-[#C6A052]/20" />
                          ) : (
                            <FileText size={14} className="text-[#887D6B] shrink-0" />
                          )}
                          <span className="font-palatino font-bold text-xs sm:text-[13px] text-[#F5F0E6] truncate max-w-[200px]">
                            {item.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <ProviderBadge provider={item.provider} />
                      </td>

                      <td className="py-2.5 px-3">
                        {item.storageMode === "Standard" && (
                          <span className="inline-flex items-center rounded-sm border border-[#332A1B] bg-[#211D15] px-1.5 py-0.5 text-[10px] font-mono font-semibold text-[#F5F0E6]">
                            Standard
                          </span>
                        )}
                        {item.storageMode === "Cool" && (
                          <span className="inline-flex items-center rounded-sm border border-teal-500/30 bg-teal-500/15 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-teal-300">
                            Cool
                          </span>
                        )}
                        {item.storageMode === "Archive" && (
                          <span className="inline-flex items-center rounded-sm border border-purple-500/30 bg-purple-500/15 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-purple-300">
                            Archive
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono text-xs font-semibold text-[#F5F0E6]">
                        {item.sizeFormatted}
                      </td>

                      <td className="py-2.5 px-3 text-[#887D6B] text-[11px] font-mono whitespace-nowrap">
                        {item.lastModified}
                      </td>

                      <td className="py-2.5 pr-3 pl-1 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            void handleDownload(item)
                          }}
                          className="text-[#887D6B] hover:text-[#F5F0E6] p-1 rounded-md hover:bg-[#211D15]"
                          title="Actions"
                        >
                          <MoreVertical size={13} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel: Dark Contextual Inspector */}
        <SpotlightCard className="flex flex-col justify-between rounded-xl border border-[#332A1B] bg-[#11100D] p-3.5 sm:p-4 shadow-md lg:col-span-4 min-h-[290px] font-alora hover:border-[#C6A052]/50 transition-colors">
          <div>
            <div className="flex items-center gap-3 border-b border-[#332A1B] pb-1.5 text-xs font-semibold relative">
              {(
                [
                  { id: "overview", label: "Overview" },
                  { id: "metadata", label: "Metadata" },
                  { id: "routing", label: "Routing" },
                  { id: "versions", label: "Versions" },
                ] as const
              ).map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "relative pb-1.5 transition-colors cursor-pointer",
                      isActive ? "font-bold text-[#C6A052]" : "text-[#887D6B] hover:text-[#F5F0E6]"
                    )}
                  >
                    <span>{tab.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeInspectorTabDark"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C6A052] rounded-full"
                        transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {selectedItem ? (
              <div className="mt-3 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#211D15] border border-[#332A1B]">
                    {selectedItem.type === "folder" ? (
                      <Folder size={16} className="text-[#C6A052]" />
                    ) : (
                      <FileText size={16} className="text-[#887D6B]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-palatino font-bold text-xs sm:text-sm text-[#F5F0E6]">{selectedItem.name}</p>
                    <p className="text-[10px] font-mono text-[#887D6B] uppercase mt-0.5">
                      {selectedItem.type} • {selectedItem.storageMode}
                    </p>
                  </div>
                </div>

                {activeTab === "overview" && (
                  <div className="space-y-1.5 rounded-lg border border-[#332A1B] bg-[#181610] p-2.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#887D6B]">Size:</span>
                      <span className="font-semibold text-[#F5F0E6]">{selectedItem.sizeFormatted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#887D6B]">Provider:</span>
                      <span className="font-semibold text-[#F5F0E6] uppercase">{selectedItem.provider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#887D6B]">Storage Mode:</span>
                      <span className="font-semibold text-[#F5F0E6]">{selectedItem.storageMode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#887D6B]">Encryption:</span>
                      <span className="font-semibold text-[#2EC496]">AES-256-GCM</span>
                    </div>
                  </div>
                )}

                {activeTab === "metadata" && (
                  <div className="space-y-1.5 rounded-lg border border-[#332A1B] bg-[#181610] p-2.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#887D6B]">MIME Type:</span>
                      <span className="truncate max-w-[130px] text-[#F5F0E6]">{selectedItem.mimeType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#887D6B]">Object ID:</span>
                      <span className="text-[#C6A052] truncate max-w-[130px]">{selectedItem.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#887D6B]">Modified:</span>
                      <span className="text-[#F5F0E6] truncate max-w-[130px]">{selectedItem.lastModified}</span>
                    </div>
                  </div>
                )}

                {activeTab === "routing" && (
                  <div className="space-y-1.5 rounded-lg border border-[#332A1B] bg-[#181610] p-2.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#887D6B]">Routing Engine:</span>
                      <span className="font-semibold text-[#F5F0E6]">Smart Placement</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#887D6B]">Egress Penalty:</span>
                      <span className="text-[#2EC496]">0% (Zero-Egress Tier)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#887D6B]">Replication:</span>
                      <span className="text-[#F5F0E6]">Single Cloud</span>
                    </div>
                  </div>
                )}

                {activeTab === "versions" && (
                  <div className="space-y-1.5 rounded-lg border border-[#332A1B] bg-[#181610] p-2.5 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#F5F0E6]">v1.0 (Current)</span>
                      <span className="text-[#2EC496] text-[10px] font-semibold">Active</span>
                    </div>
                    <p className="text-[10px] text-[#887D6B]">Committed {selectedItem.lastModified}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => void handleDownload(selectedItem)}
                  disabled={downloadingId === selectedItem.id}
                  className="w-full inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#C6A052] hover:bg-[#E0C078] text-[#0B0A08] py-1.5 text-xs font-bold shadow-xs transition-colors font-alora cursor-pointer"
                >
                  <Download size={13} className="text-[#0B0A08]" strokeWidth={2.5} />
                  {downloadingId === selectedItem.id ? "Authorizing Presigned URL..." : "Download File"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4 my-auto">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#332A1B] bg-[#181610] text-[#887D6B] mb-2">
                  <FileText size={17} />
                </div>
                <h4 className="font-palatino font-bold text-sm text-[#F5F0E6]">No object selected</h4>
                <p className="font-alora text-xs text-[#887D6B] mt-0.5 max-w-xs leading-relaxed">
                  Select a file or folder from the list to view details, metadata, and routing.
                </p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-[#332A1B] flex items-center justify-between text-xs font-alora text-[#887D6B]">
            <span className="text-[11px]">{filteredItems.length} objects</span>
            <Link to="/app/files" className="font-bold text-[#C6A052] hover:text-[#E0C078] flex items-center gap-1 text-[11px]">
              All Files <ChevronRight size={12} />
            </Link>
          </div>
        </SpotlightCard>
      </motion.section>

      {/* ── 5. THREE DARK SUPPORTING SECTIONS ── */}
      <motion.section variants={sectionVariants} className="grid grid-cols-1 gap-3 sm:gap-3.5 md:grid-cols-3 font-alora">
        {/* Storage Distribution in Dark */}
        <SpotlightCard className="flex flex-col justify-between rounded-xl border border-[#332A1B] bg-[#11100D] p-3.5 sm:p-4 shadow-sm hover:border-[#C6A052]/40 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-[#211D15] text-[#C6A052] border border-[#332A1B] shadow-xs">
                  <PieChart size={13} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="font-palatino font-bold text-xs sm:text-sm text-[#F5F0E6] tracking-tight">
                    Storage Distribution
                  </h3>
                  <p className="font-alora text-[10px] text-[#887D6B]">Data across connected clouds</p>
                </div>
              </div>
              <span className="font-mono text-[9.5px] font-bold text-[#C6A052] bg-[#C6A052]/15 border border-[#C6A052]/35 px-2 py-0.5 rounded-full shrink-0">
                5 Clouds
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 py-1">
              <div className="relative h-[96px] w-[96px] shrink-0">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#332A1B"
                    strokeWidth="6.5"
                    opacity="0.8"
                  />
                  {STORAGE_DISTRIBUTION.map((item) => {
                    const isHovered = hoveredDistributionId === item.id
                    const isAnyHovered = hoveredDistributionId !== null
                    const strokeLength = (item.percentage / 100) * 251.327
                    const strokeOffset = -((item.offset / 100) * 251.327)
                    return (
                      <circle
                        key={item.id}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke={item.color}
                        strokeWidth={isHovered ? 8.5 : 6.5}
                        strokeDasharray={`${strokeLength} 251.327`}
                        strokeDashoffset={strokeOffset}
                        opacity={isAnyHovered ? (isHovered ? 1 : 0.35) : 1}
                        className="cursor-pointer transition-all duration-200 ease-out"
                        onMouseEnter={() => setHoveredDistributionId(item.id)}
                        onMouseLeave={() => setHoveredDistributionId(null)}
                      />
                    )
                  })}
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none px-1">
                  <div className="flex items-baseline justify-center gap-0.5">
                    <span
                      className={cn(
                        "font-palatino font-bold text-[13px] tracking-tight leading-none transition-colors duration-150",
                        activeDistributionItem ? "" : "text-[#F5F0E6]"
                      )}
                      style={{ color: activeDistributionItem ? activeDistributionItem.color : undefined }}
                    >
                      {activeDistributionItem ? activeDistributionItem.size.split(" ")[0] : "248.5"}
                    </span>
                    <span
                      className={cn(
                        "font-mono text-[8.5px] font-bold uppercase transition-colors duration-150",
                        activeDistributionItem ? "" : "text-[#887D6B]"
                      )}
                      style={{ color: activeDistributionItem ? activeDistributionItem.color : undefined }}
                    >
                      {activeDistributionItem ? activeDistributionItem.size.split(" ")[1] ?? "GB" : "GB"}
                    </span>
                  </div>
                  <span className="font-mono text-[7.5px] font-bold uppercase tracking-wider text-[#C6A052] mt-0.5 truncate max-w-[56px]">
                    {activeDistributionItem ? activeDistributionItem.shortName : "TOTAL"}
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-0.5 font-alora min-w-0">
                {STORAGE_DISTRIBUTION.map((item) => {
                  const isHovered = hoveredDistributionId === item.id
                  return (
                    <div
                      key={item.id}
                      onMouseEnter={() => setHoveredDistributionId(item.id)}
                      onMouseLeave={() => setHoveredDistributionId(null)}
                      className={cn(
                        "flex items-center justify-between py-0.5 px-1.5 -mx-1.5 rounded-md transition-all cursor-pointer group",
                        isHovered ? "bg-[#211D15]" : "hover:bg-[#181610]"
                      )}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1.5">
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full shrink-0 transition-transform duration-150",
                            isHovered ? "scale-125" : ""
                          )}
                          style={{ backgroundColor: item.color }}
                        />
                        <span
                          className={cn(
                            "text-[11px] truncate transition-colors",
                            isHovered ? "font-bold text-[#F5F0E6]" : "font-medium text-[#B8AE9B]"
                          )}
                        >
                          {item.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-palatino font-bold text-[11px] text-[#F5F0E6] tnum">
                          {item.size}
                        </span>
                        <span
                          className={cn(
                            "font-mono text-[9px] font-bold px-1 py-0.2 rounded border w-[32px] text-center transition-colors",
                            isHovered
                              ? "bg-[#211D15] text-[#C6A052] border-[#C6A052]/40"
                              : "bg-[#11100D] text-[#887D6B] border-[#332A1B]"
                          )}
                        >
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-[#332A1B] gap-0.5 mt-2">
              {STORAGE_DISTRIBUTION.map((item) => (
                <div
                  key={item.id}
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                    opacity: hoveredDistributionId && hoveredDistributionId !== item.id ? 0.35 : 1,
                  }}
                  className="h-full rounded-full transition-opacity duration-150 cursor-pointer"
                  onMouseEnter={() => setHoveredDistributionId(item.id)}
                  onMouseLeave={() => setHoveredDistributionId(null)}
                  title={`${item.name}: ${item.size} (${item.percentage}%)`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#332A1B] pt-2 mt-2 text-[10px] font-alora text-[#887D6B]">
            <span className="flex items-center gap-1.5 truncate">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2EC496] shrink-0" />
              <span>Zero-egress routing active</span>
            </span>
            <span className="font-mono text-[9px] font-bold text-[#2EC496] bg-[#2EC496]/15 border border-[#2EC496]/40 px-1.5 py-0.2 rounded shrink-0">
              OPTIMAL
            </span>
          </div>
        </SpotlightCard>

        {/* Cloud Provider Status in Dark */}
        <SpotlightCard className="flex flex-col justify-between rounded-xl border border-[#332A1B] bg-[#11100D] p-3.5 sm:p-4 shadow-sm hover:border-[#C6A052]/40 transition-colors">
          <div>
            <div className="flex items-start gap-2 mb-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#211D15] text-[#C6A052] border border-[#332A1B]">
                <Cloud size={13} />
              </div>
              <div>
                <h3 className="font-palatino font-bold text-xs sm:text-sm text-[#F5F0E6]">Cloud Provider Status</h3>
                <p className="font-alora text-[10px] text-[#887D6B]">Connection health &amp; availability</p>
              </div>
            </div>

            <div className="space-y-1.5 pt-0.5 font-alora text-xs">
              <div className="flex items-center justify-between py-1 border-b border-[#332A1B]">
                <div className="flex items-center gap-1.5">
                  <ProviderIcon provider="aws" size={13} />
                  <span className="font-semibold text-[#F5F0E6] text-xs">AWS S3</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#2EC496] font-semibold">
                  <PulsingStatusDot color="emerald" />
                  Connected
                </div>
                <span className="font-mono text-[10px] text-[#887D6B]">98.4 GB</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#332A1B]">
                <div className="flex items-center gap-1.5">
                  <ProviderIcon provider="gcp" size={13} />
                  <span className="font-semibold text-[#F5F0E6] text-xs">Google Cloud</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#2EC496] font-semibold">
                  <PulsingStatusDot color="emerald" />
                  Connected
                </div>
                <span className="font-mono text-[10px] text-[#887D6B]">74.6 GB</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#332A1B]">
                <div className="flex items-center gap-1.5">
                  <ProviderIcon provider="azure" size={13} />
                  <span className="font-semibold text-[#F5F0E6] text-xs">Azure Blob</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#2EC496] font-semibold">
                  <PulsingStatusDot color="emerald" />
                  Connected
                </div>
                <span className="font-mono text-[10px] text-[#887D6B]">49.7 GB</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-1.5">
                  <ProviderIcon provider="oracle" size={13} />
                  <span className="font-semibold text-[#F5F0E6] text-xs">Oracle Cloud</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#2EC496] font-semibold">
                  <PulsingStatusDot color="emerald" />
                  Connected
                </div>
                <span className="font-mono text-[10px] text-[#887D6B]">18.8 GB</span>
              </div>
            </div>
          </div>
        </SpotlightCard>

        {/* Recent Activity in Dark */}
        <SpotlightCard className="flex flex-col justify-between rounded-xl border border-[#332A1B] bg-[#11100D] p-3.5 sm:p-4 shadow-sm hover:border-[#C6A052]/40 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-start gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#211D15] text-[#C6A052] border border-[#332A1B]">
                  <Activity size={13} />
                </div>
                <div>
                  <h3 className="font-palatino font-bold text-xs sm:text-sm text-[#F5F0E6]">Recent Activity</h3>
                  <p className="font-alora text-[10px] text-[#887D6B]">Latest operations &amp; logs</p>
                </div>
              </div>
              <Link
                to="/app/activity"
                className="inline-flex h-6 items-center justify-center rounded-md border border-[#332A1B] bg-[#211D15] px-2 text-[10px] font-semibold text-[#F5F0E6] hover:border-[#C6A052] hover:bg-[#332A1B] transition-colors font-alora"
              >
                View all
              </Link>
            </div>

            <div className="space-y-1.5 pt-0.5 text-xs font-alora">
              {audit.data && audit.data.length > 0 ? (
                audit.data.slice(0, 4).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-2 py-0.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#211D15] text-[#C6A052]">
                        <FileText size={12} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#F5F0E6] text-xs">{entry.action}</p>
                        <p className="font-mono text-[10px] text-[#887D6B] truncate">
                          {entry.resource_id ? `${entry.resource_id.slice(0, 10)}…` : "Authorization"}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-[#887D6B] shrink-0">
                      {new Date(entry.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2 py-0.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-300">
                        <FileText size={12} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#F5F0E6] text-xs">
                          Uploaded <span className="font-bold">design-system.zip</span>
                        </p>
                        <p className="text-[10px] text-[#887D6B] truncate">Azure Blob • 850 MB</p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-[#887D6B] shrink-0">10:24 AM</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 py-0.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                        <Cloud size={12} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#F5F0E6] text-xs">
                          Connected <span className="font-bold">Google Cloud</span>
                        </p>
                        <p className="text-[10px] text-[#887D6B] truncate">Cloud provider • Success</p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-[#887D6B] shrink-0">09:41 AM</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 py-0.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-500/15 border border-teal-500/30 text-teal-300">
                        <Zap size={12} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#F5F0E6] text-xs">
                          Routed <span className="font-bold">dataset.csv</span>
                        </p>
                        <p className="text-[10px] text-[#887D6B] truncate">Smart Router • Standard</p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-[#887D6B] shrink-0">08:12 AM</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 py-0.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300">
                        <Cloud size={12} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#F5F0E6] text-xs">
                          Connected <span className="font-bold">AWS S3</span>
                        </p>
                        <p className="text-[10px] text-[#887D6B] truncate">Cloud provider • Success</p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-[#887D6B] shrink-0">Yesterday</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </SpotlightCard>
      </motion.section>
    </motion.div>
  )
}
