const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const Settings = require('../models/Settings');

async function cleanSettings() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        // Delete all settings docs and create exactly one clean document
        await Settings.deleteMany({});
        const doc = await Settings.create({
            deliveryFee: 5.00,
            paymentMode: 'test',
            themeMode: 'light',
            chapaTestSecretKey: 'CHASECK_TEST-IXvdkCmyuUbnyrFMtC2K6y8maSbXgrV5',
            chapaTestPublicKey: 'CHAPUBK-ako9ciwIHZCGi1GiV9CzQdknSMBb1wby',
            chapaLiveSecretKey: 'CHASECK-zUKTw15FI5pNaH1MEntujn63Mmw5IgXR',
            chapaLivePublicKey: 'CHAPUBK-ako9ciwIHZCGi1GiV9CzQdknSMBb1wby',
            storeName: 'Gondar ሱቅ',
            storePhone: '0978787960',
            storeEmail: 'admin@gondarsuk.com',
            allowMockCheckout: true
        });

        console.log('Successfully initialized single clean settings document:');
        console.log({
            _id: doc._id,
            paymentMode: doc.paymentMode,
            chapaTestSecretKey: doc.chapaTestSecretKey,
            chapaLiveSecretKey: doc.chapaLiveSecretKey
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

cleanSettings();
