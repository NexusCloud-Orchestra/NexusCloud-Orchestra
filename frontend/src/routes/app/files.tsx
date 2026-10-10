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
import { PageHeader } from "../../components/layout/shell"
import { EmptyState, ErrorState, ListSkeleton } from "../../components/ui/states"
import { StatusBadge } from "../../components/ui/status"
import { Drawer } from "../../components/ui/drawer"
import { ConfirmModal } from "../../components/ui/modal"
import { Button } from "../../components/ui/button"
import { CapacityBar } from "../../components/ui/progress"
import { Input } from "../../components/ui/field"
import { Menu } from "../../components/ui/menu"
import { ProviderMark } from "../../components/ui/provider-mark"
import type { ReactNode } from "react"
import type { FileRecord } from "../../types/api"
import { Meta } from "../../components/ui/meta"
import { SortableTh, Th } from "../../components/ui/table"

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
  const openDrawer = (id: string) => setParams({ file: id }, { replace: true })
  const closeDrawer = () => setParams({}, { replace: true })
  const queryClient = useQueryClient()
  const toast = useToast()
  const filesQuery = useFiles()
  const connections = useConnections()
  const queue = useUploads()
  const { activeCount } = queue

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

  function toggleSort(key: SortKey) {
    setSort((current) =>
      current.key === key ? { key, dir: current.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "name" ? "asc" : "desc" },
    )
  }

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
    <DropTarget>
      <div className="animate-fade-rise flex flex-col gap-6">
        <PageHeader
          title="Files"
          description="Everything routed to your connected clouds. Files never pass through NexusCloud."
          actions={
            <Button size="sm" variant="primary" onClick={() => window.dispatchEvent(new CustomEvent("nc:open-upload"))}>
              Upload file
            </Button>
          }
        />

        <UploadInput />

        {activeCount > 0 || queue.items.length > 0 ? <UploadQueue /> : null}

        <section aria-label="File list">
          <div className="flex flex-wrap items-center gap-3 border-b border-line pb-3">
            <Input
              aria-label="Filter files"
              placeholder="Filter by name or cloud"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="h-9 w-full sm:w-72"
            />
            <div className="sm:hidden">
              <SortMenu sort={sort} onSort={(key, dir) => setSort({ key, dir })} />
            </div>
            <p className="ml-auto text-sm text-ink-3 tnum">
              {filesQuery.data ? `${visible.length} of ${filesQuery.data.length} files` : ""}
            </p>
          </div>
          {filesQuery.isLoading ? (
            <ListSkeleton rows={5} />
          ) : filesQuery.isError ? (
            <ErrorState error={filesQuery.error} onRetry={() => void filesQuery.refetch()} />
          ) : visible.length > 0 ? (
            <>
              {/* Phone: stacked rows. Table from sm up. */}
              <ul className="sm:hidden">
                {visible.map((file) => (
                  <li key={file.id} className="row flex items-center gap-3 px-1 py-3">
                    <ProviderMark provider={file.provider} size={10} />
                    <button
                      type="button"
                      onClick={() => openDrawer(file.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block truncate text-base text-ink">{file.original_name}</span>
                      <span className="text-sm text-ink-3">
                        {providerName(file.provider)} <span className="font-mono tnum">{formatBytes(file.size_bytes)}</span>
                      </span>
                    </button>
                    <RowActions file={file} onDelete={() => setDeleteTarget(file)} onDownload={() => void download(file)} always />
                  </li>
                ))}
              </ul>
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[560px] border-collapse">
                  <caption className="sr-only">Files across connected clouds</caption>
                  <thead>
                    <tr className="border-b border-line">
                      <SortableTh label="Name" active={sort.key === "name"} dir={sort.dir} onSort={() => toggleSort("name")} />
                      <Th>Cloud</Th>
                      <SortableTh label="Size" align="right" active={sort.key === "size"} dir={sort.dir} onSort={() => toggleSort("size")} />
                      <SortableTh label="Uploaded" align="right" active={sort.key === "modified"} dir={sort.dir} onSort={() => toggleSort("modified")} />
                      <th scope="col" className="w-20 px-1 py-2"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((file) => (
                      <FileRow
                        key={file.id}
                        file={file}
                        onOpen={() => openDrawer(file.id)}
                        onDelete={() => setDeleteTarget(file)}
                        onDownload={() => void download(file)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : filter ? (
            <EmptyState title="No matches" body={`No files match "${filter}". Clear the filter to see everything.`} />
          ) : (
            <EmptyState
              title="No files yet"
              body="Drop files anywhere on this page, or use Upload file. The router places each one on the best cloud."
            />
          )}
        </section>

        <Drawer
          open={Boolean(openFile)}
          onClose={closeDrawer}
          title={openFile?.original_name ?? ""}
          meta={openFile ? <Meta items={[fileExtension(openFile.original_name), formatBytes(openFile.size_bytes)]} /> : undefined}
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
    </DropTarget>
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
    <tr className="row group">
      <td className="px-1 py-2.5">
        <button type="button" onClick={onOpen} className="flex items-center gap-2.5 text-left">
          <span className="w-9 shrink-0 font-mono text-xs text-ink-3">{fileExtension(file.original_name)}</span>
          <span className="max-w-[320px] truncate text-base text-ink hover:text-accent">{file.original_name}</span>
        </button>
      </td>
      <td className="px-3 py-2.5">
        <ProviderLabelCell provider={file.provider} />
      </td>
      <td className="px-3 py-2.5 text-right font-mono text-sm text-ink tnum">{formatBytes(file.size_bytes)}</td>
      <td className="px-3 py-2.5 text-right text-sm text-ink-3 tnum">{formatRelative(file.uploaded_at)}</td>
      <td className="px-1 py-2.5">
        <RowActions file={file} onDelete={onDelete} onDownload={onDownload} />
      </td>
    </tr>
  )
}

function RowActions({
  file,
  onDelete,
  onDownload,
  always = false,
}: {
  file: FileRecord
  onDelete: () => void
  onDownload: () => void
  always?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-end gap-0.5 transition-opacity duration-fast focus-within:opacity-100 ${
        always ? "" : "opacity-0 group-hover:opacity-100"
      }`}
    >
      <button
        type="button"
        onClick={onDownload}
        aria-label={`Download ${file.original_name}`}
        title="Download"
        className="rounded-xs p-2 text-ink-3 transition-colors duration-fast hover:bg-raise hover:text-ink"
      >
        <Download size={14} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${file.original_name}`}
        title="Delete"
        className="rounded-xs p-2 text-ink-3 transition-colors duration-fast hover:bg-bad-wash hover:text-bad"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

function ProviderLabelCell({ provider }: { provider: FileRecord["provider"] }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <ProviderMark provider={provider} size={10} />
      <span className="text-sm text-ink-2">{providerName(provider)}</span>
    </span>
  )
}

function SortMenu({ sort, onSort }: { sort: { key: SortKey; dir: "asc" | "desc" }; onSort: (key: SortKey, dir: "asc" | "desc") => void }) {
  const items = [
    { label: "Newest first", key: "modified" as SortKey, dir: "desc" as const },
    { label: "Oldest first", key: "modified" as SortKey, dir: "asc" as const },
    { label: "Name, A to Z", key: "name" as SortKey, dir: "asc" as const },
    { label: "Name, Z to A", key: "name" as SortKey, dir: "desc" as const },
    { label: "Largest first", key: "size" as SortKey, dir: "desc" as const },
    { label: "Smallest first", key: "size" as SortKey, dir: "asc" as const },
  ]
  return (
    <Menu
      label="Sort files"
      trigger={
        <span className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-line px-3 text-sm text-ink-2 transition-colors duration-fast hover:border-line-strong hover:text-ink">
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
    ["Connection", connection ? `${connection.display_name} (${connection.bucket_name})` : "Striped across clouds"],
    ["Region", connection?.region ?? "—"],
    ["Uploaded", formatDateTime(file.uploaded_at)],
    ["File ID", file.id],
  ]
  return (
    <div className="flex flex-col gap-5 px-5 py-5">
      <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
        <div className="min-w-0">
          <p className="truncate text-md font-medium text-ink">{file.original_name}</p>
          <Meta
            className="font-mono text-xs text-ink-3 tnum"
            items={[fileExtension(file.original_name), formatBytes(file.size_bytes)]}
          />
        </div>
        <HardDrive className="shrink-0 text-ink-3" size={16} aria-hidden />
      </div>
      <dl className="flex flex-col">
        {rows.map(([term, value]) => (
          <div key={term} className="flex items-baseline justify-between gap-6 border-b border-line py-2 last:border-b-0">
            <dt className="meta-label">{term}</dt>
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

/** Whole-page drop target: dropping anywhere on /app/files enqueues the files. */
function DropTarget({ children }: { children: ReactNode }) {
  const { enqueue } = useUploads()
  const [dragOver, setDragOver] = useState(false)
  return (
    <div
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return
        event.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node)) return
        setDragOver(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        setDragOver(false)
        enqueue(Array.from(event.dataTransfer.files))
      }}
      className={`relative -m-3 rounded-md p-3 outline-dashed outline-1 transition-colors duration-fast ${
        dragOver ? "bg-accent-wash/40 outline-accent" : "outline-transparent"
      }`}
    >
      {dragOver ? (
        <p role="status" className="pointer-events-none absolute inset-x-0 top-24 z-10 text-center font-display text-xl font-bold text-accent">
          Release to upload
        </p>
      ) : null}
      {children}
    </div>
  )
}

/** Hidden file input, opened by the "Upload file" button and the nc:open-upload event (command palette). */
function UploadInput() {
  const { enqueue } = useUploads()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const open = () => inputRef.current?.click()
    window.addEventListener("nc:open-upload", open)
    return () => window.removeEventListener("nc:open-upload", open)
  }, [])

  return (
    <input
      ref={inputRef}
      type="file"
      multiple
      className="sr-only"
      aria-label="Select files to upload"
      tabIndex={-1}
      onChange={(event) => {
        enqueue(Array.from(event.target.files ?? []))
        event.target.value = ""
      }}
    />
  )
}

function UploadQueue() {
  const { items, abort, clearFinished } = useUploads()
  return (
    <section aria-label="Upload queue" className="border-l-2 border-accent-line pl-4">
      <header className="flex items-baseline justify-between gap-4 pb-1">
        <h2 className="text-md font-semibold text-ink">Uploads</h2>
        <Button variant="ghost" size="sm" onClick={clearFinished}>
          <X size={11} aria-hidden />
          Clear finished
        </Button>
      </header>
      <ul>
        {items.map((item) => (
          <li key={item.id} className="row flex items-center gap-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-base text-ink">{item.name}</p>
                <p className="shrink-0 font-mono text-sm text-ink-3 tnum">{formatBytes(item.size)}</p>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                {item.status === "uploading" ? (
                  item.progress !== null ? (
                    <div className="w-full max-w-64">
                      <CapacityBar used={item.progress} limit={100} label={`${item.name} upload progress`} />
                    </div>
                  ) : (
                    <IndeterminateBar />
                  )
                ) : null}
                <QueueStatus item={item} />
                <span className="text-sm text-ink-3">
                  {item.destination ? `to ${providerName(item.destination.provider)}` : "routing"}
                </span>
              </div>
              {item.error ? <p className="mt-1 text-sm text-bad">{item.error}</p> : null}
            </div>
            {item.status === "uploading" || item.status === "queued" || item.status === "requesting" ? (
              <button
                type="button"
                onClick={() => abort(item.id)}
                className="shrink-0 rounded-sm px-2 py-1 text-sm text-ink-2 transition-colors duration-fast hover:text-bad"
              >
                Cancel
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
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
    <div role="progressbar" aria-label="Uploading" className="h-1.5 w-full max-w-64 overflow-hidden rounded-full bg-line">
      <div className="animate-indeterminate h-full w-1/3 rounded-full bg-accent" />
    </div>
  )
}
