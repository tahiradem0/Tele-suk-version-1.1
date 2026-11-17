const mongoose = require('mongoose');

const paymentHistorySchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Telebirr', 'CBEBirr', 'Bank Transfer', 'Other'],
        default: 'Cash',
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

const debtSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['receivable', 'payable'], // receivable = customer owes shop; payable = shop owes supplier/creditor
        required: true,
    },
    personName: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    paidAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    balance: {
        type: Number,
        required: true,
        default: 0,
    },
    dueDate: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['pending', 'partially_paid', 'settled'],
        default: 'pending',
    },
    notes: {
        type: String,
        default: '',
    },
    paymentHistory: [paymentHistorySchema],
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});

// Middleware to calculate balance and status before saving
debtSchema.pre('save', function (next) {
    this.balance = Math.max(0, this.totalAmount - (this.paidAmount || 0));
    if (this.balance === 0) {
        this.status = 'settled';
    } else if (this.paidAmount > 0) {
        this.status = 'partially_paid';
    } else {
        this.status = 'pending';
    }
    if (typeof next === 'function') next();
});

const Debt = mongoose.model('Debt', debtSchema);

module.exports = Debt;
