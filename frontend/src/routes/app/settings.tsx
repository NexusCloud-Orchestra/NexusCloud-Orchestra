import { useState } from "react"
import type { FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  ArrowRight,
  HardDrive,
  Key,
  Lock,
  Server,
  ShieldAlert,
  User,
} from "lucide-react"

import { useAuth } from "../../state/auth"
import { useToast } from "../../state/toast"
import { queryKeys } from "../../state/query"
import { changePassword, deleteAccount, setPlan } from "../../api/auth"
import { ApiError } from "../../api/client"
import { formatDateTime, initialsOf } from "../../lib/format"
import { usePlans } from "../../hooks/use-data"
import { formatBytes } from "../../lib/format"
import { PageHeader } from "../../components/layout/shell"
import { Panel, PanelHeader } from "../../components/ui/panel"
import { Button } from "../../components/ui/button"
import { Field, Input } from "../../components/ui/field"
import { ConfirmModal } from "../../components/ui/modal"
import { PROVIDER_IDS } from "../../lib/providers"

export function SettingsPage() {
  const { user } = useAuth()
  const plans = usePlans()
  const navigate = useNavigate()

  const currentPlan = plans.data?.find((plan) => plan.name === user?.plan) ?? null

  return (
    <div className="animate-fade-rise flex flex-col gap-4 sm:gap-4.5 pb-6">
      <PageHeader
        kicker="Account Administration"
        title="Settings &amp; Security"
        description="Manage your account profile, authentication credentials, and storage orchestration plan."
      />

      {/* Profile Overview */}
      <Panel>
        <PanelHeader
          title="Account Identity"
          meta={user ? `UID: ${user.id.slice(0, 8)}…` : undefined}
        />
        {user ? (
          <div className="p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-regal-navy text-royal-gold font-mono text-base font-bold shadow-xs">
                {initialsOf(user.first_name, user.last_name)}
              </div>
              <div>
                <p className="text-base font-bold text-regal-navy">
                  {user.first_name} {user.last_name}
                </p>
                <p className="font-mono text-xs text-muted-slate">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-6 border-t border-border pt-3 sm:border-t-0 sm:pt-0 font-mono text-xs">
              <div>
                <span className="block text-2xs uppercase tracking-wider text-muted-slate font-semibold">Account Tier</span>
                <span className="font-bold text-regal-navy uppercase">{user.plan}</span>
              </div>
              <div className="text-right">
                <span className="block text-2xs uppercase tracking-wider text-muted-slate font-semibold">Registered</span>
                <span className="text-slate-text">{formatDateTime(user.created_at)}</span>
              </div>
            </div>
          </div>
        ) : null}
      </Panel>

      {/* Plan & Quota Specification */}
      <Panel>
        <PanelHeader
          title="Storage Orchestration Tier"
          meta={user?.plan ? `Active: ${user.plan.toUpperCase()}` : undefined}
          actions={
            <span className="inline-flex items-center gap-1 rounded-md bg-royal-gold/15 px-2.5 py-1 font-mono text-2xs font-bold text-royal-gold border border-royal-gold/30 uppercase">
              {user?.plan ?? "free"} Tier
            </span>
          }
        />
        <div className="p-5 flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="nc-card p-4">
              <div className="flex items-center gap-2 text-muted-slate mb-1">
                <Server size={14} />
                <span className="font-mono text-2xs uppercase tracking-wider font-semibold">Cloud Connections</span>
              </div>
              <p className="font-display text-xl font-bold text-regal-navy tnum">
                {currentPlan?.max_connections ?? "Unlimited"}
              </p>
              <p className="text-2xs text-muted-slate mt-0.5">Maximum concurrent BYOC buckets</p>
            </div>

            <div className="nc-card p-4">
              <div className="flex items-center gap-2 text-muted-slate mb-1">
                <HardDrive size={14} />
                <span className="font-mono text-2xs uppercase tracking-wider font-semibold">Storage Pool Limit</span>
              </div>
              <p className="font-display text-xl font-bold text-regal-navy tnum">
                {currentPlan?.max_bytes ? formatBytes(currentPlan.max_bytes) : "No byte cap"}
              </p>
              <p className="text-2xs text-muted-slate mt-0.5">Capped capacity across all clouds</p>
            </div>

            <div className="nc-card p-4">
              <div className="flex items-center gap-2 text-muted-slate mb-1">
                <User size={14} />
                <span className="font-mono text-2xs uppercase tracking-wider font-semibold">Team Seats</span>
              </div>
              <p className="font-display text-xl font-bold text-regal-navy tnum">
                {currentPlan?.seats ?? 1}
              </p>
              <p className="text-2xs text-muted-slate mt-0.5">Authorized workspace operators</p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">Billing System Notice</p>
                <p className="mt-0.5">
                  Paid enterprise tier upgrades (Starter, Pro, Team) will become available upon full billing provider integration. The current backend allows switching between Free and custom allowances once configured.
                </p>
              </div>
            </div>
          </div>

          <PlanActions currentPlan={user?.plan ?? "free"} />
        </div>
      </Panel>

      {/* Security & Password */}
      <PasswordPanel />

      {/* BYOC Infrastructure Link */}
      <Panel>
        <PanelHeader title="Cloud Mesh Management" />
        <div className="p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-regal-navy text-sm">Manage Storage Connections &amp; Credentials</p>
            <p className="text-xs text-muted-slate mt-0.5">
              Configure AWS, Azure, Google Cloud, Cloudflare R2, Backblaze B2, Oracle, or IBM buckets in the Clouds console.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate("/app/clouds")}>
            Open Cloud Console <ArrowRight size={13} className="ml-1" />
          </Button>
        </div>
      </Panel>

      {/* Danger Zone: Account Deletion */}
      <AccountDeletion />

      {/* Platform Metadata Footnote */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-2xs text-muted-slate font-mono">
        <span>Supported Storage Providers: {PROVIDER_IDS.join(" · ")}</span>
        <span>Security: AES-256-GCM / PBKDF2 Password Hashing</span>
      </div>
    </div>
  )
}

function PlanActions({ currentPlan }: { currentPlan: string }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [busyPlan, setBusyPlan] = useState<string | null>(null)

  async function switchPlan(plan: string) {
    setBusyPlan(plan)
    try {
      await setPlan(plan)
      toast.notify(`Plan updated to ${plan}`, "success")
      void queryClient.invalidateQueries({ queryKey: queryKeys.quota })
      void queryClient.invalidateQueries({ queryKey: queryKeys.me })
    } catch (caught) {
      toast.notify(caught instanceof ApiError ? caught.message : "Plan change failed", "error")
    } finally {
      setBusyPlan(null)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
      <Button
        size="sm"
        variant={currentPlan === "free" ? "primary" : "outline"}
        disabled={currentPlan === "free"}
        loading={busyPlan === "free"}
        onClick={() => void switchPlan("free")}
      >
        {currentPlan === "free" ? "Current Tier (Free)" : "Switch to Free Tier"}
      </Button>

      {(["starter", "pro", "team"] as const).map((plan) => (
        <Button key={plan} size="sm" variant="secondary" disabled className="text-xs capitalize">
          {plan} <span className="text-2xs text-muted-slate ml-1">(Requires Billing)</span>
        </Button>
      ))}
    </div>
  )
}

function PasswordPanel() {
  const { refreshUser } = useAuth()
  const toast = useToast()
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (next.length < 8) {
      setError("New password must be at least 8 characters long.")
      return
    }
    setBusy(true)
    try {
      await changePassword({ current_password: current, new_password: next })
      toast.notify("Password successfully updated. All active sessions have been revoked.", "success")
      setCurrent("")
      setNext("")
      void refreshUser()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not reach the NexusCloud API.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel>
      <PanelHeader
        title="Security &amp; Authentication"
        meta="Updating your password revokes all active browser sessions"
      />
      <form onSubmit={onSubmit} className="p-5 flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Current Password" htmlFor="pw-current">
            <Input
              id="pw-current"
              type="password"
              autoComplete="current-password"
              required
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
              placeholder="••••••••••••"
              invalid={Boolean(error)}
              className="font-mono text-xs"
            />
          </Field>

          <Field label="New Password" htmlFor="pw-next" hint="Minimum 8 characters" error={error}>
            <Input
              id="pw-next"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={next}
              onChange={(event) => setNext(event.target.value)}
              placeholder="••••••••••••"
              invalid={Boolean(error)}
              className="font-mono text-xs"
            />
          </Field>
        </div>

        {error ? (
          <div role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger font-medium">
            {error}
          </div>
        ) : null}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <p className="flex items-center gap-1.5 text-2xs text-muted-slate font-mono">
            <Lock size={12} /> PBKDF2 with SHA-256 password hashing
          </p>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={busy}
            disabled={!current || !next}
          >
            <Key size={13} className="mr-1.5" />
            Update Password
          </Button>
        </div>
      </form>
    </Panel>
  )
}

function AccountDeletion() {
  const toast = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPhrase, setConfirmPhrase] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const isConfirmed = confirmPhrase.trim().toUpperCase() === "DELETE" && password.length > 0

  async function confirm() {
    if (!isConfirmed) return
    setBusy(true)
    setError(null)
    try {
      await deleteAccount(password)
      toast.notify("Account successfully deleted", "neutral")
      queryClient.clear()
      navigate("/", { replace: true })
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message)
      } else {
        setError("Could not reach the NexusCloud API.")
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border-2 border-rose-300 bg-rose-50/20 overflow-hidden shadow-2xs">
      <div className="px-5 py-3.5 bg-rose-100/60 border-b border-rose-200 flex items-center justify-between">
        <span className="text-rose-700 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert size={14} /> High-Friction Danger Zone
        </span>
        <span className="font-mono text-[10px] text-rose-600 font-semibold uppercase">Irreversible Action</span>
      </div>
      <div className="p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <p className="font-bold text-regal-navy text-sm">Permanently Delete NexusCloud Account</p>
          <p className="text-xs text-slate-text mt-1 leading-relaxed">
            Erases your profile, credentials, and file tracking metadata. All files must be deleted first before account removal is permitted. Physical objects in your cloud buckets remain untouched in your cloud providers.
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={() => setOpen(true)} className="shrink-0 font-bold">
          Delete Account…
        </Button>
      </div>

      <ConfirmModal
        open={open}
        onClose={() => {
          setOpen(false)
          setError(null)
          setPassword("")
          setConfirmPhrase("")
        }}
        title="Permanently Delete NexusCloud Account"
        confirmLabel={busy ? "Deleting Account…" : "I understand, delete my account"}
        tone="danger"
        loading={busy}
        disabled={!isConfirmed}
        onConfirm={() => void confirm()}
        body={
          <div className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 leading-relaxed">
              <strong>Warning:</strong> This permanently wipes your user record and encrypted credential vault. Raw files stored in AWS, GCP, R2, or B2 buckets will remain in your cloud accounts.
            </div>

            <Field label='Type "DELETE" to confirm intention' htmlFor="delete-phrase">
              <Input
                id="delete-phrase"
                type="text"
                value={confirmPhrase}
                onChange={(event) => setConfirmPhrase(event.target.value)}
                placeholder='Type "DELETE"'
                className="font-mono text-xs uppercase"
              />
            </Field>

            <Field label="Enter Account Password" htmlFor="delete-confirm" error={error}>
              <Input
                id="delete-confirm"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                invalid={Boolean(error)}
                className="font-mono text-xs"
              />
            </Field>
          </div>
        }
      />
    </div>
  )
}
