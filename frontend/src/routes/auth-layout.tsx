import { useEffect } from "react"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { useTheme, THEME_STORAGE_KEY } from "../state/theme"
import cloudImage from "../assets/auth-clouds.webp"

/** The Dual Chevron Brand Logo Mark with Royal Gold Dot matching the reference image */
export function AuthBrand() {
  return (
    <Link to="/app" className="group inline-flex items-center gap-3.5" aria-label="NexusCloud Home">
      <div className="relative shrink-0 transition-transform duration-200 group-hover:scale-105">
        <svg viewBox="0 0 32 32" className="h-9 w-9 sm:h-10 sm:w-10" fill="none" aria-hidden>
          <path
            d="M5 20 L16 7 L27 20"
            stroke="#16213E"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 20 L16 13 L22 20"
            stroke="#16213E"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="25" r="2.4" fill="#C59B27" />
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1.5 font-display text-[20px] sm:text-[22px] font-black tracking-tight">
          <span className="text-[#0F172A]">NEXUS</span>
          <span className="text-[#C59B27]">CLOUD</span>
        </div>
        <span className="mt-1 font-mono text-[10px] sm:text-[11px] font-bold tracking-[0.28em] text-[#334155] uppercase">
          ORCHESTRA
        </span>
      </div>
    </Link>
  )
}

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
  const { setTheme } = useTheme()

  useEffect(() => {
    setTheme("light")
    document.documentElement.classList.remove("dark")
    document.documentElement.setAttribute("data-theme", "light")
    document.documentElement.style.colorScheme = "light"
    if (document.body) {
      document.body.classList.remove("dark")
      document.body.setAttribute("data-theme", "light")
    }
    try {
      localStorage.removeItem(THEME_STORAGE_KEY)
      localStorage.setItem(THEME_STORAGE_KEY, "light")
    } catch { /* noop */ }
  }, [setTheme])

  return (
    <div className="fixed inset-0 h-full w-full bg-[#F7F2E7] flex flex-col items-center justify-center p-3 sm:p-5 lg:p-6 font-sans antialiased text-slate-900 selection:bg-[#C59B27]/25 selection:text-[#16213E] overflow-hidden select-none">
      {/* ── Prominent Top-Left Back Arrow to Landing ── */}
      <Link
        to="/"
        className="fixed top-3.5 left-3.5 sm:top-5 sm:left-6 z-50 inline-flex items-center gap-2 rounded-full border border-[#E7DFCE] bg-[#FAF6EB]/95 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-[#0F172A] shadow-xs hover:border-[#C59B27] hover:bg-white hover:shadow-md transition-all group cursor-pointer"
        aria-label="Back to landing page"
      >
        <ArrowLeft size={15} className="text-[#C59B27] transition-transform group-hover:-translate-x-1" />
        <span>BACK</span>
      </Link>

      {/* ── Centered Auth Card Matching Reference Image (150% Scale Presence) ── */}
      <div className="relative w-full max-w-[1080px] lg:max-w-[1180px] xl:max-w-[1280px] 2xl:max-w-[1360px] h-full max-h-[660px] sm:max-h-[700px] lg:max-h-[740px] xl:max-h-[780px] bg-[#FAF6EB] rounded-[28px] sm:rounded-[36px] border border-[#E7DFCE] shadow-[0_24px_70px_-15px_rgba(22,33,62,0.11)] flex flex-col md:flex-row overflow-hidden shrink-0">
        {/* ── Left Story Column (Warm Corn Silk with Clouds) ── */}
        <aside className="relative w-full md:w-[38%] lg:w-[37%] bg-[#FAF6EB] p-6 sm:p-8 lg:p-10 xl:p-12 flex flex-col justify-between overflow-hidden h-full shrink-0 z-0">
          {/* Top Brand Mark */}
          <div className="relative z-10 shrink-0">
            <AuthBrand />
          </div>

          {/* Center Story Headline & Description */}
          <div className="relative z-10 my-auto py-2 sm:py-3">
            <h2 className="font-brand text-3xl sm:text-[36px] lg:text-[40px] xl:text-[44px] text-[#0F172A] leading-[1.12] tracking-tight">
              Your
              <br />
              clouds.
              <br />
              One
              <br />
              workspace.
            </h2>
            <p className="mt-3.5 sm:mt-4 text-[13px] sm:text-sm lg:text-[15px] xl:text-base text-[#1E293B] font-semibold leading-relaxed max-w-[290px]">
              Bring your own cloud storage.
              <br />
              Connect, organize, and route your files from one place.
            </p>
          </div>

          {/* Atmospheric Ethereal Clouds in Lower Section with soft feather */}
          <div className="absolute -left-6 bottom-0 w-[125%] h-[50%] pointer-events-none overflow-hidden select-none z-0">
            <img
              src={cloudImage}
              alt=""
              className="w-full h-full object-cover object-bottom mix-blend-multiply opacity-85 [mask-image:linear-gradient(to_bottom,transparent_0%,black_35%,black_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_35%,black_100%)]"
            />
          </div>

          {/* Bottom Kicker in Rich Dark Gold */}
          <div className="relative z-10 pt-1 shrink-0">
            <span className="font-mono text-[10px] sm:text-[11px] font-extrabold tracking-[0.24em] text-[#8C6D1F] uppercase">
              YOUR STORAGE. YOUR CONTROL.
            </span>
          </div>
        </aside>

        {/* ── Right Form Column (Pure White flush with left story panel) ── */}
        <main
          id="main-content"
          className="relative flex-1 bg-white border-t md:border-t-0 md:border-l border-[#E7DFCE] shadow-[-14px_0_40px_rgba(22,33,62,0.04)] p-6 sm:p-8 lg:p-10 xl:p-12 flex flex-col justify-between h-full z-10 overflow-hidden"
        >
          {/* Top Bar with Kicker */}
          <div className="flex justify-end items-center shrink-0">
            <span className="text-[10px] sm:text-[11px] font-extrabold tracking-[0.24em] text-[#334155] uppercase">
              BRING YOUR OWN CLOUD
            </span>
          </div>

          {/* Form Container with Smooth Latency Entrance Transition */}
          <motion.div
            key={title}
            initial={{ opacity: 0, x: 16, filter: "blur(3px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[440px] sm:max-w-[480px] lg:max-w-[520px] xl:max-w-[540px] mx-auto my-auto py-1 flex flex-col justify-center"
          >
            {/* Heading in Crisp Dark Navy */}
            <div className="mb-4 sm:mb-5 lg:mb-6">
              <h1 className="font-display text-2xl sm:text-[32px] lg:text-[35px] xl:text-[38px] font-extrabold tracking-tight text-[#0F172A]">
                {title}
              </h1>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm lg:text-[15px] xl:text-base font-medium text-[#334155]">
                {description}
              </p>
            </div>

            {/* Form Content */}
            <div className="w-full">{children}</div>

            {/* Form Footer (New account link) */}
            {footer && <div className="mt-4 sm:mt-5 text-center text-xs sm:text-sm lg:text-[15px] font-medium text-[#334155]">{footer}</div>}
          </motion.div>

          {/* Bottom Legal Links inside the white card */}
          <div className="flex items-center justify-center gap-3.5 text-xs sm:text-[13px] font-medium text-[#475569] pt-2 shrink-0">
            <Link to="/legal" className="hover:text-[#0F172A] transition-colors">
              Terms of Service
            </Link>
            <span aria-hidden className="opacity-40">·</span>
            <Link to="/legal" className="hover:text-[#0F172A] transition-colors">
              Privacy Policy
            </Link>
          </div>
        </main>
      </div>

      {/* ── Outside Copyright centered below card ── */}
      <p className="mt-2.5 sm:mt-3 text-xs sm:text-[13px] text-[#475569] font-medium tracking-wide text-center shrink-0">
        © {new Date().getFullYear()} NexusCloud Orchestra
      </p>
    </div>
  )
}
