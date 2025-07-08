import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-8">
            Privacy Policy
          </h1>
          <div className="bg-white p-8 rounded-lg shadow-md">
            <p className="text-gray-600 mb-4">
              Your privacy is important to us. It is our policy to respect your privacy regarding any information we may collect from you across our website, and other sites we own and operate.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-4">1. Information We Collect</h2>
            <p className="text-gray-600 mb-4">
              We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.
            </p>
            <p className="text-gray-600 mb-4">
              The types of personal information we may collect include your name, email address, phone number, and financial information necessary for loan applications and other services.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-600 mb-4">
              We use the information we collect to provide, maintain, and improve our services. This includes processing loan applications, managing accounts, and communicating with you about your account and our services.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-4">3. Data Security</h2>
            <p className="text-gray-600 mb-4">
              We are committed to protecting your personal information and have implemented appropriate technical and organizational security measures to prevent unauthorized access, use, or disclosure.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-4">4. Your Rights</h2>
            <p className="text-gray-600 mb-4">
              You have the right to access, update, or delete your personal information. You can also object to the processing of your personal information or request that we restrict its use.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-4">5. Changes to This Policy</h2>
            <p className="text-gray-600 mb-4">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
            </p>

            <p className="text-gray-600 mt-8">
              If you have any questions about our Privacy Policy, please contact us at <a href="mailto:info@microfinance.com" className="text-blue-600 hover:underline">info@microfinance.com</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
