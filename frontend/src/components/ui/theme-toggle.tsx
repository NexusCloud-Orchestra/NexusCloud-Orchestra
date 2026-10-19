import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "../../state/theme"
import { cn } from "../../lib/utils"

/**
 * ── Shiny Cloud Icon ──
 * Day / Light Mode: A pure sculpted cloud with radiant rotating golden sunbeams and sparkles.
 */
export function ShinyCloudIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("shrink-0", className)}>
      {/* Rotating Solar Rays behind Cloud */}
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "15px 9px" }}
      >
        <line x1="15" y1="2" x2="15" y2="4.5" stroke="#C6A052" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="15" y1="13.5" x2="15" y2="16" stroke="#C6A052" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="8" y1="9" x2="10.5" y2="9" stroke="#C6A052" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="19.5" y1="9" x2="22" y2="9" stroke="#C6A052" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="10" y1="4" x2="11.8" y2="5.8" stroke="#E0C078" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="18.2" y1="12.2" x2="20" y2="14" stroke="#E0C078" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="10" y1="14" x2="11.8" y2="12.2" stroke="#E0C078" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="18.2" y1="5.8" x2="20" y2="4" stroke="#E0C078" strokeWidth="1.6" strokeLinecap="round" />
      </motion.g>

      {/* Radiant Golden Sun Orb */}
      <circle cx="15" cy="9" r="4.2" fill="#E0C078" />

      {/* Sculpted Foreground Cloud */}
      <path
        d="M17.5 18a4.5 4.5 0 0 0 .5-8.97A6 6 0 0 0 6.5 11 4 4 0 0 0 7 18h10.5z"
        fill="#FFFFFF"
        stroke="#C6A052"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />

      {/* Luminous Core Glow Spark */}
      <circle cx="12" cy="14" r="1.2" fill="#C6A052" opacity="0.8" />
    </svg>
  )
}

/**
 * ── Moon Cloud Icon ──
 * Night / Dark Mode: A crescent moon peeking behind a dark cloud with twinkling gold stars.
 */
export function MoonCloudIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("shrink-0", className)}>
      {/* Twinkling Star 1 */}
      <motion.circle
        cx="4.5"
        cy="5"
        r="0.9"
        fill="#E0C078"
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0 }}
        style={{ transformOrigin: "4.5px 5px" }}
      />
      {/* Twinkling Star 2 */}
      <motion.circle
        cx="19.5"
        cy="4"
        r="0.75"
        fill="#C6A052"
        animate={{ opacity: [0.2, 1, 0.2], scale: [0.7, 1.3, 0.7] }}
        transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
        style={{ transformOrigin: "19.5px 4px" }}
      />
      {/* Twinkling Star 3 */}
      <motion.circle
        cx="7"
        cy="9.5"
        r="0.6"
        fill="#F5F0E6"
        animate={{ opacity: [0.1, 0.9, 0.1], scale: [0.6, 1.4, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 1.1 }}
        style={{ transformOrigin: "7px 9.5px" }}
      />

      {/* Crescent Moon — clipped by an offset circle to create the crescent shape */}
      <circle cx="15.5" cy="8.5" r="5" fill="#C6A052" opacity="0.18" />
      <path
        d="M15 4a5 5 0 0 0 0 9 5.5 5.5 0 0 1 0-9z"
        fill="#E0C078"
      />
      <path
        d="M14.6 4.2a5 5 0 1 0 4.7 7.5A5 5 0 0 1 14.6 4.2z"
        fill="#C6A052"
      />

      {/* Dark Cloud Body with Champagne Gold rim — overlaps moon base */}
      <path
        d="M16 18a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 5.5 11.5 3.5 3.5 0 0 0 6 18H16z"
        fill="#181610"
        stroke="#C6A052"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface ThemeToggleProps {
  className?: string
  variant?: "icon" | "pill"
  showLabel?: boolean
}

/**
 * Interactive Navbar Theme Toggle featuring Shiny Cloud (Light) and Rainy Cloud (Dark)
 */
export function ThemeToggle({
  className = "",
  variant = "icon",
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, isDark, toggleTheme } = useTheme()

  const title = isDark
    ? "Moon Cloud (Dark Mode) — Click for Sunny Cloud (Light Mode)"
    : "Sunny Cloud (Light Mode) — Click for Moon Cloud (Dark Mode)"

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.08, y: -1.5 }}
      whileTap={{ scale: 0.92, y: 0.5 }}
      transition={{ type: "spring", stiffness: 450, damping: 20 }}
      onClick={toggleTheme}
      title={title}
      aria-label={title}
      className={cn(
        "relative inline-flex items-center justify-center transition-all duration-200 cursor-pointer select-none",
        variant === "icon"
          ? "h-9 w-9 rounded-full border border-[#E8E0D1] dark:border-[#332A1B] bg-white dark:bg-[#181610] text-[#142B4A] dark:text-[#F5F0E6] shadow-xs hover:shadow-md hover:border-[#C6A052] dark:hover:border-[#C6A052]"
          : "h-9 gap-2 rounded-full border border-[#E8E0D1] dark:border-[#332A1B] bg-[#FAF6ED]/70 dark:bg-[#181610] px-3.5 text-xs font-semibold text-[#142B4A] dark:text-[#F5F0E6] shadow-xs hover:border-[#C6A052] dark:hover:border-[#C6A052]",
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="dark-moon"
            initial={{ opacity: 0, rotate: -35, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 35, scale: 0.7 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            <MoonCloudIcon className="w-5 h-5 text-[#C6A052]" />
          </motion.div>
        ) : (
          <motion.div
            key="light-shiny"
            initial={{ opacity: 0, rotate: 35, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -35, scale: 0.7 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            <ShinyCloudIcon className="w-5 h-5 text-[#C6A052]" />
          </motion.div>
        )}
      </AnimatePresence>

      {showLabel && (
        <span className="font-mono text-xs font-semibold tracking-wider capitalize">
          {theme === "dark" ? "Dark (Moon Cloud)" : "Light (Sunny Cloud)"}
        </span>
      )}
    </motion.button>
  )
}
