import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import About from '../pages/About';
import Services from '../pages/Services';
import Contact from '../pages/Contact';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import TermsOfService from '../pages/TermsOfService';
import Deposit from '../components/stripe/Deposit';
import Withdraw from '../components/stripe/Withdraw';
import LoanRepayment from '../components/stripe/LoanRepayment';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/deposit" element={<Deposit />} />
      <Route path="/withdraw" element={<Withdraw />} />
      <Route path="/loan-repayment" element={<LoanRepayment />} />
    </Routes>
  );
};

export default AppRoutes;
