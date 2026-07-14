import { Link } from 'react-router-dom';
import '../css/ProfileDropdown.css';

function ProfileMenu({ onClose }) {
  const handleSignOut = () => {
    localStorage.removeItem('nexus_access_token');
    localStorage.removeItem('nexus_refresh_token');
    window.location.href = '/login';
  };

  return (
    <>
      {/* Backdrop to close the menu */}
      <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, background: 'transparent' }} />

      <div className="profile-menu-dropdown">
        {/* User Info */}
        <div className="profile-menu-user">
          <p className="profile-menu-name">Demo User</p>
          <p className="profile-menu-email">demo@nexus.com</p>
          <span className="profile-menu-badge">Pro Plan</span>
        </div>

        {/* Nav Links */}
        <div className="profile-menu-links">
          <Link to="/profile" onClick={onClose} className="profile-menu-link">
            👤 Profile Settings
          </Link>
          <Link to="/settings" onClick={onClose} className="profile-menu-link">
            ⚙️ Preferences
          </Link>
        </div>

        {/* Sign Out */}
        <div className="profile-menu-footer">
          <button onClick={handleSignOut} className="profile-menu-signout">
            🚪 Sign Out
          </button>
        </div>
      </div>
    </>
  );
}

export default ProfileMenu;
