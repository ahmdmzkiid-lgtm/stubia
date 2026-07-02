import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import PageWrapper from './PageWrapper';

// Prevents logged-in users from accessing login/register
export const PublicRoute = () => {
  const { isAuthenticated, isStaff, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to={isStaff ? "/admin" : "/dashboard"} replace />;
  return <Outlet />;
};

// Copy protection component for student pages to prevent questions from being copied/saved
const CopyProtection = ({ children }) => {
  React.useEffect(() => {
    const preventCopy = (e) => {
      e.preventDefault();
    };
    const preventContextMenu = (e) => {
      e.preventDefault();
    };
    
    // Prevent keyboard shortcuts Ctrl+C, Ctrl+X, Ctrl+U, Ctrl+S, F12
    const preventKeys = (e) => {
      if (
        (e.ctrlKey && ['C', 'X', 'U', 'S', 'A'].includes(e.key.toUpperCase())) ||
        (e.metaKey && ['C', 'X', 'U', 'S', 'A'].includes(e.key.toUpperCase())) ||
        e.key === 'F12'
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('copy', preventCopy);
    document.addEventListener('cut', preventCopy);
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('keydown', preventKeys);

    return () => {
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('cut', preventCopy);
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown', preventKeys);
    };
  }, []);

  return (
    <div className="select-none" style={{
      userSelect: 'none',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none'
    }}>
      {children}
    </div>
  );
};

// Student routes — no wrapper, each page handles its own layout/navbar
export const StudentRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? (
    <CopyProtection>
      <Outlet />
    </CopyProtection>
  ) : (
    <Navigate to="/login" replace />
  )
};

// Student routes that need PageWrapper (pages without their own navbar)
export const StudentRouteWrapped = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? (
    <CopyProtection>
      <PageWrapper><Outlet /></PageWrapper>
    </CopyProtection>
  ) : (
    <Navigate to="/login" replace />
  );
};

// Dark-theme protected routes (uses PageWrapper)
export const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? (
    <PageWrapper><Outlet /></PageWrapper>
  ) : (
    <Navigate to="/login" replace />
  );
};

// Admin-only routes
export const AdminRoute = () => {
  const { isAuthenticated, isStaff, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated && isStaff ? <Outlet /> : <Navigate to="/dashboard" replace />;
};
