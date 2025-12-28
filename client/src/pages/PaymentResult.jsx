import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, X, User } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { paymentService } from '../services/api'; // Import API
import './PaymentResult.css';

const PaymentResult = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { clearCart } = useShop(); // Only need clearCart
    const statusParam = searchParams.get('status'); // 'success' or 'fail' from Chapa redirect? Chapa callback url is just /payment-result?tx_ref=...
    // Actually Chapa return_url puts parameters?
    // My code said: CALLBACK_URL = `http://localhost:5173/payment-result?tx_ref=${tx_ref}`;
    // So usually Chapa doesn't strictly enforce 'status' param in return_url unless customized?
    // But verify endpoint relies on tx_ref.

    const txRef = searchParams.get('tx_ref');

    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (txRef) {
            verifyTransaction(txRef);
        } else {
            setVerificationStatus('failed'); // No ref
            setErrorMessage('Transaction reference missing.');
        }
    }, [txRef]);

    // ... existing mounting useEffect ...

    const verifyTransaction = async (ref) => {
        try {
            const { data } = await paymentService.verify(ref);
            if (data.status === 'success') {
                setVerificationStatus('success');
                clearCart();
                // ... notification logic ...
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Tele-Suk Payment Successful! 🎉', {
                        body: 'Your order has been placed successfully. Thank you for shopping with us!',
                        icon: '/logo.svg'
                    });
                }
            } else {
                setVerificationStatus('failed');
                setErrorMessage('Payment status not success.');
            }
        } catch (error) {
            console.error("Verification failed", error);
            setVerificationStatus('failed');
            setErrorMessage(error.response?.data?.message || error.message || 'Verification request failed.');
        }
    };

    // ... existing 'verifying' return ...
    // ... existing 'success' return ...

    return (
        <div className="page result-page fail">
            <div className="result-content">
                <div className="icon-circle fail-icon">
                    <X size={40} color="white" />
                </div>
                <h1>Payment Failed</h1>
                <p className="sub-text">We couldn't verify your payment.</p>
                {errorMessage && <p className="error-message" style={{ color: 'red', marginTop: '10px' }}>Error: {errorMessage}</p>}

                <button className="retry-btn" onClick={() => navigate('/cart')}>
                    Try Again
                </button>
            </div>
        </div>
    );
};

export default PaymentResult;
