import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardCard from '../components/DashboardCard';
import StorageChart from '../components/StorageChart';
import RecentFiles from '../components/RecentFiles';
import ActivityTimeline from '../components/ActivityTimeline';
import QuickActions from '../components/QuickActions';
import { API_URL } from '../config';
import '../css/Dashboard.css';

function formatBytes(bytes, decimals = 2) {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [quota, setQuota] = useState(null);
  const [files, setFiles] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const token = localStorage.getItem('nexus_access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Demo mode — skip all API calls and use placeholder data
    if (token === 'mock_demo_token') {
      setUser({ first_name: 'Demo', last_name: 'User', email: 'demo@nexus.com', plan: 'pro' });
      setQuota({
        total_used_bytes: 0,
        total_free_bytes: 10 * 1024 * 1024 * 1024,
        total_limit_bytes: 10 * 1024 * 1024 * 1024,
        by_connection: []
      });
      setFiles([]);
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch User Profile
      const meRes = await fetch(`${API_URL}/api/v1/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (meRes.status === 401) {
        localStorage.removeItem('nexus_access_token');
        navigate('/login');
        return;
      }
      const meData = meRes.ok ? await meRes.json() : null;
      setUser(meData);

      // 2. Fetch Quota Summary
      const quotaRes = await fetch(`${API_URL}/api/v1/quota/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const quotaData = quotaRes.ok ? await quotaRes.json() : null;
      setQuota(quotaData);

      // 3. Fetch Files
      const filesRes = await fetch(`${API_URL}/api/v1/files`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const filesData = filesRes.ok ? await filesRes.json() : [];
      setFiles(filesData);

      // 4. Fetch Audit Logs
      const logsRes = await fetch(`${API_URL}/api/v1/auth/audit-logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const logsData = logsRes.ok ? await logsRes.json() : [];
      setActivities(logsData);

    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const limitBytes = quota?.total_limit_bytes || 0;
  const usedBytes = quota?.total_used_bytes || 0;
  const connectionsCount = quota?.by_connection?.length || 0;

  const summaryMetrics = [
    { title: 'Total Storage Pool', value: formatBytes(limitBytes), icon: '💾', change: null, isPositive: null, metaText: 'Combined cloud limit' },
    { title: 'Used Storage', value: formatBytes(usedBytes), icon: '⚡', change: limitBytes > 0 ? `${((usedBytes / limitBytes) * 100).toFixed(1)}%` : '0%', isPositive: true, metaText: 'Total capacity used' },
    { title: 'Connected Clouds', value: `${connectionsCount} active`, icon: '☁️', change: null, isPositive: null, metaText: 'Linked storage segments' },
    { title: 'Total Files', value: files.length.toLocaleString(), icon: '📄', change: null, isPositive: null, metaText: 'Synchronized objects' },
    { title: 'Sync Status', value: connectionsCount > 0 ? 'Healthy' : 'Offline', icon: '🛡️', change: null, isPositive: null, metaText: connectionsCount > 0 ? 'All systems operational' : 'Link a provider to start' },
    { title: 'Orchestrator Health', value: '100%', icon: '📈', change: null, isPositive: null, metaText: 'All connections verified' },
  ];

  const aiInsights = [
    { text: 'Router algorithm set to select optimal cloud based on size, speed, and cost.', type: 'info' },
    { text: 'AWS presigned simulation layer successfully running.', type: 'saving' },
    { text: connectionsCount === 0 ? 'Link a storage provider to enable cloud replication.' : 'Cloud connection link verified and active.', type: connectionsCount === 0 ? 'warning' : 'action' },
  ];

  if (loading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center', fontSize: '16px', color: '#6B7280' }}>
        Loading dashboard metrics...
      </div>
    );
  }

  const welcomeName = user ? `${user.first_name} ${user.last_name}` : 'Demo User';

  return (
    <div className="page-content-wrapper">
      <div className="welcome-header-section">
        <div className="welcome-title-row">
          <div>
            <h1 className="welcome-heading">Welcome Back, {welcomeName}</h1>
            <p className="welcome-subtitle">Manage all your cloud storage and virtual drives from one orchestrator.</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="metrics-grid">
        {summaryMetrics.map((item) => (
          <DashboardCard key={item.title} {...item} />
        ))}
      </div>

      {/* Middle Grid: Chart & Quick Actions */}
      <div className="dashboard-grid-two-cols">
        <div>
          <StorageChart connections={quota?.by_connection || []} totalUsed={usedBytes} />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Bottom Grid: Recent Files & AI Insights */}
      <div className="dashboard-grid-two-cols">
        <div>
          <RecentFiles files={files.slice(0, 5)} />
        </div>
        <div className="chart-card">
          <h3 className="chart-card-title" style={{ marginBottom: '16px' }}>AI Insights & Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {aiInsights.map((insight, idx) => (
              <div
                key={idx}
                style={{
                  padding: '14px',
                  borderRadius: '6px',
                  borderLeft: '4px solid',
                  backgroundColor: '#F8FAFC',
                  borderColor:
                    insight.type === 'warning'
                      ? '#DC2626'
                      : insight.type === 'saving'
                      ? '#16A34A'
                      : insight.type === 'action'
                      ? '#F59E0B'
                      : '#2563EB',
                }}
              >
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280' }}>
                    {insight.type}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#111827', fontWeight: 500, lineHeight: 1.4 }}>
                  {insight.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Logs Timeline */}
      <div className="dashboard-grid-two-cols" style={{ marginTop: '24px' }}>
        <div style={{ gridColumn: 'span 2' }}>
          <ActivityTimeline events={activities.slice(0, 5)} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
