import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderSync,
  Cloud,
  Network,
  BarChart3,
  Activity,
  Settings,
  X,
  LogOut,
  HelpCircle,
  Radio,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHelp?: () => void;
}

const NAV_LINKS = [
  { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Files & Objects', path: '/files', icon: FolderSync },
  { name: 'Connected Clouds', path: '/clouds', icon: Cloud },
  { name: 'Routing Engine', path: '/routing', icon: Network },
  { name: 'Storage Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Audit Activity', path: '/activity', icon: Activity },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  onOpenHelp,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        className="relative w-4/5 max-w-xs bg-slate-950 text-slate-100 h-full shadow-2xl flex flex-col p-4 z-10 overflow-hidden border-r border-slate-800 animate-fadeIn"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight text-white block">
                NexusCloud
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-medium tracking-wider">
                Control Plane
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {NAV_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors relative',
                    isActive
                      ? 'bg-slate-800 text-white border border-slate-700/60'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 bg-blue-500 rounded-r-full" />
                    )}
                    <Icon className={cn('w-4 h-4', isActive ? 'text-blue-400' : 'text-slate-400')} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}

          <button
            onClick={() => {
              onClose();
              if (onOpenHelp) onOpenHelp();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Docs & Support</span>
          </button>
        </nav>

        {/* User Card */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center font-semibold text-xs shrink-0">
                {user ? (user.first_name.charAt(0) + (user.last_name.charAt(0) ?? '')).toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-white truncate leading-tight">
                  {user ? `${user.first_name} ${user.last_name}` : 'User'}
                </p>
                <p className="text-[10px] text-slate-400 truncate leading-tight">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => logout().then(() => navigate('/login'))}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded transition-colors ml-1"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
