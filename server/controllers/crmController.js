const asyncHandler = require('express-async-handler');
const axios = require('axios');
const User = require('../models/User');
const Order = require('../models/Order');
const Debt = require('../models/Debt');
const Settings = require('../models/Settings');
const SmsCampaign = require('../models/SmsCampaign');
const { aiPhraseCache } = require('../utils/memoryCache');

// Normalize Ethiopian phone to clean digits for matching & SMS gateways
const normalizeEtPhone = (raw = '') => {
    const digits = String(raw || '').replace(/[^0-9]/g, '');
    if (digits.startsWith('251') && digits.length === 12) return '0' + digits.slice(3);
    if (digits.length === 9 && (digits.startsWith('9') || digits.startsWith('7'))) return '0' + digits;
    return digits;
};

// Build unified customer list from Users + Orders + Unpaid Customer Debts
const buildCustomerProfiles = async () => {
    const now = new Date();
    const MS_DAY = 24 * 60 * 60 * 1000;

    const [users, orders, debts] = await Promise.all([
        User.find({ isAdmin: { $ne: true } }).select('name phone email createdAt').sort({ createdAt: -1 }),
        Order.find({ status: { $ne: 'Cancelled' } }).select('user totalPrice orderItems createdAt isPaid'),
        Debt.find({ type: 'receivable', balance: { $gt: 0 } }),
    ]);

    const orderStatsByUser = {};
    for (const order of orders) {
        const uid = order.user ? order.user.toString() : null;
        if (!uid) continue;
        if (!orderStatsByUser[uid]) {
            orderStatsByUser[uid] = {
                totalOrders: 0,
                totalSpent: 0,
                lastOrderDate: null,
                itemCounts: {},
            };
        }
        orderStatsByUser[uid].totalOrders += 1;
        orderStatsByUser[uid].totalSpent += Number(order.totalPrice) || 0;
        const oDate = new Date(order.createdAt);
        if (!orderStatsByUser[uid].lastOrderDate || oDate > orderStatsByUser[uid].lastOrderDate) {
            orderStatsByUser[uid].lastOrderDate = oDate;
        }
        for (const item of order.orderItems || []) {
            if (item.name) {
                orderStatsByUser[uid].itemCounts[item.name] =
                    (orderStatsByUser[uid].itemCounts[item.name] || 0) + (Number(item.qty) || 1);
            }
        }
    }

    // Index unpaid debts by normalized phone
    const debtByPhone = {};
    for (const d of debts) {
        const p = normalizeEtPhone(d.phone);
        if (!p) continue;
        if (!debtByPhone[p]) {
            debtByPhone[p] = { totalDebt: 0, personName: d.personName, phone: d.phone };
        }
        debtByPhone[p].totalDebt += Number(d.balance) || 0;
    }

    const seenPhones = new Set();
    const customers = [];

    for (const user of users) {
        const uid = user._id.toString();
        const normPhone = normalizeEtPhone(user.phone);
        if (normPhone) seenPhones.add(normPhone);

        const oStats = orderStatsByUser[uid] || { totalOrders: 0, totalSpent: 0, lastOrderDate: null, itemCounts: {} };
        const debtInfo = normPhone ? debtByPhone[normPhone] : null;
        const unpaidDebt = debtInfo ? debtInfo.totalDebt : 0;

        let favoriteItem = '';
        let maxCount = 0;
        for (const [itemName, cnt] of Object.entries(oStats.itemCounts)) {
            if (cnt > maxCount) {
                maxCount = cnt;
                favoriteItem = itemName;
            }
        }

        const daysSinceLastOrder = oStats.lastOrderDate
            ? Math.floor((now.getTime() - oStats.lastOrderDate.getTime()) / MS_DAY)
            : null;

        // Simple Plain-Language Group Classification
        const tags = [];
        if (oStats.totalOrders >= 2 || oStats.totalSpent >= 500) tags.push('vip');
        if (oStats.totalOrders >= 2) tags.push('repeat');
        if (unpaidDebt > 0) tags.push('debtors');
        if (daysSinceLastOrder === null || daysSinceLastOrder >= 30) tags.push('inactive');

        let simpleLabelEn = 'New Customer';
        let simpleLabelAm = 'አዲስ ደንበኛ';
        let badgeTone = 'cyan';

        if (unpaidDebt > 0) {
            simpleLabelEn = `Owes ETB ${unpaidDebt.toLocaleString()}`;
            simpleLabelAm = `ETB ${unpaidDebt.toLocaleString()} ብድር አለበት`;
            badgeTone = 'rose';
        } else if (tags.includes('vip')) {
            simpleLabelEn = 'Best Customer';
            simpleLabelAm = 'ምርጥ ደንበኛ';
            badgeTone = 'amber';
        } else if (oStats.totalOrders >= 1 && daysSinceLastOrder >= 30) {
            simpleLabelEn = "Hasn't Visited Recently";
            simpleLabelAm = 'በቅርቡ አልገዛም';
            badgeTone = 'indigo';
        } else if (oStats.totalOrders >= 1) {
            simpleLabelEn = 'Active Buyer';
            simpleLabelAm = 'ንቁ ደንበኛ';
            badgeTone = 'emerald';
        }

        customers.push({
            id: uid,
            name: user.name || 'Customer',
            phone: normPhone || user.phone || '',
            email: user.email || '',
            source: 'registered',
            totalOrders: oStats.totalOrders,
            totalSpent: oStats.totalSpent,
            lastOrderDate: oStats.lastOrderDate,
            daysSinceLastOrder,
            favoriteItem,
            unpaidDebt,
            tags,
            simpleLabelEn,
            simpleLabelAm,
            badgeTone,
            joinedAt: user.createdAt,
        });
    }

    // Also include credit customers from Debt Ledger who haven't registered on the website yet
    for (const [normPhone, dInfo] of Object.entries(debtByPhone)) {
        if (seenPhones.has(normPhone)) continue;
        customers.push({
            id: `debt-${normPhone}`,
            name: dInfo.personName || 'Credit Customer',
            phone: normPhone,
            email: '',
            source: 'debt_ledger',
            totalOrders: 0,
            totalSpent: 0,
            lastOrderDate: null,
            daysSinceLastOrder: null,
            favoriteItem: '',
            unpaidDebt: dInfo.totalDebt,
            tags: ['debtors'],
            simpleLabelEn: `Owes ETB ${dInfo.totalDebt.toLocaleString()}`,
            simpleLabelAm: `ETB ${dInfo.totalDebt.toLocaleString()} ብድር አለበት`,
            badgeTone: 'rose',
            joinedAt: null,
        });
    }

    customers.sort((a, b) => b.totalSpent - a.totalSpent || b.unpaidDebt - a.unpaidDebt);
    return customers;
};

// Helper: Send 1 SMS via configured Ethiopian Gateway (AfroMessage / GeezSMS)
const sendSingleSms = async ({ provider, apiKey, senderId, phone, message }) => {
    const cleanPhone = normalizeEtPhone(phone);
    if (!cleanPhone || cleanPhone.length < 9) {
        throw new Error('Invalid phone number');
    }

    if (provider === 'afromessage') {
        const payload = {
            to: cleanPhone.startsWith('0') ? '+251' + cleanPhone.slice(1) : cleanPhone,
            message,
            ...(senderId ? { sender: senderId } : {}),
        };
        const res = await axios.post('https://api.afromessage.com/api/send', payload, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 15000,
        });
        if (res.data?.acknowledge !== 'success' && res.status >= 400) {
            throw new Error(res.data?.response?.errors?.[0] || 'AfroMessage rejected SMS');
        }
        return true;
    }

    if (provider === 'geezsms') {
        const res = await axios.post(
            'https://api.geezsms.com/api/v1/sms/send',
            {
                token: apiKey,
                phone: cleanPhone.startsWith('0') ? '251' + cleanPhone.slice(1) : cleanPhone,
                msg: message,
                ...(senderId ? { shortcode_id: senderId } : {}),
            },
            { timeout: 15000 }
        );
        if (res.data?.error) {
            throw new Error(res.data.msg || 'GeezSMS rejected SMS');
        }
        return true;
    }

    return true;
};

// @desc    Get Simple CRM Customer Overview & SMS History
// @route   GET /api/crm/overview
// @access  Private/Admin
const getCrmOverview = asyncHandler(async (req, res) => {
    const [customers, campaigns, settings] = await Promise.all([
        buildCustomerProfiles(),
        SmsCampaign.find({}).sort({ createdAt: -1 }).limit(20),
        Settings.findOne().select('storeName smsProvider smsApiKey smsSenderId geminiApiKey'),
    ]);

    const summary = {
        totalCustomers: customers.length,
        vipCount: customers.filter((c) => c.tags.includes('vip')).length,
        inactiveCount: customers.filter((c) => c.tags.includes('inactive')).length,
        debtorCount: customers.filter((c) => c.tags.includes('debtors')).length,
    };

    const smsConfigured = Boolean(
        settings?.smsApiKey && settings?.smsProvider && settings.smsProvider !== 'simulation'
    );

    res.json({
        storeName: settings?.storeName || 'Gondar ሱቅ',
        smsStatus: {
            provider: settings?.smsProvider || 'simulation',
            configured: smsConfigured,
            senderId: settings?.smsSenderId || '',
        },
        aiWriterAvailable: Boolean(settings?.geminiApiKey || process.env.GEMINI_API_KEY),
        summary,
        customers,
        campaigns,
    });
});

// @desc    Let AI Write a Simple Catchy Promo or Debt Reminder SMS (Amharic or English)
// @route   POST /api/crm/ai-write-sms
// @access  Private/Admin
const aiWriteSms = asyncHandler(async (req, res) => {
    const { goal = 'promo', language = 'am', topic = '' } = req.body;
    const settings = await Settings.findOne().select('storeName geminiApiKey');
    const storeName = settings?.storeName || 'Gondar ሱቅ';
    const apiKey = (settings?.geminiApiKey || process.env.GEMINI_API_KEY || '').trim();

    // Friendly local templates if no key or fallback needed
    const fallbackTemplates = {
        promo: {
            am: `ሰላም ውድ ደንበኛችን! ${storeName} ውስጥ አዲስ እቃዎች እና ልዩ ቅናሽ ገብቷል። ዛሬውኑ ይጎብኙን! ${topic}`.trim(),
            en: `Hello valued customer! Fresh items and special discounts are waiting for you at ${storeName} today. ${topic}`.trim(),
        },
        comeback: {
            am: `ሰላም! ናፍቀውናል — ${storeName} ሲመለሱ ልዩ ቅናሽ አዘጋጅተንልዎታል። ዛሬውኑ ይዘዙ!`,
            en: `We miss you at ${storeName}! Come back today and enjoy a special welcome-back offer on your next order.`,
        },
        debt: {
            am: `ሰላም ውድ ደንበኛችን፣ በ${storeName} ያለብዎትን የብድር ቀሪ ሂሳብ ሲመችዎት እንዲከፍሉ በአክብሮት እናስታውሳለን። እናመሰግናለን!`,
            en: `Hello valued customer, this is a polite reminder from ${storeName} regarding your remaining balance. Thank you!`,
        },
    };

    if (!apiKey) {
        const msg = fallbackTemplates[goal]?.[language] || fallbackTemplates.promo[language];
        return res.json({ message: msg, source: 'template' });
    }

    const smsCacheKey = `sms::${storeName}::${goal}::${language}::${String(topic || '').trim().toLowerCase()}`;
    const cachedSms = aiPhraseCache.get(smsCacheKey);
    if (cachedSms) {
        res.setHeader('X-Cache', 'HIT');
        return res.json({ ...cachedSms, cached: true });
    }

    const langName = language === 'am' ? 'natural, warm Ethiopian Amharic' : 'simple, friendly English';
    const prompt = `Write ONE short, warm, clear SMS message (under 155 characters) in ${langName} for an Ethiopian shop named "${storeName}".
Goal: ${goal === 'debt' ? 'Polite friendly reminder to pay remaining shop credit' : goal === 'comeback' ? 'Warm welcome-back message to bring back a customer who has not visited recently' : 'Exciting shop promo / discount announcement'}.
Extra merchant note: "${topic || 'Special offer today'}".
Return ONLY the SMS text itself — no quotes, no explanation.`;

    try {
        const resAi = await axios.post(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
            {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { thinkingConfig: { thinkingBudget: 0 } },
            },
            { headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, timeout: 20000 }
        );
        const generated = (resAi.data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim().replace(/^["']|["']$/g, '');
        if (generated) {
            const payload = { message: generated, source: 'gemini-2.5-flash' };
            aiPhraseCache.set(smsCacheKey, payload, 60 * 60 * 1000);
            res.setHeader('X-Cache', 'MISS');
            return res.json(payload);
        }
    } catch (err) {
        console.warn('[CRM AI SMS] Gemini failed, using friendly template:', err.message);
    }

    const fallback = fallbackTemplates[goal]?.[language] || fallbackTemplates.promo[language];
    res.json({ message: fallback, source: 'template' });
});

// @desc    Send Bulk SMS Promo Campaign (or Single Customer SMS)
// @route   POST /api/crm/send-sms
// @access  Private/Admin
const sendSmsCampaign = asyncHandler(async (req, res) => {
    const { title = 'Shop Promo', message = '', audience = 'all', singlePhone = '', singleName = '' } = req.body;

    if (!message.trim()) {
        res.status(400);
        throw new Error('Please write an SMS message first.');
    }

    const [customers, settings] = await Promise.all([
        buildCustomerProfiles(),
        Settings.findOne().select('smsProvider smsApiKey smsSenderId'),
    ]);

    let recipients = [];
    if (audience === 'single') {
        const clean = normalizeEtPhone(singlePhone);
        if (!clean || clean.length < 9) {
            res.status(400);
            throw new Error('Please enter a valid Ethiopian phone number (e.g. 0911223344).');
        }
        recipients = [{ name: singleName || 'Customer', phone: clean }];
    } else if (audience === 'all') {
        recipients = customers.filter((c) => c.phone && c.phone.length >= 9);
    } else {
        recipients = customers.filter((c) => c.tags.includes(audience) && c.phone && c.phone.length >= 9);
    }

    if (recipients.length === 0) {
        res.status(400);
        throw new Error('No customers with a valid phone number found in this group yet.');
    }

    const provider = settings?.smsProvider || process.env.SMS_PROVIDER || 'simulation';
    const apiKey = (settings?.smsApiKey || process.env.SMS_API_KEY || '').trim();
    const senderId = (settings?.smsSenderId || process.env.SMS_SENDER_ID || '').trim();
    const isLive = Boolean(apiKey && provider !== 'simulation');

    let deliveredCount = 0;
    let failedCount = 0;

    if (isLive) {
        for (const r of recipients) {
            try {
                await sendSingleSms({ provider, apiKey, senderId, phone: r.phone, message: message.trim() });
                deliveredCount++;
            } catch (err) {
                console.warn(`[SMS] Failed to send to ${r.phone}:`, err.message);
                failedCount++;
            }
        }
    } else {
        // Free Test Preview Mode — zero telecom charge until AfroMessage/GeezSMS key is added
        deliveredCount = recipients.length;
    }

    const campaign = await SmsCampaign.create({
        title: title.trim() || 'Shop Promo',
        message: message.trim(),
        audience,
        recipientCount: recipients.length,
        deliveredCount,
        failedCount,
        provider: isLive ? provider : 'simulation',
        mode: isLive ? 'live' : 'test_preview',
        sampleRecipients: recipients.slice(0, 5).map((r) => ({ name: r.name, phone: r.phone })),
        sentBy: req.user?._id,
    });

    res.status(201).json({
        campaign,
        mode: isLive ? 'live' : 'test_preview',
        messageEn: isLive
            ? `Sent SMS to ${deliveredCount} of ${recipients.length} customers via ${provider}!`
            : `Preview saved for ${recipients.length} customers! Add your AfroMessage or GeezSMS key in Settings to deliver real telecom SMS.`,
        messageAm: isLive
            ? `ለ ${deliveredCount} ደንበኞች SMS በተሳካ ሁኔታ ተልኳል!`
            : `ለ ${recipients.length} ደንበኞች የሙከራ ቅድመ-እይታ ተመዝግቧል! ትክክለኛ SMS ለመላክ የAfroMessage ወይም GeezSMS ቁልፍ በቅንብሮች ያስገቡ።`,
    });
});

module.exports = {
    getCrmOverview,
    aiWriteSms,
    sendSmsCampaign,
};
