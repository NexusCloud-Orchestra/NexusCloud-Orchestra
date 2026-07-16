import React from 'react';

function Footer() {
  const links = [
    { label: 'Documentation', url: '/docs' },
    { label: 'Privacy Policy', url: '/privacy' },
    { label: 'Terms of Service', url: '/terms' },
    { label: 'Status Page', url: '/status' },
    { label: 'Support Email', url: 'mailto:support@nexuscloud.example.com' },
  ];

  return (
    <footer
      style={{
        marginTop: '64px',
        paddingTop: '24px',
        borderTop: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        fontSize: '13px',
        color: '#6B7280',
        paddingBottom: '20px',
      }}
    >
      <div>
        <span>Nexus Cloud Version </span>
        <span style={{ fontWeight: 600, color: '#111827' }}>v1.0.0</span>
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {links.map((link) => (
          <a
            key={link.label}
            href={link.url}
            onClick={(e) => {
              if (link.url.startsWith('/')) {
                e.preventDefault();
                alert(`Navigating to ${link.label}`);
              }
            }}
            style={{
              color: '#6B7280',
              textDecoration: 'none',
              fontWeight: 500,
            }}
            onMouseOver={(e) => (e.target.style.color = '#2563EB')}
            onMouseOut={(e) => (e.target.style.color = '#6B7280')}
          >
            {link.label}
          </a>
        ))}
      </div>
    </footer>
  );
}

export default Footer;
