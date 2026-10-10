import { providerName } from "../../lib/providers"
import { formatBytes } from "../../lib/format"
import type { ProviderId } from "../../types/api"
import { ProviderMark } from "./provider-mark"

export interface StripSegment {
  id: string
  provider: ProviderId
  name: string
  /** Free bytes; sets the segment's share of the strip. */
  freeBytes: number
  eligible?: boolean
}

/**
 * The app's signature: one segment per connected cloud, sized by free capacity,
 * with a gold marker over the cloud the router picks. Same glyph language as the
 * landing page's route line (hairline, stops, one gold dot).
 */
export function PlacementStrip({
  segments,
  selectedId,
  label,
}: {
  segments: StripSegment[]
  selectedId: string | null
  label: string
}) {
  const total = segments.reduce((sum, segment) => sum + Math.max(0, segment.freeBytes), 0)
  return (
    <ul aria-label={label} className="flex w-full gap-1.5">
      {segments.map((segment) => {
        const share = total > 0 ? Math.max(0.08, segment.freeBytes / total) : 1 / Math.max(1, segments.length)
        const selected = segment.id === selectedId
        const eligible = segment.eligible !== false
        return (
          <li key={segment.id} style={{ flex: `${share} 1 0` }} className="min-w-[72px]" aria-current={selected ? "true" : undefined}>
            <div className="flex h-3 items-end" aria-hidden>
              {selected ? (
                <svg width="10" height="7" viewBox="0 0 10 7" className="text-accent">
                  <path d="M0 0H10L5 7Z" fill="currentColor" />
                </svg>
              ) : null}
            </div>
            <div
              className={`h-2 rounded-xs ${selected ? "bg-accent" : eligible ? "bg-line-strong" : "bg-line opacity-60"}`}
            />
            <div className="mt-2 flex min-w-0 items-center gap-1.5">
              <ProviderMark provider={segment.provider} size={9} />
              <span className={`truncate text-sm ${selected ? "font-medium text-ink" : "text-ink-2"}`}>
                {segment.name || providerName(segment.provider)}
              </span>
            </div>
            <p className="mt-0.5 font-mono text-xs text-ink-3 tnum">
              {formatBytes(segment.freeBytes)}
              {eligible ? "" : " (ineligible)"}
            </p>
          </li>
        )
      })}
    </ul>
  )
}
