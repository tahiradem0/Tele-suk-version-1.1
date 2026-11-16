const asyncHandler = require('express-async-handler');
const Settings = require('../models/Settings');

// @desc    Get global settings
// @route   GET /api/settings
// @access  Public
const getSettings = asyncHandler(async (req, res) => {
    let settings = await Settings.findOne();

    if (!settings) {
        settings = await Settings.create({
            deliveryFee: 5.00,
            paymentMode: 'test',
            themeMode: 'light',
            chapaTestSecretKey: process.env.CHAPA_TEST_SECRET_KEY || 'CHASECK_TEST-IXvdkCmyuUbnyrFMtC2K6y8maSbXgrV5',
            chapaTestPublicKey: process.env.CHAPA_TEST_PUBLIC_KEY || process.env.CHAPA_PUBLIC_KEY || 'CHAPUBK-ako9ciwIHZCGi1GiV9CzQdknSMBb1wby',
            chapaLiveSecretKey: process.env.CHAPA_LIVE_SECRET_KEY || 'CHASECK-zUKTw15FI5pNaH1MEntujn63Mmw5IgXR',
            chapaLivePublicKey: process.env.CHAPA_LIVE_PUBLIC_KEY || process.env.CHAPA_PUBLIC_KEY || 'CHAPUBK-ako9ciwIHZCGi1GiV9CzQdknSMBb1wby',
            storeName: 'Gondar ሱቅ',
            storePhone: '0978787960',
            storeEmail: 'admin@gondarsuk.com',
            allowMockCheckout: true
        });
    }

    const result = settings.toObject ? settings.toObject() : { ...settings };

    // Ensure test secret key is always a valid test key (starts with CHASECK_TEST-)
    if (!result.chapaTestSecretKey || !result.chapaTestSecretKey.startsWith('CHASECK_TEST-')) {
        result.chapaTestSecretKey = process.env.CHAPA_TEST_SECRET_KEY || 'CHASECK_TEST-IXvdkCmyuUbnyrFMtC2K6y8maSbXgrV5';
    }
    result.chapaTestPublicKey = result.chapaTestPublicKey || process.env.CHAPA_TEST_PUBLIC_KEY || process.env.CHAPA_PUBLIC_KEY || 'CHAPUBK-ako9ciwIHZCGi1GiV9CzQdknSMBb1wby';

    // Ensure live secret key is always a valid live key (does not include _TEST)
    if (!result.chapaLiveSecretKey || result.chapaLiveSecretKey.includes('_TEST')) {
        result.chapaLiveSecretKey = process.env.CHAPA_LIVE_SECRET_KEY || 'CHASECK-zUKTw15FI5pNaH1MEntujn63Mmw5IgXR';
    }
    result.chapaLivePublicKey = result.chapaLivePublicKey || process.env.CHAPA_LIVE_PUBLIC_KEY || process.env.CHAPA_PUBLIC_KEY || 'CHAPUBK-ako9ciwIHZCGi1GiV9CzQdknSMBb1wby';

    res.json(result);
});

// @desc    Update global settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = asyncHandler(async (req, res) => {
    const {
        deliveryFee,
        paymentMode,
        themeMode,
        chapaTestSecretKey,
        chapaTestPublicKey,
        chapaLiveSecretKey,
        chapaLivePublicKey,
        storeName,
        storePhone,
        storeEmail,
        allowMockCheckout
    } = req.body;

    let settings = await Settings.findOne();

    if (!settings) {
        settings = new Settings({});
    }

    if (deliveryFee !== undefined) settings.deliveryFee = Number(deliveryFee);
    if (paymentMode !== undefined) settings.paymentMode = paymentMode;
    if (themeMode !== undefined) settings.themeMode = themeMode;

    if (chapaTestSecretKey !== undefined) {
        // Guard: Test key must start with CHASECK_TEST-
        if (chapaTestSecretKey && !chapaTestSecretKey.startsWith('CHASECK_TEST-')) {
            settings.chapaTestSecretKey = process.env.CHAPA_TEST_SECRET_KEY || 'CHASECK_TEST-IXvdkCmyuUbnyrFMtC2K6y8maSbXgrV5';
        } else {
            settings.chapaTestSecretKey = chapaTestSecretKey;
        }
    }
    if (chapaTestPublicKey !== undefined) settings.chapaTestPublicKey = chapaTestPublicKey;

    if (chapaLiveSecretKey !== undefined) {
        // Guard: Live key must not be a test key
        if (chapaLiveSecretKey && chapaLiveSecretKey.includes('_TEST')) {
            settings.chapaLiveSecretKey = process.env.CHAPA_LIVE_SECRET_KEY || 'CHASECK-zUKTw15FI5pNaH1MEntujn63Mmw5IgXR';
        } else {
            settings.chapaLiveSecretKey = chapaLiveSecretKey;
        }
    }
    if (chapaLivePublicKey !== undefined) settings.chapaLivePublicKey = chapaLivePublicKey;
    if (storeName !== undefined) settings.storeName = storeName;
    if (storePhone !== undefined) settings.storePhone = storePhone;
    if (storeEmail !== undefined) settings.storeEmail = storeEmail;
    if (allowMockCheckout !== undefined) settings.allowMockCheckout = Boolean(allowMockCheckout);

    const updatedSettings = await settings.save();
    res.json(updatedSettings);
});

module.exports = {
    getSettings,
    updateSettings,
};
