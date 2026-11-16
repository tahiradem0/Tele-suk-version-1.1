const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const Settings = require('../models/Settings');

async function fix() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const res = await Settings.updateOne({}, {
            chapaTestSecretKey: 'CHASECK_TEST-IXvdkCmyuUbnyrFMtC2K6y8maSbXgrV5',
            chapaTestPublicKey: 'CHAPUBK-ako9ciwIHZCGi1GiV9CzQdknSMBb1wby',
            chapaLiveSecretKey: 'CHASECK-zUKTw15FI5pNaH1MEntujn63Mmw5IgXR',
            chapaLivePublicKey: 'CHAPUBK-ako9ciwIHZCGi1GiV9CzQdknSMBb1wby',
            paymentMode: 'test'
        });
        console.log('Update result:', res);
        const s = await Settings.findOne();
        console.log('Verified Settings in DB:');
        console.log('  paymentMode:', s.paymentMode);
        console.log('  chapaTestSecretKey:', s.chapaTestSecretKey);
        console.log('  chapaLiveSecretKey:', s.chapaLiveSecretKey);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
fix();
