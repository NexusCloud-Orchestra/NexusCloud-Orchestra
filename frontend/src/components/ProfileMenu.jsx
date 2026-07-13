import { Link } from 'react-router-dom';

function ProfileMenu({ onClose }) {
  const handleSignOut = () => {
    localStorage.removeItem('nexus_access_token');
    localStorage.removeItem('nexus_refresh_token');
    window.location.href = '/login';
  };

  return (
    <>
      {/* Backdrop to close the menu */}
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
          width: '240px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          zIndex: 1000,
          padding: '8px 0',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#111827' }}>Demo User</p>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6B7280' }}>demo@nexus.com</p>
          <div
            style={{
              marginTop: '8px',
              display: 'inline-block',
              fontSize: '10px',
              fontWeight: 700,
              backgroundColor: '#DBEAFE',
              color: '#1E40AF',
              padding: '2px 6px',
              borderRadius: '4px',
              textTransform: 'uppercase',
            }}
          >
            Pro Plan
          </div>
        </div>

        <div style={{ padding: '4px 0' }}>
          <Link
            to="/profile"
            onClick={onClose}
            style={{
              display: 'block',
              padding: '8px 16px',
              fontSize: '13px',
              color: '#374151',
              textDecoration: 'none',
            }}
          >
            👤 Profile Settings
          </Link>
          <Link
            to="/settings"
            onClick={onClose}
            style={{
              display: 'block',
              padding: '8px 16px',
              fontSize: '13px',
              color: '#374151',
              textDecoration: 'none',
            }}
          >
            ⚙️ Preferences
          </Link>
        </div>

        <div style={{ padding: '4px 0', borderTop: '1px solid #E5E7EB' }}>
          <button
            onClick={handleSignOut}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '8px 16px',
              fontSize: '13px',
              color: '#DC2626',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            🚪 Sign Out
          </button>
        </div>
      </div>
    </>
  );
}

export default ProfileMenu;
