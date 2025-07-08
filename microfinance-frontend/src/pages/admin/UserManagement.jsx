import React, { useState, useEffect } from 'react';
import { 
  TrashIcon,
  UserGroupIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  XMarkIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const UserDetailModal = ({ user, onClose, onDelete }) => {
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

           

            {userProfile?.fayda_document_url && (
              <div className="flex flex-col space-y-2">
                <p className="text-sm font-medium text-gray-500">ID Document</p>
                <div 
                  className="relative h-48 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => {
                    const fileUrl = `${api.defaults.baseURL}/api/v1/users/${user.id}/fayda-document/download`;
                    console.log('Opening document URL:', fileUrl);
                    window.open(fileUrl, '_blank');
                  }}
                >
                  {userProfile.fayda_document_url.toLowerCase().endsWith('.pdf') ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <DocumentTextIcon className="h-16 w-16 text-gray-400" />
                      <p className="text-sm text-gray-500 mt-2">Click to view PDF</p>
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
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-30 transition-all">
                    <EyeIcon className="h-8 w-8 text-white opacity-0 hover:opacity-100" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

          <div className="border-t mt-6 pt-6">
            <div className="flex justify-end space-x-3">
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
      const response = await api.get('/api/v1/users', {
        params: { admin: true },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_id')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        const normalUsers = response.data.filter(user => user.admin !== true);
        const formattedUsers = normalUsers.map(user => ({
          id: user.id,
          username: user.fullname || 'N/A',
          email: user.email,
          phone_number: user.phone_number,
          is_admin: user.admin === true,
          is_active: user.is_verified === true,
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
                        <div className="flex justify-center space-x-3">
                          <button 
                            className="text-indigo-600 hover:text-indigo-900"
                            onClick={() => {
                              setCurrentUser(user);
                              setShowDetailModal(true);
                            }}
                            aria-label="View user details"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          
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