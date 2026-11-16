const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const Order = require('../models/Order');
const User = require('../models/User');
const Settings = require('../models/Settings');
const axios = require('axios');

async function testPayment() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const settings = await Settings.findOne();
        console.log('Current Payment Mode:', settings.paymentMode);
        console.log('Test Secret Key:', settings.chapaTestSecretKey);
        console.log('Live Secret Key:', settings.chapaLiveSecretKey);

        const order = await Order.findOne().populate('user', 'name phone email');
        if (!order) {
            console.log('No orders found to test');
            process.exit(0);
        }

        console.log('Testing with Order ID:', order._id.toString(), 'Total:', order.totalPrice);

        // Test with TEST key
        const testData = {
            amount: 50,
            currency: 'ETB',
            email: 'testcustomer@gmail.com',
            first_name: 'Test',
            last_name: 'User',
            phone_number: '0911223344',
            tx_ref: `TEST-VERIFY-${Date.now()}`,
            callback_url: 'http://localhost:5173/payment-result',
            return_url: 'http://localhost:5173/payment-result',
            customization: {
                title: 'Gondar Suk',
                description: `Order ${order._id.toString().slice(-6).toUpperCase()}`,
            },
        };

        console.log('\n--- Sending TEST mode request to Chapa API ---');
        try {
            const testRes = await axios.post('https://api.chapa.co/v1/transaction/initialize', testData, {
                headers: {
                    Authorization: `Bearer ${settings.chapaTestSecretKey}`,
                },
            });
            console.log('TEST MODE RESPONSE:', testRes.data);
        } catch (err) {
            console.error('TEST MODE ERROR:', err.response?.data || err.message);
        }

        // Test with LIVE key
        const liveData = {
            ...testData,
            tx_ref: `LIVE-VERIFY-${Date.now()}`
        };

        console.log('\n--- Sending LIVE mode request to Chapa API ---');
        try {
            const liveRes = await axios.post('https://api.chapa.co/v1/transaction/initialize', liveData, {
                headers: {
                    Authorization: `Bearer ${settings.chapaLiveSecretKey}`,
                },
            });
            console.log('LIVE MODE RESPONSE:', liveRes.data);
        } catch (err) {
            console.error('LIVE MODE ERROR:', err.response?.data || err.message);
        }

        process.exit(0);
    } catch (err) {
        console.error('Script Error:', err);
        process.exit(1);
    }
}

testPayment();
