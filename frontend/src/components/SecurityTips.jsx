import '../css/SecurityCards.css';

function SecurityTips() {
  const tips = [
    { title: 'Use Strong Password', desc: 'At least 8 chars with uppercase, lowercase, numbers, and special symbols.', icon: '🔑' },
    { title: 'Enable Two Factor Authentication', desc: 'Secure with an authenticator app for MFA verification.', icon: '📱' },
    { title: 'Review Login History', desc: 'Monitor IP addresses and suspicious locations regularly.', icon: '📜' },
    { title: 'Update Password Regularly', desc: 'Change password periodically to limit account compromise risks.', icon: '🔄' },
    { title: 'Remove Old Devices', desc: 'Revoke sessions on systems or browser configs no longer under ownership.', icon: '💻' },
  ];

  return (
    <div className="security-card">
      <div className="security-card-header">
        <h3 className="security-card-title">💡 Security Tips</h3>
        <p className="security-card-desc">Quick recommendations to maximize platform orchestration security.</p>
      </div>

      <div className="security-tips-grid">
        {tips.map((tip, index) => (
          <div key={index} className="security-tip-card">
            <span className="security-tip-icon">{tip.icon}</span>
            <div className="security-tip-content">
              <span className="security-tip-title">{tip.title}</span>
              <span className="security-tip-desc">{tip.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SecurityTips;
