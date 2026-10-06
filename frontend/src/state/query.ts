import { QueryClient } from "@tanstack/react-query"

/** Canonical query keys — the only place key strings are written. */
export const queryKeys = {
  me: ["me"] as const,
  files: ["files"] as const,
  connections: ["connections"] as const,
  quota: ["quota"] as const,
  providers: ["providers"] as const,
  plans: ["plans"] as const,
  audit: ["audit"] as const,
  routePreview: (sizeBytes: number) => ["route-preview", sizeBytes] as const,
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
      mutations: { retry: false },
    },
  })
}
