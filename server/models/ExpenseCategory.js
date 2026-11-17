const mongoose = require('mongoose');

const expenseCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    nameAmharic: {
        type: String,
        required: true,
        trim: true,
    },
    icon: {
        type: String,
        default: 'Tag',
    },
    color: {
        type: String,
        default: '#228be6',
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        default: null,
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
    isVisible: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('ExpenseCategory', expenseCategorySchema);
