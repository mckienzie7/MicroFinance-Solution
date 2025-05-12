import React from 'react';

const Profile = () => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Profile</h2>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 mb-4">Manage your account information:</p>
        <div className="space-y-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Username</label>
            <input type="text" className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" disabled />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" disabled />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input type="tel" className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Update Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
