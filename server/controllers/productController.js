const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');

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

    const products = await Product.find(query);
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
    const { name, brand, category, price, originalPrice, description } = req.body;
    const image = req.file ? req.file.path : null;

    if (!image) {
        res.status(400);
        throw new Error('Image is required');
    }

    const product = await Product.create({
        name,
        brand,
        category,
        price,
        originalPrice,
        description,
        image,
    });

    res.status(201).json(product);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
    const { name, brand, category, price, originalPrice, description } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
        product.name = name || product.name;
        product.brand = brand || product.brand;
        product.category = category || product.category;
        product.price = price || product.price;
        product.originalPrice = originalPrice || product.originalPrice;
        product.description = description || product.description;

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
