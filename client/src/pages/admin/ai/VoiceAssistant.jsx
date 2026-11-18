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
    ArrowUp,
    Calendar,
    Settings,
    Loader2,
    Save,
    RotateCcw,
} from 'lucide-react';
import { aiService } from '../../../services/api';
import { useAdminLanguage } from '../../../context/AdminLanguageContext';
import { toEthiopianDate } from '../../../utils/ethiopianDate';
import { convertBlobToCleanWavBase64 } from '../../../utils/audioWavEncoder';
import CoolSelect from '../../../components/ui/CoolSelect';
import './VoiceAssistant.css';

const QUICK_EXAMPLES = [
    'ዛሬ ለሱቅ ኪራይ 5000 ብር በቴሌብር ከፈልኩ',
    'አበበ 1200 ብር ብድር ወሰደ 0911223344',
    'ለሃምዛ መቶ ብር ሰጥቼዋለሁ',
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

    const [activeMode, setActiveMode] = useState('voice'); // 'voice' | 'receipt'
    const [spokenLang, setSpokenLang] = useState('am-ET');
    const [transcript, setTranscript] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [eqLevels, setEqLevels] = useState([10, 14, 18, 22, 18, 14, 10]);
    const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
    const [responseTimeSec, setResponseTimeSec] = useState(null);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isScanningReceipt, setIsScanningReceipt] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [receiptPreview, setReceiptPreview] = useState(null);
    const [parsedData, setParsedData] = useState(null);
    const [savedFeedback, setSavedFeedback] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    // Refs for audio recording + live equalizer
    const recognitionRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const liveTranscriptRef = useRef('');
    const timerRef = useRef(null);
    const analyserCtxRef = useRef(null);
    const rafRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        loadStatus();
        return () => {
            stopAllAudio();
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

    const stopVisualizer = () => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        if (analyserCtxRef.current) {
            analyserCtxRef.current.close().catch(() => {});
            analyserCtxRef.current = null;
        }
        setEqLevels([10, 14, 18, 22, 18, 14, 10]);
    };

    const stopAllAudio = () => {
        stopVisualizer();
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        try {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
        } catch {}
    };

    const startLiveVisualizer = (stream) => {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);
            analyserCtxRef.current = ctx;

            const freqData = new Uint8Array(analyser.frequencyBinCount);
            const tick = () => {
                analyser.getByteFrequencyData(freqData);
                const bins = [1, 2, 4, 6, 8, 11, 14];
                const levels = bins.map((idx) => {
                    const val = freqData[idx] || 0;
                    return Math.max(7, Math.min(34, Math.round((val / 255) * 34)));
                });
                setEqLevels(levels);
                rafRef.current = requestAnimationFrame(tick);
            };
            tick();
        } catch {}
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
        if (isAnalyzing) return;
        setErrorMsg('');
        setSavedFeedback(null);

        if (isRecording) {
            setIsRecording(false);
            stopVisualizer();
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch {}
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            } else if (liveTranscriptRef.current.trim()) {
                analyzeInput({ transcript: liveTranscriptRef.current.trim() });
            }
            return;
        }

        liveTranscriptRef.current = '';
        setTranscript('');
        setParsedData(null);
        setRecordingSeconds(0);
        setResponseTimeSec(null);
        if (recordedAudioUrl) {
            URL.revokeObjectURL(recordedAudioUrl);
            setRecordedAudioUrl(null);
        }
        audioChunksRef.current = [];

        const hasCloudAudioAi = Boolean(aiStatus.geminiEnabled || aiStatus.addisAiEnabled);

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!hasCloudAudioAi && SpeechRecognition) {
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
                recognition.onerror = () => {};
                recognition.start();
                recognitionRef.current = recognition;
            } catch {}
        }

        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        channelCount: 1,
                    },
                });
                startLiveVisualizer(stream);

                const recorder = new MediaRecorder(stream);
                mediaRecorderRef.current = recorder;

                recorder.ondataavailable = (e) => {
                    if (e.data && e.data.size > 0) {
                        audioChunksRef.current.push(e.data);
                    }
                };

                recorder.onstop = async () => {
                    stopVisualizer();
                    stream.getTracks().forEach((track) => track.stop());
                    const rawMime = (recorder.mimeType || 'audio/webm').split(';')[0].trim();
                    const audioBlob = new Blob(audioChunksRef.current, { type: rawMime });
                    const finalTranscript = liveTranscriptRef.current.trim();

                    if (audioBlob.size > 0) {
                        setRecordedAudioUrl(URL.createObjectURL(audioBlob));
                    }

                    let audioBase64 = '';
                    let audioMimeType = rawMime;

                    if (hasCloudAudioAi && audioBlob.size > 0) {
                        try {
                            const wav = await convertBlobToCleanWavBase64(audioBlob);
                            audioBase64 = wav.base64;
                            audioMimeType = wav.mimeType;
                        } catch {
                            try {
                                audioBase64 = await blobToBase64(audioBlob);
                                audioMimeType = rawMime;
                            } catch {}
                        }
                    }

                    if (audioBase64 || finalTranscript) {
                        await analyzeInput({
                            transcript: hasCloudAudioAi ? '' : finalTranscript,
                            audioBase64,
                            audioMimeType,
                        });
                    } else {
                        setErrorMsg(
                            isAmharic
                                ? 'ድምፅዎ አልተሰማም። እባክዎ እንደገና ይሞክሩ።'
                                : 'No speech detected. Try speaking closer to the mic.'
                        );
                    }
                };

                recorder.start();
                setIsRecording(true);
                timerRef.current = setInterval(() => {
                    setRecordingSeconds((s) => s + 1);
                }, 1000);
            } else if (SpeechRecognition) {
                setIsRecording(true);
            } else {
                setErrorMsg(
                    isAmharic
                        ? 'ይህ ብራውዘር ማይክሮፎን አይደግፍም።'
                        : 'Microphone is not supported in this browser.'
                );
            }
        } catch {
            setErrorMsg(
                isAmharic
                    ? 'የማይክሮፎን ፍቃድ ተከልክሏል።'
                    : 'Microphone permission was denied.'
            );
        }
    };

    const analyzeInput = async ({ transcript: textToParse, audioBase64 = '', audioMimeType = 'audio/wav' }) => {
        setErrorMsg('');
        setSavedFeedback(null);
        setIsAnalyzing(true);
        const t0 = performance.now();
        try {
            const { data } = await aiService.parseVoice({
                transcript: textToParse,
                audioBase64,
                audioMimeType,
            });
            setResponseTimeSec(((performance.now() - t0) / 1000).toFixed(1));
            const cleanAmharic = data.originalText || textToParse || '';
            if (cleanAmharic) setTranscript(cleanAmharic);
            setParsedData({
                originalText: cleanAmharic,
                englishTranslation: data.englishTranslation || '',
                amharicSummary: data.amharicSummary || '',
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
            const t0 = performance.now();
            try {
                const { data } = await aiService.scanReceipt({
                    imageBase64: dataUrl,
                    mimeType: file.type || 'image/jpeg',
                });
                setResponseTimeSec(((performance.now() - t0) / 1000).toFixed(1));
                setParsedData({
                    originalText: data.originalText || 'Receipt Photo',
                    englishTranslation: data.englishTranslation || 'Expense read from receipt',
                    amharicSummary: data.amharicSummary || '',
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

    const handleCommandSubmit = (e) => {
        e.preventDefault();
        if (!transcript.trim() || isAnalyzing) return;
        analyzeInput({ transcript: transcript.trim() });
    };

    const engineBadge =
        aiStatus.activeMode === 'addis_plus_gemini'
            ? 'Addis Scribe + Gemini'
            : aiStatus.activeMode === 'gemini_free'
                ? 'Gemini 2.5 Fast'
                : 'Built-In Free';

    return (
        <div className="vai-stage">
            {/* 1. MINIMAL TOP BAR */}
            <div className="vai-topbar">
                <div className="vai-heading-group">
                    <h1 className="vai-title">
                        <span>{isAmharic ? 'በድምፅ እና ደረሰኝ መመዝገቢያ' : 'Voice & Receipt AI'}</span>
                    </h1>
                    <div className="vai-status-dot">
                        <span className="vai-dot-pulse" />
                        <span>{engineBadge}</span>
                        {responseTimeSec && <span>• {responseTimeSec}s</span>}
                    </div>
                </div>

                {/* Clean Segmented Mode Switch */}
                <div className="vai-mode-switch">
                    <button
                        type="button"
                        onClick={() => setActiveMode('voice')}
                        className={`vai-mode-btn ${activeMode === 'voice' ? 'active' : ''}`}
                    >
                        <Mic size={15} />
                        <span>{isAmharic ? 'ድምፅ' : 'Voice'}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveMode('receipt')}
                        className={`vai-mode-btn ${activeMode === 'receipt' ? 'active' : ''}`}
                    >
                        <Camera size={15} />
                        <span>{isAmharic ? 'ደረሰኝ ፎቶ' : 'Receipt'}</span>
                    </button>
                </div>
            </div>

            {/* FEEDBACK TOASTS */}
            {savedFeedback && (
                <div className="vai-toast-ok">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={20} />
                        <span>{isAmharic ? savedFeedback.messageAm : savedFeedback.messageEn}</span>
                    </div>
                    <Link
                        to={savedFeedback.redirectTo || '/admin/expenses'}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            color: '#ffffff',
                            background: '#10b981',
                            padding: '6px 13px',
                            borderRadius: '999px',
                            fontSize: '0.8rem',
                            textDecoration: 'none',
                        }}
                    >
                        <span>{isAmharic ? 'እይ' : 'View'}</span>
                        <ArrowRight size={14} />
                    </Link>
                </div>
            )}

            {errorMsg && (
                <div className="vai-toast-err">
                    <AlertCircle size={17} />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* 2. MINIMAL FOCUSED STUDIO SURFACE */}
            <div className={`vai-studio-card ${isRecording ? 'is-recording' : ''} ${isAnalyzing || isScanningReceipt ? 'is-analyzing' : ''}`}>
                <div className="vai-studio-meta">
                    <div className="vai-mini-lang">
                        <button
                            type="button"
                            onClick={() => setSpokenLang('am-ET')}
                            className={spokenLang === 'am-ET' ? 'active' : ''}
                        >
                            አማርኛ
                        </button>
                        <button
                            type="button"
                            onClick={() => setSpokenLang('en-US')}
                            className={spokenLang === 'en-US' ? 'active' : ''}
                        >
                            EN
                        </button>
                    </div>
                    <Link to="/admin/settings" className="vai-key-link">
                        <Settings size={13} />
                        <span>{isAmharic ? 'AI ቁልፎች' : 'AI Keys'}</span>
                    </Link>
                </div>

                {activeMode === 'voice' ? (
                    <>
                        {/* LIVING VOICE ORB */}
                        <div className="vai-orb-container">
                            {!isRecording && !isAnalyzing && <div className="vai-orb-aura" />}
                            {isRecording && (
                                <>
                                    <div className="vai-sonar-ring" />
                                    <div className="vai-sonar-ring delay" />
                                </>
                            )}
                            {isAnalyzing && <div className="vai-orbit-ring" />}

                            <button
                                type="button"
                                onClick={handleToggleRecording}
                                disabled={isAnalyzing}
                                className={`vai-orb-btn ${isRecording ? 'recording' : ''} ${isAnalyzing ? 'analyzing' : ''}`}
                                aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
                            >
                                {isAnalyzing ? (
                                    <Sparkles size={36} color="#67e8f9" />
                                ) : isRecording ? (
                                    <Square size={30} fill="#ffffff" />
                                ) : (
                                    <Mic size={40} strokeWidth={2.2} />
                                )}
                            </button>
                        </div>

                        {/* REAL-TIME EQUALIZER BARS WHILE SPEAKING */}
                        {isRecording && (
                            <div className="vai-eq-bars" aria-hidden="true">
                                {eqLevels.map((h, i) => (
                                    <span key={i} className="vai-eq-bar" style={{ height: `${h}px` }} />
                                ))}
                            </div>
                        )}

                        <div className="vai-orb-caption">
                            {isRecording
                                ? isAmharic ? 'እያዳመጥኩ ነው... ሲጨርሱ ይጫኑ' : 'Listening... tap to finish'
                                : isAnalyzing
                                    ? isAmharic ? 'በፍጥነት በመተርጎም ላይ...' : 'Translating...'
                                    : isAmharic ? 'በአማርኛ ይናገሩ' : 'Tap & Speak in Amharic'}
                        </div>

                        {isRecording ? (
                            <div className="vai-timer-badge">
                                <span>●</span>
                                <span>
                                    {Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, '0')}
                                </span>
                            </div>
                        ) : (
                            <div className="vai-orb-sub">
                                {isAmharic
                                    ? 'ወጪ፣ ብድር ወይም ገቢ በአንድ ዓረፍተ ነገር ይናገሩ'
                                    : 'Say any expense, credit, or cash entry naturally'}
                            </div>
                        )}

                        {/* MINIMAL SINGLE-LINE COMMAND PILL */}
                        <form onSubmit={handleCommandSubmit} className="vai-command-pill">
                            <input
                                type="text"
                                className="vai-command-input"
                                placeholder={
                                    isAmharic
                                        ? 'ወይም እዚህ በአማርኛ ይጻፉ...'
                                        : 'Or type in Amharic / English...'
                                }
                                value={transcript}
                                onChange={(e) => setTranscript(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={!transcript.trim() || isAnalyzing}
                                className="vai-command-send"
                                title="Analyze"
                            >
                                {isAnalyzing ? <Loader2 size={17} className="spinning-refresh-icon" /> : <ArrowUp size={18} strokeWidth={2.5} />}
                            </button>
                        </form>

                        {/* SUBTLE GHOST EXAMPLES */}
                        <div className="vai-ghost-chips">
                            {QUICK_EXAMPLES.map((ex) => (
                                <button
                                    key={ex}
                                    type="button"
                                    className="vai-ghost-chip"
                                    onClick={() => {
                                        setTranscript(ex);
                                        analyzeInput({ transcript: ex });
                                    }}
                                >
                                    {ex}
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    /* RECEIPT SCANNER STAGE */
                    <>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            style={{ display: 'none' }}
                            onChange={handleReceiptFileChange}
                        />
                        <div
                            className="vai-receipt-zone"
                            onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        >
                            {receiptPreview ? (
                                <div className="vai-receipt-preview-wrap">
                                    <img src={receiptPreview} alt="Receipt" className="vai-receipt-img" />
                                    {isScanningReceipt && <div className="vai-laser-beam" />}
                                </div>
                            ) : (
                                <div
                                    style={{
                                        width: '68px',
                                        height: '68px',
                                        borderRadius: '20px',
                                        background: 'rgba(16, 185, 129, 0.14)',
                                        color: '#10b981',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 1rem',
                                    }}
                                >
                                    <Camera size={32} />
                                </div>
                            )}
                            <div className="vai-orb-caption">
                                {isScanningReceipt
                                    ? isAmharic ? 'ደረሰኙን በማንበብ ላይ...' : 'Scanning receipt...'
                                    : isAmharic ? 'የደረሰኝ ፎቶ ለመምረጥ ይጫኑ' : 'Tap to snap or upload receipt'}
                            </div>
                            <div className="vai-orb-sub">
                                {isAmharic
                                    ? 'ብር፣ ቀን እና ምክንያት በራስ-ሰር ይነበባል'
                                    : 'Amount, date & category extracted automatically'}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* 3. SPRING-ANIMATED CONFIRMATION & SAVE CARD */}
            {parsedData && (
                <div className="vai-confirm-card">
                    <div className="vai-quote-bar">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#06b6d4' }}>
                                {isAmharic ? 'ትርጉም እና ማረጋገጫ' : 'Understood'}
                            </span>
                            <button
                                type="button"
                                onClick={() => setParsedData(null)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--admin-subtext, #64748b)', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 700 }}
                            >
                                <RotateCcw size={13} />
                                <span>{isAmharic ? 'ዝጋ' : 'Clear'}</span>
                            </button>
                        </div>

                        {parsedData.originalText && (
                            <div style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--admin-text, #0f172a)', marginBottom: '4px' }}>
                                🇪🇹 "{parsedData.originalText}"
                            </div>
                        )}
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#10b981' }}>
                            🇬🇧 {parsedData.englishTranslation}
                        </div>
                        {recordedAudioUrl && (
                            <audio controls src={recordedAudioUrl} style={{ width: '100%', height: '32px', marginTop: '0.65rem' }} />
                        )}
                    </div>

                    <div className="vai-action-pills">
                        {[
                            { key: 'expense', en: 'Expense', am: 'የሱቅ ወጪ' },
                            { key: 'debt_receivable', en: 'Customer Debt', am: 'የደንበኛ ብድር' },
                            { key: 'debt_payable', en: 'Supplier Debt', am: 'የአቅራቢ እዳ' },
                            { key: 'capital_inflow', en: 'Add Cash', am: 'ገንዘብ ጨምር' },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setParsedData({ ...parsedData, actionType: tab.key })}
                                className={`vai-action-pill ${parsedData.actionType === tab.key ? 'active' : ''}`}
                            >
                                {isAmharic ? tab.am : tab.en}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleConfirmSave}>
                        <div className="vai-form-grid">
                            <div>
                                <label className="mezgeb-field-label">{isAmharic ? 'መጠን (ETB) *' : 'Amount (ETB) *'}</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    step="any"
                                    value={parsedData.amount}
                                    onChange={(e) => setParsedData({ ...parsedData, amount: e.target.value })}
                                    className="mezgeb-input"
                                    style={{ fontSize: '1.1rem', fontWeight: 800 }}
                                />
                            </div>
                            <div>
                                <label className="mezgeb-field-label">{isAmharic ? 'ምክንያት *' : 'Description *'}</label>
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
                                    <label className="mezgeb-field-label">{isAmharic ? 'ምድብ' : 'Category'}</label>
                                    <CoolSelect
                                        value={parsedData.categoryName}
                                        onChange={(e) => setParsedData({ ...parsedData, categoryName: e.target.value })}
                                    >
                                        {EXPENSE_CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </CoolSelect>
                                </div>
                            )}

                            {(parsedData.actionType === 'debt_receivable' || parsedData.actionType === 'debt_payable') && (
                                <>
                                    <div>
                                        <label className="mezgeb-field-label">{isAmharic ? 'ስም *' : 'Person Name *'}</label>
                                        <input
                                            type="text"
                                            required
                                            value={parsedData.personName}
                                            onChange={(e) => setParsedData({ ...parsedData, personName: e.target.value })}
                                            className="mezgeb-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="mezgeb-field-label">{isAmharic ? 'ስልክ' : 'Phone'}</label>
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
                                <label className="mezgeb-field-label">{isAmharic ? 'የክፍያ ዘዴ' : 'Payment Method'}</label>
                                <CoolSelect
                                    value={parsedData.paymentMethod}
                                    onChange={(e) => setParsedData({ ...parsedData, paymentMethod: e.target.value })}
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Telebirr">Telebirr</option>
                                    <option value="CBEBirr">CBEBirr</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Other">Other</option>
                                </CoolSelect>
                            </div>

                            <div>
                                <label className="mezgeb-field-label">{isAmharic ? 'ቀን' : 'Date'}</label>
                                <input
                                    type="date"
                                    value={parsedData.date}
                                    onChange={(e) => setParsedData({ ...parsedData, date: e.target.value })}
                                    className="mezgeb-input"
                                />
                            </div>
                        </div>

                        <div className="vai-confirm-footer">
                            <span style={{ fontSize: '0.78rem', color: '#06b6d4', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <Calendar size={13} />
                                <span>{toEthiopianDate(parsedData.date, true)}</span>
                            </span>
                            <button type="submit" disabled={isSaving} className="vai-save-cta">
                                {isSaving ? <Loader2 size={17} className="spinning-refresh-icon" /> : <Save size={17} />}
                                <span>{isSaving ? (isAmharic ? 'በማስቀመጥ ላይ...' : 'Saving...') : isAmharic ? 'አስቀምጥ' : 'Save To Shop'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default VoiceAssistant;
