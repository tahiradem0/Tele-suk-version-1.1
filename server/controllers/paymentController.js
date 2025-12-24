const asyncHandler = require('express-async-handler');
const axios = require('axios');
const Order = require('../models/Order');

// @desc    Initialize Chapa Payment
// @route   POST /api/payment/initialize
// @access  Private
const initializePayment = asyncHandler(async (req, res) => {
    const { orderId } = req.body;
    const order = await Order.findById(orderId).populate('user', 'name phone email');

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    const tx_ref = `TX-${Date.now()}`;
    order.paymentResult = { id: tx_ref, status: 'pending' };
    await order.save();

    // Mock Chapa Initialization (Replace with actual API call)
    // For local dev, we might just return a success payload or redirect URL
    const CHAPA_URL = 'https://api.chapa.co/v1/transaction/initialize';
    const CALLBACK_URL = `http://localhost:5173/payment-result?tx_ref=${tx_ref}`;

    const data = {
        amount: order.totalPrice,
        currency: 'ETB',
        email: 'ademt0614@gmail.com', // Updated email
        first_name: order.user.name.split(' ')[0], // Try to split name
        last_name: order.user.name.split(' ')[1] || 'User',
        phone_number: order.user.phone,
        tx_ref: tx_ref,
        callback_url: CALLBACK_URL,
        return_url: CALLBACK_URL,
        customization: {
            title: 'Tele-Suk Payment',
            description: 'Payment for order',
        },
    };

    try {
        const response = await axios.post(CHAPA_URL, data, {
            headers: {
                Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
            },
        });

        if (response.data.status === 'success') {
            res.json({ checkout_url: response.data.data.checkout_url });
        } else {
            res.status(400);
            throw new Error('Chapa initialization failed');
        }

    } catch (error) {
        console.error("Chapa Error:", error.response?.data || error.message);
        // Fallback for DEV mode if API fails or no Key
        if (process.env.NODE_ENV === 'development') {
            return res.status(500).json({ message: "Chapa Payment Error", details: error.message });
        }
        res.status(500);
        throw new Error('Payment initialization failed');
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
                    email_address: 'ademt0614@gmail.com',
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
