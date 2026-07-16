import React from 'react';
import { FileText, Download } from 'lucide-react';

function DownloadsSection() {
  const items = [
    { title: 'User Guide', desc: 'Complete manual for configuring storage pools and users.', size: '4.2 MB' },
    { title: 'API Documentation', desc: 'Offline OpenAPI specification and integration guides.', size: '1.8 MB' },
    { title: 'Desktop App', desc: 'Secure local client for syncing directories automatically.', size: '42.5 MB' },
    { title: 'Release Notes', desc: 'Changelog history for version 1.0.0 and feature rollouts.', size: '320 KB' },
    { title: 'Developer SDK', desc: 'Node.js, Python, and Go libraries for multi-cloud integrations.', size: '8.4 MB' },
    { title: 'Security Whitepaper', desc: 'Detailed document detailing end-to-end encryption protocol.', size: '2.1 MB' },
  ];

  return (
    <div className="helpsupport-grid-3col">
      {items.map((item) => (
        <div key={item.title} className="help-card">
          <div className="help-card-header">
            <div className="help-card-icon">
              <FileText size={24} />
            </div>
            <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>{item.size}</span>
          </div>
          <h3 className="help-card-title">{item.title}</h3>
          <p className="help-card-desc">{item.desc}</p>
          <button className="help-card-button" onClick={() => alert(`Starting download for ${item.title}`)}>
            <Download size={16} />
            <span>Download</span>
          </button>
        </div>
      ))}
    </div>
  );
}

export default DownloadsSection;
