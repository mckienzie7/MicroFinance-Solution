import React from 'react';
import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';

const UserProfileDisplay = ({ user, onLogout }) => {
  // Debug logging for user object in UserProfileDisplay
  console.log('UserProfileDisplay - User object:', user);
  return (
    <div className="flex-shrink-0 group block">
      <div className="flex items-center">
        <div>
          <div className="h-9 w-9 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
            {user?.username?.charAt(0) || 'U'}
          </div>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
            {user?.username || 'User'}
          </p>
          <button 
            onClick={onLogout}
            className="text-xs font-medium text-gray-500 group-hover:text-gray-700 flex items-center"
          >
            <ArrowLeftOnRectangleIcon className="mr-1 h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileDisplay;
