import { NavLink, Link, useLocation } from "react-router-dom"
import { Activity, CircuitBoard, Cloud, FolderOpen, Gauge, LayoutDashboard, Settings2, LogOut, ChevronRight, Loader2 } from "lucide-react"
import type { ReactNode } from "react"
import { useAuth } from "../../state/auth"
import { useUploads } from "../../state/uploads"
import { initialsOf } from "../../lib/format"

const NAV = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/app/files", label: "Files", icon: FolderOpen },
  { to: "/app/clouds", label: "Clouds", icon: Cloud },
  { to: "/app/router", label: "Router", icon: CircuitBoard },
  { to: "/app/quota", label: "Quota", icon: Gauge },
  { to: "/app/activity", label: "Activity", icon: Activity },
] as const

/** Brand mark shared with the landing page: two peaks over a gold dot. */
export function BrandGlyph({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 22 L16 6 L28 22" />
      <path d="M9 22 L16 13 L23 22" />
      <circle cx="16" cy="25" r="2" fill="#F3C56F" stroke="none" />
    </svg>
  )
}

export function Wordmark({ to = "/", compact = false }: { to?: string; compact?: boolean }) {
  return (
    <Link to={to} className="group inline-flex items-center gap-2.5 text-ink" aria-label="NEXUS CLOUD home">
      <BrandGlyph className="h-7 w-7 transition-transform duration-base ease-out group-hover:-translate-y-0.5" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[15px] font-bold tracking-[0.14em]">
          NEXUS<b className="ml-[0.35em] font-bold text-accent">CLOUD</b>
        </span>
        {!compact ? <span className="mt-1 font-mono text-2xs tracking-[0.3em] text-ink-3">ORCHESTRA</span> : null}
      </span>
    </Link>
  )
}

function NavItem({ to, label, icon: Icon, end }: { to: string; label: string; icon: typeof FolderOpen; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `group relative flex items-center gap-2.5 rounded-full px-3.5 py-2 text-base transition-colors duration-fast ease-out ${
          isActive ? "bg-accent/10 font-medium text-ink" : "text-ink-2 hover:bg-ink/[0.05] hover:text-ink"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            aria-hidden
            className={`absolute inset-y-2 left-0 w-0.5 rounded-full transition-opacity duration-fast ${
              isActive ? "bg-accent opacity-100" : "opacity-0"
            }`}
          />
          <Icon size={14} strokeWidth={1.8} className={isActive ? "text-accent" : "text-ink-3 group-hover:text-ink-2"} />
          {label}
        </>
      )}
    </NavLink>
  )
}

function Sidebar() {
  const { user } = useAuth()
  const { activeCount } = useUploads()
  const plan = user?.plan ?? "—"

  return (
    <aside className="glass fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line lg:flex">
      <div className="flex h-16 items-center border-b border-line px-5">
        <Wordmark to="/app" />
      </div>
      <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 px-3 py-5">
        <p className="label-caps mb-2 px-3.5">Control plane</p>
        {NAV.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
        <div className="my-3 h-px bg-line" role="presentation" />
        <NavItem to="/app/settings" label="Settings" icon={Settings2} />
      </nav>
      <div className="border-t border-line px-3 py-3">
        <div className="flex items-center gap-2.5 rounded-sm px-1.5 py-1">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent-line bg-accent-wash font-mono text-2xs font-semibold text-accent">
            {user ? initialsOf(user.first_name, user.last_name) : "·"}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium text-ink">
              {user ? `${user.first_name} ${user.last_name}` : "—"}
            </p>
            <p className="truncate font-mono text-2xs uppercase tracking-kicker text-ink-3">{plan}</p>
          </div>
        </div>
      </div>
      {activeCount > 0 ? (
        <Link
          to="/app/files"
          className="flex items-center gap-2 border-t border-line px-5 py-2.5 text-sm text-ink-2 transition-colors duration-fast hover:text-ink"
        >
          <Loader2 size={12} className="animate-spin text-accent" aria-hidden />
          {activeCount} upload{activeCount === 1 ? "" : "s"} in progress
        </Link>
      ) : null}
    </aside>
  )
}

const TITLES: Record<string, string> = {
  "/app": "Overview",
  "/app/files": "Files",
  "/app/clouds": "Clouds",
  "/app/router": "Router",
  "/app/quota": "Quota",
  "/app/activity": "Activity",
  "/app/settings": "Settings",
}

function Topbar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const title = TITLES[location.pathname] ?? "Overview"

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-line bg-night/70 px-5 backdrop-blur-[14px] lg:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <span className="lg:hidden">
          <Wordmark to="/app" compact />
        </span>
        <p className="label-caps hidden truncate lg:block">
          NexusCloud <span className="mx-1 text-accent">/</span> <span className="text-ink-2">{title}</span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenPalette}
          className="flex h-9 items-center gap-2 rounded-full border border-line bg-ink/[0.04] px-3.5 text-sm text-ink-3 transition-colors duration-fast hover:border-accent hover:text-accent"
          aria-label="Open command palette"
        >
          <SearchGlyph />
          <span className="hidden sm:inline">Search &amp; navigate</span>
          <kbd className="hidden rounded-xs border border-line bg-raise px-1 font-mono text-2xs text-ink-3 sm:inline">⌘K</kbd>
        </button>
        {user ? (
          <Link
            to="/app/settings"
            className="hidden h-9 items-center gap-2 rounded-full border border-transparent px-3 font-mono text-2xs text-ink-3 transition-colors duration-fast hover:border-line hover:text-ink-2 sm:flex"
          >
            {user.email}
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => void signOut()}
          aria-label="Sign out"
          title="Sign out"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-ink-3 transition-colors duration-fast hover:border-accent hover:text-accent"
        >
          <LogOut size={14} strokeWidth={1.8} />
        </button>
      </div>
    </header>
  )
}

function SearchGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker: string
  title: string
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-line pb-6">
      <div className="min-w-0">
        <p className="label-caps !text-accent">{kicker}</p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h2>
        {description ? <p className="mt-2 max-w-prose text-md text-ink-2">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

/** Breadcrumb trail for nested contexts (files, provider detail). */
export function Breadcrumb({ trail }: { trail: string[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 font-mono text-2xs uppercase tracking-kicker text-ink-3">
      {trail.map((segment, index) => (
        <span key={`${segment}-${index}`} className="flex items-center gap-1">
          {index > 0 ? <ChevronRight size={10} aria-hidden /> : null}
          <span className={index === trail.length - 1 ? "text-ink-2" : undefined}>{segment}</span>
        </span>
      ))}
    </nav>
  )
}

export function AppShell({ children, onOpenPalette }: { children: ReactNode; onOpenPalette: () => void }) {
  return (
    <div className="min-h-dvh">
      <Sidebar />
      <div className="flex min-h-dvh flex-col lg:pl-60">
        <Topbar onOpenPalette={onOpenPalette} />
        <main className="mx-auto w-full max-w-content flex-1 px-5 py-7 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  )
}
