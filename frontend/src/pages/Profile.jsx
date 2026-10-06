import { useAuth } from '../auth/AuthContext';
import { planLabel, formatDate } from '../lib/utils';

export default function Profile() {
  const { user } = useAuth();

  const rows = [
    ['First name', user?.first_name],
    ['Last name', user?.last_name],
    ['Email', user?.email],
    ['Plan', planLabel(user?.plan)],
    ['Member since', formatDate(user?.created_at)],
    ['Account ID', user?.id],
  ];

  return (
    <div className="page-content-wrapper" style={{ maxWidth: 760 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Your account details as stored by the API.</p>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <span className="avatar" style={{ width: 60, height: 60, fontSize: '1.15rem' }}>
          {((user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')).toUpperCase() || 'U'}
        </span>
        <div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>
            {user ? `${user.first_name} ${user.last_name}` : ''}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '0.86rem' }}>{user?.email}</div>
          <span className="badge badge-accent" style={{ marginTop: 7 }}>{planLabel(user?.plan)} plan</span>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Details</h3>
        </div>
        <dl style={{ display: 'grid', gridTemplateColumns: '180px 1fr', rowGap: 14, columnGap: 16, margin: 0 }}>
          {rows.map(([label, value]) => (
            <div key={label} style={{ display: 'contents' }}>
              <dt style={{ color: 'var(--muted)', fontSize: '0.83rem', fontWeight: 600 }}>{label}</dt>
              <dd style={{ margin: 0, fontSize: '0.88rem', wordBreak: 'break-word' }}>{value || '—'}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
