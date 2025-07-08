import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phoneNumber: '+251',
    password: '',
    confirmPassword: '',
    idPicture: null
    // Removed admin field as registration is only for regular users
  });
  const [idPreview, setIdPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [formErrors, setFormErrors] = useState({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  const navigate = useNavigate();
  const { register, isLoading, authError, isAuthenticated, role, clearAuthError } = useAuth();

  useEffect(() => {
    // Clear any previous errors when component mounts
    clearAuthError();
    
    // Redirect if already authenticated
    if (isAuthenticated) {
      const dashboardPath = role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
      navigate(dashboardPath, { replace: true });
    }
  }, [isAuthenticated, navigate, role, clearAuthError]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.fullName) {
      errors.fullName = 'Full name is required';
    }
    
    if (!formData.username) {
      errors.username = 'Username is required';
    }
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.phoneNumber) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!/^\+251\d{9}$/.test(formData.phoneNumber.replace(/[\s-]/g, ''))) {
      errors.phoneNumber = 'Phone number must start with +251 followed by 9 digits';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.idPicture) {
      errors.idPicture = 'ID picture is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      if (files && files[0]) {
        const file = files[0];
        setFormData({
          ...formData,
          [name]: file
        });
        
        // Create preview for ID picture
        const reader = new FileReader();
        reader.onloadend = () => {
          setIdPreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };
  
  const handleFileButtonClick = () => {
    fileInputRef.current.click();
  };

  // State to track specific registration errors
  const [registrationError, setRegistrationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('username', formData.username);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('phoneNumber', formData.phoneNumber);
      formDataToSend.append('admin', 'False');
      
      // Add the ID picture to the form data with the correct key
      if (formData.idPicture) {
        formDataToSend.append('idPicture', formData.idPicture);
      }

      const user = await register(formDataToSend, true);
      setRegistrationSuccess(true);
    } catch (error) {
      console.error('Registration error:', error);
      setRegistrationError(error.message || 'Registration failed. Please try again.');
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-4">Registration Successful!</h2>
          <p className="text-gray-700">
            Thank you for registering. A verification email has been sent to your email address. Please check your inbox and follow the instructions to complete your registration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div>
          <h2 className="text-3xl font-extrabold text-center text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join our microfinance platform to access financial services
          </p>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="p-8">
            {(authError || registrationError) && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {authError || registrationError}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="mt-1">
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`form-input w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${formErrors.fullName ? 'border-red-500' : ''}`}
                    />
                    {formErrors.fullName && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.fullName}</p>
                    )}
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <div className="mt-1">
                    <input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`form-input w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${formErrors.username ? 'border-red-500' : ''}`}
                    />
                    {formErrors.username && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
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
                      className={`form-input w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${formErrors.email ? 'border-red-500' : ''}`}
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                    )}
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="mt-1">
                    <input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      autoComplete="tel"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="e.g., +251912345678"
                      className={`form-input w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${formErrors.phoneNumber ? 'border-red-500' : ''}`}
                    />
                    {formErrors.phoneNumber && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.phoneNumber}</p>
                    )}
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`form-input w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${formErrors.password ? 'border-red-500' : ''}`}
                    />
                    {formErrors.password && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                    )}
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm password
                  </label>
                  <div className="mt-1">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`form-input w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${formErrors.confirmPassword ? 'border-red-500' : ''}`}
                    />
                    {formErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ID Picture Upload - Full width */}
              <div className="mt-6">
                <label htmlFor="idPicture" className="block text-sm font-medium text-gray-700">
                  Upload your National ID (Fayda)
                </label>
                <div className="mt-1">
                  <input
                    id="idPicture"
                    name="idPicture"
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleChange}
                    className="hidden"
                  />
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={handleFileButtonClick}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Choose File
                    </button>
                    <span className="ml-3 text-sm text-gray-500">
                      {formData.idPicture ? formData.idPicture.name : 'No file chosen'}
                    </span>
                  </div>
                  {idPreview && (
                    <div className="mt-2">
                      <img src={idPreview} alt="ID Preview" className="h-32 w-auto object-contain border rounded" />
                    </div>
                  )}
                  {formErrors.idPicture && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.idPicture}</p>
                  )}
                </div>
              </div>

              {/* Login Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Sign in
                  </Link>
                </p>
              </div>

              {/* Submit Button */}
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-200"
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      </div>
  
  );
};

export default Register;
