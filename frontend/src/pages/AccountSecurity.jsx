import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, History, KeyRound, LogOut } from 'lucide-react';
import { authApi } from '../lib/api';
import { useAuth } from '../auth/AuthContext';
import { formatDate, timeAgo, detailsToFieldErrors } from '../lib/utils';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import PasswordInput from '../components/PasswordInput';

export default function AccountSecurity() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [error, setError] = useState('');

  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwNotice, setPwNotice] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);

  useEffect(() => {
    authApi
      .auditLogs()
      .then((l) => setLogs(l || []))
      .catch((err) => setError(err.message || 'Could not load activity.'))
      .finally(() => setLoadingLogs(false));
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const next = {};
    if (!pwForm.current_password) next.current_password = 'Enter your current password.';
    if (pwForm.new_password.length < 8) next.new_password = 'At least 8 characters.';
    else if (new TextEncoder().encode(pwForm.new_password).length > 72) next.new_password = 'At most 72 bytes (UTF-8).';
    if (pwForm.confirm !== pwForm.new_password) next.confirm = 'Passwords do not match.';
    if (Object.keys(next).length) {
      setPwErrors(next);
      return;
    }
    setPwErrors({});
    setPwNotice('');
    setError('');
    setPwSubmitting(true);
    try {
      await authApi.changePassword({
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      setPwNotice('Password changed. For your security, sign in again on this device.');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setPwErrors(detailsToFieldErrors(err.details));
      setError(err.message || 'Could not change the password.');
    } finally {
      setPwSubmitting(false);
    }
  };

  const handleLogoutAll = async () => {
    // Contract: logout revokes every refresh session and invalidates access tokens.
    await logout();
    navigate('/login');
  };

  return (
    <div className="page-content-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Account Security</h1>
          <p className="page-subtitle">Sign-in activity, password management and session controls.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-danger" onClick={handleLogoutAll}>
            <LogOut size={15} /> Sign out everywhere
          </button>
        </div>
      </div>

      {error ? <Alert type="error">{error}</Alert> : null}
      {pwNotice ? <Alert type="success">{pwNotice}</Alert> : null}

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <KeyRound size={16} /> Change password
              </h3>
              <p className="card-subtitle">You will need to sign in again after changing it.</p>
            </div>
          </div>
          <form onSubmit={handleChangePassword} noValidate>
            <div className="field">
              <label className="field-label" htmlFor="current_password">Current password</label>
              <PasswordInput
                id="current_password"
                name="current_password"
                value={pwForm.current_password}
                onChange={(e) => setPwForm((p) => ({ ...p, current_password: e.target.value }))}
                error={pwErrors.current_password}
              />
              {pwErrors.current_password ? <span className="field-error">{pwErrors.current_password}</span> : null}
            </div>
            <div className="field">
              <label className="field-label" htmlFor="new_password">New password</label>
              <PasswordInput
                id="new_password"
                name="new_password"
                value={pwForm.new_password}
                onChange={(e) => setPwForm((p) => ({ ...p, new_password: e.target.value }))}
                error={pwErrors.new_password}
                autoComplete="new-password"
              />
              {pwErrors.new_password ? <span className="field-error">{pwErrors.new_password}</span> : null}
            </div>
            <div className="field">
              <label className="field-label" htmlFor="confirm_new">Confirm new password</label>
              <PasswordInput
                id="confirm_new"
                name="confirm"
                value={pwForm.confirm}
                onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                error={pwErrors.confirm}
                autoComplete="new-password"
              />
              {pwErrors.confirm ? <span className="field-error">{pwErrors.confirm}</span> : null}
            </div>
            <button type="submit" className="btn btn-primary" disabled={pwSubmitting}>
              {pwSubmitting ? <span className="spinner" /> : null}
              Update password
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <History size={16} /> Sign-in activity
              </h3>
              <p className="card-subtitle">Newest first, up to 100 events.</p>
            </div>
          </div>
          {loadingLogs ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: 40 }} />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck size={26} />}
              title="No activity recorded"
              message="Security events will appear here once they happen."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 380, overflowY: 'auto' }}>
              {logs.map((log) => (
                <div key={log.id} style={{ display: 'flex', gap: 12, padding: '9px 4px', borderBottom: '1px solid var(--border)' }}>
                  <span className="legend-dot" style={{ marginTop: 6 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{log.action}</div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--muted)' }}>
                      <span title={formatDate(log.created_at)}>{timeAgo(log.created_at)}</span>
                      {log.ip_address ? ` · ${log.ip_address}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <Alert type="info" title="Not available yet">
          Two-factor authentication, per-device session management and API keys are later-phase
          features without a backend contract. They are intentionally not shown here rather than
          presented with placeholder controls.
        </Alert>
      </div>
    </div>
  );
}
