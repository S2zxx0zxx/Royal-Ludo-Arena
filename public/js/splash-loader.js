/**
 * Royal Ludo Arena V4.0.0 — Real Game Splash & Asset Preload Screen
 * Runs once per browser session on launch with real 3D asset preloading,
 * smooth progress bar, and authentic game studio feel.
 */
(function (global) {
  'use strict';

  const SESSION_KEY = 'rla.splash.shown.v4';
  const PRELOAD_ASSETS = [
    './assets/game/hero-ludo-3d.webp',
    './assets/game/avatar-hero.webp',
    './assets/game/board-royal-walnut.webp',
    './assets/game/crown-medallion.png',
    './assets/game/pawn-red.png',
    './assets/game/pawn-green.png',
    './assets/game/pawn-blue.png',
    './assets/game/pawn-yellow.png'
  ];

  const TIPS = [
    'Tip: Star squares (★) protect your pawns from capture!',
    'Tip: In 2v2 Team Battle, finishing 4 pawns activates Partner Finish Assist!',
    'Tip: Roll 6, capture a rival, or reach Crown Home for a bonus roll!',
    'Tip: Claim your Daily Reward & Free Lucky Spin every day!'
  ];

  function preloadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      const done = () => resolve(true);
      img.onload = done;
      img.onerror = done;
      img.src = src;
      setTimeout(done, 900);
    });
  }

  function showSplash() {
    if (typeof document === 'undefined' || !document.body) return;
    try {
      if (global.sessionStorage && global.sessionStorage.getItem(SESSION_KEY) === '1') return;
    } catch {}

    const overlay = document.createElement('div');
    overlay.id = 'rla-splash';
    overlay.className = 'rla-splash-overlay';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-label', 'Loading Royal Ludo Arena');

    const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
    overlay.innerHTML = `
      <svg class="rla-splash-rays" viewBox="0 0 200 200" aria-hidden="true">
        <g fill="#f4bd3b">
          ${Array.from({ length: 12 }, (_, i) => `<polygon points="100,100 92,0 108,0" transform="rotate(${i * 30} 100 100)"/>`).join('')}
        </g>
      </svg>
      <div class="rla-splash-card">
        <div class="rla-splash-crest">
          <img class="rla-splash-crown" src="./assets/game/crown-medallion.png" alt="Royal Crown" draggable="false">
          <span class="rla-splash-sub">ROYAL STUDIO EDITION</span>
          <h1 class="rla-splash-title">ROYAL LUDO ARENA</h1>
        </div>
        <div class="rla-splash-hero-box">
          <img src="./assets/game/hero-ludo-3d.webp" alt="3D Ludo Arena" draggable="false">
        </div>
        <div class="rla-splash-loader-wrap">
          <div class="rla-splash-bar-track">
            <div class="rla-splash-bar-fill" id="rla-splash-fill"></div>
          </div>
          <div class="rla-splash-meta">
            <span id="rla-splash-stage">Initializing 3D Arena...</span>
            <span id="rla-splash-pct">0%</span>
          </div>
        </div>
        <div class="rla-splash-tip">${tip}</div>
      </div>
    `;
    document.body.append(overlay);

    const fill = overlay.querySelector('#rla-splash-fill');
    const stage = overlay.querySelector('#rla-splash-stage');
    const pctEl = overlay.querySelector('#rla-splash-pct');
    let dismissed = false;

    const setProgress = (pct, label) => {
      if (fill) fill.style.width = `${Math.min(100, pct)}%`;
      if (pctEl) pctEl.textContent = `${Math.min(100, Math.round(pct))}%`;
      if (stage && label) stage.textContent = label;
    };

    const finish = () => {
      if (dismissed) return;
      dismissed = true;
      try { global.sessionStorage?.setItem(SESSION_KEY, '1'); } catch {}
      setProgress(100, 'Entering Royal Arena...');
      setTimeout(() => {
        overlay.classList.add('exit');
        setTimeout(() => overlay.remove(), 500);
      }, 220);
    };

    // Tap anywhere after 45% to skip immediately if desired
    overlay.addEventListener('click', () => {
      if (parseInt(pctEl?.textContent || '0', 10) >= 45) finish();
    });

    const stages = [
      'Loading 3D Royal Board...',
      'Polishing Glossy 3D Pawns...',
      'Tuning Sound & Physics Engine...',
      'Connecting Arena Services...'
    ];

    let loaded = 0;
    const total = PRELOAD_ASSETS.length;
    PRELOAD_ASSETS.forEach((src) => {
      preloadImage(src).then(() => {
        loaded += 1;
        const pct = Math.round((loaded / total) * 95);
        const stIdx = Math.min(stages.length - 1, Math.floor((loaded / total) * stages.length));
        setProgress(pct, stages[stIdx]);
        if (loaded >= total) {
          setTimeout(finish, 260);
        }
      });
    });

    // Hard safety timeout so slow connections never stall
    setTimeout(finish, 2400);
  }

  global.RLASplash = { showSplash };
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', showSplash);
  }
})(typeof window !== 'undefined' ? window : globalThis);
