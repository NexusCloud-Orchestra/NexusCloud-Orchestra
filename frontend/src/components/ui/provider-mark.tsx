import { ProviderIcon } from "./cloud-logos"
import { providerName } from "../../lib/providers"
import type { ProviderId } from "../../types/api"

/**
 * Provider identity mark: renders the bespoke vector logo for the cloud provider.
 */
export function ProviderMark({
  provider,
  size = 14,
  className = "",
}: {
  provider: ProviderId | "multi" | string
  size?: number
  className?: string
}) {
  return <ProviderIcon provider={provider} size={size} className={className} />
}

export function ProviderLabel({ provider, id }: { provider: ProviderId; id?: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <ProviderMark provider={provider} size={15} />
      <span className="truncate font-mono text-xs font-medium text-ink">{providerName(provider)}</span>
      {id ? <span className="hidden font-mono text-2xs text-ink-3 sm:inline">{id}</span> : null}
    </span>
  )
}
