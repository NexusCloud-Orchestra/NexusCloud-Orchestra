import {
  api,
  clearPersistedSession,
  persistRefreshToken,
  setAccessToken,
} from "./client"
import type { AuditLog, Tokens, User } from "../types/api"

export interface RegisterInput {
  first_name: string
  last_name: string
  email: string
  password: string
}

export async function register(input: RegisterInput): Promise<User> {
  return api<User>({
    method: "POST",
    path: "/api/v1/auth/register",
    body: input,
    auth: false,
    allowRefresh: false,
  })
}

export async function login(email: string, password: string): Promise<Tokens> {
  const tokens = await api<Tokens>({
    method: "POST",
    path: "/api/v1/auth/login",
    body: { email, password },
    auth: false,
    allowRefresh: false,
  })
  setAccessToken(tokens.access_token)
  persistRefreshToken(tokens.refresh_token)
  return tokens
}

export async function logout(): Promise<void> {
  try {
    await api<null>({ method: "POST", path: "/api/v1/auth/logout" })
  } finally {
    setAccessToken(null)
    clearPersistedSession()
  }
}

export async function me(): Promise<User> {
  return api<User>({ method: "GET", path: "/api/v1/auth/me" })
}

export async function auditLogs(): Promise<AuditLog[]> {
  return api<AuditLog[]>({ method: "GET", path: "/api/v1/auth/audit-logs" })
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return api<{ message: string }>({
    method: "POST",
    path: "/api/v1/auth/forgot-password",
    body: { email },
    auth: false,
    allowRefresh: false,
  })
}

export async function resetPassword(input: {
  email: string
  token: string
  new_password: string
}): Promise<{ message: string }> {
  return api<{ message: string }>({
    method: "POST",
    path: "/api/v1/auth/reset-password",
    body: input,
    auth: false,
    allowRefresh: false,
  })
}

export async function changePassword(input: {
  current_password: string
  new_password: string
}): Promise<{ message: string }> {
  return api<{ message: string }>({
    method: "POST",
    path: "/api/v1/auth/change-password",
    body: input,
  })
}

export async function setPlan(plan: string): Promise<User> {
  return api<User>({ method: "POST", path: "/api/v1/auth/plan", body: { plan } })
}

export async function deleteAccount(password: string): Promise<null> {
  const result = await api<null>({
    method: "POST",
    path: "/api/v1/auth/delete-account",
    body: { password },
  })
  setAccessToken(null)
  clearPersistedSession()
  return result
}
