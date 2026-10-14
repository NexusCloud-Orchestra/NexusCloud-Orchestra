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

import heroIllustration from "../../assets/nexuscloud-orchestration-hero.png"
import { useConnections, useFiles, useQuota, useAuditLogs } from "../../hooks/use-data"
import { requestDownload } from "../../api/files"
import { formatBytes } from "../../lib/format"
import { useToast } from "../../state/toast"
import { ProviderIcon } from "../../components/ui/cloud-logos"
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
    lastModified: "Oct 15, 2026  10:24 AM",
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
    lastModified: "Oct 14, 2026  06:41 PM",
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
    lastModified: "Oct 14, 2026  11:20 AM",
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
    lastModified: "Oct 13, 2026  02:18 AM",
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
    lastModified: "Oct 12, 2026  09:05 PM",
    mimeType: "application/pdf",
  },
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

  // Selected item state for inspector
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "metadata" | "routing" | "versions">("overview")
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  // Merge real files with reference items
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

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* ── 2. HERO SECTION WITH SUPPLIED IMAGE ── */}
      <section className="relative overflow-hidden rounded-3xl border border-[#E8E0D1] bg-[#FFFDF8] p-6 lg:p-8 shadow-xs">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          {/* Left: Hero Copy and Actions (lg:col-span-5) */}
          <div className="flex flex-col justify-between lg:col-span-5">
            <div>
              <p className="font-mono text-xs font-semibold tracking-wider uppercase text-[#C49A3A] mb-2">
                NEXUSCLOUD CONTROL PLANE
              </p>
              <h1 className="font-palatino text-3xl font-bold tracking-tight text-[#142B4A] sm:text-4xl lg:text-[40px] leading-tight mb-3">
                Your Cloud Workspace
              </h1>
              <p className="text-sm font-normal leading-relaxed text-[#68768A] mb-6 max-w-md">
                Unify, manage and orchestrate all your cloud storage. Connect providers, upload files, automate placement, and monitor capacity in one place.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <button
                  type="button"
                  onClick={() => navigate("/app/clouds?connect=1")}
                  className="inline-flex items-center gap-2 rounded-full bg-[#C49A3A] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#A77B26] active:scale-98"
                >
                  <Plus size={16} />
                  Connect Cloud Provider
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/app/router")}
                  className="inline-flex items-center gap-2 rounded-full border border-[#E8E0D1] bg-white px-5 py-2.5 text-xs sm:text-sm font-medium text-[#142B4A] shadow-2xs transition-colors hover:border-[#C49A3A] hover:bg-[#FAF6ED] active:scale-98"
                >
                  <Settings size={15} className="text-[#68768A]" />
                  Explore Smart Router
                </button>
              </div>
            </div>

            {/* 4 Feature Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#E8E0D1]/60">
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF8E7] text-[#C49A3A]">
                  <Cloud size={15} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#142B4A]">Multi-Cloud</p>
                  <p className="text-[11px] text-[#68768A]">Single storage pool</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF8E7] text-[#C49A3A]">
                  <Zap size={15} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#142B4A]">Smart Placement</p>
                  <p className="text-[11px] text-[#68768A]">AI-driven routing</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF8E7] text-[#C49A3A]">
                  <Lock size={15} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#142B4A]">Zero Lock-in</p>
                  <p className="text-[11px] text-[#68768A]">Your data, your control</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF8E7] text-[#C49A3A]">
                  <ShieldCheck size={15} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#142B4A]">Enterprise Ready</p>
                  <p className="text-[11px] text-[#68768A]">Secure and compliant</p>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Actual Supplied Image Asset (lg:col-span-4 ~34-40% width) */}
          <div className="flex items-center justify-center lg:col-span-4 py-2">
            <img
              src={heroIllustration}
              alt="NexusCloud Multi-Cloud Orchestration"
              className="w-full max-w-[390px] h-auto object-contain mx-auto select-none transition-transform duration-300 hover:scale-[1.02]"
              loading="eager"
            />
          </div>

          {/* Right: Multi-Cloud Orchestration Summary Panel (lg:col-span-3) */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#E8E0D1] bg-white/90 p-5 shadow-2xs lg:col-span-3 min-h-[260px]">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFF8E7] border border-[#C49A3A]/40 text-[#C49A3A]">
                  <Plus size={14} />
                </div>
                <h3 className="font-bold text-sm text-[#142B4A]">
                  Multi-Cloud Orchestration
                </h3>
              </div>

              <ul className="space-y-3.5 text-xs text-[#344256]">
                <li className="flex items-start gap-2.5">
                  <Check size={15} className="text-[#168568] shrink-0 mt-0.5" />
                  <span>Single storage pool across providers</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={15} className="text-[#168568] shrink-0 mt-0.5" />
                  <span>Zero lock-in, intelligent routing</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={15} className="text-[#168568] shrink-0 mt-0.5" />
                  <span>Secure and encrypted by default</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={15} className="text-[#168568] shrink-0 mt-0.5" />
                  <span>Optimized for cost, performance and availability</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-[#E8E0D1]/60 flex items-center justify-between text-2xs text-[#68768A]">
              <span className="font-mono uppercase tracking-wider text-[#A77B26] font-semibold">Active Mesh</span>
              <span className="flex items-center gap-1 text-[#168568] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-[#168568]" /> 100% Operational
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. FOUR KPI CARDS ── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {/* KPI 1: TOTAL STORED DATA */}
        <div className="flex items-center justify-between rounded-2xl border border-[#E8E0D1] bg-white p-5 shadow-2xs hover:border-[#C49A3A]/50 transition-colors">
          <div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF8E7] text-[#C49A3A] mb-3">
              <HardDrive size={18} />
            </div>
            <p className="font-mono text-[10px] font-semibold tracking-wider uppercase text-[#68768A]">
              TOTAL STORED DATA
            </p>
            <p className="font-bold text-2xl lg:text-[28px] text-[#142B4A] tracking-tight mt-0.5">
              {totalStoredFormatted}
            </p>
            <p className="text-xs text-[#68768A] mt-1">Across all connected clouds</p>
          </div>

          {/* Donut Gauge (68% + 12%) */}
          <div className="flex flex-col items-center shrink-0">
            <div className="relative h-16 w-16">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E8E0D1"
                  strokeWidth="3.2"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#C49A3A"
                  strokeWidth="3.2"
                  strokeDasharray="68, 100"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-[#142B4A]">
                68%
              </div>
            </div>
            <span className="mt-1 text-[11px] font-semibold text-[#168568] flex items-center">
              ↑ 12%
            </span>
          </div>
        </div>

        {/* KPI 2: USABLE CAPACITY */}
        <div className="flex items-center justify-between rounded-2xl border border-[#E8E0D1] bg-white p-5 shadow-2xs hover:border-[#C49A3A]/50 transition-colors">
          <div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF8E7] text-[#C49A3A] mb-3">
              <Layers size={18} />
            </div>
            <p className="font-mono text-[10px] font-semibold tracking-wider uppercase text-[#68768A]">
              USABLE CAPACITY
            </p>
            <p className="font-bold text-2xl lg:text-[28px] text-[#142B4A] tracking-tight mt-0.5">
              {usableCapacityFormatted}
            </p>
            <p className="text-xs text-[#68768A] mt-1">Free tier pool • No overage</p>
          </div>

          {/* Ascending Step Bars Graphic */}
          <div className="flex items-end gap-1.5 h-12 shrink-0 pb-1">
            <span className="w-2 rounded-t-sm bg-[#C49A3A]/40 h-3" />
            <span className="w-2 rounded-t-sm bg-[#C49A3A]/60 h-5" />
            <span className="w-2 rounded-t-sm bg-[#C49A3A]/80 h-7" />
            <span className="w-2 rounded-t-sm bg-[#C49A3A] h-9" />
            <span className="w-2 rounded-t-sm bg-[#A77B26] h-12" />
          </div>
        </div>

        {/* KPI 3: CONNECTED CLOUDS */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E8E0D1] bg-white p-5 shadow-2xs hover:border-[#C49A3A]/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF8E7] text-[#C49A3A]">
              <Cloud size={18} />
            </div>
            <Link
              to="/app/clouds"
              title="Manage Cloud Providers"
              className="text-[#68768A] hover:text-[#142B4A] transition-colors"
            >
              <ChevronRight size={17} />
            </Link>
          </div>

          <div className="flex items-end justify-between mt-3">
            <div>
              <p className="font-mono text-[10px] font-semibold tracking-wider uppercase text-[#68768A]">
                CONNECTED CLOUDS
              </p>
              <p className="font-bold text-2xl lg:text-[28px] text-[#142B4A] tracking-tight mt-0.5">
                {connectedCloudsCount}
              </p>
              <p className="text-xs text-[#68768A] mt-1">Active and healthy</p>
            </div>

            {/* Provider mini logo pills */}
            <div className="flex items-center -space-x-1 shrink-0 pb-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E8E0D1] bg-white p-1 shadow-2xs">
                <ProviderIcon provider="aws" size={14} />
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E8E0D1] bg-white p-1 shadow-2xs">
                <ProviderIcon provider="gcp" size={14} />
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E8E0D1] bg-white p-1 shadow-2xs">
                <ProviderIcon provider="azure" size={14} />
              </div>
            </div>
          </div>
        </div>

        {/* KPI 4: ACTIVE ROUTING */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E8E0D1] bg-white p-5 shadow-2xs hover:border-[#C49A3A]/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF8E7] text-[#C49A3A]">
              <Zap size={18} />
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              + Live
            </span>
          </div>

          <div className="flex items-end justify-between mt-3">
            <div>
              <p className="font-mono text-[10px] font-semibold tracking-wider uppercase text-[#68768A]">
                ACTIVE ROUTING
              </p>
              <p className="font-bold text-2xl lg:text-[28px] text-[#142B4A] tracking-tight mt-0.5">
                {activeRoutingCount}
              </p>
              <p className="text-xs text-[#68768A] mt-1">Smart placement enabled</p>
            </div>

            {/* Golden Sparkline Curve */}
            <div className="h-10 w-24 shrink-0 pb-1">
              <svg viewBox="0 0 100 40" className="h-full w-full overflow-visible">
                <path
                  d="M0 32 L25 24 L50 28 L75 12 L100 6"
                  fill="none"
                  stroke="#C49A3A"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="0" cy="32" r="2.5" fill="#C49A3A" />
                <circle cx="25" cy="24" r="2.5" fill="#C49A3A" />
                <circle cx="50" cy="28" r="2.5" fill="#C49A3A" />
                <circle cx="75" cy="12" r="2.5" fill="#C49A3A" />
                <circle cx="100" cy="6" r="3" fill="#A77B26" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. UNIFIED FILTER TOOLBAR ── */}
      <section className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Object Type Buttons */}
          <button
            type="button"
            onClick={() => setObjectFilter("all")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              objectFilter === "all"
                ? "bg-[#C49A3A] text-white shadow-xs"
                : "border border-[#E8E0D1] bg-white text-[#344256] hover:bg-[#FAF6ED]"
            }`}
          >
            All Objects
          </button>
          <button
            type="button"
            onClick={() => setObjectFilter("files")}
            className={`rounded-xl px-4 py-2 text-xs font-medium transition-all ${
              objectFilter === "files"
                ? "bg-[#C49A3A] text-white shadow-xs font-semibold"
                : "border border-[#E8E0D1] bg-white text-[#344256] hover:bg-[#FAF6ED]"
            }`}
          >
            Files
          </button>
          <button
            type="button"
            onClick={() => setObjectFilter("folders")}
            className={`rounded-xl px-4 py-2 text-xs font-medium transition-all ${
              objectFilter === "folders"
                ? "bg-[#C49A3A] text-white shadow-xs font-semibold"
                : "border border-[#E8E0D1] bg-white text-[#344256] hover:bg-[#FAF6ED]"
            }`}
          >
            Folders
          </button>

          {/* Provider Select Dropdown */}
          <div className="relative">
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="appearance-none rounded-xl border border-[#E8E0D1] bg-white pl-3.5 pr-8 py-2 text-xs font-medium text-[#344256] hover:border-[#C49A3A] focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="all">All Providers</option>
              <option value="aws">AWS S3</option>
              <option value="gcp">Google Cloud</option>
              <option value="azure">Azure Blob</option>
              <option value="oracle">Oracle Cloud</option>
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#68768A]" />
          </div>

          {/* Storage Mode Dropdown */}
          <div className="relative">
            <select
              value={storageModeFilter}
              onChange={(e) => setStorageModeFilter(e.target.value)}
              className="appearance-none rounded-xl border border-[#E8E0D1] bg-white pl-3.5 pr-8 py-2 text-xs font-medium text-[#344256] hover:border-[#C49A3A] focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="all">All Storage Modes</option>
              <option value="Standard">Standard</option>
              <option value="Cool">Cool</option>
              <option value="Archive">Archive</option>
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#68768A]" />
          </div>

          {/* File Types Dropdown */}
          <div className="relative">
            <select
              value={fileTypeFilter}
              onChange={(e) => setFileTypeFilter(e.target.value)}
              className="appearance-none rounded-xl border border-[#E8E0D1] bg-white pl-3.5 pr-8 py-2 text-xs font-medium text-[#344256] hover:border-[#C49A3A] focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="all">All File Types</option>
              <option value="pdf">PDF Documents</option>
              <option value="csv">CSV Datasets</option>
              <option value="zip">ZIP Archives</option>
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#68768A]" />
          </div>
        </div>

        {/* Right Toolbar Controls (Search, View Mode, Sort) */}
        <div className="flex items-center gap-2.5">
          {/* Search Input */}
          <div className="relative w-64 lg:w-72">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#68768A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, type, or provider..."
              className="h-9 w-full rounded-xl border border-[#E8E0D1] bg-white pl-9 pr-3 text-xs text-[#142B4A] placeholder:text-[#68768A] focus:border-[#C49A3A] focus:outline-none shadow-2xs"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
                viewMode === "list"
                  ? "border-[#C49A3A] bg-[#FFF8E7] text-[#C49A3A]"
                  : "border-[#E8E0D1] bg-white text-[#68768A] hover:bg-[#FAF6ED]"
              }`}
              title="List view"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
                viewMode === "grid"
                  ? "border-[#C49A3A] bg-[#FFF8E7] text-[#C49A3A]"
                  : "border-[#E8E0D1] bg-white text-[#68768A] hover:bg-[#FAF6ED]"
              }`}
              title="Grid view"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
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
              className="appearance-none rounded-xl border border-[#E8E0D1] bg-white pl-3 pr-7 py-2 text-xs font-medium text-[#344256] hover:border-[#C49A3A] focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="size">Size</option>
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#68768A]" />
          </div>
        </div>
      </section>

      {/* ── 5. INTEGRATED FILE WORKSPACE (SPLIT 2-COLUMN) ── */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
        {/* Left Panel: Table (~64% width, lg:col-span-8) */}
        <div className="overflow-hidden rounded-2xl border border-[#E8E0D1] bg-white shadow-2xs lg:col-span-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="border-b border-[#E8E0D1] bg-[#FAF6ED]/70 font-mono text-[10px] font-semibold tracking-wider uppercase text-[#68768A]">
                <tr>
                  <th className="py-3 pl-4 pr-2 w-8">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      className="rounded-sm border-[#E8E0D1] text-[#C49A3A] focus:ring-[#C49A3A]"
                    />
                  </th>
                  <th className="py-3 px-3 font-semibold">Name</th>
                  <th className="py-3 px-3 font-semibold">Provider</th>
                  <th className="py-3 px-3 font-semibold">Storage Mode</th>
                  <th className="py-3 px-3 font-semibold text-right">Size</th>
                  <th className="py-3 px-3 font-semibold">Last Modified</th>
                  <th className="py-3 pr-4 pl-2 w-8 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D1]/70">
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
                      <td className="py-3.5 pl-4 pr-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => setSelectedItemId((prev) => (prev === item.id ? null : item.id))}
                          aria-label={`Select ${item.name}`}
                          className="rounded-sm border-[#E8E0D1] text-[#C49A3A] focus:ring-[#C49A3A]"
                        />
                      </td>

                      {/* Icon + Name */}
                      <td className="py-3.5 px-3 min-w-[190px]">
                        <div className="flex items-center gap-2.5">
                          {item.type === "folder" ? (
                            <Folder size={17} className="text-[#C49A3A] shrink-0 fill-[#C49A3A]/20" />
                          ) : (
                            <FileText size={17} className="text-[#68768A] shrink-0" />
                          )}
                          <span className="font-semibold text-[#142B4A] truncate max-w-[200px]">
                            {item.name}
                          </span>
                        </div>
                      </td>

                      {/* Provider Logo Mark */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <ProviderIcon provider={item.provider} size={16} />
                        </div>
                      </td>

                      {/* Storage Mode Badge */}
                      <td className="py-3.5 px-3">
                        {item.storageMode === "Standard" && (
                          <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-[11px] font-medium text-blue-700">
                            Standard
                          </span>
                        )}
                        {item.storageMode === "Cool" && (
                          <span className="inline-block rounded-full border border-teal-200 bg-teal-50 px-3 py-0.5 text-[11px] font-medium text-teal-700">
                            Cool
                          </span>
                        )}
                        {item.storageMode === "Archive" && (
                          <span className="inline-block rounded-full border border-purple-200 bg-purple-50 px-3 py-0.5 text-[11px] font-medium text-purple-700">
                            Archive
                          </span>
                        )}
                      </td>

                      {/* Size */}
                      <td className="py-3.5 px-3 text-right font-mono text-xs text-[#142B4A]">
                        {item.sizeFormatted}
                      </td>

                      {/* Last Modified */}
                      <td className="py-3.5 px-3 text-[#68768A] text-xs font-mono whitespace-nowrap">
                        {item.lastModified}
                      </td>

                      {/* Row Action */}
                      <td className="py-3.5 pr-4 pl-2 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            void handleDownload(item)
                          }}
                          className="text-[#68768A] hover:text-[#142B4A] p-1 rounded-sm hover:bg-black/5"
                          title="Actions"
                        >
                          <MoreVertical size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel: Contextual Inspector (~36% width, lg:col-span-4) */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E8E0D1] bg-white p-5 shadow-2xs lg:col-span-4 min-h-[360px]">
          <div>
            {/* Header Tabs */}
            <div className="flex items-center gap-4 border-b border-[#E8E0D1] pb-3 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`pb-1 transition-colors ${
                  activeTab === "overview"
                    ? "border-b-2 border-[#C49A3A] font-bold text-[#C49A3A]"
                    : "text-[#68768A] hover:text-[#142B4A]"
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("metadata")}
                className={`pb-1 transition-colors ${
                  activeTab === "metadata"
                    ? "border-b-2 border-[#C49A3A] font-bold text-[#C49A3A]"
                    : "text-[#68768A] hover:text-[#142B4A]"
                }`}
              >
                Metadata
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("routing")}
                className={`pb-1 transition-colors ${
                  activeTab === "routing"
                    ? "border-b-2 border-[#C49A3A] font-bold text-[#C49A3A]"
                    : "text-[#68768A] hover:text-[#142B4A]"
                }`}
              >
                Routing
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("versions")}
                className={`pb-1 transition-colors ${
                  activeTab === "versions"
                    ? "border-b-2 border-[#C49A3A] font-bold text-[#C49A3A]"
                    : "text-[#68768A] hover:text-[#142B4A]"
                }`}
              >
                Versions
              </button>
            </div>

            {/* Contextual Body */}
            {selectedItem ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FAF6ED] border border-[#E8E0D1]">
                    {selectedItem.type === "folder" ? (
                      <Folder size={20} className="text-[#C49A3A]" />
                    ) : (
                      <FileText size={20} className="text-[#68768A]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-sm text-[#142B4A]">{selectedItem.name}</p>
                    <p className="text-2xs font-mono text-[#68768A] uppercase">
                      {selectedItem.type} • {selectedItem.storageMode}
                    </p>
                  </div>
                </div>

                {activeTab === "overview" && (
                  <div className="space-y-2.5 rounded-xl border border-[#E8E0D1] bg-[#FAF6ED]/40 p-3.5 text-xs font-mono">
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
                  <div className="space-y-2.5 rounded-xl border border-[#E8E0D1] bg-[#FAF6ED]/40 p-3.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#68768A]">MIME Type:</span>
                      <span className="truncate max-w-[150px] text-[#142B4A]">{selectedItem.mimeType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#68768A]">Object ID:</span>
                      <span className="text-[#C49A3A]">{selectedItem.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#68768A]">Modified:</span>
                      <span className="text-[#142B4A]">{selectedItem.lastModified}</span>
                    </div>
                  </div>
                )}

                {activeTab === "routing" && (
                  <div className="space-y-2.5 rounded-xl border border-[#E8E0D1] bg-[#FAF6ED]/40 p-3.5 text-xs font-mono">
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
                      <span className="text-[#142B4A]">Single Cloud Managed</span>
                    </div>
                  </div>
                )}

                {activeTab === "versions" && (
                  <div className="space-y-2 rounded-xl border border-[#E8E0D1] bg-[#FAF6ED]/40 p-3.5 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#142B4A]">v1.0 (Current)</span>
                      <span className="text-[#168568] text-2xs">Active</span>
                    </div>
                    <p className="text-2xs text-[#68768A]">Committed {selectedItem.lastModified}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => void handleDownload(selectedItem)}
                  disabled={downloadingId === selectedItem.id}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#142B4A] hover:bg-[#0B1B32] text-white py-2.5 text-xs font-semibold shadow-xs transition-colors"
                >
                  <Download size={14} />
                  {downloadingId === selectedItem.id ? "Authorizing Presigned URL..." : "Download File"}
                </button>
              </div>
            ) : (
              /* Reference Empty State */
              <div className="flex flex-col items-center justify-center text-center p-8 my-auto">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#E8E0D1] bg-[#FAF6ED] text-[#68768A] mb-3">
                  <FileText size={22} />
                </div>
                <h4 className="font-bold text-base text-[#142B4A]">No object selected</h4>
                <p className="text-xs text-[#68768A] mt-1 max-w-xs leading-relaxed">
                  Select a file or folder from the list to view details, metadata, and actions.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#E8E0D1]/60 flex items-center justify-between text-2xs font-mono text-[#68768A]">
            <span>{filteredItems.length} objects available</span>
            <Link to="/app/files" className="font-bold text-[#142B4A] hover:text-[#C49A3A] flex items-center gap-1">
              All Files <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. THREE SUPPORTING SECTIONS ── */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Section 1: Storage Distribution */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E8E0D1] bg-white p-5 shadow-2xs">
          <div>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF8E7] text-[#C49A3A]">
                <PieChart size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#142B4A]">Storage Distribution</h3>
                <p className="text-xs text-[#68768A]">Data distribution across connected clouds</p>
              </div>
            </div>

            {/* Donut Chart + Legend */}
            <div className="flex items-center justify-between gap-4 py-2">
              {/* Donut Chart */}
              <div className="relative h-28 w-28 shrink-0">
                <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90">
                  {/* Base Track */}
                  <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#E8E0D1" strokeWidth="6" />
                  {/* AWS S3: 40% (offset 0) */}
                  <circle
                    cx="21"
                    cy="21"
                    r="15.91549430918954"
                    fill="transparent"
                    stroke="#FF9900"
                    strokeWidth="6"
                    strokeDasharray="40 60"
                    strokeDashoffset="0"
                  />
                  {/* Google Cloud: 30% (offset -40) */}
                  <circle
                    cx="21"
                    cy="21"
                    r="15.91549430918954"
                    fill="transparent"
                    stroke="#4285F4"
                    strokeWidth="6"
                    strokeDasharray="30 70"
                    strokeDashoffset="-40"
                  />
                  {/* Azure Blob: 20% (offset -70) */}
                  <circle
                    cx="21"
                    cy="21"
                    r="15.91549430918954"
                    fill="transparent"
                    stroke="#0078D4"
                    strokeWidth="6"
                    strokeDasharray="20 80"
                    strokeDashoffset="-70"
                  />
                  {/* Oracle Cloud: 8% (offset -90) */}
                  <circle
                    cx="21"
                    cy="21"
                    r="15.91549430918954"
                    fill="transparent"
                    stroke="#C74634"
                    strokeWidth="6"
                    strokeDasharray="8 92"
                    strokeDashoffset="-90"
                  />
                  {/* Others: 2% (offset -98) */}
                  <circle
                    cx="21"
                    cy="21"
                    r="15.91549430918954"
                    fill="transparent"
                    stroke="#68768A"
                    strokeWidth="6"
                    strokeDasharray="2 98"
                    strokeDashoffset="-98"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-bold text-xs text-[#142B4A] leading-tight">248.5 GB</span>
                  <span className="text-[10px] text-[#68768A]">Total</span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-1.5 text-xs flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#FF9900]" />
                    <span className="text-[#344256]">AWS S3</span>
                  </div>
                  <div className="font-mono text-2xs text-[#68768A]">
                    <span className="font-bold text-[#142B4A]">98.4 GB</span> 40%
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#4285F4]" />
                    <span className="text-[#344256]">Google Cloud</span>
                  </div>
                  <div className="font-mono text-2xs text-[#68768A]">
                    <span className="font-bold text-[#142B4A]">74.6 GB</span> 30%
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#0078D4]" />
                    <span className="text-[#344256]">Azure Blob</span>
                  </div>
                  <div className="font-mono text-2xs text-[#68768A]">
                    <span className="font-bold text-[#142B4A]">49.7 GB</span> 20%
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#C74634]" />
                    <span className="text-[#344256]">Oracle Cloud</span>
                  </div>
                  <div className="font-mono text-2xs text-[#68768A]">
                    <span className="font-bold text-[#142B4A]">18.8 GB</span> 8%
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#68768A]" />
                    <span className="text-[#344256]">Others</span>
                  </div>
                  <div className="font-mono text-2xs text-[#68768A]">
                    <span className="font-bold text-[#142B4A]">7.0 GB</span> 2%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Cloud Provider Status */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E8E0D1] bg-white p-5 shadow-2xs">
          <div>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF8E7] text-[#C49A3A]">
                <Cloud size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#142B4A]">Cloud Provider Status</h3>
                <p className="text-xs text-[#68768A]">Connection health and availability</p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between py-1.5 border-b border-[#E8E0D1]/60">
                <div className="flex items-center gap-2.5">
                  <ProviderIcon provider="aws" size={18} />
                  <span className="text-xs font-semibold text-[#142B4A]">AWS S3</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#168568] font-medium">
                  <span className="h-2 w-2 rounded-full bg-[#168568]" />
                  Connected
                </div>
                <span className="font-mono text-xs text-[#68768A]">98.4 GB</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-[#E8E0D1]/60">
                <div className="flex items-center gap-2.5">
                  <ProviderIcon provider="gcp" size={18} />
                  <span className="text-xs font-semibold text-[#142B4A]">Google Cloud</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#168568] font-medium">
                  <span className="h-2 w-2 rounded-full bg-[#168568]" />
                  Connected
                </div>
                <span className="font-mono text-xs text-[#68768A]">74.6 GB</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-[#E8E0D1]/60">
                <div className="flex items-center gap-2.5">
                  <ProviderIcon provider="azure" size={18} />
                  <span className="text-xs font-semibold text-[#142B4A]">Azure Blob</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#168568] font-medium">
                  <span className="h-2 w-2 rounded-full bg-[#168568]" />
                  Connected
                </div>
                <span className="font-mono text-xs text-[#68768A]">49.7 GB</span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2.5">
                  <ProviderIcon provider="oracle" size={18} />
                  <span className="text-xs font-semibold text-[#142B4A]">Oracle Cloud</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#168568] font-medium">
                  <span className="h-2 w-2 rounded-full bg-[#168568]" />
                  Connected
                </div>
                <span className="font-mono text-xs text-[#68768A]">18.8 GB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Recent Activity */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E8E0D1] bg-white p-5 shadow-2xs">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF8E7] text-[#C49A3A]">
                  <Activity size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#142B4A]">Recent Activity</h3>
                  <p className="text-xs text-[#68768A]">Latest file operations and system events</p>
                </div>
              </div>
              <Link
                to="/app/activity"
                className="rounded-lg border border-[#E8E0D1] bg-white px-2.5 py-1 text-2xs font-semibold text-[#142B4A] hover:bg-[#FAF6ED] transition-colors"
              >
                View all
              </Link>
            </div>

            {/* Event List */}
            <div className="space-y-3 pt-1 text-xs">
              {audit.data && audit.data.length > 0 ? (
                audit.data.slice(0, 4).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-2 py-1">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FAF6ED] text-[#C49A3A]">
                        <FileText size={13} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#142B4A]">{entry.action}</p>
                        <p className="font-mono text-2xs text-[#68768A] truncate">
                          {entry.resource_id ? `${entry.resource_id.slice(0, 12)}…` : "System authorization"}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-2xs text-[#68768A] shrink-0">
                      {new Date(entry.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2 py-1">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                        <FileText size={13} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#142B4A]">
                          Uploaded <span className="font-bold">design-system.zip</span>
                        </p>
                        <p className="text-2xs text-[#68768A] truncate">Azure Blob • 850 MB</p>
                      </div>
                    </div>
                    <span className="font-mono text-2xs text-[#68768A] shrink-0">10:24 AM</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 py-1">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                        <Cloud size={13} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#142B4A]">
                          Connected <span className="font-bold">Google Cloud</span>
                        </p>
                        <p className="text-2xs text-[#68768A] truncate">Cloud provider • Success</p>
                      </div>
                    </div>
                    <span className="font-mono text-2xs text-[#68768A] shrink-0">09:41 AM</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 py-1">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                        <Zap size={13} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#142B4A]">
                          Routed <span className="font-bold">dataset.csv</span>
                        </p>
                        <p className="text-2xs text-[#68768A] truncate">Smart Router • Standard tier</p>
                      </div>
                    </div>
                    <span className="font-mono text-2xs text-[#68768A] shrink-0">08:12 AM</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 py-1">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                        <Cloud size={13} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#142B4A]">
                          Connected <span className="font-bold">AWS S3</span>
                        </p>
                        <p className="text-2xs text-[#68768A] truncate">Cloud provider • Success</p>
                      </div>
                    </div>
                    <span className="font-mono text-2xs text-[#68768A] shrink-0">Yesterday</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
