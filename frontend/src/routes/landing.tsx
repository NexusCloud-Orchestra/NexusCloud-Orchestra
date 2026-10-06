import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Check } from "lucide-react"
import { useProviders, usePlans } from "../hooks/use-data"
import { formatBytes } from "../lib/format"
import { ROUTE_WEIGHTS, PROVIDER_META, PROVIDER_IDS } from "../lib/providers"
import { Wordmark } from "../components/layout/shell"
import { Skeleton } from "../components/ui/states"

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-paper">
      <LandingHeader />
      <main>
        <Hero />
        <ProblemSection />
        <OrchestratorSection />
        <ProviderSection />
        <PlanSection />
        <StartSection />
      </main>
      <LandingFooter />
    </div>
  )
}

function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper">
      <div className="mx-auto flex h-14 max-w-content items-center justify-between px-5 lg:px-8">
        <Wordmark />
        <nav className="hidden items-center gap-6 md:flex" aria-label="Marketing">
          <a href="#how" className="text-base text-ink-2 transition-colors duration-fast hover:text-ink">How it works</a>
          <a href="#clouds" className="text-base text-ink-2 transition-colors duration-fast hover:text-ink">Clouds</a>
          <a href="#plans" className="text-base text-ink-2 transition-colors duration-fast hover:text-ink">Plans</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden px-2 text-base text-ink-2 transition-colors duration-fast hover:text-ink sm:block">
            Sign in
          </Link>
          <Link
            to="/register"
            className="inline-flex h-8 items-center rounded-sm border border-accent bg-accent px-3.5 text-base font-medium text-white transition-all duration-fast ease-out hover:border-accent-deep hover:bg-accent-deep"
          >
            Connect your cloud
          </Link>
        </div>
      </div>
    </header>
  )
}

/** Reveal-on-scroll wrapper — opacity/translate only, disabled under reduced motion. */
function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.disconnect()
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-slow ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"} ${className}`}
    >
      {children}
    </div>
  )
}

function Hero() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto grid max-w-content grid-cols-1 items-center gap-12 px-5 py-16 lg:grid-cols-[minmax(0,1fr)_460px] lg:py-24 lg:px-8">
        <div className="max-w-2xl">
          <p className="label-caps">Multi-cloud storage orchestration</p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tighter text-ink sm:text-[52px]">
            Your clouds.
            <br />
            One storage plane.
          </h1>
          <p className="mt-5 max-w-prose text-lg text-ink-2">
            Connect the cloud storage you already own — AWS S3, Google Cloud Storage, Azure Blob, Cloudflare R2,
            Backblaze B2, Oracle Cloud, IBM Cloud — and manage every upload through one control plane. File bytes
            travel directly between you and your clouds, always.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/register"
              className="group inline-flex h-10 items-center gap-2 rounded-sm border border-accent bg-accent px-5 text-md font-medium text-white transition-all duration-fast ease-out hover:border-accent-deep hover:bg-accent-deep"
            >
              Connect your cloud
              <ArrowRight size={14} className="transition-transform duration-fast group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <Link
              to="/login"
              className="inline-flex h-10 items-center rounded-sm border border-line-strong bg-surface px-5 text-md font-medium text-ink transition-all duration-fast ease-out hover:border-ink-3"
            >
              Explore the platform
            </Link>
          </div>
          <p className="mt-5 font-mono text-2xs uppercase tracking-kicker text-ink-3">
            Zero data touch · presigned URLs · BYOC
          </p>
        </div>
        <TopologyFigure />
      </div>
    </section>
  )
}

/** Many providers → one plane. The product's model, drawn once. */
function TopologyFigure() {
  const providers = PROVIDER_IDS
  return (
    <figure aria-label="Diagram: seven cloud providers connected to one NexusCloud control plane" className="w-full">
      <div className="grid-paper rounded-md border border-line bg-surface p-6">
        <svg viewBox="0 0 400 336" className="w-full" fill="none" role="presentation">
          {providers.map((id, index) => {
            const y = 14 + index * (308 / (providers.length - 1))
            const meta = PROVIDER_META[id]
            return (
              <g key={id}>
                <text x="0" y={y + 3.5} className="fill-ink-3 font-mono" fontSize="10" letterSpacing="1">
                  {meta.short.toUpperCase()}
                </text>
                <path
                  d={`M44 ${y} H168 Q184 ${y} 184 168`}
                  stroke="#D6D4CD"
                  strokeWidth="1"
                  strokeDasharray="3 4"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="14"
                    to="0"
                    dur="2.6s"
                    repeatCount="indefinite"
                  />
                </path>
                <circle cx="44" cy={y} r="2.5" fill={meta.marker} />
              </g>
            )
          })}
          <rect x="184" y="140" width="216" height="56" rx="4" className="fill-surface" stroke="#17191D" strokeWidth="1.2" />
          <text x="204" y="164" className="fill-ink font-mono" fontSize="12" fontWeight="600" letterSpacing="2">
            NEXUSCLOUD
          </text>
          <text x="204" y="182" className="fill-ink-3 font-mono" fontSize="9" letterSpacing="2.5">
            CONTROL PLANE
          </text>
        </svg>
      </div>
      <figcaption className="mt-2.5 font-mono text-2xs uppercase tracking-kicker text-ink-3">
        fig. 01 — every connected cloud, one plane
      </figcaption>
    </figure>
  )
}

function ProblemSection() {
  const items = [
    { k: "01", title: "Multiple clouds", body: "Your storage is spread across providers, each with its own console, keys and limits." },
    { k: "02", title: "Multiple workflows", body: "A different CLI, SDK and credentials set for every upload, and no single view of capacity." },
    { k: "03", title: "Idle free tiers", body: "Permanent free tiers sit unused while paid egress and storage accumulate elsewhere." },
  ]
  return (
    <section id="how" className="border-b border-line py-16 lg:py-20">
      <div className="mx-auto max-w-content px-5 lg:px-8">
        <Reveal>
          <p className="label-caps">01 — The problem</p>
          <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tighter text-ink sm:text-3xl">
            Storage scattered across consoles is capacity you cannot see or steer.
          </h2>
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
          {items.map((item) => (
            <Reveal key={item.k}>
              <div className="border-t-2 border-ink/80 pt-4">
                <p className="font-mono text-2xs text-ink-3">{item.k}</p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight text-ink">{item.title}</h3>
                <p className="mt-1.5 text-base text-ink-2">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function OrchestratorSection() {
  return (
    <section className="border-b border-line py-16 lg:py-20">
      <div className="mx-auto grid max-w-content grid-cols-1 items-start gap-12 px-5 lg:grid-cols-2 lg:px-8">
        <Reveal>
          <p className="label-caps">02 — The orchestrator</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tighter text-ink sm:text-3xl">
            One decision for every upload.
          </h2>
          <p className="mt-4 max-w-prose text-base text-ink-2">
            NexusCloud scores every connected cloud before each upload: available capacity, egress cost, whether the
            free tier is permanent, and how well the file fits the remaining quota. The highest-scoring cloud receives
            a presigned URL — the bytes never pass through NexusCloud.
          </p>
          <ul className="mt-6 flex flex-col gap-2">
            {ROUTE_WEIGHTS.map((weight) => (
              <li key={weight.key} className="flex items-baseline gap-3 border-b border-line pb-2">
                <span className="w-32 font-mono text-sm text-ink-3">{weight.weight.toFixed(2)}</span>
                <span className="text-base text-ink">{weight.label}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 font-mono text-2xs uppercase tracking-kicker text-ink-3">
            placement policy · deterministic · backend-owned
          </p>
        </Reveal>
        <Reveal className="lg:mt-2">
          <RouteWalkthrough />
        </Reveal>
      </div>
    </section>
  )
}

/** Clearly-labelled static walkthrough — a real decision shape, not a fake live UI. */
function RouteWalkthrough() {
  const steps = [
    { label: "Upload request", value: "video.mp4 · 4.2 GiB" },
    { label: "Candidates evaluated", value: "r2 · oci · b2 · gcp" },
    { label: "Recommended", value: "Cloudflare R2" },
    { label: "Why", value: "largest free capacity · zero egress · permanent tier" },
    { label: "Transfer", value: "presigned PUT — browser → your bucket" },
  ]
  return (
    <figure className="rounded-md border border-line bg-surface p-5" aria-label="Example routing decision, illustrative">
      <div className="flex flex-col">
        {steps.map((step, index) => (
          <div key={step.label} className="flex flex-col">
            {index > 0 ? <ArrowRight size={12} className="my-1.5 self-start text-ink-3" aria-hidden /> : null}
            <div className="flex items-baseline justify-between gap-4">
              <span className="label-caps">{step.label}</span>
              <span className="text-right font-mono text-sm text-ink">{step.value}</span>
            </div>
          </div>
        ))}
      </div>
      <figcaption className="mt-4 border-t border-line pt-3 font-mono text-2xs uppercase tracking-kicker text-ink-3">
        fig. 02 — example decision, illustrative values
      </figcaption>
    </figure>
  )
}

function ProviderSection() {
  const providers = useProviders()
  return (
    <section id="clouds" className="border-b border-line py-16 lg:py-20">
      <div className="mx-auto max-w-content px-5 lg:px-8">
        <Reveal>
          <p className="label-caps">03 — The clouds</p>
          <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tighter text-ink sm:text-3xl">
            Connect what you already pay for.
          </h2>
          <p className="mt-3 max-w-prose text-base text-ink-2">
            Published always-free storage estimates for the supported providers. Numbers below are the platform's
            placement estimates, not billing guarantees.
          </p>
        </Reveal>
        <div className="mt-8 overflow-hidden rounded-md border border-line bg-surface">
          {providers.isLoading ? (
            <div className="px-4 py-4">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="mb-2 h-8 w-full" />
              ))}
            </div>
          ) : providers.isError ? (
            <p className="px-4 py-6 text-base text-ink-2">Provider catalog is unavailable right now.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="label-caps px-4 py-2.5 text-left">Provider</th>
                  <th scope="col" className="label-caps px-4 py-2.5 text-right">Free-tier estimate</th>
                  <th scope="col" className="label-caps px-4 py-2.5 text-right">Egress efficiency</th>
                  <th scope="col" className="label-caps px-4 py-2.5 text-right">Tier</th>
                </tr>
              </thead>
              <tbody>
                {(providers.data ?? []).map((provider) => (
                  <tr key={provider.name} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-2.5">
                        <span
                          className="h-2.5 w-2.5 rounded-xs border border-black/5"
                          style={{ backgroundColor: PROVIDER_META[provider.name]?.marker ?? "#8E929C" }}
                          aria-hidden
                        />
                        <span className="text-base font-medium text-ink">{PROVIDER_META[provider.name]?.name ?? provider.name}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-base text-ink tnum">{formatBytes(provider.free_bytes)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-base text-ink-2 tnum">
                      {(provider.inverse_egress * 100).toFixed(0)}%
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-base text-ink-2">{provider.permanent ? "permanent" : "12-month"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  )
}

function PlanSection() {
  const plans = usePlans()
  return (
    <section id="plans" className="border-b border-line py-16 lg:py-20">
      <div className="mx-auto max-w-content px-5 lg:px-8">
        <Reveal>
          <p className="label-caps">04 — Plans</p>
          <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tighter text-ink sm:text-3xl">
            Start free. Upgrade when the plane grows.
          </h2>
          <p className="mt-3 max-w-prose text-base text-ink-2">
            Paid tiers require a billing integration that is not yet available — upgrade paths will appear here once
            billing is live.
          </p>
        </Reveal>
        <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {(plans.data ?? []).map((plan) => (
            <div key={plan.name} className="flex flex-col gap-3 bg-surface px-5 py-5">
              <div className="flex items-baseline justify-between">
                <h3 className="font-mono text-sm font-semibold uppercase tracking-kicker text-ink">{plan.name}</h3>
                {plan.name === "free" ? <StatusFree /> : null}
              </div>
              <p className="font-mono text-2xs text-ink-3">
                {plan.max_connections === null ? "unlimited connections" : `${plan.max_connections} connections`}
                {" · "}
                {plan.max_bytes === null ? "no storage cap" : `${formatBytes(plan.max_bytes)} cap`}
              </p>
              <p className="text-base text-ink-2">{plan.seats} seat{plan.seats === 1 ? "" : "s"}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function StatusFree() {
  return (
    <span className="inline-flex items-center gap-1 rounded-xs border border-ok-line bg-ok-wash px-1.5 py-0.5 font-mono text-2xs uppercase tracking-kicker text-ok">
      <Check size={9} strokeWidth={3} aria-hidden />
      available
    </span>
  )
}

function StartSection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-content px-5 lg:px-8">
        <Reveal>
          <div className="flex flex-col items-start gap-5 border-t-2 border-ink/80 pt-10">
            <p className="label-caps">05 — Start</p>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tighter text-ink sm:text-4xl">
              Connect your first cloud.
            </h2>
            <p className="max-w-prose text-lg text-ink-2">
              Create an account, connect a provider, and let the router place the first upload.
            </p>
            <Link
              to="/register"
              className="group mt-2 inline-flex h-10 items-center gap-2 rounded-sm border border-accent bg-accent px-5 text-md font-medium text-white transition-all duration-fast ease-out hover:border-accent-deep hover:bg-accent-deep"
            >
              Connect your cloud
              <ArrowRight size={14} className="transition-transform duration-fast group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function LandingFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-4 px-5 py-6 lg:px-8">
        <Wordmark />
        <p className="font-mono text-2xs uppercase tracking-kicker text-ink-3">
          BYOC · presigned data plane · {new Date().getFullYear()}
        </p>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm text-ink-2 transition-colors duration-fast hover:text-ink">Sign in</Link>
          <Link to="/register" className="text-sm text-ink-2 transition-colors duration-fast hover:text-ink">Create account</Link>
        </div>
      </div>
    </footer>
  )
}
