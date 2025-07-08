import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';

const Profile = () => {
  const { user, setUser, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    fullname: '',
    bio: '',
    location: ''
  });
  const [formErrors, setFormErrors] = useState({});
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // Initialize form with user data
      setFormData({
        username: user.username || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        fullname: user.fullname || '',
        bio: user.bio || '',
        location: user.location || ''
      });
    }
  }, [user]);

  const validateForm = () => {
    const errors = {};
    
    if (formData.phoneNumber && !/^\+?[0-9]{10,15}$/.test(formData.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid phone number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear success message when form is changed
    if (success) setSuccess(false);
    if (error) setError('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await apiClient.put(`/users/${user.id}`, formData);
      setSuccess('Profile updated successfully!');
      setUser({ ...user, ...response.data });
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while updating the profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
    
    // Clear messages when form is changed
    if (passwordSuccess) setPasswordSuccess(false);
    if (passwordErrors[name]) {
      setPasswordErrors({
        ...passwordErrors,
        [name]: ''
      });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">My Profile</h2>
        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          {user?.admin ? 'Administrator' : 'User'}
        </div>
      </div>
      
      {!isAuthenticated ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-yellow-700">Please log in to view your profile.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Profile Header with Avatar */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-blue-600 text-2xl font-bold">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-white">
                <h3 className="text-xl font-semibold">{formData.username}</h3>
                <p className="opacity-80">{formData.email}</p>
                <p className="text-sm opacity-70">Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          
          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                Profile updated successfully!
              </div>
            )}
            
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Username</label>
                <input 
                  type="text" 
                  name="username"
                  value={formData.username} 
                  className="px-3 py-2 bg-gray-100 border rounded-md focus:outline-none" 
                  disabled 
                />
                <p className="mt-1 text-xs text-gray-500">Username cannot be changed</p>
              </div>
              
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email} 
                  className="px-3 py-2 bg-gray-100 border rounded-md focus:outline-none" 
                  disabled 
                />
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
              </div>
              
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleChange}
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  name="phoneNumber"
                  value={formData.phoneNumber} 
                  onChange={handleChange}
                  placeholder="+1234567890"
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                {formErrors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.phoneNumber}</p>
                )}
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="3"
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <button 
                type="button" 
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => {
                  if (user) {
                    setFormData({
                      username: user.username || '',
                      email: user.email || '',
                      phoneNumber: user.phoneNumber || '',
                      fullname: user.fullname || '',
                      bio: user.bio || '',
                      location: user.location || ''
                    });
                  }
                  setFormErrors({});
                  setError('');
                  setSuccess(false);
                }}
              >
                Reset Changes
              </button>
              
              <button 
                type="submit" 
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : 'Update Profile'}
              </button>
            </div>
          </form>
          
          {/* Security Section */}
          <div className="border-t border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Security</h3>
            <div className="space-y-4">
              <button 
                type="button"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {showPasswordForm ? 'Cancel Password Change' : 'Change Password'}
              </button>
              
              {showPasswordForm && (
                <div className="mt-4 bg-gray-50 p-4 rounded-md">
                  <h4 className="text-md font-medium text-gray-800 mb-3">Change Your Password</h4>
                  
                  {passwordSuccess && (
                    <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                      Password changed successfully!
                    </div>
                  )}
                  
                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                      {error}
                    </div>
                  )}
                  
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!validatePasswordForm()) return;
                    
                    setPasswordLoading(true);
                    setError('');
                    setPasswordSuccess(false);

                    try {
                      // Make API call to change password
                      await apiClient.put(`/users/${user.id}/change-password`, {
                        current_password: passwordData.currentPassword,
                        new_password: passwordData.newPassword
                      });
                      
                      setPasswordSuccess(true);
                      // Reset form after successful password change
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    } catch (err) {
                      console.error('Error changing password:', err);
                      setError(err.response?.data?.message || 'Failed to change password. Please check your current password.');
                    } finally {
                      setPasswordLoading(false);
                    }
                  }}>
                    <div className="space-y-4">
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">Current Password</label>
                        <input 
                          type="password" 
                          name="currentPassword"
                          value={passwordData.currentPassword} 
                          onChange={handlePasswordChange}
                          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        />
                        {passwordErrors.currentPassword && (
                          <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                        )}
                      </div>
                      
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input 
                          type="password" 
                          name="newPassword"
                          value={passwordData.newPassword} 
                          onChange={handlePasswordChange}
                          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        />
                        {passwordErrors.newPassword && (
                          <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
                        )}
                      </div>
                      
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                        <input 
                          type="password" 
                          name="confirmPassword"
                          value={passwordData.confirmPassword} 
                          onChange={handlePasswordChange}
                          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        />
                        {passwordErrors.confirmPassword && (
                          <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                        )}
                      </div>
                      
                      <div className="flex justify-end">
                        <button 
                          type="submit" 
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
                          disabled={passwordLoading}
                        >
                          {passwordLoading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Updating...
                            </>
                          ) : 'Save New Password'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
