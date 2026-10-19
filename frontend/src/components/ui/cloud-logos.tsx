import type { FC } from "react"
import { cn } from "../../lib/utils"

export const AwsLogo: FC<{ className?: string; size?: number }> = ({ className = "", size = 18 }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn("shrink-0", className)}
    style={size ? { width: size, height: size } : undefined}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="24" rx="5" fill="#D97706" />
    <path
      d="M5.5 15.2c3.8 2 9.2 2 13 0"
      stroke="#FFFDF8"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M17.5 14.2l1.3 1.1-1.6.7"
      stroke="#FFFDF8"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <text
      x="12"
      y="11.5"
      textAnchor="middle"
      fill="#FFFDF8"
      fontSize="7.5"
      fontWeight="800"
      fontFamily="ui-monospace, monospace"
      letterSpacing="-0.3px"
    >
      S3
    </text>
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
    <rect width="24" height="24" rx="5" fill="#1A73E8" />
    <text
      x="12"
      y="15"
      textAnchor="middle"
      fill="#FFFDF8"
      fontSize="8.5"
      fontWeight="800"
      fontFamily="ui-monospace, monospace"
      letterSpacing="-0.3px"
    >
      GC
    </text>
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
    <rect width="24" height="24" rx="5" fill="#0078D4" />
    <text
      x="12"
      y="15"
      textAnchor="middle"
      fill="#FFFDF8"
      fontSize="8.5"
      fontWeight="800"
      fontFamily="ui-monospace, monospace"
      letterSpacing="-0.3px"
    >
      AZ
    </text>
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
    <rect width="24" height="24" rx="5" fill="#C74634" />
    <text
      x="12"
      y="15"
      textAnchor="middle"
      fill="#FFFDF8"
      fontSize="8.5"
      fontWeight="800"
      fontFamily="ui-monospace, monospace"
      letterSpacing="-0.3px"
    >
      OC
    </text>
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
    <rect width="24" height="24" rx="5" fill="#F38020" />
    <text
      x="12"
      y="15"
      textAnchor="middle"
      fill="#FFFDF8"
      fontSize="8.5"
      fontWeight="800"
      fontFamily="ui-monospace, monospace"
      letterSpacing="-0.3px"
    >
      R2
    </text>
  </svg>
)

export function ProviderIcon({ provider, size = 18 }: { provider: string; size?: number }) {
  const p = provider.toLowerCase()
  if (p.includes("aws") || p.includes("s3")) {
    return <AwsLogo size={size} />
  }
  if (p.includes("google") || p.includes("gcp") || p.includes("gcs")) {
    return <GoogleCloudLogo size={size} />
  }
  if (p.includes("azure") || p.includes("blob")) {
    return <AzureLogo size={size} />
  }
  if (p.includes("oracle") || p.includes("oci")) {
    return <OracleCloudLogo size={size} />
  }
  if (p.includes("r2") || p.includes("cloudflare")) {
    return <CloudflareR2Logo size={size} />
  }
  return (
    <span
      className="inline-flex items-center justify-center rounded-xs bg-[#142B4A] dark:bg-[#211D15] text-[#C49A3A] dark:text-[#C6A052] font-mono text-[9px] font-bold border border-[#E8E0D1] dark:border-[#3A2E1E]"
      style={{ width: size, height: size }}
    >
      {provider.slice(0, 2).toUpperCase()}
    </span>
  )
}

export function ProviderBadge({
  provider,
  className = "",
}: {
  provider: string
  className?: string
}) {
  const p = provider.toLowerCase()
  let name = provider
  let markerColor = "#142B4A"
  let tag = "BYOC"

  if (p.includes("aws") || p.includes("s3")) {
    name = "AWS S3"
    markerColor = "#D97706"
    tag = "Native"
  } else if (p.includes("google") || p.includes("gcp") || p.includes("gcs")) {
    name = "Google Cloud"
    markerColor = "#1A73E8"
    tag = "Native"
  } else if (p.includes("azure") || p.includes("blob")) {
    name = "Azure Blob"
    markerColor = "#0078D4"
    tag = "Enterprise"
  } else if (p.includes("oracle") || p.includes("oci")) {
    name = "Oracle OCI"
    markerColor = "#C74634"
    tag = "Archive"
  } else if (p.includes("r2") || p.includes("cloudflare")) {
    name = "Cloudflare R2"
    markerColor = "#F38020"
    tag = "Zero-Egress"
  } else if (p.includes("b2") || p.includes("backblaze")) {
    name = "Backblaze B2"
    markerColor = "#B02A30"
    tag = "S3"
  } else if (p.includes("ibm")) {
    name = "IBM Cloud"
    markerColor = "#0F62FE"
    tag = "COS"
  } else if (p.includes("multi")) {
    name = "Multi-Cloud"
    markerColor = "#7C3AED"
    tag = "Striped"
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 rounded-lg border px-2.5 py-1 shadow-2xs transition-all",
        // Light Theme: Clean Ivory / White Card
        "border-[#E8E0D1] bg-white text-[#142B4A]",
        // Dark Theme: Luxury Dark Gradient Pill (Dazzle Century)
        "dark:border-[#3A2E1E] dark:bg-gradient-to-b dark:from-[#211C14] dark:to-[#15120C] dark:text-[#F5F0E6] dark:shadow-[0_2px_8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]",
        className
      )}
    >
      <span
        className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs ring-1 ring-black/10 dark:ring-white/25 transition-transform"
        style={{
          backgroundColor: markerColor,
          boxShadow: `0 0 6px ${markerColor}50`,
        }}
        aria-hidden
      />
      <span className="font-palatino text-xs sm:text-sm font-bold text-[#142B4A] dark:text-[#F5F0E6] whitespace-nowrap tracking-wide">
        {name}
      </span>
      <span className="font-mono text-[9px] sm:text-[10px] uppercase font-bold text-[#68768A] dark:text-[#C6A052] bg-[#FAF6ED] dark:bg-[#0D0B08] px-1.5 py-0.5 rounded border border-[#E8E0D1]/60 dark:border-[#3A2E1E] shadow-2xs tracking-wider">
        {tag}
      </span>
    </div>
  )
}
