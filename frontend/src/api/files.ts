import { api } from "./client"
import type { FileRecord, RoutePreview, UploadTicket } from "../types/api"

export async function listFiles(): Promise<FileRecord[]> {
  return api<FileRecord[]>({ method: "GET", path: "/api/v1/files" })
}

export async function requestUpload(input: {
  original_name: string
  size_bytes: number
  mime_type: string
}): Promise<UploadTicket> {
  return api<UploadTicket>({ method: "POST", path: "/api/v1/files/upload-request", body: input })
}

export async function confirmUpload(fileId: string): Promise<FileRecord> {
  return api<FileRecord>({ method: "POST", path: `/api/v1/files/confirm-upload/${fileId}` })
}

export async function cancelUpload(fileId: string): Promise<null> {
  return api<null>({ method: "POST", path: `/api/v1/files/cancel-upload/${fileId}` })
}

export async function routePreview(sizeBytes: number): Promise<RoutePreview> {
  return api<RoutePreview>({ method: "POST", path: "/api/v1/files/route-preview", body: { size_bytes: sizeBytes } })
}

export async function requestDownload(fileId: string): Promise<{ download_url: string; expires_in_seconds: number }> {
  return api<{ download_url: string; expires_in_seconds: number }>({
    method: "GET",
    path: `/api/v1/files/download/${fileId}`,
  })
}

export async function deleteFile(fileId: string): Promise<null> {
  return api<null>({ method: "DELETE", path: `/api/v1/files/${fileId}` })
}
