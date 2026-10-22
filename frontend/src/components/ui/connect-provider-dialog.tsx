/**
 * ConnectProviderDialog
 * ─────────────────────────────────────────────────────────────────────────────
 * Unified, single modal dialog for connecting cloud provider storage to NexusCloud.
 *
 * Designed with modern aesthetic patterns inspired by:
 *  - shadcn/ui   → Accessible dialog primitive, keyboard traps, clean fields
 *  - Aceternity  → Moving BorderBeam, dynamic cursor Spotlight, ShinyText
 *  - Cult UI     → Frosted glass vault card, luminous shimmer CTA button
 *  - ReactBits   → Staggered spring animations, animated ripple success checkmark
 */

import { useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion, type Variants } from "framer-motion"
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  X,
} from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"

import { createConnection } from "../../api/connections"
import { ApiError } from "../../api/client"
import { useToast } from "../../state/toast"
import { useTheme } from "../../state/theme"
import { queryKeys } from "../../state/query"
import { PROVIDER_IDS, PROVIDER_META, type CredentialField } from "../../lib/providers"
import { Field, Input, TextArea, useFieldId } from "./field"
import { BorderBeam, ShinyText } from "./effects"
import { ProviderIcon, CustomS3Logo } from "./cloud-logos"
import type { ProviderId } from "../../types/api"

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface ConnectProviderDialogProps {
  open: boolean
  provider: ProviderId | null
  onClose: () => void
  onSuccess?: () => void
}

// ─── Motion Variants ─────────────────────────────────────────────────────────

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: "easeIn" } },
}

const dialogVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 12,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.08,
    },
  },
}

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
}

// ─── Provider visual accents ──────────────────────────────────────────────────

const PROVIDER_COLORS: Record<ProviderId, { accent: string; glow: string }> = {
  aws: { accent: "#D97706", glow: "rgba(217, 119, 6, 0.15)" },
  azure: { accent: "#0369A1", glow: "rgba(3, 105, 161, 0.15)" },
  gcp: { accent: "#1A73E8", glow: "rgba(26, 115, 232, 0.15)" },
  r2: { accent: "#C2570F", glow: "rgba(194, 87, 15, 0.15)" },
  b2: { accent: "#B02A30", glow: "rgba(176, 42, 48, 0.15)" },
  oracle: { accent: "#C74634", glow: "rgba(199, 70, 52, 0.15)" },
  ibm: { accent: "#0F62FE", glow: "rgba(15, 98, 254, 0.15)" },
}

const PROVIDER_SUBTITLES: Record<ProviderId, string> = {
  aws: "Amazon Simple Storage Service",
  azure: "Microsoft Azure Blob Container",
  gcp: "Google Cloud Storage Bucket",
  r2: "Cloudflare Zero-Egress Storage",
  b2: "Backblaze S3-Compatible Storage",
  oracle: "Oracle Cloud Object Storage",
  ibm: "IBM Cloud Object Storage",
}

// ─── Aceternity-style Cursor Spotlight ───────────────────────────────────────

function useSpotlight() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [active, setActive] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  return {
    ref: containerRef,
    active,
    pos,
    events: {
      onMouseMove: handleMouseMove,
      onMouseEnter: () => setActive(true),
      onMouseLeave: () => setActive(false),
    },
  }
}

// ─── Credential input with show/hide password ────────────────────────────────

function CredentialFieldItem({
  field,
  value,
  error,
  onChange,
}: {
  field: CredentialField
  value: string
  error: string | null
  onChange: (val: string) => void
}) {
  const [showSecret, setShowSecret] = useState(false)
  const id = useFieldId()
  const isMultiLine =
    field.key === "service_account_json" || field.key === "private_key"

  return (
    <Field
      label={field.label}
      htmlFor={id}
      hint={field.hint}
      error={error}
      required
    >
      <div className="relative">
        {isMultiLine ? (
          <TextArea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            invalid={Boolean(error)}
            spellCheck={false}
            rows={4}
            className="font-mono text-xs bg-white/70 dark:bg-[#1A1814]/90 border-[#E8E0D1] dark:border-[#3D362B] text-[#142B4A] dark:text-[#F5F0E6] focus:border-[#C49A3A] focus:ring-[#C49A3A]/20"
          />
        ) : (
          <Input
            id={id}
            type={field.secret && !showSecret ? "password" : "text"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            invalid={Boolean(error)}
            autoComplete="off"
            spellCheck={false}
            className={`font-mono text-xs bg-white/70 dark:bg-[#1A1814]/90 border-[#E8E0D1] dark:border-[#3D362B] text-[#142B4A] dark:text-[#F5F0E6] focus:border-[#C49A3A] focus:ring-[#C49A3A]/20 ${
              field.secret ? "pr-10" : ""
            }`}
          />
        )}
        {field.secret && !isMultiLine && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowSecret((prev) => !prev)}
            aria-label={showSecret ? "Hide secret" : "Show secret"}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#68768A] hover:text-[#142B4A] dark:text-[#A89F91] dark:hover:text-[#F5F0E6] transition-colors"
          >
            {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </Field>
  )
}

// ─── Success Confirmation View (ReactBits animated) ─────────────────────────

function SuccessCard({
  displayName,
  providerName,
  onClose,
}: {
  displayName: string
  providerName: string
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center p-8 sm:p-10 text-center"
    >
      {/* Animated ripple circle */}
      <div className="relative mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.15, 1] }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-xl shadow-emerald-500/10"
        >
          <CheckCircle2 size={42} strokeWidth={2.2} />
        </motion.div>
        <span className="absolute inset-0 rounded-full border border-emerald-400 animate-ping opacity-30" />
      </div>

      <p className="font-mono text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">
        Storage Connected
      </p>
      <h3 className="font-palatino text-2xl font-bold text-[#142B4A] dark:text-[#F5F0E6]">
        {displayName}
      </h3>
      <p className="font-alora text-sm text-[#68768A] dark:text-[#A89F91] max-w-sm mt-2 leading-relaxed">
        Credentials stored securely in your encrypted vault. You can now use{" "}
        <span className="font-semibold text-[#142B4A] dark:text-[#F5F0E6]">
          {providerName}
        </span>{" "}
        with the NexusCloud high-speed storage mesh.
      </p>

      <div className="mt-6 flex items-center gap-2 rounded-xl bg-[#FAF6ED] dark:bg-[#1A1814] border border-[#E8E0D1] dark:border-[#3D362B] px-4 py-2 text-xs font-mono text-[#68768A] dark:text-[#A89F91]">
        <ShieldCheck size={14} className="text-[#C49A3A]" />
        <span>AES-256-GCM Envelope Encryption Verified</span>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="mt-8 rounded-xl bg-[#142B4A] hover:bg-[#1C3B65] dark:bg-[#C49A3A] dark:hover:bg-[#A77B26] text-white dark:text-[#0B0A08] px-8 h-10 font-bold text-sm shadow-md transition-all cursor-pointer"
      >
        Done
      </button>
    </motion.div>
  )
}

// ─── Provider Selection View (inside Dialog) ─────────────────────────────────

function ProviderSelectionView({
  onSelect,
}: {
  onSelect: (id: ProviderId) => void
}) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="p-6 space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
        {PROVIDER_IDS.map((id) => {
          const meta = PROVIDER_META[id]
          const subtitle = PROVIDER_SUBTITLES[id] ?? "Cloud Object Storage"

          return (
            <motion.button
              key={id}
              variants={staggerItem}
              type="button"
              onClick={() => onSelect(id)}
              className="flex items-center justify-between p-3.5 rounded-2xl border border-[#E8E0D1] dark:border-[#2D2820] bg-white/80 dark:bg-[#161410] hover:border-[#C49A3A] hover:bg-[#FAF6ED] dark:hover:border-[#C6A052] dark:hover:bg-[#1E1B15] text-left transition-all shadow-2xs group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E8E0D1] dark:border-[#3D362B] bg-white dark:bg-[#13120F] shadow-2xs group-hover:scale-105 transition-transform">
                  <ProviderIcon provider={id} size={24} />
                </div>
                <div className="min-w-0">
                  <p className="font-palatino text-sm font-bold text-[#142B4A] dark:text-[#F5F0E6] truncate">
                    {meta.name}
                  </p>
                  <p className="font-alora text-xs text-[#68768A] dark:text-[#887D6B] truncate">
                    {subtitle}
                  </p>
                </div>
              </div>
              <ChevronRight
                size={16}
                className="text-[#68768A] dark:text-[#887D6B] group-hover:text-[#C49A3A] dark:group-hover:text-[#C6A052] transition-transform group-hover:translate-x-0.5 shrink-0 ml-2"
              />
            </motion.button>
          )
        })}

        {/* Custom S3 option */}
        <motion.button
          key="custom-s3"
          variants={staggerItem}
          type="button"
          onClick={() => onSelect("aws")}
          className="flex items-center justify-between p-3.5 rounded-2xl border border-dashed border-[#C49A3A]/60 dark:border-[#C6A052]/50 bg-gradient-to-b from-white to-[#FFF8E7]/30 dark:from-[#181612] dark:to-[#14120D] hover:border-[#C49A3A] dark:hover:border-[#C6A052] text-left transition-all shadow-2xs group cursor-pointer sm:col-span-2"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E8E0D1] dark:border-[#3D362B] bg-white dark:bg-[#13120F] shadow-2xs group-hover:scale-105 transition-transform">
              <CustomS3Logo size={24} />
            </span>
            <div className="min-w-0">
              <p className="font-palatino text-sm font-bold text-[#142B4A] dark:text-[#F5F0E6]">
                Custom S3 / MinIO / Ceph
              </p>
              <p className="font-alora text-xs text-[#68768A] dark:text-[#887D6B]">
                Private, on-premises or self-hosted S3-compatible endpoint
              </p>
            </div>
          </div>
          <ChevronRight
            size={16}
            className="text-[#68768A] dark:text-[#887D6B] group-hover:text-[#C49A3A] dark:group-hover:text-[#C6A052] transition-transform group-hover:translate-x-0.5 shrink-0 ml-2"
          />
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─── Main Dialog Component ───────────────────────────────────────────────────

export function ConnectProviderDialog({
  open,
  provider,
  onClose,
  onSuccess,
}: ConnectProviderDialogProps) {
  const { isDark } = useTheme()
  const toast = useToast()
  const queryClient = useQueryClient()
  const dialogId = useId()
  const spotlight = useSpotlight()

  // Selected Provider state (allows picking a provider inside the dialog if opened with null)
  const [selectedProvider, setSelectedProvider] = useState<ProviderId | null>(provider)

  // Form State
  const [form, setForm] = useState({
    displayName: "",
    bucketName: "",
    region: "",
  })
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [succeeded, setSucceeded] = useState(false)

  // Synchronize incoming provider prop when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedProvider(provider)
      setApiError(null)
      setBusy(false)
      setSucceeded(false)
    }
  }, [open, provider])

  // Reset form when selectedProvider changes
  useEffect(() => {
    if (selectedProvider) {
      const meta = PROVIDER_META[selectedProvider]
      setForm({
        displayName: `${meta.name} Storage`,
        bucketName: "",
        region: "",
      })
      setCredentials({})
      setFieldErrors({})
      setApiError(null)
    }
  }, [selectedProvider])

  // Escape key handler
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, busy, onClose])

  // Prevent scroll when dialog is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  const meta = selectedProvider ? PROVIDER_META[selectedProvider] : null
  const colors = selectedProvider ? PROVIDER_COLORS[selectedProvider] : null

  // Submit Handler
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProvider || !meta) return

    const errors: Record<string, string> = {}
    if (!form.displayName.trim()) {
      errors.displayName = "Give this connection a display name"
    }
    if (!form.bucketName.trim()) {
      errors.bucketName = `${meta.bucketLabel} is required`
    }
    if (meta.regionRequired && !form.region.trim()) {
      errors.region = `Region is required for ${meta.name}`
    }

    for (const field of meta.credentials) {
      if (!credentials[field.key]?.trim()) {
        errors[field.key] = `${field.label} is required`
      }
    }

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setBusy(true)
    setApiError(null)

    try {
      await createConnection({
        provider: selectedProvider,
        display_name: form.displayName.trim(),
        bucket_name: form.bucketName.trim(),
        region: form.region.trim() || null,
        credentials,
      })

      setSucceeded(true)
      toast.notify(`${form.displayName.trim()} connected successfully`, "success")
      void queryClient.invalidateQueries({ queryKey: queryKeys.connections })
      void queryClient.invalidateQueries({ queryKey: queryKeys.quota })
      onSuccess?.()
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
          setApiError(
            "The provider rejected the credentials or the bucket is not reachable. Please verify your keys and bucket permissions.",
          )
        } else {
          setApiError(caught.message)
        }
      } else {
        setApiError("Could not connect to the NexusCloud server.")
      }
    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop (Glassmorphic) */}
        <motion.div
          key="backdrop"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={() => {
            if (!busy) onClose()
          }}
          className="fixed inset-0 bg-[#0B0A08]/70 dark:bg-black/80 backdrop-blur-md cursor-pointer"
          aria-hidden="true"
        />

        {/* Modal Window */}
        <motion.div
          key="dialog-panel"
          variants={dialogVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          ref={spotlight.ref}
          {...spotlight.events}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${dialogId}-title`}
          className="relative w-full max-w-xl my-auto rounded-3xl border border-[#E8E0D1] dark:border-[#3D362B] bg-[#FAF6ED] dark:bg-[#13120F] shadow-2xl shadow-black/30 overflow-hidden z-10 transition-colors"
        >
          {/* BorderBeam light trace (Aceternity UI effect) */}
          <BorderBeam
            size={180}
            duration={8}
            colorFrom={isDark ? "#C6A052" : "#C49A3A"}
            colorTo={isDark ? "#E0C078" : "#F4DFC8"}
            borderWidth={1.5}
          />

          {/* Dynamic Spotlight Glow (Aceternity UI effect) */}
          <div
            className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 z-0"
            style={{
              opacity: spotlight.active ? 1 : 0,
              background: `radial-gradient(420px circle at ${spotlight.pos.x}px ${spotlight.pos.y}px, ${
                colors?.glow ?? "rgba(196, 154, 58, 0.12)"
              }, transparent 80%)`,
            }}
          />

          {succeeded ? (
            <SuccessCard
              displayName={form.displayName || meta?.name || "Cloud Storage"}
              providerName={meta?.name || "Provider"}
              onClose={onClose}
            />
          ) : !selectedProvider || !meta ? (
            /* ── Provider Selection Step ── */
            <div className="relative z-1 flex flex-col max-h-[88vh]">
              {/* Header */}
              <div className="px-6 py-4.5 border-b border-[#E8E0D1] dark:border-[#2D2820] flex items-center justify-between gap-4 bg-white/60 dark:bg-[#1A1814]/60 backdrop-blur-sm shrink-0">
                <div>
                  <h2
                    id={`${dialogId}-title`}
                    className="font-palatino text-lg font-bold text-[#142B4A] dark:text-[#F5F0E6]"
                  >
                    Connect Cloud Storage
                  </h2>
                  <p className="font-alora text-xs text-[#68768A] dark:text-[#887D6B] mt-0.5">
                    Select the provider to add to your NexusCloud storage mesh
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="rounded-full p-2 text-[#68768A] dark:text-[#A89F91] hover:text-[#142B4A] dark:hover:text-[#F5F0E6] hover:bg-[#E8E0D1]/50 dark:hover:bg-[#2D2820] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Provider Selection Cards */}
              <ProviderSelectionView onSelect={(id) => setSelectedProvider(id)} />
            </div>
          ) : (
            /* ── Credentials & Configuration Step ── */
            <div className="relative z-1 flex flex-col max-h-[88vh]">
              {/* Top Header */}
              <div className="px-6 py-4.5 border-b border-[#E8E0D1] dark:border-[#2D2820] flex items-center justify-between gap-4 bg-white/60 dark:bg-[#1A1814]/60 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#E8E0D1] dark:border-[#3D362B] bg-white dark:bg-[#13120F] shadow-xs">
                    <ProviderIcon provider={selectedProvider} size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <ShinyText className="font-palatino text-lg font-bold text-[#142B4A] dark:text-[#F5F0E6]">
                        Connect {meta.name}
                      </ShinyText>
                      {/* Allow changing provider if desired */}
                      <button
                        type="button"
                        onClick={() => setSelectedProvider(null)}
                        className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[#A77B26] dark:text-[#C6A052] hover:underline cursor-pointer"
                      >
                        <ArrowLeft size={11} /> Change
                      </button>
                    </div>
                    <p className="font-alora text-xs text-[#68768A] dark:text-[#A89F91]">
                      Store credentials &amp; connect your bucket to NexusCloud
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={busy}
                  aria-label="Close dialog"
                  className="rounded-full p-2 text-[#68768A] dark:text-[#A89F91] hover:text-[#142B4A] dark:hover:text-[#F5F0E6] hover:bg-[#E8E0D1]/50 dark:hover:bg-[#2D2820] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form
                onSubmit={handleSubmit}
                className="overflow-y-auto px-6 py-5 space-y-5 flex-1"
              >
                {apiError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 text-xs flex items-start gap-2.5"
                  >
                    <Lock size={15} className="shrink-0 mt-0.5 text-red-500" />
                    <div>
                      <p className="font-bold">Connection Verification Failed</p>
                      <p className="mt-0.5 opacity-90 leading-relaxed">{apiError}</p>
                    </div>
                  </motion.div>
                )}

                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {/* General Configuration Section */}
                  <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                      label="Connection Name"
                      htmlFor="conn-display-name"
                      hint="Identifies this storage pool in your dashboard"
                      error={fieldErrors.displayName}
                      required
                    >
                      <Input
                        id="conn-display-name"
                        value={form.displayName}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, displayName: e.target.value }))
                        }
                        placeholder={`e.g. ${meta.name} Production`}
                        invalid={Boolean(fieldErrors.displayName)}
                        className="bg-white/70 dark:bg-[#1A1814]/90 border-[#E8E0D1] dark:border-[#3D362B] text-[#142B4A] dark:text-[#F5F0E6]"
                      />
                    </Field>

                    <Field
                      label={meta.bucketLabel}
                      htmlFor="conn-bucket-name"
                      hint={meta.bucketHint}
                      error={fieldErrors.bucketName}
                      required
                    >
                      <Input
                        id="conn-bucket-name"
                        value={form.bucketName}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, bucketName: e.target.value }))
                        }
                        placeholder={
                          selectedProvider === "azure"
                            ? "my-azure-container"
                            : "my-storage-bucket"
                        }
                        invalid={Boolean(fieldErrors.bucketName)}
                        className="bg-white/70 dark:bg-[#1A1814]/90 border-[#E8E0D1] dark:border-[#3D362B] text-[#142B4A] dark:text-[#F5F0E6]"
                      />
                    </Field>
                  </motion.div>

                  {/* Region Field */}
                  <motion.div variants={staggerItem}>
                    <Field
                      label={
                        meta.regionRequired
                          ? "Storage Region"
                          : "Storage Region (Optional)"
                      }
                      htmlFor="conn-region"
                      hint={meta.regionHint ?? "Leave blank for global bucket"}
                      error={fieldErrors.region}
                      required={meta.regionRequired}
                    >
                      <Input
                        id="conn-region"
                        value={form.region}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, region: e.target.value }))
                        }
                        placeholder={
                          meta.regionRequired ? "e.g. us-east-1" : "Optional (default)"
                        }
                        invalid={Boolean(fieldErrors.region)}
                        className="bg-white/70 dark:bg-[#1A1814]/90 border-[#E8E0D1] dark:border-[#3D362B] text-[#142B4A] dark:text-[#F5F0E6]"
                      />
                    </Field>
                  </motion.div>

                  {/* Frosted Credential Vault Card */}
                  <motion.div
                    variants={staggerItem}
                    className="relative rounded-2xl border border-[#C49A3A]/30 dark:border-[#C49A3A]/25 bg-gradient-to-br from-[#FFF8E7]/70 via-white/50 to-[#FAF6ED]/70 dark:from-[#1C1811]/80 dark:via-[#14120D]/60 dark:to-[#17140E]/80 p-4.5 shadow-sm overflow-hidden"
                  >
                    {/* Subtle golden top glow line */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#C49A3A]/60 to-transparent" />

                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E8E0D1]/80 dark:border-[#2D2820]">
                      <div className="flex items-center gap-2">
                        <KeyRound size={16} className="text-[#C49A3A]" />
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#142B4A] dark:text-[#F5F0E6]">
                          Security Credentials &amp; Tokens
                        </span>
                      </div>
                    </div>

                    <p className="font-alora text-xs text-[#68768A] dark:text-[#887D6B] mb-3.5 leading-relaxed">
                      NexusCloud enforces a zero-knowledge security architecture. Keys are encrypted at the client boundary, stored in an isolated vault, and never exposed in plaintext.
                    </p>

                    <div className="space-y-3.5">
                      {meta.credentials.map((field) => (
                        <CredentialFieldItem
                          key={field.key}
                          field={field}
                          value={credentials[field.key] ?? ""}
                          error={fieldErrors[field.key] ?? null}
                          onChange={(val) =>
                            setCredentials((prev) => ({
                              ...prev,
                              [field.key]: val,
                            }))
                          }
                        />
                      ))}
                    </div>
                  </motion.div>
                </motion.div>

                {/* Footer Actions */}
                <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#E8E0D1] dark:border-[#2D2820] bg-white/40 dark:bg-[#13120F]/40 sticky bottom-0 -mx-6 -mb-5 px-6 py-4 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => {
                      if (!provider) {
                        setSelectedProvider(null)
                      } else {
                        onClose()
                      }
                    }}
                    disabled={busy}
                    className="rounded-xl border border-[#E8E0D1] dark:border-[#3D362B] bg-white dark:bg-[#1A1814] px-5 h-9 font-semibold text-xs text-[#68768A] dark:text-[#A89F91] hover:text-[#142B4A] dark:hover:text-[#F5F0E6] transition-colors cursor-pointer"
                  >
                    {!provider ? "Back" : "Cancel"}
                  </button>

                  <button
                    type="submit"
                    disabled={busy}
                    className="relative inline-flex items-center justify-center gap-2 rounded-xl bg-[#142B4A] hover:bg-[#1C3B65] dark:bg-[#C49A3A] dark:hover:bg-[#D4AC4C] text-white dark:text-[#0B0A08] px-6 h-9 font-bold text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {busy ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-[#C49A3A] dark:text-[#0B0A08]" />
                        <span>Verifying &amp; Storing…</span>
                      </>
                    ) : (
                      <span>Save &amp; Connect Storage</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}
