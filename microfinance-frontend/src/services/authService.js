import api from './api';

// Secure storage utility functions
const secureStorage = {
  // Store user data securely (in sessionStorage for better security than localStorage)
  setUser: (userData) => {
    if (!userData) return;
    sessionStorage.setItem('user', JSON.stringify(userData));
  },
  
  // Get user data
  getUser: () => {
    try {
      const userData = sessionStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },
  
  // Clear user data
  clearUser: () => {
    sessionStorage.removeItem('user');
  }
};

const authService = {
  // Register a new user
  register: async (userData) => {
    try {
      const response = await api.post('/users/Register', userData);
      const user = response.data.user;
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
        firstName: isAdmin ? 'Admin' : 'User',
        lastName: 'Developer',
        role: isAdmin ? 'admin' : 'user',
        createdAt: new Date().toISOString()
      };
      
      // Store the mock user in secure storage
      secureStorage.setUser(mockUser);
      return mockUser;
    }
    
    // Normal login flow for production
    try {
      const response = await api.post('/users/login', credentials);
      const user = response.data.user;
      secureStorage.setUser(user);
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error.response?.data || { message: 'Login failed. Please check your credentials.' };
    }
  },

  // Logout user
  logout: async () => {
    try {
      await api.delete('/users/logout');
      secureStorage.clearUser();
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      // Even if the API call fails, clear local data
      secureStorage.clearUser();
      throw error.response?.data || { message: 'Logout failed on server, but you have been logged out locally.' };
    }
  },

  // Get current user info from storage (synchronous)
  getCurrentUser: () => {
    return secureStorage.getUser();
  },
  
  // Fetch current user info from server (asynchronous)
  fetchCurrentUser: async () => {
    try {
      const response = await api.get('/users/me');
      const user = response.data.user;
      secureStorage.setUser(user);
      return user;
    } catch (error) {
      console.error('Get user info error:', error);
      // If 401 Unauthorized, clear user data
      if (error.response?.status === 401) {
        secureStorage.clearUser();
      }
      throw error.response?.data || { message: 'Failed to get user info. Please log in again.' };
    }
  },

  // Verify session is still valid
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
      
      // For regular users, verify with the backend
      const response = await api.get('/users/verify-session');
      return response.status === 200;
    } catch (error) {
      console.error('Session verification error:', error);
      // If unauthorized, clear user data
      if (error.response?.status === 401) {
        secureStorage.clearUser();
      }
      return false;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!secureStorage.getUser();
  },

  // Check if user is admin
  isAdmin: () => {
    const user = secureStorage.getUser();
    return user ? user.role === 'admin' : false;
  },

  // Get user role
  getUserRole: () => {
    const user = secureStorage.getUser();
    return user ? user.role : null;
  }
};

export default authService;
