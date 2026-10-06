import { Link } from "react-router-dom"
import type { ReactNode } from "react"
import { Wordmark } from "../components/layout/shell"

/**
 * Auth pages stay typographic: brand, one panel, no gradients, no illustrations.
 * The right rail is a static, labelled diagram of the product's model.
 */
export function AuthLayout({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="flex h-14 items-center justify-between border-b border-line px-5 lg:px-8">
        <Wordmark />
        <Link to="/" className="text-sm text-ink-2 transition-colors duration-fast hover:text-ink">
          Back to overview
        </Link>
      </header>
      <main className="mx-auto grid w-full max-w-content flex-1 grid-cols-1 items-center gap-12 px-5 py-10 lg:grid-cols-[minmax(0,420px)_1fr] lg:px-8">
        <div className="animate-fade-rise w-full">
          <h1 className="text-2xl font-semibold tracking-tighter text-ink">{title}</h1>
          <p className="mt-1.5 max-w-prose text-base text-ink-2">{description}</p>
          <div className="mt-7">{children}</div>
          {footer ? <div className="mt-6 text-base text-ink-2">{footer}</div> : null}
        </div>
        <aside className="hidden lg:block" aria-hidden>
          <ControlPlaneDiagram />
        </aside>
      </main>
    </div>
  )
}

/** Static topology: many providers → one control plane. Decorative, not data. */
export function ControlPlaneDiagram() {
  const providers = ["AWS", "GCS", "AZURE", "R2", "B2", "OCI", "IBM"]
  return (
    <div className="mx-auto w-full max-w-md">
      <p className="label-caps mb-4">Many clouds · one plane</p>
      <div className="relative flex items-stretch gap-6">
        <ul className="flex flex-col justify-between gap-2 py-1">
          {providers.map((provider) => (
            <li key={provider} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-line-strong" />
              <span className="font-mono text-2xs tracking-kicker text-ink-3">{provider}</span>
            </li>
          ))}
        </ul>
        <svg viewBox="0 0 120 210" className="h-[210px] w-[120px] shrink-0" fill="none">
          {providers.map((_, index) => {
            const y = 8 + index * (194 / (providers.length - 1))
            return (
              <path
                key={index}
                d={`M0 ${y} H64 Q76 ${y} 76 105`}
                stroke="#D6D4CD"
                strokeWidth="1"
                strokeDasharray="2 3"
              />
            )
          })}
          <circle cx="76" cy="105" r="3.5" fill="#2F4BE0" />
        </svg>
        <div className="flex flex-col justify-center gap-1 py-1">
          <span className="font-mono text-xs font-semibold tracking-[0.14em] text-ink">NEXUSCLOUD</span>
          <span className="font-mono text-2xs tracking-[0.3em] text-ink-3">ORCHESTRA</span>
          <span className="mt-2 max-w-[16ch] text-sm text-ink-2">
            One API. Smart routing. Your storage stays in your clouds.
          </span>
        </div>
      </div>
    </div>
  )
}
