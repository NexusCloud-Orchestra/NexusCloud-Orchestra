import SecurityScore from '../components/SecurityScore';
import PasswordCard from '../components/PasswordCard';
import TwoFactorCard from '../components/TwoFactorCard';
import ActiveSessions from '../components/ActiveSessions';
import LoginHistory from '../components/LoginHistory';
import ConnectedAccounts from '../components/ConnectedAccounts';
import EmailVerification from '../components/EmailVerification';
import NotificationSettings from '../components/NotificationSettings';
import PrivacyControls from '../components/PrivacyControls';
import ApiKeys from '../components/ApiKeys';
import RecoveryOptions from '../components/RecoveryOptions';
import SecurityTips from '../components/SecurityTips';
import '../css/AccountSecurity.css';

function AccountSecurity() {
  return (
    <div className="page-content-wrapper">
      <div className="account-security-wrapper">
        <header className="security-header">
          <h1 className="security-title">Account Security</h1>
          <p className="security-subtitle">Manage your account security, devices, passwords and login activity.</p>
        </header>

        <div className="account-security-grid-main">
          {/* Left Column (Main Actions and Tables) */}
          <div className="account-security-main-column">
            {/* Section 1: Security Score */}
            <SecurityScore />

            {/* Section 2 & 3: Credentials */}
            <div className="account-security-two-col-row">
              <PasswordCard />
              <TwoFactorCard />
            </div>

            {/* Section 4: Active Sessions Table */}
            <ActiveSessions />

            {/* Section 5: Login History Table */}
            <LoginHistory />

            {/* Section 10: API Keys Table */}
            <ApiKeys />
          </div>

          {/* Right Column (Meta Settings and Side panels) */}
          <div className="account-security-side-column">
            {/* Section 7: Email Verification */}
            <EmailVerification />

            {/* Section 11: Recovery Options */}
            <RecoveryOptions />

            {/* Section 6: Connected Accounts */}
            <ConnectedAccounts />

            {/* Section 8: Security Notifications */}
            <NotificationSettings />

            {/* Section 12: Security Tips */}
            <SecurityTips />

            {/* Section 9: Privacy Controls */}
            <PrivacyControls />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountSecurity;
