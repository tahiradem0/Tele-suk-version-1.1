const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    subtitle: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    buttonText: {
        type: String,
        default: 'Shop Now'
    },
    buttonLink: {
        type: String,
        default: '/products'
    },
    active: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;
