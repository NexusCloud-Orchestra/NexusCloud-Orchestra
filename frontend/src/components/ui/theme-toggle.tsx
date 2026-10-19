import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "../../state/theme"
import { cn } from "../../lib/utils"

/**
 * ── Shiny Cloud Icon ──
 * Day / Light Mode: A pure sculpted cloud with radiant rotating golden sunbeams.
 */
export function ShinyCloudIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("shrink-0", className)}>
      <defs>
        <linearGradient id="nc-sun-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF6D9" />
          <stop offset="100%" stopColor="#E5C37A" />
        </linearGradient>
      </defs>

      {/* Rotating Solar Sunbeams */}
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "16px 7px" }}
        stroke="#C6A052"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <line x1="16" y1="1.8" x2="16" y2="3.8" />
        <line x1="21.2" y1="7" x2="23.2" y2="7" />
        <line x1="19.7" y1="3.3" x2="21.2" y2="1.8" />
        <line x1="19.7" y1="10.7" x2="21.2" y2="12.2" />
        <line x1="16" y1="10.2" x2="16" y2="12.2" />
        <line x1="10.8" y1="7" x2="12.8" y2="7" />
        <line x1="12.3" y1="3.3" x2="10.8" y2="1.8" />
        <line x1="12.3" y1="10.7" x2="10.8" y2="12.2" />
      </motion.g>

      {/* Radiant Golden Sun Orb */}
      <circle cx="16" cy="7" r="3.8" fill="url(#nc-sun-grad)" stroke="#C6A052" strokeWidth="1.2" />

      {/* Sculpted Ivory White Foreground Cloud */}
      <path
        d="M13 16a3 3 0 1 1 0 6H7a5 5 0 1 1 4.9-6Z"
        fill="#FFFFFF"
        stroke="#C6A052"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * ── Moon Cloud Icon ──
 * Night / Dark Mode: A luminous crescent moon rising behind a dark cloud with twinkling celestial stars.
 */
export function MoonCloudIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("shrink-0", className)}>
      <defs>
        <linearGradient id="nc-moon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF6D9" />
          <stop offset="50%" stopColor="#E5C37A" />
          <stop offset="100%" stopColor="#BF9744" />
        </linearGradient>
        <linearGradient id="nc-moon-cloud-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#241F16" />
          <stop offset="100%" stopColor="#18150F" />
        </linearGradient>
      </defs>

      {/* Twinkling 4-point Celestial Star in upper left sky */}
      <motion.path
        d="M 3.8 2.2 Q 3.8 4 2 4 Q 3.8 4 3.8 5.8 Q 3.8 4 5.6 4 Q 3.8 4 3.8 2.2 Z"
        fill="#E5C37A"
        animate={{ scale: [0.8, 1.25, 0.8], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "3.8px 4px" }}
      />

      {/* Distant Micro Star */}
      <motion.circle
        cx="7"
        cy="2.8"
        r="0.55"
        fill="#FFFFFF"
        animate={{ opacity: [0.2, 0.9, 0.2] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        style={{ transformOrigin: "7px 2.8px" }}
      />

      {/* Classic Luminous Crescent Moon — rising behind cloud */}
      <motion.g
        transform="translate(3.8, 0.3) scale(0.72)"
        animate={{ rotate: [0, -2, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "16px 8px" }}
      >
        <path
          d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"
          fill="url(#nc-moon-grad)"
          stroke="#E5C37A"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
      </motion.g>

      {/* Foreground Cloud with Obsidian / Warm Charcoal fill and Champagne Gold contour */}
      <path
        d="M13 16a3 3 0 1 1 0 6H7a5 5 0 1 1 4.9-6Z"
        fill="url(#nc-moon-cloud-grad)"
        stroke="#C6A052"
        strokeWidth="1.5"
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
