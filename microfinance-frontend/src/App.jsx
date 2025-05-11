import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import React, { useEffect, useState } from 'react';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminLayout from './layouts/AdminLayout';
import { AuthProvider } from './contexts/AuthContext';
import DevLogin from './components/auth/DevLogin';
import ErrorBoundary from './components/common/ErrorBoundary';
import LandingPage from './components/common/LandingPage';
// Auth Components
import Login from './components/auth/Login';
// Layouts
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import Register from './components/auth/Register';
// User Pages
import UserDashboard from './pages/user/Dashboard';
import UserLayout from './layouts/UserLayout';

function App() {
  

  

  return (
    <AuthProvider>
      <ErrorBoundary>
        <Router>
          <Routes>
            {/* Public Routes with MainLayout */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dev-login" element={<DevLogin />} />
              {/* Add more public routes here */}
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                {/* Add more admin routes here */}
              </Route>
            </Route>

            {/* User Routes */}
            <Route path="/user" element={<ProtectedRoute allowedRoles={['user']} />}>
              <Route element={<UserLayout />}>
                <Route path="dashboard" element={<UserDashboard />} />
                {/* Add more user routes here */}
              </Route>
            </Route>

            {/* Catch all - 404 */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;
