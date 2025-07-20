import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import React, { useEffect, useState } from 'react';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import SavingsControl from './pages/admin/SavingsControl';

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
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
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
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Notifications from './pages/Notifications';
import EmailVerified from './pages/EmailVerified';

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
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Services />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/email-verified" element={<EmailVerified />} />
              {process.env.NODE_ENV === 'development' && (
                <Route path="/dev-login" element={<DevLogin />} />
              )}
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="savings" element={<SavingsControl />} />

                <Route path="approve-loans" element={<ApproveLoans />} />
                <Route path="company-balance" element={<CompanyBalance />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>
            </Route>

            {/* User Routes */}
            <Route path="/user" element={<ProtectedRoute allowedRoles={['user']} />}>
              <Route element={<UserLayout />}>
                <Route path="dashboard" element={<UserDashboard />} />
                <Route path="savings" element={<SavingsAccount />} />
                <Route path="deposit" element={<div className="p-6"><h1 className="text-2xl font-bold mb-4">Deposit</h1><p>Deposit functionality coming soon...</p></div>} />
                <Route path="withdraw" element={<div className="p-6"><h1 className="text-2xl font-bold mb-4">Withdraw</h1><p>Withdraw functionality coming soon...</p></div>} />
                {/* ApplyLoan route removed */}
                <Route path="loans" element={<MyLoans />} />
                <Route path="pay-loan" element={<LoanRepayment />} />
                <Route path="credit-score" element={<CreditScore />} />
                <Route path="profile" element={<Profile />} />
                <Route path="notifications" element={<Notifications />} />
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>
            </Route>

            {/* Catch all - redirect to login for unauthenticated users */}
            <Route path="*" element={
              <Navigate to="/login" replace state={{ error: 'Page not found' }} />
            } />
          </Routes>
        </Router>
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;
