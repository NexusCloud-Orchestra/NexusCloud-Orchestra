import { useState } from 'react';
import '../css/SecurityCards.css';

function EmailVerification() {
  const [email, setEmail] = useState('demo@nexuscloud.com');
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(email);
  const [showStatus, setShowStatus] = useState(''); // success or info messages

  const handleSave = () => {
    if (inputValue.trim() === '') return;
    setEmail(inputValue);
    setIsEditing(false);
    setShowStatus('Verification email sent to new address.');
  };

  const handleSendVerification = () => {
    setShowStatus('Verification email sent to ' + email);
  };

  return (
    <div className="security-card">
      <div className="security-card-header">
        <h3 className="security-card-title">📧 Email Verification</h3>
        <p className="security-card-desc">Supervisor communication email security and ownership verification.</p>
      </div>

      {showStatus && <div className="success-banner">{showStatus}</div>}

      <div className="email-verification-body">
        <div className="email-info-row">
          <div className="email-details" style={{ flex: 1 }}>
            <span className="email-label">Current Email</span>
            {isEditing ? (
              <input 
                type="email" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="security-input"
                style={{ marginTop: '4px', maxWidth: '300px' }}
              />
            ) : (
              <span className="email-value">{email}</span>
            )}
          </div>
          {!isEditing && (
            <span className="email-status-badge">
              Verified
            </span>
          )}
        </div>

        <div className="email-actions">
          {isEditing ? (
            <>
              <button 
                onClick={handleSave} 
                className="security-button security-button-primary"
              >
                Save
              </button>
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setInputValue(email);
                }} 
                className="security-button security-button-secondary"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setIsEditing(true)} 
                className="security-button security-button-secondary"
              >
                Change Email
              </button>
              <button 
                onClick={handleSendVerification} 
                className="security-button security-button-secondary"
              >
                Send Verification Email
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmailVerification;
