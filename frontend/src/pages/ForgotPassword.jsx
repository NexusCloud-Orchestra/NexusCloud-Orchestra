import { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';
import '../css/Login.css'; // Reuse Login layout styles


function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email) {
      setError('Email is required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Request failed. Please try again.');
      }

      setSuccess(true);
      setIsSubmitting(false);
    } catch (err) {
      setIsSubmitting(false);
      setError(err.message);
    }
  };

  return (
    <div className="auth-page login-page">
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />
      <div className="background-orb orb-three" />

      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">N</div>
          <div>
            <h1>Nexus</h1>
            <p>Password recovery</p>
          </div>
        </div>

        <div className="auth-header">
          <h2>Reset Password</h2>
          <p>Retrieve access to your cloud storage.</p>
        </div>

        {success ? (
          <div className="success-box" style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div className="success-icon" style={{ fontSize: '3rem', color: '#10b981', marginBottom: '1rem' }}>✓</div>
            <h3 style={{ color: 'var(--text-color)', marginBottom: '0.5rem' }}>Instructions Sent!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              If your email is registered, a reset token has been printed to the **backend terminal logs**.
              Please check your backend output and proceed to the reset page.
            </p>
            <div style={{ marginTop: '1.5rem' }}>
              <Link to="/login" className="primary-button" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center', width: 'auto', padding: '0.75rem 2rem' }}>
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {error && <div className="field-error form-error" style={{ marginBottom: '1rem', color: '#ff4a4a', textAlign: 'center' }}>{error}</div>}
            
            <label className="field">
              <span>Email Address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>

            <button className="primary-button" type="submit" disabled={isSubmitting} style={{ marginTop: '1rem' }}>
              {isSubmitting ? <span className="spinner" /> : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="bottom-link">
          Remember your password? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
