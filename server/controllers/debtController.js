const asyncHandler = require('express-async-handler');
const Debt = require('../models/Debt');
const CapitalTransaction = require('../models/CapitalTransaction');

// @desc    Get all debts with summary
// @route   GET /api/debts
// @access  Private/Admin
const getDebts = asyncHandler(async (req, res) => {
    const { type, status, search } = req.query;

    const query = {};
    if (type && type !== 'all') {
        query.type = type;
    }
    if (status && status !== 'all') {
        query.status = status;
    }
    if (search) {
        query.$or = [
            { personName: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { title: { $regex: search, $options: 'i' } },
        ];
    }

    const debts = await Debt.find(query).sort({ createdAt: -1 });

    // Calculate aggregated metrics
    const allDebts = await Debt.find({});
    let totalReceivable = 0;
    let totalReceivablePaid = 0;
    let totalReceivableRemaining = 0;

    let totalPayable = 0;
    let totalPayablePaid = 0;
    let totalPayableRemaining = 0;

    const now = new Date();
    let overdueCount = 0;

    allDebts.forEach(d => {
        if (d.type === 'receivable') {
            totalReceivable += d.totalAmount || 0;
            totalReceivablePaid += d.paidAmount || 0;
            totalReceivableRemaining += d.balance || 0;
        } else if (d.type === 'payable') {
            totalPayable += d.totalAmount || 0;
            totalPayablePaid += d.paidAmount || 0;
            totalPayableRemaining += d.balance || 0;
        }

        if (d.dueDate && new Date(d.dueDate) < now && d.status !== 'settled') {
            overdueCount++;
        }
    });

    const netCreditPosition = totalReceivableRemaining - totalPayableRemaining;

    res.json({
        debts,
        summary: {
            totalReceivable,
            totalReceivablePaid,
            totalReceivableRemaining,
            totalPayable,
            totalPayablePaid,
            totalPayableRemaining,
            netCreditPosition,
            overdueCount,
            totalCount: allDebts.length,
        },
    });
});

// @desc    Create new credit/debt
// @route   POST /api/debts
// @access  Private/Admin
const createDebt = asyncHandler(async (req, res) => {
    const {
        type,
        personName,
        phone,
        title,
        totalAmount,
        dueDate,
        notes,
    } = req.body;

    if (!type || !personName || !phone || !title || !totalAmount) {
        res.status(400);
        throw new Error('Please fill in all required fields (type, person name, phone, title, total amount)');
    }

    const numericAmount = Number(totalAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
        res.status(400);
        throw new Error('Total amount must be a positive number');
    }

    const debt = new Debt({
        type,
        personName,
        phone,
        title,
        totalAmount: numericAmount,
        paidAmount: 0,
        balance: numericAmount,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || '',
        recordedBy: req.user?._id,
        status: 'pending',
    });

    const createdDebt = await debt.save();
    res.status(201).json(createdDebt);
});

// @desc    Record repayment / payment towards debt
// @route   POST /api/debts/:id/pay
// @access  Private/Admin
const recordPayment = asyncHandler(async (req, res) => {
    const { amount, paymentMethod = 'Cash', note = '', syncCapital = true } = req.body;

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
        res.status(400);
        throw new Error('Payment amount must be greater than zero');
    }

    const debt = await Debt.findById(req.params.id);
    if (!debt) {
        res.status(404);
        throw new Error('Debt record not found');
    }

    if (debt.status === 'settled') {
        res.status(400);
        throw new Error('This debt has already been completely settled');
    }

    const newPaidAmount = (debt.paidAmount || 0) + numericAmount;
    debt.paidAmount = newPaidAmount;
    debt.balance = Math.max(0, debt.totalAmount - newPaidAmount);

    debt.paymentHistory.push({
        amount: numericAmount,
        paymentMethod,
        note,
        date: new Date(),
    });

    const updatedDebt = await debt.save();

    // Sync into Capital automatically if requested
    if (syncCapital) {
        if (debt.type === 'receivable') {
            // Customer is paying money back to our store -> Cash Inflow!
            await CapitalTransaction.create({
                type: 'inflow',
                category: 'debt_collection',
                amount: numericAmount,
                description: `Debt collection from customer: ${debt.personName} (${debt.title})`,
                paymentMethod,
                relatedDebt: debt._id,
                recordedBy: req.user?._id,
            });
        } else if (debt.type === 'payable') {
            // Store is paying money to supplier/creditor -> Cash Outflow!
            await CapitalTransaction.create({
                type: 'outflow',
                category: 'debt_payment',
                amount: numericAmount,
                description: `Paid debt/supplier: ${debt.personName} (${debt.title})`,
                paymentMethod,
                relatedDebt: debt._id,
                recordedBy: req.user?._id,
            });
        }
    }

    res.json(updatedDebt);
});

// @desc    Update debt details
// @route   PUT /api/debts/:id
// @access  Private/Admin
const updateDebt = asyncHandler(async (req, res) => {
    const { personName, phone, title, dueDate, notes, totalAmount } = req.body;

    const debt = await Debt.findById(req.params.id);
    if (!debt) {
        res.status(404);
        throw new Error('Debt record not found');
    }

    if (personName) debt.personName = personName;
    if (phone) debt.phone = phone;
    if (title) debt.title = title;
    if (dueDate !== undefined) debt.dueDate = dueDate ? new Date(dueDate) : null;
    if (notes !== undefined) debt.notes = notes;
    if (totalAmount !== undefined) {
        const num = Number(totalAmount);
        if (!isNaN(num) && num >= (debt.paidAmount || 0)) {
            debt.totalAmount = num;
            debt.balance = num - (debt.paidAmount || 0);
        }
    }

    const updated = await debt.save();
    res.json(updated);
});

// @desc    Delete debt
// @route   DELETE /api/debts/:id
// @access  Private/Admin
const deleteDebt = asyncHandler(async (req, res) => {
    const debt = await Debt.findById(req.params.id);
    if (!debt) {
        res.status(404);
        throw new Error('Debt record not found');
    }

    await debt.deleteOne();
    res.json({ message: 'Debt record removed successfully' });
});

module.exports = {
    getDebts,
    createDebt,
    recordPayment,
    updateDebt,
    deleteDebt,
};
