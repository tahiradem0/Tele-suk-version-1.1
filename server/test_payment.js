require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const axios = require('axios');
const User = require('./models/User');
const Order = require('./models/Order');

async function testPayment() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const order = await Order.findOne().sort({ createdAt: -1 }).populate('user', 'name phone email');
        
        if (!order) {
            console.log('No order found.');
            process.exit(0);
        }
        
        console.log(`Found order: ${order._id}, Total: ${order.totalPrice}`);

        const tx_ref = `TX-${Date.now()}`;
        const CALLBACK_URL = `http://localhost:5173/payment-result?tx_ref=${tx_ref}`;

        const data = {
            amount: order.totalPrice,
            currency: 'ETB',
            email: order.user.email || `customer${order.user.phone}@gondarsuk.com`,
            first_name: (order.user.name || 'Customer').split(' ')[0],
            last_name: (order.user.name || 'Customer').split(' ')[1] || 'User',
            phone_number: order.user.phone,
            tx_ref: tx_ref,
            callback_url: CALLBACK_URL,
            return_url: CALLBACK_URL,
            customization: {
                title: 'Gondar ሱቅ Payment',
                description: 'Payment for order',
            },
        };

        const response = await axios.post('https://api.chapa.co/v1/transaction/initialize', data, {
            headers: {
                Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
            },
        });

        console.log('Chapa Response:', response.data);

    } catch (error) {
        console.error('Chapa Error Details:', error.response?.data || error.message);
    } finally {
        mongoose.disconnect();
    }
}
testPayment();
