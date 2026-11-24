/**
 * Royal Ludo Arena V3.0.0 — 100% Native 3D Componentized Game UI Router
 * Zero baked screenshots. Zero stuck checkmarks. Zero overlapping HUD pills.
 * Renders real live Home, Online, Team Battle, Friends, Computer & Pass-and-Play screens.
 */
const SCREENS = {
  home: 'Home',
  online: 'Play Online',
  team: 'Team Battle',
  friends: 'Play With Friends',
  computer: 'Play vs Computer',
  pass: 'Pass & Play'
};

const DEFAULTS = {
  home:     { ruleMode: 'classic', teamComposition: '4Online', roomAction: 'create', difficulty: 'medium', playerCount: '4', tokenColor: 'blue' },
  online:   { ruleMode: 'classic', teamComposition: '4Online', roomAction: 'create', difficulty: 'medium', playerCount: '4', tokenColor: 'blue' },
  team:     { ruleMode: 'classic', teamComposition: '4Online', roomAction: 'create', difficulty: 'medium', playerCount: '4', tokenColor: 'blue' },
  friends:  { ruleMode: 'classic', teamComposition: '4Online', roomAction: 'create', difficulty: 'medium', playerCount: '4', tokenColor: 'blue' },
  computer: { ruleMode: 'classic', teamComposition: '4Online', roomAction: 'create', difficulty: 'medium', playerCount: '2', tokenColor: 'blue' },
  pass:     { ruleMode: 'classic', teamComposition: '4Online', roomAction: 'create', difficulty: 'medium', playerCount: '4', tokenColor: 'blue' }
};

const app = document.getElementById('app');
if (!app) throw new Error('Missing app element');
const root = app;

const state = {
  screen: 'home',
  settings: structuredClone(DEFAULTS),
  roomCode: ''
};

const coreScreens = new Set(Object.keys(SCREENS));
const extendedRoutes = new Set(['events', 'profile', 'store', 'store-compact', 'daily-goals', 'send-gift', 'club', 'inventory', 'social', 'more']);

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function fromHash() {
  const id = window.location.hash.slice(1).split('?')[0];
  if (id === 'play') return 'play';
  if (extendedRoutes.has(id)) return id;
  return coreScreens.has(id) ? id : 'home';
}

function go(screen) {
  window.RLASound?.click();
  if (window.location.hash.slice(1) === screen) draw();
  else window.location.hash = screen;
}

/** Shared Persistent Top Game HUD + Bottom Nav Shell (used by app.js & expansion.js) */
function renderGameShell(activeNav, mainHtml) {
  const s = window.RLAState ? window.RLAState.get() : {
    profile: { name: 'Player', avatar: '👑' },
    currency: { coins: 2250, diamonds: 50 },
    progression: { level: 1 },
    inbox: [],
    missions: []
  };
  const online = Boolean(window.RLAClient?.isOnline());
  const unread = (s.inbox || []).filter(m => !m.claimed).length;
  const readyMissions = (s.missions || []).filter(m => !m.claimed && m.progress >= m.target).length;
  const avatarInner = (s.profile.avatar === '👑' || !s.profile.avatar)
    ? `<img src="./assets/game/avatar-hero.webp" alt="Avatar" draggable="false">`
    : `<span class="v3-avatar-emoji">${esc(s.profile.avatar)}</span>`;

  const navItems = [
    { id: 'home', icon: '🏠', label: 'HOME' },
    { id: 'events', icon: '📅', label: 'EVENTS', badge: window.RLAState?.canClaimDailyReward() ? '!' : '' },
    { id: 'club', icon: '🛡️', label: 'CLUB' },
    { id: 'inventory', icon: '🎒', label: 'INVENTORY', badge: readyMissions ? String(readyMissions) : '' },
    { id: 'social', icon: '💬', label: 'SOCIAL' },
    { id: 'more', icon: '⚙️', label: 'MORE' }
  ];

  return `
    <div class="v3-viewport">
      <div class="v3-shell">
        <header class="v3-hud" aria-label="Player status bar">
          <div class="v3-hud-left">
            <button type="button" class="v3-avatar-btn" data-nav="profile" aria-label="Open profile">
              ${avatarInner}
              <span class="v3-online-dot ${online ? '' : 'offline'}" title="${online ? 'Live Server Connected' : 'Local Practice Mode'}"></span>
              <span class="v3-lvl-chip">Lv.${s.progression.level}</span>
            </button>
            <button type="button" class="v3-hud-icon" data-open="settings" aria-label="Settings">⚙️</button>
            <button type="button" class="v3-hud-icon" data-open="inbox" aria-label="Messages">
              ✉️${unread ? `<span class="v3-badge-dot">${unread}</span>` : ''}
            </button>
          </div>
          <div class="v3-hud-right">
            <button type="button" class="v3-currency-pill" data-nav="store" aria-label="Diamonds store">
              <span>💎</span><span>${s.currency.diamonds.toLocaleString()}</span><span class="v3-currency-plus">+</span>
            </button>
            <button type="button" class="v3-currency-pill" data-nav="store" aria-label="Coins store">
              <span>🪙</span><span>${s.currency.coins.toLocaleString()}</span><span class="v3-currency-plus">+</span>
            </button>
            <button type="button" class="v3-hud-icon" data-nav="store" aria-label="Store">🛒</button>
          </div>
        </header>

        <section class="v3-main" aria-label="${esc(SCREENS[state.screen] || activeNav)} screen">
          ${mainHtml}
        </section>

        <nav class="v3-bottom-dock" aria-label="Primary navigation">
          ${navItems.map(n => `
            <button type="button" class="v3-nav-tab ${activeNav === n.id ? 'active' : ''}" data-nav="${n.id}" aria-label="${n.label}">
              <span class="ico">${n.icon}</span>
              <span>${n.label}</span>
              ${n.badge ? `<span class="v3-badge-dot">${n.badge}</span>` : ''}
            </button>
          `).join('')}
        </nav>
        <div class="sr-only" id="screen-announcer" role="status" aria-live="polite"></div>
      </div>
    </div>
  `;
}

function bindShellEvents(container) {
  container.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => go(el.dataset.nav));
  });
  container.querySelectorAll('[data-open]').forEach(el => {
    el.addEventListener('click', () => {
      window.RLASound?.click();
      window.RLA?.openFeature(el.dataset.open);
    });
  });
}

function renderHomeBody() {
  const hasSaved = Boolean(window.RLAState?.loadActiveMatch());
  const dailyReady = Boolean(window.RLAState?.canClaimDailyReward());
  const freeSpinReady = Boolean(window.RLAState?.canFreeSpin());
  const readyMissions = (window.RLAState?.get().missions || []).filter(m => !m.claimed && m.progress >= m.target).length;
  const isLive = Boolean(window.RLAClient?.isOnline());

  return `
    <div class="v3-home-hero-grid">
      <div class="v3-rail">
        <button type="button" class="v3-rail-btn promo" data-nav="store" aria-label="Starter Pack">
          <span class="v3-rail-ico">🎁</span><span class="v3-rail-lbl">Starter Pack</span>
        </button>
        <button type="button" class="v3-rail-btn" data-nav="events" aria-label="Events">
          <span class="v3-rail-ico">📅</span><span class="v3-rail-lbl">Events</span>
        </button>
        <button type="button" class="v3-rail-btn" data-open="free-chest" aria-label="Free Bonus Chest">
          <span class="v3-rail-ico">📺</span><span class="v3-rail-lbl">Bonus Chest</span>
        </button>
      </div>

      <div class="v3-hero-center">
        <div class="v3-logo-crest">
          <div class="v3-logo-crown">👑</div>
          <div class="v3-logo-royal">ROYAL</div>
          <div class="v3-logo-ludo">LUDO</div>
        </div>
        <div class="v3-hero-art-wrap">
          <img src="./assets/game/hero-ludo-3d.webp" alt="Royal Ludo 3D Board" draggable="false">
        </div>
      </div>

      <div class="v3-rail">
        <button type="button" class="v3-rail-btn" data-open="vip" aria-label="VIP">
          <span class="v3-rail-ico">👑</span><span class="v3-rail-lbl">VIP</span>
        </button>
        <button type="button" class="v3-rail-btn" data-open="daily-reward" aria-label="Daily Reward">
          ${dailyReady ? '<span class="v3-badge-dot">!</span>' : ''}
          <span class="v3-rail-ico">🗓️</span><span class="v3-rail-lbl">Daily Reward</span>
        </button>
        <button type="button" class="v3-rail-btn" data-nav="daily-goals" aria-label="Missions">
          ${readyMissions ? `<span class="v3-badge-dot">${readyMissions}</span>` : ''}
          <span class="v3-rail-ico">🎯</span><span class="v3-rail-lbl">Missions</span>
        </button>
        <button type="button" class="v3-rail-btn" data-open="leaderboard" aria-label="Leaderboard">
          <span class="v3-rail-ico">🏆</span><span class="v3-rail-lbl">Ranks</span>
        </button>
      </div>
    </div>

    ${hasSaved ? `<button type="button" class="v3-resume-bar" id="v3-resume-btn">▶ Resume Saved Match</button>` : ''}

    <div class="v3-modes-top">
      <button type="button" class="v3-mode-card online" data-nav="online" data-hit-id="home-online" aria-label="Play Online">
        <span class="v3-mode-ico">🌐</span>
        <span class="v3-mode-plaque">PLAY<br>ONLINE</span>
        <span class="v3-mode-sub">${isLive ? '🟢 Live' : '⚡ Instant'}</span>
      </button>
      <button type="button" class="v3-mode-card team" data-nav="team" data-hit-id="home-team" aria-label="Team Battle">
        <span class="v3-mode-ico">👥</span>
        <span class="v3-mode-plaque">TEAM<br>BATTLE</span>
        <span class="v3-mode-sub">🤝 2v2 Assist</span>
      </button>
      <button type="button" class="v3-mode-card friends" data-nav="friends" data-hit-id="home-friends" aria-label="Play With Friends">
        <span class="v3-mode-ico">💖</span>
        <span class="v3-mode-plaque">PLAY WITH<br>FRIENDS</span>
        <span class="v3-mode-sub">🔑 6-Digit Room</span>
      </button>
    </div>

    <div class="v3-modes-bottom">
      <button type="button" class="v3-mode-card computer" data-nav="computer" data-hit-id="home-computer" aria-label="Play vs Computer">
        <span class="v3-mode-ico">🤖</span>
        <span class="v3-mode-plaque">PLAY VS COMPUTER</span>
        <span class="v3-mode-sub">4 AI Tiers · Classic & Rush</span>
      </button>
      <button type="button" class="v3-mode-card pass" data-nav="pass" data-hit-id="home-pass" aria-label="Pass and Play">
        <span class="v3-mode-ico">🎲</span>
        <span class="v3-mode-plaque">PASS & PLAY</span>
        <span class="v3-mode-sub">2–4 Local · Team Up</span>
      </button>
    </div>

    <div class="v3-home-footer-strip">
      <button type="button" class="v3-rail-btn" data-open="lucky-spin" aria-label="Lucky Spin">
        ${freeSpinReady ? '<span class="v3-badge-dot">1</span>' : ''}
        <span class="v3-rail-ico">🎡</span><span class="v3-rail-lbl">Lucky Spin</span>
      </button>
      <button type="button" class="v3-tourney-banner" data-open="tournament" aria-label="Royal Tournaments">
        <strong style="font-size:14px;color:#ffe680">🏆 ROYAL TOURNAMENTS</strong>
        <span style="font-size:10.5px;color:#fff4d6">Season 28 · 2-Round Knockout · 5,000 🪙</span>
      </button>
      <button type="button" class="v3-rail-btn" data-open="free-chest" aria-label="Free Coins">
        <span class="v3-rail-ico">💰</span><span class="v3-rail-lbl">Free Coins</span>
      </button>
    </div>
  `;
}

function renderOnlineBody() {
  const cfg = state.settings.online;
  const modes = [
    ['classic', '👑 Classic Rules', 'Traditional 4-pawn race to the Royal Crown'],
    ['oneKillWin', '⚔️ One Kill Win', 'First capture or first pawn Home wins instantly'],
    ['quick', '⚡ Quick Mode', '1 pawn starts out · First to get 2 pawns Home wins'],
    ['popular', '🎲 Popular (+Reroll)', 'Classic Ludo with 2 Power Rerolls per player'],
    ['mask', '🎭 Mask Mode', 'Mystery masked rivals revealed on victory podium']
  ];
  return `
    <div class="v3-screen-head">
      <button type="button" class="v3-round-btn" data-nav="home" aria-label="Back to Home">←</button>
      <div class="v3-ribbon"><h1 class="v3-ribbon-title">🌐 Play Online</h1></div>
      <button type="button" class="v3-round-btn" data-open="help" aria-label="Rules help">?</button>
    </div>
    <div class="v3-panel">
      <span class="v3-section-pill">Select Rule Mode</span>
      ${modes.map(([val, title, desc]) => `
        <button type="button" class="v3-choice v3-choice-row" data-group="ruleMode" data-value="${val}" aria-pressed="${cfg.ruleMode === val}">
          <div><div>${title}</div><div class="v3-choice-desc">${desc}</div></div>
        </button>
      `).join('')}
    </div>
    <button type="button" class="v3-cta-btn green" id="v3-start-btn" data-hit-id="online-next">Find Live Match ▶</button>
  `;
}

function renderTeamBody() {
  const cfg = state.settings.team;
  return `
    <div class="v3-screen-head">
      <button type="button" class="v3-round-btn" data-nav="home" aria-label="Back to Home">←</button>
      <div class="v3-ribbon"><h1 class="v3-ribbon-title">👥 Team Battle 2v2</h1></div>
      <button type="button" class="v3-round-btn" data-open="help" aria-label="Rules help">?</button>
    </div>
    <div class="v3-panel">
      <span class="v3-section-pill">Team Setup</span>
      <div class="v3-grid-2">
        <button type="button" class="v3-choice" data-group="teamComposition" data-value="4Online" aria-pressed="${cfg.teamComposition === '4Online'}">
          <span style="font-size:28px">🌐</span>
          <span>4 Online Players</span>
          <span class="v3-choice-desc">Auto-pair 2v2</span>
        </button>
        <button type="button" class="v3-choice" data-group="teamComposition" data-value="2Friends2Online" aria-pressed="${cfg.teamComposition === '2Friends2Online'}">
          <span style="font-size:28px">🤝</span>
          <span>2 Friends + 2 Online</span>
          <span class="v3-choice-desc">6-Digit Duo Party</span>
        </button>
      </div>
      <span class="v3-section-pill">Game Speed</span>
      <div class="v3-grid-2">
        <button type="button" class="v3-choice" data-group="ruleMode" data-value="classic" aria-pressed="${cfg.ruleMode === 'classic'}">👑 Classic 2v2</button>
        <button type="button" class="v3-choice" data-group="ruleMode" data-value="quick" aria-pressed="${cfg.ruleMode === 'quick'}">⚡ Quick 2v2</button>
      </div>
      <p style="margin:2px 0 0;font-size:11px;color:#f3dba4;text-align:center">Partner Finish Assist enabled: finish your 4 pawns to roll & move your partner's pawns!</p>
    </div>
    <button type="button" class="v3-cta-btn" id="v3-start-btn" data-hit-id="team-next">Start Team Battle ▶</button>
  `;
}

function renderFriendsBody() {
  const cfg = state.settings.friends;
  return `
    <div class="v3-screen-head">
      <button type="button" class="v3-round-btn" data-nav="home" aria-label="Back to Home">←</button>
      <div class="v3-ribbon"><h1 class="v3-ribbon-title">💖 Play With Friends</h1></div>
      <button type="button" class="v3-round-btn" data-open="help" aria-label="Rules help">?</button>
    </div>
    <div class="v3-panel">
      <span class="v3-section-pill">Private Room</span>
      <div class="v3-grid-2">
        <button type="button" class="v3-choice" data-group="roomAction" data-value="create" aria-pressed="${cfg.roomAction === 'create'}">
          <span style="font-size:26px">🏰</span>
          <span>Create Room</span>
          <span class="v3-choice-desc">Get 6-digit code</span>
        </button>
        <button type="button" class="v3-choice" data-group="roomAction" data-value="join" aria-pressed="${cfg.roomAction === 'join'}">
          <span style="font-size:26px">🔑</span>
          <span>Join Room</span>
          <span class="v3-choice-desc">Enter friend's code</span>
        </button>
      </div>
      <input id="room-code" class="v3-input" type="text" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="ENTER 6 DIGIT CODE" value="${esc(state.roomCode)}" aria-label="Six digit room code">
      <span class="v3-section-pill">Rules</span>
      <div class="v3-grid-2">
        <button type="button" class="v3-choice" data-group="ruleMode" data-value="classic" aria-pressed="${cfg.ruleMode === 'classic'}">👑 Classic</button>
        <button type="button" class="v3-choice" data-group="ruleMode" data-value="quick" aria-pressed="${cfg.ruleMode === 'quick'}">⚡ Quick</button>
      </div>
    </div>
    <button type="button" class="v3-cta-btn gold" id="v3-start-btn" data-hit-id="friends-start">${cfg.roomAction === 'join' ? 'Join Private Room ▶' : 'Create Private Room ▶'}</button>
  `;
}

function renderComputerBody() {
  const cfg = state.settings.computer;
  return `
    <div class="v3-screen-head">
      <button type="button" class="v3-round-btn" data-nav="home" aria-label="Back to Home">←</button>
      <div class="v3-ribbon"><h1 class="v3-ribbon-title">🤖 Play vs Computer</h1></div>
      <button type="button" class="v3-round-btn" data-open="help" aria-label="Rules help">?</button>
    </div>
    <div style="display:flex;align-items:center;justify-content:center;gap:12px">
      <img src="./assets/game/bot-mascot.webp" alt="AI Bot Mascot" style="width:74px;height:74px;border-radius:16px;border:2px solid #f4bd3b;box-shadow:0 6px 14px rgba(0,0,0,0.55)" draggable="false">
      <div style="font-size:12px;color:#f5dfb0;line-height:1.35">
        <strong style="color:#ffe680;font-size:14px">Tactical AI Arena</strong><br>
        4 intelligence tiers with threat analysis, safe-zone tactics & capture hunting.
      </div>
    </div>
    <div class="v3-panel">
      <span class="v3-section-pill">Game Mode</span>
      <div class="v3-grid-2">
        <button type="button" class="v3-choice" data-group="ruleMode" data-value="classic" aria-pressed="${cfg.ruleMode === 'classic'}">🎲 Classic</button>
        <button type="button" class="v3-choice" data-group="ruleMode" data-value="rush" aria-pressed="${cfg.ruleMode === 'rush'}">⚡ Rush Blitz</button>
      </div>
      <span class="v3-section-pill">AI Difficulty</span>
      <div class="v3-grid-4">
        <button type="button" class="v3-choice" data-group="difficulty" data-value="easy" aria-pressed="${cfg.difficulty === 'easy'}">😊<span>Easy</span></button>
        <button type="button" class="v3-choice" data-group="difficulty" data-value="medium" aria-pressed="${cfg.difficulty === 'medium'}">🤖<span>Medium</span></button>
        <button type="button" class="v3-choice" data-group="difficulty" data-value="hard" aria-pressed="${cfg.difficulty === 'hard'}">😈<span>Hard</span></button>
        <button type="button" class="v3-choice" data-group="difficulty" data-value="expert" aria-pressed="${cfg.difficulty === 'expert'}">👑<span>Expert</span></button>
      </div>
      <span class="v3-section-pill">Players</span>
      <div class="v3-grid-4">
        <button type="button" class="v3-choice" data-hit-id="computer-two" data-group="playerCount" data-value="2" aria-pressed="${cfg.playerCount === '2'}">2P</button>
        <button type="button" class="v3-choice" data-hit-id="computer-three" data-group="playerCount" data-value="3" aria-pressed="${cfg.playerCount === '3'}">3P</button>
        <button type="button" class="v3-choice" data-hit-id="computer-four" data-group="playerCount" data-value="4" aria-pressed="${cfg.playerCount === '4'}">4P</button>
        <button type="button" class="v3-choice" id="v3-custom-btn" data-hit-id="computer-custom" aria-pressed="false">⚙️ Custom</button>
      </div>
    </div>
    <button type="button" class="v3-cta-btn" id="v3-start-btn" data-hit-id="computer-start">Start Game ▶</button>
  `;
}

function renderPassBody() {
  const cfg = state.settings.pass;
  const colors = ['blue', 'red', 'green', 'yellow'];
  return `
    <div class="v3-screen-head">
      <button type="button" class="v3-round-btn" data-nav="home" aria-label="Back to Home">←</button>
      <div class="v3-ribbon"><h1 class="v3-ribbon-title">🎲 Pass & Play</h1></div>
      <button type="button" class="v3-round-btn" data-open="help" aria-label="Rules help">?</button>
    </div>
    <div class="v3-panel">
      <span class="v3-section-pill">Local Players</span>
      <div class="v3-grid-3">
        <button type="button" class="v3-choice" data-group="playerCount" data-value="2" aria-pressed="${cfg.playerCount === '2'}">2 Players</button>
        <button type="button" class="v3-choice" data-group="playerCount" data-value="3" aria-pressed="${cfg.playerCount === '3'}">3 Players</button>
        <button type="button" class="v3-choice" data-group="playerCount" data-value="4" aria-pressed="${cfg.playerCount === '4'}">4 Players</button>
      </div>
      <span class="v3-section-pill">Player 1 3D Pawn Color</span>
      <div class="v3-grid-4">
        ${colors.map(c => `
          <button type="button" class="v3-choice" data-group="tokenColor" data-value="${c}" aria-pressed="${cfg.tokenColor === c}" aria-label="${c} pawn">
            <img src="./assets/game/pawn-${c}.png" alt="${c}" style="width:36px;height:36px;object-fit:contain" draggable="false">
            <span style="text-transform:capitalize;font-size:10px">${c}</span>
          </button>
        `).join('')}
      </div>
      <span class="v3-section-pill">Rule Mode</span>
      <div class="v3-grid-3">
        <button type="button" class="v3-choice" data-group="ruleMode" data-value="classic" aria-pressed="${cfg.ruleMode === 'classic'}">👑 Classic</button>
        <button type="button" class="v3-choice" data-group="ruleMode" data-value="teamUp" aria-pressed="${cfg.ruleMode === 'teamUp'}">🤝 Team Up</button>
        <button type="button" class="v3-choice" data-group="ruleMode" data-value="quick" aria-pressed="${cfg.ruleMode === 'quick'}">⚡ Quick</button>
      </div>
    </div>
    <button type="button" class="v3-cta-btn green" id="v3-start-btn" data-hit-id="pass-start">Start Pass & Play ▶</button>
  `;
}

function launchGame(screen) {
  window.RLASound?.select();
  const cfg = state.settings[screen];
  const profile = window.RLAState ? window.RLAState.get().profile : { name: 'You', avatar: '👑' };
  const bots = [
    { name: 'Bot Vikram', avatar: '🤖' },
    { name: 'Bot Aanya', avatar: '🦁' },
    { name: 'Bot Rohan', avatar: '🐉' }
  ];

  if (screen === 'computer') {
    const count = Number(cfg.playerCount || 2);
    const colors = window.LudoCore.getSeatColors(count, 'blue');
    const players = colors.map((color, i) => ({
      color,
      name: i === 0 ? profile.name : bots[i - 1].name,
      avatar: i === 0 ? profile.avatar : bots[i - 1].avatar,
      isHuman: i === 0,
      isLocalHuman: i === 0,
      aiLevel: cfg.difficulty || 'medium'
    }));
    window.RLAGameView.startMatch({
      mode: cfg.ruleMode || 'classic',
      entryMode: 'computer',
      difficulty: cfg.difficulty || 'medium',
      prizeCoins: count * 100,
      players
    });
    return;
  }

  if (screen === 'pass') {
    const count = Number(cfg.playerCount || 4);
    const colors = window.LudoCore.getSeatColors(count, cfg.tokenColor || 'blue');
    const avatars = [profile.avatar, '🦁', '🦅', '🐉'];
    const players = colors.map((color, i) => ({
      color,
      name: i === 0 ? profile.name : `Player ${i + 1}`,
      avatar: avatars[i],
      isHuman: true,
      isLocalHuman: true
    }));
    window.RLAGameView.startMatch({
      mode: cfg.ruleMode || 'classic',
      entryMode: 'pass',
      prizeCoins: 200,
      players
    });
    return;
  }

  if (screen === 'online') {
    window.RLAGameView.openMatchmakingLobby({ mode: cfg.ruleMode || 'classic', entryMode: 'online', teamBattle: false });
    return;
  }

  if (screen === 'team') {
    window.RLAGameView.openMatchmakingLobby({
      mode: cfg.ruleMode || 'classic',
      entryMode: 'team',
      teamBattle: true,
      teamComposition: cfg.teamComposition || '4Online'
    });
    return;
  }

  if (screen === 'friends') {
    if (cfg.roomAction === 'join' && state.roomCode.length !== 6) {
      window.RLAGameView.toast('Enter a valid 6-digit Room Code to join, or select Create Room!');
      document.getElementById('room-code')?.focus();
      return;
    }
    window.RLAGameView.openPrivateRoomLobby({
      roomAction: cfg.roomAction || 'create',
      roomCode: state.roomCode,
      mode: cfg.ruleMode || 'classic'
    });
  }
}

function selectSetting(group, value) {
  const screen = state.screen;
  const settings = state.settings[screen];
  if (screen === 'pass' && group === 'ruleMode' && value === 'teamUp' && settings.playerCount !== '4') {
    const live = document.getElementById('screen-announcer');
    if (live) live.textContent = 'Team Up needs exactly four players.';
    window.RLAGameView?.toast('Team Up needs exactly four players.');
    return;
  }
  window.RLASound?.select();
  settings[group] = value;
  if (screen === 'pass' && group === 'playerCount' && value !== '4' && settings.ruleMode === 'teamUp') {
    settings.ruleMode = 'classic';
  }
  draw();
}

function draw() {
  const nextScreen = fromHash();
  if (nextScreen === 'play') {
    state.screen = 'play';
    if (!window.RLAGameView?.isActive()) {
      if (!window.RLAGameView?.resumeSavedMatch()) window.location.hash = 'home';
    }
    return;
  }
  if (extendedRoutes.has(nextScreen)) {
    state.screen = nextScreen;
    window.RLAGameView?.destroy();
    return;
  }

  window.RLAGameView?.destroy();
  state.screen = nextScreen;
  document.title = `${SCREENS[state.screen]} | Royal Ludo Arena`;

  let bodyHtml = '';
  if (state.screen === 'home') bodyHtml = renderHomeBody();
  else if (state.screen === 'online') bodyHtml = renderOnlineBody();
  else if (state.screen === 'team') bodyHtml = renderTeamBody();
  else if (state.screen === 'friends') bodyHtml = renderFriendsBody();
  else if (state.screen === 'computer') bodyHtml = renderComputerBody();
  else if (state.screen === 'pass') bodyHtml = renderPassBody();

  root.innerHTML = renderGameShell('home', bodyHtml);
  bindShellEvents(root);

  root.querySelector('#v3-resume-btn')?.addEventListener('click', () => {
    window.RLASound?.select();
    window.RLAGameView?.resumeSavedMatch();
  });
  root.querySelector('#v3-start-btn')?.addEventListener('click', () => launchGame(state.screen));
  root.querySelector('#v3-custom-btn')?.addEventListener('click', () => {
    window.RLASound?.select();
    const cfg = state.settings.computer;
    window.RLAGameView?.openCustomComputerModal(cfg.ruleMode, cfg.difficulty);
  });
  root.querySelectorAll('[data-group][data-value]').forEach(btn => {
    btn.addEventListener('click', () => selectSetting(btn.dataset.group, btn.dataset.value));
  });
  const roomInput = root.querySelector('#room-code');
  if (roomInput) {
    roomInput.addEventListener('input', () => {
      const sanitized = roomInput.value.replace(/[^0-9]/g, '').slice(0, 6);
      roomInput.value = sanitized;
      state.roomCode = sanitized;
    });
  }
}

window.RLAShell = { renderGameShell, bindShellEvents, go, esc };
window.addEventListener('hashchange', draw);
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && state.screen !== 'home' && state.screen !== 'play' && !document.getElementById('rla-dialog')) {
    go('home');
  }
});
if (window.RLAState) {
  window.RLAState.subscribe(() => {
    if (coreScreens.has(state.screen)) draw();
  });
}
draw();
