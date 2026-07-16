import React from 'react';

function CloudStatusTable() {
  const rows = [
    { provider: 'AWS', connection: 'AWS S3 Bucket', latency: '32 ms', storage: '5.2 TB', lastSync: '2 minutes ago', status: 'Connected' },
    { provider: 'Azure', connection: 'Azure Blob', latency: '40 ms', storage: '2.1 TB', lastSync: '5 minutes ago', status: 'Connected' },
    { provider: 'Google Cloud', connection: 'GCP Bucket', latency: '—', storage: '0 B', lastSync: '—', status: 'Disconnected' },
    { provider: 'Oracle', connection: 'OCI Bucket', latency: '60 ms', storage: '850 GB', lastSync: '8 minutes ago', status: 'Connected' },
    { provider: 'Backblaze', connection: 'B2 Drive', latency: '45 ms', storage: '12.4 TB', lastSync: '1 minute ago', status: 'Warning' },
    { provider: 'Cloudflare', connection: 'R2 Bucket', latency: '38 ms', storage: '4.6 TB', lastSync: 'Just now', status: 'Connected' },
  ];

  const getStatusClass = (status) => {
    if (status === 'Connected') return 'status-pill-connected';
    if (status === 'Disconnected') return 'status-pill-disconnected';
    return 'status-pill-warning';
  };

  return (
    <div className="help-table-wrapper">
      <table className="help-table">
        <thead>
          <tr>
            <th>Cloud Provider</th>
            <th>Connection</th>
            <th>Latency</th>
            <th>Storage</th>
            <th>Last Sync</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.provider}>
              <td className="provider-cell">
                <span>{row.provider}</span>
              </td>
              <td>{row.connection}</td>
              <td>{row.latency}</td>
              <td>{row.storage}</td>
              <td>{row.lastSync}</td>
              <td>
                <span className={`status-indicator-pill ${getStatusClass(row.status)}`}>
                  {row.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CloudStatusTable;
