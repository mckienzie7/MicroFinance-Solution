import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const StripeForm = ({ amount, description, onPaymentSuccess, onPaymentError, user, transactionType = 'deposit' }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);

    if (!stripe || !elements) {
      setError('Stripe.js has not loaded yet.');
      setProcessing(false);
      return;
    }

    if (!user || !user.id) {
      setError('User information is not available. Please log in again.');
      setProcessing(false);
      if (onPaymentError) {
        onPaymentError(new Error('User information not available'));
      }
      return;
    }

    const cardElement = elements.getElement(CardElement);

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      setError(error.message);
      setProcessing(false);
      if (onPaymentError) {
        onPaymentError(error);
      }
      return;
    }

    try {
      const endpoint = transactionType === 'withdrawal' ? 'withdraw' : 'deposit';
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/stripe/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100, // Stripe expects amount in cents
          payment_method_id: paymentMethod.id,
          description: description,
          user_id: user.id,
        }),
      });

      const paymentResponse = await response.json();

      if (response.ok && paymentResponse.status === 'success') {
        onPaymentSuccess(paymentResponse);
      } else {
        const errorMessage = paymentResponse.error || 'An unknown error occurred.';
        setError(errorMessage);
        if (onPaymentError) {
          onPaymentError(new Error(errorMessage));
        }
      }
    } catch (networkError) {
      const errorMessage = 'A network error occurred. Please try again.';
      setError(errorMessage);
      if (onPaymentError) {
        onPaymentError(new Error(errorMessage));
      }
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
      {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
      <button type="submit" disabled={!stripe || processing} style={{ marginTop: '20px', width: '100%' }}>
        {processing ? 'Processing...' : `Pay $${amount}`}
      </button>
    </form>
  );
};

export default StripeForm;
