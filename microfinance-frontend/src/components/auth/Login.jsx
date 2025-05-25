import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, authError, isAuthenticated, role, clearAuthError } = useAuth();

  useEffect(() => {
    // Clear any previous errors when component mounts
    clearAuthError();
    
    // Check if redirected due to session expiration
    if (location.search.includes('session=expired')) {
      setShowSessionExpired(true);
    }
    
    // Redirect if already authenticated
    if (isAuthenticated) {
      const from = location.state?.from || (role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, role, location, clearAuthError]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // State to track login errors
  const [loginError, setLoginError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear any previous errors
    setLoginError('');
    
    if (validateForm()) {
      try {
        console.log('Submitting login form with:', formData);
        await login(formData);
        
        // Force redirect after successful login
        console.log('Login successful, manually redirecting...');
        const redirectTo = role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
        console.log('Redirecting to:', redirectTo);
        
        // Short timeout to allow state to update before redirect
        setTimeout(() => {
          navigate(redirectTo, { replace: true });
        }, 500);
      } catch (error) {
        console.error('Login error:', error);
        
        // Set a specific error message for incorrect credentials
        if (error.message && error.message.includes('credentials')) {
          setLoginError('Invalid email or password. Please try again.');
        } else if (error.message) {
          setLoginError(error.message);
        } else {
          setLoginError('Login failed. Please check your credentials and try again.');
        }
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 w-full max-w-md mx-auto">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {(authError || showSessionExpired || loginError) && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {showSessionExpired 
                  ? 'Your session has expired. Please log in again.' 
                  : loginError || authError}
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`form-input ${formErrors.email ? 'border-red-500' : ''}`}
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`form-input ${formErrors.password ? 'border-red-500' : ''}`}
                  />
                  {formErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full flex justify-center"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-center text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
