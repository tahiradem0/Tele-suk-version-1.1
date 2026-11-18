const asyncHandler = require('express-async-handler');
const axios = require('axios');
const Settings = require('../models/Settings');
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const Debt = require('../models/Debt');
const CapitalTransaction = require('../models/CapitalTransaction');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const { apiCache, aiPhraseCache } = require('../utils/memoryCache');

// Helper: Fetch active AI keys (cached in RAM, auto-invalidated when Settings update)
const getAiKeys = async () => {
    const cached = apiCache.get('internal::ai_keys');
    if (cached) return cached;
    const settings = await Settings.findOne().select('geminiApiKey addisAiApiKey');
    const keys = {
        geminiApiKey: (settings?.geminiApiKey || process.env.GEMINI_API_KEY || '').trim(),
        addisAiApiKey: (settings?.addisAiApiKey || process.env.ADDIS_AI_API_KEY || '').trim(),
    };
    apiCache.set('internal::ai_keys', keys, 60000);
    return keys;
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

// Helper: Exact Amharic + English Compound Number Parser (1 to 999,999,999)
// Handles "ሁለት ሺህ አምስት መቶ" (2500), "ሁለት ሺህ ተኩል" (2500), "አንድ ሺህ ሁለት መቶ ሀምሳ" (1250),
// "2 ሺህ 500" (2500), "2,500", "two thousand five hundred" (2500), etc.
const parseSpokenAmount = (rawText = '') => {
    const cleaned = String(rawText || '')
        .replace(/,/g, '')
        .replace(/[፡።፣፤፥፦]/g, ' ')
        .trim();
    if (!cleaned) return 0;

    // Remove Ethiopian phone numbers before scanning amounts so "0911223344" is never read as Birr!
    const withoutPhones = cleaned.replace(/(?:\+?251|0)[79]\d{8}/g, ' ');

    const WORD_VALUES = {
        // Amharic Units (1-9)
        'አንድ': 1, 'አንደ': 1, 'ሁለት': 2, 'ሶስት': 3, 'ሦስት': 3, 'አራት': 4,
        'አምስት': 5, 'ስድስት': 6, 'ሰባት': 7, 'ስምንት': 8, 'ዘጠኝ': 9,
        // Amharic Teens & Tens (10-90)
        'አስር': 10, 'ዐሥር': 10, 'አሥር': 10, 'አስራ': 10, 'ዐሥራ': 10, 'አሥራ': 10,
        'ሃያ': 20, 'ሀያ': 20, 'ሐያ': 20,
        'ሰላሳ': 30, 'ሠላሳ': 30,
        'አርባ': 40, 'ዐርባ': 40,
        'ሀምሳ': 50, 'ሃምሳ': 50, 'ሐምሳ': 50, 'ኀምሳ': 50,
        'ስልሳ': 60, 'ሥልሳ': 60,
        'ሰባ': 70,
        'ሰማንያ': 80, 'ሰማኒያ': 80,
        'ዘጠና': 90,
        // English Units & Tens
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
        'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
        'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19,
        'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
        'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
    };

    const MULTIPLIERS = {
        'መቶ': 100, 'hundred': 100,
        'ሺህ': 1000, 'ሺ': 1000, 'ሽህ': 1000, 'ሽ': 1000, 'thousand': 1000,
        'ሚሊዮን': 1000000, 'ሚሊየን': 1000000, 'million': 1000000,
    };

    const HALF_WORDS = new Set(['ተኩል', 'ግማሽ', 'half']);
    const CONNECTORS = new Set(['ከ', 'እና', 'and', 'with']);
    const CURRENCY_WORDS = new Set(['ብር', 'birr', 'etb', 'ብርን', 'ብሩን']);

    const tokens = withoutPhones.toLowerCase().split(/\s+/).filter(Boolean);

    let currencyBest = 0;
    let fallbackBest = 0;
    let total = 0;
    let current = 0;
    let lastMultiplier = 0;
    let inNumber = false;

    const flush = (isCurrency = false) => {
        const candidate = total + current;
        if (candidate > 0) {
            if (isCurrency && candidate > currencyBest) currencyBest = candidate;
            if (candidate > fallbackBest) fallbackBest = candidate;
        }
        total = 0;
        current = 0;
        lastMultiplier = 0;
        inNumber = false;
    };

    for (let i = 0; i < tokens.length; i++) {
        // Strip punctuation and leading Amharic prepositions ("በ500", "ከአምስት", "የ2000", "ለ300")
        let tok = tokens[i].replace(/[^\p{L}\p{N}.]/gu, '');
        if (!tok) continue;
        if (/^[በየለከ]/.test(tok) && tok.length > 1) {
            const stripped = tok.slice(1);
            if (/^\d+(?:\.\d+)?$/.test(stripped) || WORD_VALUES[stripped] !== undefined || MULTIPLIERS[stripped] !== undefined) {
                tok = stripped;
            }
        }

        // Pure numeric token (e.g. "2500", "2000", "500")
        if (/^\d+(?:\.\d+)?$/.test(tok)) {
            const num = Number(tok);
            if (!isNaN(num)) {
                inNumber = true;
                current += num;
                lastMultiplier = num >= 1000 ? 1000 : num >= 100 ? 100 : 1;
                continue;
            }
        }

        if (WORD_VALUES[tok] !== undefined) {
            inNumber = true;
            current += WORD_VALUES[tok];
            continue;
        }

        if (MULTIPLIERS[tok] !== undefined) {
            const mult = MULTIPLIERS[tok];
            inNumber = true;
            if (mult === 100) {
                current = (current === 0 ? 1 : current) * 100;
            } else {
                total += (current === 0 ? 1 : current) * mult;
                current = 0;
            }
            lastMultiplier = mult;
            continue;
        }

        if (HALF_WORDS.has(tok) && inNumber) {
            if (lastMultiplier >= 100) {
                current += lastMultiplier / 2;
            } else {
                current += 0.5;
            }
            continue;
        }

        if (CONNECTORS.has(tok) && inNumber) {
            continue;
        }

        if (inNumber) {
            flush(CURRENCY_WORDS.has(tok));
        }
    }

    if (inNumber) flush(false);
    const chosen = currencyBest > 0 ? currencyBest : fallbackBest;
    return Math.round(chosen * 100) / 100;
};

// Helper: Built-in Zero-Cost Amharic + English Smart Parser (works offline with $0 API keys!)
const parseWithLocalRules = (rawText = '') => {
    const text = String(rawText || '').trim();
    const lower = text.toLowerCase();
    const todayIso = new Date().toISOString().split('T')[0];

    // 1. Extract exact numeric or compound Amharic/English spoken amount
    const amount = parseSpokenAmount(text);

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
        text.includes('ድድር') ||
        text.includes('ያለበት') ||
        text.includes('ያለባት') ||
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

// Track models that hit 429 daily quota so we skip them instantly instead of wasting seconds retrying
const modelCooldownUntil = new Map();

// Helper: Call Gemini REST API
// - Audio listening uses thinkingBudget: 256 & temperature: 0.0 for sharp Amharic phoneme accuracy
// - Text-only parsing uses thinkingBudget: 0 for instant response
const callGemini = async (apiKey, parts, { isAudio = false } = {}) => {
    const models = [
        'gemini-2.5-flash',
        'gemini-3.5-flash',
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-flash-latest',
    ];
    let lastError = null;

    for (const model of models) {
        const cooldownEnd = modelCooldownUntil.get(model) || 0;
        if (Date.now() < cooldownEnd) continue;

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
            const generationConfig = {
                temperature: isAudio ? 0.0 : 0.1,
                maxOutputTokens: isAudio ? 550 : 350,
                responseMimeType: 'application/json',
                ...(model.startsWith('gemini-2.5')
                    ? { thinkingConfig: { thinkingBudget: isAudio ? 256 : 0 } }
                    : {}),
            };

            const response = await axios.post(
                url,
                {
                    contents: [{ parts }],
                    generationConfig,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': apiKey,
                    },
                    timeout: isAudio ? 18000 : 9000,
                }
            );

            const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const parsed = extractJsonObject(text);
            if (parsed) return { parsed, model };
        } catch (err) {
            lastError = err;
            const status = err.response?.status;
            if (status === 429) {
                // Cool down rate-limited model for 30 minutes so subsequent calls are instant
                modelCooldownUntil.set(model, Date.now() + 30 * 60 * 1000);
            }
            console.warn(`[AI] Gemini model ${model} failed:`, err.response?.data?.error?.message || err.message);
        }
    }

    throw lastError || new Error('Gemini API call failed');
};

// Helper: Official Addis AI Ethiopian Amharic Speech-to-Text
// Tries Addis Scribe (standard highest-accuracy Amharic -> turbo fast -> v2/stt fallback)
const transcribeWithAddisAi = async (apiKey, audioBase64, rawMimeType = 'audio/wav') => {
    const cleanMime = String(rawMimeType || 'audio/wav').split(';')[0].trim();
    const buffer = Buffer.from(audioBase64, 'base64');
    const ext = cleanMime.includes('wav') ? 'wav' : cleanMime.includes('mp4') ? 'm4a' : 'webm';
    const blob = new Blob([buffer], { type: cleanMime });

    // 1. Try Addis Scribe turbo (64ms compute!) first, then standard fallback
    for (const backend of ['turbo', 'standard']) {
        try {
            const scribeForm = new global.FormData();
            scribeForm.append('audio', blob, `voice.${ext}`);
            const reqId = `shop-${Date.now()}`;
            const res = await fetch(
                `https://api.addisassistant.com/api/v1/scribe/transcribe?backend=${backend}&request_id=${reqId}`,
                {
                    method: 'POST',
                    headers: { 'x-api-key': apiKey },
                    body: scribeForm,
                }
            );
            if (res.ok) {
                const data = await res.json();
                const text =
                    data?.data?.text ||
                    data?.text ||
                    data?.transcript ||
                    data?.transcription ||
                    data?.data?.transcription ||
                    '';
                if (text && text.trim()) return text.trim();
            } else {
                console.warn(`[AI] Addis Scribe (${backend}) HTTP ${res.status}`);
            }
        } catch (err) {
            console.warn(`[AI] Addis Scribe (${backend}) failed:`, err.message);
        }
    }

    // 2. Fallback to Addis AI Standard STT v2
    const sttForm = new global.FormData();
    sttForm.append('audio', blob, `voice.${ext}`);
    sttForm.append('request_data', JSON.stringify({ language_code: 'am' }));

    const res2 = await fetch('https://api.addisassistant.com/api/v2/stt', {
        method: 'POST',
        headers: { 'x-api-key': apiKey },
        body: sttForm,
    });

    if (!res2.ok) {
        throw new Error(`Addis AI HTTP ${res2.status}`);
    }
    const data2 = await res2.json();
    return (
        data2?.text ||
        data2?.transcript ||
        data2?.transcription ||
        data2?.data?.text ||
        data2?.data?.response_text ||
        ''
    ).trim();
};

const buildStructuredPrompt = () => {
    const todayIso = new Date().toISOString().split('T')[0];
    return `You are a native Ethiopian Amharic linguist AND a simple Ethiopian shopkeeper bookkeeping assistant.

CRITICAL ACCURACY RULES FOR AMHARIC AUDIO & TEXT:
1. Listen to EVERY SINGLE WORD and syllable of the Amharic speech carefully. Do NOT guess random nonsense words.
2. Recognize real Ethiopian names accurately (for example: ሃምዛ / Hamza, መሀመድ / Muhammed, ታሂር / Tahir, አበበ / Abebe, ከበደ / Kebede, አህመድ / Ahmed, አሊ / Ali, ፋጡማ / Fatuma, አልማዝ / Almaz, ዳዊት / Dawit, ዮናስ / Yonas, ብርሃኑ / Birhanu, ሳራ / Sara, ሄለን / Helen, ገብሬ / Gebre). Never distort "ሃምዛ (Hamza)" into "Lamza" or "ብድር (credit)" into "ድድር".
3. Recognize Ethiopian shop vocabulary and numbers accurately:
   - Currency: ብር (Birr / ETB). Numbers: አስር=10, ሃያ=20, ሰላሳ=30, አርባ=40, ሀምሳ=50, መቶ=100, ሁለት መቶ=200, አምስት መቶ=500, ሺህ=1000.
   - Verbs: ሰጥቼዋለሁ / ሰጠሁት (I gave him), ወሰደ / ወሰደች (he/she took), በብድር (on credit), ያለበት / አለበት (he owes), ከፈልኩ (I paid), ገዛሁ (I bought), አስገባሁ (I deposited/added).
   - Categories: ኪራይ (Shop Rent), ፌስታል/ማሸጊያ (Packaging & Bags), መብራት/ውሃ/ኢንተርኔት (Electricity & Water), ታክሲ/ባጃጅ/ነዳጅ/ትራንስፖርት (Transport & Delivery), ደመወዝ/ሰራተኛ (Staff & Salary), ማስታወቂያ (Marketing & Ads).
   - Payment methods: ቴሌብር (Telebirr), ሲቢኢ ብር (CBEBirr), ባንክ (Bank Transfer), ካሽ/በእጅ (Cash).
4. Write the EXACT word-for-word Amharic Ge'ez script in "originalText" (if spoken in Amharic) and a crystal-clear, faithful word-for-word English translation in "englishTranslation".
5. Also write a clean 1-sentence confirmation in natural Amharic in "amharicSummary".

Return ONLY valid JSON with these exact keys:
{
  "originalText": "Exact word-for-word Amharic Ge'ez transcript (or English if spoken in English)",
  "englishTranslation": "Exact, natural word-for-word English translation of everything spoken",
  "amharicSummary": "Clear 1-sentence confirmation in natural Amharic",
  "actionType": "expense" | "debt_receivable" | "debt_payable" | "capital_inflow",
  "amount": number (in ETB, 0 if not mentioned),
  "reason": "Short clear English description (e.g. Shop Rent, Credit to Hamza, 200 Delivery Bags)",
  "categoryName": "Shop Rent" | "Packaging & Bags" | "Electricity & Water" | "Transport & Delivery" | "Staff & Salary" | "Marketing & Ads" | "General Overhead",
  "paymentMethod": "Cash" | "Telebirr" | "CBEBirr" | "Bank Transfer" | "Other",
  "personName": "Cleanly spelled person name if ANY person is mentioned (e.g. Hamza, Abebe), else empty string",
  "phone": "Phone number if mentioned, else empty string",
  "date": "YYYY-MM-DD (default ${todayIso}; adjust if 'ትናንት/yesterday' was said)",
  "notes": "Any extra details from the voice note"
}

Action Classification Rules:
- If someone took credit, borrowed money, or owes the shop ("ብድር ወሰደ", "ያለበት", "አበደርኩ", "owes me") -> actionType = "debt_receivable".
- If the shop owes a supplier or borrowed from someone ("ለአቅራቢ እዳ", "ተበደርኩ", "I owe") -> actionType = "debt_payable".
- If the merchant added cash/capital into the shop ("ካፒታል አስገባሁ", "deposited cash") -> actionType = "capital_inflow".
- If the merchant paid a person, worker, rent, or bought supplies ("ከፈልኩ", "ሰጥቼዋለሁ", "ገዛሁ", "paid") -> actionType = "expense" (and still fill "personName" if a person was named, so the merchant can easily switch to Customer Debt in 1 tap if it was a loan!).`;
};

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
    const { transcript = '', audioBase64 = '', audioMimeType = 'audio/wav' } = req.body;

    const cleanMime = String(audioMimeType || 'audio/wav').split(';')[0].trim() || 'audio/wav';
    let workingTranscript = String(transcript || '').trim();
    let addisUsed = false;

    const todayIso = new Date().toISOString().split('T')[0];
    const normalizePhraseKey = (text) =>
        `voice::${todayIso}::${String(text || '').trim().toLowerCase().replace(/\s+/g, ' ')}`;

    // Instant <5ms RAM cache hit for repeated typed/spoken phrases (before any DB or AI call!)
    if (workingTranscript && !audioBase64) {
        const cachedPhrase = aiPhraseCache.get(normalizePhraseKey(workingTranscript));
        if (cachedPhrase) {
            res.setHeader('X-Cache', 'HIT');
            return res.json({
                ...cachedPhrase,
                cached: true,
            });
        }
    }

    const { geminiApiKey, addisAiApiKey } = await getAiKeys();

    // Step 1: If audio provided & Addis AI key is configured, transcribe Amharic with Addis Scribe first
    if (audioBase64 && addisAiApiKey) {
        try {
            const addisText = await transcribeWithAddisAi(addisAiApiKey, audioBase64, cleanMime);
            if (addisText) {
                workingTranscript = addisText.trim();
                addisUsed = true;
            }
        } catch (err) {
            console.warn('[AI] Addis AI transcription failed, falling back to Gemini audio:', err.message);
        }
    }

    // Fast Cache Check after Addis AI Scribe transcription (<2ms instant response!)
    if (workingTranscript && addisUsed) {
        const cachedPhrase = aiPhraseCache.get(normalizePhraseKey(workingTranscript));
        if (cachedPhrase) {
            res.setHeader('X-Cache', 'HIT');
            return res.json({
                ...cachedPhrase,
                cached: true,
            });
        }
    }

    // Step 2: Fast Hybrid Pipeline!
    // - If Addis Scribe already heard the audio, send ONLY the clean Amharic text to Gemini (<1s!)
    // - If Addis AI is unavailable/not configured, send the normalized WAV audio directly to Gemini as backup!
    if (geminiApiKey) {
        try {
            const parts = [{ text: buildStructuredPrompt() }];
            const sendingAudio = Boolean(audioBase64 && !addisUsed);

            const preVerifiedAmount = workingTranscript ? parseSpokenAmount(workingTranscript) : 0;
            const amountAnchorNote = preVerifiedAmount > 0
                ? ` MATHEMATICALLY VERIFIED EXACT AMOUNT FROM AMHARIC NUMBERS: ${preVerifiedAmount} (Note: ሰላሳ=30, አርባ=40, ሀምሳ=50, ስልሳ=60, ሰባ=70, ሰማንያ=80, ዘጠና=90. You MUST use ${preVerifiedAmount} in "amount" and in your English translation!).`
                : '';

            if (addisUsed && workingTranscript) {
                parts.push({
                    text: `Native Ethiopian Amharic ASR (Addis AI Scribe) heard: "${workingTranscript}".${amountAnchorNote} Fix any minor Amharic spacing or Ethiopian name homophone (e.g. ሃምሳ->ሃምዛ if it's a person's name, ለሱ ኪራይ->ለሱቅ ኪራይ), write exact Amharic Ge'ez + faithful English translation + structured JSON.`,
                });
            } else if (sendingAudio) {
                parts.push({
                    inline_data: {
                        mime_type: cleanMime,
                        data: audioBase64,
                    },
                });
                parts.push({
                    text: 'Listen VERY carefully syllable by syllable to this Ethiopian Amharic/English audio. Remember: ሰላሳ=30, አርባ=40, ሀምሳ=50, ስልሳ=60, ሰባ=70, ሰማንያ=80, ዘጠና=90. Write the exact word-for-word Amharic Ge\'ez in originalText, exact English translation in englishTranslation, and return the structured JSON.',
                });
            } else if (workingTranscript) {
                parts.push({ text: `Merchant typed message: "${workingTranscript}".${amountAnchorNote}` });
            } else {
                res.status(400);
                throw new Error('Please speak or type a message first.');
            }

            const { parsed, model } = await callGemini(geminiApiKey, parts, { isAudio: sendingAudio });
            // Always prioritize our exact deterministic Amharic/English number parser over LLM guesswork!
            const exactParsedAmount = parseSpokenAmount(workingTranscript || parsed.originalText || '');
            const geminiAmount = Number(parsed.amount) || 0;
            const finalAmount = exactParsedAmount > 0 ? exactParsedAmount : geminiAmount;

            const resultPayload = {
                ...parsed,
                amount: finalAmount,
                originalText: parsed.originalText || workingTranscript,
                amharicSummary: parsed.amharicSummary || '',
                engineUsed: addisUsed ? `addis_scribe + ${model}` : model,
            };

            // Cache parsed phrase for 12 hours so repeated shopkeeper phrases respond instantly
            const cacheSourceText = workingTranscript || resultPayload.originalText;
            if (cacheSourceText) {
                aiPhraseCache.set(normalizePhraseKey(cacheSourceText), resultPayload, 12 * 60 * 60 * 1000);
            }

            res.setHeader('X-Cache', 'MISS');
            return res.json(resultPayload);
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
    if (addisUsed) localResult.engineUsed = 'addis_scribe + builtin_smart_parser';
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

// @desc    Fast Amharic & English Voice Dictation for any description/note input field
// @route   POST /api/ai/transcribe-text
// @access  Private/Admin
const transcribeVoiceText = asyncHandler(async (req, res) => {
    const { audioBase64 = '', audioMimeType = 'audio/wav', outputLanguage = 'am', fieldHint = '' } = req.body;
    if (!audioBase64) {
        res.status(400);
        throw new Error('No audio recorded. Please tap the mic and speak.');
    }

    const { geminiApiKey, addisAiApiKey } = await getAiKeys();
    const cleanMime = String(audioMimeType || 'audio/wav').split(';')[0].trim() || 'audio/wav';
    let addisText = '';

    // 1. Optional Addis AI Scribe first for crystal-clear Amharic speech recognition
    if (addisAiApiKey) {
        try {
            addisText = await transcribeWithAddisAi(addisAiApiKey, audioBase64, cleanMime);
        } catch (err) {
            console.warn('[AI Dictate] Addis AI failed, falling back to Gemini:', err.message);
        }
    }

    // 2. Gemini 2.5 Flash (audio-precision mode) hears the normalized WAV AND cross-checks Addis AI's native Amharic transcript!
    if (geminiApiKey) {
        try {
            const prompt = `You are a native Ethiopian Amharic & English speech-to-text linguist for an Ethiopian shopkeeper.
Listen carefully syllable-by-syllable to EVERY spoken word${fieldHint ? ` (for shop field: "${fieldHint}")` : ''}.
CRITICAL RULES:
- Recognize real Ethiopian names (ሃምዛ/Hamza, አበበ/Abebe, መሀመድ/Muhammed, ታሂር/Tahir, ከበደ/Kebede, አህመድ/Ahmed, አሊ/Ali, ፋጡማ/Fatuma, ዳዊት/Dawit, ሳራ/Sara) and shop vocabulary (ብር/Birr, ኪራይ/rent, ብድር/credit, ካፒታል/capital, ቴሌብር/Telebirr, ካሽ/cash, ፌስታል/bags, ጭነት/delivery) with 100% accuracy.
- Never invent words that were not spoken. Keep it faithful, clean, and ready to save in a shop ledger.
Return ONLY valid JSON:
{
  "amharic": "Exact, clean Amharic Ge'ez script version of what was said",
  "english": "Exact, natural English translation of what was said"
}`;

            const sendingAudio = Boolean(!addisText);
            const parts = [{ text: prompt }];
            if (addisText) {
                parts.push({
                    text: `Native Ethiopian Amharic ASR (Addis AI Scribe) heard: "${addisText}". Clean up any minor spacing or Ethiopian name homophone (e.g. ሃምሳ->ሃምዛ when clearly a person name) and output accurate Amharic Ge'ez and natural English JSON.`,
                });
            } else {
                parts.push({ inline_data: { mime_type: cleanMime, data: audioBase64 } });
                parts.push({
                    text: 'Transcribe every single spoken Amharic/English word from this audio carefully into clean Amharic Ge\'ez and clean English JSON.',
                });
            }

            const { parsed, model } = await callGemini(geminiApiKey, parts, { isAudio: sendingAudio });
            const amharicText = (parsed.amharic || addisText || '').trim();
            const englishText = (parsed.english || parsed.amharic || addisText || '').trim();
            const primaryText = outputLanguage === 'am' ? (amharicText || englishText) : (englishText || amharicText);

            return res.json({
                text: primaryText,
                amharic: amharicText,
                english: englishText,
                engineUsed: addisText ? `addis_scribe + ${model}` : model,
            });
        } catch (err) {
            console.warn('[AI Dictate] Gemini audio failed, checking Addis AI backup:', err.message);
        }
    }

    if (addisText) {
        return res.json({
            text: addisText,
            amharic: addisText,
            english: addisText,
            engineUsed: 'addis_scribe',
        });
    }

    res.status(400);
    throw new Error('Add a free Google Gemini API key in Settings to use voice dictation.');
});

module.exports = {
    getAiStatus,
    parseVoiceCommand,
    scanReceiptImage,
    commitStructuredAction,
    transcribeVoiceText,
};
