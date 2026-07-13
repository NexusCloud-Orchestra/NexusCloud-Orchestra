function Analytics() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          padding: '24px',
        }}
      >
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Storage Growth Trend</h3>
        <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '10px 0' }}>
          {[35, 42, 50, 48, 62, 75, 80, 98].map((val, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
              <div style={{ height: `${val * 1.4}px`, width: '28px', backgroundColor: '#2563EB', borderRadius: '4px 4px 0 0' }} />
              <span style={{ fontSize: '11px', color: '#6B7280' }}>M{idx + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Analytics;
