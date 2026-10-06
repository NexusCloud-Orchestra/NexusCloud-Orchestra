import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { ChevronRight, Eye, EyeOff, ShieldCheck } from "lucide-react"

import { useConnections, useProviders, useQuota } from "../../hooks/use-data"
import { createConnection, deleteConnection } from "../../api/connections"
import { ApiError } from "../../api/client"
import { useToast } from "../../state/toast"
import { queryKeys } from "../../state/query"
import { formatBytes, formatRelative } from "../../lib/format"
import { PROVIDER_IDS, PROVIDER_META } from "../../lib/providers"
import { PageHeader } from "../../components/layout/shell"
import { Panel, PanelHeader, Divider } from "../../components/ui/panel"
import { EmptyState, ErrorState, ListSkeleton } from "../../components/ui/states"
import { StatusBadge } from "../../components/ui/status"
import { Button } from "../../components/ui/button"
import { Field, Input, TextArea, useFieldId } from "../../components/ui/field"
import { ConfirmModal } from "../../components/ui/modal"
import { ProviderMark } from "../../components/ui/provider-mark"
import type { Connection, ProviderId } from "../../types/api"

export function CloudsPage() {
  const [params, setParams] = useSearchParams()
  const connections = useConnections()
  const quota = useQuota()

  const connecting = params.get("connect") === "1"
  const disconnectTarget = params.get("disconnect")

  return (
    <div className="animate-fade-rise flex flex-col gap-6">
      <PageHeader
        kicker="Infrastructure"
        title="Clouds"
        description="Your connected storage. Credentials are encrypted at rest and never displayed again."
        actions={
          <Button
            size="sm"
            variant={connecting ? "secondary" : "primary"}
            onClick={() => setParams(connecting ? {} : { connect: "1" }, { replace: true })}
          >
            {connecting ? "Close wizard" : "Connect cloud"}
          </Button>
        }
      />

      {connecting ? <ConnectWizard onDone={() => setParams({}, { replace: true })} /> : null}

      <Panel>
        <PanelHeader title="Connected" meta={connections.data ? `${connections.data.length} clouds` : undefined} />
        {connections.isLoading ? (
          <ListSkeleton rows={2} />
        ) : connections.isError ? (
          <ErrorState error={connections.error} onRetry={() => void connections.refetch()} />
        ) : connections.data && connections.data.length > 0 ? (
          <ul className="divide-y divide-line">
            {connections.data.map((connection) => (
              <ConnectionRow
                key={connection.id}
                connection={connection}
                quotaRow={quota.data?.by_connection.find((row) => row.connection_id === connection.id) ?? null}
                onDisconnect={() => setParams({ disconnect: connection.id }, { replace: true })}
              />
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No clouds connected"
            body="Connect your first cloud provider — uploads route to connected clouds automatically."
          />
        )}
      </Panel>

      <DisconnectModal
        targetId={disconnectTarget}
        connections={connections.data ?? []}
        onDone={() => setParams({}, { replace: true })}
      />
    </div>
  )
}

function ConnectionRow({
  connection,
  quotaRow,
  onDisconnect,
}: {
  connection: Connection
  quotaRow: { used_bytes: number; reserved_bytes: number; limit_bytes: number; free_bytes: number } | null
  onDisconnect: () => void
}) {
  const meta = PROVIDER_META[connection.provider]
  const used = quotaRow ? quotaRow.used_bytes + quotaRow.reserved_bytes : 0
  const limit = quotaRow?.limit_bytes ?? 0
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0
  return (
    <li className="group flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3.5 transition-colors duration-fast hover:bg-raise">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <ProviderMark provider={connection.provider} size={16} />
        <div className="min-w-0">
          <p className="truncate text-md font-medium text-ink">{connection.display_name}</p>
          <p className="font-mono text-2xs uppercase tracking-kicker text-ink-3">
            {meta?.name ?? connection.provider} · {connection.bucket_name}
            {connection.region ? ` · ${connection.region}` : ""}
          </p>
        </div>
      </div>
      <div className="w-40 shrink-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="label-caps">Used</span>
          <span className="font-mono text-sm text-ink tnum">
            {formatBytes(used)} <span className="text-ink-3">/ {formatBytes(limit)}</span>
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div
            className={`h-full rounded-full ${pct >= 90 ? "bg-bad" : pct >= 75 ? "bg-warn" : "bg-accent"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge tone="ok">Connected</StatusBadge>
        <span className="hidden font-mono text-2xs text-ink-3 md:inline">since {formatRelative(connection.created_at)}</span>
        <button
          type="button"
          onClick={onDisconnect}
          className="rounded-sm border border-line bg-surface px-2 py-1 text-sm text-ink-2 transition-colors duration-fast hover:border-bad-line hover:bg-bad-wash hover:text-bad"
        >
          Disconnect
        </button>
      </div>
    </li>
  )
}

function DisconnectModal({
  targetId,
  connections,
  onDone,
}: {
  targetId: string | null
  connections: Connection[]
  onDone: () => void
}) {
  const target = connections.find((connection) => connection.id === targetId) ?? null
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const queryClient = useQueryClient()

  async function confirm() {
    if (!target) return
    setBusy(true)
    try {
      await deleteConnection(target.id)
      toast.notify(`${target.display_name} disconnected`, "success")
      void queryClient.invalidateQueries({ queryKey: queryKeys.connections })
      void queryClient.invalidateQueries({ queryKey: queryKeys.quota })
      void queryClient.invalidateQueries({ queryKey: queryKeys.files })
      onDone()
    } catch (caught) {
      toast.notify(
        caught instanceof ApiError && caught.status === 409
          ? caught.message
          : caught instanceof ApiError
            ? caught.message
            : "Disconnect failed",
        "error",
      )
    } finally {
      setBusy(false)
    }
  }

  return (      <ConfirmModal
        open={Boolean(target)}
        onClose={onDone}
        title="Disconnect cloud"
        confirmLabel="Disconnect"
        tone="danger"
        loading={busy}
        onConfirm={() => void confirm()}
        body={
          <>
            <p>
              <span className="font-medium text-ink">{target?.display_name}</span> will be disconnected and its stored
              credentials erased. The bucket and its objects stay untouched in your cloud.
            </p>
            <p className="mt-2 rounded-sm border border-warn-line bg-warn-wash px-3 py-2 text-sm text-warn">
              Files must be deleted first — disconnecting is blocked while files remain on this cloud.
            </p>
          </>
        }
      />
  )
}

type WizardStep = "select" | "configure" | "validate"

function ConnectWizard({ onDone }: { onDone: () => void }) {
  const providers = useProviders()
  const [step, setStep] = useState<WizardStep>("select")
  const [selected, setSelected] = useState<ProviderId | null>(null)
  const [form, setForm] = useState({ display_name: "", bucket_name: "", region: "" })
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const queryClient = useQueryClient()

  const meta = selected ? PROVIDER_META[selected] : null

  useEffect(() => {
    if (selected) {
      setForm({ display_name: "", bucket_name: "", region: "" })
      setCredentials({})
      setFieldErrors({})
      setError(null)
    }
  }, [selected])

  const steps: Array<{ id: WizardStep; label: string }> = [
    { id: "select", label: "Provider" },
    { id: "configure", label: "Configure" },
    { id: "validate", label: "Validate" },
  ]
  const stepIndex = steps.findIndex((entry) => entry.id === step)

  async function submit() {
    if (!selected || !meta) return
    const errors: Record<string, string> = {}
    if (!form.display_name.trim()) errors.display_name = "Give this connection a name"
    if (!form.bucket_name.trim()) errors.bucket_name = "Bucket or container name is required"
    if (meta.regionRequired && !form.region.trim()) errors.region = `Region is required for ${meta.name}`
    for (const field of meta.credentials) {
      if (!credentials[field.key]?.trim()) errors[field.key] = `${field.label} is required`
    }
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setBusy(true)
    setError(null)
    try {
      await createConnection({
        provider: selected,
        display_name: form.display_name.trim(),
        bucket_name: form.bucket_name.trim(),
        region: form.region.trim() || null,
        credentials,
      })
      toast.notify(`${form.display_name.trim()} connected`, "success")
      void queryClient.invalidateQueries({ queryKey: queryKeys.connections })
      void queryClient.invalidateQueries({ queryKey: queryKeys.quota })
      onDone()
    } catch (caught) {
      if (caught instanceof ApiError) {
        if (caught.status === 422 && caught.details) {
          const mapped: Record<string, string> = {}
          for (const issue of caught.details) {
            const key = issue.field.replace(/^body\./, "")
            mapped[key] = issue.message
          }
          setFieldErrors(mapped)
        } else if (caught.status === 502) {
          setError("The provider rejected the credentials or the bucket is not accessible. Check credentials, region, bucket access and bucket CORS, then try again.")
        } else if (caught.status === 403) {
          setError(caught.message)
        } else {
          setError(caught.message)
        }
      } else {
        setError("Could not reach the API.")
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel>
      <PanelHeader
        title={
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              {steps.map((entry, index) => (
                <span key={entry.id} className="flex items-center gap-1.5">
                  {index > 0 ? <ChevronRight size={11} className="text-ink-3" aria-hidden /> : null}
                  <span
                    className={`font-mono text-2xs uppercase tracking-kicker ${
                      index === stepIndex ? "text-accent-deep" : index < stepIndex ? "text-ok" : "text-ink-3"
                    }`}
                  >
                    {entry.label}
                  </span>
                </span>
              ))}
            </span>
          </span>
        }
        actions={
          step !== "select" ? (
            <Button variant="ghost" size="sm" onClick={() => setStep(step === "validate" ? "configure" : "select")}>
              Back
            </Button>
          ) : null
        }
      />

      {step === "select" ? (
        <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {providers.isLoading ? (
            <div className="bg-surface px-4 py-8 sm:col-span-2 lg:col-span-3">
              <ListSkeleton rows={3} />
            </div>
          ) : providers.isError ? (
            <div className="bg-surface sm:col-span-2 lg:col-span-3">
              <ErrorState error={providers.error} onRetry={() => void providers.refetch()} />
            </div>
          ) : (
            PROVIDER_IDS.map((id) => {
              const providerMeta = PROVIDER_META[id]
              const providerSpec = providers.data?.find((provider) => provider.name === id)
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setSelected(id)
                    setStep("configure")
                  }}
                  className="group flex flex-col gap-1.5 bg-surface px-4 py-3.5 text-left transition-colors duration-fast hover:bg-raise"
                >
                  <span className="flex items-center gap-2">
                    <ProviderMark provider={id} size={14} />
                    <span className="text-md font-medium text-ink">{providerMeta.name}</span>
                    <ChevronRight size={13} className="ml-auto text-ink-3 transition-transform duration-fast group-hover:translate-x-0.5" aria-hidden />
                  </span>
                  <span className="font-mono text-2xs text-ink-3 tnum">
                    Free tier est. {formatBytes(providerSpec?.free_bytes ?? null)} ·{" "}
                    {providerSpec?.permanent ? "permanent" : "12-month"} · egress{" "}
                    {providerSpec ? (1 - providerSpec.inverse_egress) * 0.12 : 0}/GB·abs
                  </span>
                </button>
              )
            })
          )}
        </div>
      ) : null}

      {step === "configure" && meta ? (
        <div className="flex flex-col gap-4 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <ProviderMark provider={meta.id} size={14} />
            <p className="text-md font-medium text-ink">Configure {meta.name}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Display name" htmlFor="conn-name" error={fieldErrors.display_name}>
              <Input
                id="conn-name"
                value={form.display_name}
                onChange={(event) => setForm((current) => ({ ...current, display_name: event.target.value }))}
                placeholder={`${meta.name} — production`}
                invalid={Boolean(fieldErrors.display_name)}
              />
            </Field>
            <Field label={meta.bucketLabel} htmlFor="conn-bucket" hint={meta.bucketHint} error={fieldErrors.bucket_name}>
              <Input
                id="conn-bucket"
                value={form.bucket_name}
                onChange={(event) => setForm((current) => ({ ...current, bucket_name: event.target.value }))}
                invalid={Boolean(fieldErrors.bucket_name)}
              />
            </Field>
          </div>
          <Field
            label={meta.regionRequired ? "Region" : "Region (optional)"}
            htmlFor="conn-region"
            hint={meta.regionHint ?? undefined}
            error={fieldErrors.region}
          >
            <Input
              id="conn-region"
              value={form.region}
              onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))}
              invalid={Boolean(fieldErrors.region)}
            />
          </Field>
          <Divider className="my-1" />
          <p className="flex items-start gap-2 text-sm text-ink-2">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-ink-3" aria-hidden />
            Credentials are sent once, encrypted at rest (AES-256-GCM), and never returned by the API or displayed
            again.
          </p>
          {meta.credentials.map((field) => (
            <CredentialInput
              key={field.key}
              field={field}
              value={credentials[field.key] ?? ""}
              error={fieldErrors[field.key] ?? null}
              onChange={(value) => setCredentials((current) => ({ ...current, [field.key]: value }))}
            />
          ))}
          {error ? (
            <p role="alert" className="rounded-sm border border-bad-line bg-bad-wash px-3 py-2 text-sm text-bad">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end">
            <Button variant="primary" size="md" loading={busy} onClick={() => void submit()}>
              Validate &amp; connect
            </Button>
          </div>
        </div>
      ) : null}
    </Panel>
  )
}

function CredentialInput({
  field,
  value,
  error,
  onChange,
}: {
  field: { key: string; label: string; hint: string; secret: boolean; placeholder: string }
  value: string
  error: string | null
  onChange: (value: string) => void
}) {
  const [visible, setVisible] = useState(false)
  const id = useFieldId()
  const multiline = field.key === "service_account_json" || field.key === "private_key"
  return (
    <Field label={field.label} htmlFor={id} hint={field.hint} error={error}>
      <div className="relative">
        {multiline ? (
          <TextArea
            id={id}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={field.placeholder}
            invalid={Boolean(error)}
            spellCheck={false}
          />
        ) : (
          <Input
            id={id}
            type={field.secret && !visible ? "password" : "text"}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={field.placeholder}
            invalid={Boolean(error)}
            autoComplete="off"
            spellCheck={false}
            className={field.secret ? "pr-9 font-mono text-sm" : ""}
          />
        )}
        {field.secret && !multiline ? (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? "Hide credential" : "Show credential"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xs p-1 text-ink-3 transition-colors duration-fast hover:text-ink"
          >
            {visible ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        ) : null}
      </div>
    </Field>
  )
}
