import { useEffect, useState } from 'react';
import { PieChart } from 'lucide-react';
import { quotaApi } from '../lib/api';
import { formatBytes } from '../lib/utils';
import DonutChart from '../components/DonutChart';
import EmptyState from '../components/EmptyState';
import Alert from '../components/Alert';
import { ProviderIcon, providerMeta } from '../components/providers';

export default function Storage() {
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    quotaApi
      .summary()
      .then(setQuota)
      .catch((err) => setError(err.message || 'Could not load quota.'))
      .finally(() => setLoading(false));
  }, []);

  const used = quota?.total_used_bytes ?? 0;
  const limit = quota?.total_limit_bytes ?? 0;
  const free = quota?.total_free_bytes ?? 0;
  const conns = quota?.by_connection ?? [];

  return (
    <div className="page-content-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Storage</h1>
          <p className="page-subtitle">
            Capacity figures are provider free-tier estimates, not live billing balances.
            Pending uploads reserve capacity until they expire.
          </p>
        </div>
      </div>

      {error ? <Alert type="error">{error}</Alert> : null}

      {loading ? (
        <div className="grid grid-2">
          <div className="skeleton" style={{ height: 260 }} />
          <div className="skeleton" style={{ height: 260 }} />
        </div>
      ) : limit === 0 && conns.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<PieChart size={26} />}
            title="No storage pool yet"
            message="Connect a cloud provider to start building pooled capacity."
          />
        </div>
      ) : (
        <>
          <div className="grid grid-3">
            <div className="card stat-card">
              <span className="stat-label">Total pool</span>
              <span className="stat-value">{formatBytes(limit)}</span>
              <span className="stat-meta">Across {conns.length} connection{conns.length === 1 ? '' : 's'}</span>
            </div>
            <div className="card stat-card">
              <span className="stat-label">Used</span>
              <span className="stat-value">{formatBytes(used)}</span>
              <span className="stat-meta">{quota?.usage_percentage ?? 0}% of pool</span>
            </div>
            <div className="card stat-card">
              <span className="stat-label">Free</span>
              <span className="stat-value">{formatBytes(free)}</span>
              <span className="stat-meta">Available for new uploads</span>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Usage</h3>
                  <p className="card-subtitle">Used vs free, per connection</p>
                </div>
              </div>
              <DonutChart
                used={used}
                total={limit}
                segments={conns.map((c) => ({ id: c.connection_id, used: c.used_bytes }))}
              />
            </div>

            <div className="card table-card">
              <div className="card-header" style={{ padding: 'var(--card-padding) var(--card-padding) 0' }}>
                <div>
                  <h3 className="card-title">Per-connection breakdown</h3>
                  <p className="card-subtitle">Used / reserved / estimated limit</p>
                </div>
              </div>
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Connection</th>
                      <th>Used</th>
                      <th>Reserved</th>
                      <th>Est. limit</th>
                      <th>Free</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conns.map((c) => (
                      <tr key={c.connection_id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <ProviderIcon provider={c.provider} size={24} />
                            <div>
                              <div style={{ fontWeight: 600 }}>{c.display_name || providerMeta(c.provider).name}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{providerMeta(c.provider).name}</div>
                            </div>
                          </div>
                        </td>
                        <td>{formatBytes(c.used_bytes)}</td>
                        <td style={{ color: 'var(--muted)' }}>{formatBytes(c.reserved_bytes)}</td>
                        <td>{formatBytes(c.limit_bytes)}</td>
                        <td style={{ color: 'var(--success)' }}>{formatBytes(c.free_bytes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
