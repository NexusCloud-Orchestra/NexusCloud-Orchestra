import { useState, useId } from "react"
import { motion } from "framer-motion"

/**
 * Centered High-Fidelity Vector Cloud Provider Logos matching reference image
 */
export function GoogleCloudIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"
        fill="#4285F4"
      />
      <path
        d="M12 4c2.8 0 5.24 1.54 6.52 3.83L17.1 9.2A5.32 5.32 0 0 0 12 6.2c-2.9 0-5.3 2.1-5.7 4.9L4.2 10.6C4.8 6.9 8.1 4 12 4z"
        fill="#EA4335"
      />
      <path
        d="M19.35 10.04c-.3 0-.6.04-.9.1l-.8 1.9c.5-.1 1.1-.1 1.7-.1 2 0 3.6 1.6 3.6 3.6 0 .5-.1 1-.3 1.5l1.9.7c.3-.7.4-1.4.4-2.2 0-2.7-2.1-4.9-4.7-5z"
        fill="#FBBC05"
      />
      <path
        d="M6 20h13c.7 0 1.4-.2 2-.5l-1-1.8c-.3.2-.6.3-1 .3H6c-2.2 0-4-1.8-4-4 0-1.8 1.2-3.4 3-3.8l-.4-2C2.1 9.7 0 12.1 0 15c0 2.8 2.7 5 6 5z"
        fill="#34A853"
      />
    </svg>
  )
}

export function AzureIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <path d="M20.2 10.5L9.5 39.8h15.2l-4.5-29.3z" fill="#0078D4" />
      <path d="M20.2 10.5l14.8 26.2-10.3 3.1-4.5-29.3z" fill="#50E6FF" />
      <path d="M24.7 39.8l10.3-3.1 19.5 16.8H38.2L24.7 39.8z" fill="#0078D4" />
      <path d="M20.2 10.5h16.5l17.8 43H38.2L20.2 10.5z" fill="#0089D6" />
    </svg>
  )
}

export function AwsIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 64" className={className} fill="none">
      <path
        d="M26.2 32.8c-2.4 0-4.3-.6-5.6-1.8-1.3-1.2-2-2.9-2-5.1 0-2.3.7-4 2.2-5.2 1.5-1.2 3.6-1.8 6.3-1.8 2.3 0 4.2.4 5.6 1.1v-1.6c0-1.6-.4-2.8-1.3-3.6-.9-.8-2.2-1.2-3.9-1.2-1.5 0-2.9.3-4.1.9-1.2.6-2.1 1.4-2.8 2.4l-4.5-3.3c1.2-1.6 2.7-2.8 4.7-3.7 2-1 4.3-1.4 7-1.4 3.7 0 6.5.9 8.3 2.7 1.8 1.8 2.7 4.5 2.7 8.1v15.2h-6.2v-3.4c-1.3 1.3-2.7 2.3-4.3 2.9-1.4.7-3.2 1-5.1 1zm1.2-5.4c1.6 0 3-.4 4.1-1.2 1.1-.8 1.8-2 2-3.4-.9-.5-2.2-.8-3.7-.8-1.5 0-2.6.3-3.3.9-.7.6-1.1 1.4-1.1 2.4 0 .8.3 1.4.8 1.7.5.3 1.1.4 1.9.4z"
        fill="#232F3E"
      />
      <path
        d="M54.1 32.4h-6.1l-6-23.1h6.5l3.2 14.6 3.5-14.6h5.8l3.4 14.6 3.3-14.6h6.4l-6.1 23.1h-6.1l-3.8-14.4-3.7 14.4z"
        fill="#232F3E"
      />
      <path
        d="M80.2 32.8c-2.8 0-5.1-.5-6.9-1.5-1.8-1-3-2.5-3.7-4.4l5.5-2.5c.5 1.3 1.3 2.3 2.4 2.9 1.1.6 2.4.9 3.9.9 1.4 0 2.5-.3 3.3-.8.8-.5 1.2-1.2 1.2-2 0-.8-.3-1.4-.9-1.8-.6-.4-1.7-.8-3.3-1.2l-3.2-.8c-2.4-.6-4.2-1.5-5.3-2.7-1.1-1.2-1.6-2.8-1.6-4.7 0-2.2.8-3.9 2.4-5.3 1.6-1.3 3.8-2 6.5-2 2.3 0 4.3.4 6 1.3 1.6.9 2.8 2.2 3.5 3.9l-5.3 2.5c-.4-1-1-1.7-1.9-2.2-.9-.5-2-.7-3.2-.7-1.2 0-2.1.2-2.8.7-.7.5-1.1 1.1-1.1 1.8 0 .6.3 1.1.8 1.5.5.4 1.4.7 2.6 1l3.5.9c2.7.7 4.7 1.7 5.8 3 1.1 1.3 1.7 3 1.7 5 0 2.3-.8 4.2-2.5 5.6-1.7 1.5-4 2.2-7 2.2z"
        fill="#232F3E"
      />
      <path
        d="M89.8 45.4c-8.9 6.2-22.1 9.5-36.9 9.5-18.7 0-35.3-5.2-46.7-13.9-.9-.7-.1-1.7.9-1.1 11.1 7.2 26.6 11.6 44.5 11.6 13.5 0 25.8-2.8 35.8-8.1 1.6-.9 3.2.7 1.5 2z"
        fill="#FF9900"
      />
      <path
        d="M87.8 42.4l4.9-1.3-1.6 4.9c-.3.8.3 1.3 1 .8l4.4-3.5c.7-.6.6-1.4-.2-1.8l-5.2-2.5c-.8-.4-1.3.1-1 1z"
        fill="#FF9900"
      />
    </svg>
  )
}

export function OracleIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <path
        d="M32 18c-12.1 0-22 6.3-22 14s9.9 14 22 14 22-6.3 22-14-9.9-14-22-14zm0 21.8c-8.3 0-15-3.5-15-7.8s6.7-7.8 15-7.8 15 3.5 15 7.8-6.7 7.8-15 7.8z"
        fill="#C74634"
      />
    </svg>
  )
}

export function IbmCloudIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <path d="M32 10l16 9.2-16 9.2-16-9.2L32 10z" fill="#FF5252" />
      <path d="M16 19.2l16 9.2v18.5l-16-9.2V19.2z" fill="#D32F2F" />
      <path d="M48 19.2v18.5l-16 9.2V28.4l16-9.2z" fill="#B71C1C" />
      <path d="M26 31l6-3.5 6 3.5v7l-6 3.5-6-3.5v-7z" fill="#FFFFFF" opacity="0.95" />
      <path d="M32 37l-4-2.3v-4.6l4 2.3 4-2.3v4.6L32 37z" fill="#D32F2F" />
    </svg>
  )
}

interface ProviderOrbiter {
  id: string
  name: string
  component: React.ComponentType<{ className?: string }>
  initialAngle: number // radians
}

const PROVIDERS: ProviderOrbiter[] = [
  { id: "gcp", name: "Google Cloud", component: GoogleCloudIcon, initialAngle: -Math.PI / 2 },
  { id: "azure", name: "Microsoft Azure", component: AzureIcon, initialAngle: -Math.PI / 2 + (2 * Math.PI) / 5 },
  { id: "ibm", name: "IBM Cloud", component: IbmCloudIcon, initialAngle: -Math.PI / 2 + (4 * Math.PI) / 5 },
  { id: "oracle", name: "Oracle Cloud", component: OracleIcon, initialAngle: -Math.PI / 2 + (6 * Math.PI) / 5 },
  { id: "aws", name: "AWS S3", component: AwsIcon, initialAngle: -Math.PI / 2 + (8 * Math.PI) / 5 },
]

export function OrbitingCloudHero() {
  const [isHovered, setIsHovered] = useState(false)
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const gradId = useId()

  // Compact orbital dimensions matching fitted page layout
  const RX = 124 // Horizontal radius
  const RY = 66  // Vertical radius
  const DURATION = 22 // Seconds per full revolution

  return (
    <div
      className="relative flex items-center justify-center w-full max-w-[360px] h-[240px] sm:h-[255px] mx-auto select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setActiveTooltip(null)
      }}
    >
      {/* ── Background Warm Aura & Glowing Radial Light ── */}
      <div
        className="absolute inset-0 pointer-events-none rounded-full blur-2xl opacity-60 transition-opacity duration-700"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(245, 197, 66, 0.35) 0%, rgba(217, 148, 34, 0.15) 45%, transparent 70%)",
        }}
      />

      {/* ── Golden Elliptical Orbital Rings with 3D beads matching reference ── */}
      <svg
        viewBox="-170 -100 340 200"
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
      >
        <defs>
          <linearGradient id={`${gradId}-ring`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5CA58" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#DE9F26" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#C48412" stopOpacity="0.65" />
          </linearGradient>
          <radialGradient id={`${gradId}-bead`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFF9E6" />
            <stop offset="40%" stopColor="#F5CA58" />
            <stop offset="100%" stopColor="#A7740C" />
          </radialGradient>
        </defs>

        {/* Primary Orbital Ellipse matching rotation path */}
        <ellipse
          cx="0"
          cy="0"
          rx={RX}
          ry={RY}
          fill="none"
          stroke={`url(#${gradId}-ring)`}
          strokeWidth="1.3"
          strokeDasharray="4 6"
          opacity="0.65"
        />

        {/* Secondary Tilted Outer Rings for Celestial Particle Depth */}
        <g transform="rotate(-18)">
          <ellipse
            cx="0"
            cy="0"
            rx={RX * 1.08}
            ry={RY * 1.04}
            fill="none"
            stroke="#DE9F26"
            strokeWidth="0.85"
            strokeDasharray="2 5"
            opacity="0.35"
          />
          {/* Golden Orbit Beads on track */}
          <circle cx={-RX * 0.95} cy={0} r="4" fill={`url(#${gradId}-bead)`} filter="drop-shadow(0 2px 4px rgba(217,148,34,0.4))" />
          <circle cx={RX * 0.95} cy={0} r="4" fill={`url(#${gradId}-bead)`} filter="drop-shadow(0 2px 4px rgba(217,148,34,0.4))" />
          <circle cx={0} cy={-RY * 1.04} r="3" fill={`url(#${gradId}-bead)`} />
        </g>

        <g transform="rotate(22)">
          <ellipse
            cx="0"
            cy="0"
            rx={RX * 0.88}
            ry={RY * 0.88}
            fill="none"
            stroke="#F5CA58"
            strokeWidth="0.7"
            strokeDasharray="3 7"
            opacity="0.25"
          />
          <circle cx={0} cy={-RY * 0.88} r="3" fill={`url(#${gradId}-bead)`} />
          <circle cx={0} cy={RY * 0.88} r="3" fill={`url(#${gradId}-bead)`} />
          <circle cx={RX * 0.82} cy={0} r="3" fill={`url(#${gradId}-bead)`} />
        </g>
      </svg>

      {/* ── Center Golden Cloud Card (Elevated Hero Anchor) ── */}
      <motion.div
        animate={{
          y: [0, -4, 0],
          rotateZ: [0, 0.3, 0, -0.3, 0],
        }}
        transition={{
          duration: 4.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative z-10 flex items-center justify-center cursor-pointer"
        whileHover={{ scale: 1.04 }}
      >
        {/* Layered Golden Glass Plates behind the main card */}
        <div className="absolute w-[70px] h-[88px] rounded-[18px] bg-amber-400/20 rotate-10 transform scale-95 blur-[1px] pointer-events-none" />
        <div className="absolute w-[72px] h-[90px] rounded-[18px] bg-amber-300/30 rotate-5 transform scale-98 pointer-events-none" />

        {/* The Main Golden Cloud Card */}
        <div className="relative w-[76px] h-[96px] rounded-[18px] bg-gradient-to-br from-[#F6CF63] via-[#E2A62C] to-[#B87D17] border border-white/55 shadow-[0_14px_30px_-6px_rgba(202,143,26,0.5),0_4px_12px_rgba(0,0,0,0.08)] flex items-center justify-center overflow-hidden">
          <div className="absolute -top-8 -left-8 w-20 h-20 bg-white/30 rounded-full blur-md pointer-events-none" />

          {/* 3D Glossy White Cloud Glyph */}
          <svg
            viewBox="0 0 24 24"
            className="w-11 h-11 text-white fill-white drop-shadow-[0_3px_6px_rgba(167,116,12,0.35)]"
          >
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
          </svg>
        </div>
      </motion.div>

      {/* ── Spinning Orbiting Cloud Provider Cards ── */}
      {PROVIDERS.map((provider) => {
        const IconComponent = provider.component

        const steps = 36
        const xKeyframes: number[] = []
        const yKeyframes: number[] = []
        const scaleKeyframes: number[] = []
        const zIndexKeyframes: number[] = []
        const opacityKeyframes: number[] = []

        for (let i = 0; i <= steps; i++) {
          const angle = (i / steps) * 2 * Math.PI + provider.initialAngle
          const x = Math.cos(angle) * RX
          const y = Math.sin(angle) * RY

          xKeyframes.push(x)
          yKeyframes.push(y)

          const normalizedDepth = (Math.sin(angle) + 1) / 2
          scaleKeyframes.push(0.92 + 0.14 * normalizedDepth)
          opacityKeyframes.push(0.92 + 0.08 * normalizedDepth)
          zIndexKeyframes.push(y > 0 ? 20 : 5)
        }

        return (
          <motion.div
            key={provider.id}
            className="absolute top-1/2 left-1/2 -mt-6.5 -ml-6.5 cursor-pointer select-none"
            animate={{
              x: xKeyframes,
              y: yKeyframes,
              scale: isHovered && activeTooltip === provider.id ? 1.15 : scaleKeyframes,
              zIndex: zIndexKeyframes,
              opacity: opacityKeyframes,
            }}
            transition={{
              duration: isHovered ? DURATION * 2.2 : DURATION,
              repeat: Infinity,
              ease: "linear",
            }}
            onMouseEnter={() => setActiveTooltip(provider.id)}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            {/* Glossy White Rounded Card */}
            <div className="group relative flex items-center justify-center w-13 h-13 rounded-[15px] bg-white/95 backdrop-blur-md border border-[#E8E0D1]/90 shadow-[0_8px_18px_-3px_rgba(20,43,74,0.12),0_2px_6px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-[#C49A3A] hover:shadow-[0_12px_24px_-3px_rgba(196,154,58,0.26)]">
              <div className="absolute top-0.5 left-1 w-3.5 h-3.5 bg-white rounded-full opacity-80 pointer-events-none" />

              <div className="flex items-center justify-center p-1 transition-transform duration-200 group-hover:scale-105">
                <IconComponent className="w-7.5 h-7.5 object-contain" />
              </div>

              {activeTooltip === provider.id && (
                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0B1B32] px-2 py-0.5 text-2xs font-mono font-bold text-white shadow-md pointer-events-none z-30">
                  {provider.name}
                </div>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
