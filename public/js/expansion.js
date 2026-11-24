/**
 * Royal Ludo Arena V3.0.0 — 100% Native 3D Componentized Extended Screens & Modals
 * Replaces all baked JPG overlays with live interactive Profile, Events, Daily Goals,
 * Store, Send Gift, Club, Inventory, Social, and More screens.
 */
const RLA = (() => {
  const ROUTES = Object.freeze({
    events: { label: 'Events', nav: 'events' },
    profile: { label: 'My Profile', nav: 'home' },
    store: { label: 'Royal Store', nav: 'home' },
    'store-compact': { label: 'Royal Store', nav: 'home' },
    'daily-goals': { label: 'Daily Goals', nav: 'events' },
    'send-gift': { label: 'Send Gift', nav: 'social' },
    club: { label: 'Royal Club', nav: 'club' },
    inventory: { label: 'Royal Inventory', nav: 'inventory' },
    social: { label: 'Social & Friends', nav: 'social' },
    more: { label: 'Settings & More', nav: 'more' }
  });

  const STORE_PACKS = {
    coins: [
      { sku: 'royal_bundle', art: 'royal_bundle', icon: '👑', name: 'Royal Coin Bundle', sub: '250,000 Coins + 50 💎', price: '₹480' },
      { sku: 'coins_25k', art: 'coins_25k', icon: '🪙', name: '25,000 Coins', sub: 'Starter Pouch', price: '₹100' },
      { sku: 'coins_100k', art: 'coins_100k', icon: '🪙', name: '100,000 Coins', sub: 'Noble Bag', price: '₹180' },
      { sku: 'coins_500k', art: 'coins_500k', icon: '💰', name: '500,000 Coins', sub: 'Royal Chest', price: '₹480' },
      { sku: 'coins_1m', art: 'coins_1m', icon: '💰', name: '1,000,000 Coins', sub: 'Maharaja Vault', price: '₹690' },
      { sku: 'coins_5m', art: 'coins_5m', icon: '🏆', name: '5,000,000 Coins', sub: 'Imperial Treasury', price: '₹1,800' }
    ],
    diamonds: [
      { sku: 'diamonds_100', icon: '💎', name: '100 Diamonds', sub: 'Gem Pouch', price: '₹79' },
      { sku: 'diamonds_500', icon: '💎', name: '500 Diamonds', sub: 'Gem Satchel', price: '₹329' },
      { sku: 'diamonds_2000', icon: '💠', name: '2,000 Diamonds', sub: 'Crown Jewels', price: '₹999' }
    ],
    offers: [
      { sku: 'king_pass', icon: '👑', name: 'Season 28 King Pass', sub: '150,000 Coins + 100 💎 + Perks', price: '₹599' },
      { sku: 'royal_bundle', icon: '🎁', name: 'Royal Starter Bundle', sub: '250,000 Coins + 50 💎', price: '₹480' }
    ]
  };

  const state = { storeTab: 'coins' };
  const fromHash = () => decodeURIComponent(location.hash.slice(1).split('?')[0]);
  const root = () => document.getElementById('app');
  const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  function go(to) {
    if (window.RLAShell) window.RLAShell.go(to);
    else location.hash = to;
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

  /* ===================== NATIVE LIVE SCREENS ===================== */
  function renderProfileScreen() {
    const s = window.RLAState.get();
    const xp = window.RLAState.xpProgress();
    const played = s.stats.gamesPlayed || 0;
    const wins = s.stats.wins || 0;
    const losses = Math.max(0, played - wins);
    const winRate = played ? Math.round((wins / played) * 100) : 0;
    const board = window.RLAState.getLeaderboard();
    const myRank = Math.max(1, board.findIndex(p => p.isSelf) + 1);
    const avatarHtml = (s.profile.avatar === '👑' || !s.profile.avatar)
      ? `<img src="./assets/game/avatar-hero.webp" alt="Profile Avatar">`
      : `<div style="width:100%;height:100%;display:grid;place-items:center;font-size:38px">${escapeHtml(s.profile.avatar)}</div>`;

    return `
      <div class="v3-screen-head">
        <button type="button" class="v3-round-btn" data-nav="home" aria-label="Back">←</button>
        <div class="v3-ribbon"><h1 class="v3-ribbon-title">👑 My Profile</h1></div>
        <button type="button" class="v3-round-btn" data-open="help" aria-label="Help">?</button>
      </div>

      <div class="v3-panel">
        <div class="v3-profile-hero">
          <div class="v3-profile-avatar-box">${avatarHtml}</div>
          <div style="min-width:0">
            <div style="font-size:17px;font-weight:900;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(s.profile.name)} <span style="color:#38bdf8">✔</span></div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:2px">
              <span style="font-size:11px;color:#ffe28a;font-weight:800">ID: ${escapeHtml(s.profile.id)}</span>
              <button type="button" class="rla-royal-btn secondary" id="v3-copy-pid" style="padding:2px 7px;font-size:10px">Copy</button>
            </div>
            <div style="font-size:11.5px;color:#f3dba4;margin-top:4px">${escapeHtml(s.profile.bio)}</div>
          </div>
          <div class="v3-lvl-shield">
            <small>LEVEL</small>
            <strong>${xp.level}</strong>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;font-size:11.5px;font-weight:800;color:#ffe680">
          <span>★ Level Progress</span>
          <span>Lv.${xp.level} (${xp.xp} / ${xp.required} XP · ${xp.pct}%)</span>
        </div>
        <div class="rla-progress-bar" style="height:10px"><div class="rla-progress-fill" style="width:${xp.pct}%"></div></div>
      </div>

      <div class="v3-panel">
        <span class="v3-section-pill">This Device · Game Statistics</span>
        <div class="v3-stats-grid">
          <div class="v3-stat-box"><strong>🏆 ${wins}</strong><span>Games Won</span></div>
          <div class="v3-stat-box"><strong>📉 ${losses}</strong><span>Games Lost</span></div>
          <div class="v3-stat-box"><strong>🔥 ${s.stats.bestStreak || 0}</strong><span>Best Streak</span></div>
          <div class="v3-stat-box"><strong>⚔️ ${s.stats.captures || 0}</strong><span>Pawns Captured</span></div>
          <div class="v3-stat-box"><strong>🎲 ${s.stats.sixesRolled || 0}</strong><span>6s Rolled</span></div>
          <div class="v3-stat-box"><strong>⭐ ${winRate}%</strong><span>Win Rate</span></div>
          <div class="v3-stat-box"><strong>👑 ${s.stats.tournamentsWon || 0}</strong><span>Tournaments</span></div>
          <div class="v3-stat-box"><strong>🏅 #${myRank}</strong><span>Arena Rank</span></div>
          <div class="v3-stat-box"><strong>🎮 ${played}</strong><span>Total Matches</span></div>
        </div>
      </div>

      <div class="v3-grid-3">
        <button type="button" class="rla-royal-btn" id="v3-edit-profile">✏️ Edit Profile</button>
        <button type="button" class="rla-royal-btn secondary" data-open="leaderboard">🏆 Ranks</button>
        <button type="button" class="rla-royal-btn secondary" data-open="settings">⚙️ Settings</button>
      </div>
    `;
  }

  function renderEventsScreen() {
    const dailyReady = window.RLAState.canClaimDailyReward();
    const readyMissions = window.RLAState.get().missions.filter(m => !m.claimed && m.progress >= m.target).length;
    return `
      <div class="v3-screen-head">
        <button type="button" class="v3-round-btn" data-nav="home" aria-label="Back">←</button>
        <div class="v3-ribbon"><h1 class="v3-ribbon-title">📅 Events & Rewards</h1></div>
        <button type="button" class="v3-round-btn" data-open="help" aria-label="Help">?</button>
      </div>

      <div class="v3-event-card">
        <span class="v3-event-ico">👑</span>
        <div class="v3-event-info">
          <h3>Season 28 Pass</h3>
          <p>Play matches, level up & unlock exclusive Board Themes & Dice Skins.</p>
        </div>
        <button type="button" class="rla-royal-btn" data-nav="inventory">Open ›</button>
      </div>

      <div class="v3-event-card">
        <span class="v3-event-ico">🎯</span>
        <div class="v3-event-info">
          <h3>Daily Goals ${readyMissions ? `(${readyMissions} Ready!)` : ''}</h3>
          <p>Complete match objectives to earn practice rewards. Online rewards require the connected game server.</p>
        </div>
        <button type="button" class="rla-royal-btn" data-nav="daily-goals">Open ›</button>
      </div>

      <div class="v3-event-card">
        <span class="v3-event-ico">🎁</span>
        <div class="v3-event-info">
          <h3>7-Day Daily Bonus ${dailyReady ? '· READY' : ''}</h3>
          <p>Check in daily to climb your streak up to 5,000 Coins + 50 Diamonds!</p>
        </div>
        <button type="button" class="rla-royal-btn" data-open="daily-reward">Claim ›</button>
      </div>

      <div class="v3-event-card">
        <span class="v3-event-ico">🏆</span>
        <div class="v3-event-info">
          <h3>Royal Knockout Tournament</h3>
          <p>Win the 4-Player Semi-Final & Grand Final to claim the 5,000 Coins Trophy!</p>
        </div>
        <button type="button" class="rla-royal-btn" data-open="tournament">Play ›</button>
      </div>
    `;
  }

  function renderDailyGoalsScreen() {
    const s = window.RLAState.get();
    const rows = s.missions.map(m => {
      const done = m.progress >= m.target;
      const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
      const rewardStr = `${m.rewardCoins ? `${m.rewardCoins} 🪙` : ''}${m.rewardDiamonds ? ` ${m.rewardDiamonds} 💎` : ''}`;
      return `<div class="rla-list-row ${done && !m.claimed ? 'self' : ''}">
        <div style="flex:1;min-width:0">
          <div style="font-weight:800;font-size:13px">${escapeHtml(m.title)} (${m.progress}/${m.target})</div>
          <div style="font-size:11px;color:#e8c78b">Reward: ${rewardStr}</div>
          <div class="rla-progress-bar"><div class="rla-progress-fill" style="width:${pct}%"></div></div>
        </div>
        ${m.claimed
          ? '<span style="color:#86f28a;font-weight:800;font-size:12px">Claimed ✓</span>'
          : done
            ? `<button type="button" class="rla-royal-btn" data-claim-m="${m.id}" style="padding:6px 11px;font-size:12px">Claim</button>`
            : `<span style="font-size:11px;color:#cbb089">${pct}%</span>`}
      </div>`;
    }).join('');

    return `
      <div class="v3-screen-head">
        <button type="button" class="v3-round-btn" data-nav="events" aria-label="Back">←</button>
        <div class="v3-ribbon"><h1 class="v3-ribbon-title">🎯 Daily Goals</h1></div>
        <button type="button" class="v3-round-btn" data-nav="home" aria-label="Home">🏠</button>
      </div>
      <div class="v3-panel"><div class="rla-list">${rows}</div></div>
      <button type="button" class="v3-cta-btn gold" id="v3-claim-all-m">Claim All Ready Rewards</button>
    `;
  }

  function renderStoreScreen() {
    const packs = STORE_PACKS[state.storeTab] || STORE_PACKS.coins;
    return `
      <header class="v3-screen-head rla-store-art-header" aria-label="Royal Store">
        <button type="button" class="rla-store-art-icon" data-nav="home" aria-label="Back to Home">
          <img src="./assets/ui/royal-store-chrome/back.webp" alt="" width="512" height="512" decoding="async">
        </button>
        <h1 class="rla-store-art-title">
          <img src="./assets/ui/royal-store-chrome/header.webp" alt="Royal Store" width="860" height="154" decoding="async">
        </h1>
        <button type="button" class="rla-store-art-icon" data-nav="send-gift" aria-label="Open Send Gift">
          <img src="./assets/ui/royal-store-chrome/gift.webp" alt="" width="512" height="512" decoding="async">
        </button>
      </header>
      <div class="v3-grid-3 rla-store-art-tabs" role="group" aria-label="Store categories">
        <button type="button" class="rla-store-art-tab" data-store-tab="coins" aria-label="Coins" aria-pressed="${state.storeTab === 'coins'}">
          <img src="./assets/ui/royal-store-chrome/coins.webp" alt="" width="640" height="233" decoding="async">
        </button>
        <button type="button" class="rla-store-art-tab" data-store-tab="diamonds" aria-label="Diamonds" aria-pressed="${state.storeTab === 'diamonds'}">
          <img src="./assets/ui/royal-store-chrome/diamonds.webp" alt="" width="640" height="236" decoding="async">
        </button>
        <button type="button" class="rla-store-art-tab" data-store-tab="offers" aria-label="Offers" aria-pressed="${state.storeTab === 'offers'}">
          <img src="./assets/ui/royal-store-chrome/offers.webp" alt="" width="640" height="239" decoding="async">
        </button>
      </div>
      <div class="v3-grid-2 rla-store-grid" aria-label="${state.storeTab === 'coins' ? 'Coin packs' : 'Store packs'}">
        ${packs.map(p => `
          <article class="rla-royal-card ${p.art && state.storeTab === 'coins' ? 'rla-coin-art-card' : ''}" aria-label="${p.name}, ${p.sub}, ${p.price}">
            ${p.art && state.storeTab === 'coins' ? `
              <img class="rla-coin-pack-image" src="./assets/ui/royal-coin-store-centered/${p.art}.webp"
                width="1040" height="840" alt="${p.name} — ${p.sub}" loading="lazy" decoding="async">` : `
              <span style="font-size:28px">${p.icon}</span>
              <strong style="font-size:13px">${p.name}</strong>
              <span style="font-size:10.5px;color:#e8c78b">${p.sub}</span>`}
            <button type="button" class="rla-royal-btn rla-coin-pack-price" data-buy-sku="${p.sku}" data-buy-label="${p.name} — ${p.price}" aria-label="View ${p.name}, price ${p.price}; checkout not available">${p.price}</button>
          </article>
        `).join('')}
      </div>
      <p style="margin:0;font-size:11px;text-align:center;color:#e6c68a">🔒 Store checkout is disabled in this preview. No payment will be charged and no purchase currency will be credited.</p>
    `;
  }

  function renderInventoryScreen() {
    const s = window.RLAState.get();
    const renderCards = (items, owned, active, attr) => items.map(it => {
      const isOwned = owned.includes(it.id);
      const isAct = active === it.id;
      const btnText = isAct ? 'Equipped ✓' : isOwned ? 'Equip' : `${it.price} ${it.currency === 'diamonds' ? '💎' : '🪙'}`;
      return `<div class="rla-royal-card ${isAct ? 'active' : ''}">
        <strong style="font-size:13px">${it.name}</strong>
        <span style="font-size:10.5px;color:#e5c690">${it.desc}</span>
        <button type="button" class="rla-royal-btn ${isAct ? 'secondary' : ''}" data-${attr}="${it.id}" ${isAct ? 'disabled' : ''}>${btnText}</button>
      </div>`;
    }).join('');

    return `
      <div class="v3-screen-head">
        <button type="button" class="v3-round-btn" data-nav="home" aria-label="Back">←</button>
        <div class="v3-ribbon"><h1 class="v3-ribbon-title">🎒 Royal Inventory</h1></div>
        <button type="button" class="v3-round-btn" data-nav="store" aria-label="Store">🛒</button>
      </div>
      <div class="v3-panel">
        <span class="v3-section-pill">Board Themes</span>
        <div class="rla-royal-grid">${renderCards(window.RLAState.BOARD_THEMES, s.inventory.ownedBoards, s.inventory.activeBoard, 'board')}</div>
      </div>
      <div class="v3-panel">
        <span class="v3-section-pill">Dice Skins</span>
        <div class="rla-royal-grid">${renderCards(window.RLAState.DICE_SKINS, s.inventory.ownedDice, s.inventory.activeDice, 'dice')}</div>
      </div>
    `;
  }

  function renderClubScreen() {
    return `
      <div class="v3-screen-head">
        <button type="button" class="v3-round-btn" data-nav="home" aria-label="Back">←</button>
        <div class="v3-ribbon"><h1 class="v3-ribbon-title">🛡️ Royal Club & 2v2</h1></div>
        <button type="button" class="v3-round-btn" data-open="leaderboard" aria-label="Ranks">🏆</button>
      </div>
      <div class="v3-event-card">
        <span class="v3-event-ico">🤝</span>
        <div class="v3-event-info">
          <h3>2v2 Duo Party</h3>
          <p>Lock in with a friend on Team 1 (Blue + Green) with Partner Finish Assist!</p>
        </div>
        <button type="button" class="rla-royal-btn" data-nav="team">Play 2v2</button>
      </div>
      <div class="v3-event-card">
        <span class="v3-event-ico">🏰</span>
        <div class="v3-event-info">
          <h3>Friends Private Room</h3>
          <p>Create a 6-digit private room on the connected server; offline practice uses local players or bots.</p>
        </div>
        <button type="button" class="rla-royal-btn" data-nav="friends">Create</button>
      </div>
    `;
  }

  function renderSocialScreen() {
    const pid = window.RLAState.get().profile.id;
    return `
      <div class="v3-screen-head">
        <button type="button" class="v3-round-btn" data-nav="home" aria-label="Back">←</button>
        <div class="v3-ribbon"><h1 class="v3-ribbon-title">💬 Social & Friends</h1></div>
        <button type="button" class="v3-round-btn" data-nav="send-gift" aria-label="Gift">🎁</button>
      </div>
      <div class="v3-panel">
        <span class="v3-section-pill">Your Player Invite ID</span>
        <div style="display:flex;align-items:center;justify-content:space-between;background:#240d04;padding:10px 12px;border-radius:11px;border:1.5px solid #f4bd3b">
          <strong style="font-size:18px;letter-spacing:0.12em;color:#ffe680">${escapeHtml(pid)}</strong>
          <button type="button" class="rla-royal-btn" id="v3-copy-pid">Copy ID</button>
        </div>
        <div class="v3-grid-2">
          <button type="button" class="v3-cta-btn gold" data-nav="friends" style="font-size:13px;padding:10px">🔑 Private Room</button>
          <button type="button" class="v3-cta-btn" data-nav="team" style="font-size:13px;padding:10px">🤝 2v2 Duo Party</button>
        </div>
      </div>
    `;
  }

  function renderMoreScreen() {
    const st = window.RLAState.getSettings();
    const online = Boolean(window.RLAClient?.isOnline());
    return `
      <div class="v3-screen-head">
        <button type="button" class="v3-round-btn" data-nav="home" aria-label="Back">←</button>
        <div class="v3-ribbon"><h1 class="v3-ribbon-title">⚙️ Settings & More</h1></div>
        <button type="button" class="v3-round-btn" data-open="help" aria-label="Help">?</button>
      </div>
      <div class="v3-panel">
        <span class="v3-section-pill">Audio & Gameplay</span>
        <div class="rla-list">
          <div class="rla-list-row"><span>🔊 Sound Effects</span><label class="rla-switch"><input type="checkbox" id="set-sfx" ${st.sfx !== false ? 'checked' : ''}></label></div>
          <div class="rla-list-row"><span>📳 Haptic Vibration</span><label class="rla-switch"><input type="checkbox" id="set-hap" ${st.haptics !== false ? 'checked' : ''}></label></div>
          <div class="rla-list-row"><span>⚡ Fast 2x Animations</span><label class="rla-switch"><input type="checkbox" id="set-spd" ${st.fastSpeed ? 'checked' : ''}></label></div>
          <div class="rla-list-row"><span>🤖 Auto-Move Single Pawn</span><label class="rla-switch"><input type="checkbox" id="set-auto" ${st.autoSingleMove !== false ? 'checked' : ''}></label></div>
        </div>
      </div>
      <div class="v3-panel">
        <span class="v3-section-pill">Connection Status</span>
        <div class="rla-list-row">
          <span>Server Engine</span>
          <strong style="color:${online ? '#4ade80' : '#fbbf24'}">${online ? '🟢 Live WebSocket Connected' : '🟡 Local Offline Mode'}</strong>
        </div>
        <button type="button" class="rla-royal-btn secondary" data-open="leaderboard">🏆 View Global Leaderboard</button>
      </div>
    `;
  }

  /* ===================== INTERACTIVE FEATURE MODALS ===================== */
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
          try {
            const result = await window.RLAClient.updateProfile({ name, bio, avatar: chosenAvatar });
            if (!result?.ok) { window.RLAGameView?.toast(result?.error || 'Server did not save profile.'); return; }
          } catch { window.RLAGameView?.toast('Connection lost. Profile was not saved.'); return; }
        } else window.RLAState.updateProfile({ name, bio, avatar: chosenAvatar });
        window.RLASound?.coin();
        window.RLAGameView?.toast('Profile saved!');
        draw();
      }]
    ], true);
    veil.querySelectorAll('[data-av]').forEach(b => b.addEventListener('click', () => {
      chosenAvatar = b.dataset.av;
      veil.querySelectorAll('[data-av]').forEach(x => x.classList.add('secondary'));
      b.classList.remove('secondary');
    }));
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
      <p style="margin:0;text-align:center">Streak: <strong>${s.dailyReward.streakDay} Day(s)</strong></p>
      <div class="rla-royal-grid">${cards}</div>
    `, canClaim ? [
      ['Claim Today\'s Reward', async () => {
        if (window.RLAClient?.isServerAvailable()) {
          const res = await window.RLAClient.claimDailyReward();
          if (res.ok) { window.RLASound?.coin(); window.RLAGameView?.toast(`Claimed ${res.reward.label}!`); openDailyRewardModal(); }
          else window.RLAGameView?.toast(res.error || 'Already claimed');
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
        ${canFree ? 'Daily FREE Spin ready!' : `Spin for 10 💎 (Balance: ${diamonds} 💎)`}
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
        if (!res.ok) { window.RLAGameView?.toast(res.error || 'Cannot spin'); spinning = false; spinBtn.disabled = false; return; }
        winIdx = res.winIndex;
        serverPrize = res.prize;
      } else {
        const freeNow = window.RLAState.canFreeSpin();
        if (!freeNow && !window.RLAState.spendCurrency(0, 10)) { window.RLAGameView?.toast('Not enough Diamonds!'); spinning = false; spinBtn.disabled = false; return; }
        window.RLAState.recordSpin(freeNow, prizes[winIdx].coins, prizes[winIdx].diamonds);
      }
      const targetDeg = 360 * 5 + (360 - (winIdx + 0.5) * segAngle);
      svg.style.transform = `rotate(${targetDeg}deg)`;
      let ticks = 0;
      const tickInt = setInterval(() => { ticks++; window.RLASound?.spinTick(); if (ticks >= 18) clearInterval(tickInt); }, 170);
      setTimeout(() => {
        clearInterval(tickInt);
        window.RLASound?.victory();
        status.textContent = `🎉 WON ${(serverPrize || prizes[winIdx]).label}!`;
        spinning = false;
        spinBtn.disabled = false;
        spinBtn.textContent = '💎 SPIN AGAIN (10 💎)';
      }, 3900);
    });
  }

  async function openLeaderboardModal() {
    let board = window.RLAState.getLeaderboard();
    if (window.RLAClient?.isServerAvailable()) {
      const res = await window.RLAClient.fetchLeaderboard();
      if (res?.ok && Array.isArray(res.leaderboard) && res.leaderboard.length) {
        const myId = window.RLAClient.getUserId();
        board = res.leaderboard.map(p => ({ ...p, isSelf: p.id === myId }));
      }
    }
    const rows = board.map((p, idx) => `
      <div class="rla-list-row ${p.isSelf ? 'self' : ''}">
        <span><strong>#${idx + 1}</strong> ${escapeHtml(p.avatar)} ${escapeHtml(p.name)} <small>(Lv.${p.level})</small></span>
        <span>🏆 ${p.wins} · 🪙 ${p.coins.toLocaleString()}</span>
      </div>
    `).join('');
    modal(window.RLAClient?.isServerAvailable() ? 'SERVER LEADERBOARD 🏆' : 'PRACTICE LEADERBOARD 🏆', `<div class="rla-list">${rows}</div>`, [], true);
  }

  function openInboxModal() {
    const inbox = window.RLAState.get().inbox;
    const rows = inbox.map(m => `
      <div class="rla-list-row ${!m.claimed ? 'self' : ''}" style="flex-direction:column;align-items:stretch;gap:6px">
        <div style="display:flex;justify-content:space-between"><strong>${escapeHtml(m.title)}</strong><small>${escapeHtml(m.date)}</small></div>
        <div style="font-size:13px">${escapeHtml(m.body)}</div>
      </div>
    `).join('');
    modal('ROYAL INBOX ✉️', `<div class="rla-list">${rows}</div>`, [], true);
  }

  async function openFreeChestModal() {
    if (window.RLAClient?.isServerAvailable()) {
      const res = await window.RLAClient.claimFreeChest();
      if (res?.ok) { window.RLASound?.coin(); modal('FREE ROYAL CHEST 🪙', `Server credited +${res.coins} Coins (preview storage).`); }
      else modal('FREE ROYAL CHEST ⏳', `Next chest unlocks in ${Math.ceil((res.remainingMs || 60000) / 60000)} minute(s).`);
      return;
    }
    const rem = window.RLAState.freeChestCooldownMs();
    if (rem <= 0) { const r = window.RLAState.claimFreeChest(); window.RLASound?.coin(); modal('FREE ROYAL CHEST 🪙', `Received +${r.coins} Coins!`); }
    else modal('FREE ROYAL CHEST ⏳', `Next chest unlocks in ${Math.ceil(rem / 60000)} minute(s).`);
  }

  function openSecureCheckoutModal(sku, label) {
    modal('STORE PURCHASES NOT YET AVAILABLE 🔒', `
      <p style="margin:0;font-weight:800;color:#ffe28a">${escapeHtml(label)} (SKU: ${escapeHtml(sku)})</p>
      <p style="margin:0;font-size:13px;line-height:1.45">
        Live payment fulfillment is disabled in this build, so no virtual currency will be credited until your production backend verifies a signed receipt via:
      </p>
      <div class="rla-list">
        <div class="rla-list-row"><span><strong>Razorpay HMAC</strong></span><code>/api/payments/razorpay/verify</code></div>
        <div class="rla-list-row"><span><strong>Google Play Billing</strong></span><code>/api/payments/google-play/verify</code></div>
      </div>
    `, [], true);
  }

  function openFeature(name) {
    switch (name) {
      case 'daily-reward': openDailyRewardModal(); break;
      case 'lucky-spin': openLuckySpinModal(); break;
      case 'leaderboard': openLeaderboardModal(); break;
      case 'inbox': openInboxModal(); break;
      case 'free-chest': openFreeChestModal(); break;
      case 'tournament': window.RLAGameView?.openTournamentModal(); break;
      case 'settings': go('more'); break;
      case 'vip': modal('ROYAL VIP CLUB 👑', 'Unlock Board Themes & Dice Skins in Inventory using earned Coins & Diamonds!'); break;
      case 'help': modal('ROYAL LUDO ARENA HELP ❓', '• Roll 6 to exit base.\n• Star tiles (★) are safe zones.\n• In 2v2 Team Battle, finishing all 4 pawns activates Partner Finish Assist!\n• Press Spacebar during your turn to roll dice.'); break;
    }
  }

  function draw() {
    const route = fromHash();
    if (!root() || !ROUTES[route] || !window.RLAShell) return;

    let bodyHtml = '';
    if (route === 'profile') bodyHtml = renderProfileScreen();
    else if (route === 'events') bodyHtml = renderEventsScreen();
    else if (route === 'daily-goals') bodyHtml = renderDailyGoalsScreen();
    else if (route === 'store' || route === 'store-compact' || route === 'send-gift') bodyHtml = renderStoreScreen();
    else if (route === 'inventory') bodyHtml = renderInventoryScreen();
    else if (route === 'club') bodyHtml = renderClubScreen();
    else if (route === 'social') bodyHtml = renderSocialScreen();
    else if (route === 'more') bodyHtml = renderMoreScreen();

    document.title = `${ROUTES[route].label} | Royal Ludo Arena`;
    root().innerHTML = window.RLAShell.renderGameShell(ROUTES[route].nav, bodyHtml);
    window.RLAShell.bindShellEvents(root());

    // Bind screen-specific interactions
    root().querySelector('#v3-copy-pid')?.addEventListener('click', async () => {
      const pid = window.RLAState.get().profile.id;
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(pid);
        window.RLAGameView?.toast('Player ID copied!');
      } catch {
        modal('Your Player ID', pid);
      }
    });
    root().querySelector('#v3-edit-profile')?.addEventListener('click', openEditProfile);

    root().querySelectorAll('[data-claim-m]').forEach(b => b.addEventListener('click', async () => {
      if (window.RLAClient?.isServerAvailable()) {
        const res = await window.RLAClient.claimMission(b.dataset.claimM);
        if (res.ok) { window.RLASound?.coin(); draw(); }
      } else if (window.RLAState.claimMission(b.dataset.claimM)) {
        window.RLASound?.coin(); draw();
      }
    }));
    root().querySelector('#v3-claim-all-m')?.addEventListener('click', async (event) => {
      const button = event.currentTarget;
      if (button.disabled) return;
      button.disabled = true;
      try {
        if (window.RLAClient?.isServerAvailable()) {
          // Never mint local rewards while a server account is active.
          const ready = window.RLAState.get().missions.filter(m => !m.claimed && m.progress >= m.target);
          if (!ready.length) { window.RLAGameView?.toast('No completed goals to claim.'); return; }
          let claimed = 0;
          for (const mission of ready) {
            try {
              const result = await window.RLAClient.claimMission(mission.id);
              if (result?.ok) claimed++;
            } catch { break; }
          }
          window.RLAGameView?.toast(claimed ? `Server credited ${claimed} reward(s).` : 'Server could not verify these rewards.');
          draw();
          return;
        }
        const res = window.RLAState.claimAllMissions();
        if (res.count > 0) { window.RLASound?.coin(); window.RLAGameView?.toast(`Claimed ${res.count} practice mission(s)!`); draw(); }
        else window.RLAGameView?.toast('Play matches to complete missions first!');
      } finally {
        if (button.isConnected) button.disabled = false;
      }
    });

    root().querySelectorAll('[data-store-tab]').forEach(b => b.addEventListener('click', () => {
      state.storeTab = b.dataset.storeTab;
      window.RLASound?.select();
      draw();
    }));
    root().querySelectorAll('[data-buy-sku]').forEach(b => b.addEventListener('click', () => {
      openSecureCheckoutModal(b.dataset.buySku, b.dataset.buyLabel);
    }));

    const handleCosmetic = async (kind, id) => {
      if (window.RLAClient?.isServerAvailable()) {
        const res = await window.RLAClient.buyOrEquipCosmetic(kind, id);
        if (!res.ok) window.RLAGameView?.toast(res.error || 'Insufficient balance');
        else { window.RLASound?.coin(); draw(); }
      } else {
        const res = kind === 'board' ? window.RLAState.buyOrEquipBoard(id) : window.RLAState.buyOrEquipDice(id);
        if (!res.ok) window.RLAGameView?.toast(res.reason);
        else { window.RLASound?.coin(); draw(); }
      }
    };
    root().querySelectorAll('[data-board]').forEach(b => b.addEventListener('click', () => handleCosmetic('board', b.dataset.board)));
    root().querySelectorAll('[data-dice]').forEach(b => b.addEventListener('click', () => handleCosmetic('dice', b.dataset.dice)));

    root().querySelector('#set-sfx')?.addEventListener('change', e => window.RLAState.updateSettings({ sfx: e.target.checked }));
    root().querySelector('#set-hap')?.addEventListener('change', e => window.RLAState.updateSettings({ haptics: e.target.checked }));
    root().querySelector('#set-spd')?.addEventListener('change', e => window.RLAState.updateSettings({ fastSpeed: e.target.checked }));
    root().querySelector('#set-auto')?.addEventListener('change', e => window.RLAState.updateSettings({ autoSingleMove: e.target.checked }));
  }

  window.addEventListener('hashchange', () => queueMicrotask(draw));
  window.addEventListener('DOMContentLoaded', draw);
  if (window.RLAState) {
    window.RLAState.subscribe(() => { if (ROUTES[fromHash()]) draw(); });
  }
  queueMicrotask(draw);

  return {
    routes: Object.keys(ROUTES),
    go,
    draw,
    openFeature,
    inspect: () => ({ routes: ROUTES })
  };
})();
window.RLA = RLA;
