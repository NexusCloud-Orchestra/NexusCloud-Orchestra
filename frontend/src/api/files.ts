import { api } from "./client"
import type { FileRecord, RoutePreview, SignedChunkUrl, StripedManifest, StripedUploadTicket, UploadTicket } from "../types/api"

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

export async function requestStripedUpload(input: {
  original_name: string
  size_bytes: number
  mime_type: string
  chunks: Array<{ size_bytes: number; sha256: string }>
}): Promise<StripedUploadTicket> {
  return api<StripedUploadTicket>({ method: "POST", path: "/api/v1/files/striped-upload-request", body: input })
}

export async function stripedChunkUploadUrl(fileId: string, index: number): Promise<SignedChunkUrl> {
  return api<SignedChunkUrl>({ method: "GET", path: `/api/v1/files/striped/${fileId}/chunks/${index}/upload-url` })
}

export async function confirmStripedUpload(fileId: string): Promise<FileRecord> {
  return api<FileRecord>({ method: "POST", path: `/api/v1/files/striped/${fileId}/confirm` })
}

export async function cancelStripedUpload(fileId: string): Promise<null> {
  return api<null>({ method: "POST", path: `/api/v1/files/striped/${fileId}/cancel` })
}

export async function getStripedManifest(fileId: string): Promise<StripedManifest> {
  return api<StripedManifest>({ method: "GET", path: `/api/v1/files/striped/${fileId}/manifest` })
}

export async function stripedChunkDownloadUrl(fileId: string, index: number): Promise<SignedChunkUrl> {
  return api<SignedChunkUrl>({ method: "GET", path: `/api/v1/files/striped/${fileId}/chunks/${index}/download-url` })
}

export async function deleteStripedFile(fileId: string): Promise<null> {
  return api<null>({ method: "DELETE", path: `/api/v1/files/striped/${fileId}` })
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
