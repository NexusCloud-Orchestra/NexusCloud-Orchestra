import { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Storage from './pages/Storage';
import Files from './pages/Files';
import Clouds from './pages/Clouds';
import Analytics from './pages/Analytics';
import AccountSecurity from './pages/AccountSecurity';
import Profile from './pages/Profile';
import ConnectCloud from './pages/ConnectCloud';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import './css/theme.css';
import './css/Dashboard.css';
import './css/Responsive.css';

function App() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Outer pages that don't render Sidebar/Navbar
  const outerPaths = ['/login', '/register'];
  const isOuterPage = outerPaths.includes(location.pathname) || (location.pathname === '/' && !localStorage.getItem('nexus_access_token'));

  return (
    <div className="app-shell">
      {!isOuterPage ? (
        <div className="app-container">
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
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
            </Routes>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      )}
    </div>
  );
}

export default App;
