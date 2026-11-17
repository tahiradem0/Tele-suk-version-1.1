const asyncHandler = require('express-async-handler');
const Group = require('../models/Group');

// Helper to generate a random 4-digit code like CONN-4821
function generateConnectionId() {
    return 'CONN-' + Math.floor(1000 + Math.random() * 9000);
}

// @desc    Get user's shop & expense groups (ensures default store group exists)
// @route   GET /api/groups
// @access  Private
const getGroups = asyncHandler(async (req, res) => {
    let groups = [];
    const userId = req.user?._id;

    if (userId) {
        groups = await Group.find({
            $or: [{ members: userId }, { createdBy: userId }],
        }).populate('members', 'name phone email role');
    } else {
        groups = await Group.find({}).populate('members', 'name phone email role');
    }

    // If no groups exist yet, seed the default store group
    if (groups.length === 0) {
        const defaultGroup = await Group.create({
            name: 'Gondar Tele-Suk (Main Store)',
            connectionId: generateConnectionId(),
            type: 'online_shop',
            members: userId ? [userId] : [],
            createdBy: userId || null,
            budgetLimit: 30000,
            budgetPeriod: 'Monthly',
            description: 'Default online shop partner and expense tracking ledger',
        });
        groups = [defaultGroup];
    }

    res.json(groups);
});

// @desc    Create new partner group / online shop
// @route   POST /api/groups and POST /api/groups/create
// @access  Private
const createGroup = asyncHandler(async (req, res) => {
    const { name, connectionId: customId, type = 'online_shop', budgetLimit = 25000, budgetPeriod = 'Monthly', description } = req.body;

    if (!name) {
        res.status(400);
        throw new Error('Group name is required');
    }

    let connectionId = customId ? customId.trim().toUpperCase() : generateConnectionId();
    if (!customId) {
        // Ensure uniqueness for auto-generated
        let existing = await Group.findOne({ connectionId });
        while (existing) {
            connectionId = generateConnectionId();
            existing = await Group.findOne({ connectionId });
        }
    }

    const userId = req.user?._id;

    const group = await Group.create({
        name,
        connectionId,
        type,
        members: userId ? [userId] : [],
        createdBy: userId || null,
        budgetLimit: Number(budgetLimit) || 25000,
        budgetPeriod,
        description: description || 'Shared store partner expense ledger',
    });

    res.status(201).json(group);
});

// @desc    Join existing partner group using Connection ID or Partner Phone
// @route   POST /api/groups/join
// @access  Private
const joinGroup = asyncHandler(async (req, res) => {
    const { connectionId, partnerPhone } = req.body;

    if (!connectionId) {
        res.status(400);
        throw new Error('Connection ID is required (e.g. CONN-1234)');
    }

    const normalizedId = connectionId.trim().toUpperCase();
    let group = await Group.findOne({ connectionId: normalizedId });

    if (!group) {
        res.status(404);
        throw new Error(`No partner shop found with code "${normalizedId}". Please verify with your business partner.`);
    }

    const userId = req.user?._id;
    if (userId) {
        if (!group.members.some(m => m.toString() === userId.toString())) {
            group.members.push(userId);
            await group.save();
        }
    }

    await group.populate('members', 'name phone email role');
    res.json({ message: `Successfully connected to "${group.name}"!`, group });
});

// @desc    Update group budget limit
// @route   PUT /api/groups/:id/budget
// @access  Private
const updateBudget = asyncHandler(async (req, res) => {
    const { budgetLimit, budgetPeriod } = req.body;

    const group = await Group.findById(req.params.id);
    if (!group) {
        res.status(404);
        throw new Error('Group not found');
    }

    if (budgetLimit !== undefined) group.budgetLimit = Number(budgetLimit);
    if (budgetPeriod !== undefined) group.budgetPeriod = budgetPeriod;

    await group.save();
    res.json(group);
});

module.exports = {
    getGroups,
    createGroup,
    joinGroup,
    updateBudget,
};
