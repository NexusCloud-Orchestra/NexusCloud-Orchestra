import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PasswordInput from '../components/PasswordInput';
import '../css/Settings.css';

function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('nexus_access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (token === 'mock_demo_token') {
      setUser({
        first_name: 'Demo',
        last_name: 'User',
        email: 'demo@nexus.com',
        plan: 'pro',
      });
      setLoading(false);
      return;
    }

    fetch('http://localhost:8000/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch user data');
        }
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        localStorage.removeItem('nexus_access_token');
        localStorage.removeItem('nexus_refresh_token');
        navigate('/login');
      });
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    const nextErrors = {};

    if (!form.currentPassword) nextErrors.currentPassword = 'Current password is required.';
    if (!form.newPassword) {
      nextErrors.newPassword = 'New password is required.';
    } else if (form.newPassword.length < 8) {
      nextErrors.newPassword = 'New password must be at least 8 characters.';
    }
    if (form.confirmPassword !== form.newPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('nexus_access_token');
      if (token === 'mock_demo_token') {
        await new Promise((resolve) => setTimeout(resolve, 600));
        setSuccessMessage('Password changed successfully (Demo Mode)!');
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        return;
      }

      const res = await fetch('http://localhost:8000/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: form.currentPassword,
          new_password: form.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to change password');
      }

      setSuccessMessage('Password changed successfully!');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <p>Loading your profile settings...</p>
      </div>
    );
  }

  return (
    <div className="page-content-wrapper">
      <div className="welcome-header-section">
        <h1 className="welcome-heading">Orchestration Preferences</h1>
        <p className="welcome-subtitle">Configure security credentials, billing settings, and connection preferences.</p>
      </div>

      <div className="dashboard-grid-two-cols">
        <section className="settings-section">
          <h2 className="settings-section-title">Account Profile</h2>
          <p className="settings-section-desc">Details of the logged-in supervisor account.</p>
          
          <div className="user-profile-grid">
            <div className="info-item">
              <span className="info-label">Name</span>
              <span className="info-value">{user.first_name} {user.last_name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email Address</span>
              <span className="info-value">{user.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Current Plan</span>
              <span className={`plan-badge ${user.plan === 'pro' ? 'pro' : ''}`}>
                {user.plan}
              </span>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="settings-section-title">Change Password</h2>
          <p className="settings-section-desc">Update your credentials to keep your account secure.</p>

          {successMessage && <div className="success-banner">{successMessage}</div>}
          {errorMessage && <div className="error-banner">{errorMessage}</div>}

          <form onSubmit={handleChangePassword} className="settings-form" noValidate>
            <div className="input-container">
              <label htmlFor="settings-currentPassword" className="input-label">Current Password</label>
              <PasswordInput
                value={form.currentPassword}
                onChange={handleChange}
                name="currentPassword"
                placeholder="••••••••"
                id="settings-currentPassword"
                className={`corp-input ${errors.currentPassword ? 'is-invalid' : ''}`}
              />
              {errors.currentPassword && <div className="error-message">{errors.currentPassword}</div>}
            </div>

            <div className="input-container">
              <label htmlFor="settings-newPassword" className="input-label">New Password</label>
              <PasswordInput
                value={form.newPassword}
                onChange={handleChange}
                name="newPassword"
                placeholder="At least 8 characters"
                id="settings-newPassword"
                className={`corp-input ${errors.newPassword ? 'is-invalid' : ''}`}
              />
              {errors.newPassword && <div className="error-message">{errors.newPassword}</div>}
            </div>

            <div className="input-container">
              <label htmlFor="settings-confirmPassword" className="input-label">Confirm New Password</label>
              <PasswordInput
                value={form.confirmPassword}
                onChange={handleChange}
                name="confirmPassword"
                placeholder="••••••••"
                id="settings-confirmPassword"
                className={`corp-input ${errors.confirmPassword ? 'is-invalid' : ''}`}
              />
              {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
            </div>

            <button type="submit" className="btn-corp-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Updating password...' : 'Update Password'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default Settings;
