import { createContext, useCallback, useContext, useMemo, useReducer, useRef } from "react"
import type { ReactNode } from "react"
import { nanoid } from "../lib/nanoid"
import { formatBytes } from "../lib/format"
import { providerName } from "../lib/providers"
import { CHUNK_BYTES, sha256, verifyStripeIndex } from "../lib/striping"
import * as filesApi from "../api/files"
import { listConnections } from "../api/connections"
import { ApiError } from "../api/client"
import { useToast } from "./toast"
import { queryKeys } from "./query"
import type { QueryClient } from "@tanstack/react-query"
import type { ProviderId, UploadTicket } from "../types/api"

export const MAX_UPLOAD_BYTES = 5 * 1024 ** 3
const MAX_CONFIRM_RETRIES = 2

export type UploadStatus = "queued" | "requesting" | "uploading" | "confirming" | "done" | "failed" | "cancelled"

export interface UploadItem {
  id: string
  name: string
  size: number
  mime: string
  status: UploadStatus
  /** Null progress means unknown → indeterminate indicator, never a fake bar. */
  progress: number | null
  destination: { provider: ProviderId | "multi"; bucket: string } | null
  backendFileId: string | null
  storageMode: "single" | "striped"
  error: string | null
}

interface UploadContextValue {
  items: UploadItem[]
  enqueue: (files: File[]) => void
  abort: (id: string) => void
  clearFinished: () => void
  activeCount: number
}

const UploadContext = createContext<UploadContextValue | null>(null)

type Action =
  | { type: "add"; items: UploadItem[] }
  | { type: "patch"; id: string; patch: Partial<UploadItem> }
  | { type: "removeFinished" }

const ACTIVE: ReadonlySet<UploadStatus> = new Set(["queued", "requesting", "uploading", "confirming"])

function reducer(state: UploadItem[], action: Action): UploadItem[] {
  switch (action.type) {
    case "add":
      return [...state, ...action.items]
    case "patch":
      return state.map((item) => (item.id === action.id ? { ...item, ...action.patch } : item))
    case "removeFinished":
      return state.filter((item) => ACTIVE.has(item.status))
    default:
      return state
  }
}

/** Client-side mirror of the backend's UploadIn validation. */
export function validateFile(file: File): string | null {
  if (file.size < 1) return "Empty files cannot be uploaded"
  if (file.size > MAX_UPLOAD_BYTES) return "Exceeds the 5 GiB upload limit"
  if (file.name.length > 255) return "Filename is longer than 255 characters"
  if (/[/\\]/.test(file.name) || [...file.name].some((char) => char.charCodeAt(0) < 32)) {
    return "Filename may not contain path separators or control characters"
  }
  return null
}

export function UploadProvider({ children, queryClient }: { children: ReactNode; queryClient: QueryClient }) {
  const [items, dispatch] = useReducer(reducer, [])
  const requests = useRef(new Map<string, XMLHttpRequest>())
  const cancelled = useRef(new Set<string>())
  const toast = useToast()

  // A ref mirror keeps callbacks stable without re-binding XHR handlers.
  const itemsRef = useRef<UploadItem[]>(items)
  itemsRef.current = items

  const invalidateFileData = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.files })
    void queryClient.invalidateQueries({ queryKey: queryKeys.quota })
  }, [queryClient])

  const finish = useCallback(
    (id: string, status: UploadStatus, error: string | null, releaseReservation: boolean) => {
      const item = itemsRef.current.find((candidate) => candidate.id === id)
      const backendFileId = item?.backendFileId ?? null
      requests.current.delete(id)
      if (releaseReservation && backendFileId) {
        // Best-effort reservation release. A 409 simply means it is already resolved.
        const release = item?.storageMode === "striped"
          ? filesApi.cancelStripedUpload(backendFileId)
          : filesApi.cancelUpload(backendFileId)
        void release.catch(() => undefined)
      }
      dispatch({ type: "patch", id, patch: { status, error } })
      invalidateFileData()
    },
    [invalidateFileData],
  )

  const confirmWithRetry = useCallback(
    async (uploadId: string, fileId: string): Promise<void> => {
      dispatch({ type: "patch", id: uploadId, patch: { status: "confirming", progress: 100 } })
      let attempt = 0
      for (;;) {
        try {
          const file = await filesApi.confirmUpload(fileId)
          finish(uploadId, "done", null, false)
          toast.notify(`${file.original_name} uploaded to ${providerName(file.provider)}`, "success")
          return
        } catch (error) {
          if (error instanceof ApiError && error.status === 409) {
            // Object missing, size differs, or the ticket expired → permanent.
            finish(uploadId, "failed", error.message, true)
            toast.notify(`Upload failed for ${itemsRef.current.find((item) => item.id === uploadId)?.name ?? "file"}`, "error")
            return
          }
          // Transient (network / 5xx): the PUT succeeded — retry confirm, never cancel.
          attempt += 1
          if (attempt > MAX_CONFIRM_RETRIES) {
            finish(uploadId, "failed", "Could not confirm the upload with the API", false)
            toast.notify("Upload confirmation failed — retry from the upload queue", "error")
            return
          }
          await new Promise((resolve) => setTimeout(resolve, 900 * attempt))
        }
      }
    },
    [finish, toast],
  )

  const startStripedUpload = useCallback(
    async (id: string, file: File) => {
      let fileId: string | null = null
      let confirmationStarted = false
      try {
        const chunks: Array<{ size_bytes: number; sha256: string }> = []
        for (let offset = 0; offset < file.size; offset += CHUNK_BYTES) {
          if (cancelled.current.has(id)) throw new Error("Upload cancelled")
          const piece = file.slice(offset, Math.min(offset + CHUNK_BYTES, file.size))
          chunks.push({ size_bytes: piece.size, sha256: await sha256(piece) })
        }
        if (cancelled.current.has(id)) throw new Error("Upload cancelled")
        const ticket = await filesApi.requestStripedUpload({
          original_name: file.name, size_bytes: file.size,
          mime_type: file.type || "application/octet-stream", chunks,
        })
        fileId = ticket.file_id
        if (!await verifyStripeIndex({ ...ticket, size_bytes: file.size })) {
          throw new Error("Cloud placement index failed integrity validation")
        }
        if (ticket.chunks.length !== chunks.length ||
            ticket.chunks.some((chunk, index) =>
              chunk.index !== index || chunk.size_bytes !== chunks[index]?.size_bytes ||
              chunk.sha256 !== chunks[index]?.sha256
            )) throw new Error("Cloud chunk assignments do not match the file")
        if (cancelled.current.has(id)) throw new Error("Upload cancelled")
        dispatch({ type: "patch", id, patch: {
          backendFileId: fileId, storageMode: "striped",
          destination: { provider: "multi", bucket: "Connected clouds" },
          status: "uploading", progress: 0,
        } })
        let uploaded = 0
        for (const chunk of ticket.chunks) {
          if (cancelled.current.has(id)) throw new Error("Upload cancelled")
          const signed = await filesApi.stripedChunkUploadUrl(fileId, chunk.index)
          if (cancelled.current.has(id)) throw new Error("Upload cancelled")
          const piece = file.slice(chunk.index * CHUNK_BYTES, chunk.index * CHUNK_BYTES + chunk.size_bytes)
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            requests.current.set(id, xhr)
            xhr.open("PUT", signed.url, true)
            for (const [name, value] of Object.entries(signed.required_headers)) xhr.setRequestHeader(name, value)
            if (!Object.prototype.hasOwnProperty.call(signed.required_headers, "Content-Type")) {
              xhr.setRequestHeader("Content-Type", "application/octet-stream")
            }
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                dispatch({ type: "patch", id, patch: {
                  progress: Math.round(((uploaded + event.loaded) / file.size) * 100),
                } })
              }
            }
            xhr.onload = () => xhr.status >= 200 && xhr.status < 300
              ? resolve()
              : reject(new Error(`Storage rejected chunk ${chunk.index + 1} (HTTP ${xhr.status})`))
            xhr.onerror = () => reject(new Error(`Transfer failed for chunk ${chunk.index + 1}`))
            xhr.onabort = () => reject(new Error("Upload cancelled"))
            xhr.send(piece)
          })
          requests.current.delete(id)
          uploaded += piece.size
          dispatch({ type: "patch", id, patch: { progress: Math.round((uploaded / file.size) * 100) } })
        }
        if (cancelled.current.has(id)) throw new Error("Upload cancelled")
        dispatch({ type: "patch", id, patch: { status: "confirming", progress: 100 } })
        confirmationStarted = true
        let confirmed = null
        for (let attempt = 0; attempt <= MAX_CONFIRM_RETRIES; attempt += 1) {
          try {
            confirmed = await filesApi.confirmStripedUpload(fileId)
            break
          } catch (error) {
            if (error instanceof ApiError && error.status === 409) throw error
            if (attempt === MAX_CONFIRM_RETRIES) throw error
            await new Promise((resolve) => setTimeout(resolve, 900 * (attempt + 1)))
          }
        }
        finish(id, "done", null, false)
        toast.notify(`${confirmed?.original_name ?? file.name} striped across clouds`, "success")
      } catch (error) {
        if (fileId && !confirmationStarted) {
          await filesApi.cancelStripedUpload(fileId).catch(() => undefined)
        }
        const wasCancelled = cancelled.current.has(id)
        const message = wasCancelled ? "Upload cancelled" : confirmationStarted && !(error instanceof ApiError && error.status === 409)
          ? "Could not confirm upload; its reservation will expire if confirmation did not succeed"
          : error instanceof Error ? error.message : "Striped upload failed"
        finish(id, wasCancelled ? "cancelled" : "failed", message, false)
        if (!wasCancelled) toast.notify(`Upload failed for ${file.name}`, "error")
      } finally {
        requests.current.delete(id)
        cancelled.current.delete(id)
      }
    },
    [finish, toast],
  )

  const startUpload = useCallback(
    async (id: string, file: File) => {
      const validation = validateFile(file)
      if (validation) {
        dispatch({ type: "patch", id, patch: { status: "failed", error: validation } })
        return
      }
      dispatch({ type: "patch", id, patch: { status: "requesting", progress: null } })
      if (file.size > CHUNK_BYTES) {
        try {
          const connections = await queryClient.fetchQuery({
            queryKey: queryKeys.connections, queryFn: listConnections,
          })
          if (cancelled.current.has(id)) {
            cancelled.current.delete(id)
            return
          }
          if (new Set(connections.map((connection) => connection.provider)).size >= 2) {
            await startStripedUpload(id, file)
            return
          }
        } catch (error) {
          finish(id, "failed", error instanceof ApiError ? error.message : "Could not check connected clouds", false)
          return
        }
      }
      let ticket: UploadTicket
      try {
        ticket = await filesApi.requestUpload({
          original_name: file.name,
          size_bytes: file.size,
          mime_type: file.type || "application/octet-stream",
        })
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Could not reach the API"
        finish(id, "failed", message, false)
        toast.notify(message, "error")
        return
      }
      if (cancelled.current.has(id)) {
        void filesApi.cancelUpload(ticket.file_id).catch(() => undefined)
        return
      }
      dispatch({
        type: "patch",
        id,
        patch: {
          backendFileId: ticket.file_id,
          destination: { provider: ticket.provider, bucket: ticket.bucket_name },
          status: "uploading",
          progress: 0,
        },
      })

      const xhr = new XMLHttpRequest()
      requests.current.set(id, xhr)
      xhr.open("PUT", ticket.upload_url, true)
      for (const [header, value] of Object.entries(ticket.required_headers)) {
        // Header names/values come from the backend. Never attach our bearer token here.
        xhr.setRequestHeader(header, value)
      }
      if (!Object.prototype.hasOwnProperty.call(ticket.required_headers, "Content-Type")) {
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream")
      }
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          dispatch({ type: "patch", id, patch: { progress: Math.round((event.loaded / event.total) * 100) } })
        }
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          void confirmWithRetry(id, ticket.file_id)
        } else {
          finish(id, "failed", `Storage rejected the upload (HTTP ${xhr.status})`, true)
          toast.notify("Upload failed — the storage provider rejected the transfer", "error")
        }
      }
      xhr.onerror = () => {
        finish(id, "failed", "Transfer to storage failed — check bucket CORS and connectivity", true)
        toast.notify("Upload failed — transfer to storage did not complete", "error")
      }
      xhr.onabort = () => {
        finish(id, "cancelled", "Upload cancelled", true)
        toast.notify("Upload cancelled", "neutral")
      }
      xhr.send(file)
    },
    [confirmWithRetry, finish, queryClient, startStripedUpload, toast],
  )

  const enqueue = useCallback(
    (files: File[]) => {
      if (files.length === 0) return
      const items: UploadItem[] = files.map((file) => ({
        id: nanoid(),
        name: file.name,
        size: file.size,
        mime: file.type || "application/octet-stream",
        status: "queued",
        progress: null,
        destination: null,
        backendFileId: null,
        storageMode: "single",
        error: null,
      }))
      dispatch({ type: "add", items })
      items.forEach((item, index) => {
        const file = files[index]
        if (file) void startUpload(item.id, file)
      })
    },
    [startUpload],
  )

  const abort = useCallback(
    (id: string) => {
      const item = itemsRef.current.find((candidate) => candidate.id === id)
      if (item?.status === "confirming") return
      cancelled.current.add(id)
      const request = requests.current.get(id)
      if (request) {
        request.abort()
        return
      }
      if (item?.backendFileId) {
        if (item.storageMode !== "striped") {
          void filesApi.cancelUpload(item.backendFileId).catch(() => undefined)
        }
      }
      dispatch({ type: "patch", id, patch: { status: "cancelled", error: "Cancelled" } })
      invalidateFileData()
    },
    [invalidateFileData],
  )

  const clearFinished = useCallback(() => {
    dispatch({ type: "removeFinished" })
  }, [])

  const activeCount = items.filter((item) => ACTIVE.has(item.status)).length

  const value = useMemo<UploadContextValue>(
    () => ({ items, enqueue, abort, clearFinished, activeCount }),
    [items, enqueue, abort, clearFinished, activeCount],
  )

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>
}

export function useUploads(): UploadContextValue {
  const context = useContext(UploadContext)
  if (!context) throw new Error("useUploads must be used inside UploadProvider")
  return context
}

export function describeDestination(item: UploadItem): string {
  if (!item.destination) return "Selecting cloud…"
  return providerName(item.destination.provider)
}

export function describeSize(size: number): string {
  return formatBytes(size)
}
