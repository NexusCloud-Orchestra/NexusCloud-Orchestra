function Notifications({ onClose }) {
  const notifications = [
    { id: 1, text: 'Storage allocation almost full (AWS S3 exceeds 90%)', type: 'warning', time: '10m ago' },
    { id: 2, text: 'Nightly backup successful', type: 'success', time: '8h ago' },
    { id: 3, text: 'File "Project.pdf" shared with team members', type: 'info', time: '1d ago' },
    { id: 4, text: 'Google Drive connection disconnected', type: 'danger', time: '2d ago' },
  ];

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
          background: 'transparent',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: '46px',
          width: '320px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          zIndex: 1000,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>Notifications</span>
          <button style={{ background: 'transparent', border: 'none', color: '#2563EB', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>Mark all read</button>
        </div>

        <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
          {notifications.map((item) => (
            <div
              key={item.id}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #F3F4F6',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor:
                      item.type === 'warning'
                        ? '#F59E0B'
                        : item.type === 'success'
                        ? '#16A34A'
                        : item.type === 'danger'
                        ? '#DC2626'
                        : '#2563EB',
                  }}
                />
                <span style={{ fontSize: '13px', color: '#374151', lineHeight: '1.4' }}>{item.text}</span>
              </div>
              <span style={{ fontSize: '11px', color: '#9CA3AF', paddingLeft: '14px' }}>{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Notifications;
