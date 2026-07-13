import { useState } from 'react';
import '../css/SecurityCards.css';

function PrivacyControls() {
  const [showModal, setShowModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleDownload = () => {
    setStatusMessage('Data download request submitted. You will receive an email shortly.');
  };

  const handleExport = () => {
    setStatusMessage('Data export initialized. Archive generation in progress.');
  };

  const handleDeleteAccount = () => {
    setShowModal(false);
    setStatusMessage('Account deletion scheduled. Your account will be permanently deactivated.');
  };

  return (
    <div className="security-card">
      <div className="security-card-header">
        <h3 className="security-card-title">🛡️ Privacy Controls</h3>
        <p className="security-card-desc">Manage your supervisor identity records and data privacy tools.</p>
      </div>

      {statusMessage && <div className="success-banner">{statusMessage}</div>}

      <div className="privacy-controls-body">
        <p className="privacy-action-desc">
          Under CCPA / GDPR regulations, you can request a copy of all dashboard logs, telemetry logs, and credentials, or permanently erase your profile.
        </p>

        <div className="privacy-buttons-group">
          <button 
            onClick={handleDownload} 
            className="security-button security-button-secondary"
          >
            Download My Data
          </button>
          <button 
            onClick={handleExport} 
            className="security-button security-button-secondary"
          >
            Export Account Data
          </button>
          <button 
            onClick={() => setShowModal(true)} 
            className="security-button security-button-danger"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="security-modal-overlay">
          <div className="security-modal">
            <div className="security-modal-header">
              <h4 className="security-modal-title">⚠️ Delete Account Permanently?</h4>
            </div>
            <div className="security-modal-body">
              This action is permanent and cannot be undone. All unified cloud connections, S3 tokens, drive mappings, and meta-routing indices will be lost forever.
            </div>
            <div className="security-modal-actions">
              <button 
                onClick={() => setShowModal(false)} 
                className="security-button security-button-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount} 
                className="security-button security-button-danger"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PrivacyControls;
