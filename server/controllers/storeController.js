const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const CapitalTransaction = require('../models/CapitalTransaction');

// @desc    Get store & inventory overview with analytics
// @route   GET /api/store/overview
// @access  Private/Admin
const getStoreOverview = asyncHandler(async (req, res) => {
    const products = await Product.find({}).sort({ name: 1 });

    let totalStockUnits = 0;
    let totalCostValuation = 0;
    let totalRetailValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    const lowStockProducts = [];

    const inventoryList = products.map(product => {
        const qty = product.stockQuantity || 0;
        const cost = product.costPrice || 0;
        const price = product.price || 0;
        const minLevel = product.minStockLevel || 5;

        const costValue = qty * cost;
        const retailValue = qty * price;
        const potentialProfit = retailValue - costValue;
        const marginPercent = price > 0 ? (((price - cost) / price) * 100).toFixed(1) : 0;

        totalStockUnits += qty;
        totalCostValuation += costValue;
        totalRetailValuation += retailValue;

        let status = 'in_stock';
        if (qty <= 0) {
            status = 'out_of_stock';
            outOfStockCount++;
            lowStockProducts.push({
                _id: product._id,
                name: product.name,
                stockQuantity: qty,
                minStockLevel: minLevel,
                image: product.image,
                category: product.category,
                status,
            });
        } else if (qty <= minLevel) {
            status = 'low_stock';
            lowStockCount++;
            lowStockProducts.push({
                _id: product._id,
                name: product.name,
                stockQuantity: qty,
                minStockLevel: minLevel,
                image: product.image,
                category: product.category,
                status,
            });
        }

        return {
            _id: product._id,
            name: product.name,
            brand: product.brand,
            category: product.category,
            price: product.price,
            costPrice: cost,
            stockQuantity: qty,
            minStockLevel: minLevel,
            sku: product.sku || '',
            supplier: product.supplier || '',
            image: product.image,
            costValue,
            retailValue,
            potentialProfit,
            marginPercent,
            status,
        };
    });

    const potentialGrossProfit = totalRetailValuation - totalCostValuation;

    res.json({
        summary: {
            totalProducts: products.length,
            totalStockUnits,
            totalCostValuation,
            totalRetailValuation,
            potentialGrossProfit,
            lowStockCount,
            outOfStockCount,
        },
        lowStockProducts,
        inventory: inventoryList,
    });
});

// @desc    Restock a product (add inventory)
// @route   POST /api/store/restock
// @access  Private/Admin
const restockProduct = asyncHandler(async (req, res) => {
    const {
        productId,
        quantity,
        costPrice,
        supplier = '',
        note = '',
        syncCapital = false,
        paymentMethod = 'Cash',
    } = req.body;

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
        res.status(400);
        throw new Error('Quantity must be greater than zero');
    }

    const product = await Product.findById(productId);
    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    const previousStock = product.stockQuantity || 0;
    const newStock = previousStock + qty;
    product.stockQuantity = newStock;

    if (costPrice !== undefined && !isNaN(Number(costPrice)) && Number(costPrice) >= 0) {
        product.costPrice = Number(costPrice);
    }
    if (supplier) {
        product.supplier = supplier;
    }

    await product.save();

    // Log Stock Movement
    const movement = await StockMovement.create({
        product: product._id,
        productName: product.name,
        type: 'restock',
        quantity: qty,
        previousStock,
        newStock,
        costPrice: product.costPrice,
        supplier: supplier || product.supplier,
        note: note || `Restocked +${qty} units`,
        recordedBy: req.user?._id,
    });

    // Optionally deduct total cost from Capital Outflow
    if (syncCapital && product.costPrice > 0) {
        const totalCost = qty * product.costPrice;
        await CapitalTransaction.create({
            type: 'outflow',
            category: 'stock_purchase',
            amount: totalCost,
            description: `Stock Purchase: ${qty}x ${product.name} @ ${product.costPrice} ETB`,
            paymentMethod,
            recordedBy: req.user?._id,
        });
    }

    res.status(200).json({
        message: 'Product restocked successfully',
        product,
        movement,
    });
});

// @desc    Adjust product stock (damage, count error, audit)
// @route   POST /api/store/adjust
// @access  Private/Admin
const adjustStock = asyncHandler(async (req, res) => {
    const {
        productId,
        newStockQuantity,
        type = 'adjustment',
        note = '',
    } = req.body;

    const targetStock = Number(newStockQuantity);
    if (isNaN(targetStock) || targetStock < 0) {
        res.status(400);
        throw new Error('Stock quantity must be a non-negative number');
    }

    const product = await Product.findById(productId);
    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    const previousStock = product.stockQuantity || 0;
    const delta = targetStock - previousStock;
    product.stockQuantity = targetStock;

    await product.save();

    const movement = await StockMovement.create({
        product: product._id,
        productName: product.name,
        type: type, // 'adjustment', 'damage_loss', 'return'
        quantity: delta,
        previousStock,
        newStock: targetStock,
        costPrice: product.costPrice,
        note: note || `Stock adjusted from ${previousStock} to ${targetStock}`,
        recordedBy: req.user?._id,
    });

    res.json({
        message: 'Stock adjusted successfully',
        product,
        movement,
    });
});

// @desc    Get stock movements history
// @route   GET /api/store/movements
// @access  Private/Admin
const getStockMovements = asyncHandler(async (req, res) => {
    const { productId, type, limit = 50 } = req.query;

    const query = {};
    if (productId) query.product = productId;
    if (type && type !== 'all') query.type = type;

    const movements = await StockMovement.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .populate('recordedBy', 'name phone');

    res.json(movements);
});

module.exports = {
    getStoreOverview,
    restockProduct,
    adjustStock,
    getStockMovements,
};
