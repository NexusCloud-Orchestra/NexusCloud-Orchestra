import { useState } from 'react';
import '../css/SecurityCards.css';

function TwoFactorCard() {
  const [enabled, setEnabled] = useState(false);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);

  const backupCodes = [
    'ABCD-1234-EFGH',
    'IJKL-5678-MNOP',
    'QRST-9012-UVWX',
    'YZAB-3456-CDEF'
  ];

  return (
    <div className="security-card">
      <div className="security-card-header">
        <h3 className="security-card-title">🔐 Two Factor Authentication</h3>
        <p className="security-card-desc">Add an extra layer of security to your supervisor account.</p>
      </div>

      <div className="toggle-switch-container">
        <div className="toggle-switch-label-group">
          <span className="toggle-switch-title">Current Status</span>
          <span 
            className="toggle-switch-desc" 
            style={{ fontWeight: 700, color: enabled ? '#16A34A' : '#DC2626' }}
          >
            {enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={enabled} 
            onChange={(e) => {
              setEnabled(e.target.checked);
              if (!e.target.checked) {
                setShowRecoveryCodes(false);
              }
            }} 
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      <p className="privacy-action-desc">
        Protect your account using an authenticator app (Google Authenticator, Authy, Microsoft Authenticator) to scan the QR code and enter verification tokens.
      </p>

      {!enabled && (
        <button 
          onClick={() => setEnabled(true)} 
          className="security-button security-button-primary"
          style={{ alignSelf: 'flex-start' }}
        >
          Enable 2FA
        </button>
      )}

      {enabled && (
        <div className="two-factor-setup-flow">
          <div className="two-factor-qr-wrapper">
            <div className="two-factor-qr-placeholder">
              📱
            </div>
            <div className="two-factor-qr-instructions">
              <strong>Scan QR Code</strong>
              <p style={{ margin: '4px 0 0 0', color: '#6B7280' }}>
                Use your authenticator app to scan this placeholder. Enter the generated TOTP code on future login attempts.
              </p>
            </div>
          </div>

          <div className="two-factor-backup-codes-box">
            <h5>Backup & Recovery Codes</h5>
            <div className="two-factor-backup-codes-grid">
              {backupCodes.map((code, idx) => (
                <span key={idx}>{code}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setShowRecoveryCodes(!showRecoveryCodes)} 
                className="security-button security-button-secondary"
                style={{ height: '32px', fontSize: '12px' }}
              >
                {showRecoveryCodes ? 'Hide Backup Codes' : 'Show Backup Codes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TwoFactorCard;
