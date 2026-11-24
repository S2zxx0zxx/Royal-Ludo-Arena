/**
 * Royal Ludo Arena V4.0.0 — 3D Motion-Graphics Interactive Hub Engine
 * Powers:
 *  - 3D Realistic Lucky Spin Cabinet (LED marquee, rAF angular physics, velocity-synced peg audio, odds & history)
 *  - 3D Motion-Graphics Free Coins Treasury & Bonus Chest (animated 3D lid, coin burst particles, live MM:SS clock)
 *  - 3D 7-Day Daily Reward Vault (wide Day-7 Mega Chest, live UTC countdown, claim burst)
 *  - 3D Top-3 Royal Podium Leaderboard (Gold/Silver/Bronze stands + live server cache)
 *  - 3D Starter Pack Showcase (fail-closed production billing disclosure)
 */
(function (global) {
  'use strict';

  const SPIN_PRIZES = [
    { label: '250 🪙', coins: 250, diamonds: 0, color: '#8f1622', odds: '22%' },
    { label: '10 💎', coins: 0, diamonds: 10, color: '#1b5fa8', odds: '14%' },
    { label: '500 🪙', coins: 500, diamonds: 0, color: '#1b7a38', odds: '18%' },
    { label: '150 🪙', coins: 150, diamonds: 0, color: '#9c6212', odds: '20%' },
    { label: '1,500 🪙', coins: 1500, diamonds: 0, color: '#6b1a8a', odds: '8%' },
    { label: '25 💎', coins: 0, diamonds: 25, color: '#146b78', odds: '6%' },
    { label: '750 🪙', coins: 750, diamonds: 0, color: '#b53a16', odds: '9%' },
    { label: '2,500 🪙', coins: 2500, diamonds: 0, color: '#c48912', odds: '3%' }
  ];

  const HISTORY_KEY = 'rla.spin.history.v4';
  const activeTimers = new Set();
  const activeRafs = new Set();

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function clearAllHubTimers() {
    activeTimers.forEach(id => clearInterval(id));
    activeTimers.clear();
    activeRafs.forEach(id => cancelAnimationFrame(id));
    activeRafs.clear();
  }

  function registerInterval(fn, ms) {
    const id = setInterval(fn, ms);
    activeTimers.add(id);
    return id;
  }

  function formatDuration(ms) {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function msUntilUtcMidnight() {
    const now = new Date();
    const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0);
    return Math.max(0, next - now.getTime());
  }

  function spawnCoinBurst(hostEl, symbol = '🪙', count = 16) {
    if (!hostEl) return;
    for (let i = 0; i < count; i++) {
      const sp = document.createElement('span');
      sp.className = 'rla-coin-spark';
      sp.textContent = i % 4 === 0 ? '✨' : symbol;
      const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.35);
      const dist = 48 + Math.random() * 68;
      sp.style.left = '50%';
      sp.style.top = '48%';
      sp.style.setProperty('--dx', `${Math.round(Math.cos(angle) * dist)}px`);
      sp.style.setProperty('--dy', `${Math.round(Math.sin(angle) * dist - 26)}px`);
      hostEl.append(sp);
      setTimeout(() => sp.remove(), 980);
    }
  }

  function openHubModal(title, htmlBody, actions = []) {
    clearAllHubTimers();
    document.getElementById('rla-dialog')?.remove();
    const veil = document.createElement('div');
    veil.id = 'rla-dialog';
    veil.className = 'rla-dialog-veil';
    const card = document.createElement('section');
    card.className = 'rla-dialog';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-label', title);
    card.innerHTML = `<header class="rla-dialog-title">${esc(title)}<button class="rla-dialog-x" type="button" aria-label="Close">×</button></header><div class="rla-dialog-body" style="white-space:normal">${htmlBody}</div><footer></footer>`;
    const close = () => { clearAllHubTimers(); veil.remove(); };
    const foot = card.querySelector('footer');
    if (actions.length) {
      for (const [label, fn] of actions) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'rla-dialog-action';
        b.textContent = label;
        b.addEventListener('click', () => { global.RLASound?.click(); fn(close, veil); });
        foot?.append(b);
      }
    } else {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'rla-dialog-action';
      b.textContent = 'Close';
      b.addEventListener('click', () => { global.RLASound?.click(); close(); });
      foot?.append(b);
    }
    card.querySelector('.rla-dialog-x')?.addEventListener('click', () => { global.RLASound?.click(); close(); });
    veil.addEventListener('click', e => { if (e.target === veil) close(); });
    veil.append(card);
    document.body.append(veil);
    return veil;
  }

  function loadSpinHistory() {
    try {
      const raw = global.localStorage?.getItem(HISTORY_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.filter(x => typeof x === 'string' && x.length <= 80).slice(0, 6) : [];
    } catch { return []; }
  }

  function pushSpinHistory(label) {
    const arr = [label, ...loadSpinHistory()].slice(0, 6);
    try { global.localStorage?.setItem(HISTORY_KEY, JSON.stringify(arr)); } catch {}
    return arr;
  }

  /* ===================== 1. 3D REALISTIC LUCKY SPIN ===================== */
  function openLuckySpin() {
    const segAngle = 360 / SPIN_PRIZES.length;
    const slices = SPIN_PRIZES.map((p, i) => {
      const a0 = (i * segAngle - 90) * Math.PI / 180;
      const a1 = ((i + 1) * segAngle - 90) * Math.PI / 180;
      const x0 = 100 + 96 * Math.cos(a0), y0 = 100 + 96 * Math.sin(a0);
      const x1 = 100 + 96 * Math.cos(a1), y1 = 100 + 96 * Math.sin(a1);
      const mid = ((i + 0.5) * segAngle - 90) * Math.PI / 180;
      const tx = 100 + 62 * Math.cos(mid), ty = 100 + 62 * Math.sin(mid);
      const rot = (i + 0.5) * segAngle;
      // Outer metallic peg dot on each slice boundary
      const px = 100 + 91 * Math.cos(a0), py = 100 + 91 * Math.sin(a0);
      return `<path d="M100,100 L${x0.toFixed(1)},${y0.toFixed(1)} A96,96 0 0,1 ${x1.toFixed(1)},${y1.toFixed(1)} Z" fill="${p.color}" stroke="#f4bd3b" stroke-width="2"/>
        <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3.2" fill="#ffe680" stroke="#5b2806" stroke-width="1"/>
        <text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" fill="#fff6dc" font-size="10.5" font-weight="900" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rot}, ${tx.toFixed(1)}, ${ty.toFixed(1)})">${p.label}</text>`;
    }).join('');

    const ledBulbs = Array.from({ length: 16 }, (_, i) => {
      const a = (i * 22.5 - 90) * Math.PI / 180;
      const left = 50 + 48.5 * Math.cos(a);
      const top = 50 + 48.5 * Math.sin(a);
      return `<span class="rla-led-bulb ${i % 2 ? 'alt' : ''}" style="left:${left.toFixed(2)}%;top:${top.toFixed(2)}%"></span>`;
    }).join('');

    const canFree = global.RLAState.canFreeSpin();
    const diamonds = global.RLAState.get().currency.diamonds;
    const history = loadSpinHistory();
    let spinning = false;
    let currentAngle = 0;

    const veil = openHubModal('ROYAL LUCKY SPIN 🎡', `
      <div class="rla-spin-cabinet" id="rla-spin-cabinet">
        <div class="rla-spin-bezel">
          <div class="rla-led-ring">${ledBulbs}</div>
          <svg class="rla-spin-flapper" id="rla-spin-flapper" viewBox="0 0 30 36" aria-hidden="true">
            <polygon points="15,35 3,6 27,6" fill="#ffe680" stroke="#5b2806" stroke-width="2.5"/>
            <circle cx="15" cy="9" r="5" fill="#8f1422" stroke="#ffe680" stroke-width="2"/>
          </svg>
          <svg class="rla-spin-rotor" id="rla-spin-rotor" viewBox="0 0 200 200">
            ${slices}
            <circle cx="100" cy="100" r="24" fill="#3b1606" stroke="#f4bd3b" stroke-width="3"/>
          </svg>
          <button type="button" class="rla-spin-hub-btn" id="rla-hub-spin-btn" aria-label="Spin Lucky Wheel">
            <span style="font-size:16px">👑</span>
            <span>SPIN</span>
          </button>
        </div>

        <div class="rla-spin-win-banner" id="rla-spin-banner">
          ${canFree ? '🎁 Daily FREE Spin Ready!' : `💎 Next Free Spin in <span id="rla-spin-utc">${formatDuration(msUntilUtcMidnight())}</span> · Spin for 10 💎 (${diamonds} 💎)`}
        </div>

        <div style="display:flex;gap:8px;width:100%;justify-content:center">
          <button type="button" class="rla-royal-btn" id="rla-do-spin-btn">${canFree ? '🎁 FREE SPIN NOW' : '💎 SPIN (10 💎)'}</button>
          <button type="button" class="rla-royal-btn secondary" id="rla-odds-toggle">📜 Odds & Rules</button>
        </div>

        <div class="rla-odds-box" id="rla-odds-box">
          <strong>Rules:</strong> 1 free practice spin daily (UTC reset). Practice re-spins cost 10 local diamonds. On a connected server, prize outcomes and limits are server-controlled; displayed odds below apply to local practice only.<br>
          ${SPIN_PRIZES.map(p => `<span class="rla-pill-chip" style="margin:2px;display:inline-block">${p.label}: ${p.odds}</span>`).join('')}
        </div>

        <div class="rla-spin-history" id="rla-spin-history">
          ${history.length ? history.map(h => `<span class="rla-pill-chip">Won ${esc(h)}</span>`).join('') : '<span class="rla-pill-chip">Spin to win Coins & Diamonds!</span>'}
        </div>
      </div>
    `);

    const cabinet = veil.querySelector('#rla-spin-cabinet');
    const rotor = veil.querySelector('#rla-spin-rotor');
    const flapper = veil.querySelector('#rla-spin-flapper');
    const banner = veil.querySelector('#rla-spin-banner');
    const spinBtn = veil.querySelector('#rla-do-spin-btn');
    const hubBtn = veil.querySelector('#rla-hub-spin-btn');
    const oddsToggle = veil.querySelector('#rla-odds-toggle');
    const oddsBox = veil.querySelector('#rla-odds-box');
    const historyEl = veil.querySelector('#rla-spin-history');

    oddsToggle?.addEventListener('click', () => {
      global.RLASound?.click();
      oddsBox?.classList.toggle('open');
    });

    registerInterval(() => {
      const utcEl = veil.querySelector('#rla-spin-utc');
      if (utcEl) utcEl.textContent = formatDuration(msUntilUtcMidnight());
    }, 1000);

    const runSpin = async () => {
      if (spinning) return;
      spinning = true;
      if (spinBtn) spinBtn.disabled = true;
      if (hubBtn) hubBtn.disabled = true;

      // Preview odds are not an authoritative source of rewards.
      // The connected server always decides the winner and credited balance.
      const totalWeight = [22, 14, 18, 20, 8, 6, 9, 3].reduce((a, b) => a + b, 0);
      const randomValue = new Uint32Array(1);
      if (global.crypto?.getRandomValues) global.crypto.getRandomValues(randomValue);
      else randomValue[0] = Math.floor(Math.random() * 0x100000000);
      let draw = (randomValue[0] / 0x100000000) * totalWeight;
      let winIdx = 0;
      for (let i = 0; i < SPIN_PRIZES.length; i++) {
        draw -= [22, 14, 18, 20, 8, 6, 9, 3][i];
        if (draw < 0) { winIdx = i; break; }
      }
      let awarded = SPIN_PRIZES[winIdx];

      if (global.RLAClient?.isServerAvailable()) {
        const res = await global.RLAClient.spinLuckyWheel();
        if (!res.ok) {
          global.RLAGameView?.toast(res.error || 'Cannot spin right now');
          spinning = false;
          if (spinBtn) spinBtn.disabled = false;
          if (hubBtn) hubBtn.disabled = false;
          return;
        }
        if (!Number.isInteger(res.winIndex) || res.winIndex < 0 || res.winIndex >= SPIN_PRIZES.length ||
            !res.prize || !Number.isSafeInteger(res.prize.coins) || !Number.isSafeInteger(res.prize.diamonds) ||
            res.prize.coins < 0 || res.prize.diamonds < 0) {
          global.RLAGameView?.toast('Unexpected prize response; please refresh your balance.');
          spinning = false;
          if (spinBtn) spinBtn.disabled = false;
          if (hubBtn) hubBtn.disabled = false;
          return;
        }
        winIdx = res.winIndex;
        awarded = res.prize;
      } else {
        const freeNow = global.RLAState.canFreeSpin();
        if (!freeNow && !global.RLAState.spendCurrency(0, 10)) {
          global.RLAGameView?.toast('Not enough Diamonds (10 💎 required)!');
          spinning = false;
          if (spinBtn) spinBtn.disabled = false;
          if (hubBtn) hubBtn.disabled = false;
          return;
        }
        global.RLAState.recordSpin(freeNow, awarded.coins, awarded.diamonds);
      }

      if (banner) banner.textContent = '🎡 Spinning the Royal Wheel...';
      const baseNormalized = currentAngle % 360;
      const targetOffset = (360 - (winIdx + 0.5) * segAngle + 360) % 360;
      const deltaToTarget = (targetOffset - baseNormalized + 360) % 360;
      const totalRotation = 360 * 6 + deltaToTarget;
      const startAngle = currentAngle;
      const durationMs = 4200;
      const startTs = performance.now();
      let lastPeg = Math.floor(startAngle / segAngle);

      let pendingFrame = null;
      const step = (now) => {
        if (pendingFrame !== null) activeRafs.delete(pendingFrame);
        if (!veil.isConnected) return;
        const elapsed = now - startTs;
        const t = Math.min(1, elapsed / durationMs);
        // Quartic ease-out physics for realistic roulette deceleration
        const ease = 1 - Math.pow(1 - t, 4);
        const angle = startAngle + totalRotation * ease;
        if (rotor) rotor.style.transform = `rotate(${angle.toFixed(2)}deg)`;

        const peg = Math.floor(angle / segAngle);
        if (peg !== lastPeg) {
          lastPeg = peg;
          global.RLASound?.spinTick();
          if (flapper) {
            flapper.classList.add('tick');
            setTimeout(() => flapper.classList.remove('tick'), 65);
          }
        }

        if (t < 1) {
          pendingFrame = requestAnimationFrame(step);
          activeRafs.add(pendingFrame);
        } else {
          currentAngle = startAngle + totalRotation;
          global.RLASound?.victory();
          spawnCoinBurst(cabinet, awarded.diamonds ? '💎' : '🪙', 18);
          if (banner) banner.textContent = `🎉 Won ${awarded.label} — ${global.RLAClient?.isServerAvailable() ? 'Server credited!' : 'Local practice wallet only'}`;
          const updatedHist = pushSpinHistory(awarded.label);
          if (historyEl) historyEl.innerHTML = updatedHist.map(h => `<span class="rla-pill-chip">Won ${esc(h)}</span>`).join('');
          spinning = false;
          if (spinBtn) {
            spinBtn.disabled = false;
            spinBtn.textContent = '💎 SPIN AGAIN (10 💎)';
          }
          if (hubBtn) hubBtn.disabled = false;
        }
      };

      pendingFrame = requestAnimationFrame(step);
      activeRafs.add(pendingFrame);
    };

    spinBtn?.addEventListener('click', runSpin);
    hubBtn?.addEventListener('click', runSpin);
  }

  /* ===================== 2. 3D TREASURY CHEST (FREE COINS & BONUS CHEST) ===================== */
  function buildChestSVG() {
    return `
      <svg viewBox="0 0 132 118" width="132" height="118" aria-hidden="true">
        <ellipse cx="66" cy="108" rx="48" ry="8" fill="#140702" opacity="0.7"/>
        <!-- Chest Base -->
        <rect x="20" y="50" width="92" height="52" rx="10" fill="#7a3410" stroke="#f4bd3b" stroke-width="4"/>
        <rect x="28" y="58" width="76" height="36" rx="5" fill="#592208" stroke="#c98916" stroke-width="2"/>
        <!-- Glowing Gold Coins inside -->
        <circle cx="48" cy="52" r="9" fill="#ffe680" stroke="#b37410" stroke-width="2"/>
        <circle cx="66" cy="48" r="10" fill="#f4bd3b" stroke="#b37410" stroke-width="2"/>
        <circle cx="84" cy="52" r="9" fill="#ffe680" stroke="#b37410" stroke-width="2"/>
        <!-- Hinged 3D Lid -->
        <g class="rla-chest-lid">
          <path d="M18,52 C18,22 114,22 114,52 Z" fill="#961624" stroke="#f4bd3b" stroke-width="4"/>
          <path d="M38,30 L38,52 M94,30 L94,52" stroke="#f4bd3b" stroke-width="5"/>
          <rect x="57" y="42" width="18" height="18" rx="4" fill="#ffe680" stroke="#5b2806" stroke-width="2.5"/>
          <circle cx="66" cy="51" r="3" fill="#5b2806"/>
        </g>
      </svg>
    `;
  }

  function openFreeCoinsVault(isBonusChest = false) {
    const remMs = global.RLAState.freeChestCooldownMs();
    const ready = remMs <= 0;
    const title = isBonusChest ? 'ROYAL BONUS CHEST 🎁' : 'FREE COINS TREASURY 💰';

    const veil = openHubModal(title, `
      <div class="rla-chest-stage" id="rla-chest-stage">
        <div class="rla-chest-wrap ${ready ? 'ready' : ''}" id="rla-chest-wrap" role="button" tabindex="0" aria-label="Open Royal Chest">
          ${buildChestSVG()}
        </div>
        <div class="rla-clock-badge" id="rla-chest-clock">
          ${ready ? '✨ READY TO OPEN (+350 🪙)' : `⏳ Next Chest in ${formatDuration(remMs)}`}
        </div>
        <button type="button" class="rla-royal-btn" id="rla-claim-chest-btn" ${ready ? '' : 'disabled'}>
          ${ready ? '🔓 OPEN TREASURY CHEST (+350 🪙)' : '⏳ CHEST RECHARGING'}
        </button>
      </div>

      <div class="rla-list" style="margin-top:8px">
        <div class="rla-list-row">
          <span>🗓️ <strong>7-Day Daily Streak</strong><br><small style="color:#e8c78b">Up to 5,000 🪙 + 50 💎</small></span>
          <button type="button" class="rla-royal-btn secondary" id="rla-jump-daily" style="padding:6px 10px;font-size:11px">Open</button>
        </div>
        <div class="rla-list-row">
          <span>🎡 <strong>Daily Free Lucky Spin</strong><br><small style="color:#e8c78b">Win up to 2,500 🪙 or 25 💎</small></span>
          <button type="button" class="rla-royal-btn secondary" id="rla-jump-spin" style="padding:6px 10px;font-size:11px">Spin</button>
        </div>
        <div class="rla-list-row">
          <span>🎯 <strong>Daily Goals & Missions</strong><br><small style="color:#e8c78b">Complete matches for bonus coins</small></span>
          <button type="button" class="rla-royal-btn secondary" id="rla-jump-goals" style="padding:6px 10px;font-size:11px">Goals</button>
        </div>
      </div>
    `);

    const stage = veil.querySelector('#rla-chest-stage');
    const wrap = veil.querySelector('#rla-chest-wrap');
    const clock = veil.querySelector('#rla-chest-clock');
    const claimBtn = veil.querySelector('#rla-claim-chest-btn');

    const doClaim = async () => {
      if (claimBtn?.disabled) return;
      if (claimBtn) claimBtn.disabled = true;

      let ok = false;
      let coins = 350;
      if (global.RLAClient?.isServerAvailable()) {
        const res = await global.RLAClient.claimFreeChest();
        if (res.ok) { ok = true; coins = res.coins || 350; }
        else global.RLAGameView?.toast(res.error || 'Chest still cooling down');
      } else {
        const r = global.RLAState.claimFreeChest();
        if (r) { ok = true; coins = r.coins; }
      }

      if (ok) {
        wrap?.classList.remove('ready');
        wrap?.classList.add('opened');
        global.RLASound?.victory();
        spawnCoinBurst(stage, '🪙', 20);
        if (clock) clock.textContent = `🎉 COLLECTED +${coins} COINS!`;
        if (claimBtn) claimBtn.textContent = '✓ CLAIMED — NEXT IN 30:00';
      }
    };

    claimBtn?.addEventListener('click', doClaim);
    wrap?.addEventListener('click', doClaim);

    registerInterval(() => {
      const rem = global.RLAState.freeChestCooldownMs();
      if (rem > 0) {
        if (clock && !wrap?.classList.contains('opened')) clock.textContent = `⏳ Next Chest in ${formatDuration(rem)}`;
      } else if (claimBtn?.disabled && !wrap?.classList.contains('opened')) {
        claimBtn.disabled = false;
        claimBtn.textContent = '🔓 OPEN TREASURY CHEST (+350 🪙)';
        wrap?.classList.add('ready');
        if (clock) clock.textContent = '✨ READY TO OPEN (+350 🪙)';
      }
    }, 1000);

    veil.querySelector('#rla-jump-daily')?.addEventListener('click', () => openDailyReward());
    veil.querySelector('#rla-jump-spin')?.addEventListener('click', () => openLuckySpin());
    veil.querySelector('#rla-jump-goals')?.addEventListener('click', () => { clearAllHubTimers(); veil.remove(); global.RLAShell?.go('daily-goals'); });
  }

  /* ===================== 3. 3D 7-DAY DAILY REWARD VAULT ===================== */
  function openDailyReward() {
    const s = global.RLAState.get();
    const canClaim = global.RLAState.canClaimDailyReward();
    const nextIdx = s.dailyReward.streakDay % 7;
    const days1to6 = global.RLAState.DAILY_REWARDS.slice(0, 6);
    const day7 = global.RLAState.DAILY_REWARDS[6];

    const gridCards = days1to6.map((r, idx) => {
      const claimed = idx < (s.dailyReward.streakDay % 7) || (s.dailyReward.streakDay > 0 && !canClaim && idx === (s.dailyReward.streakDay - 1) % 7);
      const isToday = canClaim && idx === nextIdx;
      return `<div class="rla-royal-card ${claimed ? 'claimed' : ''} ${isToday ? 'highlight' : ''}">
        <span style="font-size:10px;font-weight:900;color:#ffe680">DAY ${r.day}</span>
        <span style="font-size:22px">${r.diamonds ? '💎' : '🪙'}</span>
        <strong style="font-size:11.5px">${r.label}</strong>
        <span style="font-size:10px">${claimed ? 'Claimed ✓' : isToday ? 'READY!' : 'Locked'}</span>
      </div>`;
    }).join('');

    const day7Ready = canClaim && nextIdx === 6;
    const veil = openHubModal('7-DAY DAILY REWARD VAULT 🎁', `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span class="rla-pill-chip">🔥 Streak: ${s.dailyReward.streakDay} Day(s)</span>
        <span class="rla-clock-badge" id="rla-daily-utc">⏱ Reset: ${formatDuration(msUntilUtcMidnight())}</span>
      </div>
      <div class="rla-royal-grid" id="rla-daily-grid">
        ${gridCards}
        <div class="rla-day7-mega ${day7Ready ? 'highlight' : ''}">
          <div style="text-align:left">
            <div style="font-size:11px;font-weight:900;color:#ffe680">👑 DAY 7 GRAND MEGA VAULT</div>
            <strong style="font-size:14px;color:#fff">${day7.label}</strong>
          </div>
          <span style="font-size:30px">🏆</span>
        </div>
      </div>
    `, canClaim ? [
      ['🎁 Claim Today\'s Reward', async (_close, v) => {
        const grid = v.querySelector('#rla-daily-grid');
        if (global.RLAClient?.isServerAvailable()) {
          const res = await global.RLAClient.claimDailyReward();
          if (res.ok) {
            global.RLASound?.victory();
            spawnCoinBurst(grid, res.reward.diamonds ? '💎' : '🪙', 18);
            global.RLAGameView?.toast(`Claimed ${res.reward.label}!`);
            setTimeout(() => openDailyReward(), 650);
          } else global.RLAGameView?.toast(res.error || 'Already claimed today');
        } else {
          const r = global.RLAState.claimDailyReward();
          if (r) {
            global.RLASound?.victory();
            spawnCoinBurst(grid, r.diamonds ? '💎' : '🪙', 18);
            global.RLAGameView?.toast(`Claimed ${r.label}!`);
            setTimeout(() => openDailyReward(), 650);
          }
        }
      }]
    ] : []);

    registerInterval(() => {
      const el = veil.querySelector('#rla-daily-utc');
      if (el) el.textContent = `⏱ Reset: ${formatDuration(msUntilUtcMidnight())}`;
    }, 1000);
  }

  /* ===================== 4. 3D ROYAL PODIUM LEADERBOARD (RANKS) ===================== */
  async function openLeaderboard() {
    let board = global.RLAState.getLeaderboard();
    if (global.RLAClient?.isServerAvailable()) {
      const res = await global.RLAClient.fetchLeaderboard();
      if (res.ok && res.leaderboard.length) {
        const myId = global.RLAClient.getUserId();
        board = res.leaderboard.map(p => ({ ...p, isSelf: p.id === myId }));
      }
    }

    const top = [board[1], board[0], board[2]]; // Silver left, Gold center, Bronze right
    const podiumHtml = `
      <div class="rla-podium">
        ${top.map((p, idx) => {
          const rank = idx === 1 ? 1 : idx === 0 ? 2 : 3;
          const medal = rank === 1 ? '👑 #1' : rank === 2 ? '🥈 #2' : '🥉 #3';
          if (!p) return `<div class="rla-podium-col rank-${rank}"><div class="rla-podium-stand">${medal}</div></div>`;
          return `<div class="rla-podium-col rank-${rank}">
            <div class="rla-podium-av">${esc(p.avatar)}</div>
            <div style="font-size:11px;font-weight:900;color:#fff6dc;max-width:92px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.name)}</div>
            <div class="rla-podium-stand">
              <div style="font-size:12px">${medal}</div>
              <div style="font-size:10px">🏆 ${p.wins}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    `;

    const restRows = board.map((p, idx) => `
      <div class="rla-list-row ${p.isSelf ? 'self' : ''}">
        <span><strong>#${idx + 1}</strong> ${esc(p.avatar)} ${esc(p.name)} <small>(Lv.${p.level})</small></span>
        <span>🏆 ${p.wins} · 🪙 ${p.coins.toLocaleString()}</span>
      </div>
    `).join('');

    openHubModal('ROYAL ARENA RANKS 🏆', `${podiumHtml}<div class="rla-list" style="margin-top:8px">${restRows}</div>`);
  }

  /* ===================== 5. 3D STARTER PACK SHOWCASE ===================== */
  function openStarterPack() {
    openHubModal('ROYAL STARTER PACK 🎁', `
      <div class="rla-starter-showcase">
        <span class="rla-live-tag">🔥 LIMITED SEASON 28 OFFER</span>
        <div style="font-size:44px">👑</div>
        <strong style="font-size:18px;color:#ffe680">ROYAL STARTER PACK — ₹25</strong>
        <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px">
          <span class="rla-pill-chip">🪙 25,000 Coins</span>
          <span class="rla-pill-chip">💎 50 Diamonds</span>
          <span class="rla-pill-chip">🛡️ Ad-Free Badge</span>
        </div>
        <p style="margin:4px 0 0;font-size:11.5px;color:#f3dba4;line-height:1.4">
          Live store checkout is fail-closed in this preview — no payment will be charged and no virtual currency will be credited until Razorpay / Google Play Billing is connected.
        </p>
      </div>
    `, [
      ['Open Royal Store', (close) => { close(); global.RLAShell?.go('store'); }],
      ['Close', (close) => close()]
    ]);
  }

  global.RLAHub3D = {
    openLuckySpin,
    openFreeCoinsVault,
    openBonusChest: () => openFreeCoinsVault(true),
    openDailyReward,
    openLeaderboard,
    openStarterPack,
    formatUtcResetCountdown: () => formatDuration(msUntilUtcMidnight()),
    clearAllHubTimers
  };
})(typeof window !== 'undefined' ? window : globalThis);
