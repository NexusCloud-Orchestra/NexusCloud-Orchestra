import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Alert from '../components/Alert';
import { authApi } from '../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Enter your email address.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true); // generic response regardless of whether the email exists
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="auth-card-heading">Reset your password</h1>
      <p className="auth-card-sub">
        Enter the email on your account. If it exists, we will send a reset link.
      </p>

      {sent ? (
        <>
          <Alert type="success" title="Check your inbox">
            If an account exists for <strong>{email}</strong>, a password reset link is on its way.
            Follow it to choose a new password.
          </Alert>
          <p className="auth-card-sub" style={{ marginBottom: 0 }}>
            In a development environment without SMTP configured, no email is actually sent.
          </p>
          <p className="auth-card-foot">
            Remembered it? <Link to="/login">Back to sign in</Link>
          </p>
        </>
      ) : (
        <>
          {error ? <Alert type="error">{error}</Alert> : null}
          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label className="field-label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className={`input${error ? ' has-error' : ''}`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
              />
              {error ? <span className="field-error">{error}</span> : null}
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? <span className="spinner" /> : null}
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
          <p className="auth-card-foot">
            Remembered it? <Link to="/login">Back to sign in</Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
