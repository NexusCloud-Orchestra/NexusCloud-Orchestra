import React from 'react';

interface BrandLogoProps {
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Clean professional cloud mark with BYOC connection nodes */}
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#123B57] to-[#397DB7] flex items-center justify-center shadow-xs">
        <svg
          className="w-5 h-5 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
          <path d="M12 12v3" stroke="#9ADFF2" strokeWidth="2.5" />
          <circle cx="12" cy="16" r="1" fill="#75D5E8" />
        </svg>
      </div>
      <span className="text-xl font-bold tracking-tight text-[#102A43] font-sans">
        NexusCloud
      </span>
    </div>
  );
};
