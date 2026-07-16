import React from 'react';

function SystemStatus() {
  const services = [
    { name: 'Authentication', status: 'Operational' },
    { name: 'File Upload', status: 'Operational' },
    { name: 'File Download', status: 'Operational' },
    { name: 'Cloud Sync', status: 'Operational' },
    { name: 'API', status: 'Operational' },
    { name: 'Notifications', status: 'Operational' },
  ];

  return (
    <div className="system-status-grid">
      {services.map((svc) => (
        <div key={svc.name} className="system-status-card">
          <span className="system-status-name">{svc.name}</span>
          <span className="system-status-badge">{svc.status}</span>
        </div>
      ))}
    </div>
  );
}

export default SystemStatus;
