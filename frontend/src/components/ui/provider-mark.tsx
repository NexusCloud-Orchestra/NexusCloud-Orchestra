import { PROVIDER_META, providerName } from "../../lib/providers"
import type { ProviderId } from "../../types/api"

/**
 * Provider identity: a small marker square in the provider's hue plus a
 * typographic short label. No giant logos, no rainbow — identity without noise.
 */
export function ProviderMark({ provider, size = 14 }: { provider: ProviderId; size?: number }) {
  const meta = PROVIDER_META[provider]
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-xs border border-black/5"
      style={{ width: size, height: size, backgroundColor: meta?.marker ?? "#8E929C" }}
    />
  )
}

export function ProviderLabel({ provider, id }: { provider: ProviderId; id?: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <ProviderMark provider={provider} />
      <span className="truncate font-mono text-xs font-medium text-ink">{providerName(provider)}</span>
      {id ? <span className="hidden font-mono text-2xs text-ink-3 sm:inline">{id}</span> : null}
    </span>
  )
}
