import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';
import Notifications from './Notifications';
import '../css/Navbar.css';

function Navbar() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const avatarRef = useRef(null);

  return (
    <header className="navbar">
      <div className="navbar-left">
        <div className="navbar-search-wrapper">
          <span className="navbar-search-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search files, folders, metadata..."
            className="navbar-search-input"
          />
          <span className="navbar-search-shortcut">Ctrl K</span>
        </div>
      </div>

      <div className="navbar-right">
        <Link to="/connect-cloud" className="btn-nav-action btn-nav-secondary" style={{ textDecoration: 'none' }}>
          <span>Connect Cloud</span>
        </Link>
        
        <button className="btn-nav-action btn-nav-primary">
          <span>Upload File</span>
        </button>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowDropdown(false);
            }}
            className="nav-icon-btn"
            title="Notifications"
          >
            <span>🔔</span>
            <span className="nav-badge"></span>
          </button>
          {showNotifications && <Notifications onClose={() => setShowNotifications(false)} />}
        </div>

        <div style={{ position: 'relative' }}>
          <button
            ref={avatarRef}
            onClick={() => {
              setShowDropdown(!showDropdown);
              setShowNotifications(false);
            }}
            className="profile-avatar-trigger"
            title="User Profile"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
              alt="Profile Avatar"
              className="avatar-image"
            />
          </button>
          {showDropdown && (
            <ProfileDropdown
              onClose={() => setShowDropdown(false)}
              avatarRef={avatarRef}
            />
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
