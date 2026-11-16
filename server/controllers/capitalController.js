const asyncHandler = require('express-async-handler');
const CapitalTransaction = require('../models/CapitalTransaction');
const Order = require('../models/Order');

// @desc    Get capital summary & overview
// @route   GET /api/capital/overview
// @access  Private/Admin
const getCapitalOverview = asyncHandler(async (req, res) => {
    const transactions = await CapitalTransaction.find({}).sort({ date: -1 });

    let totalInflow = 0;
    let totalOutflow = 0;
    const categoryTotals = {};

    transactions.forEach(tx => {
        if (tx.type === 'inflow') {
            totalInflow += tx.amount;
        } else if (tx.type === 'outflow') {
            totalOutflow += tx.amount;
        }

        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
    });

    const netCapital = totalInflow - totalOutflow;

    // Check paid orders revenue that may not have direct transactions
    const paidOrders = await Order.find({ isPaid: true });
    const paidOrdersRevenue = paidOrders.reduce((sum, ord) => sum + (ord.totalPrice || 0), 0);

    // Recent 10 transactions
    const recentTransactions = transactions.slice(0, 10);

    res.json({
        netCapital,
        totalInflow,
        totalOutflow,
        paidOrdersRevenue,
        categoryTotals,
        recentTransactions,
        totalTransactionsCount: transactions.length,
    });
});

// @desc    Get all capital transactions with filter/pagination
// @route   GET /api/capital/transactions
// @access  Private/Admin
const getTransactions = asyncHandler(async (req, res) => {
    const { type, category, search, limit = 50, page = 1 } = req.query;

    const query = {};
    if (type && type !== 'all') {
        query.type = type;
    }
    if (category && category !== 'all') {
        query.category = category;
    }
    if (search) {
        query.description = { $regex: search, $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await CapitalTransaction.countDocuments(query);
    const transactions = await CapitalTransaction.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('recordedBy', 'name phone');

    res.json({
        transactions,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
    });
});

// @desc    Add manual capital transaction
// @route   POST /api/capital/transactions
// @access  Private/Admin
const createTransaction = asyncHandler(async (req, res) => {
    const {
        type,
        category,
        amount,
        description,
        paymentMethod = 'Cash',
        date = Date.now(),
    } = req.body;

    if (!type || !category || !amount || !description) {
        res.status(400);
        throw new Error('Please provide type, category, amount, and description');
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
        res.status(400);
        throw new Error('Amount must be a positive number');
    }

    const transaction = await CapitalTransaction.create({
        type,
        category,
        amount: numericAmount,
        description,
        paymentMethod,
        recordedBy: req.user?._id,
        date: new Date(date),
    });

    res.status(201).json(transaction);
});

// @desc    Delete a capital transaction
// @route   DELETE /api/capital/transactions/:id
// @access  Private/Admin
const deleteTransaction = asyncHandler(async (req, res) => {
    const transaction = await CapitalTransaction.findById(req.params.id);

    if (!transaction) {
        res.status(404);
        throw new Error('Transaction not found');
    }

    await transaction.deleteOne();
    res.json({ message: 'Transaction removed successfully' });
});

module.exports = {
    getCapitalOverview,
    getTransactions,
    createTransaction,
    deleteTransaction,
};
