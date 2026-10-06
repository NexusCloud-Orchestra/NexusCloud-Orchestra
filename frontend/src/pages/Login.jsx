import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import Alert from '../components/Alert';
import { useAuth } from '../auth/AuthContext';
import { detailsToFieldErrors } from '../lib/utils';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!form.email.trim()) nextErrors.email = 'Enter your email address.';
    if (!form.password) nextErrors.password = 'Enter your password.';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setErrorMessage('');
    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setErrors(detailsToFieldErrors(err.details));
      setErrorMessage(err.message || 'Sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="auth-card-heading">Welcome back</h1>
      <p className="auth-card-sub">Sign in to orchestrate your connected clouds.</p>

      {errorMessage ? <Alert type="error">{errorMessage}</Alert> : null}

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label className="field-label" htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            className={`input${errors.email ? ' has-error' : ''}`}
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
            autoFocus
          />
          {errors.email ? <span className="field-error">{errors.email}</span> : null}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="password">Password</label>
          <PasswordInput
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />
          {errors.password ? <span className="field-error">{errors.password}</span> : null}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '-6px 0 18px' }}>
          <Link to="/forgot-password" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
            Forgot password?
          </Link>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? <span className="spinner" /> : null}
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="auth-card-foot">
        New to NexusCloud? <Link to="/register">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
