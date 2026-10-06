import { api } from "./client"
import type { QuotaSummary } from "../types/api"

export async function quotaSummary(): Promise<QuotaSummary> {
  return api<QuotaSummary>({ method: "GET", path: "/api/v1/quota/summary" })
}
