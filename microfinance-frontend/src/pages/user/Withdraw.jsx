import React, { useState } from 'react';
import StripePayment from '../../components/StripePayment';
import axios from 'axios';

const Withdraw = () => {
    const [amount, setAmount] = useState(0);
    const [message, setMessage] = useState('');

    const handleWithdraw = async (paymentMethodId) => {
        try {
            const userId = 'get_user_id_from_auth_context'; // Replace with actual user ID from context
            const response = await axios.post('/api/v1/stripe/withdraw', {
                amount,
                payment_method_id: paymentMethodId,
                user_id: userId,
            });
            setMessage('Withdrawal successful!');
        } catch (error) {
            setMessage('Withdrawal failed. Please try again.');
        }
    };

    return (
        <div>
            <h2>Withdraw Funds</h2>
            <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
            />
            <StripePayment amount={amount} handlePayment={handleWithdraw} />
            {message && <p>{message}</p>}
        </div>
    );
};

export default Withdraw;
