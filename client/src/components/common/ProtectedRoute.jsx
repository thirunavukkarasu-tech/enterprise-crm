import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { FullPageLoader } from './Loader.jsx';

/**
 * Guards a route subtree behind authentication, and optionally behind a
 * set of allowed roles for RBAC-sensitive sections (e.g. Settings > Roles
 * & Permissions is admin-only).
 *
 * IMPORTANT: this is a UX convenience only. The server independently
 * enforces the same rules via `protect` + `authorize` middleware — see
 * docs/ARCHITECTURE.md §4. Never treat this component as a security boundary.
 */
export const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader label="Checking your session…" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
