import '../css/Cards.css';

function CloudCard({ provider, displayName, bucketName, status, usedStorage, limitStorage, onManage }) {
  const percentage = Math.min(Math.round((usedStorage / limitStorage) * 100), 100) || 0;

  const getProviderLogo = (prov) => {
    switch (prov.toLowerCase()) {
      case 'aws': return '🧡';
      case 'azure': return '💙';
      case 'gcp': return '💚';
      case 'backblaze': return '❤️';
      case 'oracle': return '❤️';
      default: return '☁️';
    }
  };

  const getProgressBarColor = (pct) => {
    if (pct > 85) return 'danger';
    if (pct > 60) return 'warning';
    return 'primary';
  };

  return (
    <div className="provider-card">
      <div className="provider-card-header">
        <div className="provider-info-block">
          <div className="provider-logo-box">{getProviderLogo(provider)}</div>
          <div>
            <div className="provider-name">{displayName}</div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{bucketName}</div>
          </div>
        </div>
        <span className={`status-badge ${status === 'connected' ? 'connected' : 'disconnected'}`}>
          <span style={{ fontSize: '6px' }}>●</span> {status}
        </span>
      </div>

      <div className="provider-storage-details">
        <div className="provider-storage-text">
          <span>{usedStorage} GB used</span>
          <span>of {limitStorage} GB</span>
        </div>
        <div className="provider-progress-bar">
          <div
            className={`provider-progress-fill ${getProgressBarColor(percentage)}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="provider-card-actions">
        {status === 'connected' ? (
          <button onClick={onManage} className="btn-nav-action btn-nav-secondary" style={{ height: '32px', padding: '0 12px', fontSize: '12px' }}>
            Manage Settings
          </button>
        ) : (
          <button className="btn-nav-action btn-nav-primary" style={{ height: '32px', padding: '0 12px', fontSize: '12px' }}>
            Reconnect Cloud
          </button>
        )}
      </div>
    </div>
  );
}

export default CloudCard;
