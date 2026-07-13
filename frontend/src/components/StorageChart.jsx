import '../css/Charts.css';

function StorageChart() {
  const chartData = [
    { name: 'AWS S3', value: '250 GB', percentage: '25%', color: '#2563EB' },
    { name: 'Azure Blob', value: '120 GB', percentage: '12%', color: '#3B82F6' },
    { name: 'Google Drive', value: '80 GB', percentage: '8%', color: '#10B981' },
    { name: 'Backblaze B2', value: '400 GB', percentage: '40%', color: '#F59E0B' },
    { name: 'Oracle Cloud', value: '150 GB', percentage: '15%', color: '#EF4444' },
  ];

  return (
    <div className="chart-card">
      <h3 className="chart-card-title">Storage Allocation</h3>
      <div className="chart-content-wrapper">
        <div className="chart-graphic-container">
          {/* Beautiful SVG Donut Chart */}
          <svg width="180" height="180" viewBox="0 0 180 180">
            {/* AWS S3 */}
            <circle cx="90" cy="90" r="70" fill="transparent" stroke="#2563EB" strokeWidth="18" strokeDasharray="110 440" strokeDashoffset="0" />
            {/* Azure Blob */}
            <circle cx="90" cy="90" r="70" fill="transparent" stroke="#3B82F6" strokeWidth="18" strokeDasharray="52 440" strokeDashoffset="-110" />
            {/* Google Drive */}
            <circle cx="90" cy="90" r="70" fill="transparent" stroke="#10B981" strokeWidth="18" strokeDasharray="35 440" strokeDashoffset="-162" />
            {/* Backblaze B2 */}
            <circle cx="90" cy="90" r="70" fill="transparent" stroke="#F59E0B" strokeWidth="18" strokeDasharray="176 440" strokeDashoffset="-197" />
            {/* Oracle Cloud */}
            <circle cx="90" cy="90" r="70" fill="transparent" stroke="#EF4444" strokeWidth="18" strokeDasharray="67 440" strokeDashoffset="-373" />
          </svg>
          <div className="chart-center-label">
            <span className="chart-center-value">1.35 TB</span>
            <span className="chart-center-text">Used</span>
          </div>
        </div>

        <div className="chart-legend">
          {chartData.map((item) => (
            <div key={item.name} className="legend-item">
              <div className="legend-label-group">
                <span className="legend-color-indicator" style={{ backgroundColor: item.color }} />
                <span className="legend-name">{item.name}</span>
              </div>
              <div className="legend-value-group">
                <span className="legend-used-storage">{item.value}</span>
                <span className="legend-percentage">{item.percentage}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StorageChart;
