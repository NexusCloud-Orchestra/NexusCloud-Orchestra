import React, { useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderSync,
  Cloud,
  Network,
  BarChart3,
  Activity,
  Settings,
  HelpCircle,
  LogOut,
  Pin,
  PinOff,
  Radio,
} from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PRIMARY_NAV_ITEMS: NavItem[] = [
  { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Files & Objects', path: '/files', icon: FolderSync },
  { name: 'Connected Clouds', path: '/clouds', icon: Cloud },
  { name: 'Routing Engine', path: '/routing', icon: Network },
  { name: 'Storage Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Audit Activity', path: '/activity', icon: Activity },
];

const SECONDARY_NAV_ITEMS: NavItem[] = [
  { name: 'Settings', path: '/settings', icon: Settings },
];

interface SidebarProps {
  onOpenHelp?: () => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenHelp,
  isPinned = false,
  onTogglePin,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Smooth hover expansion with micro-grace period on leave to prevent flicker
  const handleMouseEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
    }
    leaveTimerRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 90);
  };

  const isExpanded = isPinned || isHovered;
  const currentWidth = isExpanded ? 256 : 68;

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: `${currentWidth}px`,
        transition: 'width 240ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 240ms ease',
      }}
      className={cn(
        'hidden md:flex flex-col h-screen fixed left-0 top-0 bottom-0 shrink-0 z-40',
        'bg-slate-950 text-slate-200 select-none overflow-hidden border-r border-slate-800/80 will-change-[width]',
        isExpanded && !isPinned
          ? 'shadow-2xl shadow-black/40 ring-1 ring-slate-800'
          : 'shadow-sm'
      )}
      aria-label="Main Navigation"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-3.5 border-b border-slate-800/80 shrink-0 justify-between">
        <div
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-3 cursor-pointer group min-w-0"
        >
          {/* Crisp, Normal Brand Mark (Zero Glow) */}
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:bg-blue-500 transition-colors">
            <Radio className="w-4.5 h-4.5" />
          </div>

          <div
            className={cn(
              'overflow-hidden transition-all duration-200 whitespace-nowrap',
              isExpanded
                ? 'opacity-100 max-w-[150px]'
                : 'opacity-0 max-w-0 pointer-events-none'
            )}
          >
            <div className="text-sm font-semibold tracking-tight text-white leading-tight">
              NexusCloud
            </div>
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Control Plane
            </div>
          </div>
        </div>

        {/* Pin Sidebar Toggle (Available when expanded) */}
        {isExpanded && onTogglePin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            title={isPinned ? 'Unpin sidebar (auto-collapse on hover)' : 'Pin sidebar open'}
            className={cn(
              'p-1.5 rounded-md transition-colors cursor-pointer shrink-0 text-xs',
              isPinned
                ? 'text-blue-400 bg-blue-950/60 border border-blue-800/60'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
            )}
          >
            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Primary Navigation List */}
      <div className="flex-1 py-3 px-2.5 space-y-1 overflow-y-auto overflow-x-hidden">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Tooltip
              key={item.path}
              content={item.name}
              disabled={isExpanded}
              position="right"
            >
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center h-10 px-2.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer',
                    isActive
                      ? 'bg-slate-800 text-white border border-slate-700/70 shadow-xs'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Normal active accent bar on left (Zero glow) */}
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 bg-blue-500 rounded-r-full" />
                    )}

                    <div className="flex items-center justify-center w-5 h-5 shrink-0">
                      <Icon
                        className={cn(
                          'w-4 h-4 transition-colors',
                          isActive
                            ? 'text-blue-400'
                            : 'text-slate-400 group-hover:text-slate-200'
                        )}
                      />
                    </div>

                    <span
                      className={cn(
                        'whitespace-nowrap overflow-hidden transition-all duration-200 text-xs',
                        isExpanded
                          ? 'opacity-100 translate-x-0 ml-3 max-w-[160px]'
                          : 'opacity-0 -translate-x-2 max-w-0 ml-0 pointer-events-none'
                      )}
                    >
                      {item.name}
                    </span>
                  </>
                )}
              </NavLink>
            </Tooltip>
          );
        })}

        {/* Clean Neutral Divider */}
        <div className="my-2 border-t border-slate-800/80 mx-1" />

        {SECONDARY_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Tooltip
              key={item.path}
              content={item.name}
              disabled={isExpanded}
              position="right"
            >
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center h-10 px-2.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer',
                    isActive
                      ? 'bg-slate-800 text-white border border-slate-700/70 shadow-xs'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 bg-blue-500 rounded-r-full" />
                    )}

                    <div className="flex items-center justify-center w-5 h-5 shrink-0">
                      <Icon
                        className={cn(
                          'w-4 h-4 transition-colors',
                          isActive
                            ? 'text-blue-400'
                            : 'text-slate-400 group-hover:text-slate-200'
                        )}
                      />
                    </div>

                    <span
                      className={cn(
                        'whitespace-nowrap overflow-hidden transition-all duration-200 text-xs',
                        isExpanded
                          ? 'opacity-100 translate-x-0 ml-3 max-w-[160px]'
                          : 'opacity-0 -translate-x-2 max-w-0 ml-0 pointer-events-none'
                      )}
                    >
                      {item.name}
                    </span>
                  </>
                )}
              </NavLink>
            </Tooltip>
          );
        })}

        <Tooltip content="Documentation & Help" disabled={isExpanded} position="right">
          <button
            type="button"
            onClick={onOpenHelp}
            className="w-full group relative flex items-center h-10 px-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent transition-all duration-150 cursor-pointer"
          >
            <div className="flex items-center justify-center w-5 h-5 shrink-0">
              <HelpCircle className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-colors" />
            </div>

            <span
              className={cn(
                'whitespace-nowrap overflow-hidden transition-all duration-200 text-xs',
                isExpanded
                  ? 'opacity-100 translate-x-0 ml-3 max-w-[160px]'
                  : 'opacity-0 -translate-x-2 max-w-0 ml-0 pointer-events-none'
              )}
            >
              Docs & Support
            </span>
          </button>
        </Tooltip>
      </div>

      {/* Footer User Profile Card (Crisp, Normal Surface - Zero Glow) */}
      <div className="p-2 border-t border-slate-800/80 shrink-0">
        <div className="flex items-center h-11 px-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center font-semibold text-xs shrink-0 shadow-xs">
            {user ? (user.first_name.charAt(0) + (user.last_name.charAt(0) ?? '')).toUpperCase() : 'U'}
          </div>

          <div
            className={cn(
              'ml-2.5 flex-1 overflow-hidden transition-all duration-200 whitespace-nowrap',
              isExpanded
                ? 'opacity-100 max-w-[130px]'
                : 'opacity-0 max-w-0 pointer-events-none'
            )}
          >
            <p className="text-xs font-medium text-white truncate leading-tight">
              {user ? `${user.first_name} ${user.last_name}` : 'User'}
            </p>
            <p className="text-[10px] text-slate-400 truncate leading-tight">
              {user?.email ?? '—'}
            </p>
          </div>

          {isExpanded && (
            <button
              type="button"
              onClick={() => logout().then(() => navigate('/login'))}
              title="Sign out"
              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer shrink-0 ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
