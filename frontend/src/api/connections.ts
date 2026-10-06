import { api } from "./client"
import type { Connection, ConnectionCreate, PlanSpec, ProviderSpec } from "../types/api"

export async function listProviders(): Promise<ProviderSpec[]> {
  return api<ProviderSpec[]>({ method: "GET", path: "/api/v1/providers", auth: false })
}

export async function listPlans(): Promise<PlanSpec[]> {
  return api<PlanSpec[]>({ method: "GET", path: "/api/v1/plans", auth: false })
}

export async function listConnections(): Promise<Connection[]> {
  return api<Connection[]>({ method: "GET", path: "/api/v1/connections" })
}

export async function createConnection(input: ConnectionCreate): Promise<Connection> {
  return api<Connection>({ method: "POST", path: "/api/v1/connections", body: input })
}

export async function deleteConnection(connectionId: string): Promise<null> {
  return api<null>({ method: "DELETE", path: `/api/v1/connections/${connectionId}` })
}
