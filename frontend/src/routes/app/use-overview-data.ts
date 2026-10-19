import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useConnections, useFiles, useQuota, useAuditLogs } from "../../hooks/use-data"
import { requestDownload } from "../../api/files"
import { formatBytes } from "../../lib/format"
import { useToast } from "../../state/toast"
import type { FileRecord } from "../../types/api"

export interface WorkspaceItem {
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

export interface StorageDistributionItem {
  id: string
  name: string
  shortName: string
  color: string
  accentColor: string
  size: string
  percentage: number
  offset: number
}

export const REFERENCE_WORKSPACE_ITEMS: WorkspaceItem[] = [
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

export const STORAGE_DISTRIBUTION: StorageDistributionItem[] = [
  { id: "aws", name: "AWS S3", shortName: "AWS", color: "#DDA049", accentColor: "#FFF8E7", size: "98.4 GB", percentage: 40, offset: 0 },
  { id: "gcp", name: "Google Cloud", shortName: "Google", color: "#3B82F6", accentColor: "#EBF3FF", size: "74.6 GB", percentage: 30, offset: 40 },
  { id: "azure", name: "Azure Blob", shortName: "Azure", color: "#0284C7", accentColor: "#F0F9FF", size: "49.7 GB", percentage: 20, offset: 70 },
  { id: "oracle", name: "Oracle Cloud", shortName: "Oracle", color: "#EA580C", accentColor: "#FFF1EE", size: "18.8 GB", percentage: 8, offset: 90 },
  { id: "others", name: "Others", shortName: "Others", color: "#8B5CF6", accentColor: "#F1F5F9", size: "7.0 GB", percentage: 2, offset: 98 },
]

export function useOverviewData() {
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

    REFERENCE_WORKSPACE_ITEMS.forEach((ref) => {
      if (!list.some((item) => item.name === ref.name)) {
        list.push(ref)
      }
    })

    return list
  }, [files.data])

  const filteredItems = useMemo(() => {
    const items = allItems.filter((item) => {
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

    if (sortBy === "size") {
      items.sort((a, b) => b.sizeBytes - a.sizeBytes)
    }

    return items
  }, [allItems, objectFilter, providerFilter, storageModeFilter, fileTypeFilter, searchQuery, sortBy])

  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null
    return allItems.find((i) => i.id === selectedItemId) ?? null
  }, [allItems, selectedItemId])

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

  return {
    navigate,
    toast,
    quota,
    connections,
    files,
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
    allItems,
    filteredItems,
    selectedItem,
    handleDownload,
    totalStoredFormatted,
    usableCapacityFormatted,
    connectedCloudsCount,
    activeRoutingCount,
    activeDistributionItem,
    STORAGE_DISTRIBUTION,
  }
}
