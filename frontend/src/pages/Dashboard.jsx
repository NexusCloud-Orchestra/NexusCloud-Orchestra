import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HardDrive, Zap, Cloud, FileStack, ArrowRight, History } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { quotaApi, fileApi, authApi } from '../lib/api';
import { formatBytes, timeAgo } from '../lib/utils';
import DonutChart from '../components/DonutChart';
import EmptyState from '../components/EmptyState';
import Alert from '../components/Alert';
import { ProviderIcon, providerMeta } from '../components/providers';

export default function Dashboard() {
  const { user } = useAuth();
  const [quota, setQuota] = useState(null);
  const [files, setFiles] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([quotaApi.summary(), fileApi.list(), authApi.auditLogs()])
      .then(([q, f, a]) => {
        if (cancelled) return;
        if (q.status === 'fulfilled') setQuota(q.value);
        if (f.status === 'fulfilled') setFiles(f.value || []);
        if (a.status === 'fulfilled') setActivity(a.value || []);
        if (q.status === 'rejected' && f.status === 'rejected' && a.status === 'rejected') {
          setError('Could not load dashboard data. The API may be unreachable.');
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="page-content-wrapper">
        <div className="skeleton" style={{ height: 44, width: 320 }} />
        <div className="grid grid-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 128 }} />
          ))}
        </div>
        <div className="grid grid-2">
          <div className="skeleton" style={{ height: 280 }} />
          <div className="skeleton" style={{ height: 280 }} />
        </div>
      </div>
    );
  }

  const used = quota?.total_used_bytes ?? 0;
  const limit = quota?.total_limit_bytes ?? 0;
  const connections = quota?.by_connection ?? [];
  const recentFiles = files.slice(0, 6);
  const usagePct = limit > 0 ? Math.round((used / limit) * 100) : 0;

  const stats = [
    { icon: HardDrive, label: 'Storage pool', value: formatBytes(limit), meta: `${formatBytes(quota?.total_free_bytes ?? 0)} free` },
    { icon: Zap, label: 'Used', value: formatBytes(used), meta: `${usagePct}% of pool` },
    { icon: Cloud, label: 'Connected clouds', value: String(connections.length), meta: 'Active connections' },
    { icon: FileStack, label: 'Files', value: String(files.length), meta: 'Active objects' },
  ];

  return (
    <div className="page-content-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.first_name || 'there'}</h1>
          <p className="page-subtitle">Your multi-cloud pool at a glance.</p>
        </div>
        <div className="page-actions">
          <Link to="/connect-cloud" className="btn btn-ghost">Connect a cloud</Link>
          <Link to="/files" className="btn btn-primary">Upload files</Link>
        </div>
      </div>

      {error ? <Alert type="error">{error}</Alert> : null}

      <div className="grid grid-4">
        {stats.map((s) => (
          <div key={s.label} className="card stat-card">
            <span className="stat-icon"><s.icon size={19} /></span>
            <span className="stat-label">{s.label}</span>
            <span className="stat-value">{s.value}</span>
            <span className="stat-meta">{s.meta}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Storage usage</h3>
              <p className="card-subtitle">Pooled across connected clouds</p>
            </div>
            <Link to="/storage" className="btn btn-ghost btn-sm">
              Details <ArrowRight size={14} />
            </Link>
          </div>
          {limit > 0 ? (
            <DonutChart
              used={used}
              total={limit}
              segments={connections.map((c) => ({ id: c.connection_id, used: c.used_bytes }))}
            />
          ) : (
            <EmptyState
              icon={<Cloud size={26} />}
              title="No capacity yet"
              message="Connect a cloud provider to start building your storage pool."
              action={<Link to="/connect-cloud" className="btn btn-primary btn-sm">Connect a cloud</Link>}
            />
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Per-cloud usage</h3>
              <p className="card-subtitle">Free-tier estimates per connection</p>
            </div>
          </div>
          {connections.length === 0 ? (
            <EmptyState
              icon={<Cloud size={26} />}
              title="Nothing connected"
              message="Link AWS, Azure, GCP, R2, B2, Oracle or IBM to pool their free tiers."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {connections.map((c) => {
                const pct = c.limit_bytes > 0 ? Math.min((c.used_bytes / c.limit_bytes) * 100, 100) : 0;
                return (
                  <div key={c.connection_id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <ProviderIcon provider={c.provider} size={30} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
                        <strong style={{ fontSize: '0.86rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.display_name || providerMeta(c.provider).name}
                        </strong>
                        <span style={{ fontSize: '0.76rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                          {formatBytes(c.used_bytes)} / {formatBytes(c.limit_bytes)}
                        </span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card table-card">
          <div className="card-header" style={{ padding: 'var(--card-padding) var(--card-padding) 0' }}>
            <div>
              <h3 className="card-title">Recent files</h3>
              <p className="card-subtitle">Latest objects in your pool</p>
            </div>
            <Link to="/files" className="btn btn-ghost btn-sm">
              All files <ArrowRight size={14} />
            </Link>
          </div>
          {recentFiles.length === 0 ? (
            <EmptyState
              icon={<FileStack size={26} />}
              title="No files yet"
              message="Uploads you make will appear here with their placement."
              action={<Link to="/files" className="btn btn-primary btn-sm">Upload a file</Link>}
            />
          ) : (
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr><th>Name</th><th>Size</th><th>Uploaded</th></tr>
                </thead>
                <tbody>
                  {recentFiles.map((f) => (
                    <tr key={f.id}>
                      <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.original_name}
                      </td>
                      <td>{formatBytes(f.size_bytes)}</td>
                      <td style={{ color: 'var(--muted)' }}>{timeAgo(f.uploaded_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Recent activity</h3>
              <p className="card-subtitle">From your account audit trail</p>
            </div>
            <Link to="/security" className="btn btn-ghost btn-sm">
              Security <ArrowRight size={14} />
            </Link>
          </div>
          {activity.length === 0 ? (
            <EmptyState
              icon={<History size={26} />}
              title="No activity yet"
              message="Sign-ins, password changes and connection events will show up here."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {activity.slice(0, 6).map((event) => (
                <div key={event.id} style={{ display: 'flex', gap: 12, padding: '9px 4px', borderBottom: '1px solid var(--border)' }}>
                  <span className="legend-dot" style={{ marginTop: 6 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{event.action}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
                      {timeAgo(event.created_at)}{event.ip_address ? ` · ${event.ip_address}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
