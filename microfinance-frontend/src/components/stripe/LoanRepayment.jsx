import React, { useState } from 'react';
import StripePayment from './StripePayment';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const LoanRepayment = () => {
  const { user } = useAuth();
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async (paymentMethodId) => {
    console.log('LoanRepayment handlePayment called with:', paymentMethodId);
    
    setIsProcessing(true);
    setPaymentError(null);
    setPaymentSuccess(false);

    try {
      const paymentData = {
        loan_id: 'example-loan-id', // This should be dynamic in a real implementation
        amount: 200, // This should be dynamic in a real implementation
        payment_method_id: paymentMethodId,
        user_id: user.id,
      };

      console.log('Sending loan repayment data:', paymentData);

      const response = await api.post('/api/v1/stripe/repay_loan', paymentData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_id')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Loan repayment successful:', response.data);
      setPaymentSuccess(true);
      setPaymentError(null);
    } catch (error) {
      console.error('Loan repayment failed:', error);
      setPaymentError(error.response?.data?.error || 'Loan repayment failed. Please try again.');
      setPaymentSuccess(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Loan Repayment</h2>
      
      {paymentSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-green-700">Loan repayment successful!</div>
        </div>
      )}
      
      {paymentError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-700">{paymentError}</div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Make a Payment</h3>
        <p className="text-gray-600 mb-4">Amount: 200 ETB</p>
        
        <StripePayment
          amount={200}
          handlePayment={handlePayment}
        />
      </div>
    </div>
  );
};

export default LoanRepayment;

