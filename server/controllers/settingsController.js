const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const Settings = require('../models/Settings');
const User = require('../models/User');

// Helper: check if the request carries a valid Admin JWT (without blocking public requests)
const isAdminRequest = async (req) => {
    try {
        const auth = req.headers.authorization;
        if (!auth || !auth.startsWith('Bearer ')) return false;
        const token = auth.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('isAdmin');
        return Boolean(user && user.isAdmin);
    } catch {
        return false;
    }
};

// @desc    Get global settings (secret keys only returned to authenticated admins)
// @route   GET /api/settings
// @access  Public / Admin-enriched
const getSettings = asyncHandler(async (req, res) => {
    let settings = await Settings.findOne();

    if (!settings) {
        settings = await Settings.create({
            deliveryFee: 5.00,
            paymentMode: 'test',
            themeMode: 'light',
            chapaTestSecretKey: process.env.CHAPA_TEST_SECRET_KEY || '',
            chapaTestPublicKey: process.env.CHAPA_TEST_PUBLIC_KEY || process.env.CHAPA_PUBLIC_KEY || '',
            chapaLiveSecretKey: process.env.CHAPA_LIVE_SECRET_KEY || '',
            chapaLivePublicKey: process.env.CHAPA_LIVE_PUBLIC_KEY || process.env.CHAPA_PUBLIC_KEY || '',
            storeName: 'Gondar ሱቅ',
            storePhone: '0978787960',
            storeEmail: 'admin@gondarsuk.com',
            allowMockCheckout: false
        });
    }

    const result = settings.toObject ? settings.toObject() : { ...settings };
    const adminCaller = await isAdminRequest(req);

    if (adminCaller) {
        // Hydrate from environment variables if database fields are blank
        if (!result.chapaTestSecretKey || !result.chapaTestSecretKey.startsWith('CHASECK_TEST-')) {
            result.chapaTestSecretKey = process.env.CHAPA_TEST_SECRET_KEY || '';
        }
        result.chapaTestPublicKey = result.chapaTestPublicKey || process.env.CHAPA_TEST_PUBLIC_KEY || process.env.CHAPA_PUBLIC_KEY || '';

        if (!result.chapaLiveSecretKey || result.chapaLiveSecretKey.includes('_TEST')) {
            result.chapaLiveSecretKey = process.env.CHAPA_LIVE_SECRET_KEY || '';
        }
        result.chapaLivePublicKey = result.chapaLivePublicKey || process.env.CHAPA_LIVE_PUBLIC_KEY || process.env.CHAPA_PUBLIC_KEY || '';
        result.geminiApiKey = result.geminiApiKey || process.env.GEMINI_API_KEY || '';
        result.addisAiApiKey = result.addisAiApiKey || process.env.ADDIS_AI_API_KEY || '';
        result.smsProvider = result.smsProvider || process.env.SMS_PROVIDER || 'simulation';
        result.smsApiKey = result.smsApiKey || process.env.SMS_API_KEY || '';
        result.smsSenderId = result.smsSenderId || process.env.SMS_SENDER_ID || '';
    } else {
        // Never expose secret keys to unauthenticated storefront clients
        delete result.chapaTestSecretKey;
        delete result.chapaLiveSecretKey;
        delete result.geminiApiKey;
        delete result.addisAiApiKey;
        delete result.smsApiKey;
    }

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
        allowMockCheckout,
        geminiApiKey,
        addisAiApiKey,
        smsProvider,
        smsApiKey,
        smsSenderId
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
    if (geminiApiKey !== undefined) settings.geminiApiKey = geminiApiKey.trim();
    if (addisAiApiKey !== undefined) settings.addisAiApiKey = addisAiApiKey.trim();
    if (smsProvider !== undefined) settings.smsProvider = smsProvider;
    if (smsApiKey !== undefined) settings.smsApiKey = smsApiKey.trim();
    if (smsSenderId !== undefined) settings.smsSenderId = smsSenderId.trim();

    const updatedSettings = await settings.save();
    res.json(updatedSettings);
});

module.exports = {
    getSettings,
    updateSettings,
};
