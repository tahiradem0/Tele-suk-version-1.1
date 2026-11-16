const mongoose = require('mongoose');

const capitalTransactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['inflow', 'outflow'],
        required: true,
    },
    category: {
        type: String,
        enum: [
            'sale',
            'owner_investment',
            'debt_collection',
            'other_income',
            'stock_purchase',
            'expense',
            'owner_withdrawal',
            'debt_payment',
            'salary',
            'rent_utilities'
        ],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    description: {
        type: String,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Telebirr', 'CBEBirr', 'Bank Transfer', 'Chapa', 'Other'],
        default: 'Cash',
    },
    relatedOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
    },
    relatedDebt: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Debt',
    },
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    date: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

const CapitalTransaction = mongoose.model('CapitalTransaction', capitalTransactionSchema);

module.exports = CapitalTransaction;
