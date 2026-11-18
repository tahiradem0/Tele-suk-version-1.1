const Affiliate = require('../models/Affiliate');

/**
 * Safely credits an active affiliate/promoter for a completed/paid order.
 * Guarded by `order.affiliateCredited` so an order is never double-credited.
 */
const creditAffiliateForOrder = async (order) => {
    try {
        if (!order || !order.referralCode || order.affiliateCredited) return null;

        const code = String(order.referralCode).trim().toUpperCase();
        if (!code) return null;

        const affiliate = await Affiliate.findOne({ code, active: true });
        if (!affiliate) return null;

        const saleAmount = Number(order.itemsPrice) > 0 ? Number(order.itemsPrice) : Number(order.totalPrice) || 0;
        const rate = Number(affiliate.commissionRate) || 0;
        const commission = Math.round(saleAmount * (rate / 100) * 100) / 100;

        affiliate.totalOrders += 1;
        affiliate.totalSalesAmount += saleAmount;
        affiliate.totalCommissionEarned += commission;
        affiliate.pendingBalance = Math.max(0, Math.round((affiliate.totalCommissionEarned - affiliate.totalPaidOut) * 100) / 100);
        await affiliate.save();

        order.affiliateCommission = commission;
        order.affiliateCredited = true;
        await order.save();

        console.log(`[AFFILIATE] Credited ETB ${commission} to ${affiliate.name} (${code}) for order ${order._id}`);
        return { affiliate, commission };
    } catch (err) {
        console.error('[AFFILIATE] Commission credit error:', err.message);
        return null;
    }
};

module.exports = { creditAffiliateForOrder };
