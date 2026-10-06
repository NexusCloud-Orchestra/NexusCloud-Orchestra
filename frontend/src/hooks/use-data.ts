import { useQuery } from "@tanstack/react-query"
import { useAuth } from "../state/auth"
import { queryKeys } from "../state/query"
import * as connectionsApi from "../api/connections"
import * as filesApi from "../api/files"
import * as quotaApi from "../api/quota"
import * as authApi from "../api/auth"
import type { RoutePreview } from "../types/api"

export function useProviders() {
  return useQuery({ queryKey: queryKeys.providers, queryFn: connectionsApi.listProviders, staleTime: 5 * 60_000 })
}

export function usePlans() {
  return useQuery({ queryKey: queryKeys.plans, queryFn: connectionsApi.listPlans, staleTime: 5 * 60_000 })
}

export function useConnections() {
  const { status } = useAuth()
  return useQuery({
    queryKey: queryKeys.connections,
    queryFn: connectionsApi.listConnections,
    enabled: status === "authenticated",
  })
}

export function useFiles() {
  const { status } = useAuth()
  return useQuery({ queryKey: queryKeys.files, queryFn: filesApi.listFiles, enabled: status === "authenticated" })
}

export function useQuota() {
  const { status } = useAuth()
  return useQuery({ queryKey: queryKeys.quota, queryFn: quotaApi.quotaSummary, enabled: status === "authenticated" })
}

export function useAuditLogs() {
  const { status } = useAuth()
  return useQuery({
    queryKey: queryKeys.audit,
    queryFn: authApi.auditLogs,
    enabled: status === "authenticated",
    staleTime: 15_000,
  })
}

/** Route preview is keyed by requested size so each size gets its own decision. */
export function useRoutePreview(sizeBytes: number | null) {
  const { status } = useAuth()
  return useQuery<RoutePreview>({
    queryKey: queryKeys.routePreview(sizeBytes ?? 0),
    queryFn: () => filesApi.routePreview(sizeBytes as number),
    enabled: status === "authenticated" && sizeBytes !== null && sizeBytes > 0,
  })
}
