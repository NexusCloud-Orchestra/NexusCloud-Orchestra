import CloudCard from '../components/CloudCard';

function Clouds() {
  const providers = [
    { provider: 'aws', displayName: 'AWS S3 Core', bucketName: 'nexus-prod-storage', status: 'connected', usedStorage: 250, limitStorage: 500 },
    { provider: 'azure', displayName: 'Azure Blob Cache', bucketName: 'azure-blob-nexus', status: 'connected', usedStorage: 120, limitStorage: 250 },
    { provider: 'gcp', displayName: 'GCP Nearline', bucketName: 'gcp-backup-orchestra', status: 'connected', usedStorage: 80, limitStorage: 200 },
    { provider: 'backblaze', displayName: 'Backblaze Archive', bucketName: 'backblaze-b2-storage', status: 'connected', usedStorage: 400, limitStorage: 1000 },
    { provider: 'oracle', displayName: 'Oracle Cold Volume', bucketName: 'oracle-cold-vault', status: 'disconnected', usedStorage: 0, limitStorage: 250 },
  ];

  return (
    <div className="page-content-wrapper">
      <div className="welcome-header-section">
        <h1 className="welcome-heading">Cloud Providers</h1>
        <p className="welcome-subtitle">Configure, reconnect, and monitor individual cloud endpoints.</p>
      </div>

      <div className="providers-grid">
        {providers.map((prov, i) => (
          <CloudCard key={i} {...prov} />
        ))}
      </div>
    </div>
  );
}

export default Clouds;
