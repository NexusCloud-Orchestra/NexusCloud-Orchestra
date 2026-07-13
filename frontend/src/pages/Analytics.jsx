import AnalyticsComponent from '../components/Analytics';

function Analytics() {
  return (
    <div className="page-content-wrapper">
      <div className="welcome-header-section">
        <h1 className="welcome-heading">Performance Analytics</h1>
        <p className="welcome-subtitle">Detailed insights into data transfers, speeds, and cost metrics.</p>
      </div>

      <AnalyticsComponent />
    </div>
  );
}

export default Analytics;
