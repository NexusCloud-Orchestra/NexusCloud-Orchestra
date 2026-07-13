import { useState } from 'react';
import PasswordInput from './PasswordInput';
import '../css/SecurityCards.css';

function PasswordCard() {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (success) setSuccess(false);
    if (error) setError('');
  };

  // Validation checks
  const valLength = form.newPassword.length >= 8;
  const valUpper = /[A-Z]/.test(form.newPassword);
  const valLower = /[a-z]/.test(form.newPassword);
  const valNumber = /[0-9]/.test(form.newPassword);
  const valSpecial = /[^A-Za-z0-9]/.test(form.newPassword);

  // Score calculation
  const totalCriteria = [valLength, valUpper, valLower, valNumber, valSpecial];
  const metCount = totalCriteria.filter(Boolean).length;
  
  let strengthLabel = 'Very Weak';
  let strengthColor = '#DC2626';
  let strengthWidth = '20%';

  if (form.newPassword.length > 0) {
    if (metCount === 5) {
      strengthLabel = 'Strong (Excellent)';
      strengthColor = '#16A34A';
      strengthWidth = '100%';
    } else if (metCount >= 3) {
      strengthLabel = 'Medium';
      strengthColor = '#F59E0B';
      strengthWidth = '60%';
    } else {
      strengthLabel = 'Weak';
      strengthColor = '#DC2626';
      strengthWidth = '40%';
    }
  } else {
    strengthWidth = '0%';
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError('All password fields are required.');
      return;
    }

    if (metCount < 5) {
      setError('Password does not meet all security requirements.');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    // Simulate change password
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError('Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="security-card">
      <div className="security-card-header">
        <h3 className="security-card-title">🔑 Password Management</h3>
        <p className="security-card-desc">Update your login password and manage credentials.</p>
      </div>

      {success && <div className="success-banner">Password Updated Successfully</div>}
      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit} className="settings-form" noValidate>
        <div className="security-form-group">
          <label htmlFor="sec-currentPassword" className="security-input-label">Current Password</label>
          <PasswordInput
            value={form.currentPassword}
            onChange={handleChange}
            name="currentPassword"
            placeholder="••••••••"
            id="sec-currentPassword"
            className="security-input"
          />
        </div>

        <div className="security-form-group">
          <label htmlFor="sec-newPassword" className="security-input-label">New Password</label>
          <PasswordInput
            value={form.newPassword}
            onChange={handleChange}
            name="newPassword"
            placeholder="Enter secure new password"
            id="sec-newPassword"
            className="security-input"
          />
        </div>

        {form.newPassword && (
          <div className="pwd-strength-container">
            <div className="pwd-strength-bar-bg">
              <div 
                className="pwd-strength-bar" 
                style={{ width: strengthWidth, backgroundColor: strengthColor }}
              ></div>
            </div>
            <span className="pwd-strength-label" style={{ color: strengthColor }}>
              Strength: {strengthLabel}
            </span>
          </div>
        )}

        <div className="pwd-requirements-grid">
          <div className={`pwd-req-item ${valLength ? 'met' : 'unmet'}`}>
            <span>{valLength ? '✔' : '○'}</span> Minimum 8 characters
          </div>
          <div className={`pwd-req-item ${valUpper ? 'met' : 'unmet'}`}>
            <span>{valUpper ? '✔' : '○'}</span> Uppercase letter
          </div>
          <div className={`pwd-req-item ${valLower ? 'met' : 'unmet'}`}>
            <span>{valLower ? '✔' : '○'}</span> Lowercase letter
          </div>
          <div className={`pwd-req-item ${valNumber ? 'met' : 'unmet'}`}>
            <span>{valNumber ? '✔' : '○'}</span> Number
          </div>
          <div className={`pwd-req-item ${valSpecial ? 'met' : 'unmet'}`}>
            <span>{valSpecial ? '✔' : '○'}</span> Special character
          </div>
        </div>

        <div className="security-form-group">
          <label htmlFor="sec-confirmPassword" className="security-input-label">Confirm New Password</label>
          <PasswordInput
            value={form.confirmPassword}
            onChange={handleChange}
            name="confirmPassword"
            placeholder="••••••••"
            id="sec-confirmPassword"
            className="security-input"
          />
        </div>

        <button 
          type="submit" 
          className="security-button security-button-primary" 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Updating Password...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}

export default PasswordCard;
