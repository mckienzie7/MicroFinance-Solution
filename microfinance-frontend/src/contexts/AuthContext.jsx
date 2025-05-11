import React, { createContext, useContext, useEffect, useState } from 'react';

import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Function to update user state
  const updateUserState = (userData) => {
    setUser(userData);
    if (userData) {
      setRole(userData.role);
      setIsAdmin(userData.role === 'admin');
      setIsAuthenticated(true);
    } else {
      setRole(null);
      setIsAdmin(false);
      setIsAuthenticated(false);
    }
  };

  // Verify session on mount and periodically
  const verifySession = async () => {
    try {
      setIsLoading(true);
      
      // First check if we have a user in storage
      const storedUser = authService.getCurrentUser();
      updateUserState(storedUser);
      
      if (storedUser) {
        try {
          // If we have a stored user, try to fetch fresh data from the server
          const freshUser = await authService.fetchCurrentUser();
          updateUserState(freshUser);
        } catch (error) {
          // If fetching fresh data fails due to authentication issues
          if (error.response?.status === 401) {
            updateUserState(null);
            setAuthError('Your session has expired. Please log in again.');
          }
        }
      } else {
        // If no stored user, just verify the session
        const isValid = await authService.verifySession();
        if (!isValid) {
          updateUserState(null);
        }
      }
    } catch (error) {
      console.error('Session verification error:', error);
      setAuthError('There was a problem verifying your session.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial session verification
  useEffect(() => {
    verifySession();
    
    // Set up periodic session verification (every 5 minutes)
    const intervalId = setInterval(() => {
      if (isAuthenticated) {
        authService.verifySession().catch(() => {
          // If verification fails, update state
          updateUserState(null);
          setAuthError('Your session has expired. Please log in again.');
        });
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  // Login function
  const login = async (credentials) => {
    try {
      setIsLoading(true);
      setAuthError(null);
      const userData = await authService.login(credentials);
      updateUserState(userData);
      return userData;
    } catch (error) {
      setAuthError(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setIsLoading(true);
      setAuthError(null);
      const newUser = await authService.register(userData);
      updateUserState(newUser);
      return newUser;
    } catch (error) {
      setAuthError(error.message || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      updateUserState(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if server logout fails, clear local state
      updateUserState(null);
      setAuthError('Logout failed on server, but you have been logged out locally.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear any auth errors
  const clearAuthError = () => setAuthError(null);

  const value = {
    user,
    role,
    isAdmin,
    isAuthenticated,
    isLoading,
    authError,
    login,
    register,
    logout,
    verifySession,
    clearAuthError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
