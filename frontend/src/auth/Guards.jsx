import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function FullPageSpinner({ label = 'Loading…' }) {
  return (
    <div className="fullpage-loader" role="status" aria-live="polite">
      <span className="spinner spinner-lg" />
      <p>{label}</p>
    </div>
  );
}

export function RequireAuth() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner label="Restoring your session…" />;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <Outlet />;
}

export function GuestOnly() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <FullPageSpinner label="Restoring your session…" />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
