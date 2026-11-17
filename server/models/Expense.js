const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    reason: {
        type: String,
        required: true,
        trim: true,
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExpenseCategory',
    },
    categoryName: {
        type: String,
        default: 'General Overhead',
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        default: null, // null = personal context
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    userName: {
        type: String,
        default: 'Store Partner',
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    dateEthiopian: {
        type: String,
    },
    receiptUrl: {
        type: String,
        default: null,
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Telebirr', 'CBEBirr', 'Bank Transfer', 'Other'],
        default: 'Cash',
    },
    syncCapital: {
        type: Boolean,
        default: true,
    },
    capitalTxId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CapitalTransaction',
    },
    notes: {
        type: String,
        default: '',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Expense', expenseSchema);
