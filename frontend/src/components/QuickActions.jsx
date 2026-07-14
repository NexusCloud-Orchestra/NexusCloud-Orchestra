import '../css/Navbar.css';

function QuickActions() {
  const actions = [
    { title: 'Upload File', desc: 'Add individual files to cloud', icon: '📄' },
    { title: 'Upload Folder', desc: 'Upload whole directory structure', icon: '📁' },
    { title: 'Create Folder', desc: 'Make virtual directory', icon: '➕' },
    { title: 'Create Share Link', desc: 'Secure asset distribution', icon: '🔗' },
    { title: 'Backup Now', desc: 'Trigger replication process', icon: '🔄' },
  ];

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '24px',
      }}
    >
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>Quick Actions</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {actions.map((act) => (
          <button
            key={act.title}
            className="btn-nav-action btn-nav-secondary"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '12px',
              padding: '10px 16px',
              height: 'auto',
              boxSizing: 'border-box',
            }}
          >
            <span style={{ fontSize: '18px' }}>{act.icon}</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
              <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>{act.title}</span>
              <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 400 }}>{act.desc}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuickActions;
