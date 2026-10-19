import { useState } from "react"
import type { FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  ArrowRight,
  Check,
  HardDrive,
  Key,
  Lock,
  Server,
  ShieldAlert,
  User,
} from "lucide-react"

import { useAuth } from "../../state/auth"
import { useToast } from "../../state/toast"
import { useTheme } from "../../state/theme"
import { ShinyCloudIcon, MoonCloudIcon, ThemeToggle } from "../../components/ui/theme-toggle"
import { cn } from "../../lib/utils"
import { queryKeys } from "../../state/query"
import { changePassword, deleteAccount, setPlan } from "../../api/auth"
import { ApiError } from "../../api/client"
import { formatDateTime, initialsOf } from "../../lib/format"
import { usePlans } from "../../hooks/use-data"
import { formatBytes } from "../../lib/format"
import { PageHeader } from "../../components/layout/shell"
import { PanelHeader } from "../../components/ui/panel"
import { Button } from "../../components/ui/button"
import { Field, Input } from "../../components/ui/field"
import { ConfirmModal } from "../../components/ui/modal"
import { PROVIDER_IDS } from "../../lib/providers"

export function SettingsDark() {
  const { user } = useAuth()
  const plans = usePlans()
  const navigate = useNavigate()

  const currentPlan = plans.data?.find((plan) => plan.name === user?.plan) ?? null

  return (
    <div className="settings-dark-page animate-fade-rise flex flex-col gap-4 sm:gap-4.5 pb-6 text-[#F5F0E6] bg-[#0B0A08]">
      <PageHeader
        kicker="Account Administration"
        title="Settings &amp; Security"
        description="Manage your account profile, authentication credentials, and storage orchestration plan."
        backTo="/app/overview"
      />

      {/* Profile Overview */}
      <div className="rounded-xl border border-[#332A1B] bg-[#11100D] text-[#F5F0E6] shadow-md overflow-hidden">
        <PanelHeader
          title="Account Identity"
          meta={user ? `UID: ${user.id.slice(0, 8)}…` : undefined}
        />
        {user ? (
          <div className="p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-regal-navy text-[#C6A052] font-mono text-base font-bold shadow-xs">
                {initialsOf(user.first_name, user.last_name)}
              </div>
              <div>
                <p className="text-base font-bold text-[#F5F0E6]">
                  {user.first_name} {user.last_name}
                </p>
                <p className="font-mono text-xs text-[#887D6B]">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-6 border-t border-[#332A1B] pt-3 sm:border-t-0 sm:pt-0 font-mono text-xs">
              <div>
                <span className="block text-2xs uppercase tracking-wider text-[#887D6B] font-semibold">Account Tier</span>
                <span className="font-bold text-[#F5F0E6] uppercase">{user.plan}</span>
              </div>
              <div className="text-right">
                <span className="block text-2xs uppercase tracking-wider text-[#887D6B] font-semibold">Registered</span>
                <span className="text-[#B8AE9B]">{formatDateTime(user.created_at)}</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Interface Appearance & Theme Customization */}
      <AppearancePanel />

      {/* Plan & Quota Specification */}
      <div className="rounded-xl border border-[#332A1B] bg-[#11100D] text-[#F5F0E6] shadow-md overflow-hidden">
        <PanelHeader
          title="Storage Orchestration Tier"
          meta={user?.plan ? `Active: ${user.plan.toUpperCase()}` : undefined}
          actions={
            <span className="inline-flex items-center gap-1 rounded-md bg-[#C6A052]/15 px-2.5 py-1 font-mono text-2xs font-bold text-[#C6A052] border border-[#C6A052]/30 uppercase">
              {user?.plan ?? "free"} Tier
            </span>
          }
        />
        <div className="p-5 flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#332A1B] bg-[#11100D] text-[#F5F0E6] shadow-sm p-4">
              <div className="flex items-center gap-2 text-[#887D6B] mb-1">
                <Server size={14} />
                <span className="font-mono text-2xs uppercase tracking-wider font-semibold">Cloud Connections</span>
              </div>
              <p className="font-display text-xl font-bold text-[#F5F0E6] tnum">
                {currentPlan?.max_connections ?? "Unlimited"}
              </p>
              <p className="text-2xs text-[#887D6B] mt-0.5">Maximum concurrent BYOC buckets</p>
            </div>

            <div className="rounded-xl border border-[#332A1B] bg-[#11100D] text-[#F5F0E6] shadow-sm p-4">
              <div className="flex items-center gap-2 text-[#887D6B] mb-1">
                <HardDrive size={14} />
                <span className="font-mono text-2xs uppercase tracking-wider font-semibold">Storage Pool Limit</span>
              </div>
              <p className="font-display text-xl font-bold text-[#F5F0E6] tnum">
                {currentPlan?.max_bytes ? formatBytes(currentPlan.max_bytes) : "No byte cap"}
              </p>
              <p className="text-2xs text-[#887D6B] mt-0.5">Capped capacity across all clouds</p>
            </div>

            <div className="rounded-xl border border-[#332A1B] bg-[#11100D] text-[#F5F0E6] shadow-sm p-4">
              <div className="flex items-center gap-2 text-[#887D6B] mb-1">
                <User size={14} />
                <span className="font-mono text-2xs uppercase tracking-wider font-semibold">Team Seats</span>
              </div>
              <p className="font-display text-xl font-bold text-[#F5F0E6] tnum">
                {currentPlan?.seats ?? 1}
              </p>
              <p className="text-2xs text-[#887D6B] mt-0.5">Authorized workspace operators</p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 dark:border-[#C6A052]/40 bg-amber-50/70 dark:bg-[#252016] p-4 text-xs text-amber-900 dark:text-[#E0C078] leading-relaxed">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-amber-700 dark:text-[#C6A052] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950 dark:text-[#F5F0E6]">Billing System Notice</p>
                <p className="mt-0.5 text-amber-900/90 dark:text-[#B8AE9B]">
                  Paid enterprise tier upgrades (Starter, Pro, Team) will become available upon full billing provider integration. The current backend allows switching between Free and custom allowances once configured.
                </p>
              </div>
            </div>
          </div>

          <PlanActions currentPlan={user?.plan ?? "free"} />
        </div>
      </div>

      {/* Security & Password */}
      <PasswordPanel />

      {/* BYOC Infrastructure Link */}
      <div className="rounded-xl border border-[#332A1B] bg-[#11100D] text-[#F5F0E6] shadow-md overflow-hidden">
        <PanelHeader title="Cloud Mesh Management" />
        <div className="p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-[#F5F0E6] text-sm">Manage Storage Connections &amp; Credentials</p>
            <p className="text-xs text-[#887D6B] mt-0.5">
              Configure AWS, Azure, Google Cloud, Cloudflare R2, Backblaze B2, Oracle, or IBM buckets in the Clouds console.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate("/app/clouds")}>
            Open Cloud Console <ArrowRight size={13} className="ml-1" />
          </Button>
        </div>
      </div>

      {/* Danger Zone: Account Deletion */}
      <AccountDeletion />

      {/* Platform Metadata Footnote */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-2xs text-[#887D6B] font-mono">
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
    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#332A1B]">
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
          {plan} <span className="text-2xs text-[#887D6B] ml-1">(Requires Billing)</span>
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
    <div className="rounded-xl border border-[#332A1B] bg-[#11100D] text-[#F5F0E6] shadow-md overflow-hidden">
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

        <div className="flex items-center justify-between pt-2 border-t border-[#332A1B]">
          <p className="flex items-center gap-1.5 text-2xs text-[#887D6B] font-mono">
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
    </div>
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
    <div className="rounded-xl border-2 border-rose-300 dark:border-red-900/40 bg-rose-50/20 dark:bg-[#1E1214] overflow-hidden shadow-2xs">
      <div className="px-5 py-3.5 bg-rose-100/60 dark:bg-[#281518] border-b border-rose-200 dark:border-red-900/40 flex items-center justify-between">
        <span className="text-rose-700 dark:text-red-400 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert size={14} /> High-Friction Danger Zone
        </span>
        <span className="font-mono text-[10px] text-rose-600 dark:text-red-400 font-semibold uppercase">Irreversible Action</span>
      </div>
      <div className="p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <p className="font-bold text-[#F5F0E6] dark:text-[#F5F0E6] text-sm">Permanently Delete NexusCloud Account</p>
          <p className="text-xs text-[#B8AE9B] dark:text-[#887D6B] mt-1 leading-relaxed">
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

function AppearancePanel() {
  const { setTheme, isDark } = useTheme()
  const toast = useToast()

  const handleSelect = (mode: "light" | "dark") => {
    setTheme(mode)
    toast.notify(
      mode === "dark"
        ? "Activated Dark Theme (Rainy Cloud) with Deep Charcoal Obsidian"
        : "Activated Light Theme (Shiny Cloud) with Warm Cornsilk White",
      "success"
    )
  }

  return (
    <div className="rounded-xl border border-[#332A1B] bg-[#11100D] text-[#F5F0E6] shadow-md overflow-hidden">
      <PanelHeader
        title="Interface Appearance & Theme"
        meta="Toggle between Light (Shiny Cloud) and Dark (Rainy Cloud) mode"
        actions={<ThemeToggle variant="pill" showLabel />}
      />
      <div className="p-5 flex flex-col gap-4">
        <p className="text-xs text-[#887D6B] font-alora leading-relaxed">
          NexusCloud supports dual atmospheric themes crafted for high visual contrast, optimal readability, and reduced eye strain across all files, charts, and cloud topologies.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Light Theme Card */}
          <div
            onClick={() => handleSelect("light")}
            className={cn(
              "group relative flex flex-col justify-between rounded-xl border p-4.5 cursor-pointer transition-all duration-200",
              !isDark
                ? "border-[#C6A052] bg-[#FFF8E7]/50 shadow-sm ring-2 ring-[#C6A052]/30"
                : "border-[#332A1B] bg-card hover:border-[#C6A052]/60 hover:bg-[#211D15]/60"
            )}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#11100D] dark:bg-[#11100D] border border-[#332A1B] dark:border-[#332A1B] shadow-xs">
                    <ShinyCloudIcon className="w-6 h-6 text-[#C6A052]" />
                  </div>
                  <div>
                    <h4 className="font-palatino text-sm font-bold text-[#F5F0E6]">Light Theme</h4>
                    <p className="font-mono text-[10.5px] text-[#887D6B] uppercase tracking-wider">Shiny Cloud · Day Mode</p>
                  </div>
                </div>
                {!isDark && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#C6A052] text-white shadow-xs">
                    <Check size={13} strokeWidth={3} />
                  </span>
                )}
              </div>
              <p className="text-xs text-[#F5F0E6]-2 leading-relaxed font-alora mb-3">
                Crisp, warm daylight aesthetics utilizing Warm Cornsilk White (#FFFDF8), Regal Navy (#142B4A), and Ivory (#FAF6ED) surfaces with Royal Gold highlights.
              </p>
            </div>

            {/* Swatches preview */}
            <div className="pt-3 border-t border-[#332A1B] flex items-center justify-between text-2xs font-mono text-[#887D6B]">
              <span>Palette tokens:</span>
              <div className="flex items-center gap-1.5">
                <span className="h-4 w-4 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: "#FFFDF8" }} title="Warm White #FFFDF8" />
                <span className="h-4 w-4 rounded-full shadow-2xs" style={{ backgroundColor: "#FAF6ED" }} title="Ivory #FAF6ED" />
                <span className="h-4 w-4 rounded-full shadow-2xs" style={{ backgroundColor: "#142B4A" }} title="Regal Navy #142B4A" />
                <span className="h-4 w-4 rounded-full shadow-2xs" style={{ backgroundColor: "#C6A052" }} title="Royal Gold #C6A052" />
              </div>
            </div>
          </div>

          {/* Dark Theme Card */}
          <div
            onClick={() => handleSelect("dark")}
            className={cn(
              "group relative flex flex-col justify-between rounded-xl border p-4.5 cursor-pointer transition-all duration-200",
              isDark
                ? "border-[#C6A052] bg-[#211D15] shadow-sm ring-2 ring-[#C6A052]/30"
                : "border-[#332A1B] bg-card hover:border-[#C6A052]/60 hover:bg-[#211D15]/60"
            )}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#11100D] border border-[#332A1B] shadow-xs">
                    <MoonCloudIcon className="w-6 h-6 text-[#C6A052]" />
                  </div>
                  <div>
                    <h4 className="font-palatino text-sm font-bold text-[#F5F0E6]">Dark Theme</h4>
                    <p className="font-mono text-[10.5px] text-[#887D6B] uppercase tracking-wider">Rainy Cloud · Obsidian Night</p>
                  </div>
                </div>
                {isDark && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#C6A052] text-[#11100D] font-bold shadow-xs">
                    <Check size={13} strokeWidth={3} />
                  </span>
                )}
              </div>
              <p className="text-xs text-[#F5F0E6]-2 leading-relaxed font-alora mb-3">
                Deep Charcoal Obsidian (#0B0A08) page backdrop, Elevated Dark Espresso (#11100D) containers, Warm Cornsilk White (#F5F0E6) typography, and Royal Gold (#C6A052) CTAs.
              </p>
            </div>

            {/* Swatches preview */}
            <div className="pt-3 border-t border-[#332A1B] flex items-center justify-between text-2xs font-mono text-[#887D6B]">
              <span>Palette tokens:</span>
              <div className="flex items-center gap-1.5">
                <span className="h-4 w-4 rounded-full border border-white/10 shadow-2xs" style={{ backgroundColor: "#0B0A08" }} title="Charcoal Obsidian #0B0A08" />
                <span className="h-4 w-4 rounded-full border border-white/10 shadow-2xs" style={{ backgroundColor: "#11100D" }} title="Dark Espresso #11100D" />
                <span className="h-4 w-4 rounded-full shadow-2xs" style={{ backgroundColor: "#F5F0E6" }} title="Cornsilk White #F5F0E6" />
                <span className="h-4 w-4 rounded-full shadow-2xs" style={{ backgroundColor: "#C6A052" }} title="Royal Gold #C6A052" />
                <span className="h-4 w-4 rounded-full shadow-2xs" style={{ backgroundColor: "#E0C078" }} title="Light Gold Hover #E0C078" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

