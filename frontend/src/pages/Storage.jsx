import StorageChart from '../components/StorageChart';
import Analytics from '../components/Analytics';

function Storage() {
  return (
    <div className="page-content-wrapper">
      <div className="welcome-header-section">
        <h1 className="welcome-heading">Storage Management</h1>
        <p className="welcome-subtitle">Detailed breakdown of virtual volume sizes and usage patterns.</p>
      </div>

      <div className="dashboard-grid-two-cols">
        <div>
          <StorageChart />
        </div>
        <div>
          <Analytics />
        </div>
      </div>
    </div>
  );
}

export default Storage;
