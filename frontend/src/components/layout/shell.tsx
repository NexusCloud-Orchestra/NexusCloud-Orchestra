import { NavLink, Link } from "react-router-dom"
import {
  Menu as MenuIcon,
  ChevronRight,
  Search,
  Settings,
  LogOut,
  HardDrive,
  Cloud,
  Cpu,
  Layers,
  Activity,
  LayoutDashboard,
} from "lucide-react"
import type { ReactNode } from "react"
import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Drawer } from "../ui/drawer"
import { useAuth } from "../../state/auth"
import { initialsOf } from "../../lib/format"
import { usePresence, MENU_EXIT_MS } from "../../hooks/use-presence"
import { cn } from "../../lib/utils"

export interface NavItem {
  to: string
  label: string
  end?: boolean
  icon: typeof LayoutDashboard
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/app", label: "Overview", end: true, icon: LayoutDashboard },
  { to: "/app/files", label: "Files", icon: HardDrive },
  { to: "/app/clouds", label: "Cloud Providers", icon: Cloud },
  { to: "/app/router", label: "Smart Router", icon: Cpu },
  { to: "/app/quota", label: "Capacity", icon: Layers },
  { to: "/app/activity", label: "Activity", icon: Activity },
]

/** Dual Chevron Brand Mark with Royal Gold Dot */
export function BrandGlyph({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      <path
        d="M5 20 L16 7 L27 20"
        stroke="#142B4A"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 20 L16 13 L22 20"
        stroke="#142B4A"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="25" r="2.2" fill="#C49A3A" />
    </svg>
  )
}

export function Wordmark({ to = "/app", compact = false }: { to?: string; compact?: boolean }) {
  return (
    <Link to={to} className="group inline-flex items-center gap-2.5 text-[#142B4A]" aria-label="NexusCloud Home">
      <div className="relative shrink-0 transition-transform duration-200 group-hover:scale-105">
        <BrandGlyph className="h-8 w-8" />
      </div>
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1.5 font-blackops text-[18px] tracking-wide">
          <span className="text-[#142B4A]">NEXUS</span>
          <span className="text-[#C49A3A]">CLOUD</span>
        </div>
        {!compact && (
          <span className="mt-1 font-mono text-[9px] font-semibold tracking-[0.24em] text-[#68768A] uppercase">
            ORCHESTRA
          </span>
        )}
      </div>
    </Link>
  )
}

function AccountDropdown() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const { mounted } = usePresence(open, MENU_EXIT_MS)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  const initials = user ? initialsOf(user.first_name, user.last_name) : "AP"

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E8E0D1] bg-[#0B1B32] text-white transition-all duration-150 hover:border-[#C49A3A] hover:shadow-xs active:scale-95"
      >
        <span className="font-mono text-xs font-semibold text-[#FFF8E7]">
          {initials}
        </span>
      </button>

      <AnimatePresence>
        {mounted && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.2, 0, 0, 1] }}
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-[#E8E0D1] bg-white p-2 shadow-lg"
          >
            {user ? (
              <div className="border-b border-[#E8E0D1]/60 px-3 py-2.5">
                <p className="truncate text-xs font-bold text-[#142B4A]">
                  {user.first_name} {user.last_name}
                </p>
                <p className="truncate font-mono text-[11px] text-[#68768A]">
                  {user.email}
                </p>
                {user.plan && (
                  <span className="mt-1.5 inline-block rounded-xs border border-[#C49A3A]/40 bg-[#FFF8E7] px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#A77B26]">
                    Plan: {user.plan}
                  </span>
                )}
              </div>
            ) : null}
            <div className="pt-1">
              <Link
                to="/app/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#344256] transition-colors hover:bg-[#FAF6ED] hover:text-[#142B4A]"
              >
                <Settings size={14} className="text-[#C49A3A]" />
                Account Settings
              </Link>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  void signOut()
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#C43D4B] transition-colors hover:bg-[#C43D4B]/10"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Primary Navigation Bar with Regal Navy background and Royal Gold active indicator */
function PrimaryNavBar() {
  return (
    <nav
      aria-label="Primary navigation"
      className="hidden md:flex items-center gap-1 rounded-full bg-[#0B1B32] p-1.5 shadow-sm border border-[#142B4A] shrink-0"
    >
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive: active }) =>
            cn(
              "relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-150 select-none whitespace-nowrap",
              active
                ? "bg-[#C49A3A] text-white shadow-xs font-semibold"
                : "text-slate-300 hover:text-white hover:bg-white/10"
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export function TopNavbar({
  onOpenPalette,
  onOpenNav,
}: {
  onOpenPalette: () => void
  onOpenNav: () => void
}) {
  return (
    <div className="flex w-full items-center justify-between gap-2 lg:gap-4">
      {/* Left: Brand */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={onOpenNav}
          aria-label="Open navigation"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E8E0D1] bg-white text-[#142B4A] hover:bg-[#FAF6ED] md:hidden shrink-0"
        >
          <MenuIcon size={18} />
        </button>
        <Wordmark />
      </div>

      {/* Center: Primary Navigation */}
      <PrimaryNavBar />

      {/* Right: Search / Command Palette & Account */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onOpenPalette}
          title="Search files & commands (⌘K)"
          className="flex h-9 items-center gap-2.5 rounded-full border border-[#E8E0D1] bg-[#FAF6ED]/70 px-3.5 text-xs font-medium text-[#68768A] transition-colors hover:border-[#C49A3A] hover:bg-[#FAF6ED] hover:text-[#142B4A] shadow-xs shrink-0"
        >
          <Search size={14} className="text-[#68768A]" />
          <span className="hidden sm:inline text-xs text-[#68768A]">Search anything...</span>
          <kbd className="inline-block rounded-md border border-[#E8E0D1] bg-white px-1.5 py-0.5 font-mono text-[10px] text-[#68768A]">
            ⌘K
          </kbd>
        </button>

        <Link
          to="/app/settings"
          title="Settings"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E8E0D1] bg-white text-[#344256] transition-colors hover:border-[#C49A3A] hover:bg-[#FAF6ED] hover:text-[#142B4A] shadow-xs shrink-0"
        >
          <Settings size={15} />
        </Link>

        <AccountDropdown />
      </div>
    </div>
  )
}

export function PageHeader({
  kicker,
  title,
  description,
  actions,
  backTo,
}: {
  kicker?: string
  title: string
  description?: ReactNode
  actions?: ReactNode
  backTo?: string
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E8E0D1]/50">
      <div className="flex items-start sm:items-center gap-3.5">
        {backTo ? (
          <Link
            to={backTo}
            aria-label="Back"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E8E0D1] bg-white text-[#142B4A] transition-colors hover:border-[#C49A3A] hover:bg-[#FAF6ED] shadow-2xs mt-0.5 sm:mt-0"
          >
            <ChevronRight size={17} className="rotate-180" />
          </Link>
        ) : null}
        <div>
          {kicker && (
            <div className="flex items-center gap-1.5 mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C49A3A]" />
              <p className="font-mono text-2xs uppercase tracking-wider text-[#A77B26] font-bold">
                {kicker}
              </p>
            </div>
          )}
          <h1 className="font-palatino text-2xl sm:text-3xl font-bold tracking-tight text-[#142B4A]">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-xs sm:text-sm text-[#68768A] font-normal leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">{actions}</div>}
    </div>
  )
}

export function Breadcrumb({ trail }: { trail: string[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 font-mono text-2xs uppercase tracking-kicker text-[#68768A]">
      {trail.map((segment, index) => (
        <span key={`${segment}-${index}`} className="flex items-center gap-1.5">
          {index > 0 ? <ChevronRight size={10} aria-hidden /> : null}
          <span className={index === trail.length - 1 ? "font-bold text-[#142B4A]" : undefined}>{segment}</span>
        </span>
      ))}
    </nav>
  )
}

/** Master Application Shell providing the Corn Silk + Regal Navy + Royal Gold Light Theme */
export function AppShell({
  children,
  onOpenPalette,
}: {
  children: ReactNode
  onOpenPalette: () => void
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="fixed inset-0 h-full w-full bg-[#FFFDF8] text-[#142B4A] font-sans antialiased selection:bg-[#C49A3A]/25 selection:text-[#142B4A] flex flex-col overflow-hidden">
      {/* Top Header */}
      <header className="shrink-0 z-30 w-full border-b border-[#E8E0D1] bg-white/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-2.5 shadow-xs">
        <TopNavbar
          onOpenPalette={onOpenPalette}
          onOpenNav={() => setMobileNavOpen(true)}
        />
      </header>

      {/* Mobile Drawer */}
      <Drawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        title="Navigation"
        meta="NEXUSCLOUD"
      >
        <nav className="flex flex-col gap-1.5 p-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-[#C49A3A] text-white"
                      : "text-[#142B4A] hover:bg-[#FAF6ED]"
                  )
                }
              >
                <Icon size={16} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </Drawer>

      {/* Main Page Content */}
      <main id="main-content" className="w-full flex-1 min-h-0 px-4 sm:px-6 lg:px-8 py-5 flex flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-[1460px] flex-1 flex flex-col">
          {children}
        </div>
      </main>
    </div>
  )
}
