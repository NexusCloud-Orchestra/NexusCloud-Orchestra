import '../css/Tables.css';

function formatBytes(bytes, decimals = 2) {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const getProviderIcon = (provider = '') => {
  switch (provider.toLowerCase()) {
    case 'aws': return '🧡';
    case 'azure': return '💙';
    case 'gcp': return '💚';
    case 'r2': return '💛';
    case 'b2': return '❤️';
    default: return '☁️';
  }
};

function RecentFiles({ files, onDownload, onDelete }) {
  const defaultFiles = [
    { id: '1', name: 'Project_Design_v2.pdf', provider: 'AWS S3', providerIcon: '🧡', size: '14.2 MB', owner: 'Demo User', date: 'Jul 12, 2026', status: 'healthy' },
    { id: '2', name: 'Financials_2026_Q2.xlsx', provider: 'Azure Blob', providerIcon: '💙', size: '2.8 MB', owner: 'Demo User', date: 'Jul 10, 2026', status: 'healthy' },
    { id: '3', name: 'Archived_Assets.tar.gz', provider: 'Backblaze B2', providerIcon: '❤️', size: '185.0 MB', owner: 'Demo User', date: 'Jul 08, 2026', status: 'warning' },
    { id: '4', name: 'User_Database_Backup.sql', provider: 'Google Drive', providerIcon: '💚', size: '42.5 MB', owner: 'Demo User', date: 'Jul 05, 2026', status: 'healthy' },
  ];

  // If dynamic files are passed, map them to standard format
  const mappedFiles = files ? files.map(file => ({
    id: file.id,
    name: file.original_name,
    provider: file.connection_name || file.provider,
    providerIcon: getProviderIcon(file.provider),
    size: formatBytes(file.size_bytes),
    owner: 'Demo User',
    date: new Date(file.created_at).toLocaleDateString(),
    status: file.status === 'active' ? 'healthy' : 'warning'
  })) : null;

  const filesList = mappedFiles && mappedFiles.length > 0 ? mappedFiles : (files ? [] : defaultFiles);

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
            {filesList.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#6B7280', fontSize: '14.5px' }}>
                  No active files uploaded yet. Drag and drop a file above to upload!
                </td>
              </tr>
            ) : (
              filesList.map((file) => (
                <tr key={file.id}>
                  <td>
                    <div className="file-name-cell">
                      <span className="file-icon">📄</span>
                      <span>{file.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="cloud-provider-badge">
                      <span>{file.providerIcon}</span>
                      <span>{file.provider}</span>
                    </span>
                  </td>
                  <td>{file.size}</td>
                  <td>{file.owner}</td>
                  <td>{file.date}</td>
                  <td>
                    <span className="status-indicator">
                      <span className={`dot ${file.status === 'warning' ? 'warning' : 'healthy'}`} />
                      <span>{file.status === 'warning' ? 'Replicating' : 'Synced'}</span>
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {onDownload && (
                      <button onClick={() => onDownload(file.id)} className="btn-table-action" title="Download">⬇️</button>
                    )}
                    {onDelete && (
                      <button onClick={() => onDelete(file.id)} className="btn-table-action" title="Delete">🗑️</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RecentFiles;
