import { useState } from 'react';
import '../css/SecurityTable.css';
import '../css/SecurityCards.css';

function ActiveSessions() {
  const [sessions, setSessions] = useState([
    {
      id: 1,
      device: 'Windows PC',
      os: 'Windows 11',
      browser: 'Chrome',
      location: 'Chennai',
      lastActive: 'Current Device',
      status: 'active',
      isCurrent: true,
    },
    {
      id: 2,
      device: 'Android Phone',
      os: 'Android 13',
      browser: 'Chrome',
      location: 'Bangalore',
      lastActive: '5 minutes ago',
      status: 'active',
      isCurrent: false,
    },
    {
      id: 3,
      device: 'MacBook Pro',
      os: 'macOS Sonoma',
      browser: 'Safari',
      location: 'San Jose',
      lastActive: 'Yesterday',
      status: 'inactive',
      isCurrent: false,
    },
  ]);

  const handleLogout = (id) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleLogoutAll = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
  };

  return (
    <div className="security-card" style={{ gridColumn: 'span 2' }}>
      <div className="table-filter-header">
        <div>
          <h3 className="table-title">💻 Active Sessions</h3>
          <p className="security-card-desc">Devices currently logged into your supervisor account.</p>
        </div>
        {sessions.length > 1 && (
          <button 
            onClick={handleLogoutAll} 
            className="security-button security-button-secondary"
            style={{ height: '32px', fontSize: '12px' }}
          >
            Logout All Other Devices
          </button>
        )}
      </div>

      <div className="security-table-container">
        <table className="security-table">
          <thead>
            <tr>
              <th>Device</th>
              <th>Operating System</th>
              <th>Browser</th>
              <th>Location</th>
              <th>Last Active</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id}>
                <td style={{ fontWeight: 600 }}>{session.device}</td>
                <td>{session.os}</td>
                <td>{session.browser}</td>
                <td>{session.location}</td>
                <td>
                  <span style={{ fontStyle: session.isCurrent ? 'italic' : 'normal', color: session.isCurrent ? '#16A34A' : 'inherit', fontWeight: session.isCurrent ? 600 : 'normal' }}>
                    {session.lastActive}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${session.isCurrent ? 'status-badge-success' : 'status-badge-secondary'}`}>
                    {session.isCurrent ? 'Current' : 'Active'}
                  </span>
                </td>
                <td>
                  {!session.isCurrent ? (
                    <button 
                      onClick={() => handleLogout(session.id)}
                      className="security-button security-button-secondary"
                      style={{ height: '28px', padding: '0 8px', fontSize: '11px' }}
                    >
                      Logout Device
                    </button>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500 }}>System Locked</span>
                  )}
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#6B7280' }}>
                  No active sessions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ActiveSessions;
