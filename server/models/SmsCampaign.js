const mongoose = require('mongoose');

const smsCampaignSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        audience: {
            type: String,
            enum: ['all', 'vip', 'repeat', 'inactive', 'debtors', 'single'],
            default: 'all',
        },
        recipientCount: {
            type: Number,
            default: 0,
        },
        deliveredCount: {
            type: Number,
            default: 0,
        },
        failedCount: {
            type: Number,
            default: 0,
        },
        provider: {
            type: String,
            default: 'simulation',
        },
        mode: {
            type: String,
            enum: ['live', 'test_preview'],
            default: 'test_preview',
        },
        sampleRecipients: [
            {
                name: String,
                phone: String,
            },
        ],
        sentBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

const SmsCampaign = mongoose.model('SmsCampaign', smsCampaignSchema);
module.exports = SmsCampaign;
