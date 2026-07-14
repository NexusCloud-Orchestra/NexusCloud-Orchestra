import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';
import Notifications from './Notifications';
import SearchBar from './SearchBar';
import ThemeToggle from './ThemeToggle';
import '../css/Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const avatarRef = useRef(null);

  return (
    <header className="navbar">
      <div className="navbar-left">
        <SearchBar />
      </div>

      <div className="navbar-right">
        <Link to="/connect-cloud" className="btn-nav-action btn-nav-secondary" style={{ textDecoration: 'none' }}>
          <span>Connect Cloud</span>
        </Link>
        
        <ThemeToggle />
        
        <button className="btn-nav-action btn-nav-primary" onClick={() => navigate('/files')}>
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
