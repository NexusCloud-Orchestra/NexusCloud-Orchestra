/**
 * The single gateway for every NexusCloud API call. UI code never calls fetch
 * directly. Centralizes: base URL, bearer auth, error normalization, request
 * timeout, the coordinated 401-refresh-retry, and backend guardrails
 * (POST/PUT require Content-Length, so bodyless POSTs send `{}`).
 */

export interface FieldIssue {
  field: string
  message: string
}

/** Normalized error model every screen can render. */
export class ApiError extends Error {
  readonly status?: number
  readonly code?: string
  readonly requestId?: string
  readonly details?: FieldIssue[]
  /** HTTP 429 Retry-After seconds, when the backend sent it. */
  readonly retryAfterSeconds?: number

  constructor(init: {
    message: string
    status?: number
    code?: string
    requestId?: string
    details?: FieldIssue[]
    retryAfterSeconds?: number
  }) {

    super(init.message)
    this.name = "ApiError"
    this.status = init.status
    this.code = init.code
    this.requestId = init.requestId
    this.details = init.details
    this.retryAfterSeconds = init.retryAfterSeconds
  }
}

const BASE_URL: string =
  import.meta.env.VITE_API_URL ?? (typeof window !== "undefined" ? "" : "http://localhost:7575")
const TIMEOUT_MS = 30_000

// ---------------------------------------------------------------------------
// Token store. Access token lives in memory only. The refresh token is kept in
// sessionStorage so a page reload can restore the session without ever writing
// tokens to localStorage, URLs, or logs. It is cleared on logout / expiry.
// ---------------------------------------------------------------------------

const REFRESH_KEY = "nc.refresh"

let accessToken: string | null = null
let refreshInFlight: Promise<boolean> | null = null
let sessionExpiredHandler: (() => void) | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function readPersistedRefreshToken(): string | null {
  try {
    return sessionStorage.getItem(REFRESH_KEY)
  } catch {
    return null
  }
}

export function persistRefreshToken(token: string): void {
  try {
    sessionStorage.setItem(REFRESH_KEY, token)
  } catch {
    /* private mode: session simply ends with the page */
  }
}

export function clearPersistedSession(): void {
  accessToken = null
  try {
    sessionStorage.removeItem(REFRESH_KEY)
  } catch {
    /* ignore */
  }
}

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  sessionExpiredHandler = handler
}

// ---------------------------------------------------------------------------
// Error envelope parsing: {"error":{"code","message","request_id","details?"}}
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function parseErrorEnvelope(payload: unknown): {
  code?: string
  message: string
  requestId?: string
  details?: FieldIssue[]
} {
  if (isRecord(payload) && isRecord(payload.error)) {
    const error = payload.error
    const details = Array.isArray(error.details)
      ? error.details.flatMap((issue) =>
          isRecord(issue) && typeof issue.field === "string" && typeof issue.message === "string"
            ? [{ field: issue.field, message: issue.message }]
            : [],
        )
      : undefined
    return {
      code: typeof error.code === "string" ? error.code : undefined,
      message: typeof error.message === "string" ? error.message : "Request failed",
      requestId: typeof error.request_id === "string" ? error.request_id : undefined,
      details: details && details.length > 0 ? details : undefined,
    }
  }
  return { message: "Request failed" }
}

// ---------------------------------------------------------------------------
// Core request machinery
// ---------------------------------------------------------------------------

interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE"
  path: string
  body?: unknown
  /** Attach the bearer token (default true). */
  auth?: boolean
  /** Skip the coordinated refresh-retry (used by auth endpoints themselves). */
  allowRefresh?: boolean
}

function buildHeaders(options: RequestOptions): Headers {
  const headers = new Headers()
  if (options.body !== undefined) headers.set("Content-Type", "application/json")
  if (options.auth !== false && accessToken) headers.set("Authorization", `Bearer ${accessToken}`)
  return headers
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

function toApiError(response: Response, payload: unknown): ApiError {
  const envelope = parseErrorEnvelope(payload)
  return new ApiError({
    message: envelope.message,
    status: response.status,
    code: envelope.code,
    requestId: envelope.requestId,
    details: envelope.details,
    retryAfterSeconds: response.headers.get("Retry-After") ? Number(response.headers.get("Retry-After")) : undefined,
  })
}

/**
 * Rotate the refresh token and install the new access token. Single-flight:
 * concurrent 401s share one refresh call, per the backend's immediate
 * refresh-token rotation.
 */
export function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight
  const stored = readPersistedRefreshToken()
  if (!stored) return Promise.resolve(false)
  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: stored }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      if (!response.ok) {
        clearPersistedSession()
        return false
      }
      const payload = (await parseJson(response)) as { access_token?: unknown; refresh_token?: unknown } | null
      if (!payload || typeof payload.access_token !== "string" || typeof payload.refresh_token !== "string") {
        clearPersistedSession()
        return false
      }
      accessToken = payload.access_token
      persistRefreshToken(payload.refresh_token)
      return true
    } catch {
      return false
    } finally {
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}

async function execute(options: RequestOptions): Promise<Response> {
  // Backend guardrail: POST/PUT without Content-Length are rejected with 411.
  const body =
    options.body !== undefined ? JSON.stringify(options.body) : options.method === "POST" ? "{}" : undefined
  const response = await fetch(`${BASE_URL}${options.path}`, {
    method: options.method,
    headers: buildHeaders({ ...options, body: options.body }),
    body,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  return response
}

export async function api<T>(options: RequestOptions): Promise<T> {
  let response = await execute(options)

  if (response.status === 401 && options.auth !== false && options.allowRefresh !== false) {
    const refreshed = await refreshSession()
    if (refreshed) {
      response = await execute(options)
    } else {
      sessionExpiredHandler?.()
      throw new ApiError({ message: "Your session has expired. Sign in again.", status: 401, code: "unauthorized" })
    }
  }

  if (!response.ok) {
    throw toApiError(response, await parseJson(response))
  }
  return (await parseJson(response)) as T
}

export const apiBase = BASE_URL
