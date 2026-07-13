import { useState } from 'react';
import '../css/SecurityTable.css';
import '../css/SecurityCards.css';

function LoginHistory() {
  const [filter, setFilter] = useState('ALL'); // ALL, SUCCESS, FAILED, SUSPICIOUS

  const historyData = [
    {
      date: '2026-07-13',
      time: '21:30:15',
      device: 'Windows PC',
      browser: 'Chrome',
      location: 'Chennai',
      ip: '192.168.1.12',
      status: 'SUCCESS',
    },
    {
      date: '2026-07-12',
      time: '18:45:00',
      device: 'Android Phone',
      browser: 'Chrome',
      location: 'Bangalore',
      ip: '106.51.28.94',
      status: 'SUCCESS',
    },
    {
      date: '2026-07-12',
      time: '18:43:22',
      device: 'Unknown Device',
      browser: 'Firefox',
      location: 'Frankfurt, DE',
      ip: '82.165.10.22',
      status: 'SUSPICIOUS',
    },
    {
      date: '2026-07-10',
      time: '10:15:30',
      device: 'MacBook Pro',
      browser: 'Safari',
      location: 'San Jose',
      ip: '172.56.21.8',
      status: 'SUCCESS',
    },
    {
      date: '2026-07-09',
      time: '04:12:11',
      device: 'Windows PC',
      browser: 'Edge',
      location: 'Unknown',
      ip: '45.12.32.180',
      status: 'FAILED',
    },
  ];

  const filteredData = historyData.filter((item) => {
    if (filter === 'ALL') return true;
    return item.status === filter;
  });

  return (
    <div className="security-card" style={{ gridColumn: 'span 2' }}>
      <div className="table-filter-header">
        <div>
          <h3 className="table-title">📜 Login History</h3>
          <p className="security-card-desc">Review recent authentication activities on your account.</p>
        </div>
        <div className="table-filter-buttons">
          <button 
            onClick={() => setFilter('ALL')} 
            className={`table-filter-btn ${filter === 'ALL' ? 'active' : ''}`}
          >
            All Logins
          </button>
          <button 
            onClick={() => setFilter('SUCCESS')} 
            className={`table-filter-btn ${filter === 'SUCCESS' ? 'active' : ''}`}
          >
            Successful
          </button>
          <button 
            onClick={() => setFilter('FAILED')} 
            className={`table-filter-btn ${filter === 'FAILED' ? 'active' : ''}`}
          >
            Failed
          </button>
          <button 
            onClick={() => setFilter('SUSPICIOUS')} 
            className={`table-filter-btn ${filter === 'SUSPICIOUS' ? 'active' : ''}`}
          >
            Suspicious
          </button>
        </div>
      </div>

      <div className="security-table-container">
        <table className="security-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Device</th>
              <th>Browser</th>
              <th>Location</th>
              <th>IP Address</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, idx) => (
              <tr key={idx}>
                <td>{item.date}</td>
                <td>{item.time}</td>
                <td style={{ fontWeight: 500 }}>{item.device}</td>
                <td>{item.browser}</td>
                <td>{item.location}</td>
                <td style={{ fontFamily: 'monospace' }}>{item.ip}</td>
                <td>
                  <span className={`status-badge ${
                    item.status === 'SUCCESS' ? 'status-badge-success' : 
                    item.status === 'FAILED' ? 'status-badge-secondary' : 
                    'status-badge-warning'
                  }`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#6B7280' }}>
                  No logins match the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LoginHistory;
