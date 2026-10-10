import { NavLink, Link } from "react-router-dom"
import { Activity, Cloud, FolderOpen, Gauge, LayoutDashboard, LogOut, Route, Settings2 } from "lucide-react"
import type { ReactNode } from "react"
import { useAuth } from "../../state/auth"
import { useUploads } from "../../state/uploads"
import { initialsOf } from "../../lib/format"

const NAV = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/app/files", label: "Files", icon: FolderOpen },
  { to: "/app/clouds", label: "Clouds", icon: Cloud },
  { to: "/app/router", label: "Router", icon: Route },
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
    <Link to={to} className="inline-flex items-center gap-2.5 text-ink" aria-label="NEXUS CLOUD home">
      <BrandGlyph className="h-6 w-6" />
      {compact ? null : (
        <span className="font-display text-[15px] font-bold tracking-[0.14em]">
          NEXUS<b className="ml-[0.35em] font-bold text-accent">CLOUD</b>
        </span>
      )}
    </Link>
  )
}

/** Top rail on desktop: brand, destinations, search, account. Content gets the full width. */
function TopRail({ onOpenPalette }: { onOpenPalette: () => void }) {
  const { user, signOut } = useAuth()
  const { activeCount } = useUploads()

  return (
    // avoid-ai-design-ignore: K3 -- sticky rail over scrolling content
    <header className="sticky top-0 z-30 border-b border-line bg-night/85 backdrop-blur-[12px]">
      <div className="mx-auto flex h-14 w-full max-w-content items-center gap-6 px-4 lg:px-8">
        <Wordmark to="/app" />
        <nav aria-label="Primary" className="ml-2 hidden items-stretch gap-1 self-stretch lg:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={"end" in item ? item.end : undefined}
              className={({ isActive }) =>
                `relative flex items-center px-3 text-base transition-colors duration-fast ease-out ${
                  isActive ? "font-medium text-ink" : "text-ink-2 hover:text-ink"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  <span
                    aria-hidden
                    className={`absolute inset-x-3 bottom-0 h-0.5 rounded-full ${isActive ? "bg-accent" : "bg-transparent"}`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {activeCount > 0 ? (
            <Link
              to="/app/files"
              className="hidden items-center gap-2 rounded-full border border-accent-line px-3 py-1 text-sm text-accent-deep sm:inline-flex"
            >
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-accent" aria-hidden />
              {activeCount} uploading
            </Link>
          ) : null}
          <button
            type="button"
            onClick={onOpenPalette}
            className="flex h-9 items-center gap-2 rounded-sm border border-line px-3 text-sm text-ink-2 transition-colors duration-fast hover:border-line-strong hover:text-ink"
            aria-label="Open command palette"
          >
            <SearchGlyph />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden rounded-xs border border-line-strong bg-raise px-1 font-mono text-xs text-ink-2 sm:inline">⌘K</kbd>
          </button>
          <NavLink
            to="/app/settings"
            aria-label="Settings"
            title={user ? `${user.first_name} ${user.last_name}, ${user.plan} plan` : "Settings"}
            className={({ isActive }) =>
              `flex h-9 w-9 items-center justify-center rounded-full border bg-accent-wash text-xs font-semibold text-accent transition-colors duration-fast hover:border-accent ${
                isActive ? "border-accent ring-1 ring-accent" : "border-accent-line"
              }`
            }
          >
            {user ? initialsOf(user.first_name, user.last_name) : <Settings2 size={14} />}
          </NavLink>
          <button
            type="button"
            onClick={() => void signOut()}
            aria-label="Sign out"
            title="Sign out"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-3 transition-colors duration-fast hover:text-ink"
          >
            <LogOut size={15} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </header>
  )
}

/** Phone navigation: the same destinations as a bottom tab bar, reachable with a thumb. */
function TabBar() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-line bg-deep pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={"end" in item ? item.end : undefined}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-2 text-xs transition-colors duration-fast ${isActive ? "text-accent" : "text-ink-2"}`
          }
        >
          <item.icon size={17} strokeWidth={1.8} aria-hidden />
          {item.label}
        </NavLink>
      ))}
    </nav>
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

/** One line: title, optional hint, actions. Data starts within ~60px of the rail. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1 max-w-prose text-base text-ink-2">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function AppShell({ children, onOpenPalette }: { children: ReactNode; onOpenPalette: () => void }) {
  return (
    <div className="min-h-dvh">
      <TopRail onOpenPalette={onOpenPalette} />
      <main className="mx-auto w-full max-w-content px-4 pb-24 pt-6 lg:px-8 lg:pb-12 lg:pt-8">{children}</main>
      <TabBar />
    </div>
  )
}
