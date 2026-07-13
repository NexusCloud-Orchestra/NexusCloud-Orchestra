import { useState } from 'react';
import '../css/SecurityCards.css';

function NotificationSettings() {
  const [toggles, setToggles] = useState({
    loginAlerts: true,
    newDeviceAlerts: true,
    passwordAlerts: true,
    cloudConnectionAlerts: false,
    fileSharingAlerts: true,
    backupAlerts: false,
  });

  const handleToggle = (key) => {
    setToggles((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const notificationList = [
    { key: 'loginAlerts', title: 'Email Login Alerts', desc: 'Notify me of successful login sessions.' },
    { key: 'newDeviceAlerts', title: 'New Device Alerts', desc: 'Alert when signed in from a new browser or device.' },
    { key: 'passwordAlerts', title: 'Password Change Alerts', desc: 'Immediate notification after password updates.' },
    { key: 'cloudConnectionAlerts', title: 'Cloud Connection Alerts', desc: 'Warn when connecting new AWS, GCP, or Azure endpoints.' },
    { key: 'fileSharingAlerts', title: 'File Sharing Alerts', desc: 'Notify on file links shared externally.' },
    { key: 'backupAlerts', title: 'Backup Alerts', desc: 'Get alerts when automated drive backups complete.' },
  ];

  return (
    <div className="security-card">
      <div className="security-card-header">
        <h3 className="security-card-title">🔔 Security Notifications</h3>
        <p className="security-card-desc">Control which alert events trigger push emails or web signals.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {notificationList.map((item) => (
          <div key={item.key} className="toggle-switch-container" style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
            <div className="toggle-switch-label-group">
              <span className="toggle-switch-title">{item.title}</span>
              <span className="toggle-switch-desc">{item.desc}</span>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={toggles[item.key]} 
                onChange={() => handleToggle(item.key)} 
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NotificationSettings;
