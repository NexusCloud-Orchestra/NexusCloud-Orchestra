import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  PieChart,
  Cloud,
  CloudUpload,
  CreditCard,
  ShieldCheck,
  User,
  LifeBuoy,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import Logo from './Logo';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/files', label: 'Files', icon: FolderOpen },
      { to: '/storage', label: 'Storage', icon: PieChart },
    ],
  },
  {
    label: 'Cloud',
    items: [
      { to: '/clouds', label: 'Clouds', icon: Cloud },
      { to: '/connect-cloud', label: 'Connect Cloud', icon: CloudUpload },
      { to: '/subscription', label: 'Subscription', icon: CreditCard },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/security', label: 'Account Security', icon: ShieldCheck },
      { to: '/profile', label: 'Profile', icon: User },
      { to: '/help', label: 'Help & Support', icon: LifeBuoy },
    ],
  },
];

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  return (
    <>
      {mobileOpen ? (
        <button className="sidebar-backdrop" aria-label="Close navigation" onClick={onCloseMobile} />
      ) : null}
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`} aria-label="Primary">
        <NavLink to="/dashboard" className="sidebar-brand" onClick={onCloseMobile}>
          <Logo compact={collapsed} />
        </NavLink>

        <nav className="sidebar-nav">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="sidebar-section">{section.label}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  onClick={onCloseMobile}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon size={18} strokeWidth={2.1} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p className="sidebar-footer-text">
            Zero Data Touch — file bytes travel directly between your browser and your cloud.
          </p>
          <button
            type="button"
            className="btn-icon"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
        </div>
      </aside>
    </>
  );
}
