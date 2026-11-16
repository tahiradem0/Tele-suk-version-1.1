const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');

/**
 * Deduct inventory stock for all items in an order.
 * Ensures idempotency via order.stockDeducted flag.
 */
async function deductOrderStock(order, recordedByUserId = null, reasonPrefix = 'Sale') {
    if (!order || order.stockDeducted) {
        return;
    }

    if (!Array.isArray(order.orderItems) || order.orderItems.length === 0) {
        return;
    }

    for (const item of order.orderItems) {
        if (!item.product) continue;

        try {
            const product = await Product.findById(item.product);
            if (!product) continue;

            const prevStock = Number(product.stockQuantity || 0);
            const qtyBought = Number(item.qty || 1);
            const newStock = Math.max(0, prevStock - qtyBought);

            product.stockQuantity = newStock;
            await product.save();

            console.log(`[INVENTORY] Stock deducted for "${product.name}": ${prevStock} -> ${newStock} (Quantity sold: ${qtyBought})`);

            await StockMovement.create({
                product: product._id,
                productName: product.name,
                type: 'sale',
                quantity: qtyBought,
                previousStock: prevStock,
                newStock: newStock,
                costPrice: product.costPrice || 0,
                note: `${reasonPrefix} #${order._id.toString().slice(-6).toUpperCase()}`,
                recordedBy: recordedByUserId || (order.user?._id || order.user),
            });
        } catch (err) {
            console.error(`[INVENTORY ERROR] Failed to deduct stock for item ${item.name}:`, err);
        }
    }

    order.stockDeducted = true;
    await order.save();
}

/**
 * Restore stock if an order is cancelled or refunded
 */
async function restoreOrderStock(order, recordedByUserId = null, reason = 'Order Cancelled') {
    if (!order || !order.stockDeducted) {
        return;
    }

    if (!Array.isArray(order.orderItems)) return;

    for (const item of order.orderItems) {
        if (!item.product) continue;

        try {
            const product = await Product.findById(item.product);
            if (!product) continue;

            const prevStock = Number(product.stockQuantity || 0);
            const qtyReturned = Number(item.qty || 1);
            const newStock = prevStock + qtyReturned;

            product.stockQuantity = newStock;
            await product.save();

            console.log(`[INVENTORY] Stock restored for "${product.name}": ${prevStock} -> ${newStock} (Quantity restored: ${qtyReturned})`);

            await StockMovement.create({
                product: product._id,
                productName: product.name,
                type: 'return',
                quantity: qtyReturned,
                previousStock: prevStock,
                newStock: newStock,
                costPrice: product.costPrice || 0,
                note: `${reason} #${order._id.toString().slice(-6).toUpperCase()}`,
                recordedBy: recordedByUserId || (order.user?._id || order.user),
            });
        } catch (err) {
            console.error(`[INVENTORY ERROR] Failed to restore stock for item ${item.name}:`, err);
        }
    }

    order.stockDeducted = false;
    await order.save();
}

module.exports = {
    deductOrderStock,
    restoreOrderStock,
};
