import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import React, { useEffect, useState } from 'react';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import SavingsControl from './pages/admin/SavingsControl';
import LoanApplications from './pages/admin/LoanApplications';
import ApproveLoans from './pages/admin/ApproveLoans';
import CompanyBalance from './pages/admin/CompanyBalance';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';
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
import SavingsAccount from './pages/user/SavingsAccount';
// ApplyLoan component removed
import MyLoans from './pages/user/MyLoans';
import LoanRepayment from './pages/user/LoanRepayment';
import CreditScore from './pages/user/CreditScore';
import Profile from './pages/user/Profile';
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
                <Route path="users" element={<UserManagement />} />
                <Route path="savings" element={<SavingsControl />} />
                <Route path="loan-applications" element={<LoanApplications />} />
                <Route path="approve-loans" element={<ApproveLoans />} />
                <Route path="company-balance" element={<CompanyBalance />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                <Route index element={<Navigate to="dashboard" />} />
              </Route>
            </Route>

            {/* User Routes */}
            <Route path="/user" element={<ProtectedRoute allowedRoles={['user']} />}>
              <Route element={<UserLayout />}>
                <Route path="dashboard" element={<UserDashboard />} />
                <Route path="savings" element={<SavingsAccount />} />
                {/* ApplyLoan route removed */}
                <Route path="loans" element={<MyLoans />} />
                <Route path="pay-loan" element={<LoanRepayment />} />
                <Route path="credit-score" element={<CreditScore />} />
                <Route path="profile" element={<Profile />} />
                <Route index element={<Navigate to="dashboard" />} />
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
