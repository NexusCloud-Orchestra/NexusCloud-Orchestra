import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { RequireAuth, GuestOnly } from './auth/Guards';
import ThemeProvider from './provider/ThemeProvider';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { loadSettings, applySettings } from './lib/utils';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Files from './pages/Files';
import Storage from './pages/Storage';
import Clouds from './pages/Clouds';
import ConnectCloud from './pages/ConnectCloud';
import Subscription from './pages/Subscription';
import AccountSecurity from './pages/AccountSecurity';
import Profile from './pages/Profile';
import HelpSupport from './pages/HelpSupport';

import './css/app.css';
import './css/shell.css';
import './css/auth.css';
import './css/landing.css';

function AppShell() {
  const [collapsed, setCollapsed] = useState(() => !loadSettings().sidebar.expanded);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className={`main-content-layout${collapsed ? ' collapsed' : ''}`}>
        <Navbar onOpenMobileNav={() => setMobileOpen(true)} />
        <main>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/files" element={<Files />} />
            <Route path="/storage" element={<Storage />} />
            <Route path="/clouds" element={<Clouds />} />
            <Route path="/connect-cloud" element={<ConnectCloud />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/security" element={<AccountSecurity />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/help" element={<HelpSupport />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  // Apply persisted appearance settings once at boot (theme itself is
  // handled by ThemeProvider; accents/density/fonts come from settings).
  useEffect(() => {
    applySettings(loadSettings());

    const onUpdated = (e) => {
      if (e.detail) applySettings(e.detail);
    };
    window.addEventListener('nexus_settings_updated', onUpdated);
    return () => window.removeEventListener('nexus_settings_updated', onUpdated);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="ambient-background" aria-hidden="true" />
        <Routes>
          <Route element={<GuestOnly />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route path="/*" element={<AppShell />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
