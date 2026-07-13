import { useState } from 'react';
import '../css/SecurityTable.css';
import '../css/SecurityCards.css';

function ApiKeys() {
  const [keys, setKeys] = useState([
    {
      id: 1,
      name: 'Prod Orchestrator Backend',
      created: '2026-06-01',
      lastUsed: '2026-07-13',
      permissions: ['read', 'write'],
      status: 'Active',
      value: 'nx_key_a8d79f...31bc',
    },
    {
      id: 2,
      name: 'Staging sync script',
      created: '2026-07-10',
      lastUsed: '2026-07-11',
      permissions: ['read'],
      status: 'Active',
      value: 'nx_key_90fb12...e4a7',
    },
  ]);
  const [copiedId, setCopiedId] = useState(null);

  const handleGenerate = () => {
    const newKey = {
      id: Date.now(),
      name: `New API Key ${keys.length + 1}`,
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Never',
      permissions: ['read', 'write'],
      status: 'Active',
      value: 'nx_key_' + Math.random().toString(36).substr(2, 8) + '...' + Math.random().toString(36).substr(2, 4),
    };
    setKeys((prev) => [...prev, newKey]);
  };

  const handleRevoke = (id) => {
    setKeys((prev) => prev.filter((k) => k.id !== id));
  };

  const handleCopy = (id) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="security-card" style={{ gridColumn: 'span 2' }}>
      <div className="table-filter-header">
        <div>
          <h3 className="table-title">🔑 API Keys</h3>
          <p className="security-card-desc">Generate S3-compatible credentials to automate orchestrations programmatically.</p>
        </div>
        <button 
          onClick={handleGenerate} 
          className="security-button security-button-primary"
        >
          Generate API Key
        </button>
      </div>

      <div className="security-table-container">
        <table className="security-table">
          <thead>
            <tr>
              <th>Key Name</th>
              <th>Created</th>
              <th>Last Used</th>
              <th>Permissions</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id}>
                <td style={{ fontWeight: 600 }}>{k.name}</td>
                <td>{k.created}</td>
                <td>{k.lastUsed}</td>
                <td>
                  <div className="api-permissions-list">
                    {k.permissions.map((p, idx) => (
                      <span key={idx} className="api-permission-tag">{p}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <span className="status-badge status-badge-success">
                    {k.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleCopy(k.id)}
                      className="security-button security-button-secondary"
                      style={{ height: '28px', padding: '0 8px', fontSize: '11px' }}
                    >
                      {copiedId === k.id ? 'Copied' : 'Copy Key'}
                    </button>
                    <button 
                      onClick={() => handleRevoke(k.id)}
                      className="security-button security-button-secondary"
                      style={{ height: '28px', padding: '0 8px', fontSize: '11px', color: '#DC2626', border: '1px solid #FCA5A5' }}
                    >
                      Revoke
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#6B7280' }}>
                  No API Keys configured. Click generate to start.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ApiKeys;
