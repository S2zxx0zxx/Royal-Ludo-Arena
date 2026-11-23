/**
 * Royal Ludo Arena v2.0.0 — Server-Authoritative Feature Hub & Production Store
 * Zero free demo-pack minting! All economy rewards & IAP verification go through RLAClient -> Node server.
 */
const RLA = (() => {
  const ROUTES = Object.freeze({
    events: { label: 'Events', file: 'events', width: 922, height: 1536 },
    profile: { label: 'My Profile', file: 'profile', width: 922, height: 1536 },
    store: { label: 'Store', file: 'store', width: 864, height: 1536 },
    'store-compact': { label: 'Store — Compact', file: 'store-compact', width: 1404, height: 1536 },
    'daily-goals': { label: 'Daily Goals', file: 'daily-goals', width: 1404, height: 1536 },
    'send-gift': { label: 'Send Gift', file: 'send-gift', width: 1404, height: 1536 }
  });
  const HOME_RECT = [921, 1536];
  const fromHash = () => decodeURIComponent(location.hash.slice(1).split('?')[0]);
  const root = () => document.getElementById('app');
  const state = { mode: 'coins' };

  const btn = (id, label, rect, action, data = {}) => ({ id, label, rect, action, ...data });

  const HOME = [
    btn('profile', 'Player profile', [16, 10, 118, 114], 'route', { to: 'profile' }),
    btn('settings', 'Settings', [138, 15, 72, 85], 'settings'),
    btn('messages', 'Messages', [216, 13, 89, 91], 'inbox'),
    btn('diamonds', 'Diamond store', [300, 12, 238, 89], 'route', { to: 'store' }),
    btn('coins', 'Coin store', [550, 12, 257, 89], 'route', { to: 'store' }),
    btn('shop', 'Open store', [825, 10, 85, 102], 'route', { to: 'store' }),
    btn('vip', 'VIP access', [772, 120, 132, 135], 'vip'),
    btn('daily-reward', 'Daily Reward', [777, 264, 115, 130], 'daily-reward'),
    btn('missions', 'Missions and Daily Goals', [777, 396, 115, 116], 'missions'),
    btn('leaderboard', 'Leaderboard', [783, 535, 109, 119], 'leaderboard'),
    btn('starter', 'Starter Pack', [16, 183, 155, 209], 'route', { to: 'store' }),
    btn('events-left', 'Events', [22, 400, 130, 128], 'route', { to: 'events' }),
    btn('watch', 'Free Bonus Chest', [12, 540, 137, 131], 'free-chest'),
    btn('lucky', 'Lucky Spin', [34, 1156, 139, 167], 'lucky-spin'),
    btn('tournaments', 'Tournaments', [300, 1130, 320, 157], 'tournament'),
    btn('season-reward', 'Season Reward', [245, 1280, 430, 118], 'daily-reward'),
    btn('free-coins', 'Free Coins', [753, 1141, 154, 181], 'free-chest'),
    btn('nav-events', 'Events tab', [181, 1405, 151, 123], 'route', { to: 'events' }),
    btn('nav-club', 'Club tab', [343, 1405, 150, 123], 'club'),
    btn('nav-inventory', 'Inventory tab', [505, 1405, 155, 123], 'inventory'),
    btn('nav-social', 'Social tab', [669, 1405, 157, 123], 'social'),
    btn('nav-more', 'More tab', [828, 1405, 86, 123], 'settings')
  ];

  const COMMON = [
    btn('header-profile', 'Player profile', [17, 10, 112, 108], 'route', { to: 'profile' }),
    btn('header-diamonds', 'Diamonds', [304, 6, 246, 100], 'route', { to: 'store' }),
    btn('header-coins', 'Coins', [564, 6, 256, 100], 'route', { to: 'store' }),
    btn('header-shop', 'Store', [824, 5, 94, 106], 'route', { to: 'store' }),
    btn('header-help', 'Help & Rules', [809, 130, 102, 111], 'help')
  ];

  const NAV = (width, height, y) => [
    btn('nav-home', 'Home', [0, y, width / 6, height - y], 'route', { to: 'home' }),
    btn('nav-events', 'Events', [width / 6, y, width / 6, height - y], 'route', { to: 'events' }),
    btn('nav-club', 'Club', [width * 2 / 6, y, width / 6, height - y], 'club'),
    btn('nav-inventory', 'Inventory', [width * 3 / 6, y, width / 6, height - y], 'inventory'),
    btn('nav-social', 'Social', [width * 4 / 6, y, width / 6, height - y], 'social'),
    btn('nav-more', 'More', [width * 5 / 6, y, width / 6, height - y], 'settings')
  ];

  const HITS = {
    events: [
      btn('back', 'Back', [20, 112, 118, 129], 'route', { to: 'home' }),
      ...COMMON,
      btn('season', 'Season pass', [24, 366, 880, 253], 'vip'),
      btn('goals', 'Daily Goals', [24, 641, 877, 212], 'route', { to: 'daily-goals' }),
      btn('bonus', 'Daily Bonus', [25, 872, 877, 212], 'daily-reward'),
      btn('tour', 'Tournaments', [24, 1104, 877, 226], 'tournament'),
      ...NAV(922, 1536, 1365)
    ],
    profile: [
      btn('back', 'Back', [18, 116, 118, 116], 'route', { to: 'home' }),
      ...COMMON,
      btn('avatar-edit', 'Edit avatar', [192, 434, 89, 72], 'edit'),
      btn('copy-id', 'Copy player ID', [469, 337, 65, 55], 'copy'),
      btn('bio-edit', 'Edit status', [289, 382, 342, 68], 'edit'),
      btn('edit', 'Edit Profile', [258, 1244, 415, 118], 'edit'),
      btn('level', 'Level progress', [80, 527, 760, 104], 'stats'),
      btn('coins', 'View coin store', [309, 447, 230, 83], 'route', { to: 'store' }),
      btn('diamonds', 'View diamond store', [559, 447, 235, 83], 'route', { to: 'store' }),
      btn('stats', 'Game statistics', [26, 654, 874, 356], 'stats'),
      btn('save-data', 'Save Data', [49, 1020, 233, 93], 'info', { message: 'Account wallet, ledger & stats sync automatically to the authoritative server when connected.' }),
      btn('change-device', 'Settings', [315, 1020, 264, 93], 'settings'),
      btn('referral', 'Referral rewards', [605, 1020, 269, 93], 'social'),
      btn('google', 'Google sign in', [51, 1123, 265, 97], 'info', { message: 'HMAC-signed session token active. Connect Google OAuth ID token verification for multi-device login.' }),
      btn('facebook', 'Facebook sign in', [317, 1123, 286, 97], 'info', { message: 'Connect Facebook OAuth when deploying to production.' }),
      btn('play-games', 'Play Games login', [614, 1123, 262, 97], 'info', { message: 'Google Play Games Services can be linked inside your Android TWA/AAB wrapper.' }),
      ...NAV(922, 1536, 1382)
    ],
    store: [
      btn('back', 'Back', [12, 21, 86, 96], 'route', { to: 'home' }),
      btn('tab-coins', 'Coins tab', [18, 132, 283, 117], 'mode', { value: 'coins' }),
      btn('tab-diamonds', 'Diamonds tab', [298, 133, 281, 119], 'mode', { value: 'diamonds' }),
      btn('tab-offers', 'Offers tab', [576, 133, 280, 118], 'mode', { value: 'offers' }),
      btn('promo', 'Royal Coin Bundle', [20, 265, 818, 359], 'purchase', { sku: 'royal_bundle', value: 'Royal Coin Bundle — ₹480' }),
      btn('pass', 'Pass benefits', [65, 622, 735, 68], 'vip'),
      btn('pack-25k', '25,000 Coins', [36, 712, 385, 252], 'purchase', { sku: 'coins_25k', value: '25,000 Coins — ₹100' }),
      btn('pack-100k', '100,000 Coins', [434, 712, 391, 252], 'purchase', { sku: 'coins_100k', value: '100,000 Coins — ₹180' }),
      btn('pack-500k', '500,000 Coins', [36, 966, 385, 253], 'purchase', { sku: 'coins_500k', value: '500,000 Coins — ₹480' }),
      btn('pack-1m', '1,000,000 Coins', [434, 966, 391, 253], 'purchase', { sku: 'coins_1m', value: '1,000,000 Coins — ₹690' }),
      btn('pack-5m', '5,000,000 Coins', [36, 1222, 385, 260], 'purchase', { sku: 'coins_5m', value: '5,000,000 Coins — ₹1,800' }),
      btn('pack-10m', '10,000,000 Coins', [434, 1222, 391, 260], 'purchase', { sku: 'coins_10m', value: '10,000,000 Coins — ₹3,000' })
    ],
    'store-compact': [
      btn('back', 'Back', [24, 18, 116, 111], 'route', { to: 'home' }),
      btn('coins', 'Coins tab', [60, 166, 393, 135], 'route', { to: 'store' }),
      btn('diamonds', 'Diamonds tab', [471, 166, 397, 136], 'mode', { value: 'diamonds' }),
      btn('offers', 'Offers tab', [891, 166, 430, 136], 'mode', { value: 'offers' }),
      btn('coin-bundle', 'Coin Bundle', [44, 314, 1323, 298], 'purchase', { sku: 'royal_bundle', value: 'Royal Coin Bundle — ₹480' }),
      btn('pack1', '25,000 Coins', [40, 616, 437, 290], 'purchase', { sku: 'coins_25k', value: '25,000 Coins — ₹100' }),
      btn('pack2', '100,000 Coins', [485, 616, 434, 290], 'purchase', { sku: 'coins_100k', value: '100,000 Coins — ₹180' }),
      btn('pack3', '500,000 Coins', [930, 616, 432, 290], 'purchase', { sku: 'coins_500k', value: '500,000 Coins — ₹480' }),
      btn('pack4', '1,000,000 Coins', [40, 930, 437, 277], 'purchase', { sku: 'coins_1m', value: '1,000,000 Coins — ₹690' }),
      btn('pack5', '5,000,000 Coins', [485, 930, 434, 277], 'purchase', { sku: 'coins_5m', value: '5,000,000 Coins — ₹1,800' }),
      btn('pack6', '10,000,000 Coins', [930, 930, 432, 277], 'purchase', { sku: 'coins_10m', value: '10,000,000 Coins — ₹3,000' })
    ],
    'daily-goals': [
      btn('close', 'Close Daily Goals', [1194, 109, 145, 126], 'route', { to: 'events' }),
      btn('play-3', 'Play 3 Games', [1004, 547, 230, 110], 'route', { to: 'computer' }),
      btn('win-1', 'Win a Game', [1005, 669, 230, 109], 'route', { to: 'online' }),
      btn('invite', 'Invite a Friend', [1005, 791, 230, 110], 'route', { to: 'friends' }),
      btn('claimed-ad', 'View Missions', [1005, 915, 230, 104], 'missions'),
      btn('claimed-login', 'Claim Login Reward', [1005, 1033, 230, 108], 'missions'),
      btn('claim-all', 'Claim All Rewards', [403, 1192, 599, 170], 'missions')
    ],
    'send-gift': [
      btn('close', 'Close Send Gift', [1229, 116, 141, 131], 'route', { to: 'store' }),
      btn('king-pass', 'Send King Pass', [949, 312, 299, 179], 'gift', { sku: 'king_pass', value: 'King Pass — ₹599' }),
      btn('gift-25k', 'Gift 25,000 coins', [81, 663, 392, 249], 'gift', { sku: 'coins_25k', value: '25,000 Coins — ₹100' }),
      btn('gift-100k', 'Gift 100,000 coins', [489, 663, 417, 249], 'gift', { sku: 'coins_100k', value: '100,000 Coins — ₹180' }),
      btn('gift-10m', 'Gift 10,000,000 coins', [920, 663, 434, 249], 'gift', { sku: 'coins_10m', value: '10,000,000 Coins — ₹3,000' }),
      btn('gift-100d', 'Gift 100 diamonds', [82, 923, 395, 247], 'gift', { sku: 'diamonds_100', value: '100 Diamonds — ₹79' }),
      btn('gift-2kd', 'Gift 2,000 diamonds', [488, 923, 417, 247], 'gift', { sku: 'diamonds_2000', value: '2,000 Diamonds — ₹999' }),
      btn('gift-12kd', 'Gift 12,500 diamonds', [922, 923, 428, 247], 'gift', { sku: 'diamonds_2000', value: '12,500 Diamonds — ₹3,999' })
    ]
  };

  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  function overlay(hit, frame) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'rla-hit';
    el.dataset.action = hit.id;
    el.title = hit.label;
    el.setAttribute('aria-label', hit.label);
    const [x, y, w, h] = hit.rect;
    el.style.cssText = `left:${(x / frame[0] * 100).toFixed(4)}%;top:${(y / frame[1] * 100).toFixed(4)}%;width:${(w / frame[0] * 100).toFixed(4)}%;height:${(h / frame[1] * 100).toFixed(4)}%;`;
    el.addEventListener('click', (event) => { event.preventDefault(); window.RLASound?.click(); apply(hit); });
    return el;
  }

  function modal(title, body, actions = [], isHtml = false) {
    document.getElementById('rla-dialog')?.remove();
    const veil = document.createElement('div');
    veil.id = 'rla-dialog';
    veil.className = 'rla-dialog-veil';
    const card = document.createElement('section');
    card.className = 'rla-dialog';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.innerHTML = `<header class="rla-dialog-title">${escapeHtml(title)}<button class="rla-dialog-x" aria-label="Close">×</button></header><div class="rla-dialog-body" ${isHtml ? 'style="white-space:normal"' : ''}>${isHtml ? body : escapeHtml(body)}</div><footer></footer>`;
    const foot = card.querySelector('footer');
    for (const [label, run] of actions) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'rla-dialog-action';
      b.textContent = label;
      b.addEventListener('click', () => { window.RLASound?.click(); veil.remove(); run(); });
      foot?.append(b);
    }
    if (!actions.length) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'rla-dialog-action';
      b.textContent = 'OK';
      b.addEventListener('click', () => { window.RLASound?.click(); veil.remove(); });
      foot?.append(b);
    }
    card.querySelector('.rla-dialog-x')?.addEventListener('click', () => veil.remove());
    veil.addEventListener('click', e => { if (e.target === veil) veil.remove(); });
    veil.append(card);
    document.body.append(veil);
    return veil;
  }

  function openEditProfile() {
    const p = window.RLAState.get().profile;
    const avatarBtns = window.RLAState.AVATARS.map(av =>
      `<button type="button" class="rla-royal-btn ${av === p.avatar ? '' : 'secondary'}" data-av="${av}" style="font-size:20px;padding:6px 10px">${av}</button>`
    ).join('');
    let chosenAvatar = p.avatar;

    const veil = modal('EDIT PROFILE', `
      <form id="rla-profile-form" style="display:flex;flex-direction:column;gap:10px">
        <label>Royal Avatar <div style="display:flex;flex-wrap:wrap;gap:6px">${avatarBtns}</div></label>
        <label>Display Name <input name="name" maxlength="22" autocomplete="off" required value="${escapeHtml(p.name)}"></label>
        <label>Status <textarea name="bio" maxlength="70" rows="2">${escapeHtml(p.bio)}</textarea></label>
      </form>
    `, [
      ['Save Changes', async () => {
        const form = veil.querySelector('#rla-profile-form');
        const name = form.elements.namedItem('name').value.trim();
        const bio = form.elements.namedItem('bio').value.trim();
        if (!name) return;
        if (window.RLAClient?.isServerAvailable()) {
          await window.RLAClient.updateProfile({ name, bio, avatar: chosenAvatar });
        } else {
          window.RLAState.updateProfile({ name, bio, avatar: chosenAvatar });
        }
        window.RLASound?.coin();
        window.RLAGameView?.toast('Profile saved!');
        draw();
      }]
    ], true);

    veil.querySelectorAll('[data-av]').forEach(b => {
      b.addEventListener('click', () => {
        chosenAvatar = b.dataset.av;
        veil.querySelectorAll('[data-av]').forEach(x => x.classList.add('secondary'));
        b.classList.remove('secondary');
      });
    });
  }

  function openDailyRewardModal() {
    const s = window.RLAState.get();
    const canClaim = window.RLAState.canClaimDailyReward();
    const nextIdx = s.dailyReward.streakDay % 7;

    const cards = window.RLAState.DAILY_REWARDS.map((r, idx) => {
      const claimed = idx < (s.dailyReward.streakDay % 7) || (s.dailyReward.streakDay > 0 && !canClaim && idx === (s.dailyReward.streakDay - 1) % 7);
      const isToday = canClaim && idx === nextIdx;
      return `<div class="rla-royal-card ${claimed ? 'claimed' : ''} ${isToday ? 'highlight' : ''}">
        <span style="font-size:11px;font-weight:800;color:#ffe28a">DAY ${r.day}</span>
        <span style="font-size:20px">${r.diamonds ? '💎' : '🪙'}</span>
        <strong style="font-size:12px">${r.label}</strong>
        <span style="font-size:10px">${claimed ? 'Claimed ✓' : isToday ? 'READY!' : 'Locked'}</span>
      </div>`;
    }).join('');

    modal('7-DAY DAILY REWARD 🎁', `
      <p style="margin:0;text-align:center">Streak: <strong>${s.dailyReward.streakDay} Day(s)</strong> ${window.RLAClient?.isServerAvailable() ? '· Single-node demo server' : ''}</p>
      <div class="rla-royal-grid">${cards}</div>
    `, canClaim ? [
      ['Claim Today\'s Reward', async () => {
        if (window.RLAClient?.isServerAvailable()) {
          const res = await window.RLAClient.claimDailyReward();
          if (res.ok) { window.RLASound?.coin(); window.RLAGameView?.toast(`Server receipt: Claimed ${res.reward.label}!`); openDailyRewardModal(); }
          else window.RLAGameView?.toast(res.error || 'Already claimed today');
        } else {
          const r = window.RLAState.claimDailyReward();
          if (r) { window.RLASound?.coin(); window.RLAGameView?.toast(`Claimed ${r.label}!`); openDailyRewardModal(); }
        }
      }]
    ] : [], true);
  }

  function openLuckySpinModal() {
    const prizes = [
      { label: '250 🪙', coins: 250, diamonds: 0, color: '#8f1622' },
      { label: '10 💎', coins: 0, diamonds: 10, color: '#1b5fa8' },
      { label: '500 🪙', coins: 500, diamonds: 0, color: '#1b7a38' },
      { label: '150 🪙', coins: 150, diamonds: 0, color: '#9c6212' },
      { label: '1,500 🪙', coins: 1500, diamonds: 0, color: '#6b1a8a' },
      { label: '25 💎', coins: 0, diamonds: 25, color: '#146b78' },
      { label: '750 🪙', coins: 750, diamonds: 0, color: '#b53a16' },
      { label: '2,500 🪙', coins: 2500, diamonds: 0, color: '#c48912' }
    ];
    const segAngle = 360 / prizes.length;
    const slices = prizes.map((p, i) => {
      const a0 = (i * segAngle - 90) * Math.PI / 180;
      const a1 = ((i + 1) * segAngle - 90) * Math.PI / 180;
      const x0 = 100 + 96 * Math.cos(a0), y0 = 100 + 96 * Math.sin(a0);
      const x1 = 100 + 96 * Math.cos(a1), y1 = 100 + 96 * Math.sin(a1);
      const mid = ((i + 0.5) * segAngle - 90) * Math.PI / 180;
      const tx = 100 + 62 * Math.cos(mid), ty = 100 + 62 * Math.sin(mid);
      const rot = (i + 0.5) * segAngle;
      return `<path d="M100,100 L${x0.toFixed(1)},${y0.toFixed(1)} A96,96 0 0,1 ${x1.toFixed(1)},${y1.toFixed(1)} Z" fill="${p.color}" stroke="#f4bd41" stroke-width="2"/>
        <text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" fill="#fff6dc" font-size="10.5" font-weight="900" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rot}, ${tx.toFixed(1)}, ${ty.toFixed(1)})">${p.label}</text>`;
    }).join('');

    const canFree = window.RLAState.canFreeSpin();
    const diamonds = window.RLAState.get().currency.diamonds;
    let spinning = false;

    const veil = modal('ROYAL LUCKY SPIN 🎡', `
      <div class="rla-wheel-wrap">
        <div class="rla-wheel-pointer"></div>
        <svg class="rla-wheel-svg" id="rla-spin-svg" viewBox="0 0 200 200">
          ${slices}
          <circle cx="100" cy="100" r="18" fill="#f4bd41" stroke="#471d07" stroke-width="3"/>
          <text x="100" y="104" text-anchor="middle" font-size="14">👑</text>
        </svg>
      </div>
      <p id="rla-spin-status" style="margin:0;text-align:center;font-weight:800;color:#ffe28a">
        ${canFree ? 'Daily FREE Spin ready! (Server CSPRNG)' : `Spin for 10 💎 (Balance: ${diamonds} 💎)`}
      </p>
      <div style="display:flex;justify-content:center">
        <button type="button" class="rla-royal-btn" id="rla-do-spin">${canFree ? '🎁 FREE SPIN' : '💎 SPIN (10 💎)'}</button>
      </div>
    `, [], true);

    const spinBtn = veil.querySelector('#rla-do-spin');
    const svg = veil.querySelector('#rla-spin-svg');
    const status = veil.querySelector('#rla-spin-status');

    spinBtn?.addEventListener('click', async () => {
      if (spinning) return;
      spinning = true;
      spinBtn.disabled = true;

      let winIdx = Math.floor(Math.random() * prizes.length);
      let serverPrize = null;

      if (window.RLAClient?.isServerAvailable()) {
        const res = await window.RLAClient.spinLuckyWheel();
        if (!res.ok) {
          window.RLAGameView?.toast(res.error || 'Cannot spin');
          spinning = false;
          spinBtn.disabled = false;
          return;
        }
        winIdx = res.winIndex;
        serverPrize = res.prize;
      } else {
        const freeNow = window.RLAState.canFreeSpin();
        if (!freeNow && !window.RLAState.spendCurrency(0, 10)) {
          window.RLAGameView?.toast('Not enough Diamonds!');
          spinning = false;
          spinBtn.disabled = false;
          return;
        }
        window.RLAState.recordSpin(freeNow, prizes[winIdx].coins, prizes[winIdx].diamonds);
      }

      const targetDeg = 360 * 5 + (360 - (winIdx + 0.5) * segAngle);
      svg.style.transform = `rotate(${targetDeg}deg)`;
      let ticks = 0;
      const tickInt = setInterval(() => {
        ticks++;
        window.RLASound?.spinTick();
        if (ticks >= 18) clearInterval(tickInt);
      }, 170);

      setTimeout(() => {
        clearInterval(tickInt);
        window.RLASound?.victory();
        status.textContent = `🎉 WON ${(serverPrize || prizes[winIdx]).label}! Credited to ledger!`;
        spinning = false;
        spinBtn.disabled = false;
        spinBtn.textContent = '💎 SPIN AGAIN (10 💎)';
      }, 3900);
    });
  }

  function openMissionsModal() {
    const s = window.RLAState.get();
    const rows = s.missions.map(m => {
      const done = m.progress >= m.target;
      const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
      const rewardStr = `${m.rewardCoins ? `${m.rewardCoins} 🪙` : ''}${m.rewardDiamonds ? ` ${m.rewardDiamonds} 💎` : ''}`;
      return `<div class="rla-list-row ${done && !m.claimed ? 'self' : ''}">
        <div style="flex:1;min-width:0">
          <div style="font-weight:800;font-size:13px">${m.title} (${m.progress}/${m.target})</div>
          <div style="font-size:11px;color:#e8c78b">Reward: ${rewardStr}</div>
          <div class="rla-progress-bar"><div class="rla-progress-fill" style="width:${pct}%"></div></div>
        </div>
        ${m.claimed
          ? '<span style="color:#86f28a;font-weight:800;font-size:12px">Claimed ✓</span>'
          : done
            ? `<button type="button" class="rla-royal-btn" data-claim-m="${m.id}" style="padding:5px 10px;font-size:12px">Claim</button>`
            : `<span style="font-size:11px;color:#cbb089">${pct}%</span>`}
      </div>`;
    }).join('');

    const veil = modal('DAILY MISSIONS 🎯', `<div class="rla-list">${rows}</div>`, [], true);
    veil.querySelectorAll('[data-claim-m]').forEach(b => {
      b.addEventListener('click', async () => {
        if (window.RLAClient?.isServerAvailable()) {
          const res = await window.RLAClient.claimMission(b.dataset.claimM);
          if (res.ok) { window.RLASound?.coin(); window.RLAGameView?.toast('Mission reward credited!'); openMissionsModal(); }
          else window.RLAGameView?.toast(res.error || 'Not ready');
        } else {
          const res = window.RLAState.claimMission(b.dataset.claimM);
          if (res) { window.RLASound?.coin(); openMissionsModal(); }
        }
      });
    });
  }

  function openInventoryModal() {
    const s = window.RLAState.get();
    const renderCards = (items, owned, active, attr) => items.map(it => {
      const isOwned = owned.includes(it.id);
      const isAct = active === it.id;
      const btnText = isAct ? 'Equipped ✓' : isOwned ? 'Equip' : `${it.price} ${it.currency === 'diamonds' ? '💎' : '🪙'}`;
      return `<div class="rla-royal-card ${isAct ? 'active' : ''}">
        <strong style="font-size:13px">${it.name}</strong>
        <span style="font-size:11px;color:#e5c690">${it.desc}</span>
        <button type="button" class="rla-royal-btn ${isAct ? 'secondary' : ''}" data-${attr}="${it.id}" ${isAct ? 'disabled' : ''}>${btnText}</button>
      </div>`;
    }).join('');

    const veil = modal('ROYAL INVENTORY 🎒', `
      <p style="margin:0;font-weight:800;color:#ffe28a">3D Board Themes</p>
      <div class="rla-royal-grid">${renderCards(window.RLAState.BOARD_THEMES, s.inventory.ownedBoards, s.inventory.activeBoard, 'board')}</div>
      <p style="margin:8px 0 0;font-weight:800;color:#ffe28a">Dice Skins</p>
      <div class="rla-royal-grid">${renderCards(window.RLAState.DICE_SKINS, s.inventory.ownedDice, s.inventory.activeDice, 'dice')}</div>
    `, [], true);

    const handleBuy = async (kind, id) => {
      if (window.RLAClient?.isServerAvailable()) {
        const res = await window.RLAClient.buyOrEquipCosmetic(kind, id);
        if (!res.ok) window.RLAGameView?.toast(res.error || 'Failed');
        else { window.RLASound?.coin(); openInventoryModal(); }
      } else {
        const res = kind === 'board' ? window.RLAState.buyOrEquipBoard(id) : window.RLAState.buyOrEquipDice(id);
        if (!res.ok) window.RLAGameView?.toast(res.reason);
        else { window.RLASound?.coin(); openInventoryModal(); }
      }
    };
    veil.querySelectorAll('[data-board]').forEach(b => b.addEventListener('click', () => handleBuy('board', b.dataset.board)));
    veil.querySelectorAll('[data-dice]').forEach(b => b.addEventListener('click', () => handleBuy('dice', b.dataset.dice)));
  }

  async function openLeaderboardModal() {
    let board = window.RLAState.getLeaderboard();
    if (window.RLAClient?.isServerAvailable()) {
      const res = await window.RLAClient.fetchLeaderboard();
      if (res.ok && res.leaderboard.length) {
        const myId = window.RLAClient.getUserId();
        board = res.leaderboard.map(p => ({ ...p, isSelf: p.id === myId }));
      }
    }
    const rows = board.map((p, idx) => `
      <div class="rla-list-row ${p.isSelf ? 'self' : ''}">
        <span><strong>#${idx + 1}</strong> ${p.avatar} ${escapeHtml(p.name)} <small>(Lv.${p.level})</small></span>
        <span>🏆 ${p.wins} · 🪙 ${p.coins.toLocaleString()}</span>
      </div>
    `).join('');
    modal('ROYAL LEADERBOARD 🏆', `<div class="rla-list">${rows}</div>`, [], true);
  }

  function openStatsModal() {
    const s = window.RLAState.get();
    const xp = window.RLAState.xpProgress();
    const wr = s.stats.gamesPlayed ? Math.round((s.stats.wins / s.stats.gamesPlayed) * 100) : 0;
    modal('CAREER STATISTICS 📊', `
      <div style="text-align:center">
        <div style="font-size:28px">${s.profile.avatar}</div>
        <strong>${escapeHtml(s.profile.name)}</strong> · ID: ${s.profile.id}
        <div style="font-size:12px;color:#ffe28a;margin-top:4px">Level ${xp.level} (${xp.xp}/${xp.required} XP)</div>
        <div class="rla-progress-bar"><div class="rla-progress-fill" style="width:${xp.pct}%"></div></div>
      </div>
      <div class="rla-royal-grid" style="margin-top:8px">
        <div class="rla-royal-card"><span style="font-size:11px">Matches</span><strong>${s.stats.gamesPlayed}</strong></div>
        <div class="rla-royal-card"><span style="font-size:11px">Wins</span><strong>${s.stats.wins} (${wr}%)</strong></div>
        <div class="rla-royal-card"><span style="font-size:11px">Captures</span><strong>${s.stats.captures}</strong></div>
        <div class="rla-royal-card"><span style="font-size:11px">6s Rolled</span><strong>${s.stats.sixesRolled}</strong></div>
      </div>
    `, [], true);
  }

  function openInboxModal() {
    const inbox = window.RLAState.get().inbox;
    const rows = inbox.map(m => `
      <div class="rla-list-row ${!m.claimed ? 'self' : ''}" style="flex-direction:column;align-items:stretch;gap:6px">
        <div style="display:flex;justify-content:space-between"><strong>${escapeHtml(m.title)}</strong><small>${m.date}</small></div>
        <div style="font-size:13px">${escapeHtml(m.body)}</div>
      </div>
    `).join('');
    modal('ROYAL INBOX ✉️', `<div class="rla-list">${rows}</div>`, [], true);
  }

  async function openFreeChestModal() {
    if (window.RLAClient?.isServerAvailable()) {
      const res = await window.RLAClient.claimFreeChest();
      if (res.ok) {
        window.RLASound?.coin();
        modal('FREE ROYAL CHEST 🪙', `Demo server: +${res.coins} Coins credited to your preview wallet.`);
      } else {
        const mins = Math.ceil((res.remainingMs || 60000) / 60000);
        modal('FREE ROYAL CHEST ⏳', `Next server-verified chest unlocks in ${mins} minute(s).`);
      }
      return;
    }
    const rem = window.RLAState.freeChestCooldownMs();
    if (rem <= 0) {
      const res = window.RLAState.claimFreeChest();
      window.RLASound?.coin();
      modal('FREE ROYAL CHEST 🪙', `Received +${res.coins} Coins! Come back in 30 minutes.`);
    } else {
      modal('FREE ROYAL CHEST ⏳', `Next free chest unlocks in ${Math.ceil(rem / 60000)} minute(s).`);
    }
  }

  function openSettingsModal() {
    const st = window.RLAState.getSettings();
    const veil = modal('GAME SETTINGS ⚙️', `
      <div class="rla-list">
        <div class="rla-list-row"><span>🔊 Sound Effects</span><label class="rla-switch"><input type="checkbox" id="set-sfx" ${st.sfx !== false ? 'checked' : ''}></label></div>
        <div class="rla-list-row"><span>📳 Haptic Vibration</span><label class="rla-switch"><input type="checkbox" id="set-hap" ${st.haptics !== false ? 'checked' : ''}></label></div>
        <div class="rla-list-row"><span>⚡ Fast 2x Animations</span><label class="rla-switch"><input type="checkbox" id="set-spd" ${st.fastSpeed ? 'checked' : ''}></label></div>
        <div class="rla-list-row"><span>🤖 Auto-Move Single Valid Pawn</span><label class="rla-switch"><input type="checkbox" id="set-auto" ${st.autoSingleMove !== false ? 'checked' : ''}></label></div>
      </div>
    `, [['Done', () => {}]], true);
    veil.querySelector('#set-sfx')?.addEventListener('change', e => window.RLAState.updateSettings({ sfx: e.target.checked }));
    veil.querySelector('#set-hap')?.addEventListener('change', e => window.RLAState.updateSettings({ haptics: e.target.checked }));
    veil.querySelector('#set-spd')?.addEventListener('change', e => window.RLAState.updateSettings({ fastSpeed: e.target.checked }));
    veil.querySelector('#set-auto')?.addEventListener('change', e => window.RLAState.updateSettings({ autoSingleMove: e.target.checked }));
  }

  function openSecureCheckoutModal(hit) {
    modal('STORE PURCHASES NOT YET AVAILABLE', `
      <p style="margin:0;font-weight:800;color:#ffe28a">${escapeHtml(hit.value)} (SKU: ${escapeHtml(hit.sku || 'unknown')})</p>
      <p style="margin-top:10px;font-size:13px;line-height:1.5">This is a preview of a future store pack. No payment will be collected and no virtual currency will be credited.</p>
      <p class="rla-hint">Payments require a separately verified provider, server-created order, and durable fulfilment ledger. They cannot be enabled by entering an API secret alone.</p>
    `, [], true);
  }

  function go(to) {
    const old = location.hash.slice(1);
    if (old === to) draw();
    else location.hash = to;
  }

  function apply(hit) {
    switch (hit.action) {
      case 'route': go(hit.to); break;
      case 'info': modal(hit.label, hit.message); break;
      case 'edit': openEditProfile(); break;
      case 'copy': {
        const pid = window.RLAState?.get().profile.id || 'RL782346';
        navigator.clipboard?.writeText(pid).catch(() => {});
        window.RLAGameView?.toast(`Player ID ${pid} copied!`);
        break;
      }
      case 'mode': state.mode = hit.value; draw(); break;
      case 'daily-reward': openDailyRewardModal(); break;
      case 'lucky-spin': openLuckySpinModal(); break;
      case 'missions': openMissionsModal(); break;
      case 'inventory': openInventoryModal(); break;
      case 'leaderboard': openLeaderboardModal(); break;
      case 'stats': openStatsModal(); break;
      case 'inbox': openInboxModal(); break;
      case 'free-chest': openFreeChestModal(); break;
      case 'settings': openSettingsModal(); break;
      case 'tournament': window.RLAGameView?.openTournamentModal(); break;
      case 'vip': modal('ROYAL VIP CLUB 👑', 'Unlock exclusive 3D Board Themes & Dice Skins from Inventory using server-verified Coins & Diamonds.'); break;
      case 'club': modal('ROYAL CLUBS 🛡️', 'Team up right now in 2v2 Team Battle (Duo Party) or Private Rooms!'); break;
      case 'social': modal('FRIENDS & INVITE 🤝', `Share your Player ID (${window.RLAState?.get().profile.id || 'RL782346'}) or open Play With Friends to create a live 6-digit Private Room.`, [['Open Play With Friends', () => go('friends')]]); break;
      case 'help': modal('ROYAL LUDO ARENA HELP ❓', '• Roll 6 to exit base.\n• Star tiles (★) are safe zones.\n• In 2v2 Team Battle, finishing all 4 pawns activates Partner Finish Assist!\n• Press Spacebar during your turn to roll.'); break;
      case 'purchase': openSecureCheckoutModal(hit); break;
      case 'gift': openSecureCheckoutModal(hit); break;
    }
  }

  function drawExtended(route) {
    const data = ROUTES[route];
    const stage = document.createElement('section');
    stage.className = 'rla-extended-stage';
    stage.setAttribute('aria-label', data.label);
    stage.style.setProperty('--art-ratio', `${data.width}/${data.height}`);
    stage.style.setProperty('--stage-bg', '#351809');
    const img = document.createElement('img');
    img.className = 'rla-source-art';
    img.src = `./assets/screens/${data.file}.jpg`;
    img.alt = '';
    img.draggable = false;
    stage.append(img);
    for (const hit of HITS[route]) stage.append(overlay(hit, [data.width, data.height]));

    if (route === 'profile' && window.RLAState) {
      const s = window.RLAState.get();
      const tag = document.createElement('div');
      tag.className = 'rla-live-profile';
      tag.textContent = `${s.profile.avatar} ${s.profile.name} · Lv.${s.progression.level} · 🪙${s.currency.coins.toLocaleString()}`;
      stage.append(tag);
    }
    if (route === 'store' || route === 'store-compact') {
      const area = document.createElement('div');
      area.className = 'rla-preview-label';
      area.textContent = 'Server-Verified Billing · Anti-Fraud Enabled';
      stage.append(area);
      if (state.mode !== 'coins') {
        const panel = document.createElement('section');
        panel.className = 'rla-tab-panel';
        const title = document.createElement('h2');
        title.textContent = state.mode === 'diamonds' ? 'Diamond Store' : 'Royal Offers';
        panel.append(title);
        const list = state.mode === 'diamonds'
          ? [['100 Diamonds — ₹79', 'diamonds_100'], ['500 Diamonds — ₹329', 'diamonds_500'], ['2,000 Diamonds — ₹999', 'diamonds_2000']]
          : [['Royal Coin Bundle — ₹480', 'royal_bundle'], ['King Pass — ₹599', 'king_pass']];
        for (const [label, sku] of list) {
          const b = document.createElement('button');
          b.textContent = label;
          b.addEventListener('click', () => openSecureCheckoutModal({ sku, value: label }));
          panel.append(b);
        }
        if (state.mode === 'offers') {
          const gift = document.createElement('button');
          gift.textContent = 'Open Send Gift';
          gift.addEventListener('click', () => go('send-gift'));
          panel.append(gift);
        }
        stage.append(panel);
      }
    }
    return stage;
  }

  function enhanceHome() {
    const stage = root()?.querySelector('.artboard');
    if (!stage) return;
    stage.querySelectorAll('.rla-home-hit').forEach(el => el.remove());
    for (const hit of HOME) {
      const b = overlay(hit, HOME_RECT);
      b.classList.add('rla-home-hit');
      stage.append(b);
    }
  }

  function enhanceOldScreens(route) {
    const stage = root()?.querySelector('.artboard');
    if (!stage) return;
    stage.querySelectorAll('.rla-home-hit').forEach(el => el.remove());
    if (route !== 'home' && ['online', 'team', 'friends', 'computer', 'pass'].includes(route)) {
      const h = [...COMMON, btn('header-back', 'Back to home', [18, 128, 116, 116], 'route', { to: 'home' })];
      for (const hit of h) {
        const b = overlay(hit, HOME_RECT);
        b.classList.add('rla-home-hit');
        stage.append(b);
      }
    }
  }

  function draw() {
    const route = fromHash();
    if (!root() || route === 'play') return;
    if (ROUTES[route]) {
      const main = document.createElement('div');
      main.className = 'rla-extra-shell';
      main.append(drawExtended(route));
      root().replaceChildren(main);
      document.title = `${ROUTES[route].label} — Royal Ludo Arena`;
      return;
    }
    if (route === 'home' || route === '') enhanceHome();
    else enhanceOldScreens(route);
  }

  window.addEventListener('hashchange', () => queueMicrotask(draw));
  window.addEventListener('DOMContentLoaded', draw);
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && ROUTES[fromHash()] && !document.getElementById('rla-dialog')) go('home');
  });
  queueMicrotask(draw);

  return { routes: Object.keys(ROUTES), go, draw, inspect: () => ({ routes: ROUTES, hits: HITS, home: HOME }) };
})();
