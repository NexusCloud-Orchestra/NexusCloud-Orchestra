import '../css/Tables.css';

function RecentFiles({ files }) {
  const defaultFiles = [
    { name: 'Project_Design_v2.pdf', provider: 'AWS S3', providerIcon: '🧡', size: '14.2 MB', owner: 'Demo User', date: 'Jul 12, 2026', status: 'healthy' },
    { name: 'Financials_2026_Q2.xlsx', provider: 'Azure Blob', providerIcon: '💙', size: '2.8 MB', owner: 'Demo User', date: 'Jul 10, 2026', status: 'healthy' },
    { name: 'Archived_Assets.tar.gz', provider: 'Backblaze B2', providerIcon: '❤️', size: '185.0 MB', owner: 'Demo User', date: 'Jul 08, 2026', status: 'warning' },
    { name: 'User_Database_Backup.sql', provider: 'Google Drive', providerIcon: '💚', size: '42.5 MB', owner: 'Demo User', date: 'Jul 05, 2026', status: 'healthy' },
  ];

  const filesList = files && files.length > 0 ? files : defaultFiles;

  return (
    <div className="table-container">
      <div className="table-header-block">
        <h3 className="table-title">Recent Files</h3>
      </div>
      <div className="table-wrapper">
        <table className="enterprise-table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Cloud Provider</th>
              <th>Size</th>
              <th>Owner</th>
              <th>Last Modified</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filesList.map((file, i) => (
              <tr key={i}>
                <td>
                  <div className="file-name-cell">
                    <span className="file-icon">📄</span>
                    <span>{file.name}</span>
                  </div>
                </td>
                <td>
                  <span className="cloud-provider-badge">
                    <span>{file.providerIcon || '☁️'}</span>
                    <span>{file.provider}</span>
                  </span>
                </td>
                <td>{file.size}</td>
                <td>{file.owner || 'Demo User'}</td>
                <td>{file.date || 'Jul 13, 2026'}</td>
                <td>
                  <span className="status-indicator">
                    <span className={`dot ${file.status === 'warning' ? 'warning' : file.status === 'danger' ? 'danger' : 'healthy'}`} />
                    <span>{file.status === 'warning' ? 'Replicating' : file.status === 'danger' ? 'Error' : 'Synced'}</span>
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn-table-action" title="Download">⬇️</button>
                  <button className="btn-table-action" title="Share">🔗</button>
                  <button className="btn-table-action" title="Delete">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RecentFiles;
