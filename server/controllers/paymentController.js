const asyncHandler = require('express-async-handler');
const axios = require('axios');
const Order = require('../models/Order');
const CapitalTransaction = require('../models/CapitalTransaction');
const Settings = require('../models/Settings');
const { deductOrderStock } = require('../utils/stockHelper');
const { creditAffiliateForOrder } = require('../utils/affiliateHelper');

// Helper to get active Chapa secret key and mode from Settings
const getChapaConfig = async () => {
    let settings = await Settings.findOne();
    if (!settings) {
        settings = {
            paymentMode: 'test',
            chapaTestSecretKey: process.env.CHAPA_SECRET_KEY,
            chapaLiveSecretKey: process.env.CHAPA_SECRET_KEY,
            allowMockCheckout: true,
        };
    }

    const isLive = settings.paymentMode === 'live';
    
    // Chapa determines test vs live mode strictly by the key prefix:
    // Test keys start with "CHASECK_TEST-"
    // Live keys start with "CHASECK-" (without _TEST)
    let secretKey = '';
    if (isLive) {
        if (settings.chapaLiveSecretKey && !settings.chapaLiveSecretKey.includes('_TEST')) {
            secretKey = settings.chapaLiveSecretKey;
        } else if (process.env.CHAPA_LIVE_SECRET_KEY && !process.env.CHAPA_LIVE_SECRET_KEY.includes('_TEST')) {
            secretKey = process.env.CHAPA_LIVE_SECRET_KEY;
        } else if (process.env.CHAPA_SECRET_KEY && !process.env.CHAPA_SECRET_KEY.includes('_TEST')) {
            secretKey = process.env.CHAPA_SECRET_KEY;
        }
    } else {
        // Test mode: MUST start with CHASECK_TEST-
        if (settings.chapaTestSecretKey && settings.chapaTestSecretKey.startsWith('CHASECK_TEST-')) {
            secretKey = settings.chapaTestSecretKey;
        } else if (process.env.CHAPA_TEST_SECRET_KEY && process.env.CHAPA_TEST_SECRET_KEY.startsWith('CHASECK_TEST-')) {
            secretKey = process.env.CHAPA_TEST_SECRET_KEY;
        } else if (process.env.CHAPA_SECRET_KEY && process.env.CHAPA_SECRET_KEY.startsWith('CHASECK_TEST-')) {
            secretKey = process.env.CHAPA_SECRET_KEY;
        }
    }

    console.log(`[CHAPA GATEWAY] Mode: ${settings.paymentMode?.toUpperCase()} | Using Key: ${secretKey.slice(0, 15)}... (starts with TEST: ${secretKey.startsWith('CHASECK_TEST')})`);

    return {
        paymentMode: settings.paymentMode || 'test',
        isLive,
        secretKey,
        allowMockCheckout: settings.allowMockCheckout !== false,
        storeName: settings.storeName || 'Gondar Suk',
    };
};

// @desc    Initialize Chapa Payment
// @route   POST /api/payment/initialize
// @access  Private
const initializePayment = asyncHandler(async (req, res) => {
    const { orderId, returnUrl } = req.body;
    const order = await Order.findById(orderId).populate('user', 'name phone');

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    if (!order.user) {
        res.status(400);
        throw new Error('User not found for this order');
    }

    const { paymentMode, isLive, secretKey, allowMockCheckout, storeName } = await getChapaConfig();

    const tx_ref = `TX-${paymentMode.toUpperCase()}-${Date.now()}`;
    order.paymentResult = { id: tx_ref, status: 'pending' };
    await order.save();

    const CHAPA_URL = 'https://api.chapa.co/v1/transaction/initialize';
    
    // Dynamic callback URL: respect origin of the requester so localhost checkouts return to localhost
    let clientUrl = returnUrl;
    if (!clientUrl) {
        const origin = req.get('origin') || (req.get('referer') ? new URL(req.get('referer')).origin : null);
        if (origin && !origin.includes('chapa.co')) {
            clientUrl = origin;
        } else if (process.env.NODE_ENV === 'development') {
            clientUrl = 'http://localhost:5173';
        } else {
            clientUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
        }
    }
    clientUrl = clientUrl.replace(/\/payment-result\/?$/, '').replace(/\/$/, '');
    const CALLBACK_URL = `${clientUrl}/payment-result?tx_ref=${tx_ref}`;

    // Valid unique customer email per order to prevent Chapa rate limiting
    const userEmail = order.user.email || `customer_${order.user.phone || order._id}@gmail.com`;

    // Sanitize name
    const nameParts = (order.user.name || 'Customer User').split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    // Sanitize phone
    let phone = (order.user.phone || '0911223344').replace(/[^0-9]/g, '');
    if (phone.startsWith('251') && phone.length === 12) {
        phone = '0' + phone.slice(3);
    }
    if (phone.length < 10) {
        phone = '0911223344';
    }

    // Clean ASCII title under 16 characters for Chapa gateway rules
    const rawTitle = storeName || 'Store';
    let cleanTitle = rawTitle.replace(/[^a-zA-Z0-9 _.-]/g, '').trim().slice(0, 16);
    if (!cleanTitle) cleanTitle = 'Online Store';

    // Note: Chapa requires customization.title to be 16 characters or fewer!
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
            title: cleanTitle,
            description: `Order ${order._id.toString().slice(-6).toUpperCase()}`, // No # symbol per Chapa rules
        },
    };

    console.log(`Chapa [${paymentMode.toUpperCase()} MODE] Payload:`, JSON.stringify(data, null, 2));

    try {
        const response = await axios.post(CHAPA_URL, data, {
            headers: {
                Authorization: `Bearer ${secretKey}`,
            },
        });

        if (response.data.status === 'success') {
            res.json({
                checkout_url: response.data.data.checkout_url,
                mode: paymentMode,
                tx_ref,
            });
        } else {
            console.error('Chapa non-success response:', response.data);

            if (paymentMode === 'test' && allowMockCheckout) {
                // In test mode, fallback to simulation URL so developers can test without blocked card
                console.log('Falling back to test simulation URL');
                res.json({
                    checkout_url: CALLBACK_URL,
                    mode: 'test_simulated',
                    tx_ref,
                });
            } else {
                res.status(400).json({ message: 'Chapa initialization failed', details: response.data });
            }
        }
    } catch (error) {
        console.error('Chapa Error:', error.response?.data || error.message);
        const errorMsg = error.response?.data?.message || error.message;

        if (paymentMode === 'test' && allowMockCheckout) {
            console.log('Providing test redirect URL in test mode');
            res.json({
                checkout_url: CALLBACK_URL,
                mode: 'test_simulated',
                tx_ref,
                simulated: true,
            });
        } else {
            res.status(500).json({
                message: 'Payment initialization failed',
                chapaMessage: errorMsg,
                details: error.response?.data || {},
            });
        }
    }
});

// @desc    Verify Payment
// @route   GET /api/payment/verify/:tx_ref
// @access  Public
const verifyPayment = asyncHandler(async (req, res) => {
    const { tx_ref } = req.params;
    const { paymentMode, secretKey, allowMockCheckout } = await getChapaConfig();

    try {
        // If order was already verified, return success immediately
        const existingOrder = await Order.findOne({ 'paymentResult.id': tx_ref });
        if (existingOrder && existingOrder.isPaid) {
            return res.json({ status: 'success', order: existingOrder, mode: paymentMode, alreadyVerified: true });
        }

        let isSuccess = false;

        // Only allow test-mode fallback when explicitly in test mode (NEVER in live mode)
        if (paymentMode === 'test' && (tx_ref.includes('TEST') || allowMockCheckout)) {
            try {
                const response = await axios.get(
                    `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
                    {
                        headers: {
                            Authorization: `Bearer ${secretKey}`,
                        },
                    }
                );
                isSuccess = response.data.status === 'success';
            } catch (apiErr) {
                if (allowMockCheckout) {
                    console.log(`[TEST MODE] Auto-verifying test transaction: ${tx_ref}`);
                    isSuccess = true;
                }
            }
        } else {
            // Strict live verification with Chapa
            const response = await axios.get(
                `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
                {
                    headers: {
                        Authorization: `Bearer ${secretKey}`,
                    },
                }
            );
            const txStatus = response.data?.data?.status;
            isSuccess = response.data?.status === 'success' && (!txStatus || txStatus === 'success');
        }

        if (isSuccess) {
            const order = existingOrder || await Order.findOne({ 'paymentResult.id': tx_ref });

            if (order) {
                order.isPaid = true;
                order.paidAt = Date.now();
                order.paymentResult = {
                    id: tx_ref,
                    status: 'success',
                    update_time: Date.now(),
                    email_address: order.user ? order.user.email : 'customer@example.com',
                };
                order.status = 'Preparing';

                await order.save();

                // Automatically record verified sale into Capital
                try {
                    const existingCapital = await CapitalTransaction.findOne({ relatedOrder: order._id });
                    if (!existingCapital) {
                        await CapitalTransaction.create({
                            type: 'inflow',
                            category: 'sale',
                            amount: order.totalPrice,
                            description: `${paymentMode === 'test' ? '[TEST] ' : ''}Chapa Sale - Order #${order._id.toString().slice(-6).toUpperCase()}`,
                            paymentMethod: 'Chapa',
                            relatedOrder: order._id,
                        });
                    }
                } catch (capErr) {
                    console.error('Failed to log capital transaction on Chapa verify:', capErr);
                }

                // Deduct inventory stock for bought items (idempotent, records StockMovement)
                try {
                    await deductOrderStock(order, order.user?._id || order.user, `${paymentMode === 'test' ? '[TEST] ' : ''}Chapa Order`);
                } catch (stockErr) {
                    console.error('Failed to deduct stock on Chapa verify:', stockErr);
                }

                // Automatically credit affiliate promoter if order came from a referral link
                await creditAffiliateForOrder(order);

                res.json({ status: 'success', order, mode: paymentMode });
            } else {
                res.status(404);
                throw new Error('Order not found for this transaction');
            }
        } else {
            res.status(400);
            throw new Error('Payment not verified');
        }
    } catch (error) {
        console.error('Chapa Verify Error:', error.response?.data || error.message);
        res.status(error.statusCode || 500);
        throw new Error(error.message || 'Payment verification failed');
    }
});

module.exports = {
    initializePayment,
    verifyPayment,
};
