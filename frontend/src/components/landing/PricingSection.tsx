import { Check } from "lucide-react"
import PixelCard from "../ui/PixelCard"

export interface PricingPlan {
  id: string
  name: string
  price: string
  period: string
  desc: string
  popular?: boolean
  features: string[]
  ctaText: string
  ctaHref: string
}

export const LANDING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "0",
    period: "/ month",
    desc: "Smart routing, single user",
    features: [
      "1 connected cloud",
      "10 GB managed storage",
      "1 seat included",
      "Smart Egress Routing",
      "AES-256-GCM Vault",
    ],
    ctaText: "Start free",
    ctaHref: "/register",
  },
  {
    id: "starter",
    name: "Starter",
    price: "249",
    period: "/ month",
    desc: "Full pool aggregation",
    popular: true,
    features: [
      "5 connected clouds",
      "250 GB managed storage",
      "1 seat included",
      "Smart Egress Routing",
      "AES-256-GCM Vault",
    ],
    ctaText: "Choose Starter",
    ctaHref: "/register",
  },
  {
    id: "pro",
    name: "Pro",
    price: "749",
    period: "/ month",
    desc: "Every connected cloud, no cap",
    features: [
      "Unlimited connected clouds",
      "1,000 GB managed storage",
      "1 seat included",
      "Smart Egress Routing",
      "AES-256-GCM Vault",
    ],
    ctaText: "Choose Pro",
    ctaHref: "/register",
  },
  {
    id: "team",
    name: "Team",
    price: "2,499",
    period: "/ month",
    desc: "Shared workspace",
    features: [
      "Unlimited connected clouds",
      "5,000 GB managed storage",
      "5 team seats",
      "Smart Egress Routing",
      "AES-256-GCM Vault",
    ],
    ctaText: "Choose Team",
    ctaHref: "/register",
  },
]

export function PricingSection({ className = "" }: { className?: string }) {
  return (
    <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 ${className}`}>
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#C49A3A]/40 bg-[#FFF8E7] px-3 py-1 mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-[#C49A3A]" />
          <span className="font-mono text-2xs font-bold tracking-widest text-[#A77B26] uppercase">
            Transparent Pricing
          </span>
        </div>
        <h2 className="font-palatino text-3xl sm:text-4xl font-bold text-[#142B4A] tracking-tight">
          Start at ₹0. Scale when you need to.
        </h2>
        <p className="font-alora text-sm sm:text-base text-[#68768A] mt-2">
          No hidden egress markup. Connect your own clouds and pay only for orchestrator intelligence.
        </p>
      </div>

      {/* Plans Grid with PixelCard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {LANDING_PLANS.map((plan, i) => {
          const isPopular = plan.popular

          return (
            <PixelCard
              key={plan.id}
              variant="gold"
              theme="light"
              intro={true}
              introDelay={i * 140}
              radius={20}
              gap={isPopular ? 4 : 5}
              speed={isPopular ? 32 : 25}
              colors={
                isPopular
                  ? ["#F3C56F", "#C49A3A", "#FFE4A0", "#E2A62C", "#A77B26"]
                  : ["#C49A3A", "#A77B26", "#142B4A", "#E8E0D1", "#FFF8E7"]
              }
              glowColor={isPopular ? "#F3C56F" : "#C49A3A"}
              glow={isPopular ? 0.6 : 0.45}
              spotlight={isPopular ? 0.65 : 0.5}
              opacity={isPopular ? 0.9 : 0.8}
              fade={0.5}
              className={`w-full h-full text-left transition-all duration-300 hover:-translate-y-1 ${
                isPopular
                  ? "border-2 border-[#C49A3A] shadow-[0_12px_32px_-4px_rgba(196,154,58,0.22)] bg-gradient-to-b from-[#FFFDF8] to-white"
                  : "border border-[#E8E0D1] shadow-2xs hover:border-[#C49A3A]/60 bg-white"
              }`}
            >
              <div className="flex flex-col justify-between w-full h-full p-6 sm:p-7">
                {/* Popular Pill */}
                {isPopular && (
                  <div className="absolute top-3.5 right-3.5 inline-flex items-center gap-1.5 rounded-full border border-[#C49A3A]/50 bg-[#FFF8E7] px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-wider text-[#A77B26] uppercase">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#A77B26]" />
                    Most Popular
                  </div>
                )}

                <div>
                  {/* Plan Name & Tagline */}
                  <h3 className="font-palatino text-2xl font-bold text-[#142B4A] capitalize">
                    {plan.name}
                  </h3>
                  <p className="font-alora text-xs text-[#68768A] mt-1 mb-4 min-h-[32px] leading-snug">
                    {plan.desc}
                  </p>

                  {/* Pricing Display */}
                  <div className="flex items-baseline gap-1 pb-4 mb-5 border-b border-[#F0EAE0]">
                    <span className="font-palatino text-xl font-bold text-[#142B4A]">₹</span>
                    <span className="font-palatino text-4xl font-bold text-[#142B4A] tracking-tight">
                      {plan.price}
                    </span>
                    <span className="font-alora text-xs text-[#68768A] ml-1">{plan.period}</span>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-[#344256] font-alora leading-normal">
                        <Check size={14} className="text-[#168568] shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Call to action button */}
                <div className="mt-auto pt-2">
                  <a
                    href={plan.ctaHref}
                    className={`block w-full py-2.5 px-4 rounded-lg text-center font-mono text-xs font-bold transition-all shadow-xs ${
                      isPopular
                        ? "bg-[#142B4A] text-white hover:bg-[#0B1B32] hover:shadow-md"
                        : "border border-[#142B4A] text-[#142B4A] bg-transparent hover:bg-[#142B4A] hover:text-white"
                    }`}
                  >
                    {plan.ctaText}
                  </a>
                </div>
              </div>
            </PixelCard>
          )
        })}
      </div>

      <p className="text-center font-alora text-xs text-[#68768A] mt-6">
        Capacities and quotas are pooled across all connected accounts. Upgrades activate instantly.
      </p>
    </section>
  )
}
