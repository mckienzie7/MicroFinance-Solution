import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';

const stripePromise = loadStripe('pk_test_51PfpH2RoWCo2y2g5r5OC27A7sLP3I9w4aR4P5aV1m2G4b2G2Gk8sL8c8g8g8g8g8g8g8g8g8g8g8g8g8g8g8g8g8g8g8g8g8g8g8g8g8g');

const CheckoutForm = ({ amount, handlePayment }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setProcessing(true);

        if (!stripe || !elements) {
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
            handlePayment(paymentMethod.id);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <CardElement />
            <button type="submit" disabled={!stripe || processing}>
                {processing ? 'Processing...' : `Pay $${amount}`}
            </button>
            {error && <div>{error}</div>}
        </form>
    );
};

const StripePayment = ({ amount, handlePayment }) => (
    <Elements stripe={stripePromise}>
        <CheckoutForm amount={amount} handlePayment={handlePayment} />
    </Elements>
);

export default StripePayment;
