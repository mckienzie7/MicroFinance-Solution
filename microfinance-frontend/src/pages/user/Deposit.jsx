import React, { useState } from 'react';
import StripePayment from '../../components/StripePayment';
import axios from 'axios';

const Deposit = () => {
    const [amount, setAmount] = useState(0);
    const [message, setMessage] = useState('');

    const handleDeposit = async (paymentMethodId) => {
        try {
            const userId = 'get_user_id_from_auth_context'; // Replace with actual user ID from context
            const response = await axios.post('/api/v1/stripe/deposit', {
                amount,
                payment_method_id: paymentMethodId,
                user_id: userId,
            });
            setMessage('Deposit successful!');
        } catch (error) {
            setMessage('Deposit failed. Please try again.');
        }
    };

    return (
        <div>
            <h2>Deposit Funds</h2>
            <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
            />
            <StripePayment amount={amount} handlePayment={handleDeposit} />
            {message && <p>{message}</p>}
        </div>
    );
};

export default Deposit;
