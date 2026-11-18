import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Mic,
    Square,
    Sparkles,
    Camera,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Calendar,
    Settings,
    Loader2,
    Save,
    RotateCcw,
} from 'lucide-react';
import { aiService } from '../../../services/api';
import { useAdminLanguage } from '../../../context/AdminLanguageContext';
import { toEthiopianDate } from '../../../utils/ethiopianDate';
import './VoiceAssistant.css';

const QUICK_EXAMPLES = [
    'ዛሬ ለሱቅ ኪራይ 5000 ብር በቴሌብር ከፈልኩ',
    'አበበ 1200 ብር ብድር ወሰደ 0911223344',
    'ለፌስታል ማሸጊያ 350 ብር በካሽ ከፈልኩ',
    'Paid 450 birr for taxi delivery in cash',
];

const EXPENSE_CATEGORIES = [
    'Shop Rent',
    'Packaging & Bags',
    'Electricity & Water',
    'Transport & Delivery',
    'Staff & Salary',
    'Marketing & Ads',
    'General Overhead',
];

const VoiceAssistant = () => {
    const { isAmharic } = useAdminLanguage();

    const [aiStatus, setAiStatus] = useState({
        builtinSmartParser: true,
        geminiEnabled: false,
        addisAiEnabled: false,
        activeMode: 'builtin_free',
    });

    const [spokenLang, setSpokenLang] = useState('am-ET');
    const [transcript, setTranscript] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isScanningReceipt, setIsScanningReceipt] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [receiptPreview, setReceiptPreview] = useState(null);
    const [parsedData, setParsedData] = useState(null);
    const [savedFeedback, setSavedFeedback] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    // Audio & Speech Refs
    const recognitionRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const liveTranscriptRef = useRef('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        loadStatus();
        return () => {
            stopRecordingCleanup();
        };
    }, []);

    const loadStatus = async () => {
        try {
            const { data } = await aiService.getStatus();
            setAiStatus(data);
        } catch (err) {
            console.error('Failed to check AI status', err);
        }
    };

    const stopRecordingCleanup = () => {
        try {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
        } catch {
            // ignore cleanup errors
        }
    };

    const blobToBase64 = (blob) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const res = String(reader.result || '');
                resolve(res.includes(',') ? res.split(',')[1] : res);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

    const handleToggleRecording = async () => {
        setErrorMsg('');
        setSavedFeedback(null);

        if (isRecording) {
            // Stop recording -> triggers mediaRecorder.onstop to analyze!
            setIsRecording(false);
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch {}
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            } else if (liveTranscriptRef.current.trim()) {
                analyzeInput({ transcript: liveTranscriptRef.current.trim() });
            }
            return;
        }

        // Start recording!
        liveTranscriptRef.current = '';
        setTranscript('');
        setParsedData(null);
        audioChunksRef.current = [];

        // 1. Start Browser Web Speech API (instant free live preview for Amharic & English)
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            try {
                const recognition = new SpeechRecognition();
                recognition.lang = spokenLang;
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.onresult = (event) => {
                    let combined = '';
                    for (let i = 0; i < event.results.length; i++) {
                        combined += event.results[i][0].transcript + ' ';
                    }
                    liveTranscriptRef.current = combined.trim();
                    setTranscript(combined.trim());
                };
                recognition.onerror = () => {
                    // Silent fallback to audio blob if speech API unavailable
                };
                recognition.start();
                recognitionRef.current = recognition;
            } catch {
                // Continue with MediaRecorder
            }
        }

        // 2. Start MediaRecorder so Addis AI / Gemini Audio also get raw audio when enabled
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(stream);
                mediaRecorderRef.current = recorder;

                recorder.ondataavailable = (e) => {
                    if (e.data && e.data.size > 0) {
                        audioChunksRef.current.push(e.data);
                    }
                };

                recorder.onstop = async () => {
                    stream.getTracks().forEach((track) => track.stop());
                    const mimeType = recorder.mimeType || 'audio/webm';
                    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                    const finalTranscript = liveTranscriptRef.current.trim();

                    let audioBase64 = '';
                    if ((aiStatus.geminiEnabled || aiStatus.addisAiEnabled) && audioBlob.size > 0) {
                        try {
                            audioBase64 = await blobToBase64(audioBlob);
                        } catch {}
                    }

                    if (finalTranscript || audioBase64) {
                        await analyzeInput({
                            transcript: finalTranscript,
                            audioBase64,
                            audioMimeType: mimeType,
                        });
                    } else {
                        setErrorMsg(
                            isAmharic
                                ? 'ድምፅዎ አልተሰማም። እባክዎ እንደገና ይሞክሩ ወይም ከታች ይጻፉ።'
                                : 'No speech detected. Try speaking closer to the mic or type your message below.'
                        );
                    }
                };

                recorder.start();
                setIsRecording(true);
            } else if (SpeechRecognition) {
                setIsRecording(true);
            } else {
                setErrorMsg(
                    isAmharic
                        ? 'ይህ ብራውዘር ማይክሮፎን አይደግፍም። እባክዎ Chrome ይጠቀሙ ወይም ከታች ይጻፉ።'
                        : 'Microphone recording is not supported in this browser. Use Chrome or type your message below.'
                );
            }
        } catch (err) {
            setErrorMsg(
                isAmharic
                    ? 'የማይክሮፎን ፍቃድ ተከልክሏል። እባክዎ ማይክሮፎን ይፍቀዱ ወይም ከታች ይጻፉ።'
                    : 'Microphone permission was denied. Allow microphone access or type your message below.'
            );
        }
    };

    const analyzeInput = async ({ transcript: textToParse, audioBase64 = '', audioMimeType = 'audio/webm' }) => {
        setErrorMsg('');
        setSavedFeedback(null);
        setIsAnalyzing(true);
        try {
            const { data } = await aiService.parseVoice({
                transcript: textToParse,
                audioBase64,
                audioMimeType,
            });
            setParsedData({
                originalText: data.originalText || textToParse,
                englishTranslation: data.englishTranslation || '',
                actionType: data.actionType || 'expense',
                amount: data.amount ? String(data.amount) : '',
                reason: data.reason || '',
                categoryName: data.categoryName || 'General Overhead',
                paymentMethod: data.paymentMethod || 'Cash',
                personName: data.personName || '',
                phone: data.phone || '',
                date: data.date || new Date().toISOString().split('T')[0],
                notes: data.notes || '',
                syncCapital: true,
                engineUsed: data.engineUsed || 'builtin_smart_parser',
            });
        } catch (err) {
            setErrorMsg(err.response?.data?.message || err.message || 'Could not understand the message.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleReceiptFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setErrorMsg('');
        setSavedFeedback(null);

        const reader = new FileReader();
        reader.onloadend = async () => {
            const dataUrl = String(reader.result || '');
            setReceiptPreview(dataUrl);
            setIsScanningReceipt(true);
            try {
                const { data } = await aiService.scanReceipt({
                    imageBase64: dataUrl,
                    mimeType: file.type || 'image/jpeg',
                });
                setParsedData({
                    originalText: data.originalText || 'Receipt Photo Scanned',
                    englishTranslation: data.englishTranslation || 'Expense read from receipt photo',
                    actionType: 'expense',
                    amount: data.amount ? String(data.amount) : '',
                    reason: data.reason || 'Receipt Expense',
                    categoryName: data.categoryName || 'General Overhead',
                    paymentMethod: data.paymentMethod || 'Cash',
                    personName: '',
                    phone: '',
                    date: data.date || new Date().toISOString().split('T')[0],
                    notes: data.notes || '',
                    syncCapital: true,
                    engineUsed: data.engineUsed || 'gemini_vision',
                });
            } catch (err) {
                setErrorMsg(err.response?.data?.message || err.message || 'Receipt scanning failed.');
            } finally {
                setIsScanningReceipt(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleConfirmSave = async (e) => {
        e.preventDefault();
        if (!parsedData) return;
        setErrorMsg('');
        setIsSaving(true);
        try {
            const { data } = await aiService.commitAction({
                ...parsedData,
                amount: Number(parsedData.amount),
            });
            setSavedFeedback(data);
            setParsedData(null);
            setTranscript('');
            setReceiptPreview(null);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || err.message || 'Failed to save record.');
        } finally {
            setIsSaving(false);
        }
    };

    const engineLabel =
        aiStatus.activeMode === 'addis_plus_gemini'
            ? isAmharic ? 'Addis AI + Gemini Pro ንቁ ነው' : 'Addis AI + Gemini Active'
            : aiStatus.activeMode === 'gemini_free'
                ? isAmharic ? 'Gemini Free AI ንቁ ነው ($0)' : 'Gemini Free AI Active ($0)'
                : isAmharic ? 'ነፃ አብሮ የተሰራ አማርኛ አንባቢ ($0)' : 'Free Built-In Amharic Reader ($0)';

    return (
        <div className="voice-page">
            {/* 1. HERO BANNER */}
            <div className="voice-hero">
                <div className="voice-hero-left">
                    <div className="voice-hero-badge">
                        <Mic size={26} />
                    </div>
                    <div>
                        <h1 className="voice-hero-title">
                            {isAmharic ? 'በድምፅ እና በደረሰኝ ፎቶ መመዝገቢያ' : 'Amharic Voice & Receipt Helper'}
                        </h1>
                        <p className="voice-hero-sub">
                            {isAmharic
                                ? 'በአማርኛ ይናገሩ ወይም የደረሰኝ ፎቶ ያንሱ — ወደ ንጹህ መረጃ ተቀይሮ ወዲያውኑ ወደ ሱቅዎ ይቀመጣል!'
                                : 'Just speak in Amharic or snap a receipt — turned into clean English data and saved to your shop in 1 tap!'}
                        </p>
                    </div>
                </div>
                <span className="voice-engine-pill">
                    <Sparkles size={14} />
                    <span>{engineLabel}</span>
                </span>
            </div>

            {/* OPTIONAL FREE SETUP TIP (when Gemini key is not yet added) */}
            {!aiStatus.geminiEnabled && (
                <div
                    style={{
                        background: 'var(--admin-card-bg, #ffffff)',
                        border: '1px solid rgba(6, 182, 212, 0.35)',
                        borderRadius: '16px',
                        padding: '0.95rem 1.2rem',
                        marginBottom: '1.3rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.8rem',
                    }}
                >
                    <div style={{ fontSize: '0.86rem', color: 'var(--admin-text, #1e293b)', fontWeight: 600 }}>
                        💡{' '}
                        {isAmharic
                            ? 'አሁን ነፃ አብሮ የተሰራው አንባቢ እየሰራ ነው። የደረሰኝ ፎቶ ለማንበብ እና የላቀ AI ለማግኘት ነፃ Gemini Key (ወይም Addis AI Key) በቅንብሮች ውስጥ ያስገቡ።'
                            : 'Free built-in Amharic voice reader is ready now! To also unlock AI Receipt Photo Scanning & Addis AI, paste your free Gemini key in Settings.'}
                    </div>
                    <Link
                        to="/admin/settings"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            borderRadius: '10px',
                            background: 'rgba(6, 182, 212, 0.12)',
                            color: '#0284c7',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            textDecoration: 'none',
                        }}
                    >
                        <Settings size={14} />
                        <span>{isAmharic ? 'AI ቁልፍ አስገባ' : 'Add Free AI Key'}</span>
                    </Link>
                </div>
            )}

            {/* SUCCESS FEEDBACK */}
            {savedFeedback && (
                <div className="voice-success-banner">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                        <CheckCircle2 size={24} />
                        <span>{isAmharic ? savedFeedback.messageAm : savedFeedback.messageEn}</span>
                    </div>
                    <Link
                        to={savedFeedback.redirectTo || '/admin/expenses'}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 14px',
                            borderRadius: '10px',
                            background: '#10b981',
                            color: '#ffffff',
                            textDecoration: 'none',
                            fontSize: '0.84rem',
                            fontWeight: 700,
                        }}
                    >
                        <span>{isAmharic ? 'የተመዘገበውን እይ' : 'View Saved Record'}</span>
                        <ArrowRight size={15} />
                    </Link>
                </div>
            )}

            {/* ERROR BANNER */}
            {errorMsg && (
                <div className="voice-error-banner">
                    <AlertCircle size={18} />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* 2. CONFIRMATION & SAVE CARD (Appears right away when Voice or Receipt is analyzed!) */}
            {parsedData && (
                <div className="voice-confirm-card">
                    <div className="voice-card-title">
                        <h2>
                            <Sparkles size={20} color="#06b6d4" />
                            <span>{isAmharic ? 'መረጃውን ያረጋግጡና ያስቀምጡ' : 'Check & Save To Your Shop'}</span>
                        </h2>
                        <button
                            type="button"
                            onClick={() => setParsedData(null)}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                background: 'none',
                                border: 'none',
                                color: 'var(--admin-subtext, #64748b)',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                            }}
                        >
                            <RotateCcw size={14} />
                            <span>{isAmharic ? 'እንደገና ጀምር' : 'Start Over'}</span>
                        </button>
                    </div>

                    {/* Amharic -> English Translation Display */}
                    <div className="voice-translation-box">
                        {parsedData.originalText && (
                            <div style={{ fontSize: '0.85rem', color: 'var(--admin-subtext, #475569)', marginBottom: '4px' }}>
                                <strong>{isAmharic ? 'የተናገሩት:' : 'Heard:'}</strong> "{parsedData.originalText}"
                            </div>
                        )}
                        <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--admin-text, #0f172a)' }}>
                            ✨ {parsedData.englishTranslation}
                        </div>
                    </div>

                    {/* Choose Where To Save */}
                    <div className="voice-action-tabs">
                        {[
                            { key: 'expense', en: 'Shop Expense', am: 'የሱቅ ወጪ' },
                            { key: 'debt_receivable', en: 'Customer Owes Me', am: 'የደንበኛ ብድር' },
                            { key: 'debt_payable', en: 'I Owe Supplier', am: 'የአቅራቢ እዳ' },
                            { key: 'capital_inflow', en: 'Add Shop Cash', am: 'ጥሬ ገንዘብ ጨምር' },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setParsedData({ ...parsedData, actionType: tab.key })}
                                className={`voice-action-tab ${parsedData.actionType === tab.key ? 'active' : ''}`}
                            >
                                {isAmharic ? tab.am : tab.en}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleConfirmSave}>
                        <div className="voice-form-grid">
                            <div>
                                <label className="mezgeb-field-label">
                                    {isAmharic ? 'መጠን በብር (ETB) *' : 'Amount (ETB) *'}
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    step="any"
                                    value={parsedData.amount}
                                    onChange={(e) => setParsedData({ ...parsedData, amount: e.target.value })}
                                    className="mezgeb-input"
                                    style={{ fontSize: '1.15rem', fontWeight: 800 }}
                                />
                            </div>

                            <div>
                                <label className="mezgeb-field-label">
                                    {isAmharic ? 'ምክንያት / መግለጫ *' : 'Reason / Description *'}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={parsedData.reason}
                                    onChange={(e) => setParsedData({ ...parsedData, reason: e.target.value })}
                                    className="mezgeb-input"
                                />
                            </div>

                            {parsedData.actionType === 'expense' && (
                                <div>
                                    <label className="mezgeb-field-label">
                                        {isAmharic ? 'የወጪ ምድብ' : 'Category'}
                                    </label>
                                    <select
                                        value={parsedData.categoryName}
                                        onChange={(e) => setParsedData({ ...parsedData, categoryName: e.target.value })}
                                        className="mezgeb-input"
                                    >
                                        {EXPENSE_CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {(parsedData.actionType === 'debt_receivable' || parsedData.actionType === 'debt_payable') && (
                                <>
                                    <div>
                                        <label className="mezgeb-field-label">
                                            {isAmharic ? 'የሰው / የአቅራቢ ስም *' : 'Person / Supplier Name *'}
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={parsedData.personName}
                                            onChange={(e) => setParsedData({ ...parsedData, personName: e.target.value })}
                                            className="mezgeb-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="mezgeb-field-label">
                                            {isAmharic ? 'ስልክ ቁጥር' : 'Phone Number'}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="09..."
                                            value={parsedData.phone}
                                            onChange={(e) => setParsedData({ ...parsedData, phone: e.target.value })}
                                            className="mezgeb-input"
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="mezgeb-field-label">
                                    {isAmharic ? 'የክፍያ ዘዴ' : 'Payment Method'}
                                </label>
                                <select
                                    value={parsedData.paymentMethod}
                                    onChange={(e) => setParsedData({ ...parsedData, paymentMethod: e.target.value })}
                                    className="mezgeb-input"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Telebirr">Telebirr</option>
                                    <option value="CBEBirr">CBEBirr</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="mezgeb-field-label">
                                    {isAmharic ? 'ቀን' : 'Date'}
                                </label>
                                <input
                                    type="date"
                                    value={parsedData.date}
                                    onChange={(e) => setParsedData({ ...parsedData, date: e.target.value })}
                                    className="mezgeb-input"
                                />
                                <div style={{ fontSize: '0.76rem', color: '#06b6d4', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Calendar size={12} />
                                    <span>{toEthiopianDate(parsedData.date, true)}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button type="submit" disabled={isSaving} className="voice-save-btn">
                                {isSaving ? <Loader2 size={18} className="spinning-refresh-icon" /> : <Save size={18} />}
                                <span>
                                    {isSaving
                                        ? isAmharic ? 'በማስቀመጥ ላይ...' : 'Saving...'
                                        : isAmharic ? 'አረጋግጥና ወደ ሱቅ አስቀምጥ' : 'Confirm & Save To Shop'}
                                </span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* 3. TWO-COLUMN INPUT WORKSPACE (VOICE + RECEIPT PHOTO) */}
            <div className="voice-grid">
                {/* LEFT: AMHARIC VOICE & TEXT INPUT */}
                <div className="voice-card">
                    <div className="voice-card-title">
                        <h2>
                            <Mic size={19} color="#06b6d4" />
                            <span>{isAmharic ? '1. በድምፅ ይናገሩ (አማርኛ / English)' : '1. Speak In Amharic or English'}</span>
                        </h2>
                        <div className="voice-lang-switch">
                            <button
                                type="button"
                                onClick={() => setSpokenLang('am-ET')}
                                className={`voice-lang-btn ${spokenLang === 'am-ET' ? 'active' : ''}`}
                            >
                                አማርኛ
                            </button>
                            <button
                                type="button"
                                onClick={() => setSpokenLang('en-US')}
                                className={`voice-lang-btn ${spokenLang === 'en-US' ? 'active' : ''}`}
                            >
                                English
                            </button>
                        </div>
                    </div>

                    <div className="voice-mic-zone">
                        <button
                            type="button"
                            onClick={handleToggleRecording}
                            className={`voice-mic-btn ${isRecording ? 'recording' : ''}`}
                            title={isRecording ? 'Stop Recording' : 'Tap to Speak'}
                        >
                            {isRecording ? <Square size={32} fill="#ffffff" /> : <Mic size={38} />}
                        </button>
                        <div className="voice-mic-status">
                            {isRecording
                                ? isAmharic ? 'እያዳመጥኩ ነው... ሲጨርሱ ይጫኑ' : 'Listening... Tap square to finish'
                                : isAmharic ? 'ለመናገር ማይክሮፎኑን ይጫኑ' : 'Tap microphone and speak naturally'}
                        </div>
                        <div className="voice-mic-hint">
                            {isAmharic
                                ? 'ለምሳሌ፡ "ዛሬ ለሱቅ ኪራይ 5000 ብር በቴሌብር ከፈልኩ"'
                                : 'Example: "ዛሬ ለፌስታል 300 ብር በካሽ ከፈልኩ" or "Abebe took 1200 birr credit"'}
                        </div>
                    </div>

                    <textarea
                        className="voice-textarea"
                        placeholder={
                            isAmharic
                                ? 'የተናገሩት እዚህ ይታያል (ወይም እዚህ መጻፍ ይችላሉ)...'
                                : 'Your spoken Amharic/English appears here (or you can type directly)...'
                        }
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                    />

                    {/* One-Tap Examples */}
                    <div className="voice-examples">
                        {QUICK_EXAMPLES.map((ex) => (
                            <button
                                key={ex}
                                type="button"
                                className="voice-example-chip"
                                onClick={() => {
                                    setTranscript(ex);
                                    analyzeInput({ transcript: ex });
                                }}
                            >
                                {ex}
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        disabled={!transcript.trim() || isAnalyzing}
                        onClick={() => analyzeInput({ transcript: transcript.trim() })}
                        className="voice-analyze-btn"
                    >
                        {isAnalyzing ? <Loader2 size={18} className="spinning-refresh-icon" /> : <Sparkles size={18} />}
                        <span>
                            {isAnalyzing
                                ? isAmharic ? 'በመተርጎም ላይ...' : 'Reading & Translating...'
                                : isAmharic ? 'ወደ መረጃ ቀይር (Analyze)' : 'Turn Into Shop Record'}
                        </span>
                    </button>
                </div>

                {/* RIGHT: RECEIPT PHOTO SCANNER */}
                <div className="voice-card">
                    <div className="voice-card-title">
                        <h2>
                            <Camera size={19} color="#10b981" />
                            <span>{isAmharic ? '2. የደረሰኝ ፎቶ አንብብ' : '2. Scan Paper Receipt'}</span>
                        </h2>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{ display: 'none' }}
                        onChange={handleReceiptFileChange}
                    />

                    <div
                        className="receipt-dropzone"
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    >
                        {receiptPreview ? (
                            <img src={receiptPreview} alt="Receipt Preview" className="receipt-preview-img" />
                        ) : (
                            <div
                                style={{
                                    width: '62px',
                                    height: '62px',
                                    borderRadius: '18px',
                                    background: 'rgba(16, 185, 129, 0.14)',
                                    color: '#10b981',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '0.9rem',
                                }}
                            >
                                <Camera size={30} />
                            </div>
                        )}

                        <div style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--admin-text, #0f172a)' }}>
                            {isScanningReceipt
                                ? isAmharic ? 'ደረሰኙን በማንበብ ላይ...' : 'Reading receipt photo...'
                                : isAmharic ? 'የደረሰኝ ፎቶ ለማንሳት ወይም ለመምረጥ ይጫኑ' : 'Tap to snap or upload a receipt photo'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--admin-subtext, #64748b)', marginTop: '0.35rem', maxWidth: '280px' }}>
                            {isAmharic
                                ? 'AI የደረሰኙን ብር፣ ቀን እና ምክንያት በራስ-ሰር ያነብልዎታል።'
                                : 'AI automatically reads the total ETB, date, and reason from the paper receipt.'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoiceAssistant;
