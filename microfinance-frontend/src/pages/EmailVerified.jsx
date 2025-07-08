import React from 'react';
import { Link } from 'react-router-dom';

const EmailVerified = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold text-green-600 mb-4">Email Verified!</h1>
        <p className="text-gray-700 mb-6">Your email address has been successfully verified. You can now log in to your account.</p>
        <Link
          to="/login"
          className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
};

export default EmailVerified;

