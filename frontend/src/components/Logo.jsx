import React from 'react';

function Logo({ className = '', textColor = '#FFFFFF' }) {
  return (
    <div className={`logo-brand-minimal ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Simple crisp corporate logo mark representing unified clouds */}
        <rect x="4" y="16" width="10" height="10" rx="2" fill="#2563EB" />
        <rect x="18" y="16" width="10" height="10" rx="2" fill="#38BDF8" />
        <rect x="11" y="6" width="10" height="10" rx="2" fill="#0EA5E9" opacity="0.9" />
      </svg>
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 700,
          fontSize: '20px',
          color: textColor,
          letterSpacing: '-0.5px',
        }}
      >
        Nexus Cloud
      </span>
    </div>
  );
}

export default Logo;
