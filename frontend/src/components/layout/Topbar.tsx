import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  CheckCircle2,
  LogOut,
  User,
  Shield,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { dashboardService, SystemHealth } from '../../services/dashboard.service';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface TopbarProps {
  onOpenMobileMenu: () => void;
  onOpenSearch?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenMobileMenu,
  onOpenSearch,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dashboardService.getSystemHealth().then(setHealth);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Overview';
      case '/files':
        return 'Files & Objects';
      case '/clouds':
        return 'Connected Clouds';
      case '/routing':
        return 'Routing Engine';
      case '/analytics':
        return 'Storage Analytics';
      case '/activity':
        return 'Audit Activity';
      case '/settings':
        return 'Settings';
      default:
        return 'Control Plane';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Left: Mobile hamburger + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-semibold text-slate-500 hidden sm:inline">
            NexusCloud
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />
          <h1 className="text-sm font-semibold text-slate-900 tracking-tight">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Real System Health Indicator - Clean Normal Badge (Zero Glow) */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-medium text-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          <span>{health?.status === 'ok' ? 'All Systems Operational' : 'Engine Ready'}</span>
          <span className="text-emerald-700/60 font-mono text-[10px]">({health?.version || 'v1.0.0'})</span>
        </div>

        {/* Global Search Bar Trigger (⌘K) */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 h-9 px-3 text-xs text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all cursor-pointer shadow-2xs"
          title="Search files, clouds, or routing policies"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline text-slate-500">Search infrastructure…</span>
          <kbd className="hidden md:inline px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded text-slate-500 shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-lg p-4 z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-900">Notifications</span>
                <span className="text-[11px] text-blue-600 font-medium cursor-pointer hover:underline">
                  Mark all read
                </span>
              </div>
              <div className="mt-3 space-y-2">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <p className="font-medium text-slate-900">Multi-Cloud Handshake Nominal</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Zero latency spikes across AWS, GCP, Azure, and R2 endpoints.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <p className="font-medium text-slate-900">Placement Policy Applied</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Zero-egress routing optimized active file distribution.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Account Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu((prev) => !prev)}
            className="flex items-center gap-2 p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shadow-xs">
              {user ? (user.first_name.charAt(0) + (user.last_name.charAt(0) ?? '')).toUpperCase() : 'U'}
            </div>
            <span className="text-xs font-medium text-slate-900 hidden xl:inline">
              {user?.first_name || 'User'}
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 z-50 animate-fadeIn text-xs">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="font-semibold text-slate-900 truncate">{user ? `${user.first_name} ${user.last_name}` : '—'}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] font-medium text-emerald-600">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Authenticated Active</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  navigate('/settings');
                }}
                className="w-full text-left px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer flex items-center gap-2"
              >
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>Security & Tokens</span>
              </button>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout().then(() => navigate('/login'));
                }}
                className="w-full text-left px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer flex items-center gap-2 mt-0.5"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
