const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    brand: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    originalPrice: {
        type: Number,
    },
    costPrice: {
        type: Number,
        default: 0,
    },
    stockQuantity: {
        type: Number,
        default: 0,
    },
    minStockLevel: {
        type: Number,
        default: 5,
    },
    sku: {
        type: String,
        default: '',
    },
    supplier: {
        type: String,
        default: '',
    },
    image: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        default: 0,
    },
    numReviews: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
