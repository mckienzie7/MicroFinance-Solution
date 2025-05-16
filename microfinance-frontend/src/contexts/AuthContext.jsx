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

  // Function to update user state - optimized to prevent redundant updates
  const updateUserState = (userData) => {
    const currentUserEmail = user?.email;
    const newUserEmail = userData?.email;

    if (currentUserEmail !== newUserEmail) {
      console.log('User data changed, updating state');
      setUser(userData);

      if (userData) {
        // Set admin status directly from userData.admin
        const isUserAdmin = userData.admin === true;
        setRole(isUserAdmin ? 'admin' : 'user');
        setIsAdmin(isUserAdmin);
        setIsAuthenticated(true);
      } else {
        setRole(null);
        setIsAdmin(false);
        setIsAuthenticated(false);
      }
    }
  };

  // Verify session on mount - optimized to reduce UI flickering
  const verifySession = async () => {
    if (isAuthenticated && user && role) {
      return;
    }

    try {
      setIsLoading(true);

      const storedUser = authService.getCurrentUser();
      const sessionId = authService.getSessionId();

      if (storedUser && sessionId) {
        updateUserState(storedUser);
        return;
      }

      setUser(null);
      setRole(null);
      setIsAdmin(false);
      setIsAuthenticated(false);

      document.cookie = 'session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } catch (error) {
      console.error('Session verification error:', error);
      setAuthError('There was a problem verifying your session.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize auth state from storage on mount - only once
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);

      try {
        const sessionId = authService.getSessionId();
        const storedUser = authService.getCurrentUser();

        if (process.env.NODE_ENV === 'development' && (storedUser || sessionId)) {
          console.debug('Auth initialization:', { 
            hasUser: !!storedUser, 
            hasSessionId: !!sessionId
          });
        }

        if (storedUser && sessionId) {
          updateUserState(storedUser);
        } else {
          if (isAuthenticated) {
            console.log('Missing user or session, clearing auth state');
            updateUserState(null);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthError('Error initializing authentication');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {}; // No cleanup needed
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      setIsLoading(true);
      setAuthError(null);

      const userData = await authService.login(credentials);

      console.log('Login successful, updating user state with:', userData);

      updateUserState(userData);

      setTimeout(() => {
        console.log('Verifying session after login...');
        verifySession();
      }, 500);

      return userData;
    } catch (error) {
      console.error('Login error in AuthContext:', error);
      setAuthError(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData, isMultipart = false) => {
    try {
      setIsLoading(true);
      setAuthError(null);
      const newUser = await authService.register(userData, isMultipart);

      console.log('Registration successful, but not automatically logging in');

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
      updateUserState(null);
      setAuthError('Logout failed on server, but you have been logged out locally.');
    } finally {
      setIsLoading(false);
    }
  };

  // Request password reset
  const requestPasswordReset = async (email) => {
    try {
      setIsLoading(true);
      setAuthError(null);
      const result = await authService.requestPasswordReset(email);
      return result;
    } catch (error) {
      setAuthError(error.message || 'Password reset request failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password with token
  const resetPassword = async (token, newPassword) => {
    try {
      setIsLoading(true);
      setAuthError(null);
      const result = await authService.resetPassword(token, newPassword);
      return result;
    } catch (error) {
      setAuthError(error.message || 'Password reset failed');
      throw error;
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
    requestPasswordReset,
    resetPassword,
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