import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import About from '../pages/About';
import Services from '../pages/Services';
import Contact from '../pages/Contact';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import TermsOfService from '../pages/TermsOfService';
import LandingPage from '../components/common/LandingPage';
import Login from '../pages/auth/Login';
// ... import other pages as needed

const AppRoutes = () => (
  <Router>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/login" element={<Login />} />
      {/* Add other routes here */}
    </Routes>
  </Router>
);

export default AppRoutes; 