import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cloud, Plus, Unlink, MapPin, CalendarDays } from 'lucide-react';
import { connectionApi, quotaApi } from '../lib/api';
import { formatBytes, formatDate } from '../lib/utils';
import { ProviderIcon, providerMeta } from '../components/providers';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';

export default function Clouds() {
  const [connections, setConnections] = useState([]);
  const [usage, setUsage] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingDisconnect, setPendingDisconnect] = useState(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectError, setDisconnectError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const results = await Promise.all([connectionApi.list(), quotaApi.summary()]);
      const conns = results[0] || [];
      setConnections(conns);
      const byId = {};
      ((results[1] && results[1].by_connection) || []).forEach((c) => {
        byId[c.connection_id] = c;
      });
      setUsage(byId);
    } catch (err) {
      setError(err.message || 'Could not load connections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDisconnect = async () => {
    if (!pendingDisconnect) return;
    setDisconnecting(true);
    setDisconnectError('');
    try {
      await connectionApi.remove(pendingDisconnect.id);
      setPendingDisconnect(null);
      await load();
    } catch (err) {
      if (err.status === 409) {
        setDisconnectError(
          'Active files remain on this cloud. Delete those files first, then disconnect.'
        );
      } else {
        setDisconnectError(err.message || 'Could not disconnect this cloud.');
      }
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="page-content-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clouds</h1>
          <p className="page-subtitle">
            Your connected storage providers. Credentials are encrypted at rest and never shown again after linking.
          </p>
        </div>
        <div className="page-actions">
          <Link to="/connect-cloud" className="btn btn-primary"><Plus size={16} /> Connect a cloud</Link>
        </div>
      </div>

      {error ? <Alert type="error">{error}</Alert> : null}

      {loading ? (
        <div className="grid grid-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: 190 }} />
          ))}
        </div>
      ) : connections.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Cloud size={26} />}
            title="No clouds connected"
            message="Link a provider to pool its free tier into your storage. You can connect AWS, Azure, GCP, R2, B2, Oracle or IBM."
            action={<Link to="/connect-cloud" className="btn btn-primary btn-sm">Connect your first cloud</Link>}
          />
        </div>
      ) : (
        <div className="grid grid-3">
          {connections.map((conn) => {
            const u = usage[conn.id];
            const pct = u && u.limit_bytes > 0 ? Math.min((u.used_bytes / u.limit_bytes) * 100, 100) : 0;
            return (
              <div key={conn.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <ProviderIcon provider={conn.provider} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conn.display_name}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>
                      {providerMeta(conn.provider).name}
                    </div>
                  </div>
                  {conn.is_active ? (
                    <span className="badge badge-success">Active</span>
                  ) : (
                    <span className="badge badge-neutral">Inactive</span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: '0.82rem', color: 'var(--muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Cloud size={13} /> <span className="mono">{conn.bucket_name}</span>
                  </span>
                  {conn.region ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <MapPin size={13} /> {conn.region}
                    </span>
                  ) : null}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CalendarDays size={13} /> Linked {formatDate(conn.created_at)}
                  </span>
                </div>

                {u ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--muted)', marginBottom: 5 }}>
                      <span>{formatBytes(u.used_bytes)} used</span>
                      <span>{formatBytes(u.limit_bytes)} est. limit</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ) : null}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      setDisconnectError('');
                      setPendingDisconnect(conn);
                    }}
                  >
                    <Unlink size={14} /> Disconnect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pendingDisconnect ? (
        <Modal
          title={`Disconnect "${pendingDisconnect.display_name}"?`}
          subtitle={`${providerMeta(pendingDisconnect.provider).name} · ${pendingDisconnect.bucket_name}`}
          onClose={() => {
            if (!disconnecting) setPendingDisconnect(null);
          }}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setPendingDisconnect(null)} disabled={disconnecting}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDisconnect} disabled={disconnecting}>
                {disconnecting ? <span className="spinner" /> : null}
                Disconnect
              </button>
            </>
          }
        >
          {disconnectError ? <Alert type="error">{disconnectError}</Alert> : null}
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.55 }}>
            The stored credentials for this connection are purged immediately on disconnect.
            If any files still live on this cloud, the request is refused — delete them first so
            you do not lose access to your data.
          </p>
        </Modal>
      ) : null}
    </div>
  );
}
