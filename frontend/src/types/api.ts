/**
 * API models mirroring `app/schemas.py` and the OpenAPI document.
 * Only concepts that exist in the backend. No invented fields.
 */

export type ProviderId = "aws" | "azure" | "gcp" | "r2" | "b2" | "oracle" | "ibm"
export type PlanId = "free" | "starter" | "pro" | "team"
export type FileStatus = "active" | "pending" | "cancelled" | "deleted" | "cleanup_failed"

export interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  plan: string
  created_at: string
}

export interface Tokens {
  access_token: string
  refresh_token: string
  token_type: "bearer"
}

export interface AuditLog {
  id: string
  action: string
  resource_id: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface ProviderSpec {
  name: ProviderId
  free_bytes: number
  inverse_egress: number
  permanent: boolean
}

export interface PlanSpec {
  name: PlanId
  max_connections: number | null
  max_bytes: number | null
  seats: number
}

export interface Connection {
  id: string
  provider: ProviderId
  display_name: string
  bucket_name: string
  region: string | null
  is_active: boolean
  created_at: string
}

export interface ConnectionCreate {
  provider: ProviderId
  display_name: string
  bucket_name: string
  region: string | null
  credentials: Record<string, string>
}

export interface FileRecord {
  id: string
  original_name: string
  size_bytes: number
  mime_type: string
  status: FileStatus
  uploaded_at: string | null
  connection_id: string | null
  provider: ProviderId | "multi"
  storage_mode: "single" | "striped"
}

export interface UploadTicket {
  file_id: string
  provider: ProviderId
  bucket_name: string
  upload_url: string
  expires_at: string
  required_headers: Record<string, string>
  connection_id: string
}

export interface StripedChunk {
  index: number
  chunk_id: string
  connection_id: string
  provider: ProviderId
  size_bytes: number
  sha256: string
}

export interface StripedUploadTicket {
  file_id: string
  index_version: number
  index_hash: string
  expires_at: string
  chunks: StripedChunk[]
}

export interface StripedManifest {
  file_id: string
  index_version: number
  original_name: string
  mime_type: string
  size_bytes: number
  index_hash: string
  chunks: StripedChunk[]
}

export interface SignedChunkUrl {
  url: string
  required_headers: Record<string, string>
  expires_in_seconds: number
}

export interface DownloadTicket {
  download_url: string
  expires_in_seconds: number
}

export interface RouteWeights {
  capacity: number
  egress: number
  permanence: number
  fit: number
}

export type RouteComponentKey = keyof RouteWeights

export type BlockedReason =
  | "no_connections"
  | "plan_limit"
  | "no_single_cloud"
  | "insufficient_quota"

export interface RouteCandidate {
  connection_id: string
  provider: ProviderId
  display_name: string
  free_bytes: number
  eligible: boolean
  score: number | null
  components: RouteWeights | null
}

export interface RoutePreview {
  size_bytes: number
  selected_connection_id: string | null
  blocked_reason: BlockedReason | null
  message: string | null
  weights: RouteWeights
  candidates: RouteCandidate[]
}

export interface QuotaConnection {
  connection_id: string
  provider: ProviderId
  display_name: string
  used_bytes: number
  reserved_bytes: number
  limit_bytes: number
  free_bytes: number
}

export interface QuotaSummary {
  total_used_bytes: number
  total_free_bytes: number
  total_limit_bytes: number
  usage_percentage: number
  total_reserved_bytes: number
  plan: string | null
  plan_limit_bytes: number | null
  by_connection: QuotaConnection[]
}
