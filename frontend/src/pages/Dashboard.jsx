import DashboardCard from '../components/DashboardCard';
import StorageChart from '../components/StorageChart';
import RecentFiles from '../components/RecentFiles';
import ActivityTimeline from '../components/ActivityTimeline';
import QuickActions from '../components/QuickActions';
import '../css/Dashboard.css';

function Dashboard() {
  const summaryMetrics = [
    { title: 'Total Storage', value: '2.4 TB', icon: '💾', change: '8.4%', isPositive: true, metaText: 'vs last month' },
    { title: 'Used Storage', value: '1.35 TB', icon: '⚡', change: '12.1%', isPositive: true, metaText: 'vs last month' },
    { title: 'Connected Clouds', value: '4 / 5', icon: '☁️', change: null, isPositive: null, metaText: '1 cloud inactive' },
    { title: 'Total Files', value: '3,245', icon: '📄', change: '2.4%', isPositive: true, metaText: 'vs last week' },
    { title: 'Sync Status', value: 'Healthy', icon: '🛡️', change: null, isPositive: null, metaText: 'All systems green' },
    { title: 'Storage Health', value: '98%', icon: '📈', change: null, isPositive: null, metaText: '1 bad connection segment' },
  ];

  const aiInsights = [
    { text: 'Large duplicate assets detected in AWS S3 archive.', type: 'action' },
    { text: 'Move older archives from AWS S3 to Backblaze B2 (saves ~$12/mo).', type: 'saving' },
    { text: 'Security warning: Public read access enabled on Azure container.', type: 'warning' },
    { text: 'Backup procedure completed successfully 8 hours ago.', type: 'info' },
  ];

  return (
    <div className="page-content-wrapper">
      <div className="welcome-header-section">
        <div className="welcome-title-row">
          <div>
            <h1 className="welcome-heading">Good Morning, Demo User</h1>
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
          <StorageChart />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Bottom Grid: Recent Files & AI Insights */}
      <div className="dashboard-grid-two-cols">
        <div>
          <RecentFiles />
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
          <ActivityTimeline />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
