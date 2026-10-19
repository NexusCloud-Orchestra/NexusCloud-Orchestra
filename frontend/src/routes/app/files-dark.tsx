import { useRef, useState } from "react"
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
import { formatBytes, formatDateTime, fileExtension, formatRelative } from "../../lib/format"
import { providerName } from "../../lib/providers"
import { PageHeader, Breadcrumb } from "../../components/layout/shell"
import { ErrorState, ListSkeleton } from "../../components/ui/states"
import { StatusBadge } from "../../components/ui/status"
import { Drawer } from "../../components/ui/drawer"
import { ConfirmModal } from "../../components/ui/modal"
import { Menu } from "../../components/ui/menu"
import { ProviderMark } from "../../components/ui/provider-mark"
import { ProviderBadge } from "../../components/ui/cloud-logos"
import { useUploads } from "../../state/uploads"
import type { FileRecord } from "../../types/api"
import { useFilesData, type SortKey } from "./use-files-data"

export function FilesDark() {
  const {
    setParams,
    filesQuery,
    connections,
    activeCount,
    sort,
    setSort,
    filter,
    setFilter,
    providerFilter,
    setProviderFilter,
    deleteTarget,
    setDeleteTarget,
    deleting,
    showDropzone,
    setShowDropzone,
    hasConnections,
    visible,
    openFile,
    download,
    confirmDelete,
    toast,
  } = useFilesData()

  return (
    <div className="files-dark-page flex flex-col gap-4 sm:gap-4.5 pb-6 text-[#F5F0E6] bg-[#0B0A08]">
      <PageHeader
        kicker="Virtual Storage"
        title="Files"
        description="Unified multi-cloud file browser. Direct-to-bucket uploads and downloads."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!hasConnections) {
                  toast.notify("Connect a cloud provider before uploading files", "neutral")
                  return
                }
                setShowDropzone(!showDropzone)
              }}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-4 text-xs font-bold transition-all shadow-md cursor-pointer bg-[#C6A052] text-[#0B0A08] hover:bg-[#E0C078]"
            >
              <Upload size={14} strokeWidth={2.4} />
              <span>{showDropzone ? "Close Upload Dropzone" : "Upload File to Mesh"}</span>
            </button>
          </div>
        }
      />

      {/* Collapsible Dropzone in Dark Theme */}
      {showDropzone && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <UploadZoneDark onClose={() => setShowDropzone(false)} />
        </div>
      )}

      {/* Active Upload Queue in Dark Theme */}
      {activeCount > 0 ? <UploadQueueDark /> : null}

      {/* Main Files Table Card in Elevated Dark Espresso */}
      <div className="rounded-xl overflow-hidden border border-[#332A1B] bg-[#11100D] text-[#F5F0E6] shadow-md">
        {/* Toolbar: Breadcrumb + Filter + Search + Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#332A1B] px-5 py-3 bg-[#181610]">
          <div className="flex items-center gap-3">
            <Breadcrumb trail={["NEXUSCLOUD", "FILES"]} />
            {filesQuery.data && (
              <span className="rounded-md border border-[#332A1B] bg-[#11100D] px-2 py-0.5 font-mono text-[11px] font-bold text-[#F5F0E6]">
                {filesQuery.data.length} {filesQuery.data.length === 1 ? "file" : "files"}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#887D6B]"
                aria-hidden
              />
              <input
                type="search"
                aria-label="Filter files by name"
                placeholder="Search files…"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="h-8 pl-8 pr-3 w-40 sm:w-52 rounded-lg border border-[#332A1B] bg-[#181610] text-xs text-[#F5F0E6] placeholder-[#887D6B] focus:border-[#C6A052] focus:outline-none transition-colors"
              />
            </div>

            {/* Provider Filter */}
            <select
              aria-label="Filter by cloud provider"
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-[#332A1B] bg-[#181610] text-xs text-[#F5F0E6] focus:border-[#C6A052] focus:outline-none transition-colors cursor-pointer"
            >
              <option value="all">All Clouds</option>
              <option value="aws">AWS S3</option>
              <option value="gcp">Google Cloud Storage</option>
              <option value="azure">Azure Blob</option>
              <option value="r2">Cloudflare R2</option>
            </select>

            {/* Sort Menu */}
            <SortMenuDark sort={sort} onSort={(key, dir) => setSort({ key, dir })} />
          </div>
        </div>

        {/* Content States */}
        {filesQuery.isLoading ? (
          <div className="p-6">
            <ListSkeleton rows={5} />
          </div>
        ) : filesQuery.isError ? (
          <div className="p-6">
            <ErrorState error={filesQuery.error} onRetry={() => void filesQuery.refetch()} />
          </div>
        ) : visible.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#332A1B] bg-[#181610] font-alora text-xs font-bold tracking-wider uppercase text-[#887D6B]">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Name</th>
                  <th className="px-4 py-3.5 font-bold">Cloud Destination</th>
                  <th className="px-4 py-3.5 font-bold">Topology</th>
                  <th className="px-4 py-3.5 font-bold text-right">Size</th>
                  <th className="px-4 py-3.5 font-bold hidden sm:table-cell">Uploaded</th>
                  <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#332A1B]">
                {visible.map((file) => (
                  <FileRowDark
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
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#332A1B] bg-[#181610] text-[#C6A052] mx-auto mb-3">
              <Cloud size={19} />
            </div>
            <p className="text-sm font-bold text-[#F5F0E6]">No cloud storage connected</p>
            <p className="mt-1 text-xs text-[#887D6B] leading-relaxed">
              Files are stored directly in your own cloud buckets. Connect a provider to begin uploading.
            </p>
            <button
              type="button"
              className="mt-4 inline-flex h-8 items-center justify-center rounded-lg bg-[#C6A052] px-3.5 text-xs font-bold text-[#0B0A08] hover:bg-[#E0C078] transition-colors cursor-pointer"
              onClick={() => setShowDropzone(true)}
            >
              Connect your first provider
            </button>
          </div>
        ) : filter || providerFilter !== "all" ? (
          <div className="p-8 text-center max-w-md mx-auto">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#332A1B] bg-[#181610] text-[#887D6B] mx-auto mb-3">
              <Search size={19} />
            </div>
            <p className="text-sm font-bold text-[#F5F0E6]">No files match your query</p>
            <p className="mt-1 text-xs text-[#887D6B]">
              Try searching for a different file name, extension, or resetting the cloud filter.
            </p>
            <button
              type="button"
              className="mt-3 inline-flex h-8 items-center justify-center rounded-lg border border-[#332A1B] bg-[#211D15] px-3.5 text-xs font-semibold text-[#F5F0E6] hover:border-[#C6A052] transition-colors cursor-pointer"
              onClick={() => {
                setFilter("")
                setProviderFilter("all")
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="p-8 text-center max-w-md mx-auto">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#332A1B] bg-[#181610] text-[#887D6B] mx-auto mb-3">
              <FileText size={19} />
            </div>
            <p className="text-sm font-bold text-[#F5F0E6]">Your storage is empty</p>
            <p className="mt-1 text-xs text-[#887D6B] leading-relaxed">
              Upload files to test multi-cloud placement. Files over 16 MiB are automatically striped across providers.
            </p>
            <button
              type="button"
              className="mt-4 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#C6A052] px-4 text-xs font-bold text-[#0B0A08] hover:bg-[#E0C078] transition-colors cursor-pointer"
              onClick={() => setShowDropzone(true)}
            >
              <Upload size={13} strokeWidth={2.4} />
              <span>Upload your first file</span>
            </button>
          </div>
        )}
      </div>

      {/* File Detail Drawer in Dark Theme */}
      <Drawer
        open={Boolean(openFile)}
        onClose={() => setParams({}, { replace: true })}
        title={openFile?.original_name ?? ""}
        meta={openFile ? `${fileExtension(openFile.original_name)} · ${formatBytes(openFile.size_bytes)}` : undefined}
      >
        {openFile ? (
          <FileDetailDark
            file={openFile}
            connection={connections.data?.find((entry) => entry.id === openFile.connection_id) ?? null}
            onDownload={() => void download(openFile)}
            onDelete={() => setDeleteTarget(openFile)}
          />
        ) : null}
      </Drawer>

      {/* Delete Confirmation Modal in Dark Theme */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete file"
        confirmLabel={deleting ? "Deleting…" : "Delete file"}
        tone="danger"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        body={
          <p className="text-sm text-[#887D6B]">
            <span className="font-bold text-[#F5F0E6]">{deleteTarget?.original_name}</span> will be permanently deleted from{" "}
            {deleteTarget ? providerName(deleteTarget.provider) : "the cloud"} and removed from the NexusCloud index.
            This action cannot be undone.
          </p>
        }
      />
    </div>
  )
}

function FileRowDark({
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
    <tr className="hover:bg-[#211D15] transition-colors group">
      <td className="px-5 py-3.5">
        <button
          type="button"
          onClick={onOpen}
          title={file.original_name}
          className="flex items-center gap-3 text-left max-w-sm sm:max-w-md cursor-pointer"
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-mono text-[10px] font-bold uppercase shadow-xs ${
              isImage
                ? "bg-[#2EC496]/15 text-[#2EC496] border-[#2EC496]/30"
                : isDoc
                ? "bg-rose-950/40 text-rose-400 border-rose-800/40"
                : isArchive
                ? "bg-[#C6A052]/15 text-[#E0C078] border-[#C6A052]/30"
                : "bg-[#211D15] text-[#F5F0E6] border-[#332A1B]"
            }`}
          >
            {ext || "FILE"}
          </span>
          <span className="truncate text-xs font-bold text-[#F5F0E6] group-hover:text-[#C6A052] transition-colors tracking-tight">
            {file.original_name}
          </span>
        </button>
      </td>
      <td className="px-4 py-3.5">
        <ProviderBadge provider={file.provider} />
      </td>
      <td className="px-4 py-3.5">
        {file.storage_mode === "striped" ? (
          <span className="inline-flex items-center rounded-md border border-purple-800/50 bg-purple-950/40 px-2.5 py-0.5 text-xs font-mono font-semibold text-purple-300">
            Striped Mesh
          </span>
        ) : (
          <span className="inline-flex items-center rounded-md border border-[#332A1B] bg-[#211D15] px-2.5 py-0.5 text-xs font-mono font-semibold text-[#F5F0E6]">
            Standard
          </span>
        )}
      </td>
      <td className="px-4 py-3.5 text-right font-mono text-sm font-semibold text-[#F5F0E6]">
        {formatBytes(file.size_bytes)}
      </td>
      <td className="px-4 py-3.5 font-mono text-2xs text-[#887D6B] hidden sm:table-cell">
        {file.uploaded_at ? formatRelative(file.uploaded_at) : "pending"}
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            title={`Download ${file.original_name}`}
            onClick={onDownload}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#332A1B] bg-[#181610] text-[#887D6B] hover:text-[#C6A052] hover:border-[#C6A052] transition-colors shadow-xs cursor-pointer"
          >
            <Download size={13} />
          </button>
          <button
            type="button"
            title="Delete file"
            onClick={onDelete}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#332A1B] bg-[#181610] text-[#EF5350] hover:bg-[#EF5350]/15 hover:border-[#EF5350]/50 transition-colors cursor-pointer"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </td>
    </tr>
  )
}

function SortMenuDark({
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
        <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#332A1B] bg-[#181610] px-2.5 text-xs font-semibold text-[#F5F0E6] hover:border-[#C6A052] transition-colors cursor-pointer">
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

function FileDetailDark({
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
    ["Storage Mode", file.storage_mode === "striped" ? "Multi-cloud striped chunk mesh" : "Single cloud container"],
    ["Status", file.status],
    ["Bucket / Container", connection ? `${connection.display_name} (${connection.bucket_name})` : "Multi-bucket index"],
    ["Region", connection?.region ?? "global"],
    ["Uploaded Timestamp", formatDateTime(file.uploaded_at)],
    ["Control Plane ID", file.id],
  ]

  return (
    <div className="flex flex-col gap-5 px-5 py-5 text-[#F5F0E6] bg-[#11100D]">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-[#332A1B] bg-[#181610] px-4 py-3.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#F5F0E6]">{file.original_name}</p>
          <p className="font-mono text-2xs uppercase tracking-wider text-[#887D6B] mt-0.5">
            {fileExtension(file.original_name)} · {formatBytes(file.size_bytes)}
          </p>
        </div>
        <ProviderMark provider={file.provider} size={20} />
      </div>

      <dl className="flex flex-col divide-y divide-[#332A1B]">
        {rows.map(([term, value]) => (
          <div key={term} className="flex items-baseline justify-between gap-4 py-2">
            <dt className="text-2xs font-bold uppercase tracking-wider text-[#887D6B]">{term}</dt>
            <dd className="max-w-[65%] truncate text-right font-mono text-xs font-semibold text-[#F5F0E6]" title={value}>
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="rounded-lg border border-[#332A1B] bg-[#181610] p-3 text-xs text-[#887D6B] leading-relaxed">
        <p className="flex items-start gap-1.5">
          <Link2 size={13} className="mt-0.5 shrink-0 text-[#C6A052]" />
          <span>
            {file.storage_mode === "striped"
              ? "Downloads reassemble chunks in-browser after SHA-256 verification. Presigned URLs expire in 60 minutes."
              : `Downloads use a direct presigned URL from ${providerName(file.provider)}. File bytes bypass NexusCloud servers.`}
          </span>
        </p>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onDownload}
          className="flex-1 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#C6A052] text-xs font-bold text-[#0B0A08] hover:bg-[#E0C078] transition-colors cursor-pointer"
        >
          <Download size={13} />
          <span>Download</span>
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[#EF5350]/40 bg-[#EF5350]/15 px-3.5 text-xs font-semibold text-[#EF5350] hover:bg-[#EF5350]/25 transition-colors cursor-pointer"
        >
          <Trash2 size={13} />
          <span>Delete</span>
        </button>
      </div>
    </div>
  )
}

function UploadZoneDark({ onClose }: { onClose?: () => void }) {
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
        dragOver ? "border-[#C6A052] bg-[#C6A052]/10" : "border-[#332A1B] bg-[#181610] hover:bg-[#1A1A18]"
      }`}
    >
      <div className="flex items-center gap-3.5">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
            dragOver ? "border-[#C6A052] bg-[#C6A052]/20 text-[#C6A052]" : "border-[#332A1B] bg-[#181610] text-[#887D6B]"
          }`}
          aria-hidden
        >
          <Upload size={18} />
        </span>
        <div>
          <p className="text-xs font-bold text-[#F5F0E6]">
            {dragOver ? "Release to upload immediately" : "Drag and drop files here, or browse"}
          </p>
          <p className="text-2xs text-[#887D6B] mt-0.5">
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
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-8 items-center justify-center rounded-lg bg-[#C6A052] px-3.5 text-xs font-bold text-[#0B0A08] hover:bg-[#E0C078] transition-colors cursor-pointer"
        >
          Select Files
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close upload dropzone"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#332A1B] bg-[#181610] text-[#887D6B] hover:text-[#F5F0E6] cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

function UploadQueueDark() {
  const { items, abort, clearFinished } = useUploads()

  return (
    <div className="rounded-xl border border-[#332A1B] bg-[#11100D] shadow-md overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#332A1B] px-5 py-3 bg-[#181610]">
        <span className="text-xs font-bold text-[#F5F0E6]">Upload Queue ({items.length})</span>
        <button
          type="button"
          className="flex items-center gap-1 text-2xs font-semibold text-[#887D6B] hover:text-[#F5F0E6] cursor-pointer"
          onClick={clearFinished}
        >
          <X size={11} aria-hidden />
          <span>Clear finished</span>
        </button>
      </div>
      <ul className="divide-y divide-[#332A1B]">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 px-5 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-xs font-semibold text-[#F5F0E6]">{item.name}</p>
                <p className="shrink-0 font-mono text-2xs text-[#887D6B] tnum">{formatBytes(item.size)}</p>
              </div>
              <div className="mt-1.5 flex items-center gap-3">
                {item.status === "uploading" && item.progress !== null ? (
                  <div className="h-1.5 w-full max-w-48 rounded-full bg-[#211D15] overflow-hidden">
                    <div className="h-full rounded-full bg-[#C6A052] transition-all" style={{ width: `${item.progress}%` }} />
                  </div>
                ) : null}
                <QueueStatusDark item={item} />
              </div>
              {item.error ? <p className="mt-1 text-2xs text-[#EF5350]">{item.error}</p> : null}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <p className="font-mono text-2xs uppercase tracking-wider text-[#887D6B]">
                {item.destination ? providerName(item.destination.provider) : "routing…"}
              </p>
              {item.status === "uploading" || item.status === "queued" || item.status === "requesting" ? (
                <button
                  type="button"
                  onClick={() => abort(item.id)}
                  className="text-2xs font-semibold text-[#EF5350] hover:underline cursor-pointer"
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

function QueueStatusDark({ item }: { item: ReturnType<typeof useUploads>["items"][number] }) {
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
