import { useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  Download,
  Link2,
  Trash2,
  X,
  Upload,
  Search,
  ArrowUpDown,
  FileText,
  Cloud,
} from "lucide-react"
import { useFiles, useConnections } from "../../hooks/use-data"
import { useQueryClient } from "@tanstack/react-query"
import {
  deleteFile,
  deleteStripedFile,
  getStripedManifest,
  requestDownload,
  stripedChunkDownloadUrl,
} from "../../api/files"
import { ApiError } from "../../api/client"
import { useToast } from "../../state/toast"
import { queryKeys } from "../../state/query"
import { useUploads } from "../../state/uploads"
import { formatBytes, formatDateTime, fileExtension, formatRelative } from "../../lib/format"
import { providerName } from "../../lib/providers"
import { verifyStripeIndex } from "../../lib/striping"
import { PageHeader, Breadcrumb } from "../../components/layout/shell"
import { ErrorState, ListSkeleton } from "../../components/ui/states"
import { StatusBadge } from "../../components/ui/status"
import { Drawer } from "../../components/ui/drawer"
import { ConfirmModal } from "../../components/ui/modal"
import { Menu } from "../../components/ui/menu"
import { ProviderMark } from "../../components/ui/provider-mark"
import { ProviderBadge } from "../../components/ui/cloud-logos"
import { Button } from "../../components/ui/button"
import type { FileRecord } from "../../types/api"

type SortKey = "name" | "size" | "modified"
const MAX_BUFFERED_DOWNLOAD_BYTES = 512 * 1024 ** 2

interface BrowserFileWriter {
  write(data: ArrayBuffer): Promise<void>
  close(): Promise<void>
  abort(): Promise<void>
}

interface SaveFileWindow extends Window {
  showSaveFilePicker?: (options: { suggestedName: string }) => Promise<{
    createWritable(): Promise<BrowserFileWriter>
  }>
}

export function FilesPage() {
  const [params, setParams] = useSearchParams()
  const openFileId = params.get("file")
  const queryClient = useQueryClient()
  const toast = useToast()
  const filesQuery = useFiles()
  const connections = useConnections()
  const { activeCount } = useUploads()

  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "modified", dir: "desc" })
  const [filter, setFilter] = useState("")
  const [providerFilter, setProviderFilter] = useState<string>("all")
  const [deleteTarget, setDeleteTarget] = useState<FileRecord | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDropzone, setShowDropzone] = useState(false)

  const hasConnections = (connections.data?.length ?? 0) > 0

  const sorted = useMemo(() => {
    const list = [...(filesQuery.data ?? [])]
    list.sort((a, b) => {
      if (sort.key === "name") return a.original_name.localeCompare(b.original_name) * (sort.dir === "asc" ? 1 : -1)
      if (sort.key === "size") return (a.size_bytes - b.size_bytes) * (sort.dir === "asc" ? 1 : -1)
      const aTime = a.uploaded_at ? new Date(a.uploaded_at).getTime() : 0
      const bTime = b.uploaded_at ? new Date(b.uploaded_at).getTime() : 0
      return (aTime - bTime) * (sort.dir === "asc" ? 1 : -1)
    })
    return list
  }, [filesQuery.data, sort])

  const visible = useMemo(() => {
    let list = sorted
    if (providerFilter !== "all") {
      list = list.filter((f) => f.provider === providerFilter)
    }
    const needle = filter.trim().toLowerCase()
    if (!needle) return list
    return list.filter(
      (file) =>
        file.original_name.toLowerCase().includes(needle) ||
        providerName(file.provider).toLowerCase().includes(needle),
    )
  }, [sorted, filter, providerFilter])

  const openFile = openFileId ? sorted.find((file) => file.id === openFileId) ?? null : null

  async function download(file: FileRecord) {
    try {
      let url: string
      if (file.storage_mode === "striped") {
        const picker = (window as SaveFileWindow).showSaveFilePicker
        if (!picker && file.size_bytes > MAX_BUFFERED_DOWNLOAD_BYTES) {
          throw new Error("This browser cannot stream large downloads; use a browser with Save As support")
        }
        const handle = picker ? await picker.call(window, { suggestedName: file.original_name }) : null
        const manifest = await getStripedManifest(file.id)
        const ordered = [...manifest.chunks].sort((a, b) => a.index - b.index)
        if (!await verifyStripeIndex({ ...manifest, chunks: ordered })) {
          throw new Error("Cloud chunk index failed integrity validation")
        }
        if (!handle && manifest.size_bytes > MAX_BUFFERED_DOWNLOAD_BYTES) {
          throw new Error("This browser cannot stream large downloads; use a browser with Save As support")
        }
        const writer = handle ? await handle.createWritable() : null
        const pieces: ArrayBuffer[] = []
        try {
          for (const chunk of ordered) {
            const signed = await stripedChunkDownloadUrl(file.id, chunk.index)
            const response = await fetch(signed.url, { headers: signed.required_headers })
            if (!response.ok) throw new Error(`Could not fetch piece ${chunk.index + 1}`)
            const buffer = await response.arrayBuffer()
            if (writer) {
              await writer.write(buffer)
            } else {
              pieces.push(buffer)
            }
          }
          if (writer) {
            await writer.close()
            toast.notify(`Saved ${file.original_name}`, "success")
            return
          }
          const blob = new Blob(pieces, { type: file.mime_type || "application/octet-stream" })
          url = URL.createObjectURL(blob)
        } catch (caught) {
          if (writer) await writer.abort().catch(() => undefined)
          throw caught
        }
      } else {
        const ticket = await requestDownload(file.id)
        url = ticket.download_url
      }
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = file.original_name
      anchor.rel = "noopener"
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      if (file.storage_mode === "striped") window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
      toast.notify(`Download started for ${file.original_name}`, "success")
    } catch (caught) {
      toast.notify(caught instanceof Error ? caught.message : "Could not download the file", "error")
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.storage_mode === "striped") {
        await deleteStripedFile(deleteTarget.id)
      } else {
        await deleteFile(deleteTarget.id)
      }
      toast.notify(`${deleteTarget.original_name} deleted`, "success")
      setDeleteTarget(null)
      void queryClient.invalidateQueries({ queryKey: queryKeys.files })
      void queryClient.invalidateQueries({ queryKey: queryKeys.quota })
      void queryClient.invalidateQueries({ queryKey: queryKeys.connections })
    } catch (caught) {
      toast.notify(caught instanceof ApiError ? caught.message : "Delete failed", "error")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-4.5 pb-6">
      <PageHeader
        kicker="Virtual Storage"
        title="Files"
        description="Unified multi-cloud file browser. Direct-to-bucket uploads and downloads."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={showDropzone ? "secondary" : "gold"}
              size="md"
              onClick={() => {
                if (!hasConnections) {
                  toast.notify("Connect a cloud provider before uploading files", "neutral")
                  return
                }
                setShowDropzone((v) => !v)
              }}
              className="shadow-sm font-bold"
            >
              <Upload size={14} className="mr-1.5" />
              <span>{showDropzone ? "Close Upload Dropzone" : "Upload File to Mesh"}</span>
            </Button>
          </div>
        }
      />

      {/* Collapsible Dropzone */}
      {showDropzone && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <UploadZone onClose={() => setShowDropzone(false)} />
        </div>
      )}

      {/* Active Upload Queue */}
      {activeCount > 0 ? <UploadQueue /> : null}

      {/* Main Files Table Card */}
      <div className="rounded-xl border border-[#E8E0D1] bg-white shadow-xs overflow-hidden">
        {/* Toolbar: Breadcrumb + Filter + Search + Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E0D1] px-5 py-3 bg-[#FAF6ED]/40">
          <div className="flex items-center gap-3">
            <Breadcrumb trail={["NEXUSCLOUD", "FILES"]} />
            {filesQuery.data && (
              <span className="rounded-md border border-[#E8E0D1] bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-[#142B4A]">
                {filesQuery.data.length} {filesQuery.data.length === 1 ? "file" : "files"}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#68768A]"
                aria-hidden
              />
              <input
                type="search"
                aria-label="Search files"
                placeholder="Search files…"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="h-8 pl-8 pr-3 w-40 sm:w-52 rounded-lg border border-[#E8E0D1] bg-white text-xs text-[#142B4A] placeholder-[#68768A] focus:border-[#C49A3A] focus:outline-none transition-colors"
              />
            </div>

            {/* Provider Filter */}
            <select
              aria-label="Filter by cloud provider"
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-[#E8E0D1] bg-white text-xs text-[#142B4A] focus:border-[#C49A3A] focus:outline-none transition-colors cursor-pointer"
            >
              <option value="all">All Clouds</option>
              <option value="aws">AWS S3</option>
              <option value="gcp">Google Cloud</option>
              <option value="azure">Azure Blob</option>
              <option value="r2">Cloudflare R2</option>
              <option value="b2">Backblaze B2</option>
              <option value="oracle">Oracle Cloud</option>
              <option value="ibm">IBM Cloud</option>
              <option value="multi">Multi-Cloud Striped</option>
            </select>

            {/* Sort Menu */}
            <SortMenu sort={sort} onSort={(key, dir) => setSort({ key, dir })} />
          </div>
        </div>

        {/* Content Body */}
        {filesQuery.isLoading ? (
          <ListSkeleton rows={4} />
        ) : filesQuery.isError ? (
          <div className="p-8">
            <ErrorState error={filesQuery.error} onRetry={() => void filesQuery.refetch()} />
          </div>
        ) : visible.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#E8E0D1] bg-[#FAF6ED]/70 font-alora text-xs font-bold tracking-wider uppercase text-[#68768A]">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Name</th>
                  <th className="px-4 py-3.5 font-bold">Cloud Destination</th>
                  <th className="px-4 py-3.5 font-bold">Storage Mode</th>
                  <th className="px-4 py-3.5 font-bold text-right">Size</th>
                  <th className="px-4 py-3.5 font-bold hidden sm:table-cell">Uploaded</th>
                  <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D1]/60">
                {visible.map((file) => (
                  <FileRow
                    key={file.id}
                    file={file}
                    onOpen={() => setParams({ file: file.id }, { replace: true })}
                    onDelete={() => setDeleteTarget(file)}
                    onDownload={() => void download(file)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : !hasConnections ? (
          <div className="p-8 text-center max-w-md mx-auto">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E8E0D1] bg-[#FAF6ED] text-[#C49A3A] mx-auto mb-3">
              <Cloud size={19} />
            </div>
            <p className="text-sm font-bold text-[#142B4A]">No cloud storage connected</p>
            <p className="mt-1 text-xs text-[#68768A] leading-relaxed">
              Files are stored directly in your own cloud buckets. Connect a provider to begin uploading.
            </p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={() => (window.location.href = "/app/clouds?connect=1")}
            >
              Connect Cloud Provider
            </Button>
          </div>
        ) : filter || providerFilter !== "all" ? (
          <div className="p-8 text-center">
            <p className="text-xs font-semibold text-[#142B4A]">No matching files</p>
            <p className="mt-1 text-xs text-[#68768A]">
              No files match your current filters. Clear the search or filter to see all files.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setFilter("")
                setProviderFilter("all")
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="p-8 text-center max-w-md mx-auto">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E8E0D1] bg-[#FAF6ED] text-[#68768A] mx-auto mb-3">
              <FileText size={19} />
            </div>
            <p className="text-sm font-bold text-[#142B4A]">Your storage is empty</p>
            <p className="mt-1 text-xs text-[#68768A] leading-relaxed">
              Upload files to test multi-cloud placement. Large files can be split across clouds if you enable it in Settings; split files are not backed up.
            </p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={() => setShowDropzone(true)}
            >
              <Upload size={13} />
              <span>Upload your first file</span>
            </Button>
          </div>
        )}
      </div>

      {/* File Detail Drawer */}
      <Drawer
        open={Boolean(openFile)}
        onClose={() => setParams({}, { replace: true })}
        title={openFile?.original_name ?? ""}
        meta={openFile ? `${fileExtension(openFile.original_name)} · ${formatBytes(openFile.size_bytes)}` : undefined}
      >
        {openFile ? (
          <FileDetail
            file={openFile}
            connection={connections.data?.find((entry) => entry.id === openFile.connection_id) ?? null}
            onDownload={() => void download(openFile)}
            onDelete={() => setDeleteTarget(openFile)}
          />
        ) : null}
      </Drawer>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete file"
        confirmLabel={deleting ? "Deleting…" : "Delete file"}
        tone="danger"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        body={
          <p className="text-sm text-[#344256]">
            <span className="font-bold text-[#142B4A]">{deleteTarget?.original_name}</span> will be permanently deleted from{" "}
            {deleteTarget ? providerName(deleteTarget.provider) : "the cloud"} and removed from the NexusCloud index.
            This action cannot be undone.
          </p>
        }
      />
    </div>
  )
}

function FileRow({
  file,
  onOpen,
  onDelete,
  onDownload,
}: {
  file: FileRecord
  onOpen: () => void
  onDelete: () => void
  onDownload: () => void
}) {
  const ext = fileExtension(file.original_name)
  const isImage = ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)
  const isDoc = ["pdf", "doc", "docx", "txt", "md"].includes(ext)
  const isArchive = ["zip", "tar", "gz", "7z"].includes(ext)

  return (
    <tr className="hover:bg-[#FAF6ED]/60 transition-colors group">
      <td className="px-5 py-3.5">
        <button
          type="button"
          onClick={onOpen}
          title={file.original_name}
          className="flex items-center gap-3 text-left max-w-sm sm:max-w-md"
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-mono text-[10px] font-bold uppercase shadow-2xs ${
              isImage
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : isDoc
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : isArchive
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-slate-50 text-regal-navy border-slate-200"
            }`}
          >
            {ext || "FILE"}
          </span>
          <span className="truncate text-xs font-bold text-regal-navy group-hover:text-royal-gold transition-colors tracking-tight">
            {file.original_name}
          </span>
        </button>
      </td>
      <td className="px-4 py-3.5">
        <ProviderBadge provider={file.provider} />
      </td>
      <td className="px-4 py-3.5">
        {file.storage_mode === "striped" ? (
          <span className="inline-flex items-center rounded-md border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-mono font-semibold text-purple-800">
            Striped Mesh
          </span>
        ) : (
          <span className="inline-flex items-center rounded-md border border-[#E8E0D1] bg-[#FAF6ED] px-2.5 py-0.5 text-xs font-mono font-semibold text-[#142B4A]">
            Standard
          </span>
        )}
        {file.storage_mode === "striped" ? (
          <span className="ml-1.5 inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-mono font-semibold text-amber-900">
            Not backed up
          </span>
        ) : null}
      </td>
      <td className="px-4 py-3.5 text-right font-mono text-sm font-semibold text-[#142B4A]">
        {formatBytes(file.size_bytes)}
      </td>
      <td className="px-4 py-3.5 font-mono text-2xs text-muted-slate hidden sm:table-cell">
        {file.uploaded_at ? formatRelative(file.uploaded_at) : "pending"}
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            title={`Download ${file.original_name}`}
            onClick={onDownload}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-white text-muted-slate hover:text-regal-navy hover:border-royal-gold transition-colors shadow-2xs"
          >
            <Download size={13} />
          </button>
          <button
            type="button"
            title="Delete file"
            onClick={onDelete}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E8E0D1] bg-white text-[#C43D4B] hover:bg-[#C43D4B]/10 hover:border-[#C43D4B]/40 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </td>
    </tr>
  )
}

function SortMenu({
  sort,
  onSort,
}: {
  sort: { key: SortKey; dir: "asc" | "desc" }
  onSort: (key: SortKey, dir: "asc" | "desc") => void
}) {
  const items = [
    { label: "Modified · newest", key: "modified" as SortKey, dir: "desc" as const },
    { label: "Modified · oldest", key: "modified" as SortKey, dir: "asc" as const },
    { label: "Name · A to Z", key: "name" as SortKey, dir: "asc" as const },
    { label: "Name · Z to A", key: "name" as SortKey, dir: "desc" as const },
    { label: "Size · largest", key: "size" as SortKey, dir: "desc" as const },
    { label: "Size · smallest", key: "size" as SortKey, dir: "asc" as const },
  ]
  return (
    <Menu
      label="Sort files"
      trigger={
        <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E8E0D1] bg-white px-2.5 text-xs font-medium text-[#344256] hover:border-[#C49A3A] hover:text-[#142B4A] transition-colors cursor-pointer">
          <ArrowUpDown size={12} />
          <span>Sort</span>
        </span>
      }
      items={items.map((item) => ({
        label: `${sort.key === item.key && sort.dir === item.dir ? "● " : ""}${item.label}`,
        onSelect: () => onSort(item.key, item.dir),
      }))}
    />
  )
}

function FileDetail({
  file,
  connection,
  onDownload,
  onDelete,
}: {
  file: FileRecord
  connection: { id: string; display_name: string; bucket_name: string; region: string | null } | null
  onDownload: () => void
  onDelete: () => void
}) {
  const rows: Array<[string, string]> = [
    ["Name", file.original_name],
    ["Size", formatBytes(file.size_bytes)],
    ["MIME Type", file.mime_type || "application/octet-stream"],
    ["Cloud Destination", providerName(file.provider)],
    ["Storage Mode", file.storage_mode === "striped" ? "Multi-cloud striped chunk mesh (not backed up)" : "Single cloud container"],
    ["Status", file.status],
    ["Bucket / Container", connection ? `${connection.display_name} (${connection.bucket_name})` : "Multi-bucket index"],
    ["Region", connection?.region ?? "global"],
    ["Uploaded Timestamp", formatDateTime(file.uploaded_at)],
    ["Control Plane ID", file.id],
  ]

  return (
    <div className="flex flex-col gap-5 px-5 py-5">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E8E0D1] bg-[#FAF6ED] px-4 py-3.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#142B4A]">{file.original_name}</p>
          <p className="font-mono text-2xs uppercase tracking-wider text-[#68768A] mt-0.5">
            {fileExtension(file.original_name)} · {formatBytes(file.size_bytes)}
          </p>
        </div>
        <ProviderMark provider={file.provider} size={20} />
      </div>

      <dl className="flex flex-col divide-y divide-[#E8E0D1]/60">
        {rows.map(([term, value]) => (
          <div key={term} className="flex items-baseline justify-between gap-4 py-2">
            <dt className="text-2xs font-bold uppercase tracking-wider text-[#68768A]">{term}</dt>
            <dd className="max-w-[65%] truncate text-right font-mono text-xs font-medium text-[#142B4A]" title={value}>
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="rounded-lg border border-[#E8E0D1] bg-[#FAF6ED]/50 p-3 text-xs text-[#68768A] leading-relaxed">
        <p className="flex items-start gap-1.5">
          <Link2 size={13} className="mt-0.5 shrink-0 text-[#C49A3A]" />
          <span>
            {file.storage_mode === "striped"
              ? "Downloads reassemble chunks in-browser after SHA-256 verification. Presigned URLs expire in 60 minutes."
              : `Downloads use a direct presigned URL from ${providerName(file.provider)}. File bytes bypass NexusCloud servers.`}
          </span>
        </p>
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="primary" size="sm" className="flex-1" onClick={onDownload}>
          <Download size={13} />
          <span>Download</span>
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 size={13} />
          <span>Delete</span>
        </Button>
      </div>
    </div>
  )
}

function UploadZone({ onClose }: { onClose?: () => void }) {
  const { enqueue } = useUploads()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragOver(false)
        enqueue(Array.from(event.dataTransfer.files))
        if (onClose) onClose()
      }}
      className={`relative flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border-2 border-dashed p-5 transition-all ${
        dragOver ? "border-[#C49A3A] bg-[#FFF8E7]/50" : "border-[#E8E0D1] bg-[#FAF6ED]/40 hover:bg-[#FAF6ED]"
      }`}
    >
      <div className="flex items-center gap-3.5">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
            dragOver ? "border-[#C49A3A] bg-[#FFF8E7] text-[#C49A3A]" : "border-[#E8E0D1] bg-white text-[#68768A]"
          }`}
          aria-hidden
        >
          <Upload size={18} />
        </span>
        <div>
          <p className="text-xs font-bold text-[#142B4A]">
            {dragOver ? "Release to upload immediately" : "Drag and drop files here, or browse"}
          </p>
          <p className="text-2xs text-[#68768A] mt-0.5">
            Files up to 5 GiB. Multi-cloud striping triggers automatically above 16 MiB.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          aria-label="Select files to upload"
          onChange={(event) => {
            enqueue(Array.from(event.target.files ?? []))
            event.target.value = ""
            if (onClose) onClose()
          }}
        />
        <Button
          variant="primary"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          Select Files
        </Button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close upload dropzone"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E8E0D1] bg-white text-[#68768A] hover:text-[#142B4A]"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

function UploadQueue() {
  const { items, abort, clearFinished } = useUploads()

  return (
    <div className="rounded-xl border border-[#E8E0D1] bg-white shadow-xs overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#E8E0D1] px-5 py-3 bg-[#FAF6ED]/40">
        <span className="text-xs font-bold text-[#142B4A]">Upload Queue ({items.length})</span>
        <button
          type="button"
          className="flex items-center gap-1 text-2xs font-semibold text-[#68768A] hover:text-[#142B4A]"
          onClick={clearFinished}
        >
          <X size={11} aria-hidden />
          <span>Clear finished</span>
        </button>
      </div>
      <ul className="divide-y divide-[#E8E0D1]/60">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 px-5 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-xs font-semibold text-[#142B4A]">{item.name}</p>
                <p className="shrink-0 font-mono text-2xs text-[#68768A] tnum">{formatBytes(item.size)}</p>
              </div>
              <div className="mt-1.5 flex items-center gap-3">
                {item.status === "uploading" && item.progress !== null ? (
                  <div className="h-1.5 w-full max-w-48 rounded-full bg-[#FAF6ED] overflow-hidden">
                    <div className="h-full rounded-full bg-[#C49A3A] transition-all" style={{ width: `${item.progress}%` }} />
                  </div>
                ) : null}
                <QueueStatus item={item} />
              </div>
              {item.error ? <p className="mt-1 text-2xs text-[#C43D4B]">{item.error}</p> : null}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <p className="font-mono text-2xs uppercase tracking-wider text-[#68768A]">
                {item.destination ? providerName(item.destination.provider) : "routing…"}
              </p>
              {item.status === "uploading" || item.status === "queued" || item.status === "requesting" ? (
                <button
                  type="button"
                  onClick={() => abort(item.id)}
                  className="text-2xs font-semibold text-[#C43D4B] hover:underline"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function QueueStatus({ item }: { item: ReturnType<typeof useUploads>["items"][number] }) {
  const labels: Record<string, string> = {
    queued: "Queued",
    requesting: "Requesting URL…",
    uploading: item.progress !== null ? `Uploading ${item.progress}%` : "Uploading…",
    confirming: "Confirming…",
    done: "Completed",
    failed: "Failed",
    cancelled: "Cancelled",
  }
  const tone = item.status === "done" ? "ok" : item.status === "failed" ? "bad" : item.status === "cancelled" ? "neutral" : "busy"
  return <StatusBadge tone={tone}>{labels[item.status] ?? item.status}</StatusBadge>
}
