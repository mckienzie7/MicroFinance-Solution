import React, { useState } from 'react';
import StripeForm from './StripeForm';

const Withdraw = ({ user, onTransactionSuccess }) => {
  const [amount, setAmount] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const handlePaymentSuccess = (response) => {
    console.log('Withdrawal successful:', response);
    setPaymentSuccess(true);
    setPaymentError(null);
    setAmount('');
    if (onTransactionSuccess) {
      onTransactionSuccess();
    }
  };

  const handlePaymentError = (error) => {
    console.error('Withdrawal failed:', error);
    setPaymentError(error.message || 'Withdrawal failed. Please try again.');
    setPaymentSuccess(false);
  };

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
    setPaymentError(null);
    setPaymentSuccess(false);
  };

  return (
    <div>
      <input
        type="number"
        value={amount}
        onChange={handleAmountChange}
        placeholder="Enter withdrawal amount"
        style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
      />

      {paymentSuccess && <div style={{ color: 'green', marginTop: '10px' }}>Withdrawal successful!</div>}
      {paymentError && <div style={{ color: 'red', marginTop: '10px' }}>{paymentError}</div>}

      {amount > 0 && (
        <StripeForm
          amount={parseFloat(amount)}
          description="Withdrawal from account"
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
          user={user}
        />
      )}
    </div>
  );
};

export default Withdraw;
