const asyncHandler = require('express-async-handler');
const Affiliate = require('../models/Affiliate');
const CapitalTransaction = require('../models/CapitalTransaction');

// Helper: Generate clean short referral code like ABEBE42
const generateReferralCode = (name = '') => {
    const clean = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6) || 'PROMO';
    const rand = Math.floor(10 + Math.random() * 90);
    return `${clean}${rand}`;
};

// @desc    Track a referral link click (Public)
// @route   POST /api/affiliates/track-click
// @access  Public
const trackClick = asyncHandler(async (req, res) => {
    const rawCode = String(req.body.code || '').trim().toUpperCase();
    if (!rawCode) {
        return res.json({ valid: false });
    }

    const affiliate = await Affiliate.findOneAndUpdate(
        { code: rawCode, active: true },
        { $inc: { clicks: 1 } },
        { new: true }
    ).select('name code');

    if (!affiliate) {
        return res.json({ valid: false });
    }

    res.json({ valid: true, code: affiliate.code, name: affiliate.name });
});

// @desc    Get all affiliates & simple totals
// @route   GET /api/affiliates
// @access  Private/Admin
const getAffiliates = asyncHandler(async (req, res) => {
    const affiliates = await Affiliate.find({}).sort({ totalSalesAmount: -1, createdAt: -1 });

    const summary = {
        totalPromoters: affiliates.length,
        activePromoters: affiliates.filter((a) => a.active).length,
        totalSalesBrought: affiliates.reduce((s, a) => s + (a.totalSalesAmount || 0), 0),
        totalPendingPayout: affiliates.reduce((s, a) => s + (a.pendingBalance || 0), 0),
        totalPaidOut: affiliates.reduce((s, a) => s + (a.totalPaidOut || 0), 0),
    };

    res.json({ summary, affiliates });
});

// @desc    Create a new affiliate/promoter
// @route   POST /api/affiliates
// @access  Private/Admin
const createAffiliate = asyncHandler(async (req, res) => {
    const { name, phone, code, commissionRate = 5, notes = '' } = req.body;

    if (!name || !phone) {
        res.status(400);
        throw new Error('Please enter both promoter name and phone number.');
    }

    let finalCode = (code ? String(code) : generateReferralCode(name))
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .toUpperCase();

    if (!finalCode) finalCode = generateReferralCode('SHOP');

    const exists = await Affiliate.findOne({ code: finalCode });
    if (exists) {
        finalCode = `${finalCode}${Math.floor(10 + Math.random() * 89)}`;
    }

    const affiliate = await Affiliate.create({
        name: name.trim(),
        phone: phone.trim(),
        code: finalCode,
        commissionRate: Math.max(0, Math.min(50, Number(commissionRate) || 5)),
        notes: notes.trim(),
        active: true,
    });

    res.status(201).json(affiliate);
});

// @desc    Update affiliate (pause/resume, rate, name, phone)
// @route   PUT /api/affiliates/:id
// @access  Private/Admin
const updateAffiliate = asyncHandler(async (req, res) => {
    const affiliate = await Affiliate.findById(req.params.id);
    if (!affiliate) {
        res.status(404);
        throw new Error('Promoter not found');
    }

    const { name, phone, commissionRate, active, notes } = req.body;
    if (name !== undefined) affiliate.name = name.trim();
    if (phone !== undefined) affiliate.phone = phone.trim();
    if (commissionRate !== undefined) affiliate.commissionRate = Math.max(0, Math.min(50, Number(commissionRate) || 0));
    if (active !== undefined) affiliate.active = Boolean(active);
    if (notes !== undefined) affiliate.notes = notes.trim();

    const updated = await affiliate.save();
    res.json(updated);
});

// @desc    Pay out earned commission to a promoter (auto-syncs Capital Treasury)
// @route   POST /api/affiliates/:id/payout
// @access  Private/Admin
const recordPayout = asyncHandler(async (req, res) => {
    const affiliate = await Affiliate.findById(req.params.id);
    if (!affiliate) {
        res.status(404);
        throw new Error('Promoter not found');
    }

    const { amount, paymentMethod = 'Telebirr', note = '', syncCapital = true } = req.body;
    const payAmount = Number(amount);

    if (!payAmount || payAmount <= 0) {
        res.status(400);
        throw new Error('Payout amount must be greater than zero');
    }

    affiliate.totalPaidOut = Math.round(((affiliate.totalPaidOut || 0) + payAmount) * 100) / 100;
    affiliate.pendingBalance = Math.max(
        0,
        Math.round(((affiliate.totalCommissionEarned || 0) - affiliate.totalPaidOut) * 100) / 100
    );
    affiliate.payoutHistory.push({
        amount: payAmount,
        paymentMethod,
        note: note || `Commission payout to ${affiliate.name}`,
        date: new Date(),
    });

    await affiliate.save();

    // Automatically record payout in Capital Treasury so shop cash stays accurate
    if (syncCapital) {
        await CapitalTransaction.create({
            type: 'outflow',
            category: 'expense',
            amount: payAmount,
            description: `Affiliate Commission Payout — ${affiliate.name} (${affiliate.code})`,
            paymentMethod,
            recordedBy: req.user?._id,
        });
    }

    res.json({
        message: `Paid ETB ${payAmount.toLocaleString()} to ${affiliate.name}!`,
        affiliate,
    });
});

// @desc    Delete an affiliate/promoter
// @route   DELETE /api/affiliates/:id
// @access  Private/Admin
const deleteAffiliate = asyncHandler(async (req, res) => {
    const affiliate = await Affiliate.findById(req.params.id);
    if (!affiliate) {
        res.status(404);
        throw new Error('Promoter not found');
    }
    await affiliate.deleteOne();
    res.json({ message: 'Promoter removed' });
});

module.exports = {
    trackClick,
    getAffiliates,
    createAffiliate,
    updateAffiliate,
    recordPayout,
    deleteAffiliate,
};
