import '../css/Charts.css';

const PROVIDER_COLORS = {
  aws: '#F97316',
  azure: '#3B82F6',
  gcp: '#10B981',
  r2: '#F59E0B',
  b2: '#EF4444',
  oracle: '#A855F7',
  ibm: '#6366F1'
};

function formatBytes(bytes, decimals = 1) {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function StorageChart({ connections, totalUsed }) {
  const defaultChartData = [
    { name: 'AWS S3', value: '250 GB', percentage: '25%', color: '#F97316', used: 250 },
    { name: 'Azure Blob', value: '120 GB', percentage: '12%', color: '#3B82F6', used: 120 },
    { name: 'Google Drive', value: '80 GB', percentage: '8%', color: '#10B981', used: 80 },
    { name: 'Backblaze B2', value: '400 GB', percentage: '40%', color: '#F59E0B', used: 400 },
    { name: 'Oracle Cloud', value: '150 GB', percentage: '15%', color: '#A855F7', used: 150 },
  ];

  const defaultTotalUsed = '1.00 TB';

  let chartData = [];
  let displayTotalUsed = '';

  if (connections && connections.length > 0) {
    displayTotalUsed = formatBytes(totalUsed);
    
    // Sort connections so AWS, Azure, GCP rendering stays consistent
    const sorted = [...connections].sort((a, b) => b.used_bytes - a.used_bytes);
    
    chartData = sorted.map(conn => {
      const color = PROVIDER_COLORS[conn.provider.toLowerCase()] || '#6B7280';
      const pct = totalUsed > 0 ? Math.round((conn.used_bytes / totalUsed) * 100) : 0;
      return {
        name: conn.display_name,
        value: formatBytes(conn.used_bytes),
        percentage: `${pct}%`,
        color,
        used: conn.used_bytes
      };
    });
  } else {
    chartData = connections ? [] : defaultChartData;
    displayTotalUsed = connections ? '0 Bytes' : defaultTotalUsed;
  }

  // Draw SVG segments
  // Circumference = 2 * PI * r = 2 * 3.14159 * 70 = 440
  const r = 70;
  const c = 440;
  let runningOffset = 0;
  const totalWeight = chartData.reduce((sum, item) => sum + item.used, 0);

  return (
    <div className="chart-card">
      <h3 className="chart-card-title">Storage Allocation</h3>
      <div className="chart-content-wrapper">
        <div className="chart-graphic-container">
          <svg width="180" height="180" viewBox="0 0 180 180">
            {totalWeight === 0 ? (
              // Empty / No usage state
              <circle cx="90" cy="90" r={r} fill="transparent" stroke="#E5E7EB" strokeWidth="18" />
            ) : (
              chartData.map((item, idx) => {
                const fraction = item.used / totalWeight;
                const dashArrayVal = Math.round(fraction * c);
                const strokeDasharray = `${dashArrayVal} ${c - dashArrayVal}`;
                const strokeDashoffset = -runningOffset;
                runningOffset += dashArrayVal;

                return (
                  <circle
                    key={idx}
                    cx="90"
                    cy="90"
                    r={r}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth="18"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 90 90)" /* Start from 12 o'clock */
                  />
                );
              })
            )}
          </svg>
          <div className="chart-center-label">
            <span className="chart-center-value" style={{ fontSize: '15px' }}>{displayTotalUsed}</span>
            <span className="chart-center-text">Used</span>
          </div>
        </div>

        <div className="chart-legend">
          {chartData.length === 0 ? (
            <div style={{ color: '#6B7280', fontSize: '13px' }}>No active storage provider allocations.</div>
          ) : (
            chartData.map((item) => (
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default StorageChart;
