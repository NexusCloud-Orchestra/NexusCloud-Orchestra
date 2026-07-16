import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../css/ProfileDropdown.css';

function ProfileDropdown({ onClose, avatarRef }) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        (!avatarRef || !avatarRef.current || !avatarRef.current.contains(event.target))
      ) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, avatarRef]);

  const handleSignOut = () => {
    localStorage.removeItem('nexus_access_token');
    localStorage.removeItem('nexus_refresh_token');
    window.location.href = '/login';
  };

  const menuItems = [
    { name: 'My Profile', path: '/profile', icon: '👤' },
    { name: 'Change Password', path: '/settings', icon: '🔑' },
    { name: 'Appearance', path: '/appearance', icon: '🎨' },
    { name: 'Activity Log', path: '/profile#activity', icon: '📜' },
    { name: 'Billing & Subscription', path: '/subscription', icon: '💳' },
  ];

  return (
    <div className="profile-dropdown-container" ref={dropdownRef}>
      <div className="profile-dropdown-header">
        <h4>User Profile</h4>
        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
          alt="Demo User avatar"
          className="profile-dropdown-large-avatar"
        />
        <h3 className="profile-dropdown-name">Demo User</h3>
        <p className="profile-dropdown-email">demo@nexuscloud.com</p>
        
        <div className="profile-dropdown-meta-grid">
          <div className="profile-dropdown-meta-item">
            <span className="profile-dropdown-meta-label">Role</span>
            <span className="profile-dropdown-meta-value">Administrator</span>
          </div>
          <div className="profile-dropdown-meta-item">
            <span className="profile-dropdown-meta-label">Storage Plan</span>
            <span className="profile-dropdown-meta-value">Enterprise</span>
          </div>
        </div>
      </div>

      <div className="profile-dropdown-menu">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className="profile-dropdown-item"
            onClick={onClose}
          >
            <span className="profile-dropdown-item-icon">{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        ))}
        <button
          onClick={() => {
            handleSignOut();
            onClose();
          }}
          className="profile-dropdown-item logout-item"
        >
          <span className="profile-dropdown-item-icon">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export default ProfileDropdown;
