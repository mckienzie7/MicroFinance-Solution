import React, { useState, useEffect } from 'react';
import { 
  TrashIcon,
  UserGroupIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  XMarkIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const UserDetailModal = ({ user, onClose, onDelete, onActivateAccount, onDeactivateAccount }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageView, setImageView] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get(`/api/v1/users/${user.id}/profile`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('User profile response:', response.data);
        console.log('Fayda document URL:', response.data.fayda_document_url);
        console.log('ID card front URL:', response.data.id_card_front_url);
        console.log('ID card back URL:', response.data.id_card_back_url);
        setUserProfile(response.data);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const openImageView = (imageUrl, title) => {
    console.log('Opening image view with URL:', imageUrl);
    setImageView({ url: imageUrl, title });
  };

  const closeImageView = () => {
    setImageView(null);
  };

  const downloadImage = async (imageUrl, filename) => {
    try {
      const response = await fetch(imageUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_id')}`,
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download image');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">User Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-2">
                <p className="text-sm font-medium text-gray-500">User ID</p>
                <p className="text-sm">{user.id}</p>
              </div>
              
              <div className="flex flex-col space-y-2">
                <p className="text-sm font-medium text-gray-500">Username</p>
                <p className="text-sm">{user.username}</p>
              </div>

              <div className="flex flex-col space-y-2">
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-sm">{user.email}</p>
              </div>

              <div className="flex flex-col space-y-2">
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="text-sm">{user.phone_number}</p>
              </div>

              <div className="flex flex-col space-y-2">
                <p className="text-sm font-medium text-gray-500">Status</p>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex flex-col space-y-2">
                <p className="text-sm font-medium text-gray-500">Created At</p>
                <p className="text-sm">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>

             
            </div>

           

            {/* ID Card Images Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">ID Verification (Fayda)</h4>
              
              {/* Front and Back ID Cards */}
              {(userProfile?.id_card_front_url || userProfile?.id_card_back_url) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Front ID Card */}
                  {userProfile?.id_card_front_url && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700 flex items-center">
                          <DocumentTextIcon className="h-4 w-4 mr-2 text-blue-600" />
                          ID Card - Front
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadImage(
                              `${api.defaults.baseURL}/api/v1/users/${user.id}/id-card-front/download`,
                              `${user.username}_id_card_front.jpg`
                            );
                          }}
                          className="flex items-center px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                          title="Download Front ID"
                        >
                          <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                          Download
                        </button>
                      </div>
                      <div 
                        className="relative h-40 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-blue-200"
                        onClick={() => openImageView(`${api.defaults.baseURL}/api/v1/users/${user.id}/id-card-front/download`, 'ID Card - Front')}
                      >
                        <img 
                          src={`${api.defaults.baseURL}/api/v1/users/${user.id}/id-card-front/download`}
                          alt="ID Card Front" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Error loading front ID image:', e);
                            e.target.parentElement.innerHTML = `
                              <div class="flex flex-col items-center justify-center h-full text-gray-500">
                                <DocumentTextIcon class="h-12 w-12 mb-2" />
                                <p class="text-sm">Image not available</p>
                              </div>
                            `;
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                          <EyeIcon className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-medium">
                          FRONT
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Back ID Card */}
                  {userProfile?.id_card_back_url && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700 flex items-center">
                          <DocumentTextIcon className="h-4 w-4 mr-2 text-purple-600" />
                          ID Card - Back
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadImage(
                              `${api.defaults.baseURL}/api/v1/users/${user.id}/id-card-back/download`,
                              `${user.username}_id_card_back.jpg`
                            );
                          }}
                          className="flex items-center px-2 py-1 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                          title="Download Back ID"
                        >
                          <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                          Download
                        </button>
                      </div>
                      <div 
                        className="relative h-40 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-purple-200"
                        onClick={() => openImageView(`${api.defaults.baseURL}/api/v1/users/${user.id}/id-card-back/download`, 'ID Card - Back')}
                      >
                        <img 
                          src={`${api.defaults.baseURL}/api/v1/users/${user.id}/id-card-back/download`}
                          alt="ID Card Back" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Error loading back ID image:', e);
                            e.target.parentElement.innerHTML = `
                              <div class="flex flex-col items-center justify-center h-full text-gray-500">
                                <DocumentTextIcon class="h-12 w-12 mb-2" />
                                <p class="text-sm">Image not available</p>
                              </div>
                            `;
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                          <EyeIcon className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded-md text-xs font-medium">
                          BACK
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : userProfile?.fayda_document_url ? (
                /* Legacy Fayda Document Support */
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 flex items-center">
                    <DocumentTextIcon className="h-4 w-4 mr-2 text-green-600" />
                    ID Document (Legacy)
                  </p>
                  <div 
                    className="relative h-48 bg-gradient-to-br from-green-50 to-green-100 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-green-200"
                    onClick={() => {
                      const fileUrl = `${api.defaults.baseURL}/api/v1/users/${user.id}/fayda-document/download`;
                      console.log('Opening document URL:', fileUrl);
                      window.open(fileUrl, '_blank');
                    }}
                  >
                    {userProfile.fayda_document_url.toLowerCase().endsWith('.pdf') ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <DocumentTextIcon className="h-16 w-16 text-green-600" />
                        <p className="text-sm text-green-700 mt-2 font-medium">Click to view PDF</p>
                      </div>
                    ) : (
                      <img 
                        src={`${api.defaults.baseURL}/api/v1/users/${user.id}/fayda-document/download`}
                        alt="ID Document" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          console.error('Error loading image:', e);
                          e.target.src = '/placeholder-id.png';
                        }}
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 transition-all">
                      <EyeIcon className="h-8 w-8 text-white opacity-0 hover:opacity-100" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No ID verification documents uploaded</p>
                  <p className="text-sm text-gray-400 mt-1">User needs to upload their Fayda (ID card)</p>
                </div>
              )}
            </div>

            {/* Image View Modal */}
            {imageView && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={closeImageView}>
                <div className="relative max-w-4xl max-h-full p-4">
                  <button
                    onClick={closeImageView}
                    className="absolute top-2 right-2 text-white hover:text-gray-300 z-10"
                  >
                    <XMarkIcon className="h-8 w-8" />
                  </button>
                  <img
                    src={imageView.url}
                    alt={imageView.title}
                    className="max-w-full max-h-full object-contain rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
                    <p className="font-medium">{imageView.title}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

          <div className="border-t mt-6 pt-6">
            <div className="flex justify-between items-center">
              <div className="flex space-x-3">
                {user.is_active ? (
                  <button
                    onClick={() => {
                      onDeactivateAccount(user.id);
                      onClose();
                    }}
                    className="flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    Deactivate Account
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onActivateAccount(user.id);
                      onClose();
                    }}
                    className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Activate Account
                  </button>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => onDelete(user.id)}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete User
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    
  );
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Verify API endpoints are available
  const verifyApiEndpoints = async () => {
    try {
      await api.get('/api/v1/users');
      return true;
    } catch (err) {
      console.error('API verification failed:', err);
      if (err.response && err.response.status === 401) {
        return true;
      }
      console.log('Skipping API verification and using mock data');
      return true;
    }
  };

  // Fetch users from the API
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch users and accounts in parallel
      const [usersResponse, accountsResponse] = await Promise.all([
        api.get('/api/v1/users', {
          params: { admin: true },
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('session_id')}`,
            'Content-Type': 'application/json'
          }
        }),
        api.get('/api/v1/accounts', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('session_id')}`,
            'Content-Type': 'application/json'
          }
        })
      ]);
      
      if (usersResponse.data && Array.isArray(usersResponse.data)) {
        const normalUsers = usersResponse.data.filter(user => user.admin !== true);
        const accounts = accountsResponse.data || [];
        
        // Create a map of user_id to account status
        const accountStatusMap = {};
        accounts.forEach(account => {
          accountStatusMap[account.user_id] = account.status;
        });
        
        const formattedUsers = normalUsers.map(user => ({
          id: user.id,
          username: user.fullname || 'N/A',
          email: user.email,
          phone_number: user.phone_number,
          is_admin: user.admin === true,
          is_active: accountStatusMap[user.id] === 'active',
          account_status: accountStatusMap[user.id] || 'inactive',
          created_at: user.created_at || new Date().toISOString()
        }));
        
        setUsers(formattedUsers);
      } else {
        console.warn('API response did not contain valid user data');
        setUsers([]);
        setError('No user data available from the server');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      if (err.response) {
        switch (err.response.status) {
          case 401:
            setError('Unauthorized. You need admin privileges to view users.');
            break;
          case 404:
            setError('User data not found. The API endpoint may not be available.');
            break;
          default:
            setError(`Failed to load users: ${err.response.data?.message || 'Unknown error'}`);
        }
      } else if (err.request) {
        setError('No response from server. Please check your network connection.');
      } else {
        setError('Failed to load users. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a user
  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await api.delete(`/api/v1/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_id')}`,
        }
      });
      fetchUsers();
      // Close the detail modal if the user is deleted
      if (currentUser && currentUser.id === userId) {
        setShowDetailModal(false);
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(`Failed to delete user: ${err.response?.data?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Activate user account
  const activateAccount = async (userId) => {
    if (!window.confirm('Are you sure you want to activate this user\'s account?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await api.post(`/api/v1/accounts/activate/${userId}`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_id')}`,
        }
      });
      fetchUsers();
      setError(null);
    } catch (err) {
      console.error('Error activating account:', err);
      setError(`Failed to activate account: ${err.response?.data?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Deactivate user account
  const deactivateAccount = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user\'s account?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await api.post(`/api/v1/accounts/deactivate/${userId}`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_id')}`,
        }
      });
      fetchUsers();
      setError(null);
    } catch (err) {
      console.error('Error deactivating account:', err);
      setError(`Failed to deactivate account: ${err.response?.data?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.username && user.username.toLowerCase().includes(searchLower)) ||
      (user.email && user.email.toLowerCase().includes(searchLower))
    );
  });

  // Load users when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">User Management</h2>
          <p className="mt-1 text-sm md:text-base text-gray-500">Manage all system users and their permissions</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={fetchUsers} 
              disabled={isLoading}
              className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin text-blue-500' : 'text-gray-500'}`} />
              <span className="sr-only sm:not-sr-only sm:ml-2">Refresh</span>
            </button>
            
         
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 md:p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserGroupIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p>No users found</p>
              {!error && <p className="text-sm mt-1">Add a new user to get started</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex flex-col">
                          <span>{user.username || 'N/A'}</span>
                          <span className="text-xs text-gray-500 md:hidden">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">{user.email}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex justify-center space-x-2">
                          <button 
                            className="text-indigo-600 hover:text-indigo-900"
                            onClick={() => {
                              setCurrentUser(user);
                              setShowDetailModal(true);
                            }}
                            aria-label="View user details"
                            title="View Details"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          
                          {user.is_active ? (
                            <button 
                              className="text-red-600 hover:text-red-900"
                              onClick={() => deactivateAccount(user.id)}
                              aria-label="Deactivate account"
                              title="Deactivate Account"
                              disabled={isLoading}
                            >
                              <XCircleIcon className="h-5 w-5" />
                            </button>
                          ) : (
                            <button 
                              className="text-green-600 hover:text-green-900"
                              onClick={() => activateAccount(user.id)}
                              aria-label="Activate account"
                              title="Activate Account"
                              disabled={isLoading}
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {showDetailModal && currentUser && (
        <UserDetailModal
          user={currentUser}
          onClose={() => {
            setShowDetailModal(false);
            setCurrentUser(null);
          }}
          onDelete={deleteUser}
          onActivateAccount={activateAccount}
          onDeactivateAccount={deactivateAccount}
        />
      )}
      
      {showEditModal && currentUser && (
        <EditUserModal 
          user={currentUser} 
          onClose={() => {
            setShowEditModal(false);
            setCurrentUser(null);
          }} 
          onUserUpdated={fetchUsers} 
        />
      )}
    </div>
  );
};

export default UserManagement;