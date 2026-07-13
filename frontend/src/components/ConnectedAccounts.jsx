import { useState } from 'react';
import '../css/SecurityCards.css';

function ConnectedAccounts() {
  const [connections, setConnections] = useState({
    google: true,
    github: false,
    microsoft: false,
  });

  const toggleConnection = (provider) => {
    setConnections((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }));
  };

  return (
    <div className="security-card">
      <div className="security-card-header">
        <h3 className="security-card-title">🌐 Connected Accounts</h3>
        <p className="security-card-desc">Link third-party SSO providers to your cloud account.</p>
      </div>

      <div className="connected-accounts-list">
        {/* Google */}
        <div className="connected-account-item">
          <div className="connected-account-info">
            <span className="connected-account-icon">G</span>
            <div>
              <span className="connected-account-name">Google Workspace</span>
              <div className={`connected-account-status ${connections.google ? 'connected' : 'unconnected'}`}>
                {connections.google ? 'Connected' : 'Not Connected'}
              </div>
            </div>
          </div>
          <button 
            onClick={() => toggleConnection('google')}
            className={`security-button ${connections.google ? 'security-button-secondary' : 'security-button-primary'}`}
            style={{ height: '32px', fontSize: '12px' }}
          >
            {connections.google ? 'Disconnect' : 'Connect'}
          </button>
        </div>

        {/* GitHub */}
        <div className="connected-account-item">
          <div className="connected-account-info">
            <span className="connected-account-icon">🐙</span>
            <div>
              <span className="connected-account-name">GitHub Enterprise</span>
              <div className={`connected-account-status ${connections.github ? 'connected' : 'unconnected'}`}>
                {connections.github ? 'Connected' : 'Not Connected'}
              </div>
            </div>
          </div>
          <button 
            onClick={() => toggleConnection('github')}
            className={`security-button ${connections.github ? 'security-button-secondary' : 'security-button-primary'}`}
            style={{ height: '32px', fontSize: '12px' }}
          >
            {connections.github ? 'Disconnect' : 'Connect'}
          </button>
        </div>

        {/* Microsoft */}
        <div className="connected-account-item">
          <div className="connected-account-info">
            <span className="connected-account-icon">M</span>
            <div>
              <span className="connected-account-name">Microsoft Azure AD</span>
              <div className={`connected-account-status ${connections.microsoft ? 'connected' : 'unconnected'}`}>
                {connections.microsoft ? 'Connected' : 'Not Connected'}
              </div>
            </div>
          </div>
          <button 
            onClick={() => toggleConnection('microsoft')}
            className={`security-button ${connections.microsoft ? 'security-button-secondary' : 'security-button-primary'}`}
            style={{ height: '32px', fontSize: '12px' }}
          >
            {connections.microsoft ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConnectedAccounts;
