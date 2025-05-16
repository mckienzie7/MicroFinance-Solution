import { Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const ProtectedRoute = ({ allowedRoles = ['user', 'admin'] }) => {
  const { 
    isAuthenticated, 
    user, 
    role, 
    isLoading, 
    verifySession 
  } = useAuth();
  
  const [isChecking, setIsChecking] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Debug logging
  console.log('ProtectedRoute render state:', {
    isAuthenticated,
    role,
    user: user ? 'exists' : 'null',
    allowedRoles,
    isLoading,
    isChecking,
    authError: authError ? 'exists' : 'null'
  });

  useEffect(() => {
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

    const checkAuth = async () => {
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

  if (authError || !isAuthenticated) {
    console.log('Authentication failed, redirecting to login');
    return (
      <Navigate 
        to="/login" 
        replace 
        state={{ 
          from: window.location.pathname,
          error: authError?.message 
        }} 
      />
    );
  }

  if (!hasRequiredRole) {
    console.log(`Role ${role} not in ${allowedRoles}, redirecting`);
    
    const redirectPath = role === 'admin' 
      ? '/admin/dashboard' 
      : '/user/dashboard';
    
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;