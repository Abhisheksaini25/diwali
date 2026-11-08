/**
 * Diwali Festive Sound Synthesizer & MP3 Audio Player
 * Uses user-provided firework_explode.mp3 and fireworks-10-shoot.mp3 for authentic cracker sounds,
 * with Web Audio API procedural synthesis for diya bell chimes and fallback.
 */

class FestiveAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.activeSources = new Set();
    this.currentSong = null;
    this.initAudioContext();
  }

  initAudioContext() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx && !this.ctx) {
      this.ctx = new AudioCtx();
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.initAudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAllSustained();
      if (this.currentSong) {
        try { this.currentSong.pause(); } catch (e) {}
      }
    } else {
      if (this.currentSong && this.currentSong.paused && !this.currentSong.ended) {
        try { this.currentSong.play(); } catch (e) {}
      }
    }
    return this.isMuted;
  }

  stopAllSustained() {
    this.activeSources.forEach(source => {
      try {
        if (source.stop) source.stop();
        if (source.disconnect) source.disconnect();
      } catch (e) {}
    });
    this.activeSources.clear();
  }

  // 1. Play Firecracker Explosion (Uses user's firework_explode.mp3)
  playFireworkBurst() {
    if (this.isMuted) return;
    try {
      const audio = new Audio('firework_explode.mp3');
      audio.volume = 0.85;
      audio.play().catch(() => {
        // Fallback to procedural synthesis if browser blocks local file audio
        this.synthFireworkBurst();
      });
    } catch (e) {
      this.synthFireworkBurst();
    }
  }

  // 2. Play Rocket Launch Whoosh (Uses user's fireworks-10-shoot.mp3)
  playRocketLaunch() {
    if (this.isMuted) return;
    try {
      const audio = new Audio('fireworks-10-shoot.mp3');
      audio.volume = 0.55;
      audio.play().catch(() => {
        this.synthRocketLaunch();
      });
    } catch (e) {
      this.synthRocketLaunch();
    }
  }

  // 3. Play Diya Lighting Chime (Clear brass bell harmonic)
  playDiyaChime() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.35, now);
    masterGain.connect(this.ctx.destination);

    const freqs = [587.33, 880.0, 1174.66, 1760.0]; // D5, A5, D6, A6 bell resonance

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq + (Math.random() * 2 - 1), now);

      const decay = 1.8 + idx * 0.4;
      gain.gain.setValueAtTime(0.25 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + decay);
    });
  }

  // 4. Anar Sizzle & Fountain Roar
  playAnarSound(duration = 3.2) {
    if (this.isMuted) return;
    this.playFireworkBurst(); // Play initial explosion pop
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1400, now);
    bandpass.Q.setValueAtTime(1.8, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.4);
    gain.gain.setValueAtTime(0.3, now + duration - 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
    this.activeSources.add(noise);

    noise.onended = () => {
      this.activeSources.delete(noise);
    };
  }

  // 5. Chakri Whirr & Spin
  playChakriSound(duration = 3.5) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';

    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(360, now + 0.8);
    osc.frequency.setValueAtTime(360, now + duration - 1.0);
    osc.frequency.exponentialRampToValueAtTime(80, now + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.linearRampToValueAtTime(1200, now + 0.8);
    filter.frequency.exponentialRampToValueAtTime(300, now + duration);

    oscGain.gain.setValueAtTime(0.02, now);
    oscGain.gain.linearRampToValueAtTime(0.2, now + 0.6);
    oscGain.gain.setValueAtTime(0.2, now + duration - 0.8);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(oscGain);
    oscGain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
    this.activeSources.add(osc);

    osc.onended = () => {
      this.activeSources.delete(osc);
    };
  }

  // 6. Sparkler Crackle
  playSparklerCrackle() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    if (Math.random() > 0.45) {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(900 + Math.random() * 1200, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    }
  }

  // 7. Grand Celebration Fanfare Chords
  playCelebrationFanfare() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const chords = [523.25, 659.25, 783.99, 1046.50];
    chords.forEach((freq, idx) => {
      setTimeout(() => {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 2.4);
      }, idx * 120);
    });
  }

  // 8. Play "happydiwali.mp3" once when all diyas are lit
  playHappyDiwaliSong() {
    if (this.isMuted) return;
    try {
      this.stopHappyDiwaliSong();
      const audio = new Audio('happydiwali.mp3');
      audio.volume = 0.85;
      audio.play().catch((err) => {
        console.warn('[Diwali] happydiwali.mp3 play note:', err);
      });
      this.currentSong = audio;
    } catch (e) {
      console.warn('[Diwali] happydiwali.mp3 error:', e);
    }
  }

  stopHappyDiwaliSong() {
    if (this.currentSong) {
      try {
        this.currentSong.pause();
        this.currentSong.currentTime = 0;
      } catch (e) {}
      this.currentSong = null;
    }
  }

  // Procedural Fallbacks if MP3 files blocked
  synthFireworkBurst() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

    subGain.gain.setValueAtTime(0.6, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.4);
  }

  synthRocketLaunch() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.8);
    oscGain.gain.setValueAtTime(0.01, now);
    oscGain.gain.linearRampToValueAtTime(0.18, now + 0.3);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.8);
  }
}

window.festiveAudio = new FestiveAudioEngine();
