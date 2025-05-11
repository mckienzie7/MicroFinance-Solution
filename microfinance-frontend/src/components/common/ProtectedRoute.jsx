import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ allowedRoles = ['user'] }) => {
  const { isAuthenticated, user, role, verifySession } = useAuth();

 

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }

  // Check if user has required role
  if (!allowedRoles.includes(role)) {
    // If user is authenticated but doesn't have the right role
    // Redirect to appropriate dashboard based on their role
    if (role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (role === 'user') {
      return <Navigate to="/user/dashboard" replace />;
    } else {
      // If role is unknown, logout and redirect to login
      return <Navigate to="/login" replace />;
    }
  }

  // If user is authenticated and has the right role, render the children
  return <Outlet />;
};

export default ProtectedRoute;
