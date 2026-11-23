/**
 * Royal Ludo Arena — Procedural Web Audio SFX & Haptics Engine
 * Zero external audio files required; works 100% offline.
 */
(function (global) {
  'use strict';

  let ctx = null;
  let unlocked = false;

  function getCtx() {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!ctx) {
      try {
        ctx = new AudioCtx();
      } catch {
        return null;
      }
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function isSfxEnabled() {
    try {
      if (global.RLAState) return global.RLAState.getSettings().sfx !== false;
    } catch {}
    return true;
  }

  function isHapticsEnabled() {
    try {
      if (global.RLAState) return global.RLAState.getSettings().haptics !== false;
    } catch {}
    return true;
  }

  function vibrate(pattern) {
    if (!isHapticsEnabled()) return;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch {}
  }

  function tone(freq, duration, type = 'sine', volume = 0.14, delay = 0, slideTo = null) {
    if (!isSfxEnabled()) return;
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + Math.min(0.015, duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function noiseBurst(duration, volume = 0.08, delay = 0, filterFreq = 1200) {
    if (!isSfxEnabled()) return;
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime + delay;
    const bufferSize = Math.max(1, Math.floor(c.sampleRate * duration));
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.45));
    }
    const src = c.createBufferSource();
    src.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterFreq, now);
    const gain = c.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    src.start(now);
  }

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    getCtx();
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('pointerdown', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true, passive: true });
  }

  const RLASound = {
    click() {
      tone(620, 0.045, 'triangle', 0.09, 0, 420);
      vibrate(8);
    },
    select() {
      tone(520, 0.06, 'sine', 0.1, 0, 740);
      vibrate(10);
    },
    diceRoll() {
      for (let i = 0; i < 6; i++) {
        const d = i * 0.055;
        noiseBurst(0.04, 0.09, d, 900 + i * 160);
        tone(170 + (i % 3) * 45, 0.035, 'triangle', 0.07, d, 110);
      }
      // Final wooden table thud
      tone(135, 0.11, 'sine', 0.15, 0.36, 62);
      noiseBurst(0.06, 0.1, 0.36, 520);
      vibrate([15, 30, 15, 30, 22]);
    },
    rollSix() {
      tone(523.25, 0.11, 'triangle', 0.13, 0);
      tone(659.25, 0.11, 'triangle', 0.13, 0.07);
      tone(783.99, 0.16, 'triangle', 0.15, 0.14);
      vibrate([18, 25, 30]);
    },
    hop(stepIndex = 0) {
      const base = 360 + Math.min(stepIndex, 10) * 34;
      tone(base, 0.065, 'sine', 0.12, 0, base * 1.28);
      vibrate(6);
    },
    tokenExit() {
      tone(440, 0.09, 'triangle', 0.13, 0, 587);
      tone(659, 0.13, 'triangle', 0.14, 0.07, 880);
      vibrate([14, 20, 14]);
    },
    safeZone() {
      tone(880, 0.1, 'sine', 0.1, 0);
      tone(1174.66, 0.14, 'sine', 0.11, 0.06);
      tone(1318.5, 0.18, 'sine', 0.1, 0.12);
    },
    capture() {
      tone(220, 0.18, 'sawtooth', 0.14, 0, 75);
      noiseBurst(0.14, 0.15, 0.02, 700);
      tone(587.33, 0.1, 'triangle', 0.12, 0.12);
      tone(880, 0.18, 'triangle', 0.15, 0.2);
      vibrate([35, 30, 55]);
    },
    homeReach() {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((n, idx) => tone(n, 0.16, 'triangle', 0.14, idx * 0.075));
      vibrate([20, 25, 20, 25, 45]);
    },
    forfeit() {
      tone(310, 0.15, 'sawtooth', 0.11, 0, 210);
      tone(210, 0.22, 'sawtooth', 0.11, 0.16, 130);
      vibrate([40, 40, 40]);
    },
    victory() {
      const melody = [
        [523.25, 0.14, 0],
        [659.25, 0.14, 0.12],
        [783.99, 0.14, 0.24],
        [1046.5, 0.28, 0.36],
        [783.99, 0.14, 0.56],
        [1046.5, 0.45, 0.7]
      ];
      melody.forEach(([f, d, t]) => tone(f, d, 'triangle', 0.16, t));
      vibrate([30, 40, 30, 40, 90]);
    },
    coin() {
      tone(987.77, 0.08, 'sine', 0.12, 0);
      tone(1318.51, 0.18, 'sine', 0.13, 0.07);
      vibrate(12);
    },
    spinTick() {
      tone(740, 0.025, 'triangle', 0.08, 0, 540);
    },
    emote() {
      tone(540, 0.06, 'sine', 0.08, 0, 720);
    }
  };

  global.RLASound = RLASound;
})(typeof window !== 'undefined' ? window : globalThis);
