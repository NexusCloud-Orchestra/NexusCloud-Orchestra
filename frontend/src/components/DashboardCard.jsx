import '../css/Cards.css';

function DashboardCard({ title, value, icon, change, isPositive, metaText }) {
  return (
    <div className="metric-card">
      <div className="metric-card-header">
        <span className="metric-title">{title}</span>
        <span className="metric-icon">{icon}</span>
      </div>
      <span className="metric-value">{value}</span>
      <div className="metric-meta">
        {change && (
          <span className={`metric-meta ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '↑' : '↓'} {change}
          </span>
        )}
        <span>{metaText}</span>
      </div>
    </div>
  );
}

export default DashboardCard;
