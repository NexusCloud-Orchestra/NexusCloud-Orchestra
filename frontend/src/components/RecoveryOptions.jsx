import { useState } from 'react';
import '../css/SecurityCards.css';

function RecoveryOptions() {
  const [email, setEmail] = useState('rec_backup@nexuscloud.com');
  const [phone, setPhone] = useState('+1 (555) 019-2834');
  const [contact, setContact] = useState('Sec Ops Admin Team');
  const [isEditing, setIsEditing] = useState(false);
  const [tempEmail, setTempEmail] = useState(email);
  const [tempPhone, setTempPhone] = useState(phone);
  const [message, setMessage] = useState('');

  const handleUpdate = () => {
    setEmail(tempEmail);
    setPhone(tempPhone);
    setIsEditing(false);
    setMessage('Recovery credentials updated successfully.');
  };

  return (
    <div className="security-card">
      <div className="security-card-header">
        <h3 className="security-card-title">🛡️ Recovery Options</h3>
        <p className="security-card-desc">Configure backup contact routes to restore supervisor permissions.</p>
      </div>

      {message && <div className="success-banner">{message}</div>}

      <div className="recovery-options-grid">
        <div className="recovery-option-row">
          <div className="recovery-option-info">
            <span className="recovery-option-label">Recovery Email</span>
            {isEditing ? (
              <input 
                type="email" 
                value={tempEmail}
                onChange={(e) => setTempEmail(e.target.value)}
                className="security-input"
                style={{ marginTop: '4px' }}
              />
            ) : (
              <span className="recovery-option-value">{email}</span>
            )}
          </div>
        </div>

        <div className="recovery-option-row">
          <div className="recovery-option-info">
            <span className="recovery-option-label">Recovery Phone</span>
            {isEditing ? (
              <input 
                type="text" 
                value={tempPhone}
                onChange={(e) => setTempPhone(e.target.value)}
                className="security-input"
                style={{ marginTop: '4px' }}
              />
            ) : (
              <span className="recovery-option-value">{phone}</span>
            )}
          </div>
        </div>

        <div className="recovery-option-row">
          <div className="recovery-option-info">
            <span className="recovery-option-label">Emergency Contact</span>
            <span className="recovery-option-value">{contact}</span>
          </div>
        </div>

        <div>
          {isEditing ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={handleUpdate} 
                className="security-button security-button-primary"
              >
                Save
              </button>
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setTempEmail(email);
                  setTempPhone(phone);
                }} 
                className="security-button security-button-secondary"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setIsEditing(true)} 
                className="security-button security-button-secondary"
              >
                Update Recovery Email
              </button>
              <button 
                onClick={() => setIsEditing(true)} 
                className="security-button security-button-secondary"
              >
                Update Phone Number
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecoveryOptions;
