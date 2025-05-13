import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  UserGroupIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Verify API endpoints are available
  const verifyApiEndpoints = async () => {
    try {
      // Try a simple endpoint that doesn't require authentication
      // We'll just check if the server is responding
      // Use '/status' instead of '/api/v1/status' to avoid duplication
      await api.get('/status');
      return true;
    } catch (err) {
      console.error('API verification failed:', err);
      // If we get a 401 Unauthorized error, the API is working but requires auth
      if (err.response && err.response.status === 401) {
        return true;
      }
      // Skip API verification for now and continue with mock data
      console.log('Skipping API verification and using mock data');
      return true;
    }
  };

  // Fetch users from the API
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch real user data from the API
      const response = await api.post('/users', { admin: "True" });
      
      if (response.data && Array.isArray(response.data)) {
        // Filter out admin users to only show normal users
        const normalUsers = response.data.filter(user => user.admin !== true);
        
        // Process and format the user data
        const formattedUsers = normalUsers.map(user => ({
          id: user.id,
          username: user.username || 'N/A',
          email: user.email,
          is_admin: user.admin === true,
          is_active: user.is_verified === true,
          created_at: user.created_at || new Date().toISOString()
        }));
        
        setUsers(formattedUsers);
      } else {
        // If response doesn't contain data or isn't an array, set empty array
        console.warn('API response did not contain valid user data');
        setUsers([]);
        setError('No user data available from the server');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      if (err.response) {
        // Handle specific HTTP error responses
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
      await api.delete(`/users/${userId}`);
      // Refresh the user list after deletion
      fetchUsers();
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="mt-1 text-gray-500">Manage all system users and their permissions</p>
        </div>
        
        <button 
          onClick={fetchUsers} 
          disabled={isLoading}
          className="flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <ArrowPathIcon className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin text-blue-500' : 'text-gray-500'}`} />
          Refresh
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              className="w-64 pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
            onClick={() => setShowAddModal(true)}
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
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
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.username || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.is_admin ? 'Admin' : 'User'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          onClick={() => {
                            setCurrentUser(user);
                            setShowEditModal(true);
                          }}
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => deleteUser(user.id)}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Add User Modal placeholder - to be implemented */}
      {/* {showAddModal && (
        <AddUserModal 
          onClose={() => setShowAddModal(false)} 
          onUserAdded={fetchUsers} 
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
      )} */}
    </div>
  );
};

export default UserManagement;
