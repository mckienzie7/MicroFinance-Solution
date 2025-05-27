import { Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const ProtectedRoute = ({ 
  allowedRoles = ['user', 'admin'],
  isPublic = false,
  redirectPath = '/login'
}) => {
  const { 
    isAuthenticated, 
    user, 
    role, 
    isLoading, 
    verifySession 
  } = useAuth();
  
  const [isChecking, setIsChecking] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Debug logging in development only
  if (process.env.NODE_ENV === 'development') {
    console.log('ProtectedRoute render state:', {
      isAuthenticated,
      role,
      user: user ? 'exists' : 'null',
      allowedRoles,
      isLoading,
      isChecking,
      authError: authError ? 'exists' : 'null',
      isPublic
    });
  }

  useEffect(() => {
    const checkAuth = async () => {
      if (!verifySession) {
        console.error('verifySession function missing from auth context');
        setAuthError(new Error('Authentication service unavailable'));
        setIsChecking(false);
        return;
      }

      if (isAuthenticated) {
        setIsChecking(false);
        return;
      }

      try {
        await verifySession();
      } catch (error) {
        console.error('Session verification failed:', error);
        setAuthError(error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [isAuthenticated, verifySession]);

  const hasRequiredRole = role && allowedRoles.includes(role);

  if (isLoading || isChecking) {
    return <LoadingSpinner />;
  }

  // Handle public routes
  if (isPublic) {
    // If user is authenticated, redirect them to their appropriate dashboard
    if (isAuthenticated) {
      const dashboardPath = role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
      return <Navigate to={dashboardPath} replace />;
    }
    // Otherwise, show the public route
    return <Outlet />;
  }

  // Handle protected routes
  if (authError || !isAuthenticated) {
    return (
      <Navigate 
        to={redirectPath}
        replace 
        state={{ 
          from: window.location.pathname,
          error: authError?.message || 'Please log in to access this page'
        }} 
      />
    );
  }

  // Handle role-based access
  if (!hasRequiredRole) {
    const unauthorizedPath = role === 'admin' 
      ? '/admin/dashboard' 
      : '/user/dashboard';
    
    return (
      <Navigate 
        to={unauthorizedPath} 
        replace 
        state={{
          error: 'You do not have permission to access this page'
        }}
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;