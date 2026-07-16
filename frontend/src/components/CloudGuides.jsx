import React from 'react';

function CloudGuides() {
  const guides = [
    {
      provider: 'Amazon AWS S3',
      logo: '☁️',
      desc: 'Learn how to configure IAM policies, retrieve credentials, and link S3 buckets.',
      link: '/help-support/guides/aws',
    },
    {
      provider: 'Microsoft Azure',
      logo: '🔷',
      desc: 'Step-by-step setup guides for shared access signatures (SAS) and storage containers.',
      link: '/help-support/guides/azure',
    },
    {
      provider: 'Google Cloud',
      logo: '🟡',
      desc: 'Configure service accounts, download keys, and bind secure cloud buckets.',
      link: '/help-support/guides/gcp',
    },
    {
      provider: 'Oracle Cloud',
      logo: '🔴',
      desc: 'Integrate Oracle Cloud Infrastructure (OCI) buckets via S3 compatibility layer.',
      link: '/help-support/guides/oracle',
    },
    {
      provider: 'Backblaze B2',
      logo: '🔥',
      desc: 'Optimize cost tiers by connecting B2 Cloud Storage using application keys.',
      link: '/help-support/guides/backblaze',
    },
    {
      provider: 'Cloudflare R2',
      logo: '🧡',
      desc: 'Set up zero-egress R2 object storage volumes using access keys.',
      link: '/help-support/guides/cloudflare',
    },
  ];

  return (
    <div className="cloud-guides-grid">
      {guides.map((item) => (
        <div key={item.provider} className="cloud-guide-card">
          <div className="cloud-logo-wrapper">{item.logo}</div>
          <div className="cloud-guide-content">
            <h4 className="cloud-guide-name">{item.provider}</h4>
            <p className="cloud-guide-desc">{item.desc}</p>
            <a href={item.link} className="cloud-guide-link" onClick={(e) => { e.preventDefault(); alert(`Opening setup guide for ${item.provider}`); }}>
              Setup Guide &rarr;
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CloudGuides;
