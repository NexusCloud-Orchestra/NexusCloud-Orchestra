import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
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

import { OrbitingCloudHero } from "../../components/overview/OrbitingCloudHero"
import { useConnections, useFiles, useQuota, useAuditLogs } from "../../hooks/use-data"
import { requestDownload } from "../../api/files"
import { formatBytes } from "../../lib/format"
import { useToast } from "../../state/toast"
import { ProviderIcon, ProviderBadge } from "../../components/ui/cloud-logos"
import { cn } from "../../lib/utils"
import { motion, type Variants } from "framer-motion"
import {
  SpotlightCard,
  BorderBeam,
  ShinyText,
  PulsingStatusDot,
  GridBeams,
} from "../../components/ui/effects"
import type { FileRecord } from "../../types/api"

interface WorkspaceItem {
  id: string
  name: string
  type: "file" | "folder"
  provider: string
  storageMode: "Standard" | "Cool" | "Archive"
  sizeBytes: number
  sizeFormatted: string
  lastModified: string
  mimeType?: string
  isReal?: boolean
  realRecord?: FileRecord
}

const REFERENCE_WORKSPACE_ITEMS: WorkspaceItem[] = [
  {
    id: "ref-1",
    name: "Project-Assets",
    type: "folder",
    provider: "aws",
    storageMode: "Standard",
    sizeBytes: 13743895347,
    sizeFormatted: "12.8 GB",
    lastModified: "Oct 15, 2026 10:24 AM",
    mimeType: "inode/directory",
  },
  {
    id: "ref-2",
    name: "dataset.csv",
    type: "file",
    provider: "gcp",
    storageMode: "Standard",
    sizeBytes: 2576980377,
    sizeFormatted: "2.4 GB",
    lastModified: "Oct 14, 2026 06:41 PM",
    mimeType: "text/csv",
  },
  {
    id: "ref-3",
    name: "design-system.zip",
    type: "file",
    provider: "azure",
    storageMode: "Cool",
    sizeBytes: 891289600,
    sizeFormatted: "850 MB",
    lastModified: "Oct 14, 2026 11:20 AM",
    mimeType: "application/zip",
  },
  {
    id: "ref-4",
    name: "Backups",
    type: "folder",
    provider: "oracle",
    storageMode: "Archive",
    sizeBytes: 51754352640,
    sizeFormatted: "48.2 GB",
    lastModified: "Oct 13, 2026 02:18 AM",
    mimeType: "inode/directory",
  },
  {
    id: "ref-5",
    name: "presentation.pdf",
    type: "file",
    provider: "aws",
    storageMode: "Standard",
    sizeBytes: 37748736,
    sizeFormatted: "36 MB",
    lastModified: "Oct 12, 2026 09:05 PM",
    mimeType: "application/pdf",
  },
]

interface StorageDistributionItem {
  id: string
  name: string
  shortName: string
  color: string
  accentColor: string
  size: string
  percentage: number
  offset: number
}

const STORAGE_DISTRIBUTION: StorageDistributionItem[] = [
  { id: "aws", name: "AWS S3", shortName: "AWS", color: "#C49A3A", accentColor: "#FFF8E7", size: "98.4 GB", percentage: 40, offset: 0 },
  { id: "gcp", name: "Google Cloud", shortName: "Google", color: "#142B4A", accentColor: "#EBF3FF", size: "74.6 GB", percentage: 30, offset: 40 },
  { id: "azure", name: "Azure Blob", shortName: "Azure", color: "#0284C7", accentColor: "#F0F9FF", size: "49.7 GB", percentage: 20, offset: 70 },
  { id: "oracle", name: "Oracle Cloud", shortName: "Oracle", color: "#EA580C", accentColor: "#FFF1EE", size: "18.8 GB", percentage: 8, offset: 90 },
  { id: "others", name: "Others", shortName: "Others", color: "#64748B", accentColor: "#F1F5F9", size: "7.0 GB", percentage: 2, offset: 98 },
]

export function OverviewPage() {
  const navigate = useNavigate()
  const toast = useToast()

  const quota = useQuota()
  const connections = useConnections()
  const files = useFiles()
  const audit = useAuditLogs()

  // Filter toolbar state
  const [objectFilter, setObjectFilter] = useState<"all" | "files" | "folders">("all")
  const [providerFilter, setProviderFilter] = useState<string>("all")
  const [storageModeFilter, setStorageModeFilter] = useState<string>("all")
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "size">("newest")

  // Storage Distribution interactive hover state
  const [hoveredDistributionId, setHoveredDistributionId] = useState<string | null>(null)

  // Selected item state for inspector
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "metadata" | "routing" | "versions">("overview")
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const allItems: WorkspaceItem[] = useMemo(() => {
    const list: WorkspaceItem[] = []

    if (files.data && files.data.length > 0) {
      files.data.forEach((f) => {
        const mode = f.storage_mode === "striped" ? "Cool" : "Standard"
        list.push({
          id: f.id,
          name: f.original_name,
          type: "file",
          provider: f.provider,
          storageMode: mode,
          sizeBytes: f.size_bytes,
          sizeFormatted: formatBytes(f.size_bytes),
          lastModified: new Date(f.uploaded_at ?? Date.now()).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          mimeType: f.mime_type || "application/octet-stream",
          isReal: true,
          realRecord: f,
        })
      })
    }

    // Always include reference items if not duplicated
    REFERENCE_WORKSPACE_ITEMS.forEach((ref) => {
      if (!list.some((item) => item.name === ref.name)) {
        list.push(ref)
      }
    })

    return list
  }, [files.data])

  // Filter & sort
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (objectFilter === "files" && item.type !== "file") return false
      if (objectFilter === "folders" && item.type !== "folder") return false
      if (providerFilter !== "all" && item.provider !== providerFilter) return false
      if (storageModeFilter !== "all" && item.storageMode !== storageModeFilter) return false
      if (fileTypeFilter !== "all") {
        if (fileTypeFilter === "pdf" && !item.name.endsWith(".pdf")) return false
        if (fileTypeFilter === "csv" && !item.name.endsWith(".csv")) return false
        if (fileTypeFilter === "zip" && !item.name.endsWith(".zip")) return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          item.name.toLowerCase().includes(q) ||
          item.provider.toLowerCase().includes(q) ||
          item.storageMode.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [allItems, objectFilter, providerFilter, storageModeFilter, fileTypeFilter, searchQuery])

  // Currently selected item
  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null
    return allItems.find((i) => i.id === selectedItemId) ?? null
  }, [allItems, selectedItemId])

  // Download handler
  const handleDownload = async (item: WorkspaceItem) => {
    if (item.isReal && item.realRecord) {
      setDownloadingId(item.id)
      try {
        const ticket = await requestDownload(item.realRecord.id)
        window.open(ticket.download_url, "_blank")
        toast.notify(`Presigned download issued for ${item.name}`, "success")
      } catch {
        toast.notify("Failed to generate presigned download URL", "error")
      } finally {
        setDownloadingId(null)
      }
    } else {
      toast.notify(`Demo object: ${item.name} placed across ${item.provider.toUpperCase()}`, "neutral")
    }
  }

  // Real or Reference KPI values
  const totalStoredFormatted =
    quota.data && quota.data.total_used_bytes > 0
      ? formatBytes(quota.data.total_used_bytes)
      : "248.5 GB"

  const usableCapacityFormatted =
    quota.data && quota.data.total_free_bytes > 0
      ? formatBytes(quota.data.total_free_bytes)
      : "751.5 GB"

  const connectedCloudsCount =
    connections.data && connections.data.length > 0 ? connections.data.length : 3

  const activeRoutingCount =
    files.data && files.data.length > 0 ? `${files.data.length} files` : "12 files"

  const activeDistributionItem = hoveredDistributionId
    ? STORAGE_DISTRIBUTION.find((i) => i.id === hoveredDistributionId) ?? null
    : null

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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-3.5 sm:gap-4 pb-6 font-alora text-[#142B4A]"
    >
      {/* ── 1. HERO SECTION ── */}
      <motion.section
        variants={sectionVariants}
        className="relative overflow-hidden rounded-2xl border border-[#E8E0D1] bg-[#FFFDF8] p-4 sm:p-5 shadow-xs"
      >
        <GridBeams />
        <div className="relative z-1 grid grid-cols-1 items-center gap-5 lg:grid-cols-12">
          {/* Left: Hero Copy and Actions (lg:col-span-5) */}
          <div className="flex flex-col justify-between lg:col-span-5">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#C49A3A]/30 bg-[#FFF8E7] px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase text-[#C49A3A] mb-2 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C49A3A] animate-pulse" />
                NexusCloud Control Plane
              </div>
              <h1 className="font-palatino text-xl sm:text-2xl lg:text-[25px] font-bold tracking-tight text-[#142B4A] leading-tight mb-2">
                Your Cloud Workspace, <ShinyText>Orchestrated.</ShinyText>
              </h1>
              <p className="font-alora text-xs sm:text-[13px] text-[#68768A] leading-relaxed mb-4 max-w-lg">
                Unify, manage, and orchestrate multi-cloud storage across all providers. Automate placement, slash egress fees, and monitor capacity in one control plane.
              </p>

              {/* Action Buttons with Spring Feedback and BorderBeam */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/app/clouds?connect=1")}
                  className="relative overflow-hidden inline-flex h-8 items-center justify-center gap-1.5 rounded-full bg-[#C49A3A] px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#A77B26] font-alora cursor-pointer"
                >
                  <BorderBeam size={60} duration={8} colorFrom="#FFF8E7" colorTo="transparent" />
                  <Plus size={13} />
                  <span>Connect Cloud Provider</span>
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/app/router")}
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-[#E8E0D1] bg-white px-4 text-xs font-medium text-[#142B4A] shadow-2xs transition-colors hover:border-[#C49A3A] hover:bg-[#FAF6ED] font-alora cursor-pointer"
                >
                  <Settings size={13} className="text-[#68768A]" />
                  <span>Explore Smart Router</span>
                </motion.button>
              </div>
            </div>

            {/* 4 Feature Highlights - Small icons, balanced 2x2 grid, no text collision */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 pt-2.5 border-t border-[#E8E0D1]/60">
              <div className="flex items-center gap-2 min-w-0 group cursor-default">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#FFF8E7] border border-[#C49A3A]/30 text-[#C49A3A] group-hover:scale-110 transition-transform">
                  <Cloud size={12} />
                </div>
                <div className="min-w-0">
                  <p className="font-alora text-xs font-bold text-[#142B4A] leading-tight truncate">Multi-Cloud</p>
                  <p className="font-alora text-[10px] text-[#68768A] leading-tight mt-0.5 truncate">Single storage pool</p>
                </div>
              </div>

              <div className="flex items-center gap-2 min-w-0 group cursor-default">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#FFF8E7] border border-[#C49A3A]/30 text-[#C49A3A] group-hover:scale-110 transition-transform">
                  <Zap size={12} />
                </div>
                <div className="min-w-0">
                  <p className="font-alora text-xs font-bold text-[#142B4A] leading-tight truncate">Smart Placement</p>
                  <p className="font-alora text-[10px] text-[#68768A] leading-tight mt-0.5 truncate">AI routing</p>
                </div>
              </div>

              <div className="flex items-center gap-2 min-w-0 group cursor-default">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#FFF8E7] border border-[#C49A3A]/30 text-[#C49A3A] group-hover:scale-110 transition-transform">
                  <Lock size={12} />
                </div>
                <div className="min-w-0">
                  <p className="font-alora text-xs font-bold text-[#142B4A] leading-tight truncate">Zero Lock-in</p>
                  <p className="font-alora text-[10px] text-[#68768A] leading-tight mt-0.5 truncate">Your credentials</p>
                </div>
              </div>

              <div className="flex items-center gap-2 min-w-0 group cursor-default">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#FFF8E7] border border-[#C49A3A]/30 text-[#C49A3A] group-hover:scale-110 transition-transform">
                  <ShieldCheck size={12} />
                </div>
                <div className="min-w-0">
                  <p className="font-alora text-xs font-bold text-[#142B4A] leading-tight truncate">Enterprise</p>
                  <p className="font-alora text-[10px] text-[#68768A] leading-tight mt-0.5 truncate">AES-256 encrypted</p>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Interactive Orbiting Multi-Cloud Hero (lg:col-span-4) */}
          <div className="flex items-center justify-center lg:col-span-4 py-0">
            <OrbitingCloudHero />
          </div>

          {/* Right: Multi-Cloud Summary Box (lg:col-span-3) */}
          <SpotlightCard className="flex flex-col justify-between rounded-xl border border-[#E8E0D1] bg-white/95 p-3.5 sm:p-4 shadow-2xs lg:col-span-3 min-h-[210px] hover:border-[#C49A3A]/50 transition-colors">
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#FFF8E7] border border-[#C49A3A]/40 text-[#C49A3A]">
                  <Plus size={12} />
                </div>
                <h3 className="font-palatino font-bold text-xs sm:text-sm text-[#142B4A]">
                  Multi-Cloud Mesh
                </h3>
              </div>

              <ul className="space-y-2 text-xs text-[#344256] font-alora leading-normal">
                <li className="flex items-start gap-2">
                  <Check size={12} className="text-[#168568] shrink-0 mt-0.5" />
                  <span>Single storage pool across providers</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={12} className="text-[#168568] shrink-0 mt-0.5" />
                  <span>Zero lock-in, intelligent routing</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={12} className="text-[#168568] shrink-0 mt-0.5" />
                  <span>Secure &amp; encrypted by default</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={12} className="text-[#168568] shrink-0 mt-0.5" />
                  <span>Presigned direct transfers (0 egress)</span>
                </li>
              </ul>
            </div>

            <div className="pt-2.5 border-t border-[#E8E0D1]/60 flex items-center justify-between text-xs text-[#68768A]">
              <span className="font-mono uppercase tracking-wider text-[#A77B26] text-[10px] font-bold">Active Mesh</span>
              <span className="flex items-center gap-1.5 text-[#168568] font-medium font-alora text-[11px]">
                <PulsingStatusDot color="emerald" /> 100% Operational
              </span>
            </div>
          </SpotlightCard>
        </div>
      </motion.section>

      {/* ── 2. FOUR KPI CARDS ── */}
      <motion.section variants={sectionVariants} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: TOTAL STORED DATA */}
        <SpotlightCard className="flex flex-col justify-between rounded-xl border border-[#E8E0D1] bg-white p-3.5 shadow-2xs hover:border-[#C49A3A]/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs min-h-[126px]">
          <div className="flex items-center justify-between">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF8E7] border border-[#C49A3A]/30 text-[#C49A3A]">
              <HardDrive size={13} />
            </div>
            <span className="flex items-center gap-0.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#168568] font-alora">
              ↑ 12%
            </span>
          </div>

          <div className="flex items-end justify-between mt-2.5 gap-2">
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold tracking-wider uppercase text-[#68768A]">
                TOTAL STORED DATA
              </p>
              <p className="font-palatino font-bold text-xl sm:text-[22px] text-[#142B4A] tracking-tight mt-0.5">
                {totalStoredFormatted}
              </p>
              <p className="font-alora text-[11px] text-[#68768A] mt-0.5 truncate">Across connected clouds</p>
            </div>

            {/* Donut Gauge (68%) */}
            <div className="flex flex-col items-center shrink-0">
              <div className="relative h-10 w-10">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E8E0D1"
                    strokeWidth="3.4"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#C49A3A"
                    strokeWidth="3.4"
                    strokeDasharray="68, 100"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-palatino font-bold text-[10px] text-[#142B4A]">
                  68%
                </div>
              </div>
            </div>
          </div>
        </SpotlightCard>

        {/* KPI 2: USABLE CAPACITY */}
        <SpotlightCard className="flex flex-col justify-between rounded-xl border border-[#E8E0D1] bg-white p-3.5 shadow-2xs hover:border-[#C49A3A]/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs min-h-[126px]">
          <div className="flex items-center justify-between">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF8E7] border border-[#C49A3A]/30 text-[#C49A3A]">
              <Layers size={13} />
            </div>
            <span className="font-alora text-[10px] font-semibold text-[#A77B26] bg-[#FFF8E7] border border-[#C49A3A]/30 px-2 py-0.5 rounded-full">
              Free Tier Pool
            </span>
          </div>

          <div className="flex items-end justify-between mt-2.5 gap-2">
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold tracking-wider uppercase text-[#68768A]">
                USABLE CAPACITY
              </p>
              <p className="font-palatino font-bold text-xl sm:text-[22px] text-[#142B4A] tracking-tight mt-0.5">
                {usableCapacityFormatted}
              </p>
              <p className="font-alora text-[11px] text-[#68768A] mt-0.5 truncate">Zero-egress pool</p>
            </div>

            {/* Ascending Step Bars Graphic */}
            <div className="flex items-end gap-1 h-8 shrink-0 pb-0.5">
              <span className="w-1.5 rounded-t-xs bg-[#C49A3A]/40 h-[8px]" />
              <span className="w-1.5 rounded-t-xs bg-[#C49A3A]/60 h-[14px]" />
              <span className="w-1.5 rounded-t-xs bg-[#C49A3A]/80 h-[20px]" />
              <span className="w-1.5 rounded-t-xs bg-[#C49A3A] h-[26px]" />
              <span className="w-1.5 rounded-t-xs bg-[#A77B26] h-[32px]" />
            </div>
          </div>
        </SpotlightCard>

        {/* KPI 3: CONNECTED CLOUDS */}
        <SpotlightCard className="flex flex-col justify-between rounded-xl border border-[#E8E0D1] bg-white p-3.5 shadow-2xs hover:border-[#C49A3A]/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs min-h-[126px]">
          <div className="flex items-center justify-between">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF8E7] border border-[#C49A3A]/30 text-[#C49A3A]">
              <Cloud size={13} />
            </div>
            <Link
              to="/app/clouds"
              title="Manage Cloud Providers"
              className="flex h-5 w-5 items-center justify-center rounded-full text-[#68768A] hover:text-[#142B4A] hover:bg-[#FAF6ED] transition-colors"
            >
              <ChevronRight size={13} />
            </Link>
          </div>

          <div className="flex items-end justify-between mt-2.5 gap-2">
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold tracking-wider uppercase text-[#68768A]">
                CONNECTED CLOUDS
              </p>
              <p className="font-palatino font-bold text-xl sm:text-[22px] text-[#142B4A] tracking-tight mt-0.5">
                {connectedCloudsCount}
              </p>
              <p className="font-alora text-[11px] text-[#68768A] mt-0.5 truncate">Active and healthy</p>
            </div>

            {/* Provider mini logo pills */}
            <div className="flex items-center -space-x-1 shrink-0 pb-0.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#E8E0D1] bg-white p-0.5 shadow-2xs hover:scale-115 transition-transform">
                <ProviderIcon provider="aws" size={11} />
              </div>
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#E8E0D1] bg-white p-0.5 shadow-2xs hover:scale-115 transition-transform">
                <ProviderIcon provider="gcp" size={11} />
              </div>
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#E8E0D1] bg-white p-0.5 shadow-2xs hover:scale-115 transition-transform">
                <ProviderIcon provider="azure" size={11} />
              </div>
            </div>
          </div>
        </SpotlightCard>

        {/* KPI 4: ACTIVE ROUTING */}
        <SpotlightCard className="flex flex-col justify-between rounded-xl border border-[#E8E0D1] bg-white p-3.5 shadow-2xs hover:border-[#C49A3A]/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs min-h-[126px]">
          <div className="flex items-center justify-between">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF8E7] border border-[#C49A3A]/30 text-[#C49A3A]">
              <Zap size={13} />
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 font-alora">
              <PulsingStatusDot color="emerald" />
              Live Mesh
            </span>
          </div>

          <div className="flex items-end justify-between mt-2.5 gap-2">
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold tracking-wider uppercase text-[#68768A]">
                ACTIVE ROUTING
              </p>
              <p className="font-palatino font-bold text-xl sm:text-[22px] text-[#142B4A] tracking-tight mt-0.5">
                {activeRoutingCount}
              </p>
              <p className="font-alora text-[11px] text-[#68768A] mt-0.5 truncate">Smart placement on</p>
            </div>

            {/* Golden Sparkline Curve */}
            <div className="h-7 w-18 shrink-0 pb-0.5">
              <svg viewBox="0 0 100 40" className="h-full w-full overflow-visible">
                <path
                  d="M0 32 L25 24 L50 28 L75 12 L100 6"
                  fill="none"
                  stroke="#C49A3A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="0" cy="32" r="2" fill="#C49A3A" />
                <circle cx="25" cy="24" r="2" fill="#C49A3A" />
                <circle cx="50" cy="28" r="2" fill="#C49A3A" />
                <circle cx="75" cy="12" r="2" fill="#C49A3A" />
                <circle cx="100" cy="6" r="2.5" fill="#A77B26" />
              </svg>
            </div>
          </div>
        </SpotlightCard>
      </motion.section>

      {/* ── 3. UNIFIED FILTER TOOLBAR ── */}
      <motion.section variants={sectionVariants} className="flex flex-wrap items-center justify-between gap-2.5 font-alora">
        {/* Left Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Object Type Capsule with Sliding Active Pill (Framer Motion layoutId) */}
          <div className="inline-flex h-8 items-center rounded-lg border border-[#E8E0D1] bg-[#FAF6ED]/70 p-0.5 shadow-2xs relative">
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
                    isActive ? "text-white" : "text-[#344256] hover:text-[#142B4A]"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeFilterPill"
                      className="absolute inset-0 rounded-md bg-[#C49A3A] shadow-xs"
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
              className="inline-flex h-8 appearance-none items-center rounded-lg border border-[#E8E0D1] bg-white pl-2.5 pr-7 text-xs font-medium text-[#344256] hover:border-[#C49A3A] focus:outline-none cursor-pointer shadow-2xs font-alora transition-colors"
            >
              <option value="all">All Providers</option>
              <option value="aws">AWS S3</option>
              <option value="gcp">Google Cloud</option>
              <option value="azure">Azure Blob</option>
              <option value="oracle">Oracle Cloud</option>
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#68768A]" />
          </div>

          {/* Storage Mode Dropdown */}
          <div className="relative">
            <select
              value={storageModeFilter}
              onChange={(e) => setStorageModeFilter(e.target.value)}
              className="inline-flex h-8 appearance-none items-center rounded-lg border border-[#E8E0D1] bg-white pl-2.5 pr-7 text-xs font-medium text-[#344256] hover:border-[#C49A3A] focus:outline-none cursor-pointer shadow-2xs font-alora transition-colors"
            >
              <option value="all">All Storage Modes</option>
              <option value="Standard">Standard Tier</option>
              <option value="Cool">Cool Tier</option>
              <option value="Archive">Archive Tier</option>
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#68768A]" />
          </div>

          {/* File Types Dropdown */}
          <div className="relative">
            <select
              value={fileTypeFilter}
              onChange={(e) => setFileTypeFilter(e.target.value)}
              className="inline-flex h-8 appearance-none items-center rounded-lg border border-[#E8E0D1] bg-white pl-2.5 pr-7 text-xs font-medium text-[#344256] hover:border-[#C49A3A] focus:outline-none cursor-pointer shadow-2xs font-alora transition-colors"
            >
              <option value="all">All File Types</option>
              <option value="pdf">PDF Documents</option>
              <option value="csv">CSV Datasets</option>
              <option value="zip">ZIP Archives</option>
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#68768A]" />
          </div>
        </div>

        {/* Right Toolbar Controls (Search, View Mode, Sort) */}
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative w-44 sm:w-52 lg:w-60">
            <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#68768A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files…"
              className="h-8 w-full rounded-lg border border-[#E8E0D1] bg-white pl-8 pr-2.5 text-xs text-[#142B4A] placeholder:text-[#68768A] focus:border-[#C49A3A] focus:outline-none shadow-2xs font-alora transition-colors"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                viewMode === "list"
                  ? "border-[#C49A3A] bg-[#FFF8E7] text-[#C49A3A]"
                  : "border-[#E8E0D1] bg-white text-[#68768A] hover:bg-[#FAF6ED]"
              }`}
              title="List view"
            >
              <List size={13} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                viewMode === "grid"
                  ? "border-[#C49A3A] bg-[#FFF8E7] text-[#C49A3A]"
                  : "border-[#E8E0D1] bg-white text-[#68768A] hover:bg-[#FAF6ED]"
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

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "size")}
              className="inline-flex h-8 appearance-none items-center rounded-lg border border-[#E8E0D1] bg-white pl-2.5 pr-6 text-xs font-medium text-[#344256] hover:border-[#C49A3A] focus:outline-none cursor-pointer shadow-2xs font-alora transition-colors"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="size">Size</option>
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[#68768A]" />
          </div>
        </div>
      </motion.section>

      {/* ── 4. INTEGRATED FILE WORKSPACE (SPLIT 2-COLUMN) ── */}
      <motion.section variants={sectionVariants} className="grid grid-cols-1 gap-3.5 lg:grid-cols-12 items-start font-alora">
        {/* Left Panel: Table (~66% width, lg:col-span-8) */}
        <div className="overflow-hidden rounded-xl border border-[#E8E0D1] bg-white shadow-2xs lg:col-span-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E8E0D1] bg-[#FAF6ED]/70 font-mono text-[10px] font-bold tracking-wider uppercase text-[#68768A]">
                <tr>
                  <th className="py-2 pl-3 pr-2 w-8">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      className="rounded-xs border-[#E8E0D1] text-[#C49A3A] focus:ring-[#C49A3A]"
                    />
                  </th>
                  <th className="py-2 px-3 font-bold">Name</th>
                  <th className="py-2 px-3 font-bold">Provider</th>
                  <th className="py-2 px-3 font-bold">Storage Mode</th>
                  <th className="py-2 px-3 font-bold text-right">Size</th>
                  <th className="py-2 px-3 font-bold">Last Modified</th>
                  <th className="py-2 pr-3 pl-1 w-8 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D1]/60 font-alora">
                {filteredItems.map((item) => {
                  const isSelected = selectedItemId === item.id

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItemId((prev) => (prev === item.id ? null : item.id))}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#FFF8E7]/70 font-medium"
                          : "hover:bg-[#FAF6ED]/50"
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2 pl-3 pr-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => setSelectedItemId((prev) => (prev === item.id ? null : item.id))}
                          aria-label={`Select ${item.name}`}
                          className="rounded-xs border-[#E8E0D1] text-[#C49A3A] focus:ring-[#C49A3A]"
                        />
                      </td>

                      {/* Icon + Name */}
                      <td className="py-2 px-3 min-w-[160px]">
                        <div className="flex items-center gap-2">
                          {item.type === "folder" ? (
                            <Folder size={14} className="text-[#C49A3A] shrink-0 fill-[#C49A3A]/20" />
                          ) : (
                            <FileText size={14} className="text-[#68768A] shrink-0" />
                          )}
                          <span className="font-palatino font-bold text-xs sm:text-[13px] text-[#142B4A] truncate max-w-[200px]">
                            {item.name}
                          </span>
                        </div>
                      </td>

                      {/* Provider Badge */}
                      <td className="py-2 px-3">
                        <ProviderBadge provider={item.provider} />
                      </td>

                      {/* Storage Mode Badge */}
                      <td className="py-2 px-3">
                        {item.storageMode === "Standard" && (
                          <span className="inline-flex items-center rounded-sm border border-[#E8E0D1] bg-[#FAF6ED] px-1.5 py-0.5 text-[10px] font-mono font-semibold text-[#142B4A]">
                            Standard
                          </span>
                        )}
                        {item.storageMode === "Cool" && (
                          <span className="inline-flex items-center rounded-sm border border-teal-200 bg-teal-50 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-teal-800">
                            Cool
                          </span>
                        )}
                        {item.storageMode === "Archive" && (
                          <span className="inline-flex items-center rounded-sm border border-purple-200 bg-purple-50 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-purple-800">
                            Archive
                          </span>
                        )}
                      </td>

                      {/* Size */}
                      <td className="py-2 px-3 text-right font-mono text-xs font-semibold text-[#142B4A]">
                        {item.sizeFormatted}
                      </td>

                      {/* Last Modified */}
                      <td className="py-2 px-3 text-[#68768A] text-[11px] font-mono whitespace-nowrap">
                        {item.lastModified}
                      </td>

                      {/* Row Action */}
                      <td className="py-2 pr-3 pl-1 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            void handleDownload(item)
                          }}
                          className="text-[#68768A] hover:text-[#142B4A] p-1 rounded-md hover:bg-black/5"
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

        {/* Right Panel: Contextual Inspector (~34% width, lg:col-span-4) */}
        <SpotlightCard className="flex flex-col justify-between rounded-xl border border-[#E8E0D1] bg-white p-3.5 sm:p-4 shadow-2xs lg:col-span-4 min-h-[290px] font-alora hover:border-[#C49A3A]/50 transition-colors">
          <div>
            {/* Header Tabs with Smooth Sliding LayoutId Indicator */}
            <div className="flex items-center gap-3 border-b border-[#E8E0D1] pb-1.5 text-xs font-semibold relative">
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
                      isActive ? "font-bold text-[#C49A3A]" : "text-[#68768A] hover:text-[#142B4A]"
                    )}
                  >
                    <span>{tab.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeInspectorTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C49A3A] rounded-full"
                        transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Contextual Body */}
            {selectedItem ? (
              <div className="mt-3 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FAF6ED] border border-[#E8E0D1]">
                    {selectedItem.type === "folder" ? (
                      <Folder size={16} className="text-[#C49A3A]" />
                    ) : (
                      <FileText size={16} className="text-[#68768A]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-palatino font-bold text-xs sm:text-sm text-[#142B4A]">{selectedItem.name}</p>
                    <p className="text-[10px] font-mono text-[#68768A] uppercase mt-0.5">
                      {selectedItem.type} • {selectedItem.storageMode}
                    </p>
                  </div>
                </div>

                {activeTab === "overview" && (
                  <div className="space-y-1.5 rounded-lg border border-[#E8E0D1] bg-[#FAF6ED]/40 p-2.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#68768A]">Size:</span>
                      <span className="font-semibold text-[#142B4A]">{selectedItem.sizeFormatted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#68768A]">Provider:</span>
                      <span className="font-semibold text-[#142B4A] uppercase">{selectedItem.provider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#68768A]">Storage Mode:</span>
                      <span className="font-semibold text-[#142B4A]">{selectedItem.storageMode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#68768A]">Encryption:</span>
                      <span className="font-semibold text-[#168568]">AES-256-GCM</span>
                    </div>
                  </div>
                )}

                {activeTab === "metadata" && (
                  <div className="space-y-1.5 rounded-lg border border-[#E8E0D1] bg-[#FAF6ED]/40 p-2.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#68768A]">MIME Type:</span>
                      <span className="truncate max-w-[130px] text-[#142B4A]">{selectedItem.mimeType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#68768A]">Object ID:</span>
                      <span className="text-[#C49A3A] truncate max-w-[130px]">{selectedItem.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#68768A]">Modified:</span>
                      <span className="text-[#142B4A] truncate max-w-[130px]">{selectedItem.lastModified}</span>
                    </div>
                  </div>
                )}

                {activeTab === "routing" && (
                  <div className="space-y-1.5 rounded-lg border border-[#E8E0D1] bg-[#FAF6ED]/40 p-2.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#68768A]">Routing Engine:</span>
                      <span className="font-semibold text-[#142B4A]">Smart Placement</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#68768A]">Egress Penalty:</span>
                      <span className="text-[#168568]">0% (Zero-Egress Tier)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#68768A]">Replication:</span>
                      <span className="text-[#142B4A]">Single Cloud</span>
                    </div>
                  </div>
                )}

                {activeTab === "versions" && (
                  <div className="space-y-1.5 rounded-lg border border-[#E8E0D1] bg-[#FAF6ED]/40 p-2.5 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#142B4A]">v1.0 (Current)</span>
                      <span className="text-[#168568] text-[10px] font-semibold">Active</span>
                    </div>
                    <p className="text-[10px] text-[#68768A]">Committed {selectedItem.lastModified}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => void handleDownload(selectedItem)}
                  disabled={downloadingId === selectedItem.id}
                  className="w-full inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#142B4A] hover:bg-[#0B1B32] text-white py-1.5 text-xs font-semibold shadow-xs transition-colors font-alora"
                >
                  <Download size={13} />
                  {downloadingId === selectedItem.id ? "Authorizing Presigned URL..." : "Download File"}
                </button>
              </div>
            ) : (
              /* Reference Empty State */
              <div className="flex flex-col items-center justify-center text-center p-4 my-auto">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E8E0D1] bg-[#FAF6ED] text-[#68768A] mb-2">
                  <FileText size={17} />
                </div>
                <h4 className="font-palatino font-bold text-sm text-[#142B4A]">No object selected</h4>
                <p className="font-alora text-xs text-[#68768A] mt-0.5 max-w-xs leading-relaxed">
                  Select a file or folder from the list to view details, metadata, and routing.
                </p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-[#E8E0D1]/60 flex items-center justify-between text-xs font-alora text-[#68768A]">
            <span className="text-[11px]">{filteredItems.length} objects</span>
            <Link to="/app/files" className="font-bold text-[#142B4A] hover:text-[#C49A3A] flex items-center gap-1 text-[11px]">
              All Files <ChevronRight size={12} />
            </Link>
          </div>
        </SpotlightCard>
      </motion.section>

      {/* ── 5. THREE SUPPORTING SECTIONS ── */}
      <motion.section variants={sectionVariants} className="grid grid-cols-1 gap-3 sm:gap-3.5 md:grid-cols-3 font-alora">
        {/* Section 1: Storage Distribution */}
        <SpotlightCard className="flex flex-col justify-between rounded-xl border border-[#E8E0D1] bg-white p-3.5 sm:p-4 shadow-2xs hover:border-[#C49A3A]/40 transition-colors">
          <div>
            {/* Header with Icon, Title, and 5 Clouds Badge */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-[#FFF8E7] text-[#C49A3A] border border-[#C49A3A]/30 shadow-2xs">
                  <PieChart size={13} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="font-palatino font-bold text-xs sm:text-sm text-[#142B4A] tracking-tight">
                    Storage Distribution
                  </h3>
                  <p className="font-alora text-[10px] text-[#68768A]">Data across connected clouds</p>
                </div>
              </div>
              <span className="font-mono text-[9.5px] font-bold text-[#A77B26] bg-[#FFF8E7] border border-[#C49A3A]/30 px-2 py-0.5 rounded-full shrink-0">
                5 Clouds
              </span>
            </div>

            {/* Donut Chart + Tabular Legend */}
            <div className="flex items-center justify-between gap-3 py-1">
              {/* Donut Chart */}
              <div className="relative h-[96px] w-[96px] shrink-0">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  {/* Subtle Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#E8E0D1"
                    strokeWidth="6.5"
                    opacity="0.5"
                  />
                  {/* Distribution Slices */}
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

                {/* Center Data Display (Guaranteed perfect fit inside circle with generous clearance) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none px-1">
                  <div className="flex items-baseline justify-center gap-0.5">
                    <span
                      className={cn(
                        "font-palatino font-bold text-[13px] tracking-tight leading-none transition-colors duration-150",
                        activeDistributionItem ? "" : "text-[#142B4A]"
                      )}
                      style={{ color: activeDistributionItem ? activeDistributionItem.color : undefined }}
                    >
                      {activeDistributionItem ? activeDistributionItem.size.split(" ")[0] : "248.5"}
                    </span>
                    <span
                      className={cn(
                        "font-mono text-[8.5px] font-bold uppercase transition-colors duration-150",
                        activeDistributionItem ? "" : "text-[#68768A]"
                      )}
                      style={{ color: activeDistributionItem ? activeDistributionItem.color : undefined }}
                    >
                      {activeDistributionItem ? activeDistributionItem.size.split(" ")[1] ?? "GB" : "GB"}
                    </span>
                  </div>
                  <span className="font-mono text-[7.5px] font-bold uppercase tracking-wider text-[#A77B26] mt-0.5 truncate max-w-[56px]">
                    {activeDistributionItem ? activeDistributionItem.shortName : "TOTAL"}
                  </span>
                </div>
              </div>

              {/* Tabular Legend */}
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
                        isHovered ? "bg-[#FAF6ED]" : "hover:bg-[#FAF6ED]/60"
                      )}
                    >
                      {/* Left: Dot & Name */}
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
                            isHovered ? "font-bold text-[#142B4A]" : "font-medium text-[#344256]"
                          )}
                        >
                          {item.name}
                        </span>
                      </div>

                      {/* Right: Storage Size & Percentage Pill */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-palatino font-bold text-[11px] text-[#142B4A] tnum">
                          {item.size}
                        </span>
                        <span
                          className={cn(
                            "font-mono text-[9px] font-bold px-1 py-0.2 rounded border w-[32px] text-center transition-colors",
                            isHovered
                              ? "bg-[#FFF8E7] text-[#A77B26] border-[#C49A3A]/40"
                              : "bg-[#FAF6ED] text-[#68768A] border-[#E8E0D1]"
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

            {/* Continuous Multi-Segment Ratio Bar */}
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-[#E8E0D1]/60 gap-0.5 mt-2">
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

          {/* Footer Status */}
          <div className="flex items-center justify-between border-t border-[#E8E0D1]/60 pt-2 mt-2 text-[10px] font-alora text-[#68768A]">
            <span className="flex items-center gap-1.5 truncate">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Zero-egress routing active</span>
            </span>
            <span className="font-mono text-[9px] font-bold text-[#168568] bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded shrink-0">
              OPTIMAL
            </span>
          </div>
        </SpotlightCard>

        {/* Section 2: Cloud Provider Status */}
        <SpotlightCard className="flex flex-col justify-between rounded-xl border border-[#E8E0D1] bg-white p-3.5 sm:p-4 shadow-2xs hover:border-[#C49A3A]/40 transition-colors">
          <div>
            <div className="flex items-start gap-2 mb-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FFF8E7] text-[#C49A3A]">
                <Cloud size={13} />
              </div>
              <div>
                <h3 className="font-palatino font-bold text-xs sm:text-sm text-[#142B4A]">Cloud Provider Status</h3>
                <p className="font-alora text-[10px] text-[#68768A]">Connection health &amp; availability</p>
              </div>
            </div>

            <div className="space-y-1.5 pt-0.5 font-alora text-xs">
              <div className="flex items-center justify-between py-1 border-b border-[#E8E0D1]/60">
                <div className="flex items-center gap-1.5">
                  <ProviderIcon provider="aws" size={13} />
                  <span className="font-semibold text-[#142B4A] text-xs">AWS S3</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#168568] font-semibold">
                  <PulsingStatusDot color="emerald" />
                  Connected
                </div>
                <span className="font-mono text-[10px] text-[#68768A]">98.4 GB</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#E8E0D1]/60">
                <div className="flex items-center gap-1.5">
                  <ProviderIcon provider="gcp" size={13} />
                  <span className="font-semibold text-[#142B4A] text-xs">Google Cloud</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#168568] font-semibold">
                  <PulsingStatusDot color="emerald" />
                  Connected
                </div>
                <span className="font-mono text-[10px] text-[#68768A]">74.6 GB</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#E8E0D1]/60">
                <div className="flex items-center gap-1.5">
                  <ProviderIcon provider="azure" size={13} />
                  <span className="font-semibold text-[#142B4A] text-xs">Azure Blob</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#168568] font-semibold">
                  <PulsingStatusDot color="emerald" />
                  Connected
                </div>
                <span className="font-mono text-[10px] text-[#68768A]">49.7 GB</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-1.5">
                  <ProviderIcon provider="oracle" size={13} />
                  <span className="font-semibold text-[#142B4A] text-xs">Oracle Cloud</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#168568] font-semibold">
                  <PulsingStatusDot color="emerald" />
                  Connected
                </div>
                <span className="font-mono text-[10px] text-[#68768A]">18.8 GB</span>
              </div>
            </div>
          </div>
        </SpotlightCard>

        {/* Section 3: Recent Activity */}
        <SpotlightCard className="flex flex-col justify-between rounded-xl border border-[#E8E0D1] bg-white p-3.5 sm:p-4 shadow-2xs hover:border-[#C49A3A]/40 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-start gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FFF8E7] text-[#C49A3A]">
                  <Activity size={13} />
                </div>
                <div>
                  <h3 className="font-palatino font-bold text-xs sm:text-sm text-[#142B4A]">Recent Activity</h3>
                  <p className="font-alora text-[10px] text-[#68768A]">Latest operations &amp; logs</p>
                </div>
              </div>
              <Link
                to="/app/activity"
                className="inline-flex h-6 items-center justify-center rounded-md border border-[#E8E0D1] bg-white px-2 text-[10px] font-semibold text-[#142B4A] hover:bg-[#FAF6ED] transition-colors font-alora"
              >
                View all
              </Link>
            </div>

            {/* Event List */}
            <div className="space-y-1.5 pt-0.5 text-xs font-alora">
              {audit.data && audit.data.length > 0 ? (
                audit.data.slice(0, 4).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-2 py-0.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#FAF6ED] text-[#C49A3A]">
                        <FileText size={12} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#142B4A] text-xs">{entry.action}</p>
                        <p className="font-mono text-[10px] text-[#68768A] truncate">
                          {entry.resource_id ? `${entry.resource_id.slice(0, 10)}…` : "Authorization"}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-[#68768A] shrink-0">
                      {new Date(entry.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2 py-0.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                        <FileText size={12} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#142B4A] text-xs">
                          Uploaded <span className="font-bold">design-system.zip</span>
                        </p>
                        <p className="text-[10px] text-[#68768A] truncate">Azure Blob • 850 MB</p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-[#68768A] shrink-0">10:24 AM</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 py-0.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                        <Cloud size={12} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#142B4A] text-xs">
                          Connected <span className="font-bold">Google Cloud</span>
                        </p>
                        <p className="text-[10px] text-[#68768A] truncate">Cloud provider • Success</p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-[#68768A] shrink-0">09:41 AM</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 py-0.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700">
                        <Zap size={12} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#142B4A] text-xs">
                          Routed <span className="font-bold">dataset.csv</span>
                        </p>
                        <p className="text-[10px] text-[#68768A] truncate">Smart Router • Standard</p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-[#68768A] shrink-0">08:12 AM</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 py-0.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-700">
                        <Cloud size={12} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#142B4A] text-xs">
                          Connected <span className="font-bold">AWS S3</span>
                        </p>
                        <p className="text-[10px] text-[#68768A] truncate">Cloud provider • Success</p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-[#68768A] shrink-0">Yesterday</span>
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
