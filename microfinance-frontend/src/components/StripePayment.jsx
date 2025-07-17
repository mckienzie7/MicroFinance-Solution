import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { 
  CreditCardIcon, 
  ExclamationCircleIcon,
  LockClosedIcon 
} from '@heroicons/react/24/outline';

// Load your Stripe publishable key from environment variables
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51PfpH2RoWCo2y2g5r5OC27A7sLP3I9w4aR4P5aV1m2G4b2G2Gk8sL8c8g8g8g8g8g8g8g8g8g8g8g8g8g8g8g8g8g8g8g8g8g8g8g8g8g8g8g8g8g8gc');

const CheckoutForm = ({ amount, handlePayment }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [cardComplete, setCardComplete] = useState(false);

    const handleCardChange = (event) => {
        setCardComplete(event.complete);
        if (event.error) {
            setError(event.error.message);
        } else {
            setError(null);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        if (processing) return;
        
        setProcessing(true);
        setError(null);

        if (!stripe || !elements) {
            setError('Stripe.js has not loaded yet. Please refresh the page and try again.');
            setProcessing(false);
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
        } else {
            setError(null);
            try {
                await handlePayment(paymentMethod.id);
                // Clear the card element on successful payment
                cardElement.clear();
                setCardComplete(false);
            } catch (err) {
                setError(err.message || 'Payment failed. Please try again.');
            }
            setProcessing(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const cardElementOptions = {
        style: {
            base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                    color: '#aab7c4',
                },
                fontFamily: 'system-ui, -apple-system, sans-serif',
            },
            invalid: {
                color: '#9e2146',
            },
        },
        hidePostalCode: false,
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Card Input Section */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <CreditCardIcon className="inline h-4 w-4 mr-1" />
                        Card Information
                    </label>
                    <div className="border border-gray-300 rounded-md p-3 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                        <CardElement 
                            options={cardElementOptions}
                            onChange={handleCardChange}
                        />
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center">
                            <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                            <span className="text-red-700 text-sm">{error}</span>
                        </div>
                    </div>
                )}

                {/* Security Notice */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center text-sm text-gray-600">
                        <LockClosedIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>Your payment information is secure and encrypted</span>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={!stripe || processing || !cardComplete}
                    className={`w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors
                        ${processing || !cardComplete || !stripe
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                >
                    {processing ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        </>
                    ) : (
                        `Pay ${formatCurrency(amount)}`
                    )}
                </button>
            </form>
        </div>
    );
};

const StripePayment = ({ amount, handlePayment }) => (
    <Elements stripe={stripePromise}>
        <CheckoutForm amount={amount} handlePayment={handlePayment} />
    </Elements>
);

export default StripePayment;