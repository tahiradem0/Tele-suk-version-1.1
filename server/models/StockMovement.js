const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    productName: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['restock', 'sale', 'adjustment', 'damage_loss', 'return'],
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    previousStock: {
        type: Number,
        required: true,
    },
    newStock: {
        type: Number,
        required: true,
    },
    costPrice: {
        type: Number,
        default: 0,
    },
    supplier: {
        type: String,
        default: '',
    },
    note: {
        type: String,
        default: '',
    },
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});

const StockMovement = mongoose.model('StockMovement', stockMovementSchema);

module.exports = StockMovement;
