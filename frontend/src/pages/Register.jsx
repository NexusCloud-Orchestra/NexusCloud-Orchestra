import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import Alert from '../components/Alert';
import { useAuth } from '../auth/AuthContext';
import { detailsToFieldErrors } from '../lib/utils';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // Contract: password minimum 8 characters, maximum 72 UTF-8 bytes.
  const passwordBytes = new TextEncoder().encode(form.password).length;
  const rules = [
    { ok: form.password.length >= 8, label: 'At least 8 characters' },
    { ok: form.password.length > 0 && passwordBytes <= 72, label: 'At most 72 bytes (UTF-8)' },
    { ok: form.confirmPassword.length > 0 && form.confirmPassword === form.password, label: 'Passwords match' },
  ];

  const validate = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required.';
    if (!form.lastName.trim()) next.lastName = 'Last name is required.';
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (form.password.length < 8) next.password = 'Password must be at least 8 characters.';
    else if (passwordBytes > 72) next.password = 'Password must be at most 72 bytes (UTF-8).';
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.';
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = validate();
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    setErrors({});
    setErrorMessage('');
    setSubmitting(true);
    try {
      await register({
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate('/login', {
        state: { registered: true },
        replace: true,
      });
    } catch (err) {
      setErrors(detailsToFieldErrors(err.details));
      setErrorMessage(err.message || 'Could not create your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="auth-card-heading">Create your account</h1>
      <p className="auth-card-sub">Start pooling free-tier storage across your clouds.</p>

      {errorMessage ? <Alert type="error">{errorMessage}</Alert> : null}

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label className="field-label" htmlFor="firstName">First name</label>
            <input
              id="firstName"
              name="firstName"
              className={`input${errors.firstName ? ' has-error' : ''}`}
              value={form.firstName}
              onChange={handleChange}
              placeholder="Ada"
              autoComplete="given-name"
              autoFocus
            />
            {errors.firstName ? <span className="field-error">{errors.firstName}</span> : null}
          </div>
          <div className="field">
            <label className="field-label" htmlFor="lastName">Last name</label>
            <input
              id="lastName"
              name="lastName"
              className={`input${errors.lastName ? ' has-error' : ''}`}
              value={form.lastName}
              onChange={handleChange}
              placeholder="Lovelace"
              autoComplete="family-name"
            />
            {errors.lastName ? <span className="field-error">{errors.lastName}</span> : null}
          </div>
        </div>

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
            autoComplete="new-password"
          />
          {errors.password ? <span className="field-error">{errors.password}</span> : null}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="confirmPassword">Confirm password</label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />
          {errors.confirmPassword ? <span className="field-error">{errors.confirmPassword}</span> : null}
        </div>

        {form.password ? (
          <div className="password-rules">
            {rules.map((rule) => (
              <span key={rule.label} className={`password-rule${rule.ok ? ' ok' : ''}`}>
                {rule.ok ? <Check size={13} /> : <X size={13} />}
                {rule.label}
              </span>
            ))}
          </div>
        ) : null}

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? <span className="spinner" /> : null}
          {submitting ? 'Creating account…' : 'Create account'}
        </button>

        <p className="auth-terms">
          By creating an account you agree to connect only cloud accounts you own or are
          authorized to use.
        </p>
      </form>

      <p className="auth-card-foot">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
