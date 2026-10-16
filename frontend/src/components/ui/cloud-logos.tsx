import type { FC } from "react"

export const AwsLogo: FC<{ className?: string; size?: number }> = ({ className = "", size = 18 }) => (
  <span
    className={`inline-flex items-center justify-center rounded-xs bg-[#D97706] text-white shadow-2xs font-mono text-[10px] font-bold ${className}`}
    style={size ? { width: size, height: size } : undefined}
    title="AWS S3"
  >
    S3
  </span>
)

export const GoogleCloudLogo: FC<{ className?: string; size?: number }> = ({ className = "", size = 18 }) => (
  <span
    className={`inline-flex items-center justify-center rounded-xs bg-[#1A73E8] text-white shadow-2xs font-mono text-[10px] font-bold ${className}`}
    style={size ? { width: size, height: size } : undefined}
    title="Google Cloud Storage"
  >
    GC
  </span>
)

export const AzureLogo: FC<{ className?: string; size?: number }> = ({ className = "", size = 18 }) => (
  <span
    className={`inline-flex items-center justify-center rounded-xs bg-[#0369A1] text-white shadow-2xs font-mono text-[10px] font-bold ${className}`}
    style={size ? { width: size, height: size } : undefined}
    title="Azure Blob"
  >
    AZ
  </span>
)

export const OracleCloudLogo: FC<{ className?: string; size?: number }> = ({ className = "", size = 18 }) => (
  <span
    className={`inline-flex items-center justify-center rounded-xs bg-[#C74634] text-white shadow-2xs font-mono text-[10px] font-bold ${className}`}
    style={size ? { width: size, height: size } : undefined}
    title="Oracle Cloud"
  >
    OC
  </span>
)

export const CloudflareR2Logo: FC<{ className?: string; size?: number }> = ({ className = "", size = 18 }) => (
  <span
    className={`inline-flex items-center justify-center rounded-xs bg-[#C2570F] text-white shadow-2xs font-mono text-[10px] font-bold ${className}`}
    style={size ? { width: size, height: size } : undefined}
    title="Cloudflare R2"
  >
    R2
  </span>
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
      className="inline-flex items-center justify-center rounded-xs bg-[#142B4A] text-[#C49A3A] font-mono text-[10px] font-bold border border-[#E8E0D1]"
      style={{ width: size, height: size }}
    >
      {provider.slice(0, 2).toUpperCase()}
    </span>
  )
}

export function ProviderBadge({ provider }: { provider: string }) {
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
    markerColor = "#0369A1"
    tag = "Enterprise"
  } else if (p.includes("oracle") || p.includes("oci")) {
    name = "Oracle OCI"
    markerColor = "#C74634"
    tag = "Archive"
  } else if (p.includes("r2") || p.includes("cloudflare")) {
    name = "Cloudflare R2"
    markerColor = "#C2570F"
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
    <div className="inline-flex items-center gap-2 rounded-lg border border-[#E8E0D1] bg-white px-2.5 py-1 shadow-2xs">
      <span
        className="h-2.5 w-2.5 rounded-full shrink-0 shadow-2xs"
        style={{ backgroundColor: markerColor }}
        aria-hidden
      />
      <span className="font-palatino text-xs sm:text-sm font-bold text-[#142B4A] whitespace-nowrap">
        {name}
      </span>
      <span className="font-mono text-[10px] uppercase font-bold text-[#68768A] bg-[#FAF6ED] px-1.5 py-0.2 rounded border border-[#E8E0D1]/60">
        {tag}
      </span>
    </div>
  )
}
