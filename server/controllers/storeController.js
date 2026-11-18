const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Order = require('../models/Order');
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

// Round restock suggestion to a clean, practical shopkeeper number (e.g., 5, 10, 15, 20, 25, 30...)
const roundFriendlyQty = (qty) => {
    if (qty <= 5) return 5;
    if (qty <= 10) return 10;
    return Math.ceil(qty / 5) * 5;
};

// @desc    Simple Smart Stock Advisor (Forecast, Best Sellers, Unsold Alerts in Plain Language)
// @route   GET /api/store/insights
// @access  Private/Admin
const getSmartStockInsights = asyncHandler(async (req, res) => {
    const now = new Date();
    const MS_DAY = 24 * 60 * 60 * 1000;
    const sevenDaysAgo = new Date(now.getTime() - 7 * MS_DAY);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * MS_DAY);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * MS_DAY);

    const [products, recentOrders] = await Promise.all([
        Product.find({}).sort({ name: 1 }),
        Order.find({
            status: { $ne: 'Cancelled' },
            createdAt: { $gte: thirtyDaysAgo },
        }).select('orderItems createdAt isPaid status'),
    ]);

    // Aggregate per-product sales over last 7, previous 7, and 30 days
    const salesMap = {};
    for (const order of recentOrders) {
        const orderDate = new Date(order.createdAt);
        for (const item of order.orderItems || []) {
            const pid = item.product ? item.product.toString() : null;
            if (!pid) continue;
            if (!salesMap[pid]) {
                salesMap[pid] = {
                    sold7: 0,
                    soldPrev7: 0,
                    sold30: 0,
                    revenue30: 0,
                    lastSoldAt: null,
                };
            }
            const qty = Number(item.qty) || 0;
            const rev = qty * (Number(item.price) || 0);
            salesMap[pid].sold30 += qty;
            salesMap[pid].revenue30 += rev;

            if (orderDate >= sevenDaysAgo) {
                salesMap[pid].sold7 += qty;
            } else if (orderDate >= fourteenDaysAgo) {
                salesMap[pid].soldPrev7 += qty;
            }

            if (!salesMap[pid].lastSoldAt || orderDate > salesMap[pid].lastSoldAt) {
                salesMap[pid].lastSoldAt = orderDate;
            }
        }
    }

    const totalStoreOrders30 = recentOrders.length;

    const buySoonList = [];
    const hotSellersList = [];
    const notSellingList = [];
    const goodStockList = [];

    let moneyStuckOnShelf = 0;

    for (const product of products) {
        const pid = product._id.toString();
        const stats = salesMap[pid] || { sold7: 0, soldPrev7: 0, sold30: 0, revenue30: 0, lastSoldAt: null };

        const stock = Number(product.stockQuantity) || 0;
        const minLevel = Number(product.minStockLevel) || 5;
        const unitCost = Number(product.costPrice) > 0 ? Number(product.costPrice) : Number(product.price) || 0;
        const shelfValue = stock * unitCost;
        const productAgeDays = product.createdAt
            ? Math.floor((now.getTime() - new Date(product.createdAt).getTime()) / MS_DAY)
            : 30;

        // Weighted daily selling speed (recent week counts more than older weeks)
        const rate7 = stats.sold7 / 7;
        const rate30 = stats.sold30 / 30;
        const avgDailySales = stats.sold7 > 0 ? (rate7 * 0.65 + rate30 * 0.35) : rate30;

        const daysUntilOut = avgDailySales > 0.05 ? Math.max(1, Math.floor(stock / avgDailySales)) : null;

        // Friendly recommended restock amount (enough for ~14 days + safety cushion)
        const rawRestockNeed = avgDailySales > 0
            ? Math.ceil(avgDailySales * 14 + minLevel - stock)
            : Math.max(minLevel * 2 - stock, 10);
        const recommendedRestockQty = roundFriendlyQty(Math.max(5, rawRestockNeed));

        const baseItem = {
            _id: product._id,
            name: product.name,
            category: product.category,
            image: product.image,
            price: product.price,
            costPrice: product.costPrice || 0,
            supplier: product.supplier || '',
            stockQuantity: stock,
            minStockLevel: minLevel,
            soldLast7Days: stats.sold7,
            soldPrev7Days: stats.soldPrev7,
            soldLast30Days: stats.sold30,
            daysUntilOut,
            recommendedRestockQty,
            shelfValue,
        };

        // 1. FINISHED (Out of Stock)
        if (stock <= 0) {
            buySoonList.push({
                ...baseItem,
                tag: 'finished',
                urgency: 1,
                badgeEn: 'Finished!',
                badgeAm: 'አልቋል!',
                adviceEn: `Zero left in shop. Buy ${recommendedRestockQty} units today so you don't lose customers.`,
                adviceAm: `ምንም አልቀረም። ደንበኞችን ላለማጣት ዛሬ ${recommendedRestockQty} ፍሬ ይግዙ።`,
            });
            continue;
        }

        // 2. RUNNING OUT SOON (Low Stock OR Projected to run out within 7 days)
        if (stock <= minLevel || (daysUntilOut !== null && daysUntilOut <= 7)) {
            const daysTextEn = daysUntilOut
                ? `Will finish in about ${daysUntilOut} ${daysUntilOut === 1 ? 'day' : 'days'}`
                : `Only ${stock} left on shelf`;
            const daysTextAm = daysUntilOut
                ? `በግምት በ${daysUntilOut} ቀን ውስጥ ያልቃል`
                : `መደርደሪያ ላይ ${stock} ብቻ ቀርቷል`;

            buySoonList.push({
                ...baseItem,
                tag: 'buy_soon',
                urgency: 2,
                badgeEn: daysUntilOut ? `~${daysUntilOut}d left` : 'Low Stock',
                badgeAm: daysUntilOut ? `~${daysUntilOut} ቀን ቀረው` : 'ዝቅተኛ ክምችት',
                adviceEn: `${daysTextEn} — buy ${recommendedRestockQty} more soon.`,
                adviceAm: `${daysTextAm} — በቅርቡ ${recommendedRestockQty} ተጨማሪ ይግዙ።`,
            });
        }

        // 3. HOT SELLERS (Selling fast or growing compared to previous week)
        const isGrowing = stats.sold7 >= 2 && stats.sold7 > stats.soldPrev7;
        const isFastMover = stats.sold7 >= 3 || stats.sold30 >= 8;
        if (isGrowing || isFastMover) {
            hotSellersList.push({
                ...baseItem,
                tag: 'hot_seller',
                badgeEn: isGrowing ? 'Selling Faster' : 'Popular Item',
                badgeAm: isGrowing ? 'ሽያጩ ጨምሯል' : 'ተፈላጊ እቃ',
                adviceEn: stats.sold7 > 0
                    ? `Customers bought ${stats.sold7} this week. Keep it always ready in stock.`
                    : `Sold ${stats.sold30} this month. Strong steady seller.`,
                adviceAm: stats.sold7 > 0
                    ? `በዚህ ሳምንት ${stats.sold7} ተሸጧል። ሁልጊዜ እንዳያልቅ ይጠብቁ።`
                    : `በዚህ ወር ${stats.sold30} ተሸጧል። ጥሩ የሚሸጥ እቃ ነው።`,
            });
            continue;
        }

        // 4. NOT SELLING / SLOWING DOWN (Unsold cash sitting on shelf)
        const isSlowing = stats.soldPrev7 >= 3 && stats.sold7 === 0;
        const isUnsoldStagnant = stats.sold30 === 0 && (productAgeDays >= 7 || totalStoreOrders30 >= 3);
        if (isUnsoldStagnant || isSlowing) {
            moneyStuckOnShelf += shelfValue;
            notSellingList.push({
                ...baseItem,
                tag: isSlowing ? 'slowing_down' : 'not_selling',
                badgeEn: isSlowing ? 'Slowed Down' : 'Not Selling',
                badgeAm: isSlowing ? 'ሽያጩ ቀዝቅዟል' : 'አልተሸጠም',
                adviceEn: isSlowing
                    ? `Sold ${stats.soldPrev7} last week, none this week. Try promoting it to customers.`
                    : `ETB ${shelfValue.toLocaleString()} is sitting unsold (${stock} units). Lower price slightly or feature on banner.`,
                adviceAm: isSlowing
                    ? `ባለፈው ሳምንት ${stats.soldPrev7} ተሸጦ በዚህ ሳምንት አልተሸጠም። ለደንበኞች ያስተዋውቁ።`
                    : `ETB ${shelfValue.toLocaleString()} ሳይሸጥ ቆሟል (${stock} ፍሬ)። ዋጋ ትንሽ ይቀንሱ ወይም ባነር ላይ ያውጡት።`,
            });
            continue;
        }

        // 5. HEALTHY STOCK (Only if not already flagged as buy_soon)
        if (!(stock <= minLevel || (daysUntilOut !== null && daysUntilOut <= 7))) {
            goodStockList.push({
                ...baseItem,
                tag: 'good',
                badgeEn: 'Good Stock',
                badgeAm: 'በቂ ክምችት',
                adviceEn: stats.sold30 > 0
                    ? `${stock} units ready in shop. Selling calmly — no need to buy yet.`
                    : `${stock} units ready on shelf. We will guide you as orders come in.`,
                adviceAm: stats.sold30 > 0
                    ? `${stock} ፍሬ በመደብር አለ። በተረጋጋ ሁኔታ እየተሸጠ ነው — አሁን መግዛት አያስፈልግም።`
                    : `${stock} ፍሬ ለሽያጭ ዝግጁ ነው። ትዕዛዝ ሲመጣ መረጃ እንሰጥዎታለን።`,
            });
        }
    }

    // Sort Buy Soon: Finished first, then fewest days left
    buySoonList.sort((a, b) => {
        if (a.urgency !== b.urgency) return a.urgency - b.urgency;
        return (a.daysUntilOut ?? 999) - (b.daysUntilOut ?? 999);
    });

    // Sort Hot Sellers: Highest recent sales first
    hotSellersList.sort((a, b) => (b.soldLast7Days - a.soldLast7Days) || (b.soldLast30Days - a.soldLast30Days));

    // Sort Not Selling: Highest ETB stuck on shelf first
    notSellingList.sort((a, b) => b.shelfValue - a.shelfValue);

    // Build simple "What To Do Today" checklist (max 5 clearest steps)
    const todayActions = [];

    for (const item of buySoonList.slice(0, 2)) {
        todayActions.push({
            type: 'restock',
            priority: item.tag === 'finished' ? 'urgent' : 'warning',
            productId: item._id,
            productName: item.name,
            recommendedQty: item.recommendedRestockQty,
            textEn: item.tag === 'finished'
                ? `${item.name} is completely finished — buy ${item.recommendedRestockQty} today.`
                : `${item.name} is running low (${item.stockQuantity} left) — buy ${item.recommendedRestockQty} soon.`,
            textAm: item.tag === 'finished'
                ? `${item.name} ሙሉ በሙሉ አልቋል — ዛሬ ${item.recommendedRestockQty} ይግዙ።`
                : `${item.name} እያለቀ ነው (${item.stockQuantity} ቀርቷል) — በቅርቡ ${item.recommendedRestockQty} ይግዙ።`,
        });
    }

    for (const item of hotSellersList.slice(0, 1)) {
        todayActions.push({
            type: 'hot',
            priority: 'good',
            productId: item._id,
            productName: item.name,
            textEn: `${item.name} is your hottest seller right now (${item.soldLast7Days || item.soldLast30Days} sold) — never let it run out!`,
            textAm: `${item.name} አሁን በጣም እየተሸጠ ነው (${item.soldLast7Days || item.soldLast30Days} ተሸጧል) — እንዳያልቅ ይጠብቁ!`,
        });
    }

    for (const item of notSellingList.slice(0, 2)) {
        todayActions.push({
            type: 'promote',
            priority: 'info',
            productId: item._id,
            productName: item.name,
            textEn: `${item.name} hasn't sold recently (ETB ${item.shelfValue.toLocaleString()} on shelf) — lower price or promote it.`,
            textAm: `${item.name} በቅርቡ አልተሸጠም (ETB ${item.shelfValue.toLocaleString()} ቆሟል) — ዋጋ ይቀንሱ ወይም ያስተዋውቁ።`,
        });
    }

    if (todayActions.length === 0) {
        todayActions.push({
            type: 'healthy',
            priority: 'good',
            textEn: 'All your products have good stock right now! Keep sharing your store link to bring in orders.',
            textAm: 'ሁሉም እቃዎችዎ በቂ ክምችት አላቸው! ብዙ ትዕዛዝ ለማግኘት የሱቅዎን ሊንክ ለደንበኞች ያጋሩ።',
        });
    }

    res.json({
        summary: {
            totalProducts: products.length,
            buySoonCount: buySoonList.length,
            hotSellersCount: hotSellersList.length,
            notSellingCount: notSellingList.length,
            goodStockCount: goodStockList.length,
            moneyStuckOnShelf,
        },
        todayActions,
        buySoon: buySoonList,
        hotSellers: hotSellersList,
        notSelling: notSellingList,
        goodStock: goodStockList,
    });
});

module.exports = {
    getStoreOverview,
    restockProduct,
    adjustStock,
    getStockMovements,
    getSmartStockInsights,
};
