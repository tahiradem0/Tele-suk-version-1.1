const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const CapitalTransaction = require('../models/CapitalTransaction');
const Debt = require('../models/Debt');

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = asyncHandler(async (req, res) => {
    // 1. Total Users
    const usersCount = await User.countDocuments();

    // 2. Total Products
    const products = await Product.find({});
    const productsCount = products.length;

    // Inventory metrics
    let totalStockUnits = 0;
    let totalInventoryCost = 0;
    let totalInventoryRetail = 0;
    let lowStockCount = 0;

    products.forEach(p => {
        const qty = p.stockQuantity || 0;
        const cost = p.costPrice || 0;
        const price = p.price || 0;
        const minLevel = p.minStockLevel || 5;

        totalStockUnits += qty;
        totalInventoryCost += qty * cost;
        totalInventoryRetail += qty * price;

        if (qty <= minLevel) {
            lowStockCount++;
        }
    });

    // 3. Total Orders & Revenue
    const orders = await Order.find({});
    const ordersCount = orders.length;
    const totalRevenue = orders.reduce((acc, order) => acc + (order.totalPrice || 0), 0);

    // 4. Capital Transactions
    const capitalTransactions = await CapitalTransaction.find({});
    let totalInflow = 0;
    let totalOutflow = 0;
    capitalTransactions.forEach(tx => {
        if (tx.type === 'inflow') totalInflow += tx.amount;
        if (tx.type === 'outflow') totalOutflow += tx.amount;
    });
    const netCapital = totalInflow - totalOutflow;

    // 5. Debt & Credit stats
    const debts = await Debt.find({});
    let totalReceivables = 0; // Customer credit owed to store
    let totalPayables = 0;    // Store owes to suppliers
    debts.forEach(d => {
        if (d.type === 'receivable') {
            totalReceivables += d.balance || 0;
        } else if (d.type === 'payable') {
            totalPayables += d.balance || 0;
        }
    });

    res.json({
        usersCount,
        productsCount,
        ordersCount,
        totalRevenue,
        netCapital,
        totalInflow,
        totalOutflow,
        totalReceivables,
        totalPayables,
        totalStockUnits,
        totalInventoryCost,
        totalInventoryRetail,
        lowStockCount,
    });
});

module.exports = { getStats };
