import { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Storage from './pages/Storage';
import Files from './pages/Files';
import Clouds from './pages/Clouds';
import Analytics from './pages/Analytics';
import AccountSecurity from './pages/AccountSecurity';
import Profile from './pages/Profile';
import ConnectCloud from './pages/ConnectCloud';
import Subscription from './pages/Subscription';
import Appearance from './pages/Appearance';
import HelpSupport from './pages/HelpSupport';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ThemeProvider from './provider/ThemeProvider';
import './css/variables.css';
import './css/light-theme.css';
import './css/dark-theme.css';
import './css/theme.css';
import './css/Dashboard.css';
import './css/responsive.css';

function App() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarSettings, setSidebarSettings] = useState({
    expanded: true,
    icons_only: false,
  });

  const loadSidebarSettings = () => {
    const saved = localStorage.getItem('nexus_appearance_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.sidebar) {
          setSidebarSettings(parsed.sidebar);
        }
      } catch (e) {
        console.error('Error parsing sidebar settings', e);
      }
    }
  };

  useEffect(() => {
    loadSidebarSettings();

    const handlePreview = (e) => {
      if (e.detail) {
        setSidebarSettings(e.detail);
      }
    };

    window.addEventListener('nexus_settings_updated', loadSidebarSettings);
    window.addEventListener('nexus_sidebar_preview', handlePreview);

    return () => {
      window.removeEventListener('nexus_settings_updated', loadSidebarSettings);
      window.removeEventListener('nexus_sidebar_preview', handlePreview);
    };
  }, []);

  useEffect(() => {
    if (sidebarSettings.expanded) {
      setCollapsed(false);
    } else if (sidebarSettings.icons_only) {
      setCollapsed(true);
    }
  }, [sidebarSettings]);

  // Initialize saved appearance settings on startup
  useEffect(() => {
    const saved = localStorage.getItem('nexus_appearance_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        let activeTheme = parsed.theme;
        if (activeTheme === 'system') {
          activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', activeTheme);

        const colors = {
          blue: '#2563EB',
          green: '#16A34A',
          purple: '#9333EA',
          orange: '#EA580C',
          red: '#DC2626',
          gray: '#4B5563',
        };
        const accentHex = colors[parsed.accentColor] || '#2563EB';
        document.documentElement.style.setProperty('--accent-color', accentHex);
        document.documentElement.style.setProperty('--primary-color', accentHex);

        const fontSizes = { 0: '12px', 1: '14px', 2: '16px', 3: '18px' };
        if (parsed.fontSize !== undefined) {
          document.documentElement.style.setProperty('--base-font-size', fontSizes[parsed.fontSize]);
        }
        if (parsed.fontFamily) {
          document.documentElement.style.setProperty('--font-family', parsed.fontFamily === 'system-ui' ? 'sans-serif' : parsed.fontFamily);
        }
        if (parsed.animations) {
          document.documentElement.setAttribute('data-animations-enabled', parsed.animations.enable.toString());
          document.documentElement.setAttribute('data-reduce-motion', parsed.animations.reduceMotion.toString());
        }
      } catch (e) {
        console.error('Error loading appearance configuration', e);
      }
    }
  }, []);

  // Outer pages that don't render Sidebar/Navbar
  const outerPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
  const isOuterPage = outerPaths.includes(location.pathname) || (location.pathname === '/' && !localStorage.getItem('nexus_access_token'));

  return (
    <ThemeProvider>
      <div className="app-shell">
        {!isOuterPage ? (
          <div className="app-container">
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} iconsOnly={sidebarSettings.icons_only} />
            <div className={`main-content-layout ${collapsed ? 'collapsed' : ''}`}>
              <Navbar />
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/files" element={<Files />} />
                <Route path="/storage" element={<Storage />} />
                <Route path="/clouds" element={<Clouds />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<AccountSecurity />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/connect-cloud" element={<ConnectCloud />} />
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/appearance" element={<Appearance />} />
                <Route path="/help-support" element={<HelpSupport />} />
              </Routes>
            </div>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
