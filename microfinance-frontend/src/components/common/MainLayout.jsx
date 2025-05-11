import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { AuthProvider } from '../../contexts/AuthContext';

const MainLayout = () => {
  return (
    <AuthProvider>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
            <div className="container mx-auto px-6 py-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </AuthProvider>
  );
};

export default MainLayout;
