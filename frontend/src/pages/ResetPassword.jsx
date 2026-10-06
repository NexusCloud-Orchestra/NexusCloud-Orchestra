import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import Alert from '../components/Alert';
import { authApi } from '../lib/api';
import { detailsToFieldErrors } from '../lib/utils';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  // The email link lands on /reset-password?token=...&email=...
  const [email, setEmail] = useState(params.get('email') || '');
  const [token] = useState(params.get('token') || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const passwordBytes = new TextEncoder().encode(password).length;
  const rules = [
    { ok: password.length >= 8, label: 'At least 8 characters' },
    { ok: password.length > 0 && passwordBytes <= 72, label: 'At most 72 bytes (UTF-8)' },
    { ok: confirm.length > 0 && confirm === password, label: 'Passwords match' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!email.trim()) next.email = 'Email is required.';
    if (!token) next.token = 'The reset link is missing its token. Request a new link.';
    if (password.length < 8) next.password = 'Password must be at least 8 characters.';
    else if (passwordBytes > 72) next.password = 'Password must be at most 72 bytes (UTF-8).';
    if (confirm !== password) next.confirm = 'Passwords do not match.';
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    setErrors({});
    setErrorMessage('');
    setSubmitting(true);
    try {
      await authApi.resetPassword({
        email: email.trim(),
        token,
        new_password: password,
      });
      navigate('/login', { replace: true, state: { passwordReset: true } });
    } catch (err) {
      setErrors(detailsToFieldErrors(err.details));
      setErrorMessage(err.message || 'Could not reset the password. The link may have expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="auth-card-heading">Choose a new password</h1>
      <p className="auth-card-sub">Reset links are single-use. After this you can sign in with the new password.</p>

      {errors.token ? <Alert type="error">{errors.token}</Alert> : null}
      {errorMessage ? <Alert type="error">{errorMessage}</Alert> : null}

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label className="field-label" htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            className={`input${errors.email ? ' has-error' : ''}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
          {errors.email ? <span className="field-error">{errors.email}</span> : null}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="password">New password</label>
          <PasswordInput
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="new-password"
          />
          {errors.password ? <span className="field-error">{errors.password}</span> : null}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="confirm">Confirm new password</label>
          <PasswordInput
            id="confirm"
            name="confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={errors.confirm}
            autoComplete="new-password"
          />
          {errors.confirm ? <span className="field-error">{errors.confirm}</span> : null}
        </div>

        {password ? (
          <div className="password-rules">
            {rules.map((rule) => (
              <span key={rule.label} className={`password-rule${rule.ok ? ' ok' : ''}`}>
                {rule.ok ? <Check size={13} /> : <X size={13} />}
                {rule.label}
              </span>
            ))}
          </div>
        ) : null}

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !token}>
          {submitting ? <span className="spinner" /> : null}
          {submitting ? 'Resetting…' : 'Reset password'}
        </button>
      </form>

      <p className="auth-card-foot">
        <Link to="/forgot-password">Request a new link</Link> · <Link to="/login">Back to sign in</Link>
      </p>
    </AuthLayout>
  );
}
