const asyncHandler = require('express-async-handler');
const Expense = require('../models/Expense');
const ExpenseCategory = require('../models/ExpenseCategory');
const Group = require('../models/Group');
const CapitalTransaction = require('../models/CapitalTransaction');
const Order = require('../models/Order');
const { toEthiopianDate } = require('../utils/ethiopianCalendar');

// Seed default retail store expense categories
const DEFAULT_CATEGORIES = [
    { name: 'Shop Rent', nameAmharic: 'የሱቅ ኪራይ', icon: 'Store', color: '#e03131', isDefault: true },
    { name: 'Transport & Bajaj', nameAmharic: 'ትራንስፖርትና ባጃጅ', icon: 'Truck', color: '#228be6', isDefault: true },
    { name: 'Packaging & Bags', nameAmharic: 'ማሸጊያና ፌስታል', icon: 'Package', color: '#12b886', isDefault: true },
    { name: 'Stock Purchase / Restock', nameAmharic: 'የእቃ ግዢ / ሸቀጥ', icon: 'ShoppingBag', color: '#7950f2', isDefault: true },
    { name: 'Electricity & Water', nameAmharic: 'መብራትና ውሃ', icon: 'Zap', color: '#f59f00', isDefault: true },
    { name: 'Staff Food & Refreshment', nameAmharic: 'የሰራተኛ ምግብና ሻይ', icon: 'Coffee', color: '#fd7e14', isDefault: true },
    { name: 'Maintenance & Repairs', nameAmharic: 'ጥገናና እድሳት', icon: 'Wrench', color: '#495057', isDefault: true },
    { name: 'Marketing & Flyers', nameAmharic: 'ማስታወቂያና ፕሮሞሽን', icon: 'Megaphone', color: '#e64980', isDefault: true },
    { name: 'Other Overhead', nameAmharic: 'ልዩ ልዩ ወጪዎች', icon: 'Tag', color: '#868e96', isDefault: true },
];

// @desc    Get all expenses with filters
// @route   GET /api/expenses
// @access  Private
const getExpenses = asyncHandler(async (req, res) => {
    const { groupId, category, search, startDate, endDate, limit = 100 } = req.query;

    const query = {};

    if (groupId) {
        if (groupId === 'personal') {
            query.groupId = null;
        } else {
            query.groupId = groupId;
        }
    }

    if (category && category !== 'all') {
        query.categoryName = category;
    }

    if (search) {
        query.$or = [
            { reason: { $regex: search, $options: 'i' } },
            { notes: { $regex: search, $options: 'i' } },
            { userName: { $regex: search, $options: 'i' } },
        ];
    }

    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.date.$lte = end;
        }
    }

    const expenses = await Expense.find(query)
        .sort({ date: -1, createdAt: -1 })
        .limit(Number(limit));

    res.json(expenses);
});

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = asyncHandler(async (req, res) => {
    const {
        amount,
        reason,
        categoryId,
        categoryName,
        groupId,
        date,
        receiptUrl,
        paymentMethod = 'Cash',
        syncCapital = true,
        notes = '',
    } = req.body;

    if (!amount || Number(amount) <= 0 || !reason) {
        res.status(400);
        throw new Error('Please provide a valid amount and reason');
    }

    const expDate = date ? new Date(date) : new Date();
    const dateEth = toEthiopianDate(expDate, true);

    let capitalTxId = null;

    // Optional Capital Sync
    if (syncCapital) {
        try {
            const capitalTx = await CapitalTransaction.create({
                type: 'outflow',
                category: categoryName?.toLowerCase().includes('rent') ? 'rent_utilities'
                    : categoryName?.toLowerCase().includes('stock') ? 'stock_purchase'
                    : 'expense',
                amount: Number(amount),
                description: `[Mezgeb Expense] ${reason} (${categoryName || 'Overhead'})`,
                paymentMethod: ['Cash', 'Telebirr', 'CBEBirr', 'Bank Transfer'].includes(paymentMethod)
                    ? paymentMethod
                    : 'Other',
                recordedBy: req.user?._id || null,
            });
            capitalTxId = capitalTx._id;
        } catch (err) {
            console.error('Capital auto-sync error:', err);
        }
    }

    const expense = await Expense.create({
        amount: Number(amount),
        reason,
        categoryId: categoryId || null,
        categoryName: categoryName || 'General Overhead',
        groupId: groupId && groupId !== 'personal' ? groupId : null,
        userId: req.user?._id || null,
        userName: req.user?.name || req.user?.username || 'Store Partner',
        date: expDate,
        dateEthiopian: dateEth,
        receiptUrl: receiptUrl || null,
        paymentMethod,
        syncCapital,
        capitalTxId,
        notes,
    });

    res.status(201).json(expense);
});

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = asyncHandler(async (req, res) => {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
        res.status(404);
        throw new Error('Expense not found');
    }

    const { amount, reason, categoryName, date, receiptUrl, paymentMethod, notes } = req.body;

    if (amount !== undefined) expense.amount = Number(amount);
    if (reason !== undefined) expense.reason = reason;
    if (categoryName !== undefined) expense.categoryName = categoryName;
    if (receiptUrl !== undefined) expense.receiptUrl = receiptUrl;
    if (paymentMethod !== undefined) expense.paymentMethod = paymentMethod;
    if (notes !== undefined) expense.notes = notes;

    if (date !== undefined) {
        expense.date = new Date(date);
        expense.dateEthiopian = toEthiopianDate(expense.date, true);
    }

    // Sync Capital update if capitalTxId exists
    if (expense.capitalTxId) {
        try {
            await CapitalTransaction.findByIdAndUpdate(expense.capitalTxId, {
                amount: expense.amount,
                description: `[Mezgeb Expense] ${expense.reason} (${expense.categoryName})`,
                paymentMethod: expense.paymentMethod,
            });
        } catch (e) {
            console.error('Error updating linked capital transaction:', e);
        }
    }

    await expense.save();
    res.json(expense);
});

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = asyncHandler(async (req, res) => {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
        res.status(404);
        throw new Error('Expense not found');
    }

    if (expense.capitalTxId) {
        try {
            await CapitalTransaction.findByIdAndDelete(expense.capitalTxId);
        } catch (e) {
            console.error('Error deleting linked capital tx:', e);
        }
    }

    await expense.deleteOne();
    res.json({ message: 'Expense deleted successfully' });
});

// @desc    Get expense summary, budget metrics & live shop revenue
// @route   GET /api/expenses/overview
// @access  Private
const getExpenseOverview = asyncHandler(async (req, res) => {
    const { groupId } = req.query;
    const query = {};

    if (groupId) {
        if (groupId === 'personal') query.groupId = null;
        else query.groupId = groupId;
    }

    const allExpenses = await Expense.find(query);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const startOfToday = new Date(currentYear, currentMonth, now.getDate());
    const startOfThisMonth = new Date(currentYear, currentMonth, 1);
    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    let todaySpend = 0;
    let thisMonthSpend = 0;
    let lastMonthSpend = 0;
    const categoryBreakdown = {};

    allExpenses.forEach(exp => {
        const expDate = new Date(exp.date);
        const amt = exp.amount || 0;

        // Today
        if (expDate >= startOfToday) {
            todaySpend += amt;
        }

        // This Month
        if (expDate >= startOfThisMonth) {
            thisMonthSpend += amt;
            const cat = exp.categoryName || 'Other';
            categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + amt;
        }

        // Last Month
        if (expDate >= startOfLastMonth && expDate <= endOfLastMonth) {
            lastMonthSpend += amt;
        }
    });

    // Fetch budget limit from active group or default
    let budgetLimit = 25000;
    let groupDetails = null;

    if (groupId && groupId !== 'personal') {
        const grp = await Group.findById(groupId).populate('members', 'name phone email');
        if (grp) {
            budgetLimit = grp.budgetLimit || 25000;
            groupDetails = grp;
        }
    }

    // Calculate Store Revenue from Orders for live Net Profit
    const paidOrders = await Order.find({ isPaid: true, createdAt: { $gte: startOfThisMonth } });
    const storeRevenueThisMonth = paidOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const netProfitThisMonth = storeRevenueThisMonth - thisMonthSpend;

    const budgetPercent = budgetLimit > 0 ? Math.min(100, Math.round((thisMonthSpend / budgetLimit) * 100)) : 0;
    const isBudgetExceeded = thisMonthSpend > budgetLimit;
    const isBudgetWarning = !isBudgetExceeded && budgetPercent >= 80;

    res.json({
        todaySpend,
        thisMonthSpend,
        lastMonthSpend,
        budgetLimit,
        budgetPercent,
        isBudgetExceeded,
        isBudgetWarning,
        storeRevenueThisMonth,
        netProfitThisMonth,
        categoryBreakdown,
        groupDetails,
        totalExpensesCount: allExpenses.length,
    });
});

// @desc    Get expense categories (seeds defaults if empty)
// @route   GET /api/expenses/categories
// @access  Private
const getCategories = asyncHandler(async (req, res) => {
    let categories = await ExpenseCategory.find({ isVisible: true });

    if (categories.length === 0) {
        await ExpenseCategory.insertMany(DEFAULT_CATEGORIES);
        categories = await ExpenseCategory.find({ isVisible: true });
    }

    res.json(categories);
});

// @desc    Add custom category
// @route   POST /api/expenses/categories
// @access  Private
const createCategory = asyncHandler(async (req, res) => {
    const { name, nameAmharic, icon = 'Tag', color = '#228be6' } = req.body;

    if (!name || !nameAmharic) {
        res.status(400);
        throw new Error('English and Amharic names are required');
    }

    const category = await ExpenseCategory.create({
        name,
        nameAmharic,
        icon,
        color,
        isDefault: false,
    });

    res.status(201).json(category);
});

module.exports = {
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    getExpenseOverview,
    getCategories,
    createCategory,
};
