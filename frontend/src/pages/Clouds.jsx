import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CloudCard from '../components/CloudCard';
import { API_URL } from '../config';

function Clouds() {
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form states
  const [provider, setProvider] = useState('aws');
  const [displayName, setDisplayName] = useState('');
  const [bucketName, setBucketName] = useState('');
  const [region, setRegion] = useState('us-east-1');
  
  // Dynamic credentials states
  const [key1, setKey1] = useState('');
  const [key2, setKey2] = useState('');

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    setLoading(true);
    const token = localStorage.getItem('nexus_access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/v1/quota/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.status === 401) {
        localStorage.removeItem('nexus_access_token');
        navigate('/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setConnections(data.by_connection || []);
      } else {
        setErrorMessage('Failed to load connections.');
      }
    } catch (err) {
      setErrorMessage('Network error loading connections.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAccount = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const token = localStorage.getItem('nexus_access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Build credentials dictionary dynamically based on provider
    let credentials = {};
    if (provider === 'aws' || provider === 'r2' || provider === 'b2') {
      credentials = {
        access_key_id: key1,
        secret_access_key: key2
      };
      if (provider === 'r2') {
        credentials.endpoint_url = key1.includes('http') ? key1 : `https://${key1}.r2.cloudflarestorage.com`;
      }
    } else if (provider === 'azure') {
      credentials = {
        connection_string: key1
      };
    } else if (provider === 'gcp') {
      try {
        credentials = {
          service_account_json: JSON.parse(key1)
        };
      } catch (err) {
        setErrorMessage('Invalid Service Account JSON format.');
        return;
      }
    }

    const payload = {
      provider,
      display_name: displayName,
      bucket_name: bucketName,
      region: region || null,
      credentials
    };

    try {
      const res = await fetch(`${API_URL}/api/v1/connections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessMessage('Cloud storage linked successfully!');
        // Reset form
        setDisplayName('');
        setBucketName('');
        setRegion('us-east-1');
        setKey1('');
        setKey2('');
        setShowModal(false);
        fetchConnections();
      } else {
        const errData = await res.json();
        setErrorMessage(errData.detail || 'Failed to link account.');
      }
    } catch (err) {
      setErrorMessage('Network error linking cloud account.');
    }
  };

  const handleDeleteConnection = async (connId) => {
    if (!window.confirm('Are you sure you want to unlink and delete this cloud connection?')) {
      return;
    }
    const token = localStorage.getItem('nexus_access_token');
    try {
      const res = await fetch(`${API_URL}/api/v1/connections/${connId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchConnections();
      } else {
        alert('Failed to delete connection.');
      }
    } catch (err) {
      alert('Network error unlinking connection.');
    }
  };

  return (
    <div className="page-content-wrapper">
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 32px;
          width: 100%;
          max-width: 550px;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.1);
          color: #1F2937;
          box-sizing: border-box;
          max-height: 90vh;
          overflow-y: auto;
        }
        .form-group-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 16px;
        }
        .form-label {
          font-size: 13.5px;
          font-weight: 600;
          color: #374151;
        }
        .form-select-box {
          height: 40px;
          padding: 0 12px;
          border: 1px solid #D1D5DB;
          border-radius: 6px;
          font-size: 14px;
          background-color: #FFFFFF;
          color: #1F2937;
          box-sizing: border-box;
        }
        .form-textarea-box {
          padding: 10px 12px;
          border: 1px solid #D1D5DB;
          border-radius: 6px;
          font-size: 14px;
          background-color: #FFFFFF;
          color: #1F2937;
          font-family: monospace;
          box-sizing: border-box;
          min-height: 100px;
          resize: vertical;
        }
      `}</style>

      <div className="welcome-header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="welcome-heading">Cloud Providers</h1>
          <p className="welcome-subtitle">Configure, reconnect, and monitor individual cloud endpoints.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-nav-action btn-nav-primary">
          ➕ Link Storage Account
        </button>
      </div>

      {successMessage && <div style={{ color: '#16A34A', padding: '12px', background: '#DCFCE7', borderRadius: '6px', marginBottom: '20px', fontWeight: 600 }}>{successMessage}</div>}
      {errorMessage && <div style={{ color: '#DC2626', padding: '12px', background: '#FEE2E2', borderRadius: '6px', marginBottom: '20px', fontWeight: 600 }}>{errorMessage}</div>}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', fontSize: '16px', color: '#6B7280' }}>Loading cloud storage endpoints...</div>
      ) : connections.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', background: '#FFFFFF', borderRadius: '8px', border: '1px dashed #D1D5DB' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>☁️</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#374151' }}>No Cloud Connections Linked</h3>
          <p style={{ margin: '0 0 20px 0', color: '#6B7280', fontSize: '14px' }}>Add your first S3, Azure, or GCP vault storage to establish a unified pool.</p>
          <button onClick={() => setShowModal(true)} className="btn-nav-action btn-nav-primary" style={{ margin: '0 auto' }}>Link Storage Account</button>
        </div>
      ) : (
        <div className="providers-grid">
          {connections.map((conn) => (
            <CloudCard
              key={conn.connection_id}
              provider={conn.provider}
              displayName={conn.display_name}
              bucketName={conn.bucket_name}
              status="connected"
              usedStorage={Number((conn.used_bytes / (1024 * 1024 * 1024)).toFixed(2))}
              limitStorage={Number((conn.limit_bytes / (1024 * 1024 * 1024)).toFixed(2))}
              onManage={() => handleDeleteConnection(conn.connection_id)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '22px', margin: '0 0 20px 0', fontWeight: 700 }}>Link Storage Account</h2>
            <form onSubmit={handleLinkAccount}>
              <div className="form-group-row">
                <div className="form-group">
                  <label className="form-label">Cloud Provider</label>
                  <select className="form-select-box" value={provider} onChange={(e) => setProvider(e.target.value)}>
                    <option value="aws">Amazon S3</option>
                    <option value="azure">Azure Blob Storage</option>
                    <option value="gcp">Google Cloud Storage</option>
                    <option value="r2">Cloudflare R2</option>
                    <option value="b2">Backblaze B2</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Display Name</label>
                  <input
                    type="text"
                    className="form-input-box"
                    placeholder="e.g. AWS Core Storage"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label className="form-label">Bucket / Container Name</label>
                  <input
                    type="text"
                    className="form-input-box"
                    placeholder="e.g. my-bucket-name"
                    value={bucketName}
                    onChange={(e) => setBucketName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Region (Optional)</label>
                  <input
                    type="text"
                    className="form-input-box"
                    placeholder="e.g. us-east-1"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                  />
                </div>
              </div>

              {provider === 'aws' || provider === 'r2' || provider === 'b2' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">
                      {provider === 'r2' ? 'Cloudflare Account ID (or Endpoint URL)' : 'Access Key ID'}
                    </label>
                    <input
                      type="text"
                      className="form-input-box"
                      placeholder={provider === 'r2' ? 'e.g. <account_id>' : 'e.g. AKIAIOSFODNN7EXAMPLE'}
                      value={key1}
                      onChange={(e) => setKey1(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Secret Access Key</label>
                    <input
                      type="password"
                      className="form-input-box"
                      placeholder="e.g. wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      value={key2}
                      onChange={(e) => setKey2(e.target.value)}
                      required
                    />
                  </div>
                </>
              ) : provider === 'azure' ? (
                <div className="form-group">
                  <label className="form-label">Connection String</label>
                  <textarea
                    className="form-textarea-box"
                    placeholder="DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net"
                    value={key1}
                    onChange={(e) => setKey1(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Service Account JSON</label>
                  <textarea
                    className="form-textarea-box"
                    placeholder='{ "type": "service_account", "project_id": "...", ... }'
                    value={key1}
                    onChange={(e) => setKey1(e.target.value)}
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-nav-action btn-nav-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-nav-action btn-nav-primary">
                  Authenticate & Link Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clouds;
