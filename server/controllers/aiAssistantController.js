const asyncHandler = require('express-async-handler');
const axios = require('axios');
const Settings = require('../models/Settings');
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const Debt = require('../models/Debt');
const CapitalTransaction = require('../models/CapitalTransaction');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');

// Helper: Fetch active AI keys (Settings DB takes priority, falls back to .env)
const getAiKeys = async () => {
    const settings = await Settings.findOne().select('geminiApiKey addisAiApiKey');
    return {
        geminiApiKey: (settings?.geminiApiKey || process.env.GEMINI_API_KEY || '').trim(),
        addisAiApiKey: (settings?.addisAiApiKey || process.env.ADDIS_AI_API_KEY || '').trim(),
    };
};

// Helper: Extract JSON safely from LLM text response
const extractJsonObject = (text) => {
    if (!text) return null;
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) return null;
    try {
        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    } catch {
        return null;
    }
};

// Helper: Built-in Zero-Cost Amharic + English Smart Parser (works offline with $0 API keys!)
const parseWithLocalRules = (rawText = '') => {
    const text = String(rawText || '').trim();
    const lower = text.toLowerCase();
    const todayIso = new Date().toISOString().split('T')[0];

    // 1. Extract numeric amount (supports "5,000", "1200 ብር", "ETB 350", etc.)
    let amount = 0;
    const numMatch = text.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
    if (numMatch) {
        amount = Number(numMatch[1]);
    } else {
        // Basic Amharic spoken number words fallback
        if (text.includes('አስር ሺህ')) amount = 10000;
        else if (text.includes('አምስት ሺህ')) amount = 5000;
        else if (text.includes('ሶስት ሺህ') || text.includes('ሦስት ሺህ')) amount = 3000;
        else if (text.includes('ሁለት ሺህ')) amount = 2000;
        else if (text.includes('አንድ ሺህ') || text.includes('ሺህ')) amount = 1000;
        else if (text.includes('አምስት መቶ')) amount = 500;
        else if (text.includes('ሶስት መቶ')) amount = 300;
        else if (text.includes('ሁለት መቶ')) amount = 200;
        else if (text.includes('መቶ')) amount = 100;
    }

    // 2. Detect payment method
    let paymentMethod = 'Cash';
    if (lower.includes('telebirr') || text.includes('ቴሌብር')) paymentMethod = 'Telebirr';
    else if (lower.includes('cbebirr') || lower.includes('cbe birr') || text.includes('ሲቢኢ')) paymentMethod = 'CBEBirr';
    else if (lower.includes('bank') || text.includes('ባንክ') || text.includes('አካውንት')) paymentMethod = 'Bank Transfer';

    // 3. Detect action type
    let actionType = 'expense';
    const isDebt =
        lower.includes('debt') ||
        lower.includes('credit') ||
        lower.includes('owe') ||
        lower.includes('borrow') ||
        text.includes('ብድር') ||
        text.includes('እዳ') ||
        text.includes('ዕዳ') ||
        text.includes('አበደር') ||
        text.includes('ተበደር');

    const isSupplierPayable =
        lower.includes('supplier') ||
        lower.includes('i owe') ||
        lower.includes('we owe') ||
        text.includes('አቅራቢ') ||
        text.includes('ተበደርኩ');

    const isCapitalInflow =
        lower.includes('invest') ||
        lower.includes('deposit') ||
        lower.includes('added cash') ||
        lower.includes('add capital') ||
        text.includes('ካፒታል አስገባ') ||
        text.includes('ገንዘብ አስገባ');

    if (isDebt) {
        actionType = isSupplierPayable ? 'debt_payable' : 'debt_receivable';
    } else if (isCapitalInflow) {
        actionType = 'capital_inflow';
    }

    // 4. Detect Expense Category (Amharic + English)
    let categoryName = 'General Overhead';
    let englishReason = text || 'Shop Expense';

    if (lower.includes('rent') || text.includes('ኪራይ')) {
        categoryName = 'Shop Rent';
        englishReason = 'Shop Rent Payment';
    } else if (lower.includes('bag') || lower.includes('pack') || text.includes('ፌስታል') || text.includes('ማሸጊያ') || text.includes('ካርቶን')) {
        categoryName = 'Packaging & Bags';
        englishReason = 'Packaging & Delivery Bags';
    } else if (lower.includes('electric') || lower.includes('water') || lower.includes('wifi') || lower.includes('internet') || text.includes('መብራት') || text.includes('ውሃ') || text.includes('ኢንተርኔት')) {
        categoryName = 'Electricity & Water';
        englishReason = 'Electricity / Water / Utilities';
    } else if (lower.includes('taxi') || lower.includes('transport') || lower.includes('fuel') || lower.includes('delivery') || text.includes('ታክሲ') || text.includes('ትራንስፖርት') || text.includes('ነዳጅ') || text.includes('ባጃጅ')) {
        categoryName = 'Transport & Delivery';
        englishReason = 'Transport & Delivery Cost';
    } else if (lower.includes('salary') || lower.includes('staff') || lower.includes('worker') || text.includes('ደመወዝ') || text.includes('ሰራተኛ')) {
        categoryName = 'Staff & Salary';
        englishReason = 'Staff Salary Payment';
    } else if (lower.includes('ad') || lower.includes('promo') || lower.includes('marketing') || text.includes('ማስታወቂያ')) {
        categoryName = 'Marketing & Ads';
        englishReason = 'Marketing & Promotion';
    } else if (actionType === 'capital_inflow') {
        categoryName = 'owner_investment';
        englishReason = 'Capital Cash Deposit';
    }

    // 5. Extract phone number & person name for debts
    const phoneMatch = text.match(/(09\d{8}|07\d{8}|\+?251\d{9})/);
    const phone = phoneMatch ? phoneMatch[0] : '';

    let personName = '';
    if (actionType === 'debt_receivable' || actionType === 'debt_payable') {
        // First word before amount is often the person's name in Amharic ("አበበ 1200 ብር ብድር ወሰደ") or English ("Abebe took 1200 credit")
        const words = text.split(/\s+/).filter(Boolean);
        if (words.length > 0 && !/^\d+$/.test(words[0]) && !['ዛሬ', 'ትናንት', 'today', 'yesterday', 'i', 'we'].includes(words[0].toLowerCase())) {
            personName = words[0];
        } else if (words.length > 1 && !/^\d+$/.test(words[1])) {
            personName = words[1];
        }
        englishReason = actionType === 'debt_receivable'
            ? `Customer Credit${personName ? ` - ${personName}` : ''}`
            : `Supplier Debt${personName ? ` - ${personName}` : ''}`;
    }

    const englishTranslation =
        actionType === 'debt_receivable'
            ? `${personName || 'Customer'} owes ETB ${amount.toLocaleString()} credit`
            : actionType === 'debt_payable'
                ? `Shop owes supplier ${personName || ''} ETB ${amount.toLocaleString()}`.trim()
                : actionType === 'capital_inflow'
                    ? `Added ETB ${amount.toLocaleString()} cash to shop treasury (${paymentMethod})`
                    : `Spent ETB ${amount.toLocaleString()} on ${englishReason} via ${paymentMethod}`;

    return {
        originalText: text,
        englishTranslation,
        actionType,
        amount,
        reason: englishReason,
        categoryName,
        paymentMethod,
        personName,
        phone,
        date: todayIso,
        notes: text !== englishReason ? `Original: ${text}` : '',
        engineUsed: 'builtin_smart_parser',
    };
};

// Helper: Call Gemini REST API (Free Tier friendly — gemini-2.5-flash with fallback to gemini-2.0-flash)
const callGemini = async (apiKey, parts) => {
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];
    let lastError = null;

    for (const model of models) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
            const response = await axios.post(
                url,
                {
                    contents: [{ parts }],
                    generationConfig: {
                        temperature: 0.1,
                        responseMimeType: 'application/json',
                    },
                },
                { timeout: 30000 }
            );

            const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const parsed = extractJsonObject(text);
            if (parsed) return { parsed, model };
        } catch (err) {
            lastError = err;
            console.warn(`[AI] Gemini model ${model} failed:`, err.response?.data?.error?.message || err.message);
        }
    }

    throw lastError || new Error('Gemini API call failed');
};

// Helper: Optional Addis AI Amharic Audio Transcription
const transcribeWithAddisAi = async (apiKey, audioBase64, mimeType = 'audio/webm') => {
    const buffer = Buffer.from(audioBase64, 'base64');
    // Uses native global FormData & Blob built into Node 18+
    const form = new global.FormData();
    const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('wav') ? 'wav' : 'webm';
    const blob = new Blob([buffer], { type: mimeType });
    form.append('chat_audio_input', blob, `voice.${ext}`);
    form.append(
        'request_data',
        JSON.stringify({
            prompt: 'Transcribe this Amharic merchant voice note accurately word for word. Return only the exact Amharic transcript.',
            target_language: 'am',
        })
    );

    const res = await fetch('https://api.addisassistant.com/api/v1/chat_generate', {
        method: 'POST',
        headers: { 'X-API-Key': apiKey },
        body: form,
    });

    if (!res.ok) {
        throw new Error(`Addis AI HTTP ${res.status}`);
    }
    const data = await res.json();
    return data?.data?.response_text || data?.response_text || data?.transcription || '';
};

const STRUCTURED_PROMPT = `You are a simple Ethiopian shopkeeper bookkeeping assistant.
Analyze the merchant's spoken Amharic/English message (or audio) and convert it into clean structured JSON so it can be saved straight into their shop database.

Return ONLY valid JSON with these exact keys:
{
  "originalText": "Exact Amharic or spoken transcript",
  "englishTranslation": "Simple clear 1-sentence English translation",
  "actionType": "expense" | "debt_receivable" | "debt_payable" | "capital_inflow",
  "amount": number (in ETB, 0 if not mentioned),
  "reason": "Short clear English description (e.g. Shop Rent, 200 Delivery Bags, Customer Credit)",
  "categoryName": "Shop Rent" | "Packaging & Bags" | "Electricity & Water" | "Transport & Delivery" | "Staff & Salary" | "Marketing & Ads" | "General Overhead",
  "paymentMethod": "Cash" | "Telebirr" | "CBEBirr" | "Bank Transfer" | "Other",
  "personName": "Person name if debt/credit, else empty string",
  "phone": "Phone number if mentioned, else empty string",
  "date": "YYYY-MM-DD (use today's date ${new Date().toISOString().split('T')[0]} unless yesterday/specific date mentioned)",
  "notes": "Any extra details"
}

Rules:
- If someone borrowed/took credit from the shop ("ብድር ወሰደ", "owes me") -> actionType = "debt_receivable".
- If shop owes a supplier ("ለአቅራቢ እዳ", "I owe supplier") -> actionType = "debt_payable".
- If merchant added cash/capital to treasury ("ካፒታል አስገባሁ", "deposited cash") -> actionType = "capital_inflow".
- Otherwise -> actionType = "expense".`;

// @desc    Get AI Assistant availability & active engines
// @route   GET /api/ai/status
// @access  Private/Admin
const getAiStatus = asyncHandler(async (req, res) => {
    const { geminiApiKey, addisAiApiKey } = await getAiKeys();
    res.json({
        builtinSmartParser: true,
        geminiEnabled: Boolean(geminiApiKey),
        addisAiEnabled: Boolean(addisAiApiKey),
        activeMode: addisAiApiKey && geminiApiKey
            ? 'addis_plus_gemini'
            : geminiApiKey
                ? 'gemini_free'
                : 'builtin_free',
    });
});

// @desc    Parse Amharic/English Voice or Text into Structured Shop Record
// @route   POST /api/ai/parse-voice
// @access  Private/Admin
const parseVoiceCommand = asyncHandler(async (req, res) => {
    const { transcript = '', audioBase64 = '', audioMimeType = 'audio/webm' } = req.body;
    const { geminiApiKey, addisAiApiKey } = await getAiKeys();

    let workingTranscript = String(transcript || '').trim();
    let addisUsed = false;

    // Step 1: If audio provided & Addis AI key is configured, transcribe Amharic with Addis AI first
    if (audioBase64 && addisAiApiKey) {
        try {
            const addisText = await transcribeWithAddisAi(addisAiApiKey, audioBase64, audioMimeType);
            if (addisText) {
                workingTranscript = addisText.trim();
                addisUsed = true;
            }
        } catch (err) {
            console.warn('[AI] Addis AI transcription failed, falling back:', err.message);
        }
    }

    // Step 2: If Gemini API key is configured, use Gemini Free Tier for Audio/Text -> English + Structured JSON
    if (geminiApiKey) {
        try {
            const parts = [{ text: STRUCTURED_PROMPT }];
            if (workingTranscript) {
                parts.push({ text: `Merchant message: "${workingTranscript}"` });
            } else if (audioBase64) {
                parts.push({
                    inline_data: {
                        mime_type: audioMimeType || 'audio/webm',
                        data: audioBase64,
                    },
                });
            } else {
                res.status(400);
                throw new Error('Please speak or type a message first.');
            }

            const { parsed, model } = await callGemini(geminiApiKey, parts);
            return res.json({
                ...parsed,
                amount: Number(parsed.amount) || 0,
                originalText: parsed.originalText || workingTranscript,
                engineUsed: addisUsed ? `addis_ai + ${model}` : model,
            });
        } catch (err) {
            console.warn('[AI] Gemini parse failed, falling back to local smart parser:', err.message);
        }
    }

    // Step 3: Zero-Cost Built-In Amharic + English Smart Parser Fallback
    if (!workingTranscript) {
        res.status(400);
        throw new Error(
            'Could not capture voice text. Add a free Gemini API key in Admin Settings to decode raw audio files, or use Chrome microphone / type your Amharic message directly.'
        );
    }

    const localResult = parseWithLocalRules(workingTranscript);
    if (addisUsed) localResult.engineUsed = 'addis_ai + builtin_smart_parser';
    res.json(localResult);
});

// @desc    Scan a Paper Receipt Image into Structured Expense Fields
// @route   POST /api/ai/scan-receipt
// @access  Private/Admin
const scanReceiptImage = asyncHandler(async (req, res) => {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
        res.status(400);
        throw new Error('Please upload or take a photo of a receipt first.');
    }

    const { geminiApiKey } = await getAiKeys();
    if (!geminiApiKey) {
        res.status(400);
        throw new Error(
            'To scan receipt photos automatically, paste your FREE Google Gemini API key in Admin Settings → AI Voice & Receipt Setup.'
        );
    }

    const receiptPrompt = `You are a simple Ethiopian shop receipt reader.
Read this receipt photo (it may be in Amharic, English, or mixed) and return ONLY valid JSON:
{
  "originalText": "Short summary of what is printed on the receipt",
  "englishTranslation": "Simple 1-sentence English summary of this receipt",
  "actionType": "expense",
  "amount": number (total amount paid in ETB, 0 if unreadable),
  "reason": "Short clear merchant/item description from the receipt",
  "categoryName": "Shop Rent" | "Packaging & Bags" | "Electricity & Water" | "Transport & Delivery" | "Staff & Salary" | "Marketing & Ads" | "General Overhead",
  "paymentMethod": "Cash" | "Telebirr" | "CBEBirr" | "Bank Transfer" | "Other",
  "date": "YYYY-MM-DD (from receipt or ${new Date().toISOString().split('T')[0]})",
  "notes": "Store/vendor name or receipt number if visible"
}`;

    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const { parsed, model } = await callGemini(geminiApiKey, [
        { text: receiptPrompt },
        {
            inline_data: {
                mime_type: mimeType,
                data: cleanBase64,
            },
        },
    ]);

    res.json({
        ...parsed,
        actionType: 'expense',
        amount: Number(parsed.amount) || 0,
        engineUsed: `${model}_vision`,
    });
});

// @desc    Save Confirmed AI Structured Record directly to MongoDB
// @route   POST /api/ai/commit
// @access  Private/Admin
const commitStructuredAction = asyncHandler(async (req, res) => {
    const {
        actionType = 'expense',
        amount,
        reason,
        categoryName = 'General Overhead',
        paymentMethod = 'Cash',
        personName = '',
        phone = '',
        date,
        notes = '',
        syncCapital = true,
    } = req.body;

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
        res.status(400);
        throw new Error('Amount must be greater than zero.');
    }

    const recordDate = date ? new Date(date) : new Date();

    // 1. EXPENSE (Saved to Expenses & Mezgeb + optional Capital Treasury sync)
    if (actionType === 'expense') {
        const defaultGroup = await Group.findOne({});
        let capitalTxId = null;

        if (syncCapital) {
            const capTx = await CapitalTransaction.create({
                type: 'outflow',
                category: 'expense',
                amount: numericAmount,
                description: `[AI Voice] ${reason || categoryName}`,
                paymentMethod,
                date: recordDate,
                recordedBy: req.user?._id,
            });
            capitalTxId = capTx._id;
        }

        const expense = await Expense.create({
            amount: numericAmount,
            reason: reason || categoryName || 'Shop Expense',
            categoryName: categoryName || 'General Overhead',
            groupId: defaultGroup?._id || null,
            userId: req.user?._id,
            userName: req.user?.name || 'Admin',
            date: recordDate,
            paymentMethod,
            syncCapital: Boolean(syncCapital),
            capitalTxId,
            notes,
        });

        return res.status(201).json({
            savedType: 'expense',
            redirectTo: '/admin/expenses',
            messageEn: `Saved ETB ${numericAmount.toLocaleString()} expense ("${expense.reason}") to Expenses & Mezgeb!`,
            messageAm: `ETB ${numericAmount.toLocaleString()} ወጪ ("${expense.reason}") በተሳካ ሁኔታ ተመዝግቧል!`,
            record: expense,
        });
    }

    // 2. DEBT / CREDIT (Customer Owes Shop OR Shop Owes Supplier)
    if (actionType === 'debt_receivable' || actionType === 'debt_payable') {
        const isReceivable = actionType === 'debt_receivable';
        const debt = await Debt.create({
            type: isReceivable ? 'receivable' : 'payable',
            personName: personName || 'Customer',
            phone: phone || '0900000000',
            title: reason || (isReceivable ? 'Customer Credit' : 'Supplier Debt'),
            totalAmount: numericAmount,
            paidAmount: 0,
            balance: numericAmount,
            status: 'pending',
            notes,
        });

        return res.status(201).json({
            savedType: actionType,
            redirectTo: '/admin/debt-credit',
            messageEn: isReceivable
                ? `Recorded ETB ${numericAmount.toLocaleString()} credit owed by ${debt.personName}!`
                : `Recorded ETB ${numericAmount.toLocaleString()} supplier bill for ${debt.personName}!`,
            messageAm: isReceivable
                ? `የ${debt.personName} ETB ${numericAmount.toLocaleString()} ብድር በተሳካ ሁኔታ ተመዝግቧል!`
                : `ለአቅራቢ ${debt.personName} የሚከፈል ETB ${numericAmount.toLocaleString()} እዳ ተመዝግቧል!`,
            record: debt,
        });
    }

    // 3. CAPITAL INFLOW (Money added to Cash Treasury)
    if (actionType === 'capital_inflow') {
        const tx = await CapitalTransaction.create({
            type: 'inflow',
            category: 'owner_investment',
            amount: numericAmount,
            description: reason || 'Cash added via AI Voice Assistant',
            paymentMethod,
            date: recordDate,
            recordedBy: req.user?._id,
        });

        return res.status(201).json({
            savedType: 'capital_inflow',
            redirectTo: '/admin/capital',
            messageEn: `Added ETB ${numericAmount.toLocaleString()} into your Capital Treasury!`,
            messageAm: `ETB ${numericAmount.toLocaleString()} ወደ ካፒታል ግምጃ ቤትዎ ተጨምሯል!`,
            record: tx,
        });
    }

    res.status(400);
    throw new Error('Unsupported action type');
});

module.exports = {
    getAiStatus,
    parseVoiceCommand,
    scanReceiptImage,
    commitStructuredAction,
};
