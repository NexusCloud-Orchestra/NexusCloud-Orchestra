import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
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
import { providerName } from "../../lib/providers"
import { verifyStripeIndex } from "../../lib/striping"
import type { FileRecord } from "../../types/api"

export type SortKey = "name" | "size" | "modified"
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

export function useFilesData() {
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
        if (!(await verifyStripeIndex({ ...manifest, chunks: ordered }))) {
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

  return {
    params,
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
    sorted,
    visible,
    openFile,
    download,
    confirmDelete,
    toast,
  }
}
