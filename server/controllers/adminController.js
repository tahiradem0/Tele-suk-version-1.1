const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const CapitalTransaction = require('../models/CapitalTransaction');
const Debt = require('../models/Debt');
const Expense = require('../models/Expense');
const Settings = require('../models/Settings');

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = asyncHandler(async (req, res) => {
    // 1. Total Registered Customers (excluding admin account so it matches Customers & SMS)
    const usersCount = await User.countDocuments({ isAdmin: { $ne: true } });

    // 2. Total Products
    const products = await Product.find({});
    const productsCount = products.length;

    // Inventory metrics
    let totalStockUnits = 0;
    let totalInventoryCost = 0;
    let totalInventoryRetail = 0;
    let lowStockCount = 0;

    products.forEach(p => {
        const qty = p.stockQuantity || 0;
        const cost = p.costPrice || 0;
        const price = p.price || 0;
        const minLevel = p.minStockLevel || 5;

        totalStockUnits += qty;
        totalInventoryCost += qty * cost;
        totalInventoryRetail += qty * price;

        if (qty <= minLevel) {
            lowStockCount++;
        }
    });

    // 3. Total Active Orders & Revenue (exclude Cancelled so it matches Money Report)
    const orders = await Order.find({ status: { $ne: 'Cancelled' } });
    const ordersCount = orders.length;
    const totalRevenue = orders.reduce((acc, order) => acc + (order.totalPrice || 0), 0);

    // 4. Capital Transactions
    const capitalTransactions = await CapitalTransaction.find({});
    let totalInflow = 0;
    let totalOutflow = 0;
    capitalTransactions.forEach(tx => {
        if (tx.type === 'inflow') totalInflow += tx.amount;
        if (tx.type === 'outflow') totalOutflow += tx.amount;
    });
    const netCapital = totalInflow - totalOutflow;

    // 5. Debt & Credit stats
    const debts = await Debt.find({});
    let totalReceivables = 0; // Customer credit owed to store
    let totalPayables = 0;    // Store owes to suppliers
    debts.forEach(d => {
        if (d.type === 'receivable') {
            totalReceivables += d.balance || 0;
        } else if (d.type === 'payable') {
            totalPayables += d.balance || 0;
        }
    });

    res.json({
        usersCount,
        productsCount,
        ordersCount,
        totalRevenue,
        netCapital,
        totalInflow,
        totalOutflow,
        totalReceivables,
        totalPayables,
        totalStockUnits,
        totalInventoryCost,
        totalInventoryRetail,
        lowStockCount,
    });
});

// @desc    Get One-Click Simple Financial Report (Plain Language, Zero Jargon)
// @route   GET /api/admin/financial-report?period=today|week|month|all
// @access  Private/Admin
const getFinancialReport = asyncHandler(async (req, res) => {
    const period = ['today', 'week', 'month', 'all'].includes(req.query.period)
        ? req.query.period
        : 'month';

    const now = new Date();
    let startDate = null;
    if (period === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const dateQuery = startDate ? { $gte: startDate } : null;

    const [
        settings,
        products,
        periodOrders,
        periodExpenses,
        allCapitalTxs,
        periodCapitalTxs,
        allDebts,
    ] = await Promise.all([
        Settings.findOne(),
        Product.find({}),
        Order.find({
            status: { $ne: 'Cancelled' },
            ...(dateQuery ? { createdAt: dateQuery } : {}),
        }),
        Expense.find(dateQuery ? { date: dateQuery } : {}),
        CapitalTransaction.find({}),
        CapitalTransaction.find(dateQuery ? { date: dateQuery } : {}),
        Debt.find({}),
    ]);

    // 1. Money Came In (Orders / Sales)
    let salesRevenue = 0;
    let paidSalesRevenue = 0;
    let paidOrdersCount = 0;
    const productSalesMap = {};

    for (const order of periodOrders) {
        const orderTotal = Number(order.totalPrice) || 0;
        salesRevenue += orderTotal;
        if (order.isPaid) {
            paidSalesRevenue += orderTotal;
            paidOrdersCount++;
        }
        for (const item of order.orderItems || []) {
            const key = item.name || 'Product';
            if (!productSalesMap[key]) {
                productSalesMap[key] = { name: key, image: item.image || '', unitsSold: 0, moneyEarned: 0 };
            }
            const qty = Number(item.qty) || 0;
            const price = Number(item.price) || 0;
            productSalesMap[key].unitsSold += qty;
            productSalesMap[key].moneyEarned += qty * price;
        }
    }

    const topProducts = Object.values(productSalesMap)
        .sort((a, b) => b.moneyEarned - a.moneyEarned)
        .slice(0, 6);

    // 2. Money Went Out (Expenses + Stock Purchases)
    let shopExpensesTotal = 0;
    const expenseByCategory = {};

    for (const exp of periodExpenses) {
        const amt = Number(exp.amount) || 0;
        shopExpensesTotal += amt;
        const cat = exp.categoryName || 'General';
        expenseByCategory[cat] = (expenseByCategory[cat] || 0) + amt;
    }

    let stockPurchasesTotal = 0;
    let otherCapitalInflow = 0;
    let otherCapitalOutflow = 0;

    for (const tx of periodCapitalTxs) {
        const amt = Number(tx.amount) || 0;
        const desc = String(tx.description || '');
        const isSyncedExpense =
            tx.category === 'expense' ||
            desc.startsWith('[Mezgeb Expense]') ||
            desc.startsWith('[AI Voice]');

        if (tx.type === 'outflow') {
            if (tx.category === 'stock_purchase') {
                stockPurchasesTotal += amt;
            } else if (!isSyncedExpense) {
                // Avoid double-counting Mezgeb/AI expenses already counted in shopExpensesTotal
                otherCapitalOutflow += amt;
            }
        } else if (tx.type === 'inflow' && tx.category !== 'sale') {
            otherCapitalInflow += amt;
        }
    }

    const totalMoneyIn = salesRevenue + otherCapitalInflow;
    const totalMoneyOut = shopExpensesTotal + stockPurchasesTotal + otherCapitalOutflow;
    const simpleProfit = salesRevenue - shopExpensesTotal;

    const topExpenseCategories = Object.entries(expenseByCategory)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);

    // 3. Current Shop Snapshot (Cash, Goods, Debts)
    let totalInflowAll = 0;
    let totalOutflowAll = 0;
    for (const tx of allCapitalTxs) {
        if (tx.type === 'inflow') totalInflowAll += Number(tx.amount) || 0;
        if (tx.type === 'outflow') totalOutflowAll += Number(tx.amount) || 0;
    }
    const cashInHand = totalInflowAll - totalOutflowAll;

    let totalStockUnits = 0;
    let stockCostValue = 0;
    let stockRetailValue = 0;
    for (const p of products) {
        const qty = Number(p.stockQuantity) || 0;
        const cost = Number(p.costPrice) > 0 ? Number(p.costPrice) : Number(p.price) || 0;
        const price = Number(p.price) || 0;
        totalStockUnits += qty;
        stockCostValue += qty * cost;
        stockRetailValue += qty * price;
    }

    let moneyCustomersOweYou = 0;
    let moneyYouOweSuppliers = 0;
    const unpaidCustomers = [];
    const unpaidSuppliers = [];

    for (const d of allDebts) {
        const bal = Number(d.balance) || 0;
        if (bal <= 0) continue;
        if (d.type === 'receivable') {
            moneyCustomersOweYou += bal;
            unpaidCustomers.push({
                _id: d._id,
                personName: d.personName,
                phone: d.phone,
                balance: bal,
                title: d.title,
            });
        } else if (d.type === 'payable') {
            moneyYouOweSuppliers += bal;
            unpaidSuppliers.push({
                _id: d._id,
                personName: d.personName,
                phone: d.phone,
                balance: bal,
                title: d.title,
            });
        }
    }

    unpaidCustomers.sort((a, b) => b.balance - a.balance);
    unpaidSuppliers.sort((a, b) => b.balance - a.balance);

    const totalShopWorth = cashInHand + stockCostValue + moneyCustomersOweYou - moneyYouOweSuppliers;

    // 4. Plain-Language Story ("In Simple Words") — NO JARGON, NO CONFUSING PERCENTAGES
    const periodLabelEn = {
        today: 'Today',
        week: 'In the last 7 days',
        month: 'This month',
        all: 'Overall',
    }[period];

    const periodLabelAm = {
        today: 'ዛሬ',
        week: 'ባለፉት 7 ቀናት',
        month: 'በዚህ ወር',
        all: 'በአጠቃላይ',
    }[period];

    const plainAdvice = [];

    // Story 1: Sales vs Expenses (Profit clarity)
    if (salesRevenue > 0 && simpleProfit >= 0) {
        plainAdvice.push({
            tone: 'good',
            en: `${periodLabelEn}, you sold ETB ${salesRevenue.toLocaleString()} worth of goods and spent ETB ${shopExpensesTotal.toLocaleString()} on shop expenses — leaving ETB ${simpleProfit.toLocaleString()} profit.`,
            am: `${periodLabelAm} ETB ${salesRevenue.toLocaleString()} ሽያጭ አግኝተው ETB ${shopExpensesTotal.toLocaleString()} ለወጪ ከፍለዋል — ETB ${simpleProfit.toLocaleString()} የተጣራ ትርፍ ቀርቶልዎታል።`,
        });
    } else if (shopExpensesTotal > 0 && salesRevenue === 0) {
        plainAdvice.push({
            tone: 'warning',
            en: `${periodLabelEn}, you spent ETB ${shopExpensesTotal.toLocaleString()} on shop expenses and have ETB 0 in sales so far. Share your store link to bring in orders.`,
            am: `${periodLabelAm} ETB ${shopExpensesTotal.toLocaleString()} ወጪ አውጥተዋል፣ እስካሁን ሽያጭ የለም። ትዕዛዝ ለማግኘት የሱቅዎን ሊንክ ለደንበኞች ያጋሩ።`,
        });
    } else if (simpleProfit < 0) {
        plainAdvice.push({
            tone: 'warning',
            en: `${periodLabelEn}, shop expenses (ETB ${shopExpensesTotal.toLocaleString()}) were higher than sales (ETB ${salesRevenue.toLocaleString()}) by ETB ${Math.abs(simpleProfit).toLocaleString()}. Watch your daily spending closely.`,
            am: `${periodLabelAm} የሱቅ ወጪዎ (ETB ${shopExpensesTotal.toLocaleString()}) ከሽያጭዎ (ETB ${salesRevenue.toLocaleString()}) በETB ${Math.abs(simpleProfit).toLocaleString()} በልጧል። የዕለት ወጪዎችን ይቆጣጠሩ።`,
        });
    } else {
        plainAdvice.push({
            tone: 'info',
            en: `${periodLabelEn}, no sales or expenses have been recorded yet. Your ledger is clean and ready.`,
            am: `${periodLabelAm} እስካሁን የተመዘገበ ሽያጭ ወይም ወጪ የለም። መዝገብዎ ንጹህ እና ዝግጁ ነው።`,
        });
    }

    // Story 2: Biggest Expense Drain
    if (topExpenseCategories.length > 0) {
        const topExp = topExpenseCategories[0];
        plainAdvice.push({
            tone: 'info',
            en: `Your biggest expense was "${topExp.category}" (ETB ${topExp.amount.toLocaleString()}).`,
            am: `ትልቁ ወጪዎ "${topExp.category}" ነበር (ETB ${topExp.amount.toLocaleString()})።`,
        });
    }

    // Story 3: Money Customers Owe You
    if (moneyCustomersOweYou > 0) {
        const topDebtor = unpaidCustomers[0];
        plainAdvice.push({
            tone: 'warning',
            en: `Customers owe your shop ETB ${moneyCustomersOweYou.toLocaleString()} right now — remember to collect from ${topDebtor.personName} (ETB ${topDebtor.balance.toLocaleString()}).`,
            am: `ደንበኞች አሁን ETB ${moneyCustomersOweYou.toLocaleString()} ብድር አለባቸው — ከ${topDebtor.personName} (ETB ${topDebtor.balance.toLocaleString()}) መሰብሰብ አይርሱ።`,
        });
    }

    // Story 4: Money You Owe Suppliers
    if (moneyYouOweSuppliers > 0) {
        plainAdvice.push({
            tone: 'info',
            en: `Keep ETB ${moneyYouOweSuppliers.toLocaleString()} ready to pay your suppliers on time.`,
            am: `ለአቅራቢዎች የሚከፈል ETB ${moneyYouOweSuppliers.toLocaleString()} እዳ በወቅቱ ለመክፈል ዝግጁ ያድርጉ።`,
        });
    }

    // Story 5: Goods on Shelf
    if (stockRetailValue > 0) {
        plainAdvice.push({
            tone: 'good',
            en: `You have ${totalStockUnits.toLocaleString()} items in your shop worth ETB ${stockRetailValue.toLocaleString()} when sold.`,
            am: `መደብርዎ ውስጥ ሲሸጡ ETB ${stockRetailValue.toLocaleString()} የሚያወጡ ${totalStockUnits.toLocaleString()} ፍሬ እቃዎች አሉዎት።`,
        });
    }

    res.json({
        storeName: settings?.storeName || 'Gondar ሱቅ',
        period,
        generatedAt: now.toISOString(),
        moneyFlow: {
            salesRevenue,
            paidSalesRevenue,
            totalOrdersCount: periodOrders.length,
            paidOrdersCount,
            otherCapitalInflow,
            totalMoneyIn,
            shopExpensesTotal,
            stockPurchasesTotal,
            otherCapitalOutflow,
            totalMoneyOut,
            simpleProfit,
        },
        shopSnapshot: {
            cashInHand,
            totalStockUnits,
            stockCostValue,
            stockRetailValue,
            moneyCustomersOweYou,
            moneyYouOweSuppliers,
            totalShopWorth,
        },
        topExpenseCategories,
        topProducts,
        unpaidCustomers: unpaidCustomers.slice(0, 5),
        unpaidSuppliers: unpaidSuppliers.slice(0, 5),
        plainAdvice,
    });
});

module.exports = { getStats, getFinancialReport };
