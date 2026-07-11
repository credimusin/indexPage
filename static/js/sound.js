/**
 * imaginalOS - Audio Synthesizer Module
 */
(function() {
    window.audioSynthMuted = false;
    let audioCtx = null;

    function initAudio() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioCtx = new AudioContext();
            }
        }
    }

    window.playKeySound = function() {
        if (window.audioSynthMuted) return;
        try {
            initAudio();
            if (!audioCtx) return;
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sine';
            const freq = 1000 + Math.random() * 400;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.03);
            
            gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.03);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 0.04);
        } catch {}
    };

    window.playBeepSound = function(freq = 400, duration = 0.1, type = 'sine') {
        if (window.audioSynthMuted) return;
        try {
            initAudio();
            if (!audioCtx) return;
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            
            gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
            
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch {}
    };

    window.playGlitchSound = function() {
        if (window.audioSynthMuted) return;
        try {
            initAudio();
            if (!audioCtx) return;
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            
            const bufferSize = audioCtx.sampleRate * 1.5;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            
            const noise = audioCtx.createBufferSource();
            noise.buffer = buffer;
            
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 800;
            
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.5);
            
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(audioCtx.destination);
            noise.start();
            
            let time = audioCtx.currentTime;
            for (let i = 0; i < 4; i++) {
                const osc = audioCtx.createOscillator();
                const oscGain = audioCtx.createGain();
                osc.connect(oscGain);
                oscGain.connect(audioCtx.destination);
                
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(900 - i * 200, time);
                oscGain.gain.setValueAtTime(0.05, time);
                oscGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.3);
                
                osc.start(time);
                osc.stop(time + 0.35);
                time += 0.3;
            }
        } catch {}
    };

    window.playDegaussSound = function() {
        if (window.audioSynthMuted) return;
        try {
            initAudio();
            if (!audioCtx) return;
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            
            const time = audioCtx.currentTime;
            const duration = 1.0;
            
            // Основной низкий гул (Triangle)
            const osc1 = audioCtx.createOscillator();
            const gain1 = audioCtx.createGain();
            osc1.connect(gain1);
            gain1.connect(audioCtx.destination);
            
            osc1.type = 'triangle';
            osc1.frequency.setValueAtTime(90, time);
            osc1.frequency.linearRampToValueAtTime(30, time + duration);
            
            gain1.gain.setValueAtTime(0.35, time);
            gain1.gain.exponentialRampToValueAtTime(0.0001, time + duration);
            
            // Металлический резонанс повыше (Sawtooth)
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            
            osc2.type = 'sawtooth';
            osc2.frequency.setValueAtTime(180, time);
            osc2.frequency.linearRampToValueAtTime(40, time + duration * 0.7);
            
            gain2.gain.setValueAtTime(0.15, time);
            gain2.gain.exponentialRampToValueAtTime(0.0001, time + duration * 0.7);
            
            osc1.start(time);
            osc1.stop(time + duration);
            osc2.start(time);
            osc2.stop(time + duration);
        } catch {}
    };

    // Expose helpers globally
    window.imaginalOS = window.imaginalOS || {};
    window.imaginalOS.initAudio = initAudio;
    window.imaginalOS.playKeySound = window.playKeySound;
    window.imaginalOS.playBeepSound = window.playBeepSound;
    window.imaginalOS.playGlitchSound = window.playGlitchSound;
    window.imaginalOS.playDegaussSound = window.playDegaussSound;
})();
