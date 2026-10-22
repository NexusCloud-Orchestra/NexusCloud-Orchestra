import type { FC } from "react"
import { cn } from "../../lib/utils"

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * NexusCloud Authentic Cloud Provider Vector Logos
 * Precision vector emblems for every supported cloud storage ecosystem:
 *  - AWS S3 (Amazon S3 with Amazon smile curve & bold S3)
 *  - Google Cloud Storage (Official 4-color Google cloud emblem)
 *  - Microsoft Azure Blob (Official folded ribbon fluent geometry)
 *  - Cloudflare R2 (Official Cloudflare cloud & flame)
 *  - Backblaze B2 (Official Backblaze crimson fire flame mark)
 *  - IBM Cloud (Official IBM 8-bar striped emblem)
 *  - Oracle Cloud (Official Oracle red stadium loop & OCI)
 *  - Custom S3 (Dedicated private cloud / on-prem storage vault)
 *  - Multi-Cloud (Constellation tri-cloud orchestrator)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const AwsLogo: FC<{ className?: string; size?: number }> = ({ className = "", size = 18 }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn("shrink-0", className)}
    style={size ? { width: size, height: size } : undefined}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="24" rx="5.5" fill="#232F3E" />
    <rect x="0.5" y="0.5" width="23" height="23" rx="5" stroke="#FF9900" strokeWidth="0.8" strokeOpacity="0.35" />
    {/* Clean, bold S3 mark */}
    <text
      x="12"
      y="11.5"
      textAnchor="middle"
      fill="#FFFFFF"
      fontSize="7.5"
      fontWeight="900"
      fontFamily="system-ui, -apple-system, ui-sans-serif, sans-serif"
      letterSpacing="-0.2px"
    >
      S3
    </text>
    {/* Amazon Signature Orange Smile Arrow */}
    <path
      d="M5.5 15.2c3.8 2 9.2 2 13 0"
      stroke="#FF9900"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M17.4 14.1l1.4 1.1-1.6.6"
      stroke="#FF9900"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const GoogleCloudLogo: FC<{ className?: string; size?: number }> = ({ className = "", size = 18 }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn("shrink-0", className)}
    style={size ? { width: size, height: size } : undefined}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="24" rx="5.5" fill="#FFFFFF" />
    <rect x="0.5" y="0.5" width="23" height="23" rx="5" stroke="#E2E8F0" strokeWidth="0.8" />
    {/* Authentic Google Cloud 4-color multi-lobe emblem */}
    {/* Top Green Arch */}
    <path
      d="M11.6 5.5c2.3 0 4.2 1.5 4.8 3.6-.8.3-1.5.8-2 1.4-.4-.5-1.1-.9-1.9-.9-1.5 0-2.8 1.1-3.1 2.6-.7-.1-1.4-.1-2.1.1.7-3.9 3.8-6.8 7.3-6.8z"
      fill="#34A853"
    />
    {/* Right Blue Lobes */}
    <path
      d="M16.5 9.1c2 0 3.7 1.6 3.7 3.6 0 2-1.6 3.6-3.7 3.6h-3.7v-2.8h3.7c.4 0 .8-.4.8-.8s-.4-.8-.8-.8h-1.6V9.4c.5-.2 1.1-.3 1.6-.3z"
      fill="#4285F4"
    />
    {/* Left Yellow Arc */}
    <path
      d="M7.4 9.4c.8 0 1.5.2 2.2.5.4-1.8 1.8-3.1 3.6-3.1.5 0 1 .1 1.4.3L13.5 9c-.5-.1-.9-.2-1.4-.2-1.4 0-2.6.9-3 2.2-.4-.1-.7-.2-1.1-.2-1.5 0-2.8 1.2-2.8 2.8 0 .5.1 1 .4 1.4L4.1 14c-.3-.5-.4-1.1-.4-1.8 0-2.4 1.7-4.4 3.7-4.8z"
      fill="#FBBC05"
    />
    {/* Bottom Red Base */}
    <path
      d="M7.5 16.3h5.3v-2.8H7.5c-1 0-1.8-.8-1.8-1.8 0-.4.1-.7.4-1l-1.5-1.2c-.6.8-.9 1.8-.9 2.8 0 2.2 1.8 4 4 4z"
      fill="#EA4335"
    />
  </svg>
)

export const AzureLogo: FC<{ className?: string; size?: number }> = ({ className = "", size = 18 }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn("shrink-0", className)}
    style={size ? { width: size, height: size } : undefined}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="24" rx="5.5" fill="#001833" />
    <rect x="0.5" y="0.5" width="23" height="23" rx="5" stroke="#0078D4" strokeWidth="0.8" strokeOpacity="0.4" />
    <defs>
      <linearGradient id="azureG1" x1="12" y1="5.5" x2="6.5" y2="18.5" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0078D4" />
        <stop offset="100%" stopColor="#004E8C" />
      </linearGradient>
      <linearGradient id="azureG2" x1="12.5" y1="12.5" x2="18.5" y2="18.5" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#50E6FF" />
        <stop offset="100%" stopColor="#0078D4" />
      </linearGradient>
    </defs>
    {/* Left folded trapezoid facet */}
    <path
      d="M6.5 17.5l5.2-12c.3-.7 1.3-.7 1.6 0l2.2 5.1-4.8 5.7c-.5.6-1.3 1.2-2.1 1.2H6.5z"
      fill="url(#azureG1)"
    />
    {/* Right folded facet */}
    <path
      d="M12.6 12.2l2.6-3.7 4.3 8.3c.4.8-.2 1.7-1.1 1.7h-7.8l2-6.3z"
      fill="url(#azureG2)"
    />
  </svg>
)

export const CloudflareR2Logo: FC<{ className?: string; size?: number }> = ({ className = "", size = 18 }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn("shrink-0", className)}
    style={size ? { width: size, height: size } : undefined}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="24" rx="5.5" fill="#1A1510" />
    <rect x="0.5" y="0.5" width="23" height="23" rx="5" stroke="#F38020" strokeWidth="0.8" strokeOpacity="0.4" />
    {/* Cloudflare Cloud Body */}
    <path
      d="M17.5 11.5c-.1-1.6-1.4-2.9-3-2.9-.7 0-1.4.3-1.8.7-.6-1.3-1.9-2.2-3.4-2.2-2.1 0-3.9 1.8-3.9 4 0 .3 0 .6.1.9-1.2.3-2.1 1.5-2.1 2.8 0 1.6 1.3 2.9 2.9 2.9h11.2c1.5 0 2.7-1.2 2.7-2.7 0-1.4-1.1-2.6-2.5-2.6h-.2z"
      fill="#F38020"
    />
    {/* Cloudflare Inner Warm Ember Flame */}
    <path
      d="M14.5 8.6c.6.7.9 1.6.7 2.6l2.4.2c.1-.4.1-.9 0-1.4-.2-.9-.7-1.6-1.4-2-.5.2-1.2.4-1.7.6z"
      fill="#FAAD3F"
    />
    <text
      x="12"
      y="19"
      textAnchor="middle"
      fill="#FFFDF8"
      fontSize="4.8"
      fontWeight="900"
      fontFamily="ui-monospace, monospace"
      letterSpacing="0.4px"
    >
      R2
    </text>
  </svg>
)

export const BackblazeLogo: FC<{ className?: string; size?: number }> = ({ className = "", size = 18 }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn("shrink-0", className)}
    style={size ? { width: size, height: size } : undefined}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="24" rx="5.5" fill="#1A0D0E" />
    <rect x="0.5" y="0.5" width="23" height="23" rx="5" stroke="#ED1C24" strokeWidth="0.8" strokeOpacity="0.4" />
    {/* Backblaze Signature Crimson Flame */}
    <path
      d="M12 4.2c.4 1.8-.3 3.3-1.2 4.4-.9 1.1-1.8 2.2-1.8 3.8 0 2.2 1.8 3.9 4 3.9s4-1.7 4-3.9c0-1.8-1-3.2-2.1-4.4-.3.9-.8 1.6-1.5 2-.1-.8.1-1.8-.4-2.6-.6-1-1-2.2-1-3.2z"
      fill="#ED1C24"
    />
    {/* Inner amber heat core */}
    <path
      d="M12 16.3c-1.3 0-2.4-1-2.4-2.3 0-.9.5-1.6 1.1-2.1.2.6.5 1.1 1 1.3 0-.5.2-1.1 0-1.6.5.6.9 1.3.9 2 0 1.5-.7 2.7-1.6 2.7z"
      fill="#FFA028"
    />
    <text
      x="12"
      y="21"
      textAnchor="middle"
      fill="#FFFDF8"
      fontSize="4.8"
      fontWeight="900"
      fontFamily="ui-monospace, monospace"
      letterSpacing="0.4px"
    >
      B2
    </text>
  </svg>
)

export const IbmCloudLogo: FC<{ className?: string; size?: number }> = ({ className = "", size = 18 }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn("shrink-0", className)}
    style={size ? { width: size, height: size } : undefined}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="24" rx="5.5" fill="#001438" />
    <rect x="0.5" y="0.5" width="23" height="23" rx="5" stroke="#0F62FE" strokeWidth="0.8" strokeOpacity="0.4" />
    {/* IBM Iconic 8-Bar Horizontal Stripes */}
    {/* Bar 1 */}
    <rect x="4.5" y="6" width="3" height="1" fill="#0F62FE" rx="0.3" />
    <rect x="9.5" y="6" width="5" height="1" fill="#0F62FE" rx="0.3" />
    <rect x="16.5" y="6" width="3" height="1" fill="#0F62FE" rx="0.3" />
    {/* Bar 2 */}
    <rect x="4.5" y="7.5" width="3" height="1" fill="#0F62FE" rx="0.3" />
    <rect x="9.5" y="7.5" width="5" height="1" fill="#0F62FE" rx="0.3" />
    <rect x="16.5" y="7.5" width="3" height="1" fill="#0F62FE" rx="0.3" />
    {/* Bar 3 */}
    <rect x="5.5" y="9" width="1.4" height="1" fill="#4589FF" rx="0.3" />
    <rect x="9.5" y="9" width="5" height="1" fill="#4589FF" rx="0.3" />
    <rect x="16.5" y="9" width="1.2" height="1" fill="#4589FF" rx="0.3" />
    <rect x="18.3" y="9" width="1.2" height="1" fill="#4589FF" rx="0.3" />
    {/* Bar 4 */}
    <rect x="5.5" y="10.5" width="1.4" height="1" fill="#4589FF" rx="0.3" />
    <rect x="9.5" y="10.5" width="4.5" height="1" fill="#4589FF" rx="0.3" />
    <rect x="16.5" y="10.5" width="1.2" height="1" fill="#4589FF" rx="0.3" />
    <rect x="18.3" y="10.5" width="1.2" height="1" fill="#4589FF" rx="0.3" />
    {/* Bar 5 */}
    <rect x="5.5" y="12" width="1.4" height="1" fill="#78A9FF" rx="0.3" />
    <rect x="9.5" y="12" width="5" height="1" fill="#78A9FF" rx="0.3" />
    <rect x="16.5" y="12" width="3" height="1" fill="#78A9FF" rx="0.3" />
    {/* Bar 6 */}
    <rect x="5.5" y="13.5" width="1.4" height="1" fill="#78A9FF" rx="0.3" />
    <rect x="9.5" y="13.5" width="5" height="1" fill="#78A9FF" rx="0.3" />
    <rect x="16.5" y="13.5" width="1.2" height="1" fill="#78A9FF" rx="0.3" />
    <rect x="18.3" y="13.5" width="1.2" height="1" fill="#78A9FF" rx="0.3" />
    {/* Bar 7 */}
    <rect x="4.5" y="15" width="3" height="1" fill="#A6C8FF" rx="0.3" />
    <rect x="9.5" y="15" width="5" height="1" fill="#A6C8FF" rx="0.3" />
    <rect x="16.5" y="15" width="1.2" height="1" fill="#A6C8FF" rx="0.3" />
    <rect x="18.3" y="15" width="1.2" height="1" fill="#A6C8FF" rx="0.3" />
    {/* Bar 8 */}
    <rect x="4.5" y="16.5" width="3" height="1" fill="#FFFFFF" rx="0.3" />
    <rect x="9.5" y="16.5" width="5" height="1" fill="#FFFFFF" rx="0.3" />
    <rect x="16.5" y="16.5" width="3" height="1" fill="#FFFFFF" rx="0.3" />
  </svg>
)

export const OracleCloudLogo: FC<{ className?: string; size?: number }> = ({ className = "", size = 18 }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn("shrink-0", className)}
    style={size ? { width: size, height: size } : undefined}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="24" rx="5.5" fill="#1C1817" />
    <rect x="0.5" y="0.5" width="23" height="23" rx="5" stroke="#C74634" strokeWidth="0.8" strokeOpacity="0.4" />
    {/* Official Oracle Red Oval Loop */}
    <rect
      x="4.5"
      y="6.5"
      width="15"
      height="11"
      rx="5.5"
      stroke="#F80000"
      strokeWidth="2.4"
      fill="none"
    />
    <text
      x="12"
      y="13.2"
      textAnchor="middle"
      fill="#FFFDF8"
      fontSize="5.2"
      fontWeight="900"
      fontFamily="ui-monospace, monospace"
      letterSpacing="0.5px"
    >
      OCI
    </text>
  </svg>
)

export const CustomS3Logo: FC<{ className?: string; size?: number }> = ({ className = "", size = 18 }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn("shrink-0", className)}
    style={size ? { width: size, height: size } : undefined}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="customS3Bg" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1B365D" />
        <stop offset="100%" stopColor="#0E1D33" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="5.5" fill="url(#customS3Bg)" />
    <rect x="0.5" y="0.5" width="23" height="23" rx="5" stroke="#C49A3A" strokeWidth="0.8" strokeOpacity="0.4" />
    {/* Precision 3-tier storage cylinder vault */}
    <ellipse cx="12" cy="7.2" rx="6" ry="2.2" fill="#244573" stroke="#F5D78E" strokeWidth="1" />
    <ellipse cx="12" cy="7.2" rx="3.2" ry="1.1" fill="#C49A3A" opacity="0.85" />
    <path d="M6 7.2v3.6c0 1.2 2.7 2.2 6 2.2s6-1 6-2.2V7.2" stroke="#F5D78E" strokeWidth="1" />
    <circle cx="8.5" cy="10.8" r="0.75" fill="#38BDF8" />
    <line x1="11" y1="10.8" x2="15.5" y2="10.8" stroke="#F5D78E" strokeWidth="0.8" strokeLinecap="round" opacity="0.8" />
    <path d="M6 10.8v3.6c0 1.2 2.7 2.2 6 2.2s6-1 6-2.2v-3.6" stroke="#F5D78E" strokeWidth="1" />
    <circle cx="8.5" cy="14.4" r="0.75" fill="#10B981" />
    <line x1="11" y1="14.4" x2="15.5" y2="14.4" stroke="#F5D78E" strokeWidth="0.8" strokeLinecap="round" opacity="0.8" />
    <path d="M9 17.5L12 19.2l3-1.7" stroke="#C49A3A" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const MultiCloudLogo: FC<{ className?: string; size?: number }> = ({ className = "", size = 18 }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn("shrink-0", className)}
    style={size ? { width: size, height: size } : undefined}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="24" rx="5.5" fill="#160D26" />
    <rect x="0.5" y="0.5" width="23" height="23" rx="5" stroke="#7C3AED" strokeWidth="0.8" strokeOpacity="0.4" />
    {/* Mesh network connecting 3 cloud nodes */}
    <line x1="12" y1="7" x2="7" y2="16" stroke="#A78BFA" strokeWidth="1" strokeDasharray="1.5 1.5" />
    <line x1="12" y1="7" x2="17" y2="16" stroke="#A78BFA" strokeWidth="1" strokeDasharray="1.5 1.5" />
    <line x1="7" y1="16" x2="17" y2="16" stroke="#A78BFA" strokeWidth="1" strokeDasharray="1.5 1.5" />
    {/* Node 1 (top - Gold) */}
    <circle cx="12" cy="7" r="2.4" fill="#C49A3A" />
    <circle cx="12" cy="7" r="1" fill="#FFFDF8" />
    {/* Node 2 (bottom-left - Cyan) */}
    <circle cx="7" cy="16" r="2.4" fill="#0284C7" />
    <circle cx="7" cy="16" r="1" fill="#FFFDF8" />
    {/* Node 3 (bottom-right - Purple) */}
    <circle cx="17" cy="16" r="2.4" fill="#7C3AED" />
    <circle cx="17" cy="16" r="1" fill="#FFFDF8" />
  </svg>
)

/**
 * Universal ProviderIcon Resolver:
 * Ensures every provider in the NexusCloud ecosystem displays its distinct, authentic brand logo.
 */
export function ProviderIcon({
  provider,
  size = 18,
  className = "",
}: {
  provider: string
  size?: number
  className?: string
}) {
  const p = provider.toLowerCase().trim()

  if (p === "aws" || p.includes("aws") || (p.includes("s3") && !p.includes("custom") && !p.includes("minio"))) {
    return <AwsLogo size={size} className={className} />
  }
  if (p === "gcp" || p.includes("google") || p.includes("gcp") || p.includes("gcs")) {
    return <GoogleCloudLogo size={size} className={className} />
  }
  if (p === "azure" || p.includes("azure") || p.includes("blob")) {
    return <AzureLogo size={size} className={className} />
  }
  if (p === "r2" || p.includes("cloudflare") || p.includes("r2")) {
    return <CloudflareR2Logo size={size} className={className} />
  }
  if (p === "b2" || p.includes("backblaze") || p.includes("b2")) {
    return <BackblazeLogo size={size} className={className} />
  }
  if (p === "ibm" || p.includes("ibm") || p.includes("cos")) {
    return <IbmCloudLogo size={size} className={className} />
  }
  if (p === "oracle" || p.includes("oracle") || p.includes("oci")) {
    return <OracleCloudLogo size={size} className={className} />
  }
  if (p === "multi" || p.includes("multi")) {
    return <MultiCloudLogo size={size} className={className} />
  }
  return <CustomS3Logo size={size} className={className} />
}

export function ProviderBadge({
  provider,
  className = "",
}: {
  provider: string
  className?: string
}) {
  const p = provider.toLowerCase().trim()
  let name = provider

  if (p === "aws" || p.includes("aws") || p.includes("s3")) {
    name = "AWS S3"
  } else if (p === "gcp" || p.includes("google") || p.includes("gcp") || p.includes("gcs")) {
    name = "Google Cloud"
  } else if (p === "azure" || p.includes("azure") || p.includes("blob")) {
    name = "Azure Blob"
  } else if (p === "oracle" || p.includes("oracle") || p.includes("oci")) {
    name = "Oracle OCI"
  } else if (p === "r2" || p.includes("cloudflare") || p.includes("r2")) {
    name = "Cloudflare R2"
  } else if (p === "b2" || p.includes("backblaze") || p.includes("b2")) {
    name = "Backblaze B2"
  } else if (p === "ibm" || p.includes("ibm") || p.includes("cos")) {
    name = "IBM Cloud"
  } else if (p === "multi" || p.includes("multi")) {
    name = "Multi-Cloud"
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 shadow-2xs transition-all",
        // Light Theme: Clean Ivory / White Card
        "border-[#E8E0D1] bg-white text-[#142B4A]",
        // Dark Theme: Luxury Dark Gradient Pill
        "dark:border-[#3A2E1E] dark:bg-gradient-to-b dark:from-[#211C14] dark:to-[#15120C] dark:text-[#F5F0E6] dark:shadow-[0_2px_8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]",
        className
      )}
    >
      <ProviderIcon provider={provider} size={15} />
      <span className="font-palatino text-xs sm:text-sm font-bold text-[#142B4A] dark:text-[#F5F0E6] whitespace-nowrap tracking-wide">
        {name}
      </span>
    </div>
  )
}
