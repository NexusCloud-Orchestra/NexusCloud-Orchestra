import { useState } from "react"
import type { FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { AlertTriangle } from "lucide-react"
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
import { StatusBadge } from "../../components/ui/status"
import { PROVIDER_IDS } from "../../lib/providers"

export function SettingsPage() {
  const { user } = useAuth()
  const plans = usePlans()
  const navigate = useNavigate()

  const currentPlan = plans.data?.find((plan) => plan.name === user?.plan) ?? null

  return (
    <div className="animate-fade-rise flex flex-col gap-6">
      <PageHeader kicker="Account" title="Settings" description="Profile, credentials and plan state." />

      {/* Profile */}
      <Panel>
        <PanelHeader title="Profile" />
        {user ? (
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 px-4 py-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-sm bg-accent-wash font-mono text-md font-semibold text-accent-deep">
              {initialsOf(user.first_name, user.last_name)}
            </span>
            <div>
              <p className="text-md font-medium text-ink">
                {user.first_name} {user.last_name}
              </p>
              <p className="font-mono text-sm text-ink-2">{user.email}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="label-caps">Member since</p>
              <p className="font-mono text-sm text-ink-2 tnum">{formatDateTime(user.created_at)}</p>
            </div>
          </div>
        ) : null}
      </Panel>

      {/* Plan */}
      <Panel>
        <PanelHeader
          title="Plan"
          actions={<StatusBadge tone="neutral">{user?.plan ?? "—"}</StatusBadge>}
        />
        <div className="flex flex-col gap-4 px-4 py-4">
          <div className="flex flex-wrap gap-x-10 gap-y-3">
            <div>
              <p className="label-caps">Cloud connections</p>
              <p className="mt-0.5 font-mono text-md text-ink tnum">
                {currentPlan?.max_connections ?? "unlimited"}
              </p>
            </div>
            <div>
              <p className="label-caps">Storage cap</p>
              <p className="mt-0.5 font-mono text-md text-ink tnum">
                {currentPlan?.max_bytes ? formatBytes(currentPlan.max_bytes) : "unlimited"}
              </p>
            </div>
            <div>
              <p className="label-caps">Seats</p>
              <p className="mt-0.5 font-mono text-md text-ink tnum">{currentPlan?.seats ?? "—"}</p>
            </div>
          </div>
          <div className="rounded-sm border border-warn-line bg-warn-wash px-3 py-2.5 text-base text-warn">
            <p className="flex items-start gap-2">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
              <span>
                Paid upgrades are unavailable until billing is integrated into the backend. Downgrade to Free is
                possible once usage fits its limits.
              </span>
            </p>
          </div>
          <PlanActions currentPlan={user?.plan ?? "free"} />
        </div>
      </Panel>

      {/* Security */}
      <PasswordPanel />

      {/* Connected clouds link */}
      <Panel>
        <PanelHeader title="Connected clouds" />
        <div className="flex items-center justify-between px-4 py-4">
          <p className="text-base text-ink-2">
            Manage cloud connections, credentials and disconnects from the Clouds page.
          </p>
          <Button size="sm" variant="secondary" onClick={() => navigate("/app/clouds")}>
            Open Clouds
          </Button>
        </div>
      </Panel>

      <AccountDeletion />

      <p className="font-mono text-2xs text-ink-3">
        provider catalog · {PROVIDER_IDS.join(" / ")}
      </p>
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
      toast.notify(`Plan set to ${plan}`, "success")
      void queryClient.invalidateQueries({ queryKey: queryKeys.quota })
      void queryClient.invalidateQueries({ queryKey: queryKeys.me })
    } catch (caught) {
      toast.notify(caught instanceof ApiError ? caught.message : "Plan change failed", "error")
    } finally {
      setBusyPlan(null)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant={currentPlan === "free" ? "primary" : "secondary"}
        disabled={currentPlan === "free"}
        loading={busyPlan === "free"}
        onClick={() => void switchPlan("free")}
      >
        {currentPlan === "free" ? "Current plan" : "Downgrade to Free"}
      </Button>
      {(["starter", "pro", "team"] as const).map((plan) => (
        <Button key={plan} size="sm" variant="secondary" disabled>
          {plan} — requires billing
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
      setError("New password must be at least 8 characters")
      return
    }
    setBusy(true)
    try {
      await changePassword({ current_password: current, new_password: next })
      toast.notify("Password updated. All sessions were signed out — sign in again.", "success")
      setCurrent("")
      setNext("")
      void refreshUser()
      // The backend revokes every session on password change; the next API call
      // will 401 and the shell routes to login.
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not reach the API.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel>
      <PanelHeader title="Security" meta="changing the password signs out every session" />
      <form onSubmit={onSubmit} className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-end sm:gap-3" noValidate>
        <div className="flex-1">
          <Field label="Current password" htmlFor="pw-current">
            <Input
              id="pw-current"
              type="password"
              autoComplete="current-password"
              required
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
              invalid={Boolean(error)}
            />
          </Field>
        </div>
        <div className="flex-1">
          <Field label="New password" htmlFor="pw-next" hint="At least 8 characters" error={error}>
            <Input
              id="pw-next"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={next}
              onChange={(event) => setNext(event.target.value)}
              invalid={Boolean(error)}
            />
          </Field>
        </div>
        <Button type="submit" variant="secondary" loading={busy} disabled={!current || !next}>
          Update password
        </Button>
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
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      await deleteAccount(password)
      toast.notify("Account deleted", "neutral")
      queryClient.clear()
      navigate("/", { replace: true })
    } catch (caught) {
      if (caught instanceof ApiError) {
        if (caught.status === 409) {
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
    <Panel className="border-bad-line">
      <PanelHeader title="Danger zone" />
      <div className="flex flex-col gap-3 px-4 py-4">
        <p className="max-w-prose text-base text-ink-2">
          Deleting the account erases the profile, connections, encrypted credentials, file metadata, sessions and
          audit history. Files must be deleted first — deletion is blocked while files remain tracked. Objects
          already in your clouds stay there.
        </p>
        <div>
          <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
            Delete account…
          </Button>
        </div>
      </div>
      <ConfirmModal
        open={open}
        onClose={() => {
          setOpen(false)
          setError(null)
          setPassword("")
        }}
        title="Delete account"
        confirmLabel="Permanently delete"
        tone="danger"
        loading={busy}
        onConfirm={() => void confirm()}
        body={<p>This cannot be undone. Enter the account password to confirm.</p>}
      />
      {open ? (
        <div className="border-t border-line px-5 py-3">
          <Field label="Password" htmlFor="delete-confirm" error={error}>
            <Input
              id="delete-confirm"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              invalid={Boolean(error)}
            />
          </Field>
        </div>
      ) : null}
    </Panel>
  )
}

