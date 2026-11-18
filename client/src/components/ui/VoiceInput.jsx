import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { aiService } from '../../services/api';
import { useAdminLanguage } from '../../context/AdminLanguageContext';
import { convertBlobToCleanWavBase64 } from '../../utils/audioWavEncoder';
import './VoiceInput.css';

/**
 * Drop-in text/textarea input with built-in Amharic & English Voice Dictation.
 * - Tap the Mic icon -> speak in Amharic or English -> AI writes clean text right into the field.
 * - Tap the `አማ` / `EN` pill anytime (even AFTER speaking) to instantly switch the written output language!
 */
const VoiceInput = ({
    value = '',
    onChange,
    name = '',
    placeholder = '',
    required = false,
    multiline = false,
    rows = 3,
    fieldHint = '',
    className = '',
    style = {},
    disabled = false,
}) => {
    const { isAmharic } = useAdminLanguage();
    const [outputLang, setOutputLang] = useState(isAmharic ? 'am' : 'en');
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [lastDualResult, setLastDualResult] = useState(null); // { amharic, english }

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const streamRef = useRef(null);

    // Keep default output language synced when admin switches global language (unless user already dictated)
    useEffect(() => {
        if (!lastDualResult) {
            setOutputLang(isAmharic ? 'am' : 'en');
        }
    }, [isAmharic, lastDualResult]);

    // Cleanup mic stream on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
            }
        };
    }, []);

    const emitChange = (nextVal) => {
        if (onChange) {
            onChange({
                target: {
                    value: nextVal,
                    name,
                    type: multiline ? 'textarea' : 'text',
                },
            });
        }
    };

    const handleToggleOutputLang = () => {
        const nextLang = outputLang === 'am' ? 'en' : 'am';
        setOutputLang(nextLang);
        // Instant zero-wait flip if we already have both Amharic & English from the last dictation!
        if (lastDualResult) {
            const flipped = nextLang === 'am' ? lastDualResult.amharic : lastDualResult.english;
            if (flipped) emitChange(flipped);
        }
    };

    const startRecording = async () => {
        setErrorMsg('');
        setStatusMsg('');

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setErrorMsg(isAmharic ? 'ማይክሮፎን በዚህ ብራውዘር አይደገፍም' : 'Microphone is not supported in this browser');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            audioChunksRef.current = [];

            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : '';

            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            recorder.onstop = async () => {
                // Stop mic immediately so red recording dot disappears
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((t) => t.stop());
                    streamRef.current = null;
                }

                const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
                if (blob.size < 400) {
                    setErrorMsg(isAmharic ? 'ድምፅ አልተሰማም — እንደገና ይሞክሩ' : 'No voice heard — please try again');
                    return;
                }

                setIsProcessing(true);
                setStatusMsg(outputLang === 'am' ? 'በአማርኛ በመጻፍ ላይ...' : 'Writing in English...');

                try {
                    const { base64, mimeType: wavMime } = await convertBlobToCleanWavBase64(blob);
                    const { data } = await aiService.transcribeText({
                        audioBase64: base64,
                        audioMimeType: wavMime,
                        outputLanguage: outputLang,
                        fieldHint,
                    });

                    const amText = data?.amharic || data?.text || '';
                    const enText = data?.english || data?.text || '';
                    setLastDualResult({ amharic: amText, english: enText });

                    const chosen = outputLang === 'am' ? (amText || enText) : (enText || amText);
                    if (chosen) {
                        emitChange(chosen);
                        setStatusMsg(
                            outputLang === 'am'
                                ? 'ተጽፏል! EN ን በመጫን ወደ እንግሊዝኛ መቀየር ይችላሉ'
                                : 'Done! Tap አማ to switch to Amharic'
                        );
                        setTimeout(() => setStatusMsg(''), 4000);
                    }
                } catch (err) {
                    const msg = err.response?.data?.message || (isAmharic ? 'ድምፅ መተርጎም አልተቻለም' : 'Voice transcription failed');
                    setErrorMsg(msg);
                    setStatusMsg('');
                } finally {
                    setIsProcessing(false);
                }
            };

            recorder.start();
            setIsRecording(true);
        } catch {
            setErrorMsg(isAmharic ? 'እባክዎ የማይክሮፎን ፍቃድ ይስጡ' : 'Please allow microphone permission');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    };

    const handleMicClick = () => {
        if (isProcessing || disabled) return;
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const InputTag = multiline ? 'textarea' : 'input';

    return (
        <div style={{ width: '100%' }}>
            <div
                className={`vinput-wrap ${multiline ? 'multiline' : ''} ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''} ${className}`}
                style={style}
            >
                <InputTag
                    type={multiline ? undefined : 'text'}
                    rows={multiline ? rows : undefined}
                    name={name}
                    required={required}
                    disabled={disabled}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => {
                        setLastDualResult(null);
                        if (onChange) onChange(e);
                    }}
                    className="vinput-field"
                />

                <div className="vinput-controls">
                    <button
                        type="button"
                        onClick={handleToggleOutputLang}
                        className={`vinput-lang-btn ${outputLang}`}
                        title={
                            outputLang === 'am'
                                ? 'Voice writes in Amharic (click for English)'
                                : 'Voice writes in English (click for Amharic)'
                        }
                    >
                        {outputLang === 'am' ? 'አማ' : 'EN'}
                    </button>

                    <button
                        type="button"
                        onClick={handleMicClick}
                        disabled={isProcessing || disabled}
                        className={`vinput-mic-btn ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
                        title={
                            isRecording
                                ? isAmharic ? 'መቅዳት አቁም' : 'Stop recording'
                                : isAmharic ? 'በድምፅ ይጻፉ (አማርኛ / እንግሊዝኛ)' : 'Speak to write (Amharic / English)'
                        }
                        aria-label="Voice dictation"
                    >
                        {isProcessing ? (
                            <Loader2 size={16} className="vinput-spin" />
                        ) : isRecording ? (
                            <Square size={14} fill="currentColor" />
                        ) : (
                            <Mic size={16} />
                        )}
                    </button>
                </div>
            </div>

            {isRecording && (
                <div className="vinput-status recording">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span className="vinput-bars">
                            <span />
                            <span />
                            <span />
                        </span>
                        <span>
                            {outputLang === 'am'
                                ? 'እየሰማሁ ነው... ሲጨርሱ ቀዩን ቁልፍ ይጫኑ'
                                : 'Listening... tap red button when done'}
                        </span>
                    </span>
                </div>
            )}

            {!isRecording && statusMsg && (
                <div className="vinput-status">
                    <span>{statusMsg}</span>
                </div>
            )}

            {!isRecording && errorMsg && (
                <div className="vinput-status error">
                    <span>{errorMsg}</span>
                </div>
            )}
        </div>
    );
};

export default VoiceInput;
