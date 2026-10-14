import type { FC } from "react"

export const AwsLogo: FC<{ className?: string; size?: number }> = ({ className = "h-4 w-auto", size }) => (
  <svg
    viewBox="0 0 64 38"
    className={className}
    style={size ? { width: size * 1.68, height: size } : undefined}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="AWS"
  >
    <path
      d="M17.8 17.5c0 .9-.2 1.6-.7 2.1-.5.5-1.3.8-2.3.8-1 0-1.7-.2-2.3-.7-.6-.5-.9-1.2-1-2.2h-3.4c.1 1.8.8 3.2 2.1 4.2 1.3 1 2.8 1.5 4.6 1.5 1.9 0 3.5-.5 4.7-1.5 1.2-1 1.8-2.4 1.8-4.2V8.4h-3.5v9.1zm11.3-9.1h-3.6l-3.2 14.5h3.6l.7-3.6h4.3l.7 3.6h3.7L31.7 8.4h-2.6zm-1.8 8.1l1.4-7.2 1.4 7.2h-2.8zm17.9-8.1h-3.6l-2.9 10.7-2.9-10.7h-3.3l-2.9 10.7-2.9-10.7h-3.6l4.6 14.5h3.5l2.9-10.2 2.9 10.2h3.5l4.6-14.5z"
      fill="#232F3E"
    />
    <path
      d="M48.2 31.8c-6.8 5-16.7 7.7-25.2 7.7-11.9 0-22.6-4.5-30.7-12-.6-.6-.1-1.4.7-1 8.8 5.1 19.8 8.2 31.1 8.2 7.5 0 16.4-1.8 23.3-5.6.9-.5 1.7.5.8 1.1z"
      fill="#FF9900"
    />
    <path
      d="M50.4 28.5c-.9-1.1-5.7-1.5-7.9-1.3-.7.1-.8-.5-.2-.9 3.9-2.7 10.2-1.9 11 0 .8 1.9-.3 8.3-4 11.2-.6.5-1.1.2-.9-.4.9-2 2.8-7.3 2-8.6z"
      fill="#FF9900"
    />
  </svg>
)

export const GoogleCloudLogo: FC<{ className?: string; size?: number }> = ({ className = "h-4 w-auto", size }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    style={size ? { width: size, height: size } : undefined}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Google Cloud"
  >
    <path
      d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"
      fill="#4285F4"
    />
    <path
      d="M19 19H6c-2.76 0-5-2.24-5-5 0-2.58 1.95-4.7 4.5-4.95.84-2.4 3.12-4.05 5.8-4.05 3.31 0 6 2.69 6 6v1h1.7c1.82 0 3.3 1.48 3.3 3.3 0 2.04-1.66 3.7-3.7 3.7z"
      fill="#FFFFFF"
      fillOpacity="0.15"
    />
    <circle cx="9" cy="13" r="3" fill="#EA4335" />
    <circle cx="15" cy="12" r="3" fill="#FBBC05" />
    <circle cx="12" cy="15" r="3" fill="#34A853" />
    <path
      d="M12 7c-2.76 0-5 2.24-5 5 0 .34.04.67.1 1h9.8c.06-.33.1-.66.1-1 0-2.76-2.24-5-5-5z"
      fill="#4285F4"
    />
  </svg>
)

export const AzureLogo: FC<{ className?: string; size?: number }> = ({ className = "h-4 w-auto", size }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    style={size ? { width: size, height: size } : undefined}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Microsoft Azure"
  >
    <path
      d="M13.2 2.5L5.5 16.2h5.7L18.7 2.5H13.2z"
      fill="#0078D4"
    />
    <path
      d="M13.2 2.5L2.5 21.5h6.3l4.4-7.8h5.5l-5.5-11.2z"
      fill="#0089D6"
    />
    <path
      d="M8.8 21.5h12.7l-4.2-7.5H13.2l-4.4 7.5z"
      fill="#0078D4"
    />
  </svg>
)

export const OracleCloudLogo: FC<{ className?: string; size?: number }> = ({ className = "h-4 w-auto", size }) => (
  <svg
    viewBox="0 0 32 32"
    className={className}
    style={size ? { width: size, height: size } : undefined}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Oracle Cloud"
  >
    <rect x="2" y="7" width="28" height="18" rx="9" fill="#C74634" />
    <rect x="9" y="12" width="14" height="8" rx="4" fill="#FFFFFF" />
  </svg>
)

export function ProviderIcon({ provider, size = 18 }: { provider: string; size?: number }) {
  const p = provider.toLowerCase()
  if (p.includes("aws") || p.includes("s3")) {
    return <AwsLogo size={size} className="shrink-0" />
  }
  if (p.includes("google") || p.includes("gcp") || p.includes("gcs")) {
    return <GoogleCloudLogo size={size} className="shrink-0" />
  }
  if (p.includes("azure") || p.includes("blob")) {
    return <AzureLogo size={size} className="shrink-0" />
  }
  if (p.includes("oracle") || p.includes("oci")) {
    return <OracleCloudLogo size={size} className="shrink-0" />
  }
  // Generic cloud fallback
  return (
    <span
      className="inline-flex items-center justify-center rounded-xs bg-[#FFF8E7] text-[#C49A3A] font-mono text-[10px] font-bold border border-[#E8E0D1]"
      style={{ width: size, height: size }}
    >
      {provider.slice(0, 2).toUpperCase()}
    </span>
  )
}
