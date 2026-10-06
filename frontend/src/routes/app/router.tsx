import { useEffect, useMemo, useState } from "react"
import { Play, RotateCw } from "lucide-react"
import { useConnections, useRoutePreview } from "../../hooks/use-data"
import { formatBytes } from "../../lib/format"
import { ROUTE_WEIGHTS } from "../../lib/providers"
import { PageHeader } from "../../components/layout/shell"
import { Panel, PanelHeader } from "../../components/ui/panel"
import { EmptyState, ErrorState, ListSkeleton } from "../../components/ui/states"
import { StatusBadge } from "../../components/ui/status"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/field"
import { ProviderMark } from "../../components/ui/provider-mark"
import type { RouteCandidate } from "../../types/api"

type Phase = "idle" | "analysing" | "evaluating" | "decided"

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
    <div className="animate-fade-rise flex flex-col gap-6">
      <PageHeader
        kicker="Placement"
        title="Smart Router"
        description="Read-only decision preview. The same placement code runs when an upload is requested."
      />

      <Panel>
        <PanelHeader title="Request" meta="1 B – 5 GiB" />
        <form
          className="flex flex-wrap items-end gap-3 px-4 py-4"
          onSubmit={(event) => {
            event.preventDefault()
            setSubmitted(sizeBytes)
          }}
        >
          <div className="w-56">
            <label htmlFor="route-size" className="mb-1.5 block text-sm font-medium text-ink">
              File size (bytes)
            </label>
            <Input
              id="route-size"
              type="number"
              min={1}
              max={5 * 1024 ** 3}
              value={sizeText}
              onChange={(event) => setSizeText(event.target.value)}
              className="font-mono"
            />
          </div>
          <Button type="submit" variant="primary" disabled={!sizeBytes}>
            <Play size={12} aria-hidden />
            Evaluate placement
          </Button>
          <p className="font-mono text-2xs text-ink-3 tnum">{sizeBytes ? formatBytes(sizeBytes) : "—"}</p>
        </form>
      </Panel>

      {!hasConnections && !connections.isLoading ? (
        <Panel>
          <EmptyState
            title="No clouds connected"
            body="The router scores connected clouds. Connect a provider first."
          />
        </Panel>
      ) : null}

      {submitted !== null && hasConnections ? (
        preview.isLoading || preview.isFetching ? (
          <Panel>
            <ListSkeleton rows={3} />
            <p className="px-4 pb-4 text-sm text-ink-3">Analysing available clouds…</p>
          </Panel>
        ) : preview.isError ? (
          <Panel>
            <ErrorState error={preview.error} onRetry={() => void preview.refetch()} />
          </Panel>
        ) : preview.data ? (
          <RouteDecision preview={preview.data} onReplay={() => setSubmitted(null)} />
        ) : null
      ) : null}
    </div>
  )
}

function RouteDecision({ preview, onReplay }: { preview: NonNullable<ReturnType<typeof useRoutePreview>["data"]>; onReplay: () => void }) {
  const [phase, setPhase] = useState<Phase>("analysing")
  const [revealed, setRevealed] = useState(0)

  const eligibleCount = preview.candidates.filter((candidate) => candidate.eligible).length

  // Staged reveal: candidates appear, then are evaluated one by one, then decided.
  useEffect(() => {
    setPhase("analysing")
    setRevealed(0)
    const timers: number[] = []
    timers.push(
      window.setTimeout(() => setPhase("evaluating"), 450),
      window.setTimeout(() => setPhase("decided"), 450 + Math.min(eligibleCount, 5) * 260 + 350),
    )
    for (let index = 1; index <= Math.min(eligibleCount, 5); index += 1) {
      timers.push(window.setTimeout(() => setRevealed(index), 450 + index * 260))
    }
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [preview, eligibleCount])

  const selected = preview.candidates.find((candidate) => candidate.connection_id === preview.selected_connection_id)

  return (
    <div className="flex flex-col gap-6">
      {preview.blocked_reason ? (
        <Panel>
          <div className="flex flex-col gap-1.5 px-4 py-5">
            <p className="label-caps">Blocked</p>
            <p className="text-lg font-medium text-ink">{preview.message ?? "Upload cannot proceed"}</p>
            <p className="font-mono text-2xs uppercase tracking-kicker text-ink-3">reason · {preview.blocked_reason}</p>
          </div>
        </Panel>
      ) : null}

      <Panel>
        <PanelHeader
          title="Candidate evaluation"
          meta={`${formatBytes(preview.size_bytes)} · ${preview.candidates.length} clouds scored`}
          actions={
            <Button variant="ghost" size="sm" onClick={onReplay}>
              <RotateCw size={11} aria-hidden />
              New evaluation
            </Button>
          }
        />
        <ol className="flex flex-col">
          {preview.candidates.map((candidate, index) => (
            <CandidateRow
              key={candidate.connection_id}
              candidate={candidate}
              rank={index}
              revealed={phase === "decided" || index < revealed}
              deciding={phase === "decided"}
              selected={candidate.connection_id === preview.selected_connection_id}
            />
          ))}
        </ol>
      </Panel>

      {phase === "decided" && selected ? (
        <Panel className="animate-fade-rise border-accent-line">
          <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1.5">
              <p className="label-caps">Recommended</p>
              <p className="flex items-center gap-2.5 text-2xl font-semibold tracking-tighter text-ink">
                <ProviderMark provider={selected.provider} size={18} />
                {selected.display_name}
              </p>
              <p className="font-mono text-2xs uppercase tracking-kicker text-ink-3">
                {providerLabel(selected)} · score {selected.score?.toFixed(3)}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="label-caps">Why</p>
              <ul className="flex flex-col gap-0.5">
                {ROUTE_WEIGHTS.map((weight) => {
                  const value = selected.components ? selected.components[weight.key] : null
                  if (value === null) return null
                  return (
                    <li key={weight.key} className="flex items-baseline gap-2 font-mono text-sm text-ink-2 tnum">
                      <span className="w-40 text-ink-3">{weight.label}</span>
                      <span className="text-ink">+{value.toFixed(3)}</span>
                      <span className="text-ink-3">/ {weight.weight.toFixed(2)} max</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </Panel>
      ) : null}

      <Panel>
        <PanelHeader title="Routing policy" meta="fixed weights · backend-owned" />
        <div className="flex flex-wrap gap-x-8 gap-y-3 px-4 py-4">
          {ROUTE_WEIGHTS.map((weight) => (
            <div key={weight.key}>
              <p className="font-mono text-lg text-ink tnum">{weight.weight.toFixed(2)}</p>
              <p className="label-caps">{weight.label}</p>
            </div>
          ))}
          <p className="max-w-prose text-sm text-ink-3">
            Every eligible cloud is scored: capacity relative to the freest cloud, egress efficiency, whether the
            free tier is permanent, and how well the file fits the remaining quota. The highest score wins. The
            frontend displays these values — it never recomputes the decision.
          </p>
        </div>
      </Panel>
    </div>
  )
}

function providerLabel(candidate: RouteCandidate): string {
  const free = candidate.free_bytes
  return free >= 1024 ** 3 ? `${(free / 1024 ** 3).toFixed(1)} GiB free` : `${formatBytes(free)} free`
}

function CandidateRow({
  candidate,
  rank,
  revealed,
  deciding,
  selected,
}: {
  candidate: RouteCandidate
  rank: number
  revealed: boolean
  deciding: boolean
  selected: boolean
}) {
  const winner = deciding && selected

  return (
    <li
      className={`relative flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line px-4 py-3 transition-all duration-slow ease-out last:border-b-0 ${
        winner ? "bg-accent-wash" : revealed ? "" : "opacity-0"
      } ${candidate.eligible ? "" : "opacity-60"}`}
    >
      <span className="w-5 shrink-0 font-mono text-2xs text-ink-3 tnum">{String(rank + 1).padStart(2, "0")}</span>
      <span className="flex min-w-0 flex-1 items-center gap-2.5">
        <ProviderMark provider={candidate.provider} size={12} />
        <span className="truncate text-base font-medium text-ink">{candidate.display_name}</span>
      </span>
      <span className="hidden w-28 shrink-0 font-mono text-sm text-ink-2 tnum sm:block">
        {formatBytes(candidate.free_bytes)} free
      </span>
      {candidate.eligible ? (
        <span className="w-40 shrink-0">
          <ScoreBar value={candidate.score ?? 0} reveal={revealed} winner={winner} />
        </span>
      ) : null}
      <span className="shrink-0">
        {candidate.eligible ? (
          <StatusBadge tone={winner ? "ok" : "neutral"}>{`Score ${(candidate.score ?? 0).toFixed(3)}`}</StatusBadge>
        ) : (
          <StatusBadge tone="warn">Ineligible</StatusBadge>
        )}
      </span>
    </li>
  )
}

function ScoreBar({ value, reveal, winner }: { value: number; reveal: boolean; winner: boolean }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
      <div
        className={`h-full rounded-full transition-[width] duration-slow ease-out ${winner ? "bg-ok" : "bg-accent"}`}
        style={{ width: reveal ? `${Math.max(4, (value / 1.0) * 100)}%` : "0%" }}
      />
    </div>
  )
}
