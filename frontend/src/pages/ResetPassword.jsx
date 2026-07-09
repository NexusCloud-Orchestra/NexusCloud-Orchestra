import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import '../css/Login.css';


function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-populate token and email from URL query params
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');
    if (tokenParam) setToken(tokenParam);
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!email || !token || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          token,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Reset failed. The token may be invalid or expired.');
      }

      setSuccess(true);
      setIsSubmitting(false);
      setTimeout(() => navigate('/login'), 3000);
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
            <p>Set new password</p>
          </div>
        </div>

        <div className="auth-header">
          <h2>Reset Password</h2>
          <p>Please enter the token and choose a new password.</p>
        </div>

        {success ? (
          <div className="success-box" style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div className="success-icon" style={{ fontSize: '3rem', color: '#10b981', marginBottom: '1rem' }}>✓</div>
            <h3 style={{ color: 'var(--text-color)', marginBottom: '0.5rem' }}>Password Updated!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Your password has been successfully reset. Redirecting you to login...
            </p>
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

            <label className="field">
              <span>Reset Token</span>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token from console"
              />
            </label>

            <label className="field">
              <span>New Password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
            </label>

            <label className="field">
              <span>Confirm New Password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
              />
            </label>

            <button className="primary-button" type="submit" disabled={isSubmitting} style={{ marginTop: '1rem' }}>
              {isSubmitting ? <span className="spinner" /> : 'Update Password'}
            </button>
          </form>
        )}

        <p className="bottom-link">
          Back to <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;
