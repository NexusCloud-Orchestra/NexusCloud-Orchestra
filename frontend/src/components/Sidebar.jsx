import { Link, useLocation } from 'react-router-dom';
import '../css/Sidebar.css';

function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    { name: 'My Files', path: '/files', icon: '📁' },
    { name: 'Storage', path: '/storage', icon: '💾' },
    { name: 'Connected Clouds', path: '/clouds', icon: '☁️' },
    { name: 'Analytics', path: '/analytics', icon: '📈' },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <Link to="/" className="brand-link">
          <span className="brand-icon">☁️</span>
          {!collapsed && <span>nexus cloud</span>}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-toggle-btn"
          title={collapsed ? 'Expand menu' : 'Collapse menu'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`menu-item ${isActive ? 'active' : ''}`}
            >
              <span className="menu-icon">{item.icon}</span>
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
