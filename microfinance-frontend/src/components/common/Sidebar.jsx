import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const { user, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Common menu items for both admin and user
  const commonMenuItems = [
    {
      path: '/dashboard',
      icon: '🏠',
      label: 'Dashboard',
      iconClass: 'home-icon'
    },
    {
      path: '/loans',
      icon: '💸',
      label: 'Loans',
      iconClass: 'loan-icon'
    },
    {
      path: '/transactions',
      icon: '📊',
      label: 'Transactions',
      iconClass: 'transaction-icon'
    },
    {
      path: '/notifications',
      icon: '🔔',
      label: 'Notifications',
      iconClass: 'notification-icon'
    },
  ];

  // Admin-specific menu items
  const adminMenuItems = [
    {
      path: '/users',
      icon: '👥',
      label: 'Users',
      iconClass: 'user-icon'
    },
    {
      path: '/settings',
      icon: '⚙️',
      label: 'Settings',
      iconClass: 'setting-icon'
    },
    {
      path: '/reports',
      icon: '📊',
      label: 'Reports',
      iconClass: 'report-icon'
    },
  ];

  const isCurrentRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <div className={`fixed left-0 top-0 h-screen bg-white shadow-lg transition-transform duration-300 ${
      isOpen ? 'w-64' : 'w-16'
    }`}>
      <div className="flex items-center justify-center h-16 bg-blue-600 text-white">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-2xl"
        >
          {isOpen ? '←' : '→'}
        </button>
        <span className={`${isOpen ? 'ml-2' : 'hidden'} text-xl font-bold`}>MicroFinance</span>
      </div>

      <nav className="mt-4">
        <ul className="space-y-2">
          {commonMenuItems.map((item) => (
            <li key={item.path} className="px-4 py-2 hover:bg-gray-100">
              <Link
                to={item.path}
                className={`flex items-center space-x-2 ${
                  isOpen ? 'justify-start' : 'justify-center'
                } ${
                  isCurrentRoute(item.path) ? 'bg-blue-50' : ''
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className={`${isOpen ? '' : 'hidden'} text-sm`}>{item.label}</span>
              </Link>
            </li>
          ))}

          {isAdmin && (
            <div className="mt-4 border-t">
              <h3 className="px-4 py-2 text-sm font-semibold text-gray-600">
                Admin
              </h3>
              <ul className="space-y-2">
                {adminMenuItems.map((item) => (
                  <li key={item.path} className="px-4 py-2 hover:bg-gray-100">
                    <Link
                      to={item.path}
                      className={`flex items-center space-x-2 ${
                        isOpen ? 'justify-start' : 'justify-center'
                      } ${
                        isCurrentRoute(item.path) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className={`${isOpen ? '' : 'hidden'} text-sm`}>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ul>
      </nav>

      <div className="absolute bottom-0 left-0 w-full border-t">
        <div className="px-4 py-3">
          <div className="flex items-center space-x-2">
            <img
              src="/profile-placeholder.png"
              alt="Profile"
              className="w-8 h-8 rounded-full"
            />
            <div className={`${isOpen ? '' : 'hidden'}`}>
              <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
