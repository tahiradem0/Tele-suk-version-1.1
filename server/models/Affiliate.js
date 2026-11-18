const mongoose = require('mongoose');

const payoutRecordSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Telebirr', 'CBEBirr', 'Bank Transfer', 'Other'],
        default: 'Telebirr',
    },
    note: {
        type: String,
        default: '',
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

const affiliateSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        // Simple commission rate: e.g. 5 means ETB 5 earned per ETB 100 sold
        commissionRate: {
            type: Number,
            default: 5,
            min: 0,
            max: 50,
        },
        clicks: {
            type: Number,
            default: 0,
        },
        totalOrders: {
            type: Number,
            default: 0,
        },
        totalSalesAmount: {
            type: Number,
            default: 0,
        },
        totalCommissionEarned: {
            type: Number,
            default: 0,
        },
        totalPaidOut: {
            type: Number,
            default: 0,
        },
        pendingBalance: {
            type: Number,
            default: 0,
        },
        active: {
            type: Boolean,
            default: true,
        },
        notes: {
            type: String,
            default: '',
        },
        payoutHistory: [payoutRecordSchema],
    },
    { timestamps: true }
);

const Affiliate = mongoose.model('Affiliate', affiliateSchema);
module.exports = Affiliate;
