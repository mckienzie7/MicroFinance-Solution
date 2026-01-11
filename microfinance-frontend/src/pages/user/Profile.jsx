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
    location: '',
    gender: '',
    age: '',
    interests: '',
    hobbies: '',
    preferences: '',
    fayda_id: ''
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
  
  // Profile picture state
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  
  // ID Card state
  const [idCardFront, setIdCardFront] = useState(null);
  const [idCardBack, setIdCardBack] = useState(null);
  const [idCardFrontPreview, setIdCardFrontPreview] = useState(null);
  const [idCardBackPreview, setIdCardBackPreview] = useState(null);
  const [uploadingIdCard, setUploadingIdCard] = useState(false);
  
  // Profile data state
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (user && user.id) {
      fetchProfileData();
    }
  }, [user]);
  
  const fetchProfileData = async () => {
    try {
      setLoadingProfile(true);
      const response = await apiClient.get(`/api/v1/users/${user.id}/profile`);
      const data = response.data;
      setProfileData(data);
      
      // Initialize form with user data
      setFormData({
        username: data.username || '',
        email: data.email || '',
        phoneNumber: data.phone_number || '',
        fullname: data.fullname || '',
        bio: data.bio || '',
        location: data.location || '',
        gender: data.gender || '',
        age: data.age || '',
        interests: data.interests || '',
        hobbies: data.hobbies || '',
        preferences: data.preferences || '',
        fayda_id: data.fayda_id || ''
      });
      
      // Set profile picture preview if exists
      if (data.profile_picture_url) {
        setProfilePicturePreview(`${apiClient.defaults.baseURL}${data.profile_picture_url}`);
      }
      
      // Set ID card previews if exist
      if (data.id_card_front_url) {
        setIdCardFrontPreview(`${apiClient.defaults.baseURL}${data.id_card_front_url}`);
      }
      if (data.id_card_back_url) {
        setIdCardBackPreview(`${apiClient.defaults.baseURL}${data.id_card_back_url}`);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoadingProfile(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (formData.phoneNumber && !/^\+?[0-9]{10,15}$/.test(formData.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid phone number';
    }
    
    if (formData.age && (isNaN(formData.age) || formData.age < 18 || formData.age > 120)) {
      errors.age = 'Please enter a valid age (18-120)';
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
      const updateData = {
        fullname: formData.fullname,
        phone_number: formData.phoneNumber,
        bio: formData.bio,
        location: formData.location,
        gender: formData.gender,
        age: formData.age ? parseInt(formData.age) : null,
        interests: formData.interests,
        hobbies: formData.hobbies,
        preferences: formData.preferences,
        fayda_id: formData.fayda_id
      };
      
      const response = await apiClient.put(`/api/v1/users/${user.id}`, updateData);
      setSuccess('Profile updated successfully!');
      setUser({ ...user, ...response.data });
      
      // Refresh profile data
      await fetchProfileData();
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
  
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid image file (PNG, JPG, JPEG, GIF)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      setProfilePicture(file);
      setProfilePicturePreview(URL.createObjectURL(file));
    }
  };
  
  const handleUploadProfilePicture = async () => {
    if (!profilePicture) {
      setError('Please select a profile picture first');
      return;
    }
    
    setUploadingPicture(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('profile_picture', profilePicture);
      
      const response = await apiClient.post(`/api/v1/users/${user.id}/profile-picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSuccess('Profile picture updated successfully!');
      setProfilePicture(null);
      
      // Refresh profile data
      await fetchProfileData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload profile picture');
    } finally {
      setUploadingPicture(false);
    }
  };
  
  const handleIdCardChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid image file (PNG, JPG, JPEG)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      if (type === 'front') {
        setIdCardFront(file);
        setIdCardFrontPreview(URL.createObjectURL(file));
      } else {
        setIdCardBack(file);
        setIdCardBackPreview(URL.createObjectURL(file));
      }
    }
  };
  
  const handleUploadIdCards = async () => {
    if (!idCardFront && !idCardBack) {
      setError('Please select at least one ID card image');
      return;
    }
    
    setUploadingIdCard(true);
    setError('');
    
    try {
      // Upload front if selected
      if (idCardFront) {
        const formData = new FormData();
        formData.append('id_card_front', idCardFront);
        
        await apiClient.post(`/api/v1/users/${user.id}/id-card-front`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      // Upload back if selected
      if (idCardBack) {
        const formData = new FormData();
        formData.append('id_card_back', idCardBack);
        
        await apiClient.post(`/api/v1/users/${user.id}/id-card-back`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      setSuccess('ID card images updated successfully!');
      setIdCardFront(null);
      setIdCardBack(null);
      
      // Refresh profile data
      await fetchProfileData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload ID card images');
    } finally {
      setUploadingIdCard(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex justify-center items-center min-h-screen">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
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
        <div className="space-y-6">
          {/* Profile Header with Avatar */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {profilePicturePreview ? (
                    <img 
                      src={profilePicturePreview} 
                      alt="Profile" 
                      className="w-20 h-20 rounded-full object-cover border-4 border-white"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-blue-600 text-2xl font-bold border-4 border-white">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className="text-white flex-1">
                  <h3 className="text-xl font-semibold">{formData.fullname || formData.username}</h3>
                  <p className="opacity-80">{formData.email}</p>
                  <p className="text-sm opacity-70">Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</p>
                  {profileData?.is_verified && (
                    <span className="inline-flex items-center mt-1 text-xs bg-green-500 text-white px-2 py-1 rounded">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Profile Picture Upload */}
            <div className="p-6 border-b border-gray-200">
              <h4 className="text-md font-medium text-gray-800 mb-3">Profile Picture</h4>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {profilePicture && (
                  <button
                    onClick={handleUploadProfilePicture}
                    disabled={uploadingPicture}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm"
                  >
                    {uploadingPicture ? 'Uploading...' : 'Upload'}
                  </button>
                )}
              </div>
            </div>
            
            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="p-6">
              {success && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {success}
                </div>
              )}
              
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              <h4 className="text-lg font-medium text-gray-800 mb-4">Personal Information</h4>
              
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
                  <label className="text-sm font-medium text-gray-700 mb-1">Full Name *</label>
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
                    placeholder="+251912345678"
                    className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                  {formErrors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.phoneNumber}</p>
                  )}
                </div>
                
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    min="18"
                    max="120"
                    placeholder="25"
                    className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formErrors.age && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.age}</p>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="City, Country"
                    className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Fayda ID</label>
                  <input
                    type="text"
                    name="fayda_id"
                    value={formData.fayda_id}
                    onChange={handleChange}
                    placeholder="Your Fayda ID"
                    className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Tell us about yourself..."
                    className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Interests</label>
                  <input
                    type="text"
                    name="interests"
                    value={formData.interests}
                    onChange={handleChange}
                    placeholder="e.g., Technology, Finance, Sports"
                    className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Hobbies</label>
                  <input
                    type="text"
                    name="hobbies"
                    value={formData.hobbies}
                    onChange={handleChange}
                    placeholder="e.g., Reading, Traveling, Cooking"
                    className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex flex-col md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1">Preferences</label>
                  <input
                    type="text"
                    name="preferences"
                    value={formData.preferences}
                    onChange={handleChange}
                    placeholder="Your preferences..."
                    className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex items-center justify-between">
                <button 
                  type="button" 
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => {
                    if (profileData) {
                      setFormData({
                        username: profileData.username || '',
                        email: profileData.email || '',
                        phoneNumber: profileData.phone_number || '',
                        fullname: profileData.fullname || '',
                        bio: profileData.bio || '',
                        location: profileData.location || '',
                        gender: profileData.gender || '',
                        age: profileData.age || '',
                        interests: profileData.interests || '',
                        hobbies: profileData.hobbies || '',
                        preferences: profileData.preferences || '',
                        fayda_id: profileData.fayda_id || ''
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
          </div>
          
          {/* ID Card Upload Section */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Identity Verification</h3>
            <p className="text-sm text-gray-600 mb-4">Upload your ID card images for verification purposes</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ID Card Front */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">ID Card Front</label>
                {idCardFrontPreview && (
                  <div className="mb-3">
                    <img 
                      src={idCardFrontPreview} 
                      alt="ID Card Front" 
                      className="w-full h-48 object-cover rounded-md border"
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleIdCardChange(e, 'front')}
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 w-full"
                />
              </div>
              
              {/* ID Card Back */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">ID Card Back</label>
                {idCardBackPreview && (
                  <div className="mb-3">
                    <img 
                      src={idCardBackPreview} 
                      alt="ID Card Back" 
                      className="w-full h-48 object-cover rounded-md border"
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleIdCardChange(e, 'back')}
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 w-full"
                />
              </div>
            </div>
            
            {(idCardFront || idCardBack) && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleUploadIdCards}
                  disabled={uploadingIdCard}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {uploadingIdCard ? 'Uploading...' : 'Upload ID Cards'}
                </button>
              </div>
            )}
          </div>
          
          {/* Security Section */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden p-6">
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
                      await apiClient.put(`/api/v1/users/${user.id}/change-password`, {
                        current_password: passwordData.currentPassword,
                        new_password: passwordData.newPassword
                      });
                      
                      setPasswordSuccess(true);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                      setTimeout(() => {
                        setShowPasswordForm(false);
                        setPasswordSuccess(false);
                      }, 2000);
                    } catch (err) {
                      console.error('Error changing password:', err);
                      setError(err.response?.data?.message || err.response?.data?.description || 'Failed to change password. Please check your current password.');
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
