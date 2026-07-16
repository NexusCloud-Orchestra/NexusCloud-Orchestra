import { useState, useRef, useEffect } from 'react';
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
  const [showBadge, setShowBadge] = useState(true);
  const avatarRef = useRef(null);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Storage allocation almost full (AWS S3 exceeds 90%)', type: 'warning', time: '10m ago', read: false },
    { id: 2, text: 'Nightly backup successful', type: 'success', time: '8h ago', read: false },
    { id: 3, text: 'File "Project.pdf" shared with team members', type: 'info', time: '1d ago', read: false },
    { id: 4, text: 'Google Drive connection disconnected', type: 'danger', time: '2d ago', read: false },
  ]);
  const hasUnread = notifications.some(n => !n.read);

  const loadNotificationSettings = () => {
    const saved = localStorage.getItem('nexus_appearance_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.notifications) {
          setShowBadge(parsed.notifications.badgeCount !== false);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    loadNotificationSettings();
    window.addEventListener('nexus_settings_updated', loadNotificationSettings);
    return () => {
      window.removeEventListener('nexus_settings_updated', loadNotificationSettings);
    };
  }, []);

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
            {showBadge && hasUnread && <span className="nav-badge"></span>}
          </button>
          {showNotifications && (
            <Notifications
              notifications={notifications}
              onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
              onClose={() => setShowNotifications(false)}
            />
          )}
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
