const asyncHandler = require('express-async-handler');
const axios = require('axios');
const Order = require('../models/Order');

// @desc    Initialize Chapa Payment
// @route   POST /api/payment/initialize
// @access  Private
const initializePayment = asyncHandler(async (req, res) => {
    const { orderId } = req.body;
    const order = await Order.findById(orderId).populate('user', 'name phone');

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    if (!order.user) {
        res.status(400);
        throw new Error('User not found for this order');
    }

    const tx_ref = `TX-${Date.now()}`;
    order.paymentResult = { id: tx_ref, status: 'pending' };
    await order.save();

    const CHAPA_URL = 'https://api.chapa.co/v1/transaction/initialize';
    // Use FRONTEND_URL or CLIENT_URL for production, fallback to localhost for dev
    const clientUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
    const CALLBACK_URL = `${clientUrl}/payment-result?tx_ref=${tx_ref}`;

    // User model has no email field — generate a unique valid email per order
    const userEmail = `customer_${order._id}@gmail.com`;

    // Sanitize name: ensure first_name and last_name are never empty
    const nameParts = (order.user.name || 'Customer User').split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    // Sanitize phone: Chapa expects Ethiopian format like 0911223344 or 251911223344
    let phone = (order.user.phone || '0911223344').replace(/[^0-9]/g, '');
    if (phone.startsWith('251') && phone.length === 12) {
        phone = '0' + phone.slice(3); // convert 251911... to 0911...
    }
    if (phone.length < 10) {
        phone = '0911223344'; // safe fallback
    }

    const data = {
        amount: order.totalPrice,
        currency: 'ETB',
        email: userEmail,
        first_name: firstName,
        last_name: lastName,
        phone_number: phone,
        tx_ref: tx_ref,
        callback_url: CALLBACK_URL,
        return_url: CALLBACK_URL,
        customization: {
            title: 'Gondar Store',
            description: 'Payment for order',
        },
    };

    console.log('Chapa payload:', JSON.stringify(data, null, 2));

    try {
        const response = await axios.post(CHAPA_URL, data, {
            headers: {
                Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
            },
        });

        if (response.data.status === 'success') {
            res.json({ checkout_url: response.data.data.checkout_url });
        } else {
            console.error('Chapa non-success response:', response.data);
            res.status(400).json({ message: 'Chapa initialization failed', details: response.data });
        }

    } catch (error) {
        console.error("Chapa Error:", error.response?.data || error.message);
        const errorMsg = error.response?.data?.message || error.message;
        const errorDetails = error.response?.data || {};
        
        res.status(500).json({ 
            message: "Payment initialization failed", 
            chapaMessage: errorMsg,
            details: errorDetails
        });
    }
});

// @desc    Verify Payment
// @route   GET /api/payment/verify/:tx_ref
// @access  Public
const verifyPayment = asyncHandler(async (req, res) => {
    const { tx_ref } = req.params;

    try {
        const response = await axios.get(
            `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
                },
            }
        );

        if (response.data.status === 'success') {
            const order = await Order.findOne({ 'paymentResult.id': tx_ref });

            if (order) {
                order.isPaid = true;
                order.paidAt = Date.now();
                order.paymentResult = {
                    id: tx_ref,
                    status: 'success',
                    update_time: Date.now(),
                    email_address: order.user ? order.user.email : 'customer@example.com',
                };
                order.status = 'Preparing'; // Auto move to preparation

                await order.save();
                res.json({ status: 'success', order });
            } else {
                res.status(404);
                throw new Error('Order not found for this transaction');
            }
        } else {
            res.status(400);
            throw new Error('Payment not verified');
        }
    } catch (error) {
        console.error("Chapa Verify Error:", error.response?.data || error.message);
        res.status(500);
        throw new Error('Payment verification failed');
    }
});

module.exports = {
    initializePayment,
    verifyPayment,
};
