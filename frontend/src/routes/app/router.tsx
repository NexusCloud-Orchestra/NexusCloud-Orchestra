import { useEffect, useMemo, useState } from "react"
import { Play } from "lucide-react"
import { useConnections, useRoutePreview } from "../../hooks/use-data"
import { formatBytes } from "../../lib/format"
import { ROUTE_WEIGHTS } from "../../lib/providers"
import { PageHeader } from "../../components/layout/shell"
import { EmptyState, ErrorState, ListSkeleton } from "../../components/ui/states"
import { StatusBadge } from "../../components/ui/status"
import { Button, buttonClass } from "../../components/ui/button"
import { Input } from "../../components/ui/field"
import { PlacementStrip } from "../../components/ui/placement-strip"
import { ProviderMark } from "../../components/ui/provider-mark"
import { Link } from "react-router-dom"
import type { RoutePreview, RouteCandidate } from "../../types/api"

const MIB = 1024 ** 2
const GIB = 1024 ** 3
const PRESETS = [
  { label: "1 MiB", bytes: MIB },
  { label: "100 MiB", bytes: 100 * MIB },
  { label: "1 GiB", bytes: GIB },
  { label: "5 GiB", bytes: 5 * GIB },
]

export function RouterPage() {
  const [sizeText, setSizeText] = useState("1048576")
  const [submitted, setSubmitted] = useState<number | null>(null)
  const preview = useRoutePreview(submitted)
  const connections = useConnections()

  const sizeBytes = useMemo(() => {
    const value = Number.parseInt(sizeText, 10)
    return Number.isFinite(value) && value > 0 ? value : null
  }, [sizeText])

  const hasConnections = (connections.data?.length ?? 0) > 0

  return (
    <div className="animate-fade-rise flex flex-col gap-8">
      <PageHeader
        title="Router"
        description="Read-only preview of where a file would go. The upload path runs the same placement code."
      />

      <form
        className="flex flex-col gap-4 border-b border-line pb-6"
        onSubmit={(event) => {
          event.preventDefault()
          setSubmitted(sizeBytes)
        }}
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-64">
            <label htmlFor="route-size" className="mb-1.5 block text-sm font-medium text-ink">
              File size in bytes
            </label>
            <Input
              id="route-size"
              type="number"
              min={1}
              max={5 * GIB}
              value={sizeText}
              onChange={(event) => setSizeText(event.target.value)}
              className="font-mono"
              aria-describedby="route-size-hint"
            />
          </div>
          <Button type="submit" variant="primary" disabled={!sizeBytes || !hasConnections}>
            <Play size={12} aria-hidden />
            Preview placement
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span id="route-size-hint" className="mr-1 text-sm text-ink-3 tnum">
            {sizeBytes ? `${formatBytes(sizeBytes)}. Range 1 B to 5 GiB.` : "Enter a size from 1 B to 5 GiB."}
          </span>
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setSizeText(String(preset.bytes))
                setSubmitted(preset.bytes)
              }}
              className="rounded-xs px-1 py-0.5 font-mono text-sm text-ink-2 underline decoration-line-strong underline-offset-4 transition-colors duration-fast ease-out hover:text-ink hover:decoration-ink-3"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </form>

      {connections.isLoading ? (
        <ListSkeleton rows={2} />
      ) : !hasConnections ? (
        <EmptyState
          title="No clouds connected"
          body="The router scores connected clouds, so there is nothing to preview yet."
          action={
            <Link to="/app/clouds?connect=1" className={buttonClass("primary")}>
              Connect cloud
            </Link>
          }
        />
      ) : submitted === null ? (
        <PolicyNote />
      ) : preview.isLoading || preview.isFetching ? (
        <div>
          <ListSkeleton rows={3} />
          <p className="pt-2 text-sm text-ink-3">Scoring your clouds…</p>
        </div>
      ) : preview.isError ? (
        <ErrorState error={preview.error} onRetry={() => void preview.refetch()} />
      ) : preview.data ? (
        <RouteDecision preview={preview.data} />
      ) : null}
    </div>
  )
}

/** Fixed policy, shown once and as a footnote: the backend owns the weights. */
function PolicyNote() {
  return (
    <section aria-label="Routing policy" className="max-w-prose">
      <h2 className="text-md font-semibold text-ink">How a cloud is chosen</h2>
      <p className="mt-2 text-base text-ink-2">
        Every eligible cloud gets a score from four weighted parts. The highest score wins, and the browser never recomputes it.
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
        {ROUTE_WEIGHTS.map((weight) => (
          <div key={weight.key}>
            <dd className="font-mono text-lg text-ink tnum">{weight.weight.toFixed(2)}</dd>
            <dt className="text-sm text-ink-3">{weight.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  )
}

function RouteDecision({ preview }: { preview: RoutePreview }) {
  // Staged reveal: candidates are scored one by one, then the winner is marked.
  const [revealed, setRevealed] = useState(0)
  const eligible = preview.candidates.filter((candidate) => candidate.eligible).length
  const decided = revealed >= preview.candidates.length

  useEffect(() => {
    setRevealed(0)
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      setRevealed(preview.candidates.length)
      return
    }
    const timers: number[] = []
    for (let index = 1; index <= preview.candidates.length; index += 1) {
      timers.push(window.setTimeout(() => setRevealed(index), 220 * index))
    }
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [preview])

  const selected = preview.candidates.find((candidate) => candidate.connection_id === preview.selected_connection_id) ?? null

  return (
    <div className="flex flex-col gap-8">
      {preview.blocked_reason ? (
        <div role="alert" className="border-l-2 border-warn pl-3">
          <p className="text-md font-medium text-ink">{preview.message ?? "This file cannot be uploaded"}</p>
          <p className="mt-0.5 text-sm text-ink-3">
            Reason: <span className="font-mono">{preview.blocked_reason}</span>
          </p>
        </div>
      ) : null}

      <section aria-label="Placement" className="flex flex-col gap-4">
        <h2 className="text-md font-semibold text-ink">
          {formatBytes(preview.size_bytes)} would go to{" "}
          {decided && selected ? <span className="text-accent">{selected.display_name}</span> : decided ? "no cloud" : "…"}
        </h2>
        <PlacementStrip
          label="Candidate clouds by free capacity"
          selectedId={decided ? preview.selected_connection_id : null}
          segments={preview.candidates.map((candidate) => ({
            id: candidate.connection_id,
            provider: candidate.provider,
            name: candidate.display_name,
            freeBytes: candidate.free_bytes,
            eligible: candidate.eligible,
          }))}
        />
      </section>

      <section aria-label="Candidate scores">
        <div className="flex items-baseline justify-between border-b border-line pb-2">
          <h2 className="text-md font-semibold text-ink">Scores</h2>
          <p className="text-sm text-ink-3 tnum">
            {eligible} of {preview.candidates.length} eligible
          </p>
        </div>
        <ol>
          {preview.candidates.map((candidate, index) => (
            <CandidateRow
              key={candidate.connection_id}
              candidate={candidate}
              revealed={index < revealed}
              winner={decided && candidate.connection_id === preview.selected_connection_id}
            />
          ))}
        </ol>
      </section>

      <PolicyNote />
    </div>
  )
}

function CandidateRow({ candidate, revealed, winner }: { candidate: RouteCandidate; revealed: boolean; winner: boolean }) {
  return (
    <li
      className={`row px-1 py-4 transition-opacity duration-slow ease-out ${revealed ? "opacity-100" : "opacity-0"} ${
        candidate.eligible ? "" : "opacity-60"
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <ProviderMark provider={candidate.provider} size={12} />
        <span className="min-w-0 flex-1 truncate text-md font-medium text-ink">{candidate.display_name}</span>
        <span className="font-mono text-sm text-ink-2 tnum">{formatBytes(candidate.free_bytes)} free</span>
        {candidate.eligible ? (
          <span className={`font-mono text-sm tnum ${winner ? "text-accent" : "text-ink"}`}>
            {(candidate.score ?? 0).toFixed(3)}
          </span>
        ) : null}
        {winner ? <StatusBadge tone="ok">Selected</StatusBadge> : null}
        {!candidate.eligible ? <StatusBadge tone="warn">Ineligible</StatusBadge> : null}
      </div>
      {candidate.eligible && candidate.components ? (
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
          {ROUTE_WEIGHTS.map((weight) => {
            const value = candidate.components ? candidate.components[weight.key] : 0
            return (
              <div key={weight.key}>
                <dt className="flex items-baseline justify-between text-xs text-ink-3">
                  <span>{weight.label}</span>
                  <span className="font-mono tnum">{value.toFixed(3)}</span>
                </dt>
                <dd className="mt-1 h-1 overflow-hidden rounded-full bg-line">
                  <div
                    className={`h-full rounded-full transition-[width] duration-slow ease-out ${winner ? "bg-accent" : "bg-ink-3"}`}
                    style={{ width: revealed ? `${Math.min(100, (value / weight.weight) * 100)}%` : "0%" }}
                  />
                </dd>
              </div>
            )
          })}
        </dl>
      ) : null}
    </li>
  )
}
