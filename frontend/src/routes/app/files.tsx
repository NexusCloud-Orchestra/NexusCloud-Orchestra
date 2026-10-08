import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Download, HardDrive, Link2, Trash2, X } from "lucide-react"
import { useFiles, useConnections } from "../../hooks/use-data"
import { useQueryClient } from "@tanstack/react-query"
import {
  deleteFile, deleteStripedFile, getStripedManifest, requestDownload, stripedChunkDownloadUrl,
} from "../../api/files"
import { ApiError } from "../../api/client"
import { useToast } from "../../state/toast"
import { queryKeys } from "../../state/query"
import { useUploads } from "../../state/uploads"
import { formatBytes, formatDateTime, fileExtension, formatRelative } from "../../lib/format"
import { providerName } from "../../lib/providers"
import { sha256, verifyStripeIndex } from "../../lib/striping"
import { PageHeader, Breadcrumb } from "../../components/layout/shell"
import { Panel, PanelHeader } from "../../components/ui/panel"
import { EmptyState, ErrorState, ListSkeleton } from "../../components/ui/states"
import { StatusBadge } from "../../components/ui/status"
import { Drawer } from "../../components/ui/drawer"
import { ConfirmModal } from "../../components/ui/modal"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/field"
import { Menu } from "../../components/ui/menu"
import { ProviderMark } from "../../components/ui/provider-mark"
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
  const [files] = useSearchParams()
  const openFileId = files.get("file")
  const queryClient = useQueryClient()
  const toast = useToast()
  const filesQuery = useFiles()
  const connections = useConnections()
  const { activeCount } = useUploads()

  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "modified", dir: "desc" })
  const [filter, setFilter] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<FileRecord | null>(null)
  const [deleting, setDeleting] = useState(false)

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
    const needle = filter.trim().toLowerCase()
    if (!needle) return sorted
    return sorted.filter(
      (file) =>
        file.original_name.toLowerCase().includes(needle) ||
        providerName(file.provider).toLowerCase().includes(needle),
    )
  }, [sorted, filter])

  const openFile = openFileId ? sorted.find((file) => file.id === openFileId) ?? null : null

  async function download(file: FileRecord) {
    try {
      let url: string
      if (file.storage_mode === "striped") {
        const picker = (window as SaveFileWindow).showSaveFilePicker
        if (!picker && file.size_bytes > MAX_BUFFERED_DOWNLOAD_BYTES) {
          throw new Error("This browser cannot stream large downloads; use a browser with Save As support")
        }
        // File picker permission is tied to the click; open it before awaiting the API.
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
            const response = await fetch(signed.url, { credentials: "omit" })
            if (!response.ok) throw new Error(`Cloud download failed for chunk ${chunk.index + 1}`)
            const bytes = await response.arrayBuffer()
            if (bytes.byteLength !== chunk.size_bytes || await sha256(bytes) !== chunk.sha256) {
              throw new Error(`Chunk ${chunk.index + 1} failed integrity validation`)
            }
            if (writer) await writer.write(bytes)
            else pieces.push(bytes)
          }
          if (writer) await writer.close()
        } catch (error) {
          if (writer) await writer.abort().catch(() => undefined)
          throw error
        }
        if (writer) {
          toast.notify(`Download saved for ${file.original_name}`, "success")
          return
        }
        url = URL.createObjectURL(new Blob(pieces, { type: manifest.mime_type }))
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
    <div className="animate-fade-rise flex flex-col gap-6">
      <PageHeader
        kicker="Storage"
        title="Files"
        description="Everything routed to your connected clouds. Files are never proxied through NexusCloud."
        actions={
          <Button size="sm" variant="primary" onClick={() => window.dispatchEvent(new CustomEvent("nc:open-upload"))}>
            Upload file
          </Button>
        }
      />

      <UploadZone />

      {activeCount > 0 ? <UploadQueue /> : null}

      <Panel>
        <PanelHeader
          title={
            <Breadcrumb trail={["NEXUSCLOUD", "FILES"]} />
          }
          meta={filesQuery.data ? `${filesQuery.data.length} total` : undefined}
          actions={
            <div className="flex items-center gap-2">
              <Input
                aria-label="Filter files"
                placeholder="Filter by name or provider…"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="h-7 w-44 !text-sm"
              />
              <SortMenu sort={sort} onSort={(key, dir) => setSort({ key, dir })} />
            </div>
          }
        />
        {filesQuery.isLoading ? (
          <ListSkeleton rows={5} />
        ) : filesQuery.isError ? (
          <ErrorState error={filesQuery.error} onRetry={() => void filesQuery.refetch()} />
        ) : visible.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="label-caps px-4 py-2 text-left font-medium">Name</th>
                  <th scope="col" className="label-caps px-4 py-2 text-left font-medium">Cloud</th>
                  <th scope="col" className="label-caps px-4 py-2 text-right font-medium">Size</th>
                  <th scope="col" className="label-caps hidden px-4 py-2 text-right font-medium sm:table-cell">Modified</th>
                  <th scope="col" className="w-8 px-4 py-2" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {visible.map((file) => (
                  <FileRow
                    key={file.id}
                    file={file}
                    onOpen={() => window.history.replaceState(null, "", `/app/files?file=${file.id}`)}
                    onDelete={() => setDeleteTarget(file)}
                    onDownload={() => void download(file)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : filter ? (
          <EmptyState title="No matches" body={`No files match “${filter}”. Clear the filter to see everything.`} />
        ) : (
          <EmptyState
            title="No files yet"
            body="Drop files above or select files to upload — the router places each one on the right cloud."
          />
        )}
      </Panel>

      <Drawer
        open={Boolean(openFile)}
        onClose={() => window.history.replaceState(null, "", "/app/files")}
        title={openFile?.original_name ?? ""}
        meta={openFile ? `${fileExtension(openFile.original_name)} · ${formatBytes(openFile.size_bytes)}` : undefined}
      >
        {openFile ? (
          <FileDetail
            file={openFile}
            connection={connections.data?.find((entry) => entry.id === openFile.connection_id) ?? null}
            onDownload={() => void download(openFile)}
            onDelete={() => {
              setDeleteTarget(openFile)
            }}
          />
        ) : null}
      </Drawer>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete file"
        confirmLabel={deleting ? "Deleting…" : "Delete file"}
        tone="danger"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        body={
          <p>
            <span className="font-medium text-ink">{deleteTarget?.original_name}</span> will be deleted from{" "}
            {deleteTarget ? providerName(deleteTarget.provider) : "the cloud"} and removed from the control plane. This
            cannot be undone.
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
  return (
    <tr className="group border-b border-line transition-colors duration-fast last:border-b-0 hover:bg-raise">
      <td className="px-4 py-2.5">
        <button type="button" onClick={onOpen} className="flex items-center gap-2.5 text-left">
          <span className="flex h-6 w-9 shrink-0 items-center justify-center rounded-xs border border-line bg-raise font-mono text-2xs font-medium text-ink-2">
            {fileExtension(file.original_name)}
          </span>
          <span className="max-w-[280px] truncate text-base text-ink">{file.original_name}</span>
        </button>
      </td>
      <td className="px-4 py-2.5">
        <ProviderLabelCell provider={file.provider} />
      </td>
      <td className="px-4 py-2.5 text-right font-mono text-sm text-ink tnum">{formatBytes(file.size_bytes)}</td>
      <td className="hidden px-4 py-2.5 text-right font-mono text-sm text-ink-3 tnum sm:table-cell">
        {formatRelative(file.uploaded_at)}
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity duration-fast group-hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            onClick={onDownload}
            aria-label={`Download ${file.original_name}`}
            title="Download"
            className="rounded-xs p-1.5 text-ink-3 transition-colors duration-fast hover:bg-surface hover:text-ink"
          >
            <Download size={13} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${file.original_name}`}
            title="Delete"
            className="rounded-xs p-1.5 text-ink-3 transition-colors duration-fast hover:bg-bad-wash hover:text-bad"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  )
}

function ProviderLabelCell({ provider }: { provider: FileRecord["provider"] }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <ProviderMark provider={provider} size={10} />
      <span className="font-mono text-xs text-ink-2">{providerName(provider)}</span>
    </span>
  )
}

function SortMenu({ sort, onSort }: { sort: { key: SortKey; dir: "asc" | "desc" }; onSort: (key: SortKey, dir: "asc" | "desc") => void }) {
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
        <span className="inline-flex h-7 items-center gap-1.5 rounded-sm border border-line bg-surface px-2.5 text-sm text-ink-2 transition-colors duration-fast hover:border-line-strong hover:text-ink">
          Sort
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
    ["Type", file.mime_type],
    ["Cloud", providerName(file.provider)],
    ["Status", file.status],
    ["Connection", connection ? `${connection.display_name} · ${connection.bucket_name}` : "Striped across clouds"],
    ["Region", connection?.region ?? "—"],
    ["Uploaded", formatDateTime(file.uploaded_at)],
    ["File ID", file.id],
  ]
  return (
    <div className="flex flex-col gap-5 px-5 py-5">
      <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-raise px-4 py-3.5">
        <div className="min-w-0">
          <p className="truncate text-md font-medium text-ink">{file.original_name}</p>
          <p className="font-mono text-2xs uppercase tracking-kicker text-ink-3">
            {fileExtension(file.original_name)} · {formatBytes(file.size_bytes)}
          </p>
        </div>
        <HardDrive className="shrink-0 text-ink-3" size={16} aria-hidden />
      </div>
      <dl className="flex flex-col">
        {rows.map(([term, value]) => (
          <div key={term} className="flex items-baseline justify-between gap-6 border-b border-line py-2 last:border-b-0">
            <dt className="label-caps">{term}</dt>
            <dd className="max-w-[60%] truncate text-right font-mono text-sm text-ink" title={value}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="flex items-start gap-2 text-sm text-ink-3">
        <Link2 size={13} className="mt-0.5 shrink-0" aria-hidden />
        {file.storage_mode === "striped"
          ? "Downloads reassemble browser-fetched chunks after SHA-256 verification. Every cloud must permit browser GET through CORS."
          : `Downloads use a signed URL from ${providerName(file.provider)} that expires in 60 minutes. NexusCloud never stores file content.`}
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={onDownload}>
          <Download size={12} aria-hidden />
          Download
        </Button>
        <Button size="sm" variant="danger" onClick={onDelete}>
          <Trash2 size={12} aria-hidden />
          Delete
        </Button>
      </div>
    </div>
  )
}

function UploadZone() {
  const { enqueue } = useUploads()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    const open = () => inputRef.current?.click()
    window.addEventListener("nc:open-upload", open)
    return () => window.removeEventListener("nc:open-upload", open)
  }, [])

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
      }}
      className={`flex items-center justify-between gap-4 rounded-md border border-dashed px-5 py-4 transition-colors duration-fast ${
        dragOver ? "border-accent bg-accent-wash" : "border-line-strong bg-surface"
      }`}
    >
      <div className="flex items-center gap-3.5">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border transition-colors duration-fast ${
            dragOver ? "border-accent-line bg-surface text-accent" : "border-line bg-raise text-ink-3"
          }`}
          aria-hidden
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 11V3.5M8 3.5L5 6.5M8 3.5L11 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2.5 12.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        <div>
          <p className="text-md font-medium text-ink">{dragOver ? "Release to upload" : "Drop files to upload"}</p>
          <p className="text-sm text-ink-2">Files go directly to your clouds. Files over 16 MiB stripe when two providers are connected.</p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        aria-label="Select files to upload"
        onChange={(event) => {
          enqueue(Array.from(event.target.files ?? []))
          event.target.value = ""
        }}
      />
      <Button variant="secondary" size="md" onClick={() => inputRef.current?.click()}>
        Select files
      </Button>
    </div>
  )
}

function UploadQueue() {
  const { items, abort, clearFinished } = useUploads()
  return (
    <Panel>
      <PanelHeader
        title="Upload queue"
        actions={
          <Button variant="ghost" size="sm" onClick={clearFinished}>
            <X size={11} aria-hidden />
            Clear finished
          </Button>
        }
      />
      <ul className="divide-y divide-line">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-base text-ink">{item.name}</p>
                <p className="shrink-0 font-mono text-sm text-ink-3 tnum">{formatBytes(item.size)}</p>
              </div>
              <div className="mt-1.5 flex items-center gap-3">
                {item.status === "uploading" && item.progress !== null ? (
                  <div className="h-1.5 w-full max-w-64 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-accent transition-[width] duration-base ease-out" style={{ width: `${item.progress}%` }} />
                  </div>
                ) : item.status === "uploading" ? (
                  <IndeterminateBar />
                ) : null}
                <QueueStatus item={item} />
              </div>
              {item.error ? <p className="mt-1 text-sm text-bad">{item.error}</p> : null}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <p className="font-mono text-2xs uppercase tracking-kicker text-ink-3">
                {item.destination ? providerName(item.destination.provider) : "routing…"}
              </p>
              {item.status === "uploading" || item.status === "queued" || item.status === "requesting" ? (
                <button
                  type="button"
                  onClick={() => abort(item.id)}
                  className="text-sm text-ink-3 transition-colors duration-fast hover:text-bad"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function QueueStatus({ item }: { item: ReturnType<typeof useUploads>["items"][number] }) {
  const labels: Record<string, string> = {
    queued: "Queued",
    requesting: "Requesting slot…",
    uploading: item.progress !== null ? `Uploading ${item.progress}%` : "Uploading…",
    confirming: "Confirming…",
    done: "Completed",
    failed: "Failed",
    cancelled: "Cancelled",
  }
  const tone = item.status === "done" ? "ok" : item.status === "failed" ? "bad" : item.status === "cancelled" ? "neutral" : "busy"
  return <StatusBadge tone={tone}>{labels[item.status] ?? item.status}</StatusBadge>
}

function IndeterminateBar() {
  return (
    <div className="h-1.5 w-full max-w-64 overflow-hidden rounded-full bg-line">
      <div className="animate-indeterminate h-full w-1/3 rounded-full bg-accent" />
    </div>
  )
}
