import React from 'react';

export type CloudProviderId = 'aws' | 'gcp' | 'azure' | 'r2' | 'b2' | 'nexus';

interface ProviderIconProps {
  provider: CloudProviderId | string;
  className?: string;
  size?: number;
}

export const ProviderIcon: React.FC<ProviderIconProps> = ({
  provider,
  className = '',
  size = 20,
}) => {
  const norm = provider.toLowerCase();

  if (norm.includes('aws') || norm.includes('s3') || norm.includes('amazon')) {
    // AWS S3 Icon
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={`shrink-0 ${className}`}
        aria-label="AWS S3"
      >
        <rect width="24" height="24" rx="5" fill="#FF9900" fillOpacity="0.12" />
        <path
          d="M6 13.5c1.8 1.5 5.2 2.5 8.5 1.5 1.8-.5 3.5-1.5 4.5-2.8"
          stroke="#FF9900"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M17.5 11l2 1.5-1.5 2"
          stroke="#FF9900"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7 9.5c0-.8.7-1.5 1.5-1.5h7c.8 0 1.5.7 1.5 1.5v2c0 .8-.7 1.5-1.5 1.5h-7A1.5 1.5 0 017 11.5v-2z"
          fill="#FF9900"
        />
      </svg>
    );
  }

  if (norm.includes('gcp') || norm.includes('google')) {
    // Google Cloud Storage Icon
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={`shrink-0 ${className}`}
        aria-label="Google Cloud"
      >
        <rect width="24" height="24" rx="5" fill="#4285F4" fillOpacity="0.12" />
        <path
          d="M16.5 15.5h-9a3.5 3.5 0 01-1.2-6.8 4.5 4.5 0 018.6-1.5 3.5 3.5 0 011.6 8.3z"
          stroke="#4285F4"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="1.5" fill="#34A853" />
      </svg>
    );
  }

  if (norm.includes('azure') || norm.includes('microsoft')) {
    // Azure Blob Storage Icon
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={`shrink-0 ${className}`}
        aria-label="Azure Blob Storage"
      >
        <rect width="24" height="24" rx="5" fill="#0089D6" fillOpacity="0.12" />
        <path
          d="M6.5 16.5L13 7.5l-3 4.5 7.5 4.5H6.5z"
          fill="#0089D6"
        />
        <path
          d="M13.5 7.5l4 6h-3.5"
          stroke="#0089D6"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (norm.includes('r2') || norm.includes('cloudflare')) {
    // Cloudflare R2 Icon
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={`shrink-0 ${className}`}
        aria-label="Cloudflare R2"
      >
        <rect width="24" height="24" rx="5" fill="#F38020" fillOpacity="0.12" />
        <path
          d="M16 15.5h-8a3 3 0 01-1-5.8 4 4 0 017.5-1.4 3 3 0 011.5 7.2z"
          stroke="#F38020"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path d="M11 12l2 2 4-4" stroke="#F38020" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  if (norm.includes('b2') || norm.includes('backblaze')) {
    // Backblaze B2 Icon
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={`shrink-0 ${className}`}
        aria-label="Backblaze B2"
      >
        <rect width="24" height="24" rx="5" fill="#E21D24" fillOpacity="0.12" />
        <path
          d="M8 7.5h4a2.5 2.5 0 011.8 4.2A2.5 2.5 0 0112 16.5H8V7.5zm2 3.5h2a1 1 0 000-2h-2v2zm0 4h2.5a1 1 0 000-2H10v2z"
          fill="#E21D24"
        />
      </svg>
    );
  }

  // NexusCloud Master Node Icon
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 ${className}`}
      aria-label="NexusCloud"
    >
      <rect width="24" height="24" rx="5" fill="#123B57" />
      <path
        d="M16 15h-7a4.5 4.5 0 01-.5-8.9 5 5 0 019 1.9 3.5 3.5 0 01-1.5 7z"
        stroke="#9ADFF2"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="1.5" fill="#75D5E8" />
    </svg>
  );
};
