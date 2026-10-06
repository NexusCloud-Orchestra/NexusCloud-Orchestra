import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, User, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import useTheme from '../hooks/useTheme';

const PAGE_TITLES = {
  '/dashboard': ['Dashboard', 'Your multi-cloud overview'],
  '/files': ['Files', 'Upload, download and manage objects'],
  '/storage': ['Storage', 'Quota and per-cloud capacity'],
  '/clouds': ['Clouds', 'Connected storage providers'],
  '/connect-cloud': ['Connect Cloud', 'Link a new storage provider'],
  '/subscription': ['Subscription', 'Plans and limits'],
  '/security': ['Account Security', 'Sign-in activity and password'],
  '/profile': ['Profile', 'Your account details'],
  '/help': ['Help & Support', 'Guides and troubleshooting'],
};

export default function Navbar({ onOpenMobileNav }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const pair = PAGE_TITLES[location.pathname] || ['NexusCloud', ''];
  const title = pair[0];
  const subtitle = pair[1];
  const first = user && user.first_name ? user.first_name : '';
  const last = user && user.last_name ? user.last_name : '';
  const initials = ((first.charAt(0) + last.charAt(0)) || 'U').toUpperCase();
  const fullName = user ? `${first} ${last}`.trim() : 'Account';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  return (
    <header className="navbar">
      <button type="button" className="btn-icon mobile-menu-btn" onClick={onOpenMobileNav} aria-label="Open navigation">
        <Menu size={18} />
      </button>

      <div>
        <div className="navbar-title">{title}</div>
        {subtitle ? <div className="navbar-subtitle">{subtitle}</div> : null}
      </div>

      <div className="navbar-spacer" />

      <button
        type="button"
        className="btn-icon"
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div ref={menuRef} style={{ position: 'relative' }}>
        <button
          type="button"
          className="navbar-user"
          onClick={() => setMenuOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className="avatar">{initials}</span>
          <span className="navbar-user-meta">
            <span className="navbar-user-name">{fullName}</span>
            <span className="navbar-user-plan">{user ? user.plan : 'free'} plan</span>
          </span>
        </button>

        {menuOpen ? (
          <div className="user-menu" role="menu">
            <div className="user-menu-header">
              <div className="user-menu-name">{fullName}</div>
              <div className="user-menu-email">{user ? user.email : ''}</div>
            </div>
            <Link to="/profile" className="user-menu-item" role="menuitem">
              <User size={15} /> Profile
            </Link>
            <Link to="/security" className="user-menu-item" role="menuitem">
              <ShieldCheck size={15} /> Account Security
            </Link>
            <button type="button" className="user-menu-item danger" role="menuitem" onClick={handleLogout}>
              <LogOut size={15} /> Sign out
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
