const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = asyncHandler(async (req, res) => {
    // 1. Total Users
    const usersCount = await User.countDocuments();

    // 2. Total Products
    const productsCount = await Product.countDocuments();

    // 3. Total Orders
    const ordersCount = await Order.countDocuments();

    // 4. Total Revenue (Sum of totalPrice of paid orders)
    // Assuming we only count 'paid' orders or all orders depending on preference.
    // Let's count all non-cancelled? Or just simplify to all for MVP.
    // Better to aggregate checks.

    // Aggregation for Total Revenue
    const orders = await Order.find({}); // Optimization: use aggregation for large dbs
    const totalRevenue = orders.reduce((acc, order) => acc + (order.totalPrice || 0), 0);

    // 5. Recent Orders (Top 5) - Optional, handled in separate api or here
    // let's just return counts for cards first

    res.json({
        usersCount,
        productsCount,
        ordersCount,
        totalRevenue
    });
});

module.exports = { getStats };
