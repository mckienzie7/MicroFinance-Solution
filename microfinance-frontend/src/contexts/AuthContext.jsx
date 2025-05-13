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
    // Only update if the data actually changed
    const currentUserEmail = user?.email;
    const newUserEmail = userData?.email;
    
    if (currentUserEmail !== newUserEmail) {
      console.log('User data changed, updating state');
      setUser(userData);
      
      if (userData) {
        // Get role from user data
        const userRole = userData.role || 'user';
        setRole(userRole);
        setIsAdmin(userRole === 'admin');
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
    // If we're already authenticated with a user and role, skip verification
    if (isAuthenticated && user && role) {
      return;
    }
    
    try {
      // Only set loading if we're actually going to verify
      setIsLoading(true);
      
      // Check if we have a user in storage
      const storedUser = authService.getCurrentUser();
      const sessionId = authService.getSessionId(); // Use the centralized function
      
      // If we have both a stored user and session ID, we can consider the user authenticated
      if (storedUser && sessionId) {
        updateUserState(storedUser);
        return; // Exit early - no need for API call
      }
      
      console.log('Verifying session with:', { 
        storedUser, 
        sessionId, 
        isAuthenticated: !!storedUser && !!sessionId,
        currentAuthState: isAuthenticated
      });
      
      // Check for both user data and session ID
      if (storedUser && sessionId) {
        // We have both user data and a session ID, consider the session valid
        console.log('Session is valid, updating user state with:', storedUser);
        
        // Force authentication state update
        setUser(storedUser);
        setRole(storedUser.role || (storedUser.admin ? 'admin' : 'user'));
        setIsAdmin(!!storedUser.admin);
        setIsAuthenticated(true);
        
        // Ensure the cookie is set for future requests
        document.cookie = `session_id=${sessionId}; path=/; samesite=lax; max-age=86400`;
      } else {
        // If we don't have both user data and session ID, we're not authenticated
        console.log('Session is invalid, clearing user state');
        setUser(null);
        setRole(null);
        setIsAdmin(false);
        setIsAuthenticated(false);
        
        // Clear any existing cookies
        document.cookie = 'session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    } catch (error) {
      console.error('Session verification error:', error);
      setAuthError('There was a problem verifying your session.');
      // On error, keep the current authentication state
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize auth state from storage on mount - only once
  useEffect(() => {
    const initializeAuth = async () => {
      // Start with loading state
      setIsLoading(true);
      
      try {
        // Use the centralized function to get session ID
        const sessionId = authService.getSessionId();
        const storedUser = authService.getCurrentUser();
        
        // Only log in development mode and only if there's something to report
        if (process.env.NODE_ENV === 'development' && (storedUser || sessionId)) {
          console.debug('Auth initialization:', { 
            hasUser: !!storedUser, 
            hasSessionId: !!sessionId
          });
        }
        
        // If we have both user data and session ID, use them
        if (storedUser && sessionId) {
          // Use updateUserState to prevent redundant updates
          updateUserState(storedUser);
        } else {
          // Clear auth state if missing user or session
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
    
    // No periodic checks to avoid vibration/loops
    // We'll only verify on important actions like navigation
    
    return () => {}; // No cleanup needed
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      // Call the login service
      const userData = await authService.login(credentials);
      
      // Log the authentication process
      console.log('Login successful, updating user state with:', userData);
      
      // Update the authentication state
      updateUserState(userData);
      
      // Force a session verification after login
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
      
      // Don't automatically log in the user after registration
      // Just return the user data without updating the auth state
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
      // Even if server logout fails, clear local state
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
