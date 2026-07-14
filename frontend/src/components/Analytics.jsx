import '../css/Charts.css';

function Analytics() {
  const bars = [35, 42, 50, 48, 62, 75, 80, 98];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="chart-card">
        <h3 className="chart-card-title">Storage Growth Trend</h3>
        <div
          style={{
            height: '180px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            padding: '10px 0',
          }}
        >
          {bars.map((val, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                flex: 1,
              }}
            >
              <div
                style={{
                  height: `${val * 1.4}px`,
                  width: '28px',
                  backgroundColor: 'var(--primary, #2563EB)',
                  borderRadius: '4px 4px 0 0',
                }}
              />
              <span className="chart-center-text">M{idx + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Analytics;
