/**
 * Converts a browser-recorded audio Blob (webm/ogg/mp4) into crystal-clear
 * 16kHz 16-bit Mono PCM WAV base64 for maximum Amharic speech accuracy
 * with both Google Gemini Audio and Addis AI Scribe.
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
        const wavBuffer = encodePcmToWavBuffer(resampled, 16000);
        return {
            base64: arrayBufferToBase64(wavBuffer),
            mimeType: 'audio/wav',
        };
    } finally {
        audioCtx.close().catch(() => {});
    }
};
