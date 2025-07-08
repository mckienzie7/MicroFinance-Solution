import React, { useState } from 'react';
import StripePayment from './StripePayment';

const LoanRepayment = () => {
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const handlePaymentSuccess = (response) => {
    console.log('Loan repayment successful:', response);
    setPaymentSuccess(true);
    setPaymentError(null);
  };

  const handlePaymentError = (error) => {
    console.error('Loan repayment failed:', error);
    setPaymentError('Loan repayment failed. Please try again.');
    setPaymentSuccess(false);
  };

  return (
    <div>
      <h2>Loan Repayment</h2>
      {paymentSuccess && <div style={{ color: 'green' }}>Loan repayment successful!</div>}
      {paymentError && <div style={{ color: 'red' }}>{paymentError}</div>}
      <StripePayment
        amount={200} // Example amount
        description="Loan Repayment"
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
      />
    </div>
  );
};

export default LoanRepayment;

