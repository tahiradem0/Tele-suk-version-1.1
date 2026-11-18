/**
 * Converts a browser-recorded audio Blob (webm/ogg/mp4) into crystal-clear,
 * silence-trimmed, peak-normalized 16kHz 16-bit Mono PCM WAV base64 for
 * maximum Amharic speech accuracy with both Addis AI Scribe and Google Gemini Audio.
 */

const writeString = (view, offset, str) => {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
};

const downsampleBuffer = (buffer, inputSampleRate, targetSampleRate = 16000) => {
    if (inputSampleRate === targetSampleRate) return buffer;
    const ratio = inputSampleRate / targetSampleRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < result.length) {
        const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
        let accum = 0;
        let count = 0;
        for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
            accum += buffer[i];
            count++;
        }
        result[offsetResult] = count > 0 ? accum / count : 0;
        offsetResult++;
        offsetBuffer = nextOffsetBuffer;
    }
    return result;
};

/**
 * Removes DC offset, trims dead leading/trailing silence (keeping 200ms padding),
 * and cleanly boosts quiet laptop/phone microphone recordings to 0.90 peak so
 * soft Amharic consonants are heard loud and clear.
 */
const cleanAndNormalizeSpeech = (samples, sampleRate = 16000) => {
    if (!samples || samples.length === 0) return samples;

    // 1. Remove DC offset & find peak amplitude
    let sum = 0;
    for (let i = 0; i < samples.length; i++) sum += samples[i];
    const mean = sum / samples.length;

    const centered = new Float32Array(samples.length);
    let peak = 0;
    for (let i = 0; i < samples.length; i++) {
        const v = samples[i] - mean;
        centered[i] = v;
        const abs = Math.abs(v);
        if (abs > peak) peak = abs;
    }

    // Avoid amplifying pure silence/noise floor
    if (peak < 0.004) return centered;

    // 2. Trim dead silence at start & end (with 200ms safety margin)
    const threshold = Math.max(0.012, peak * 0.04);
    const pad = Math.floor(sampleRate * 0.2);
    let start = 0;
    while (start < centered.length && Math.abs(centered[start]) < threshold) start++;
    let end = centered.length - 1;
    while (end > start && Math.abs(centered[end]) < threshold) end--;

    const sliceStart = Math.max(0, start - pad);
    const sliceEnd = Math.min(centered.length, end + pad);
    const trimmed = sliceEnd - sliceStart > sampleRate * 0.25
        ? centered.subarray(sliceStart, sliceEnd)
        : centered;

    // 3. Peak normalize smoothly up to 0.90 (capped at 10x gain so background hum never blows up)
    const gain = Math.min(10, 0.9 / peak);
    const normalized = new Float32Array(trimmed.length);
    for (let i = 0; i < trimmed.length; i++) {
        normalized[i] = Math.max(-0.98, Math.min(0.98, trimmed[i] * gain));
    }

    return normalized;
};

const encodePcmToWavBuffer = (samples, sampleRate = 16000) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // PCM chunk size
    view.setUint16(20, 1, true); // Linear PCM
    view.setUint16(22, 1, true); // Mono (1 channel)
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // Byte rate
    view.setUint16(32, 2, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        offset += 2;
    }

    return buffer;
};

const arrayBufferToBase64 = (arrayBuffer) => {
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
};

export const convertBlobToCleanWavBase64 = async (audioBlob) => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
        throw new Error('AudioContext unavailable');
    }

    const audioCtx = new AudioCtx();
    try {
        const rawArrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(rawArrayBuffer);

        // Mix down to mono if stereo
        let monoData;
        if (audioBuffer.numberOfChannels > 1) {
            const ch0 = audioBuffer.getChannelData(0);
            const ch1 = audioBuffer.getChannelData(1);
            monoData = new Float32Array(ch0.length);
            for (let i = 0; i < ch0.length; i++) {
                monoData[i] = (ch0[i] + ch1[i]) * 0.5;
            }
        } else {
            monoData = audioBuffer.getChannelData(0);
        }

        const resampled = downsampleBuffer(monoData, audioBuffer.sampleRate, 16000);
        const enhanced = cleanAndNormalizeSpeech(resampled, 16000);
        const wavBuffer = encodePcmToWavBuffer(enhanced, 16000);
        return {
            base64: arrayBufferToBase64(wavBuffer),
            mimeType: 'audio/wav',
        };
    } finally {
        audioCtx.close().catch(() => {});
    }
};
