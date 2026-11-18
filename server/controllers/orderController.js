const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const CapitalTransaction = require('../models/CapitalTransaction');
const { deductOrderStock, restoreOrderStock } = require('../utils/stockHelper');
const { creditAffiliateForOrder } = require('../utils/affiliateHelper');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        shippingPrice,
        totalPrice,
        referralCode,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
    }

    // Validate available stock before creating order
    for (const item of orderItems) {
        if (item.product) {
            const prod = await Product.findById(item.product);
            if (!prod) {
                res.status(404);
                throw new Error(`Product not found: ${item.name}`);
            }
            const availableStock = Number(prod.stockQuantity !== undefined ? prod.stockQuantity : 0);
            if (availableStock <= 0) {
                res.status(400);
                throw new Error(`Sorry, "${prod.name}" is currently out of stock.`);
            }
            if (availableStock < (item.qty || 1)) {
                res.status(400);
                throw new Error(`Only ${availableStock} in stock for "${prod.name}" (requested ${item.qty || 1}).`);
            }
        }
    }

    const order = new Order({
        orderItems,
        user: req.user._id,
        shippingAddress,
        paymentMethod: paymentMethod || 'Chapa',
        itemsPrice,
        shippingPrice,
        totalPrice,
        status: 'Pending',
        stockDeducted: false,
        referralCode: referralCode ? String(referralCode).trim().toUpperCase() : '',
    });

    const createdOrder = await order.save();

    // If order paymentMethod is Cash / COD (non-Chapa), deduct stock immediately upon order placement
    if (paymentMethod === 'Cash' || paymentMethod === 'COD') {
        await deductOrderStock(createdOrder, req.user._id, 'Cash Order');
        await creditAffiliateForOrder(createdOrder);
    }

    res.status(201).json(createdOrder);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate(
        'user',
        'name phone'
    );

    if (order) {
        if (req.user.isAdmin || order.user._id.equals(req.user._id)) {
            res.json(order);
        } else {
            res.status(401);
            throw new Error('Not authorized to view this order');
        }
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({}).populate('user', 'id name');
    res.json(orders);
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
        const previousStatus = order.status;
        order.status = status;

        if (status === 'Delivered') {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
        }

        // When order is marked Delivered, reflect sale in Capital and deduct inventory stock
        if (status === 'Delivered' && previousStatus !== 'Delivered') {
            // Check if already logged to capital
            const existingCapital = await CapitalTransaction.findOne({ relatedOrder: order._id });
            if (!existingCapital) {
                await CapitalTransaction.create({
                    type: 'inflow',
                    category: 'sale',
                    amount: order.totalPrice,
                    description: `Order #${order._id.toString().slice(-6).toUpperCase()} Completed/Delivered`,
                    paymentMethod: order.paymentMethod || 'Cash',
                    relatedOrder: order._id,
                    recordedBy: req.user?._id,
                });
            }

            // Deduct stock for items (if not already deducted during Chapa verification or order creation)
            if (!order.stockDeducted) {
                await deductOrderStock(order, req.user?._id, 'Delivered Order');
            }
        }

        // If order was cancelled and stock was already deducted, restore stock
        if (status === 'Cancelled' && previousStatus !== 'Cancelled' && order.stockDeducted) {
            await restoreOrderStock(order, req.user?._id, 'Order Cancelled');
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Assign driver
// @route   PUT /api/orders/:id/driver
// @access  Private/Admin
const updateOrderDriver = asyncHandler(async (req, res) => {
    const { driver } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
        order.driver = driver;
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

module.exports = {
    addOrderItems,
    getOrderById,
    getMyOrders,
    getOrders,
    updateOrderStatus,
    updateOrderDriver,
};
