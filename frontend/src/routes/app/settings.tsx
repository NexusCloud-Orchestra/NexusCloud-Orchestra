import { useState } from "react"
import type { FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../../state/auth"
import { useToast } from "../../state/toast"
import { queryKeys } from "../../state/query"
import { changePassword, deleteAccount, setPlan } from "../../api/auth"
import { ApiError } from "../../api/client"
import { formatDateTime, initialsOf } from "../../lib/format"
import { usePlans } from "../../hooks/use-data"
import { formatBytes } from "../../lib/format"
import { PageHeader } from "../../components/layout/shell"
import { Button } from "../../components/ui/button"
import { Field, Input } from "../../components/ui/field"
import { ConfirmModal } from "../../components/ui/modal"
import { TabPanel, Tabs } from "../../components/ui/tabs"
import { Th } from "../../components/ui/table"

type Tab = "profile" | "plan" | "security" | "danger"
const TABS: Array<{ id: Tab; label: string }> = [
  { id: "profile", label: "Profile" },
  { id: "plan", label: "Plan" },
  { id: "security", label: "Security" },
  { id: "danger", label: "Danger zone" },
]

export function SettingsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>("profile")

  return (
    <div className="animate-fade-rise flex flex-col gap-6">
      <PageHeader title="Settings" description="Profile, plan, credentials and account removal." />

      <div className="grid gap-8 md:grid-cols-[168px_minmax(0,1fr)]">
        <Tabs items={TABS} value={tab} onChange={setTab} label="Settings sections" prefix="settings" side />

        <div className="min-w-0 max-w-2xl">
          <TabPanel prefix="settings" id={tab} key={tab}>
          {tab === "profile" ? (
            <section aria-label="Profile" className="flex flex-col gap-6">
              {user ? (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-sm bg-accent-wash font-mono text-md font-semibold text-accent-deep">
                    {initialsOf(user.first_name, user.last_name)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-md font-medium text-ink">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="truncate font-mono text-sm text-ink-2">{user.email}</p>
                  </div>
                </div>
              ) : null}
              {user ? (
                <dl>
                  <div className="row flex justify-between gap-4 py-3">
                    <dt className="text-sm text-ink-3">Member since</dt>
                    <dd className="font-mono text-sm text-ink-2 tnum">{formatDateTime(user.created_at)}</dd>
                  </div>
                </dl>
              ) : null}
              <p className="text-base text-ink-2">
                Cloud connections and credentials are managed on the Clouds page.{" "}
                <button
                  type="button"
                  onClick={() => navigate("/app/clouds")}
                  className="font-medium text-accent hover:text-accent-deep"
                >
                  Open Clouds
                </button>
              </p>
            </section>
          ) : null}

          {tab === "plan" ? (
            <section aria-label="Plan" className="flex flex-col gap-5">
              <h2 className="text-md font-semibold text-ink">
                <span className="capitalize">{user?.plan ?? "Current"}</span> plan
              </h2>
              <PlanTable currentPlan={user?.plan ?? "free"} />
              <p className="max-w-prose text-sm text-ink-2">
                Paid plans cannot be selected until billing is added to the backend. You can move down to Free once your usage fits its limits.
              </p>
              {user?.plan && user.plan !== "free" ? <PlanActions /> : null}
            </section>
          ) : null}

          {tab === "security" ? <PasswordPanel /> : null}
          {tab === "danger" ? <AccountDeletion /> : null}
          </TabPanel>
        </div>
      </div>
    </div>
  )
}

function PlanTable({ currentPlan }: { currentPlan: string }) {
  const plans = usePlans()
  if (plans.isLoading) return <p className="text-sm text-ink-3">Loading plans…</p>
  if (plans.isError || !plans.data) return <p className="text-sm text-bad">Could not load plan limits.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse">
        <caption className="sr-only">Limits for each plan</caption>
        <thead>
          <tr className="border-b border-line">
            <Th>Plan</Th>
            <Th align="right">Clouds</Th>
            <Th align="right">Storage cap</Th>
            <Th align="right">Seats</Th>
          </tr>
        </thead>
        <tbody>
          {plans.data.map((plan) => {
            const current = plan.name === currentPlan
            return (
              <tr key={plan.name} className="row" aria-current={current ? "true" : undefined}>
                <th scope="row" className={`px-1 py-3 text-left text-base capitalize ${current ? "font-semibold text-ink" : "font-normal text-ink-2"}`}>
                  {plan.name}
                  {current ? <span className="ml-2 text-sm font-normal text-accent-deep normal-case">Current</span> : null}
                </th>
                <td className="px-3 py-3 text-right font-mono text-sm text-ink tnum">{plan.max_connections ?? "Unlimited"}</td>
                <td className="px-3 py-3 text-right font-mono text-sm text-ink tnum">{plan.max_bytes ? formatBytes(plan.max_bytes) : "Unlimited"}</td>
                <td className="px-1 py-3 text-right font-mono text-sm text-ink tnum">{plan.seats}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function PlanActions() {
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
    <div>
      <Button size="sm" variant="secondary" loading={busyPlan === "free"} onClick={() => void switchPlan("free")}>
        Downgrade to Free
      </Button>
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
    <section aria-label="Security" className="flex flex-col gap-4">
      <div>
        <h2 className="text-md font-semibold text-ink">Password</h2>
        <p className="mt-1 text-sm text-ink-3">Changing the password signs out every session.</p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div>
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
        <div>
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
        <div>
          <Button type="submit" variant="secondary" loading={busy} disabled={!current || !next}>
            Update password
          </Button>
        </div>
      </form>
    </section>
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
    <section aria-label="Danger zone" className="flex flex-col gap-3">
      <h2 className="text-md font-semibold text-bad">Delete account</h2>
      <div className="flex flex-col gap-3">
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
      >
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
      </ConfirmModal>
    </section>
  )
}

