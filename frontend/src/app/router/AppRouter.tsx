import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { FilesPage } from '../../pages/FilesPage';
import { CloudsPage } from '../../pages/CloudsPage';
import { RoutingPage } from '../../pages/RoutingPage';
import { AnalyticsPage } from '../../pages/AnalyticsPage';
import { ActivityPage } from '../../pages/ActivityPage';
import { SettingsPage } from '../../pages/SettingsPage';
import { useAuth } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';

/**
 * Wraps every authenticated route.
 * - While the initial silent-refresh check is running: show a full-screen spinner
 * - If not authenticated after the check: redirect to /login, preserving the
 *   intended destination so we can redirect back after successful login.
 * - If authenticated: render the children.
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isInitialChecking } = useAuth();
  const location = useLocation();

  if (isInitialChecking) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/files"
          element={
            <ProtectedRoute>
              <FilesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clouds"
          element={
            <ProtectedRoute>
              <CloudsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/routing"
          element={
            <ProtectedRoute>
              <RoutingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activity"
          element={
            <ProtectedRoute>
              <ActivityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
