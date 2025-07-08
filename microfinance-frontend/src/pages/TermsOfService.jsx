import React from 'react';

const TermsOfService = () => {
  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-8">
            Terms of Service
          </h1>
          <div className="bg-white p-8 rounded-lg shadow-md">
            <p className="text-gray-600 mb-4">
              By accessing our website, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.
            </p>
            <p className="text-gray-600 mb-4">
              If you do not agree with any of these terms, you are prohibited from using or accessing this site. The materials contained in this website are protected by applicable copyright and trademark law.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-4">1. Use License</h2>
            <p className="text-gray-600 mb-4">
              Permission is granted to temporarily download one copy of the materials (information or software) on our website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-4">
              <li>modify or copy the materials;</li>
              <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
              <li>attempt to decompile or reverse engineer any software contained on our website;</li>
              <li>remove any copyright or other proprietary notations from the materials; or</li>
              <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-4">2. Disclaimer</h2>
            <p className="text-gray-600 mb-4">
              The materials on our website are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-4">3. Limitations</h2>
            <p className="text-gray-600 mb-4">
              In no event shall we or our suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website, even if we or an authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-4">4. Governing Law</h2>
            <p className="text-gray-600 mb-4">
              These terms and conditions are governed by and construed in accordance with the laws of Ethiopia and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
            </p>

            <p className="text-gray-600 mt-8">
              If you have any questions about our Terms of Service, please contact us at <a href="mailto:info@microfinance.com" className="text-blue-600 hover:underline">info@microfinance.com</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
