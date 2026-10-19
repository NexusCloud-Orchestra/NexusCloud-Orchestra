import { useEffect, useRef, useState, useId } from "react"
import type { ComponentPropsWithoutRef, ReactNode } from "react"
import { motion, useSpring, useTransform } from "framer-motion"
import { useTheme } from "../../state/theme"
import { cn } from "../../lib/utils"

/**
 * ── 1. SpotlightCard (Aceternity UI inspired) ──
 * Tracks mouse position and creates an ethereal radial spotlight glow
 * that follows the user's cursor across the surface.
 */
interface SpotlightCardProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode
  spotlightColor?: string
  className?: string
}

export function SpotlightCard({
  children,
  className = "",
  spotlightColor,
  ...props
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)
  const { isDark } = useTheme()

  const defaultSpotlight = isDark
    ? "rgba(198, 160, 82, 0.10)"
    : "rgba(196, 154, 58, 0.08)"
  const activeSpotlight = spotlightColor ?? defaultSpotlight

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return
    const div = divRef.current
    const rect = div.getBoundingClientRect()
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const handleMouseEnter = () => setOpacity(1)
  const handleMouseLeave = () => setOpacity(0)

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      {/* Dynamic Cursor Spotlight Layer */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 z-0"
        style={{
          opacity,
          background: `radial-gradient(320px circle at ${position.x}px ${position.y}px, ${activeSpotlight}, transparent 80%)`,
        }}
      />
      <div className="relative z-1">{children}</div>
    </div>
  )
}

/**
 * ── 2. BorderBeam (Magic UI / 21st.dev inspired) ──
 * An animated beam of light that traces along the perimeter of a card or button.
 */
interface BorderBeamProps {
  className?: string
  size?: number
  duration?: number
  borderWidth?: number
  anchor?: number
  colorFrom?: string
  colorTo?: string
  delay?: number
}

export function BorderBeam({
  className,
  size = 140,
  duration = 10,
  anchor = 90,
  borderWidth = 1.5,
  colorFrom = "#C49A3A",
  colorTo = "transparent",
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      style={
        {
          "--size": size,
          "--duration": duration,
          "--anchor": anchor,
          "--border-width": borderWidth,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--delay": `-${delay}s`,
        } as React.CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]",
        "![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]",
        "after:absolute after:aspect-square after:w-[calc(var(--size)*1px)] after:animate-border-beam after:[animation-delay:var(--delay)]",
        "after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)] after:[offset-anchor:calc(var(--anchor)*1%)_50%]",
        "after:[offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))]",
        className
      )}
    />
  )
}

/**
 * ── 3. NumberTicker / CountUp (ReactBits inspired) ──
 * Smooth numerical spring counter for analytics values and metrics.
 */
interface NumberTickerProps {
  value: number
  direction?: "up" | "down"
  className?: string
  decimals?: number
  prefix?: string
  suffix?: string
}

export function NumberTicker({
  value,
  direction = "up",
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useSpring(direction === "down" ? value : 0, {
    damping: 30,
    stiffness: 100,
  })
  const isInView = true // Dashboard is active view

  useEffect(() => {
    if (isInView) {
      motionValue.set(direction === "down" ? 0 : value)
    }
  }, [motionValue, isInView, direction, value])

  const display = useTransform(motionValue, (current) => {
    return `${prefix}${current.toFixed(decimals)}${suffix}`
  })

  return <motion.span ref={ref} className={cn("inline-block tabular-nums", className)}>{display}</motion.span>
}

/**
 * ── 4. ShinyText (Aceternity / UIVerse inspired) ──
 * Text with a subtle moving light shimmer sweep.
 */
export function ShinyText({
  children,
  className = "",
  shimmerWidth = 100,
}: {
  children: ReactNode
  className?: string
  shimmerWidth?: number
}) {
  const { isDark } = useTheme()

  const gradient = isDark
    ? "linear-gradient(120deg, #F5F0E6 0%, #F5F0E6 35%, #E0C078 50%, #F5F0E6 65%, #F5F0E6 100%)"
    : "linear-gradient(120deg, rgba(20,43,74,1) 0%, rgba(20,43,74,1) 35%, rgba(196,154,58,0.9) 50%, rgba(20,43,74,1) 65%, rgba(20,43,74,1) 100%)"

  return (
    <span
      style={{
        backgroundImage: gradient,
        backgroundSize: `${shimmerWidth * 2}% 100%`,
      }}
      className={cn(
        "bg-clip-text text-transparent animate-shimmer inline-block",
        className
      )}
    >
      {children}
    </span>
  )
}

/**
 * ── 5. PulsingStatusDot (UIVerse inspired) ──
 * Concentric ripple ping for live active services and zero-trust mesh.
 */
export function PulsingStatusDot({
  color = "emerald",
  size = "md",
  className = "",
}: {
  color?: "emerald" | "gold" | "sky"
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const colorMap = {
    emerald: {
      ping: "bg-emerald-400",
      dot: "bg-[#168568]",
    },
    gold: {
      ping: "bg-[#C49A3A]",
      dot: "bg-[#A77B26]",
    },
    sky: {
      ping: "bg-sky-400",
      dot: "bg-sky-600",
    },
  }

  const sizeMap = {
    sm: { wrapper: "h-1.5 w-1.5", inner: "h-1 w-1" },
    md: { wrapper: "h-2 w-2", inner: "h-1.5 w-1.5" },
    lg: { wrapper: "h-2.5 w-2.5", inner: "h-2 w-2" },
  }

  const { ping, dot } = colorMap[color]
  const { wrapper, inner } = sizeMap[size]

  return (
    <span className={cn("relative flex items-center justify-center shrink-0", wrapper, className)}>
      <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", ping)} />
      <span className={cn("relative inline-flex rounded-full", inner, dot)} />
    </span>
  )
}

/**
 * ── 6. GridBeams (Aceternity UI inspired) ──
 * Subtle geometric grid pattern with celestial beam pulses for dashboard hero backgrounds.
 */
export function GridBeams({
  className = "",
  variant = "auto",
}: {
  className?: string
  variant?: "light" | "dark" | "auto"
}) {
  const patternId = useId()
  const fadeId = useId()
  const { isDark: themeIsDark } = useTheme()
  const isDark = variant === "dark" || (variant === "auto" && themeIsDark)

  const strokeColor = isDark ? "#5C4727" : "#E8E0D1"
  const stopColor = isDark ? "#0B0A08" : "#FAF6ED"
  const strokeOpacity = isDark ? 0.35 : 0.4
  const containerOpacity = isDark ? "opacity-35" : "opacity-40"

  return (
    <div className={cn("absolute inset-0 pointer-events-none overflow-hidden select-none", containerOpacity, className)}>
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={patternId} width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke={strokeColor} strokeWidth="0.8" opacity={strokeOpacity} />
          </pattern>
          <linearGradient id={fadeId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={stopColor} stopOpacity="0" />
            <stop offset="50%" stopColor={stopColor} stopOpacity={isDark ? "0.6" : "0.8"} />
            <stop offset="100%" stopColor={stopColor} stopOpacity="1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        <rect width="100%" height="100%" fill={`url(#${fadeId})`} />
      </svg>
    </div>
  )
}
