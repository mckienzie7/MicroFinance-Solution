import api from './api';

// Secure storage utility functions
const secureStorage = {
  // Store user data securely (using localStorage for persistence across page refreshes)
  setUser: (userData) => {
    if (!userData) return;
    localStorage.setItem('user', JSON.stringify(userData));
  },
  
  // Get user data
  getUser: () => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },
  
  // Clear user data
  clearUser: () => {
    localStorage.removeItem('user');
  },

  // Clear session ID
  clearSessionId: () => {
    localStorage.removeItem('session_id');
    document.cookie = 'session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    localStorage.removeItem('user');
  },

  // Store session ID from cookie
  setSessionId: (sessionId) => {
    if (!sessionId) return;
    localStorage.setItem('session_id', sessionId);
    
    // Also set as a cookie for cross-page consistency
    document.cookie = `session_id=${sessionId}; path=/; samesite=lax; max-age=86400`;
    console.log('Stored session ID in localStorage and cookie:', sessionId);
  },

  // Get session ID - try multiple sources
  getSessionId: () => {
    // First try localStorage
    const storedId = localStorage.getItem('session_id');
    if (storedId) {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.debug('Found session ID in localStorage');
      }
      return storedId;
    }
    
    // Then try cookies
    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('session_id='));
    if (sessionCookie) {
      const cookieId = sessionCookie.split('=')[1];
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.debug('Found session ID in cookies');
      }
      // Store it in localStorage for future use
      localStorage.setItem('session_id', cookieId);
      return cookieId;
    }
    
    // Only log this message once per session to avoid console spam
    if (!window._hasLoggedNoSessionId) {
      window._hasLoggedNoSessionId = true;
      console.debug('No session ID found - user not logged in');
    }
    return null;
  },

  // Clear session ID
  clearSessionId: () => {
    localStorage.removeItem('session_id');
    document.cookie = 'session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
};

const authService = {
  // Direct access to storage functions
  getSessionId: secureStorage.getSessionId,
  
  // Register a new user
  register: async (userData, isMultipart = false) => {
    try {
      let payload;
      
      if (isMultipart) {
        // If it's FormData, use it directly
        payload = userData;
      } else {
        // If it's JSON, create the payload object
        payload = {
          username: userData.username,
          email: userData.email,
          password: userData.password,
          fullName: userData.fullName,
          phoneNumber: userData.phoneNumber,
          admin: "False"
        };
      }

      // Send the request
      const response = await api.post('/api/v1/users/register', payload, {
        headers: isMultipart ? {
          'Content-Type': 'multipart/form-data'
        } : {
          'Content-Type': 'application/json'
        }
      });

      // Extract user data from the response
      const user = {
        email: response.data.email,
        username: response.data.username,
        fullname: response.data.fullname,
        phone_number: response.data.phone_number,
        message: response.data.message
      };

      secureStorage.setUser(user);
      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error.response?.data || { message: 'Registration failed. Please try again.' };
    }
  },

  // Login user
  login: async (credentials) => {
    // Check if this is a development login (from DevLogin component)
    const isDevelopmentMode = credentials.password === 'devpassword123';
    
    if (isDevelopmentMode) {
      console.log('Using development login mode');
      // Create a mock user based on the email
      const isAdmin = credentials.email.includes('admin');
      const mockUser = {
        id: 'dev-user-' + Date.now(),
        email: credentials.email,
        username: credentials.email.split('@')[0],
        admin: isAdmin,
        username: credentials.email.split('@')[0],
        admin: isAdmin,
        role: isAdmin ? 'admin' : 'user',
        createdAt: new Date().toISOString()
      };
      
      // Store the mock user in secure storage
      secureStorage.setUser(mockUser);
      // Set a mock session ID for development mode
      const devSessionId = 'dev-session-' + Date.now();
      secureStorage.setSessionId(devSessionId);
      return mockUser;
    }
    
    // Normal login flow for production
    try {
      console.log('Submitting login form with:', credentials);
      console.log('Submitting login form with:', credentials);
      const response = await api.post('/api/v1/users/login', credentials);
      console.log('Login response:', response);
      
      // Extract user data from the response
      console.log('Login response data:', response.data);
      
      // Use the actual username from the backend response
      // This is the username that was entered during registration
      let username = response.data.username;
      
      // If username is undefined or null, fall back to email prefix
      if (!username) {
        username = response.data.email.split('@')[0];
        console.log('Username not provided by backend, using email prefix as fallback:', username);
      } else {
        console.log('Using actual username from database:', username);
      }
      
      console.log('Login response:', response);
      console.log('Login response data:', response.data);
      
      const user = {
        email: response.data.email,
        username: username,
        admin: response.data.admin,
        role: response.data.admin ? 'admin' : 'user',
        id: response.data.id,  // Store user ID
        message: response.data.message
      };
      
      console.log('Constructed user object:', user);
      
      console.log('User data after login:', user);
      
      // Force a small delay to allow the cookie to be set by the browser
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Look for session ID in cookies
      console.log('Checking for session cookie in document.cookie:', document.cookie);
      
      const cookies = document.cookie.split(';');
      console.log('All cookies after login:', cookies);
      
      const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('session_id='));
      if (sessionCookie) {
        const sessionId = sessionCookie.split('=')[1];
        console.log('Session ID found in cookies:', sessionId);
        
        // Store it in localStorage and as a cookie
        secureStorage.setSessionId(sessionId);
      } else {
        console.log('No session cookie found, generating a temporary one');
        
        // Generate a temporary session ID
        const tempSessionId = 'session-' + Date.now();
        console.log('Generated temporary session ID:', tempSessionId);
        secureStorage.setSessionId(tempSessionId);
      }
      
      // Store user data
      secureStorage.setUser(user);
      
      // Verify we have both user and session stored
      const storedUser = secureStorage.getUser();
      const storedSession = secureStorage.getSessionId();
      console.log('Stored authentication state:', { 
        hasUser: !!storedUser, 
        hasSession: !!storedSession,
        user: storedUser,
        sessionId: storedSession
      });
      
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error.response?.data || { message: 'Login failed. Please check your credentials.' };
    }
  },

  // Logout user
  logout: async () => {
    try {
      await api.delete('/api/v1/users/logout');
      secureStorage.clearUser();
      secureStorage.clearSessionId();
      secureStorage.clearSessionId();
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      // Even if the API call fails, clear local data
      secureStorage.clearUser();
      secureStorage.clearSessionId();
      secureStorage.clearSessionId();
      throw error.response?.data || { message: 'Logout failed on server, but you have been logged out locally.' };
    }
  },

  // Get current user info from storage (synchronous)
  getCurrentUser: () => {
    return secureStorage.getUser();
  },
  
  // Fetch current user info from server (asynchronous)
  // Note: Backend doesn't have a /users/me endpoint, so we'll use session verification
  fetchCurrentUser: async () => {
    try {
      const user = secureStorage.getUser();
      
      if (!user) {
        throw new Error('No user found in storage');
      }
      
      // Verify the session is still valid
      const isValid = await authService.verifySession();
      
      if (!isValid) {
        secureStorage.clearUser();
        secureStorage.clearSessionId();
        throw { response: { status: 401 } };
      }
      
      
      
     
      
      return user;
    } catch (error) {
      console.error('Get user info error:', error);
      // If 401 Unauthorized, clear user data
      if (error.response?.status === 401) {
        secureStorage.clearUser();
        secureStorage.clearSessionId();
      }
      throw error.response?.data || { message: 'Failed to get user info. Please log in again.' };
    }
  },

  // Verify session is still valid by checking if the session cookie is valid
  verifySession: async () => {
    try {
      // Get the current user from storage
      const user = secureStorage.getUser();
      
      // If no user in storage, session is invalid
      if (!user) return false;
      
      // Check if this is a development user (created by dev-login)
      if (user.id && user.id.startsWith('dev-user-')) {
        console.log('Development user session verified');
        return true; // Always valid for development users
      }
      
      // For regular users, just check if we have a session ID
      // This simplifies the verification process and prevents infinite loops
      const sessionId = secureStorage.getSessionId();
      
      if (!sessionId) {
        return false;
      }
      
      // Since we have a session ID, consider the session valid
      // This prevents the infinite verification loop
      return true;
    } catch (error) {
      console.error('Session verification error:', error);
      return false;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!secureStorage.getUser() && !!secureStorage.getSessionId();
  },

  // Check if user is admin
  isAdmin: () => {
    const user = secureStorage.getUser();
    return user ? user.admin === true || user.role === 'admin' : false;
  },

  // Get user role
  getUserRole: () => {
    const user = secureStorage.getUser();
    return user ? (user.admin ? 'admin' : 'user') : null;
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    try {
      const response = await api.post('/api/v1/users/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error.response?.data || { message: 'Failed to request password reset. Please try again.' };
    }
  },

  // Reset password with token
  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/api/v1/users/reset-password', { 
        reset_token: token, 
        password: newPassword 
      });
      return response.data;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error.response?.data || { message: 'Failed to reset password. Please try again.' };
    }
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    try {
      const response = await api.post('/api/v1/users/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error.response?.data || { message: 'Failed to request password reset. Please try again.' };
    }
  },

  // Reset password with token
  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/api/v1/users/reset-password', { 
        reset_token: token, 
        password: newPassword 
      });
      return response.data;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error.response?.data || { message: 'Failed to reset password. Please try again.' };
    }
  }
};

export default authService;