const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    deliveryFee: {
        type: Number,
        required: true,
        default: 5.00
    },
    // Payment Gateway Mode: 'test' (sandbox) or 'live' (production)
    paymentMode: {
        type: String,
        enum: ['test', 'live'],
        default: 'test'
    },
    chapaTestSecretKey: {
        type: String,
        default: ''
    },
    chapaTestPublicKey: {
        type: String,
        default: ''
    },
    chapaLiveSecretKey: {
        type: String,
        default: ''
    },
    chapaLivePublicKey: {
        type: String,
        default: ''
    },
    // Admin Theme: 'light' or 'dark'
    themeMode: {
        type: String,
        enum: ['light', 'dark'],
        default: 'light'
    },
    // Store Information
    storeName: {
        type: String,
        default: 'Gondar ሱቅ'
    },
    storePhone: {
        type: String,
        default: '0978787960'
    },
    storeEmail: {
        type: String,
        default: 'admin@gondarsuk.com'
    },
    allowMockCheckout: {
        type: Boolean,
        default: true
    },
    // AI Assistant Keys (Optional - Free Gemini API & Addis AI Amharic Voice)
    geminiApiKey: {
        type: String,
        default: ''
    },
    addisAiApiKey: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

const Settings = mongoose.model('Settings', settingsSchema);
module.exports = Settings;
