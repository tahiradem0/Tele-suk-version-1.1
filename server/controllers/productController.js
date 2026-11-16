const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
    const { category, search } = req.query;
    let query = {};

    if (category && category !== 'All' && category !== 'all') {
        query.category = { $regex: category, $options: 'i' };
    }

    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }

    // Sort in-stock products first (stockQuantity > 0 descending), then newest first
    const products = await Product.find(query).sort({ stockQuantity: -1, createdAt: -1 });
    res.json(products);
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        res.json(product);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
    const {
        name,
        brand,
        category,
        price,
        originalPrice,
        costPrice = 0,
        stockQuantity = 0,
        minStockLevel = 5,
        sku = '',
        supplier = '',
        description,
    } = req.body;
    const image = req.file ? req.file.path : null;

    if (!image) {
        res.status(400);
        throw new Error('Image is required');
    }

    const initialStock = Number(stockQuantity) || 0;
    const product = await Product.create({
        name,
        brand,
        category,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        costPrice: Number(costPrice) || 0,
        stockQuantity: initialStock,
        minStockLevel: Number(minStockLevel) || 5,
        sku,
        supplier,
        description,
        image,
    });

    if (initialStock > 0) {
        await StockMovement.create({
            product: product._id,
            productName: product.name,
            type: 'restock',
            quantity: initialStock,
            previousStock: 0,
            newStock: initialStock,
            costPrice: product.costPrice,
            supplier: product.supplier,
            note: 'Initial stock on product creation',
            recordedBy: req.user?._id,
        });
    }

    res.status(201).json(product);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
    const {
        name,
        brand,
        category,
        price,
        originalPrice,
        costPrice,
        stockQuantity,
        minStockLevel,
        sku,
        supplier,
        description,
    } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
        product.name = name || product.name;
        product.brand = brand || product.brand;
        product.category = category || product.category;
        product.price = price !== undefined ? Number(price) : product.price;
        product.originalPrice = originalPrice !== undefined ? Number(originalPrice) : product.originalPrice;
        if (costPrice !== undefined) product.costPrice = Number(costPrice);
        if (minStockLevel !== undefined) product.minStockLevel = Number(minStockLevel);
        if (sku !== undefined) product.sku = sku;
        if (supplier !== undefined) product.supplier = supplier;
        product.description = description || product.description;

        // Check if stockQuantity was directly updated
        if (stockQuantity !== undefined && Number(stockQuantity) !== product.stockQuantity) {
            const previousStock = product.stockQuantity;
            const newStock = Number(stockQuantity);
            product.stockQuantity = newStock;

            await StockMovement.create({
                product: product._id,
                productName: product.name,
                type: 'adjustment',
                quantity: newStock - previousStock,
                previousStock,
                newStock,
                costPrice: product.costPrice,
                note: 'Direct stock edit from product form',
                recordedBy: req.user?._id,
            });
        }

        if (req.file) {
            product.image = req.file.path;
        }

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        await product.deleteOne();
        res.json({ message: 'Product removed' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};
