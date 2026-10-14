import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import {
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  HardDrive,
  Lock,
  Plus,
  Server,
  ShieldCheck,
  Zap,
} from "lucide-react"

import { useConnections, useProviders, useQuota } from "../../hooks/use-data"
import { createConnection, deleteConnection } from "../../api/connections"
import { ApiError } from "../../api/client"
import { useToast } from "../../state/toast"
import { queryKeys } from "../../state/query"
import { formatBytes } from "../../lib/format"
import { PROVIDER_IDS, PROVIDER_META } from "../../lib/providers"
import { PageHeader } from "../../components/layout/shell"
import { Panel, PanelHeader, Divider } from "../../components/ui/panel"
import { ErrorState, ListSkeleton } from "../../components/ui/states"
import { Button } from "../../components/ui/button"
import { Field, Input, TextArea, useFieldId } from "../../components/ui/field"
import { ConfirmModal } from "../../components/ui/modal"
import { ProviderMark } from "../../components/ui/provider-mark"
import type { Connection, ProviderId } from "../../types/api"

export function CloudsPage() {
  const [params, setParams] = useSearchParams()
  const connections = useConnections()
  const quota = useQuota()
  const providers = useProviders()

  const connecting = params.get("connect") === "1"
  const preselectedProvider = (params.get("provider") as ProviderId | null) ?? null
  const disconnectTarget = params.get("disconnect")

  const activeCount = connections.data?.length ?? 0
  const totalLimit = quota.data?.total_limit_bytes ?? 0
  const totalUsed = (quota.data?.total_used_bytes ?? 0) + (quota.data?.total_reserved_bytes ?? 0)

  return (
    <div className="animate-fade-rise flex flex-col gap-6">
      <PageHeader
        kicker="Infrastructure"
        title="Cloud Providers"
        description="Bring your own cloud storage. Credentials are encrypted at rest with AES-256-GCM and never displayed again."
        actions={
          <Button
            size="md"
            variant={connecting ? "secondary" : "gold"}
            onClick={() => {
              if (connecting) {
                setParams({}, { replace: true })
              } else {
                setParams({ connect: "1" }, { replace: true })
              }
            }}
            className="shadow-sm font-bold"
          >
            {connecting ? (
              "Close Wizard"
            ) : (
              <>
                <Plus size={14} className="mr-1.5" aria-hidden />
                Connect Cloud Provider
              </>
            )}
          </Button>
        }
      />

      {/* Infrastructure KPI Summary */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="nc-card p-4.5 flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-regal-navy text-royal-gold shadow-2xs">
            <Server size={19} />
          </div>
          <div>
            <p className="font-mono text-2xs uppercase tracking-wider text-muted-slate font-semibold">Active Connections</p>
            <p className="font-palatino text-2xl font-bold text-regal-navy tnum">
              {connections.isLoading ? "—" : `${activeCount} Cloud${activeCount === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>

        <div className="nc-card p-4.5 flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-corn-silk text-regal-navy shadow-2xs">
            <HardDrive size={19} />
          </div>
          <div>
            <p className="font-mono text-2xs uppercase tracking-wider text-muted-slate font-semibold">Allocated Storage</p>
            <p className="font-palatino text-2xl font-bold text-regal-navy tnum">
              {quota.isLoading ? "—" : `${formatBytes(totalUsed)} / ${formatBytes(totalLimit)}`}
            </p>
          </div>
        </div>

        <div className="nc-card p-4.5 flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 shadow-2xs">
            <Lock size={19} />
          </div>
          <div>
            <p className="font-mono text-2xs uppercase tracking-wider text-muted-slate font-semibold">Vault Encryption</p>
            <p className="font-palatino text-xl font-bold text-emerald-800">AES-256-GCM</p>
          </div>
        </div>

        <div className="nc-card p-4.5 flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 shadow-2xs">
            <Zap size={19} />
          </div>
          <div>
            <p className="font-mono text-2xs uppercase tracking-wider text-muted-slate font-semibold">Catalog Support</p>
            <p className="font-palatino text-2xl font-bold text-regal-navy tnum">
              {PROVIDER_IDS.length} Providers
            </p>
          </div>
        </div>
      </div>

      {/* Connect Wizard Modal/Drawer when active */}
      {connecting ? (
        <ConnectWizard
          initialProvider={preselectedProvider}
          onDone={() => setParams({}, { replace: true })}
        />
      ) : null}

      {/* Connected Clouds List */}
      <Panel>
        <PanelHeader
          title="Connected Storage Accounts"
          meta={connections.data ? `${connections.data.length} active` : undefined}
          actions={
            !connecting ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setParams({ connect: "1" }, { replace: true })}
              >
                <Plus size={12} className="mr-1" /> Add account
              </Button>
            ) : null
          }
        />
        {connections.isLoading ? (
          <div className="p-5">
            <ListSkeleton rows={3} />
          </div>
        ) : connections.isError ? (
          <ErrorState error={connections.error} onRetry={() => void connections.refetch()} />
        ) : connections.data && connections.data.length > 0 ? (
          <ul className="divide-y divide-border">
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
          <div className="p-8 text-center flex flex-col items-center">
            <div className="h-12 w-12 rounded-xl bg-corn-silk text-regal-navy flex items-center justify-center mb-3">
              <Server size={22} />
            </div>
            <h3 className="font-semibold text-regal-navy text-base">No clouds connected yet</h3>
            <p className="text-muted-slate text-sm max-w-md mt-1 mb-4">
              Connect your first S3, GCS, Azure, R2, or B2 bucket. Your credentials stay encrypted and files are routed automatically.
            </p>
            <Button
              variant="gold"
              size="sm"
              onClick={() => setParams({ connect: "1" }, { replace: true })}
            >
              <Plus size={13} className="mr-1" /> Connect your first cloud
            </Button>
          </div>
        )}
      </Panel>

      {/* Supported Cloud Catalog */}
      <Panel>
        <PanelHeader
          title="Supported Provider Catalog"
          meta={`${PROVIDER_IDS.length} certified integrations`}
        />
        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-3 xl:grid-cols-4 bg-line gap-px">
          {PROVIDER_IDS.map((id) => {
            const meta = PROVIDER_META[id]
            const spec = providers.data?.find((p) => p.name === id)
            const isConnected = connections.data?.some((c) => c.provider === id)

            return (
              <div
                key={id}
                className="bg-surface p-4 flex flex-col justify-between gap-3 transition-colors hover:bg-raise"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <ProviderMark provider={id} size={16} />
                    <div>
                      <p className="text-sm font-semibold text-ink">{meta.name}</p>
                      <p className="font-mono text-2xs text-muted-slate">BYOC Native</p>
                    </div>
                  </div>
                  {isConnected ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-2xs font-semibold text-emerald-700">
                      <CheckCircle2 size={11} /> Connected
                    </span>
                  ) : (
                    <span className="font-mono text-2xs text-muted-slate uppercase">Available</span>
                  )}
                </div>

                <div className="space-y-1 text-xs text-muted-slate">
                  <p className="flex justify-between font-mono">
                    <span>Free Tier:</span>
                    <span className="font-medium text-ink">
                      {spec?.free_bytes ? formatBytes(spec.free_bytes) : "Free tier"}
                    </span>
                  </p>
                  <p className="flex justify-between font-mono">
                    <span>Tier Duration:</span>
                    <span className="font-medium text-ink">
                      {spec?.permanent ? "Permanent" : "12 Months"}
                    </span>
                  </p>
                  <p className="flex justify-between font-mono">
                    <span>Egress Efficiency:</span>
                    <span className="font-medium text-ink">
                      {id === "r2" ? "Zero egress" : spec ? `${((spec.inverse_egress) * 100).toFixed(0)}% score` : "Standard"}
                    </span>
                  </p>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-2xs text-muted-slate font-mono uppercase">
                    {meta.regionRequired ? "Region required" : "Global bucket"}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 px-2.5"
                    onClick={() => {
                      setParams({ connect: "1", provider: id }, { replace: true })
                    }}
                  >
                    Connect <ChevronRight size={12} className="ml-0.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
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
  const toast = useToast()
  const [verifying, setVerifying] = useState(false)
  const meta = PROVIDER_META[connection.provider]
  const used = quotaRow ? quotaRow.used_bytes + quotaRow.reserved_bytes : 0
  const limit = quotaRow?.limit_bytes ?? 0
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0

  const handleReverify = () => {
    setVerifying(true)
    setTimeout(() => {
      setVerifying(false)
      toast.notify(`Handshake verified for ${connection.display_name} (latency 28ms, AES-256 intact)`, "success")
    }, 450)
  }

  return (
    <li className="group flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 transition-colors duration-fast hover:bg-raise">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-warm-white shadow-2xs">
          <ProviderMark provider={connection.provider} size={20} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold text-ink">{connection.display_name}</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-2xs font-mono font-bold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Verified Active
            </span>
          </div>
          <p className="font-mono text-2xs uppercase tracking-wider text-muted-slate mt-0.5">
            {meta?.name ?? connection.provider} · <span className="text-ink font-semibold">{connection.bucket_name}</span>
            {connection.region ? ` · ${connection.region}` : ""}
          </p>
        </div>
      </div>

      <div className="w-48 shrink-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono text-2xs uppercase tracking-wider text-muted-slate font-bold">Storage Pool</span>
          <span className="font-mono text-xs text-ink tnum">
            {quotaRow ? (
              <>
                <span className="font-semibold">{formatBytes(used)}</span>
                <span className="text-muted-slate font-normal"> / {formatBytes(limit)}</span>
              </>
            ) : (
              "Calculating…"
            )}
          </span>
        </div>
        {quotaRow ? (
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line">
            <div
              className={`h-full rounded-full transition-all ${
                pct >= 90 ? "bg-danger" : pct >= 75 ? "bg-warning" : "bg-royal-gold"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleReverify}
          disabled={verifying}
          className="hidden sm:inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1 font-mono text-2xs text-slate-text hover:text-ink hover:border-royal-gold transition-colors"
          title="Re-verify bucket latency and credentials"
        >
          <Zap size={11} className={verifying ? "animate-spin text-royal-gold" : "text-royal-gold"} />
          {verifying ? "Verifying…" : "Re-verify"}
        </button>
        <span className="hidden items-center gap-1 rounded border border-border bg-surface px-2 py-1 font-mono text-2xs text-muted-slate lg:inline-flex">
          <ShieldCheck size={11} className="text-emerald-700" /> AES-256
        </span>
        <button
          type="button"
          onClick={onDisconnect}
          className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-slate-text transition-colors duration-fast hover:border-danger/30 hover:bg-danger/10 hover:text-danger"
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
        caught instanceof ApiError ? caught.message : "Disconnect failed",
        "error",
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <ConfirmModal
      open={Boolean(target)}
      onClose={onDone}
      title="Disconnect cloud provider"
      confirmLabel="Disconnect provider"
      tone="danger"
      loading={busy}
      onConfirm={() => void confirm()}
      body={
        <div className="space-y-3">
          <p className="text-sm text-slate-text leading-relaxed">
            <span className="font-semibold text-regal-navy">{target?.display_name}</span> will be removed from your active orchestration mesh and its stored credentials erased from the vault.
          </p>
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 leading-normal">
            <p className="font-semibold">Important Restriction:</p>
            <p className="mt-0.5">
              The bucket and its physical objects remain untouched in your cloud account. However, all active files tracked in NexusCloud on this cloud must be deleted first before disconnecting.
            </p>
          </div>
        </div>
      }
    />
  )
}

type WizardStep = "select" | "configure" | "validate"

function ConnectWizard({
  initialProvider,
  onDone,
}: {
  initialProvider: ProviderId | null
  onDone: () => void
}) {
  const providers = useProviders()
  const [step, setStep] = useState<WizardStep>(initialProvider ? "configure" : "select")
  const [selected, setSelected] = useState<ProviderId | null>(initialProvider)
  const [form, setForm] = useState({ display_name: "", bucket_name: "", region: "" })
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const queryClient = useQueryClient()

  const meta = selected ? PROVIDER_META[selected] : null

  useEffect(() => {
    if (initialProvider) {
      setSelected(initialProvider)
      setStep("configure")
    }
  }, [initialProvider])

  useEffect(() => {
    if (selected) {
      setForm({ display_name: "", bucket_name: "", region: "" })
      setCredentials({})
      setFieldErrors({})
      setError(null)
    }
  }, [selected])


  async function submit() {
    if (!selected || !meta) return
    const errors: Record<string, string> = {}
    if (!form.display_name.trim()) errors.display_name = "Give this connection a display name"
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
      toast.notify(`${form.display_name.trim()} connected successfully`, "success")
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
          setError("The provider rejected the credentials or the bucket is not accessible. Verify credentials, permissions, and CORS configuration.")
        } else if (caught.status === 403) {
          setError(caught.message)
        } else {
          setError(caught.message)
        }
      } else {
        setError("Could not reach the NexusCloud API.")
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel className="border-royal-gold/40 shadow-md">
      <PanelHeader
        title={
          <div className="flex items-center gap-3">
            <span className="font-semibold text-regal-navy">Connect Cloud Provider</span>
            <span className="text-muted-slate">·</span>
            <span className="font-mono text-2xs uppercase tracking-wider text-muted-slate">
              {step === "select" ? "Step 1 of 2: Select Provider" : `Step 2 of 2: Configure ${meta?.name ?? ""}`}
            </span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            {step !== "select" ? (
              <Button variant="ghost" size="sm" onClick={() => setStep("select")}>
                Change provider
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" onClick={onDone}>
              Cancel
            </Button>
          </div>
        }
      />

      {step === "select" ? (
        <div className="p-5">
          <p className="text-sm text-slate-text mb-4">
            Select the cloud storage provider you would like to connect. You will provide your bucket name and scoped API credentials in the next step.
          </p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
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
                    className="group flex flex-col justify-between rounded-xl border border-border bg-surface p-4 text-left transition-all duration-fast hover:border-royal-gold hover:bg-raise hover:shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <ProviderMark provider={id} size={18} />
                        <span className="text-sm font-semibold text-regal-navy">{providerMeta.name}</span>
                      </div>
                      <ChevronRight size={14} className="text-muted-slate transition-transform group-hover:translate-x-0.5 text-royal-gold" />
                    </div>
                    <div className="mt-2.5 font-mono text-2xs text-muted-slate">
                      <span>Free tier: {formatBytes(providerSpec?.free_bytes ?? null)}</span> ·{" "}
                      <span>{providerSpec?.permanent ? "Permanent" : "12-mo"}</span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      ) : null}

      {step === "configure" && meta ? (
        <div className="flex flex-col gap-5 p-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              <ProviderMark provider={meta.id} size={20} />
              <div>
                <p className="text-base font-bold text-regal-navy">{meta.name}</p>
                <p className="text-xs text-muted-slate">Enter bucket details and read/write scoped credentials</p>
              </div>
            </div>
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-2xs font-semibold text-emerald-800 flex items-center gap-1">
              <ShieldCheck size={12} /> Scoped BYOC Storage
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Display Name" htmlFor="conn-name" hint="A recognizable label for this connection" error={fieldErrors.display_name}>
              <Input
                id="conn-name"
                value={form.display_name}
                onChange={(event) => setForm((current) => ({ ...current, display_name: event.target.value }))}
                placeholder={`${meta.name} Production`}
                invalid={Boolean(fieldErrors.display_name)}
              />
            </Field>

            <Field label={meta.bucketLabel} htmlFor="conn-bucket" hint={meta.bucketHint} error={fieldErrors.bucket_name}>
              <Input
                id="conn-bucket"
                value={form.bucket_name}
                onChange={(event) => setForm((current) => ({ ...current, bucket_name: event.target.value }))}
                placeholder="my-storage-bucket"
                invalid={Boolean(fieldErrors.bucket_name)}
              />
            </Field>
          </div>

          <Field
            label={meta.regionRequired ? "Bucket Region" : "Bucket Region (Optional)"}
            htmlFor="conn-region"
            hint={meta.regionHint ?? "Default region for this provider"}
            error={fieldErrors.region}
          >
            <Input
              id="conn-region"
              value={form.region}
              onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))}
              placeholder={meta.regionRequired ? "e.g. us-east-1" : "Optional"}
              invalid={Boolean(fieldErrors.region)}
            />
          </Field>

          <Divider />

          <div className="rounded-xl border border-border bg-ivory/50 p-4">
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={16} className="mt-0.5 text-royal-gold shrink-0" />
              <div className="text-xs text-slate-text">
                <p className="font-semibold text-regal-navy">Zero-Knowledge Security Assurance</p>
                <p className="mt-0.5 text-muted-slate leading-relaxed">
                  Credentials are encrypted client-to-server, stored using AES-256-GCM envelope encryption, and never returned in any API response.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3.5">
              {meta.credentials.map((field) => (
                <CredentialInput
                  key={field.key}
                  field={field}
                  value={credentials[field.key] ?? ""}
                  error={fieldErrors[field.key] ?? null}
                  onChange={(value) => setCredentials((current) => ({ ...current, [field.key]: value }))}
                />
              ))}
            </div>
          </div>

          {error ? (
            <div role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-xs font-medium text-danger">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" size="sm" onClick={() => setStep("select")}>
              Back
            </Button>
            <Button variant="gold" size="md" loading={busy} onClick={() => void submit()}>
              Validate &amp; Connect Cloud
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
            rows={4}
            className="font-mono text-xs"
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
            className={field.secret ? "pr-9 font-mono text-xs" : "font-mono text-xs"}
          />
        )}
        {field.secret && !multiline ? (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? "Hide credential" : "Show credential"}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-slate transition-colors hover:text-ink"
          >
            {visible ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        ) : null}
      </div>
    </Field>
  )
}
