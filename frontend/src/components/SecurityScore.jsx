import '../css/SecurityCards.css';

function SecurityScore() {
  const recommendations = [
    'Enable Two Factor Authentication',
    'Verify Backup Email',
    'Remove inactive devices'
  ];

  return (
    <div className="security-card">
      <div className="security-card-header">
        <h3 className="security-card-title">🛡️ Security Score</h3>
        <p className="security-card-desc">Overall evaluation of your account protection settings.</p>
      </div>

      <div className="security-score-display">
        <div className="security-score-circle">
          92%
        </div>
        <div className="security-score-info">
          <span className="security-score-label">Current Status</span>
          <span className="security-score-status">Excellent</span>
        </div>
      </div>

      <div className="security-score-progress-container">
        <div className="security-score-progress-bar" style={{ width: '92%' }}></div>
      </div>

      <div className="security-score-recommendations">
        <h4>Key Recommendations</h4>
        <ul className="security-score-rec-list">
          {recommendations.map((rec, index) => (
            <li key={index} className="security-score-rec-item">
              {rec}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default SecurityScore;
