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
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-16 items-center justify-between border-b border-line bg-night/60 px-5 backdrop-blur-[14px] lg:px-14">
        <Wordmark />
        <a
          href="/landing/index.html"
          className="rounded-full border border-line px-4 py-2 text-sm text-ink-2 transition-colors duration-fast hover:border-accent hover:text-accent"
        >
          Back to home
        </a>
      </header>
      <main className="mx-auto grid w-full max-w-content flex-1 grid-cols-1 items-center gap-14 px-5 py-12 lg:grid-cols-[1fr_minmax(0,440px)] lg:px-10">
        <aside className="hidden lg:block" aria-hidden>
          <p className="label-caps !text-accent">Multi cloud orchestration platform</p>
          <p className="animate-rise mt-4 font-display text-[clamp(56px,7vw,104px)] font-extrabold leading-[0.86] tracking-tighter text-ink">
            NEXUS
            <br />
            <span className="text-sheen">CLOUD</span>
          </p>
          <p className="mt-6 max-w-md text-md leading-relaxed text-ink-2">
            Pool the free tiers of your own cloud accounts into one intelligent virtual drive, routed automatically.
          </p>
          <div className="mt-10">
            <ControlPlaneDiagram />
          </div>
        </aside>
        <div className="glass animate-fade-rise w-full rounded-lg border border-line p-7 shadow-pop sm:p-9">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">{title}</h1>
          <p className="mt-2 max-w-prose text-base text-ink-2">{description}</p>
          <div className="mt-7">{children}</div>
          {footer ? <div className="mt-6 border-t border-line pt-5 text-base text-ink-2">{footer}</div> : null}
        </div>
      </main>
    </div>
  )
}

/** Static topology: many providers → one control plane. Decorative, not data. */
export function ControlPlaneDiagram() {
  const providers = ["AWS", "GCS", "AZURE", "R2", "B2", "OCI", "IBM"]
  return (
    <div className="w-full max-w-md">
      <p className="label-caps mb-4">Many clouds · one plane</p>
      <div className="relative flex items-stretch gap-6">
        <ul className="flex flex-col justify-between gap-2 py-1">
          {providers.map((provider) => (
            <li key={provider} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent/60" />
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
                stroke="#2E4058"
                strokeWidth="1"
                strokeDasharray="2 3"
              />
            )
          })}
          <circle cx="76" cy="105" r="3.5" fill="#F3C56F" />
        </svg>
        <div className="flex flex-col justify-center gap-1 py-1">
          <span className="font-display text-sm font-bold tracking-[0.14em] text-ink">
            NEXUS<span className="ml-1 text-accent">CLOUD</span>
          </span>
          <span className="font-mono text-2xs tracking-[0.3em] text-ink-3">ORCHESTRA</span>
          <span className="mt-2 max-w-[16ch] text-sm text-ink-2">
            One API. Smart routing. Your storage stays in your clouds.
          </span>
        </div>
      </div>
    </div>
  )
}
