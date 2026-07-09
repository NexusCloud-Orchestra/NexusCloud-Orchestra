import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import '../css/Dashboard.css';


function Dashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Tabs: 'overview', 'files', 'connections', 'activity'
  const [activeTab, setActiveTab] = useState('overview');

  // Backend data states
  const [user, setUser] = useState(null);
  const [quotaSummary, setQuotaSummary] = useState(null);
  const [connections, setConnections] = useState([]);
  const [files, setFiles] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddConnectionOpen, setIsAddConnectionOpen] = useState(false);

  // Connection form state
  const [connectionForm, setConnectionForm] = useState({
    provider: 'aws',
    displayName: '',
    bucketName: '',
    region: '',
    awsAccessKey: '',
    awsSecretKey: '',
    gcpCredsJson: '',
    r2AccessKey: '',
    r2SecretKey: '',
    r2EndpointUrl: '',
    azureConnStr: '',
  });

  // File Upload states
  const [uploadState, setUploadState] = useState({
    isUploading: false,
    fileName: '',
    progress: 0,
    error: '',
  });

  // Fetch headers helper
  const getAuthHeaders = () => {
    const token = localStorage.getItem('nexus-token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  // Log out handler
  const handleLogout = () => {
    localStorage.removeItem('nexus-token');
    localStorage.removeItem('nexus-refresh-token');
    navigate('/login');
  };

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/me`, {
        headers: getAuthHeaders(),
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json();
      setUser(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch quota summary
  const fetchQuota = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/quota/summary`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to load quota statistics');
      const data = await res.json();
      setQuotaSummary(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch connections
  const fetchConnections = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/connections`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to load connections');
      const data = await res.json();
      setConnections(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch files
  const fetchFiles = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/files`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to load files');
      const data = await res.json();
      setFiles(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch activity logs
  const fetchActivityLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/audit-logs`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to load audit logs');
      const data = await res.json();
      setActivityLogs(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Load everything
  const loadAllData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('nexus-token');
    if (!token) {
      navigate('/login');
      return;
    }

    await fetchProfile();
    await fetchQuota();
    await fetchConnections();
    await fetchFiles();
    await fetchActivityLogs();
    setIsLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Format bytes helper
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Add Cloud Connection
  const handleAddConnection = async (e) => {
    e.preventDefault();
    setError('');

    // Construct credentials based on provider
    let credentials = {};
    const { provider, displayName, bucketName, region } = connectionForm;

    if (!displayName || !bucketName) {
      setError('Display Name and Bucket Name are required.');
      return;
    }

    if (provider === 'aws') {
      credentials = {
        aws_access_key_id: connectionForm.awsAccessKey,
        aws_secret_access_key: connectionForm.awsSecretKey,
      };
      if (!credentials.aws_access_key_id || !credentials.aws_secret_access_key) {
        setError('AWS credentials keys are required.');
        return;
      }
    } else if (provider === 'gcp') {
      try {
        credentials = {
          service_account_json: JSON.parse(connectionForm.gcpCredsJson),
        };
      } catch (err) {
        setError('GCP Service Account JSON must be valid JSON format.');
        return;
      }
    } else if (provider === 'r2') {
      credentials = {
        access_key_id: connectionForm.r2AccessKey,
        secret_access_key: connectionForm.r2SecretKey,
        endpoint_url: connectionForm.r2EndpointUrl,
      };
      if (!credentials.access_key_id || !credentials.secret_access_key || !credentials.endpoint_url) {
        setError('R2 Access keys and Endpoint URL are required.');
        return;
      }
    } else if (provider === 'azure') {
      credentials = {
        connection_string: connectionForm.azureConnStr,
      };
      if (!credentials.connection_string) {
        setError('Azure Connection String is required.');
        return;
      }
    } else {
      // Fallback dummy credentials for SimulatedProvider (B2, Oracle, IBM)
      credentials = { mock: 'enabled' };
    }

    try {
      const res = await fetch(`${API_URL}/api/v1/connections`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          provider,
          display_name: displayName,
          bucket_name: bucketName,
          region: region || null,
          credentials,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to add connection');

      setIsAddConnectionOpen(false);
      setConnectionForm({
        provider: 'aws',
        displayName: '',
        bucketName: '',
        region: '',
        awsAccessKey: '',
        awsSecretKey: '',
        gcpCredsJson: '',
        r2AccessKey: '',
        r2SecretKey: '',
        r2EndpointUrl: '',
        azureConnStr: '',
      });
      
      // Refresh views
      await fetchConnections();
      await fetchQuota();
      await fetchActivityLogs();
    } catch (err) {
      setError(err.message);
    }
  };

  // Disconnect Cloud connection
  const handleDeleteConnection = async (id) => {
    if (!window.confirm('Are you sure you want to remove this storage account? This will unlink all files associated with it.')) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/connections/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete connection');
      
      await fetchConnections();
      await fetchQuota();
      await fetchFiles();
      await fetchActivityLogs();
    } catch (err) {
      alert(err.message);
    }
  };

  // Uploader logic: request presigned upload URL and PUT the file
  const handleUploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (connections.length === 0) {
      alert('Please connect at least one storage account before uploading files.');
      return;
    }

    setUploadState({
      isUploading: true,
      fileName: file.name,
      progress: 0,
      error: '',
    });

    try {
      // 1. Request presigned upload URL
      const reqRes = await fetch(`${API_URL}/api/v1/files/upload-request`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          original_name: file.name,
          size_bytes: file.size,
          mime_type: file.type || 'application/octet-stream',
        }),
      });

      const reqData = await reqRes.json();
      if (!reqRes.ok) throw new Error(reqData.detail || 'Upload request failed');

      // 2. Perform direct binary PUT to storage uploader URL
      // Use XMLHttpRequest to track upload progress easily in React
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadState((prev) => ({ ...prev, progress: percent }));
        }
      });

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.open('PUT', reqData.upload_url, true);
        
        // Handle mock upload vs real cloud upload headers
        if (reqData.upload_url.includes(API_URL)) {
          // If mock upload, we can specify Content-Type or body payload
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Storage provider responded with status ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error uploading file'));
        xhr.send(file);
      });

      await uploadPromise;

      // 3. Confirm upload with API
      const confirmRes = await fetch(`${API_URL}/api/v1/files/confirm-upload/${reqData.file_id}`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!confirmRes.ok) throw new Error('Failed to confirm upload with backend');

      // Reset uploader state and refresh database details
      setUploadState({ isUploading: false, fileName: '', progress: 0, error: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      await fetchFiles();
      await fetchQuota();
      await fetchActivityLogs();
    } catch (err) {
      setUploadState((prev) => ({ ...prev, isUploading: false, error: err.message }));
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Download File
  const handleDownloadFile = async (id, filename) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/files/download/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to retrieve download link');
      const data = await res.json();
      
      // Open link to download
      const link = document.createElement('a');
      link.href = data.download_url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      await fetchActivityLogs();
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete file record
  const handleDeleteFile = async (id) => {
    if (!window.confirm('Are you sure you want to delete this file permanently?')) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/files/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete file');
      
      await fetchFiles();
      await fetchQuota();
      await fetchActivityLogs();
    } catch (err) {
      alert(err.message);
    }
  };

  // Render provider details
  const getProviderIcon = (provider) => {
    switch (provider) {
      case 'aws': return '☁️ AWS S3';
      case 'gcp': return '🟢 GCP Storage';
      case 'r2': return '🧡 Cloudflare R2';
      case 'azure': return '🔷 Azure Blob';
      case 'b2': return '🔵 Backblaze B2';
      case 'oracle': return '🔴 Oracle Cloud';
      case 'ibm': return '🟣 IBM Cloud';
      default: return '☁️ Cloud';
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <span className="spinner" />
        <p>Loading NexusCloud Dashboard...</p>
      </div>
    );
  }

  // Calculate percentage used
  const totalLimit = quotaSummary?.total_limit_bytes || 0;
  const totalUsed = quotaSummary?.total_used_bytes || 0;
  const totalFree = quotaSummary?.total_free_bytes || 0;
  const usedPercent = totalLimit > 0 ? ((totalUsed / totalLimit) * 100).toFixed(1) : 0;

  return (
    <div className="dashboard-page">
      {/* Sidebar Nav */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">N</div>
          <div>
            <h2>NexusCloud</h2>
            <p>BYOC Orchestration</p>
          </div>
        </div>

        <nav className="sidebar-menu">
          <button
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Storage Overview
          </button>
          <button
            className={`nav-item ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            📁 File Manager
          </button>
          <button
            className={`nav-item ${activeTab === 'connections' ? 'active' : ''}`}
            onClick={() => setActiveTab('connections')}
          >
            🔌 Cloud Connections
          </button>
          <button
            className={`nav-item ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            📋 Activity Logs
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-badge">
            <p className="user-name">{user?.first_name} {user?.last_name}</p>
            <p className="user-email">{user?.email}</p>
            <span className="user-plan-badge">{user?.plan.toUpperCase()} Plan</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-content">
        <header className="content-header">
          <h1>
            {activeTab === 'overview' && 'Storage Overview'}
            {activeTab === 'files' && 'File Manager'}
            {activeTab === 'connections' && 'Cloud Connections'}
            {activeTab === 'activity' && 'Activity Logs'}
          </h1>
          
          {/* Quick Upload Button */}
          {connections.length > 0 && (
            <div className="header-actions">
              <input
                type="file"
                id="quick-file-upload"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleUploadFile}
              />
              <button
                type="button"
                className="primary-button quick-upload"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadState.isUploading}
              >
                📤 Upload New File
              </button>
            </div>
          )}
        </header>

        {/* Global Error Banner */}
        {error && <div className="dashboard-error-banner">{error}</div>}

        {/* Upload Progress Overlay */}
        {uploadState.isUploading && (
          <div className="upload-progress-card">
            <div className="upload-progress-info">
              <span>Uploading **{uploadState.fileName}**</span>
              <span>{uploadState.progress}%</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${uploadState.progress}%` }} />
            </div>
          </div>
        )}
        {uploadState.error && (
          <div className="upload-progress-card error">
            <p>Upload failed: {uploadState.error}</p>
            <button onClick={() => setUploadState((p) => ({ ...p, error: '' }))}>Dismiss</button>
          </div>
        )}

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="tab-panel overview-panel">
            {/* Global Pool Capacity Card */}
            <div className="glass-card pool-capacity-card">
              <h3>Unified Storage Pool</h3>
              <div className="pool-stats-row">
                <div className="stat-item">
                  <span className="stat-label">Used Storage</span>
                  <span className="stat-value">{formatBytes(totalUsed)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Remaining Space</span>
                  <span className="stat-value">{formatBytes(totalFree)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Pool Size</span>
                  <span className="stat-value">{formatBytes(totalLimit)}</span>
                </div>
              </div>

              <div className="pool-bar-container">
                <div className="pool-bar-fill" style={{ width: `${usedPercent}%` }} />
              </div>
              <p className="pool-bar-label">{usedPercent}% of storage pool consumed</p>
            </div>

            {/* Quotas Breakdowns */}
            <h3>Connected Storage Breakdown</h3>
            {connections.length === 0 ? (
              <div className="empty-state">
                <p>No storage accounts linked. Go to **Cloud Connections** to get started!</p>
              </div>
            ) : (
              <div className="connection-grid">
                {quotaSummary?.by_connection.map((q) => {
                  const percent = q.limit_bytes > 0 ? ((q.used_bytes / q.limit_bytes) * 100).toFixed(1) : 0;
                  return (
                    <div className="glass-card quota-card" key={q.connection_id}>
                      <div className="quota-card-header">
                        <h4>{q.display_name}</h4>
                        <span className="provider-tag">{getProviderIcon(q.provider)}</span>
                      </div>
                      <p className="bucket-info">🪣 `{q.bucket_name}`</p>
                      
                      <div className="quota-metric">
                        <div className="metric-row">
                          <span>Used space:</span>
                          <strong>{formatBytes(q.used_bytes)} / {formatBytes(q.limit_bytes)}</strong>
                        </div>
                        <div className="metric-bar">
                          <div className="metric-bar-fill" style={{ width: `${percent}%` }} />
                        </div>
                        <small className="metric-sub">{percent}% full ({q.tier_type})</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: File Manager */}
        {activeTab === 'files' && (
          <div className="tab-panel files-panel">
            <div className="glass-card files-list-card">
              {files.length === 0 ? (
                <div className="empty-state">
                  <p>No files uploaded. Click **Upload New File** to store your first multi-cloud item!</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="files-table">
                    <thead>
                      <tr>
                        <th>File Name</th>
                        <th>Cloud Provider</th>
                        <th>Size</th>
                        <th>Type</th>
                        <th>Uploaded Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((file) => (
                        <tr key={file.id}>
                          <td className="file-name-cell">📄 {file.original_name}</td>
                          <td>
                            <span className="file-provider-tag">{getProviderIcon(file.provider)}</span>
                            <small className="file-connection-name">({file.connection_name})</small>
                          </td>
                          <td>{formatBytes(file.size_bytes)}</td>
                          <td><span className="file-type-badge">{file.mime_type.split('/')[1] || 'binary'}</span></td>
                          <td>{new Date(file.created_at).toLocaleString()}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="action-btn download"
                                onClick={() => handleDownloadFile(file.id, file.original_name)}
                              >
                                ⬇️ Download
                              </button>
                              <button
                                className="action-btn delete"
                                onClick={() => handleDeleteFile(file.id)}
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Cloud Connections */}
        {activeTab === 'connections' && (
          <div className="tab-panel connections-panel">
            <div className="connections-actions">
              <button
                className="primary-button"
                onClick={() => setIsAddConnectionOpen((prev) => !prev)}
              >
                {isAddConnectionOpen ? '✕ Close Connection Form' : '➕ Link Storage Account'}
              </button>
            </div>

            {/* Add Connection Card */}
            {isAddConnectionOpen && (
              <div className="glass-card add-connection-card">
                <h3>Configure Cloud Provider</h3>
                <form onSubmit={handleAddConnection} className="connection-form">
                  <label className="field">
                    <span>Storage Provider</span>
                    <select
                      value={connectionForm.provider}
                      onChange={(e) => setConnectionForm((p) => ({ ...p, provider: e.target.value }))}
                    >
                      <option value="aws">Amazon S3</option>
                      <option value="gcp">Google Cloud Storage</option>
                      <option value="r2">Cloudflare R2</option>
                      <option value="azure">Azure Blob Storage</option>
                      <option value="b2">Backblaze B2 (Mocked)</option>
                      <option value="oracle">Oracle Cloud Storage (Mocked)</option>
                      <option value="ibm">IBM Cloud Object Storage (Mocked)</option>
                    </select>
                  </label>

                  <div className="split-fields">
                    <label className="field">
                      <span>Display Name (e.g. My Backup Vault)</span>
                      <input
                        type="text"
                        value={connectionForm.displayName}
                        onChange={(e) => setConnectionForm((p) => ({ ...p, displayName: e.target.value }))}
                        placeholder="e.g. Production Buckets"
                        required
                      />
                    </label>

                    <label className="field">
                      <span>Bucket Name</span>
                      <input
                        type="text"
                        value={connectionForm.bucketName}
                        onChange={(e) => setConnectionForm((p) => ({ ...p, bucketName: e.target.value }))}
                        placeholder="e.g. my-secure-bucket"
                        required
                      />
                    </label>
                  </div>

                  <label className="field">
                    <span>Region (Optional)</span>
                    <input
                      type="text"
                      value={connectionForm.region}
                      onChange={(e) => setConnectionForm((p) => ({ ...p, region: e.target.value }))}
                      placeholder="e.g. us-east-1"
                    />
                  </label>

                  {/* AWS Credentials */}
                  {connectionForm.provider === 'aws' && (
                    <div className="provider-creds-box">
                      <h4>AWS S3 Keys</h4>
                      <label className="field">
                        <span>Access Key ID</span>
                        <input
                          type="text"
                          value={connectionForm.awsAccessKey}
                          onChange={(e) => setConnectionForm((p) => ({ ...p, awsAccessKey: e.target.value }))}
                          placeholder="e.g. AKIAIOSFODNN7EXAMPLE"
                        />
                      </label>
                      <label className="field">
                        <span>Secret Access Key</span>
                        <input
                          type="password"
                          value={connectionForm.awsSecretKey}
                          onChange={(e) => setConnectionForm((p) => ({ ...p, awsSecretKey: e.target.value }))}
                          placeholder="e.g. wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                        />
                      </label>
                    </div>
                  )}

                  {/* GCP Credentials */}
                  {connectionForm.provider === 'gcp' && (
                    <div className="provider-creds-box">
                      <h4>GCP Service Account Service Key</h4>
                      <label className="field">
                        <span>Credentials JSON Payload</span>
                        <textarea
                          rows={6}
                          value={connectionForm.gcpCredsJson}
                          onChange={(e) => setConnectionForm((p) => ({ ...p, gcpCredsJson: e.target.value }))}
                          placeholder='{ "type": "service_account", "project_id": ... }'
                        />
                      </label>
                    </div>
                  )}

                  {/* Cloudflare R2 Credentials */}
                  {connectionForm.provider === 'r2' && (
                    <div className="provider-creds-box">
                      <h4>Cloudflare R2 Keys</h4>
                      <label className="field">
                        <span>Access Key ID</span>
                        <input
                          type="text"
                          value={connectionForm.r2AccessKey}
                          onChange={(e) => setConnectionForm((p) => ({ ...p, r2AccessKey: e.target.value }))}
                          placeholder="R2 S3-Compatible API Access Key"
                        />
                      </label>
                      <label className="field">
                        <span>Secret Access Key</span>
                        <input
                          type="password"
                          value={connectionForm.r2SecretKey}
                          onChange={(e) => setConnectionForm((p) => ({ ...p, r2SecretKey: e.target.value }))}
                          placeholder="R2 S3-Compatible API Secret Key"
                        />
                      </label>
                      <label className="field">
                        <span>Custom Endpoint URL</span>
                        <input
                          type="text"
                          value={connectionForm.r2EndpointUrl}
                          onChange={(e) => setConnectionForm((p) => ({ ...p, r2EndpointUrl: e.target.value }))}
                          placeholder="https://<account-id>.r2.cloudflarestorage.com"
                        />
                      </label>
                    </div>
                  )}

                  {/* Azure Credentials */}
                  {connectionForm.provider === 'azure' && (
                    <div className="provider-creds-box">
                      <h4>Azure Storage Credentials</h4>
                      <label className="field">
                        <span>Blob Connection String</span>
                        <input
                          type="text"
                          value={connectionForm.azureConnStr}
                          onChange={(e) => setConnectionForm((p) => ({ ...p, azureConnStr: e.target.value }))}
                          placeholder="DefaultEndpointsProtocol=https;AccountName=..."
                        />
                      </label>
                    </div>
                  )}

                  <button className="primary-button" type="submit" style={{ marginTop: '1rem' }}>
                    🔌 Authenticate & Link Account
                  </button>
                </form>
              </div>
            )}

            {/* List Connections */}
            <div className="linked-connections-list">
              <h3>Currently Connected Accounts</h3>
              {connections.length === 0 ? (
                <div className="empty-state">
                  <p>No storage accounts linked. Configure one above to create your unified cloud storage.</p>
                </div>
              ) : (
                <div className="connection-list-grid">
                  {connections.map((c) => (
                    <div className="glass-card linked-connection-item" key={c.id}>
                      <div className="conn-info">
                        <h4>{c.display_name}</h4>
                        <p>{getProviderIcon(c.provider)}</p>
                        <small>Bucket: `{c.bucket_name}`</small>
                        {c.region && <small style={{ display: 'block' }}>Region: `{c.region}`</small>}
                      </div>
                      <button
                        className="disconnect-btn"
                        onClick={() => handleDeleteConnection(c.id)}
                      >
                        Disconnect Account
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Activity Logs */}
        {activeTab === 'activity' && (
          <div className="tab-panel activity-panel">
            <div className="glass-card activity-card">
              {activityLogs.length === 0 ? (
                <div className="empty-state">
                  <p>No actions logged yet.</p>
                </div>
              ) : (
                <div className="activity-list">
                  {activityLogs.map((log) => (
                    <div className="activity-item" key={log.id}>
                      <span className="activity-icon">
                        {log.action === 'upload' && '📤'}
                        {log.action === 'download' && '📥'}
                        {log.action === 'delete' && '🗑️'}
                        {log.action === 'connect' && '🔌'}
                        {log.action === 'disconnect' && '🔌'}
                        {log.action === 'register' && '🎉'}
                        {log.action === 'login' && '🔑'}
                        {log.action === 'credential_access' && '⚙️'}
                      </span>
                      <div className="activity-details">
                        <p className="activity-text">
                          Performed action **{log.action.toUpperCase()}**
                          {log.meta?.filename && ` on file "${log.meta.filename}"`}
                          {log.meta?.display_name && ` on connection "${log.meta.display_name}"`}
                        </p>
                        <span className="activity-time">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
