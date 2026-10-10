import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { ChevronRight, Eye, EyeOff, ShieldCheck } from "lucide-react"

import { useConnections, usePlans, useProviders, useQuota } from "../../hooks/use-data"
import { useAuth } from "../../state/auth"
import { createConnection, deleteConnection } from "../../api/connections"
import { ApiError } from "../../api/client"
import { useToast } from "../../state/toast"
import { queryKeys } from "../../state/query"
import { formatBytes, formatRelative } from "../../lib/format"
import { PROVIDER_IDS, PROVIDER_META } from "../../lib/providers"
import { PageHeader } from "../../components/layout/shell"
import { Panel, PanelHeader, Divider } from "../../components/ui/panel"
import { CapacityBar } from "../../components/ui/progress"
import { EmptyState, ErrorState, ListSkeleton } from "../../components/ui/states"
import { Button } from "../../components/ui/button"
import { Field, Input, TextArea, useFieldId } from "../../components/ui/field"
import { ConfirmModal } from "../../components/ui/modal"
import { ProviderMark } from "../../components/ui/provider-mark"
import type { Connection, ProviderId } from "../../types/api"
import { Meta } from "../../components/ui/meta"
import { Th } from "../../components/ui/table"

export function CloudsPage() {
  const [params, setParams] = useSearchParams()
  const connections = useConnections()
  const quota = useQuota()

  const connecting = params.get("connect") === "1"
  const disconnectTarget = params.get("disconnect")
  const count = connections.data?.length ?? 0
  const { user } = useAuth()
  const plans = usePlans()
  const maxConnections = plans.data?.find((plan) => plan.name === user?.plan)?.max_connections ?? null
  const planLine =
    maxConnections !== null
      ? `${count} of ${maxConnections} clouds on the ${user?.plan} plan`
      : `${count} cloud${count === 1 ? "" : "s"}`

  return (
    <div className="animate-fade-rise flex flex-col gap-6">
      <PageHeader
        title="Clouds"
        description="Your connected buckets. Credentials are encrypted at rest and never shown again."
        actions={
          <Button
            size="sm"
            variant={connecting ? "secondary" : "primary"}
            onClick={() => setParams(connecting ? {} : { connect: "1" }, { replace: true })}
          >
            {connecting ? "Close" : "Connect cloud"}
          </Button>
        }
      />

      {connecting ? <ConnectWizard onDone={() => setParams({}, { replace: true })} /> : null}

      <section aria-label="Connected clouds">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line pb-2">
          <h2 className="text-md font-semibold text-ink">Connected</h2>
          <p className="text-sm text-ink-3 tnum">{connections.data ? planLine : ""}</p>
        </div>
        {connections.isLoading ? (
          <ListSkeleton rows={2} />
        ) : connections.isError ? (
          <ErrorState error={connections.error} onRetry={() => void connections.refetch()} />
        ) : connections.data && connections.data.length > 0 ? (
          <>
            <ul className="md:hidden">
              {connections.data.map((connection) => (
                <ConnectionCard
                  key={connection.id}
                  connection={connection}
                  quotaRow={quota.data?.by_connection.find((row) => row.connection_id === connection.id) ?? null}
                  onDisconnect={() => setParams({ disconnect: connection.id }, { replace: true })}
                />
              ))}
            </ul>
            <table className="hidden w-full border-collapse md:table">
              <caption className="sr-only">Connected clouds with bucket, region and capacity</caption>
              <thead>
                <tr className="border-b border-line">
                  <Th>Cloud</Th>
                  <Th>Bucket</Th>
                  <Th hideBelow="lg">Region</Th>
                  <Th className="w-[28%]">Capacity</Th>
                  <Th hideBelow="lg">Connected</Th>
                  <Th>
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {connections.data.map((connection) => (
                  <ConnectionRow
                    key={connection.id}
                    connection={connection}
                    quotaRow={quota.data?.by_connection.find((row) => row.connection_id === connection.id) ?? null}
                    onDisconnect={() => setParams({ disconnect: connection.id }, { replace: true })}
                  />
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <EmptyState
            title="No clouds connected"
            body="Connect your first provider. Uploads route to connected clouds automatically."
            action={
              !connecting ? (
                <Button size="sm" variant="primary" onClick={() => setParams({ connect: "1" }, { replace: true })}>
                  Connect cloud
                </Button>
              ) : undefined
            }
          />
        )}
      </section>

      <DisconnectModal
        targetId={disconnectTarget}
        connections={connections.data ?? []}
        onDone={() => setParams({}, { replace: true })}
      />
    </div>
  )
}

type QuotaRow = { used_bytes: number; reserved_bytes: number; limit_bytes: number; free_bytes: number } | null

function CloudName({ connection }: { connection: Connection }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <ProviderMark provider={connection.provider} size={12} />
      <span className="min-w-0">
        <span className="block truncate text-md font-medium text-ink">{connection.display_name}</span>
        <span className="text-sm text-ink-3">{PROVIDER_META[connection.provider]?.name ?? connection.provider}</span>
      </span>
    </span>
  )
}

function Usage({ connection, quotaRow }: { connection: Connection; quotaRow: QuotaRow }) {
  const used = quotaRow?.used_bytes ?? 0
  const reserved = quotaRow?.reserved_bytes ?? 0
  const limit = quotaRow?.limit_bytes ?? 0
  return (
    <div>
      <CapacityBar used={used} reserved={reserved} limit={limit} label={`${connection.display_name} capacity used`} />
      <p className="mt-1.5 font-mono text-sm text-ink-2 tnum">
        {formatBytes(used)}
        {reserved > 0 ? <span className="text-accent-deep"> +{formatBytes(reserved)}</span> : null}
        <span className="text-ink-3"> / {formatBytes(limit)}</span>
      </p>
    </div>
  )
}

function DisconnectButton({ connection, onDisconnect }: { connection: Connection; onDisconnect: () => void }) {
  return (
    <Button size="sm" variant="danger" onClick={onDisconnect} aria-label={`Disconnect ${connection.display_name}`}>
      Disconnect
    </Button>
  )
}

function ConnectionRow({ connection, quotaRow, onDisconnect }: { connection: Connection; quotaRow: QuotaRow; onDisconnect: () => void }) {
  return (
    <tr className="row align-middle">
      <td className="py-3.5 pl-1 pr-3">
        <CloudName connection={connection} />
      </td>
      <td className="px-3 py-3.5 font-mono text-sm text-ink-2">{connection.bucket_name}</td>
      <td className="hidden px-3 py-3.5 font-mono text-sm text-ink-2 lg:table-cell">{connection.region ?? "-"}</td>
      <td className="px-3 py-3.5">
        <Usage connection={connection} quotaRow={quotaRow} />
      </td>
      <td className="hidden px-3 py-3.5 text-sm text-ink-3 lg:table-cell">{formatRelative(connection.created_at)}</td>
      <td className="py-3.5 pl-3 pr-1 text-right">
        <DisconnectButton connection={connection} onDisconnect={onDisconnect} />
      </td>
    </tr>
  )
}

/** Phone layout: the same facts stacked, since a five-column table does not fit. */
function ConnectionCard({ connection, quotaRow, onDisconnect }: { connection: Connection; quotaRow: QuotaRow; onDisconnect: () => void }) {
  return (
    <li className="row flex flex-col gap-3 px-1 py-4">
      <CloudName connection={connection} />
      <Meta
        className="text-sm text-ink-3"
        items={[<span className="font-mono text-xs">{connection.bucket_name}</span>, connection.region, `Connected ${formatRelative(connection.created_at)}`]}
      />
      <Usage connection={connection} quotaRow={quotaRow} />
      <div>
        <DisconnectButton connection={connection} onDisconnect={onDisconnect} />
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
                    className={`text-sm ${
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
            <div className="bg-surface px-4 sm:col-span-2 lg:col-span-3">
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
                  <span className="text-sm text-ink-3 tnum">
                    <Meta
                      items={[
                        providerSpec ? `Free tier ${formatBytes(providerSpec.free_bytes)}` : null,
                        providerSpec ? (providerSpec.permanent ? "Permanent tier" : "Time-limited tier") : null,
                        providerSpec ? `Egress score ${providerSpec.inverse_egress.toFixed(1)}` : null,
                      ]}
                    />
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
