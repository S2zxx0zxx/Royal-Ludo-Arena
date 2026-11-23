// Royal Ludo Arena UI v1.0.0 — Full Playable Game Integration + Original Approved Artwork
const SCREEN_DATA = {
  home: './assets/screens/home.webp',
  online: './assets/screens/online.webp',
  team: './assets/screens/team.webp',
  friends: './assets/screens/friends.webp',
  computer: './assets/screens/computer.webp',
  pass: './assets/screens/pass.webp'
};
const CARD_DATA = {
  home_online: './assets/ui/home_online.webp',
  home_team: './assets/ui/home_team.webp',
  home_friends: './assets/ui/home_friends.webp',
  home_computer: './assets/ui/home_computer.webp',
  home_pass: './assets/ui/home_pass.webp'
};
const FRAME = { width: 921, height: 1536 };
const SCREENS = {
  home: 'Home',
  online: 'Play Online',
  team: 'Team Battle',
  friends: 'Play With Friends',
  computer: 'Play vs Computer',
  pass: 'Pass & Play'
};

// Exact source-image pixel hotspots measured from the six 921 x 1536 concept screens.
const HOTSPOTS = {
  home: [
    { id: 'home-online', label: 'Play Online', rect: [37, 687, 278, 207], action: 'navigate', to: 'online', art: 'home_online' },
    { id: 'home-team', label: 'Team Battle', rect: [324, 686, 274, 209], action: 'navigate', to: 'team', art: 'home_team' },
    { id: 'home-friends', label: 'Play With Friends', rect: [608, 686, 278, 209], action: 'navigate', to: 'friends', art: 'home_friends' },
    { id: 'home-computer', label: 'Play vs Computer', rect: [110, 938, 343, 181], action: 'navigate', to: 'computer', art: 'home_computer' },
    { id: 'home-pass', label: 'Pass and Play', rect: [474, 939, 338, 181], action: 'navigate', to: 'pass', art: 'home_pass' }
  ],
  online: [
    { id: 'online-back', label: 'Back to Home', rect: [25, 139, 100, 84], action: 'back' },
    { id: 'online-classic', label: 'Classic rules', rect: [278, 601, 457, 106], action: 'select', group: 'ruleMode', value: 'classic' },
    { id: 'online-one', label: 'One Kill Win rules', rect: [278, 743, 457, 106], action: 'select', group: 'ruleMode', value: 'oneKillWin' },
    { id: 'online-quick', label: 'Quick rules', rect: [278, 885, 457, 107], action: 'select', group: 'ruleMode', value: 'quick' },
    { id: 'online-popular', label: 'Popular rules', rect: [278, 1027, 457, 108], action: 'select', group: 'ruleMode', value: 'popular' },
    { id: 'online-mask', label: 'Mask rules', rect: [278, 1168, 457, 107], action: 'select', group: 'ruleMode', value: 'mask' },
    { id: 'online-next', label: 'Find Match', rect: [252, 1351, 417, 123], action: 'start' }
  ],
  team: [
    { id: 'team-back', label: 'Back to Home', rect: [26, 138, 100, 85], action: 'back' },
    { id: 'team-four', label: 'Four online players', rect: [91, 673, 361, 255], action: 'select', group: 'teamComposition', value: '4Online' },
    { id: 'team-friends', label: 'Two friends and two online players', rect: [480, 672, 358, 256], action: 'select', group: 'teamComposition', value: '2Friends2Online' },
    { id: 'team-classic', label: 'Classic game', rect: [74, 1042, 383, 111], action: 'select', group: 'ruleMode', value: 'classic' },
    { id: 'team-quick', label: 'Quick game', rect: [479, 1042, 372, 111], action: 'select', group: 'ruleMode', value: 'quick' },
    { id: 'team-next', label: 'Start Team Battle', rect: [248, 1350, 430, 128], action: 'start' }
  ],
  friends: [
    { id: 'friends-back', label: 'Back to Home', rect: [26, 137, 98, 88], action: 'back' },
    { id: 'friends-create', label: 'Create private room', rect: [38, 641, 421, 252], action: 'select', group: 'roomAction', value: 'create' },
    { id: 'friends-join', label: 'Join private room', rect: [465, 640, 424, 254], action: 'select', group: 'roomAction', value: 'join' },
    { id: 'friends-classic', label: 'Classic game', rect: [105, 1097, 356, 103], action: 'select', group: 'ruleMode', value: 'classic' },
    { id: 'friends-quick', label: 'Quick game', rect: [477, 1097, 359, 103], action: 'select', group: 'ruleMode', value: 'quick' },
    { id: 'friends-start', label: 'Open Private Room', rect: [202, 1354, 523, 146], action: 'start' }
  ],
  computer: [
    { id: 'computer-back', label: 'Back to Home', rect: [26, 138, 100, 90], action: 'back' },
    { id: 'computer-classic', label: 'Classic game', rect: [72, 697, 397, 122], action: 'select', group: 'ruleMode', value: 'classic' },
    { id: 'computer-rush', label: 'Rush Mode', rect: [478, 697, 403, 122], action: 'select', group: 'ruleMode', value: 'rush' },
    { id: 'computer-easy', label: 'Easy difficulty', rect: [70, 909, 195, 184], action: 'select', group: 'difficulty', value: 'easy' },
    { id: 'computer-medium', label: 'Medium difficulty', rect: [266, 909, 206, 184], action: 'select', group: 'difficulty', value: 'medium' },
    { id: 'computer-hard', label: 'Hard difficulty', rect: [472, 910, 204, 184], action: 'select', group: 'difficulty', value: 'hard' },
    { id: 'computer-expert', label: 'Expert difficulty', rect: [679, 909, 202, 184], action: 'select', group: 'difficulty', value: 'expert' },
    { id: 'computer-two', label: 'Two player game', rect: [68, 1200, 205, 130], action: 'select', group: 'playerCount', value: '2' },
    { id: 'computer-three', label: 'Three player game', rect: [274, 1200, 202, 130], action: 'select', group: 'playerCount', value: '3' },
    { id: 'computer-four', label: 'Four player game', rect: [483, 1200, 199, 130], action: 'select', group: 'playerCount', value: '4' },
    { id: 'computer-custom', label: 'Custom players setup', rect: [683, 1200, 201, 130], action: 'custom' },
    { id: 'computer-start', label: 'Start Game vs Computer', rect: [207, 1360, 524, 140], action: 'start' }
  ],
  pass: [
    { id: 'pass-back', label: 'Back to Home', rect: [26, 138, 100, 90], action: 'back' },
    { id: 'pass-two', label: 'Two local players', rect: [99, 677, 247, 123], action: 'select', group: 'playerCount', value: '2' },
    { id: 'pass-three', label: 'Three local players', rect: [365, 677, 239, 123], action: 'select', group: 'playerCount', value: '3' },
    { id: 'pass-four', label: 'Four local players', rect: [608, 677, 251, 123], action: 'select', group: 'playerCount', value: '4' },
    { id: 'pass-blue', label: 'Blue pawn token', rect: [189, 883, 122, 124], action: 'select', group: 'tokenColor', value: 'blue' },
    { id: 'pass-red', label: 'Red pawn token', rect: [336, 878, 131, 134], action: 'select', group: 'tokenColor', value: 'red' },
    { id: 'pass-green', label: 'Green pawn token', rect: [488, 883, 138, 129], action: 'select', group: 'tokenColor', value: 'green' },
    { id: 'pass-yellow', label: 'Yellow pawn token', rect: [645, 883, 146, 129], action: 'select', group: 'tokenColor', value: 'yellow' },
    { id: 'pass-classic', label: 'Classic rules', rect: [77, 1071, 273, 137], action: 'select', group: 'ruleMode', value: 'classic' },
    { id: 'pass-teamup', label: 'Team Up rules (four players only)', rect: [355, 1071, 264, 137], action: 'select', group: 'ruleMode', value: 'teamUp' },
    { id: 'pass-quick', label: 'Quick rules', rect: [619, 1071, 273, 137], action: 'select', group: 'ruleMode', value: 'quick' },
    { id: 'pass-start', label: 'Start Pass and Play', rect: [202, 1357, 548, 146], action: 'start' }
  ]
};

const DEFAULTS = {
  home: { ruleMode: 'classic', teamComposition: '4Online', roomAction: 'create', difficulty: 'medium', playerCount: '4', tokenColor: 'blue' },
  online: { ruleMode: 'classic', teamComposition: '4Online', roomAction: 'create', difficulty: 'medium', playerCount: '4', tokenColor: 'blue' },
  team: { ruleMode: 'classic', teamComposition: '4Online', roomAction: 'create', difficulty: 'medium', playerCount: '4', tokenColor: 'blue' },
  friends: { ruleMode: 'classic', teamComposition: '4Online', roomAction: 'create', difficulty: 'medium', playerCount: '4', tokenColor: 'blue' },
  computer: { ruleMode: 'classic', teamComposition: '4Online', roomAction: 'create', difficulty: 'medium', playerCount: '2', tokenColor: 'blue' },
  pass: { ruleMode: 'classic', teamComposition: '4Online', roomAction: 'create', difficulty: 'medium', playerCount: '4', tokenColor: 'blue' }
};

function validChoice(screen, group, value) {
  return HOTSPOTS[screen].some(h => h.action === 'select' && h.group === group && h.value === value);
}

const app = document.getElementById('app');
if (!app) throw new Error('Missing app element');
const root = app;
const state = { screen: 'home', settings: structuredClone(DEFAULTS), roomCode: '', touched: new Set() };
const allowedScreens = new Set(Object.keys(SCREENS));
const extendedRoutes = new Set(['events', 'profile', 'store', 'store-compact', 'daily-goals', 'send-gift']);

function fromHash() {
  const id = window.location.hash.slice(1).split('?')[0];
  if (id === 'play') return 'play';
  if (extendedRoutes.has(id)) return id;
  return allowedScreens.has(id) ? id : 'home';
}

function rectStyle(hit) {
  const [x, y, w, h] = hit.rect;
  return `left:${x / FRAME.width * 100}%;top:${y / FRAME.height * 100}%;width:${w / FRAME.width * 100}%;height:${h / FRAME.height * 100}%;`;
}

function go(screen) {
  window.RLASound?.click();
  if (screen === state.screen && window.location.hash.slice(1) === screen) return;
  window.location.hash = screen;
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
    window.RLAGameView.openMatchmakingLobby({
      mode: cfg.ruleMode || 'classic',
      entryMode: 'online',
      teamBattle: false
    });
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
      const input = document.getElementById('room-code');
      input?.focus();
      return;
    }
    window.RLAGameView.openPrivateRoomLobby({
      roomAction: cfg.roomAction || 'create',
      roomCode: state.roomCode,
      mode: cfg.ruleMode || 'classic'
    });
  }
}

function attachLiveHud(frame) {
  if (!window.RLAState) return;
  const s = window.RLAState.get();
  const hud = document.createElement('div');
  hud.className = 'rla-live-hud';
  hud.innerHTML = `
    <span class="rla-hud-pill" aria-label="Diamonds">💎 ${s.currency.diamonds.toLocaleString()}</span>
    <span class="rla-hud-pill" aria-label="Coins">🪙 ${s.currency.coins.toLocaleString()}</span>
  `;
  frame.append(hud);

  if (state.screen === 'home') {
    const xp = window.RLAState.xpProgress();
    const lvl = document.createElement('div');
    lvl.className = 'rla-hud-level';
    lvl.textContent = `★ Lv.${xp.level} · ${s.profile.name}`;
    frame.append(lvl);

    // Show Resume Match pill if an unfinished match exists
    if (window.RLAState.loadActiveMatch()) {
      const resumeBtn = document.createElement('button');
      resumeBtn.type = 'button';
      resumeBtn.className = 'rla-resume-banner';
      resumeBtn.textContent = '▶ Resume Saved Match';
      resumeBtn.addEventListener('click', () => {
        window.RLASound?.select();
        window.RLAGameView?.resumeSavedMatch();
      });
      frame.append(resumeBtn);
    }
  }
}

function draw() {
  const nextScreen = fromHash();
  if (nextScreen === 'play') {
    state.screen = 'play';
    if (!window.RLAGameView?.isActive()) {
      if (!window.RLAGameView?.resumeSavedMatch()) {
        window.location.hash = 'home';
      }
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
  document.title = SCREENS[state.screen] + ' | Royal Ludo Arena';
  root.replaceChildren();

  const shell = document.createElement('div');
  shell.className = 'app-shell';
  const frame = document.createElement('section');
  frame.className = 'artboard';
  frame.setAttribute('aria-label', SCREENS[state.screen] + ' screen');

  const img = document.createElement('img');
  img.className = 'screen-art';
  img.src = SCREEN_DATA[state.screen];
  img.alt = '';
  img.decoding = 'sync';
  img.draggable = false;
  frame.append(img);

  for (const hit of HOTSPOTS[state.screen]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'hotspot';
    button.style.cssText = rectStyle(hit);
    button.dataset.hitId = hit.id;
    button.setAttribute('aria-label', hit.label);

    if (hit.art && hit.action === 'navigate') {
      const visual = document.createElement('img');
      visual.src = CARD_DATA[hit.art];
      visual.alt = '';
      visual.draggable = false;
      button.append(visual);
      button.classList.add('art-button');
    }

    if (hit.action === 'select') {
      button.classList.add('choice');
      const isSelected = Boolean(hit.group && hit.value && state.settings[state.screen][hit.group] === hit.value);
      button.setAttribute('aria-pressed', String(isSelected));
      if (isSelected && state.touched.has(`${state.screen}:${hit.group}`)) {
        button.classList.add('modified');
      }
      button.setAttribute('role', 'button');
      button.addEventListener('click', () => select(hit));
    } else if (hit.action === 'navigate' && hit.to) {
      const to = hit.to;
      button.addEventListener('click', () => go(to));
    } else if (hit.action === 'back') {
      button.addEventListener('click', () => go('home'));
    } else if (hit.action === 'start') {
      button.addEventListener('click', () => launchGame(state.screen));
    } else if (hit.action === 'custom') {
      button.addEventListener('click', () => {
        window.RLASound?.select();
        const cfg = state.settings.computer;
        window.RLAGameView?.openCustomComputerModal(cfg.ruleMode, cfg.difficulty);
      });
    }
    frame.append(button);
  }

  if (state.screen === 'friends') {
    const input = document.createElement('input');
    input.id = 'room-code';
    input.className = 'room-code';
    input.type = 'text';
    input.inputMode = 'numeric';
    input.pattern = '[0-9]{6}';
    input.placeholder = 'Enter 6 Digit Code';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', 'Six digit room code');
    input.value = state.roomCode;
    input.addEventListener('input', () => {
      const sanitized = input.value.replace(/[^0-9]/g, '').slice(0, 6);
      input.value = sanitized;
      state.roomCode = sanitized;
    });
    frame.append(input);
  }

  attachLiveHud(frame);

  const live = document.createElement('div');
  live.className = 'sr-only';
  live.id = 'screen-announcer';
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  frame.append(live);

  shell.append(frame);
  root.append(shell);
}

function select(hit) {
  const screen = state.screen;
  if (!hit.group || !hit.value || !validChoice(screen, hit.group, hit.value)) return;
  const settings = state.settings[screen];

  if (screen === 'pass' && hit.group === 'ruleMode' && hit.value === 'teamUp' && settings.playerCount !== '4') {
    const live = document.getElementById('screen-announcer');
    if (live) live.textContent = 'Team Up needs exactly four players.';
    window.RLAGameView?.toast('Team Up requires 4 players — select 4 Players first!');
    return;
  }

  window.RLASound?.select();
  settings[hit.group] = hit.value;
  state.touched.add(`${screen}:${hit.group}`);

  if (screen === 'pass' && hit.group === 'playerCount' && hit.value !== '4' && settings.ruleMode === 'teamUp') {
    settings.ruleMode = 'classic';
  }

  const focusId = hit.id;
  draw();
  const selected = root.querySelector(`[data-hit-id="${focusId}"]`);
  selected?.focus({ preventScroll: true });
  const status = document.getElementById('screen-announcer');
  if (status) status.textContent = `${hit.label} selected`;
}

window.addEventListener('hashchange', draw);
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && state.screen !== 'home' && state.screen !== 'play' && !document.getElementById('rla-dialog')) {
    go('home');
  }
});
if (window.RLAState) {
  window.RLAState.subscribe(() => {
    if (allowedScreens.has(state.screen)) draw();
  });
}
draw();
