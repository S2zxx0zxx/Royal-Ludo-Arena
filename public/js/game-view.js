/**
 * Royal Ludo Arena — Interactive 15x15 Luxury Game Arena, Animations,
 * Matchmaking Lobby, Private Room (with BroadcastChannel live multi-tab sync),
 * Custom Player Setup, and 4-Player Royal Tournament Controller.
 */
(function (global) {
  'use strict';

  // User-entered names and persisted match data are untrusted. Keep text out of HTML parsing.
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  const PIP_MAP = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8]
  };

  const COLOR_THEME = {
    red:    { main: '#e52d2d', light: '#ff6b6b', dark: '#8d1111', tint: '#f7c5c5', label: 'Red' },
    green:  { main: '#1ea849', light: '#57df7e', dark: '#0e5b26', tint: '#c5f2d2', label: 'Green' },
    yellow: { main: '#f4b71a', light: '#ffe073', dark: '#946706', tint: '#fdf0bf', label: 'Yellow' },
    blue:   { main: '#1e78ff', light: '#6bb0ff', dark: '#0c4194', tint: '#c4dfff', label: 'Blue' }
  };

  const MODE_LABELS = {
    classic: 'Classic',
    quick: 'Quick (2 Home)',
    rush: 'Rush Blitz',
    oneKillWin: 'One Kill Win',
    teamUp: 'Team 2v2',
    popular: 'Popular (+Reroll)',
    mask: 'Mask Mode'
  };

  const EMOTES = ['😂', '😎', '🔥', '👏', '😱', '🙏'];
  const BOT_NAMES = ['Vikram_King', 'AanyaRoyal', 'RohanBlitz', 'PriyaDice', 'Kabir_99', 'MeeraStar', 'ArjunPro', 'DevQueen'];
  const BOT_AVATARS = ['🦁', '👑', '🐉', '💎', '🦅', '🦊', '🐯', '🤖'];

  let engine = null;
  let containerEl = null;
  let animating = false;
  let turnTimerId = null;
  let rushTimerId = null;
  let aiTimeoutId = null;
  let turnRemaining = 18;
  let fastMode = false;
  let boardChannel = null;
  let tournamentState = null;

  function toast(msg, ms = 2200) {
    document.querySelectorAll('.rla-toast').forEach(e => e.remove());
    const el = document.createElement('div');
    el.className = 'rla-toast';
    el.textContent = msg;
    document.body.append(el);
    setTimeout(() => el.remove(), ms);
  }

  function showBoardBanner(text) {
    const frame = containerEl?.querySelector('.rla-board-frame');
    if (!frame) return;
    frame.querySelectorAll('.rla-board-banner').forEach(e => e.remove());
    const el = document.createElement('div');
    el.className = 'rla-board-banner';
    el.textContent = text;
    frame.append(el);
    setTimeout(() => el.remove(), 1500);
  }

  function spawnConfetti(count = 42) {
    const colors = ['#f4bd41', '#e52d2d', '#1e78ff', '#1ea849', '#fff4d6', '#ff6ec7'];
    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      piece.className = 'rla-confetti';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = `${Math.random() * 0.7}s`;
      piece.style.animationDuration = `${1.9 + Math.random() * 1.2}s`;
      document.body.append(piece);
      setTimeout(() => piece.remove(), 3400);
    }
  }

  function spawnCaptureBurst(row, col) {
    const surface = containerEl?.querySelector('.rla-board-surface');
    if (!surface) return;
    const fx = document.createElement('div');
    fx.className = 'rla-fx-burst';
    fx.style.left = `${((col + 0.5) / 15) * 100}%`;
    fx.style.top = `${((row + 0.5) / 15) * 100}%`;
    surface.append(fx);
    const frame = containerEl?.querySelector('.rla-board-frame');
    if (frame) {
      frame.classList.remove('shake');
      void frame.offsetWidth;
      frame.classList.add('shake');
    }
    setTimeout(() => fx.remove(), 600);
  }

  function showEmoteOnSeat(color, content) {
    const seat = containerEl?.querySelector(`.rla-seat-card.color-${color}`);
    if (!seat) return;
    seat.querySelectorAll('.rla-emote-bubble').forEach(e => e.remove());
    const b = document.createElement('div');
    b.className = 'rla-emote-bubble';
    b.textContent = content;
    seat.append(b);
    global.RLASound?.emote();
    setTimeout(() => b.remove(), 2250);
  }

  function clearTimers() {
    if (turnTimerId) { clearInterval(turnTimerId); turnTimerId = null; }
    if (rushTimerId) { clearInterval(rushTimerId); rushTimerId = null; }
    if (aiTimeoutId) { clearTimeout(aiTimeoutId); aiTimeoutId = null; }
  }

  function closeChannel() {
    if (boardChannel) {
      try { boardChannel.close(); } catch {}
      boardChannel = null;
    }
  }

  function buildBoardSVG() {
    const { MAIN_TRACK, SAFE_TRACK_INDICES, START_INDEX, HOME_STRETCH, YARD_SLOTS } = global.LudoCore;
    const parts = [];
    parts.push(`<svg class="rla-board-svg" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">`);
    // Flat antique-gold highlights; no gradient or neon effects.


    // Parchment board base
    parts.push(`<rect x="0" y="0" width="150" height="150" fill="#fbf2dc"/>`);

    // Draw 15x15 track cells
    const startCells = {
      [START_INDEX.red]: COLOR_THEME.red.main,
      [START_INDEX.green]: COLOR_THEME.green.main,
      [START_INDEX.yellow]: COLOR_THEME.yellow.main,
      [START_INDEX.blue]: COLOR_THEME.blue.main
    };

    MAIN_TRACK.forEach(([r, c], idx) => {
      const fill = startCells[idx] || '#fff8e8';
      parts.push(`<rect x="${c * 10}" y="${r * 10}" width="10" height="10" fill="${fill}" stroke="#bfa272" stroke-width="0.45"/>`);
      if (SAFE_TRACK_INDICES.has(idx)) {
        const starFill = startCells[idx] ? '#fff8d6' : '#d6971c';
        parts.push(`<text x="${c * 10 + 5}" y="${r * 10 + 7.4}" text-anchor="middle" font-size="6.8" fill="${starFill}">★</text>`);
      }
    });

    // Home stretch colored lanes (first 5 cells)
    Object.entries(HOME_STRETCH).forEach(([color, cells]) => {
      const fill = COLOR_THEME[color].main;
      for (let i = 0; i < 5; i++) {
        const [r, c] = cells[i];
        parts.push(`<rect x="${c * 10}" y="${r * 10}" width="10" height="10" fill="${fill}" stroke="#fff4d6" stroke-width="0.45"/>`);
      }
    });

    // 4 Corner Yards
    const yards = [
      { color: 'red', x: 0, y: 0 },
      { color: 'green', x: 90, y: 0 },
      { color: 'yellow', x: 90, y: 90 },
      { color: 'blue', x: 0, y: 90 }
    ];
    yards.forEach(({ color, x, y }) => {
      const t = COLOR_THEME[color];
      parts.push(`<rect x="${x}" y="${y}" width="60" height="60" fill="${t.main}" stroke="#6b3e14" stroke-width="0.8"/>`);
      parts.push(`<rect x="${x + 7.5}" y="${y + 7.5}" width="45" height="45" rx="7" fill="#fff7e2" stroke="#d9a438" stroke-width="1.4"/>`);
      YARD_SLOTS[color].forEach(([r, c]) => {
        const cx = (c + 0.5) * 10;
        const cy = (r + 0.5) * 10;
        parts.push(`<circle cx="${cx}" cy="${cy}" r="6.6" fill="${t.tint}" stroke="${t.main}" stroke-width="1.3"/>`);
        parts.push(`<circle cx="${cx}" cy="${cy}" r="4.2" fill="none" stroke="${t.dark}" stroke-opacity="0.25" stroke-width="0.6"/>`);
      });
    });

    // Center Victory Crown Home (rows 6..8, cols 6..8 -> 60..90)
    parts.push(`<polygon points="60,60 75,75 60,90" fill="${COLOR_THEME.red.main}" stroke="#fff4d6" stroke-width="0.6"/>`);
    parts.push(`<polygon points="60,60 90,60 75,75" fill="${COLOR_THEME.green.main}" stroke="#fff4d6" stroke-width="0.6"/>`);
    parts.push(`<polygon points="90,60 90,90 75,75" fill="${COLOR_THEME.yellow.main}" stroke="#fff4d6" stroke-width="0.6"/>`);
    parts.push(`<polygon points="60,90 90,90 75,75" fill="${COLOR_THEME.blue.main}" stroke="#fff4d6" stroke-width="0.6"/>`);
    parts.push(`<circle cx="75" cy="75" r="7.5" fill="#d9a438" stroke="#5b2c0a" stroke-width="1"/>`);
    parts.push(`<text x="75" y="78" text-anchor="middle" font-size="8.5" fill="#4f1c05">👑</text>`);

    parts.push(`</svg>`);
    return parts.join('');
  }

  function buildPawnSVG(color) {
    const t = COLOR_THEME[color];
    return `<svg class="rla-pawn-svg" viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="20" cy="43" rx="13" ry="4.5" fill="rgba(0,0,0,0.38)"/>
      <path d="M9 40 C9 30 14 23 20 18 C26 23 31 30 31 40 Z" fill="${t.main}" stroke="${t.dark}" stroke-width="2"/>
      <path d="M13 38 C13 31 16 25 20 21" stroke="${t.light}" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.8"/>
      <circle cx="20" cy="14" r="9.5" fill="${t.main}" stroke="${t.dark}" stroke-width="2"/>
      <circle cx="16.5" cy="11" r="3" fill="#ffffff" opacity="0.72"/>
      <ellipse cx="20" cy="40" rx="11.5" ry="3.2" fill="${t.dark}" opacity="0.45"/>
    </svg>`;
  }

  function buildDiceFaceHTML(value, rolling = false) {
    const on = new Set(PIP_MAP[value || 6] || PIP_MAP[6]);
    let pips = '';
    for (let i = 0; i < 9; i++) {
      pips += `<span class="rla-pip ${on.has(i) ? 'on' : ''}"></span>`;
    }
    return `<div class="rla-dice-face ${rolling ? 'rolling' : ''}">${pips}</div>`;
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function renderArena() {
    if (!engine || !containerEl) return;
    const state = global.RLAState.get();
    const boardTheme = `theme-${state.inventory.activeBoard || 'royal-walnut'}`;
    const diceSkin = `dice-${state.inventory.activeDice || 'classic-ivory'}`;

    const byColor = {};
    engine.players.forEach(p => { byColor[p.color] = p; });

    const renderSeat = (color, rightSide) => {
      const p = byColor[color];
      if (!p) {
        return `<div class="rla-seat-card empty color-${color} ${rightSide ? 'seat-right' : ''}">Open Seat</div>`;
      }
      const isActive = engine.phase !== 'finished' && engine.getCurrentPlayer().id === p.id;
      const done = engine.getFinishedCount(p);
      const needed = engine.tokensNeededToWin();
      const pips = Array.from({ length: needed }, (_, i) => `<span class="rla-home-pip ${i < done ? 'done' : ''}"></span>`).join('');
      const canClickDice = isActive && engine.phase === 'roll' && p.isLocalHuman && !animating;
      const diceVal = isActive && engine.diceValue ? engine.diceValue : 6;
      const teamBadge = engine.mode === 'teamUp' ? ` · T${p.teamId + 1}` : '';
      const scoreBadge = engine.mode === 'rush' ? ` · ${p.score}pt` : '';

      return `
        <div class="rla-seat-card color-${color} ${rightSide ? 'seat-right' : ''} ${isActive ? 'active' : ''}" data-seat-color="${color}">
          <div class="rla-avatar-wrap">
            <svg class="rla-timer-ring" viewBox="0 0 50 50">
              <circle class="bg" cx="25" cy="25" r="22"></circle>
              <circle class="fg" data-timer-ring="${color}" cx="25" cy="25" r="22" stroke-dasharray="138.2" stroke-dashoffset="${isActive ? 0 : 138.2}"></circle>
            </svg>
            <div class="rla-avatar-circle">${p.avatar}</div>
          </div>
          <div class="rla-seat-meta">
            <div class="rla-seat-name">${escapeHtml(p.displayName)}${p.finishedRank ? ` (#${p.finishedRank})` : ''}</div>
            <div class="rla-seat-sub">
              <span class="rla-home-pips">${pips}</span>
              <span>${p.isHuman ? 'YOU' : p.aiLevel.toUpperCase()}${teamBadge}${scoreBadge}</span>
            </div>
          </div>
          <div class="rla-dice-dock ${diceSkin}">
            <button type="button" class="rla-dice-btn ${canClickDice ? 'ready' : ''}" data-dice-player="${p.id}" ${canClickDice ? '' : 'disabled'} aria-label="Roll dice for ${escapeHtml(p.displayName)}">
              ${buildDiceFaceHTML(diceVal, false)}
            </button>
          </div>
        </div>
      `;
    };

    const current = engine.getCurrentPlayer();
    const sfxOn = state.settings.sfx !== false;
    let promptText = '';
    if (engine.phase === 'finished') {
      promptText = 'Match Complete!';
    } else if (engine.phase === 'roll') {
      promptText = current.isLocalHuman ? `${current.displayName}: Tap Dice or press Space!` : `${current.displayName} is rolling...`;
    } else {
      promptText = current.isLocalHuman ? `${current.displayName}: Rolled ${engine.diceValue} — Choose a pawn!` : `${current.displayName} rolled ${engine.diceValue}...`;
    }

    const showReroll = engine.mode === 'popular' && engine.phase === 'move' && current.isLocalHuman && current.rerollsLeft > 0;

    containerEl.innerHTML = `
      <div class="rla-arena-shell ${boardTheme}">
        <div class="rla-arena-inner">
          <header class="rla-top-bar">
            <div class="rla-top-left">
              <button type="button" class="rla-icon-btn" id="rla-btn-exit" title="Leave Match" aria-label="Leave Match">←</button>
              <span class="rla-mode-pill">👑 ${MODE_LABELS[engine.mode] || engine.mode}</span>
              ${engine.mode === 'rush' ? `<span class="rla-timer-pill" id="rla-rush-clock">⏱ ${formatTime(engine.rushSecondsLeft)}</span>` : ''}
              ${engine.prizeCoins > 0 ? `<span class="rla-timer-pill">🪙 ${engine.prizeCoins.toLocaleString()}</span>` : ''}
              ${engine.roomCode ? `<span class="rla-timer-pill">Room ${engine.roomCode}</span>` : ''}
            </div>
            <div class="rla-top-right">
              <button type="button" class="rla-icon-btn ${fastMode ? 'active' : ''}" id="rla-btn-speed" title="Toggle 2x Speed">${fastMode ? '2x' : '1x'}</button>
              <button type="button" class="rla-icon-btn" id="rla-btn-sfx" title="Toggle Sound">${sfxOn ? '🔊' : '🔇'}</button>
              <button type="button" class="rla-icon-btn" id="rla-btn-rules" title="Game Rules">?</button>
            </div>
          </header>

          <div class="rla-seat-row">
            ${renderSeat('red', false)}
            ${renderSeat('green', true)}
          </div>

          <div class="rla-board-frame">
            <div class="rla-board-surface">
              ${buildBoardSVG()}
              <div class="rla-tokens-layer" id="rla-tokens-layer"></div>
            </div>
          </div>

          <div class="rla-seat-row">
            ${renderSeat('blue', false)}
            ${renderSeat('yellow', true)}
          </div>

          <footer class="rla-bottom-bar">
            <div class="rla-turn-prompt" id="rla-turn-prompt">${escapeHtml(promptText)}</div>
            ${showReroll ? `<button type="button" class="rla-reroll-btn" id="rla-btn-reroll">🎲 Reroll (${current.rerollsLeft})</button>` : ''}
            <div class="rla-emote-strip">
              ${EMOTES.map(e => `<button type="button" class="rla-emote-btn" data-emote="${e}" aria-label="Send emote ${e}">${e}</button>`).join('')}
            </div>
          </footer>
        </div>
      </div>
    `;

    // Wire events
    containerEl.querySelector('#rla-btn-exit')?.addEventListener('click', confirmExit);
    containerEl.querySelector('#rla-btn-speed')?.addEventListener('click', () => {
      fastMode = !fastMode;
      global.RLAState.updateSettings({ fastSpeed: fastMode });
      global.RLASound?.click();
      renderArena();
      renderTokens();
    });
    containerEl.querySelector('#rla-btn-sfx')?.addEventListener('click', () => {
      const next = !(global.RLAState.getSettings().sfx !== false);
      global.RLAState.updateSettings({ sfx: next });
      if (next) global.RLASound?.click();
      renderArena();
      renderTokens();
    });
    containerEl.querySelector('#rla-btn-rules')?.addEventListener('click', showRulesModal);
    containerEl.querySelector('#rla-btn-reroll')?.addEventListener('click', handlePowerReroll);

    containerEl.querySelectorAll('[data-dice-player]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!animating) triggerRoll();
      });
    });

    containerEl.querySelectorAll('[data-emote]').forEach(btn => {
      btn.addEventListener('click', () => {
        const human = engine.players.find(p => p.isLocalHuman) || engine.getCurrentPlayer();
        showEmoteOnSeat(human.color, btn.dataset.emote);
        broadcastAction({ type: 'emote', color: human.color, emote: btn.dataset.emote });
      });
    });

    renderTokens();
    updateTimerRing();
  }

  function renderTokens(overridePos = null) {
    const layer = containerEl?.querySelector('#rla-tokens-layer');
    if (!layer || !engine) return;
    const { getTokenCoords, MAX_PROGRESS } = global.LudoCore;

    // Group tokens by cell coordinate to apply clean stack offsets
    const cellGroups = new Map();
    const tokenList = [];

    engine.players.forEach(p => {
      p.tokens.forEach(tok => {
        if (tok.progress === MAX_PROGRESS) return; // Finished tokens sit in crown
        let coords;
        if (overridePos && overridePos.playerId === p.id && overridePos.tokenId === tok.id) {
          coords = getTokenCoords(p.color, tok.id, overridePos.progress);
        } else {
          coords = getTokenCoords(p.color, tok.id, tok.progress);
        }
        const key = `${coords[0].toFixed(1)},${coords[1].toFixed(1)}`;
        if (!cellGroups.has(key)) cellGroups.set(key, []);
        const entry = { player: p, token: tok, coords, key };
        cellGroups.get(key).push(entry);
        tokenList.push(entry);
      });
    });

    const current = engine.getCurrentPlayer();
    const stackOffsets = [
      [0, 0], [-1.3, -1.0], [1.3, -1.0], [-1.3, 1.0], [1.3, 1.0], [0, -1.5]
    ];

    layer.innerHTML = '';
    tokenList.forEach(({ player, token, coords, key }) => {
      const group = cellGroups.get(key);
      const idxInGroup = group.indexOf(group.find(g => g.player.id === player.id && g.token.id === token.id));
      const [ox, oy] = group.length > 1 ? (stackOffsets[idxInGroup % stackOffsets.length] || [0, 0]) : [0, 0];

      const isMovable = !animating && engine.phase === 'move' && current.id === player.id && current.isLocalHuman && engine.validTokenIds.includes(token.id);
      const isHopping = overridePos && overridePos.playerId === player.id && overridePos.tokenId === token.id;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `rla-pawn-btn ${isMovable ? 'movable' : ''} ${isHopping ? 'hopping' : ''}`;
      btn.style.left = `${((coords[1] + 0.5) / 15) * 100 + ox}%`;
      btn.style.top = `${((coords[0] + 0.5) / 15) * 100 + oy}%`;
      if (group.length > 1 && !isMovable) {
        btn.style.width = '5.4%';
        btn.style.height = '5.4%';
      }
      btn.setAttribute('aria-label', `${player.displayName} ${player.color} pawn ${token.id + 1}`);
      btn.innerHTML = `${isMovable ? '<span class="rla-pawn-ring"></span>' : ''}${buildPawnSVG(player.color)}${group.length > 1 && idxInGroup === group.length - 1 ? `<span class="rla-stack-badge">${group.length}</span>` : ''}`;

      if (isMovable) {
        btn.addEventListener('click', () => triggerMove(token.id));
      }
      layer.append(btn);
    });
  }

  function updateTimerRing() {
    if (!engine || !containerEl) return;
    const current = engine.getCurrentPlayer();
    const ring = containerEl.querySelector(`[data-timer-ring="${current.color}"]`);
    if (!ring) return;
    const pct = Math.max(0, turnRemaining / engine.turnSeconds);
    ring.setAttribute('stroke-dashoffset', String(138.2 * (1 - pct)));
    ring.style.stroke = pct < 0.3 ? '#ff5454' : '#ffd55a';
  }

  function startTurnClock() {
    if (turnTimerId) clearInterval(turnTimerId);
    if (!engine || engine.phase === 'finished') return;

    turnRemaining = engine.turnSeconds;
    updateTimerRing();

    const current = engine.getCurrentPlayer();
    if (!current.isLocalHuman) {
      // Schedule AI turn
      const delay = fastMode ? 320 : 680;
      aiTimeoutId = setTimeout(() => {
        if (!engine || engine.phase === 'finished') return;
        if (engine.phase === 'roll') triggerRoll();
      }, delay);
      return;
    }

    turnTimerId = setInterval(() => {
      if (!engine || engine.phase === 'finished' || animating) return;
      turnRemaining -= 1;
      updateTimerRing();
      if (turnRemaining <= 0) {
        clearInterval(turnTimerId);
        turnTimerId = null;
        if (engine.phase === 'roll') {
          toast(`${current.displayName} timed out — auto-rolling!`);
          triggerRoll();
        } else if (engine.phase === 'move' && engine.validTokenIds.length > 0) {
          toast(`Auto-moving ${current.displayName}'s pawn`);
          triggerMove(engine.validTokenIds[0]);
        }
      }
    }, 1000);
  }

  function startRushClock() {
    if (rushTimerId) clearInterval(rushTimerId);
    if (!engine || engine.mode !== 'rush' || engine.phase === 'finished') return;
    rushTimerId = setInterval(() => {
      if (!engine || engine.phase === 'finished') {
        clearInterval(rushTimerId);
        return;
      }
      engine.rushSecondsLeft = Math.max(0, engine.rushSecondsLeft - 1);
      const clock = containerEl?.querySelector('#rla-rush-clock');
      if (clock) clock.textContent = `⏱ ${formatTime(engine.rushSecondsLeft)}`;
      if (engine.rushSecondsLeft <= 0) {
        clearTimers();
        engine.finishRushByTimer();
        handleGameFinished();
      }
    }, 1000);
  }

  function handlePowerReroll() {
    if (!engine || animating) return;
    const res = engine.usePowerReroll();
    if (!res.ok) return;
    global.RLASound?.select();
    showBoardBanner('🎲 POWER REROLL!');
    renderArena();
    startTurnClock();
  }

  function triggerRoll(forcedVal = null, fromRemote = false) {
    if (!engine || engine.phase !== 'roll' || animating) return;
    animating = true;
    if (turnTimerId) { clearInterval(turnTimerId); turnTimerId = null; }

    const current = engine.getCurrentPlayer();
    const diceBtn = containerEl?.querySelector(`[data-dice-player="${current.id}"]`);
    if (diceBtn) diceBtn.innerHTML = buildDiceFaceHTML(6, true);
    global.RLASound?.diceRoll();

    const rollDuration = fastMode ? 240 : 460;
    setTimeout(() => {
      const res = engine.rollDice(forcedVal);
      if (!res.ok) { animating = false; return; }
      if (!fromRemote) broadcastAction({ type: 'roll', value: res.value });

      if (res.value === 6) global.RLASound?.rollSix();
      global.RLAState.saveActiveMatch(engine.serialize());

      if (res.forfeit) {
        global.RLASound?.forfeit();
        showBoardBanner('🚫 THREE 6s — TURN FORFEITED!');
        animating = false;
        renderArena();
        startTurnClock();
        return;
      }

      if (res.noMoves) {
        showBoardBanner(`Rolled ${res.value} — No valid moves`);
        animating = false;
        renderArena();
        startTurnClock();
        return;
      }

      animating = false;
      renderArena();

      // Auto-move if AI, or if human has only 1 valid move & setting enabled
      const autoSingle = global.RLAState.getSettings().autoSingleMove !== false;
      if (!current.isLocalHuman) {
        const aiPick = global.LudoAI.chooseBestToken(engine, current.id, res.value, res.validTokenIds, current.aiLevel);
        aiTimeoutId = setTimeout(() => triggerMove(aiPick), fastMode ? 260 : 540);
      } else if (autoSingle && res.validTokenIds.length === 1 && !(engine.mode === 'popular' && current.rerollsLeft > 0)) {
        aiTimeoutId = setTimeout(() => triggerMove(res.validTokenIds[0]), fastMode ? 180 : 360);
      } else {
        startTurnClock();
      }
    }, rollDuration);
  }

  async function triggerMove(tokenId, fromRemote = false) {
    if (!engine || engine.phase !== 'move' || animating) return;
    animating = true;
    if (turnTimerId) { clearInterval(turnTimerId); turnTimerId = null; }

    const player = engine.getCurrentPlayer();
    const res = engine.moveToken(tokenId);
    if (!res.ok) { animating = false; return; }
    if (!fromRemote) broadcastAction({ type: 'move', tokenId });

    // Smooth step-by-step hop animation
    const hopMs = fastMode ? 70 : 145;
    for (let i = 0; i < res.pathSteps.length; i++) {
      const stepProg = res.pathSteps[i];
      renderTokens({ playerId: res.playerIndex, tokenId: res.tokenId, progress: stepProg });
      if (res.exitedBase && i === 0) global.RLASound?.tokenExit();
      else global.RLASound?.hop(i);
      await new Promise(r => setTimeout(r, hopMs));
    }

    // Post-move FX
    if (res.captured.length > 0) {
      global.RLASound?.capture();
      const coords = global.LudoCore.getTokenCoords(res.color, res.tokenId, res.toProgress);
      spawnCaptureBurst(coords[0], coords[1]);
      showBoardBanner('💥 CAPTURED! +1 BONUS TURN');
      if (!player.isLocalHuman && Math.random() < 0.65) {
        showEmoteOnSeat(player.color, '😎');
      }
    } else if (res.reachedHome) {
      global.RLASound?.homeReach();
      spawnConfetti(22);
      showBoardBanner('👑 PAWN REACHED HOME!');
    } else if (res.landedSafe && !res.exitedBase) {
      global.RLASound?.safeZone();
    } else if (res.bonusTurn && res.diceValue === 6) {
      showBoardBanner('🎲 ROLLED 6 — ROLL AGAIN!');
    }

    animating = false;
    global.RLAState.saveActiveMatch(res.gameFinished ? null : engine.serialize());
    renderArena();

    if (res.gameFinished) {
      handleGameFinished();
    } else {
      startTurnClock();
    }
  }

  function handleGameFinished() {
    clearTimers();
    global.RLAState.saveActiveMatch(null);
    global.RLASound?.victory();
    spawnConfetti(60);

    const winnerIdx = engine.rankings[0];
    const winner = engine.players[winnerIdx];
    const humanPlayer = engine.players.find(p => p.isLocalHuman);
    const humanWon = humanPlayer
      ? (engine.mode === 'teamUp' ? humanPlayer.teamId === engine.winnerTeam : winnerIdx === humanPlayer.id)
      : true;

    const prizeWon = humanWon ? (engine.prizeCoins || 250) : 0;
    const resultInfo = global.RLAState.recordMatchResult({
      won: humanWon,
      captures: humanPlayer ? humanPlayer.captures : 0,
      sixes: humanPlayer ? humanPlayer.sixes : 0,
      prizeCoins: prizeWon,
      tournament: Boolean(tournamentState && tournamentState.stage === 'final' && humanWon)
    });

    // Tournament progression
    if (tournamentState && tournamentState.stage === 'semi') {
      if (humanWon) {
        setTimeout(() => showTournamentAdvanceModal(prizeWon), 700);
        return;
      } else {
        tournamentState = null;
      }
    } else if (tournamentState && tournamentState.stage === 'final') {
      tournamentState = null;
    }

    const rows = engine.rankings.map((pid, idx) => {
      const p = engine.players[pid];
      const medal = ['🥇', '🥈', '🥉', '4️⃣'][idx] || `#${idx + 1}`;
      return `<div class="rla-list-row ${p.isLocalHuman ? 'self' : ''}">
        <span>${medal} ${p.avatar} <strong>${escapeHtml(p.name)}</strong></span>
        <span>⚔️ ${p.captures} · 👑 ${engine.getFinishedCount(p)}</span>
      </div>`;
    }).join('');

    const title = engine.mode === 'teamUp'
      ? `TEAM ${engine.winnerTeam + 1} WINS!`
      : `${escapeHtml(winner.name.toUpperCase())} WINS!`;

    const summary = humanWon
      ? `Victory! You earned +${prizeWon.toLocaleString()} Coins & +60 XP${resultInfo.leveledUp ? ' — LEVEL UP! 🎉' : ''}`
      : `Good match! You earned +20 XP for playing.`;

    setTimeout(() => {
      openCustomModal(title, `
        <p style="margin:0;text-align:center;font-weight:800;color:#ffe28a">${summary}</p>
        <div class="rla-list">${rows}</div>
      `, [
        ['Play Again', () => startMatch({
          mode: engine.mode,
          entryMode: engine.entryMode,
          difficulty: engine.difficulty,
          prizeCoins: engine.prizeCoins,
          playerCount: engine.players.length,
          primaryColor: engine.players[0].color
        })],
        ['Home', () => exitToHome()]
      ]);
    }, 650);
  }

  function showTournamentAdvanceModal() {
    openCustomModal('SEMI-FINAL WON! 🏆', `
      <p style="margin:0;text-align:center">You crushed the Semi-Final! Advance to the <strong>Royal Grand Final</strong> for the <strong>5,000 Coins Trophy</strong>.</p>
    `, [
      ['Play Grand Final', () => {
        tournamentState.stage = 'final';
        const profile = global.RLAState.get().profile;
        startMatch({
          mode: 'classic',
          entryMode: 'tournament',
          difficulty: 'hard',
          prizeCoins: 5000,
          players: [
            { color: 'blue', name: profile.name, avatar: profile.avatar, isHuman: true, isLocalHuman: true },
            { color: 'red', name: 'Champion Vikram', avatar: '🦁', isHuman: false, aiLevel: 'hard' },
            { color: 'green', name: 'Grandmaster Aanya', avatar: '👑', isHuman: false, aiLevel: 'expert' },
            { color: 'yellow', name: 'Master Rohan', avatar: '🐉', isHuman: false, aiLevel: 'hard' }
          ]
        });
      }],
      ['Home', () => { tournamentState = null; exitToHome(); }]
    ]);
  }

  function showRulesModal() {
    const modeDesc = {
      classic: 'Roll a 6 to bring pawns out of base. Race all 4 pawns to the center Crown. Star squares (★) are safe zones. Rolling 6, capturing, or reaching Home grants a bonus roll! Three 6s in a row forfeits your turn.',
      quick: '1 pawn starts pre-deployed on your start square! First player to bring 2 pawns to the center Crown wins.',
      rush: '3-minute Blitz! Every step = +1 pt, Capture = +25 pts, Home = +50 pts. Highest score when time expires (or first to finish) wins!',
      oneKillWin: 'Sudden Death! First player to capture ANY opponent pawn OR reach Home with 1 pawn wins immediately!',
      teamUp: '2v2 Partner Battle! Blue + Green vs Red + Yellow. Partners cannot capture each other. Both partners must finish to win!',
      popular: 'Classic Ludo with 2 Power Rerolls per player! Tap "Reroll" after any roll to try for a better number.',
      mask: 'Mystery rivals! Opponent identities stay hidden behind royal masks until the final podium.'
    };
    openCustomModal(`RULES — ${MODE_LABELS[engine.mode] || 'LUDO'}`, `<p style="margin:0;line-height:1.5">${modeDesc[engine.mode] || modeDesc.classic}</p>`);
  }

  function confirmExit() {
    openCustomModal('LEAVE MATCH?', '<p style="margin:0">Your game is automatically saved so you can resume anytime from Home, or quit cleanly.</p>', [
      ['Save & Home', () => {
        if (engine && engine.phase !== 'finished') global.RLAState.saveActiveMatch(engine.serialize());
        exitToHome();
      }],
      ['Abandon Match', () => {
        global.RLAState.saveActiveMatch(null);
        tournamentState = null;
        exitToHome();
      }]
    ]);
  }

  function exitToHome() {
    clearTimers();
    closeChannel();
    engine = null;
    window.location.hash = 'home';
  }

  /* ---------- BroadcastChannel Multi-Tab Local Sync for Private Rooms ---------- */
  function setupRoomChannel(roomCode) {
    closeChannel();
    if (!roomCode || typeof BroadcastChannel === 'undefined') return;
    try {
      boardChannel = new BroadcastChannel(`rla-room-${roomCode}`);
      boardChannel.onmessage = (ev) => {
        const msg = ev.data;
        if (!msg || !engine) return;
        if (msg.type === 'roll' && engine.phase === 'roll') triggerRoll(msg.value, true);
        else if (msg.type === 'move' && engine.phase === 'move') triggerMove(msg.tokenId, true);
        else if (msg.type === 'emote') showEmoteOnSeat(msg.color, msg.emote);
      };
    } catch {}
  }

  function broadcastAction(payload) {
    if (boardChannel) {
      try { boardChannel.postMessage(payload); } catch {}
    }
  }

  /* ---------- Match Entry Points & Lobbies ---------- */
  function startMatch(config) {
    clearTimers();
    closeChannel();
    fastMode = Boolean(global.RLAState.getSettings().fastSpeed);
    engine = new global.LudoCore.LudoEngine(config);
    if (config.roomCode) setupRoomChannel(config.roomCode);

    containerEl = document.getElementById('app');
    if (window.location.hash !== '#play') {
      window.location.hash = 'play';
    }
    document.title = `Playing ${MODE_LABELS[engine.mode] || 'Ludo'} | Royal Ludo Arena`;
    global.RLAState.saveActiveMatch(engine.serialize());
    renderArena();
    startTurnClock();
    startRushClock();
  }

  function resumeSavedMatch() {
    const snap = global.RLAState.loadActiveMatch();
    if (!snap) return false;
    clearTimers();
    closeChannel();
    fastMode = Boolean(global.RLAState.getSettings().fastSpeed);
    try {
      if (!snap || !Array.isArray(snap.players) || snap.players.length < 2 || snap.players.length > 4 ||
          !snap.players.every(p => p && Array.isArray(p.tokens) && p.tokens.length === 4 &&
            p.tokens.every(t => Number.isInteger(t.progress) && t.progress >= -1 && t.progress <= 56)) ||
          !Number.isInteger(snap.currentTurn) || snap.currentTurn < 0 || snap.currentTurn >= snap.players.length ||
          !['roll', 'move', 'finished'].includes(snap.phase)) throw Error('Invalid saved match');
      engine = global.LudoCore.LudoEngine.deserialize(snap);
    } catch {
      global.RLAState.saveActiveMatch(null);
      toast('Saved match could not be restored. Start a new game.');
      return false;
    }
    if (engine.roomCode) setupRoomChannel(engine.roomCode);
    containerEl = document.getElementById('app');
    if (window.location.hash !== '#play') window.location.hash = 'play';
    document.title = `Playing ${MODE_LABELS[engine.mode] || 'Ludo'} | Royal Ludo Arena`;
    renderArena();
    startTurnClock();
    startRushClock();
    return true;
  }

  function openMatchmakingLobby({ mode = 'classic', entryMode = 'online', teamBattle = false, teamComposition = '4Online' }) {
    const profile = global.RLAState.get().profile;
    const entryFee = 100;
    const prizeCoins = teamBattle ? 400 : 380;

    if (global.RLAState.get().currency.coins < entryFee) {
      toast('Not enough coins! Claim Free Coins or Daily Reward first.');
    }

    const picks = [];
    const shuffled = [...BOT_NAMES].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 3; i++) {
      picks.push({ name: shuffled[i], avatar: BOT_AVATARS[i] });
    }

    const veil = openCustomModal(teamBattle ? 'OFFLINE 2v2 PRACTICE' : 'OFFLINE BOT PRACTICE', `
      <p style="margin:0;text-align:center;color:#ffe082;font-weight:800">Mode: ${MODE_LABELS[mode] || mode} · Entry: ${entryFee} 🪙 · Prize: ${prizeCoins} 🪙</p>
      <div class="rla-list" id="rla-mm-list">
        <div class="rla-list-row self"><span>${profile.avatar} <strong>${escapeHtml(profile.name)}</strong> (You)</span><span>Ready ✓</span></div>
        <div class="rla-list-row" id="rla-mm-1"><span>Searching opponent...</span><span>⏳</span></div>
        <div class="rla-list-row" id="rla-mm-2"><span>${teamBattle && teamComposition === '2Friends2Online' ? '🤝 Partner Slot' : 'Searching opponent...'}</span><span>⏳</span></div>
        <div class="rla-list-row" id="rla-mm-3"><span>Searching opponent...</span><span>⏳</span></div>
      </div>
      <p class="rla-hint" style="text-align:center">OFFLINE BOT MATCH: All opponents are computer-controlled, not live Internet players.</p>
    `, [
      ['Cancel', () => {}]
    ]);

    const timers = [];
    picks.forEach((bot, i) => {
      timers.push(setTimeout(() => {
        const row = veil.querySelector(`#rla-mm-${i + 1}`);
        if (row) {
          const role = (teamBattle && i === 1) ? 'Partner ✓' : 'Matched ✓';
          row.innerHTML = `<span>${bot.avatar} <strong>${mode === 'mask' ? `Masked Rival #${i + 2}` : bot.name}</strong></span><span style="color:#86f28a">${role}</span>`;
          global.RLASound?.select();
        }
      }, 450 * (i + 1)));
    });

    timers.push(setTimeout(() => {
      if (!document.body.contains(veil)) return;
      veil.remove();
      global.RLAState.spendCurrency(Math.min(entryFee, global.RLAState.get().currency.coins), 0);
      const colors = ['blue', 'red', 'green', 'yellow'];
      const players = [
        { color: colors[0], name: profile.name, avatar: profile.avatar, isHuman: true, isLocalHuman: true },
        { color: colors[1], name: picks[0].name, avatar: picks[0].avatar, isHuman: false, aiLevel: 'medium' },
        { color: colors[2], name: picks[1].name, avatar: picks[1].avatar, isHuman: false, aiLevel: 'hard' },
        { color: colors[3], name: picks[2].name, avatar: picks[2].avatar, isHuman: false, aiLevel: 'medium' }
      ];
      startMatch({
        mode: teamBattle ? 'teamUp' : mode,
        entryMode,
        difficulty: 'medium',
        prizeCoins,
        players
      });
    }, 1850));

    veil.addEventListener('remove', () => timers.forEach(clearTimeout));
  }

  function openPrivateRoomLobby({ roomAction = 'create', roomCode = '', mode = 'classic' }) {
    const profile = global.RLAState.get().profile;
    const code = (roomAction === 'join' && roomCode.length === 6)
      ? roomCode
      : String(Math.floor(100000 + Math.random() * 900000));

    const seats = [
      { color: 'blue', name: profile.name, avatar: profile.avatar, type: 'human' },
      { color: 'red', name: 'Friend 2', avatar: '🦁', type: 'human' },
      { color: 'green', name: 'Bot Aanya', avatar: '🤖', type: 'ai' },
      { color: 'yellow', name: 'Empty', avatar: '➕', type: 'empty' }
    ];

    function renderRoomModal() {
      const seatRows = seats.map((s, idx) => `
        <div class="rla-list-row ${idx === 0 ? 'self' : ''}">
          <span><strong style="color:${COLOR_THEME[s.color].light}">${COLOR_THEME[s.color].label}</strong> · ${s.avatar} ${escapeHtml(s.name)}</span>
          ${idx === 0 ? '<span>Host</span>' : `<button type="button" class="rla-royal-btn secondary" data-toggle-seat="${idx}" style="padding:4px 9px;font-size:11px">${s.type === 'human' ? 'Local Human' : s.type === 'ai' ? 'AI Bot' : 'Empty'}</button>`}
        </div>
      `).join('');

      const veil = openCustomModal(`PRIVATE ROOM #${code}`, `
        <div style="display:flex;align-items:center;justify-content:space-between;background:#260e05;padding:10px 12px;border-radius:10px;border:1.5px solid #f4bd41">
          <span style="font-weight:900;font-size:18px;letter-spacing:0.14em;color:#ffe282">${code}</span>
          <button type="button" class="rla-royal-btn" id="rla-copy-room" style="padding:6px 10px;font-size:12px">Copy Code</button>
        </div>
        <p class="rla-hint">Tap seats below to switch between Local Friend, AI Bot, or Empty. Same-browser tabs on this device only. This room is NOT an Internet multiplayer lobby.</p>
        <div class="rla-list">${seatRows}</div>
      `, [
        ['Start Room Match', () => {
          const active = seats.filter(s => s.type !== 'empty');
          if (active.length < 2) { toast('Need at least 2 players!'); return; }
          startMatch({
            mode,
            entryMode: 'friends',
            roomCode: code,
            prizeCoins: 300,
            players: active.map(s => ({
              color: s.color,
              name: s.name,
              avatar: s.avatar,
              isHuman: s.type === 'human',
              isLocalHuman: s.type === 'human',
              aiLevel: 'medium'
            }))
          });
        }]
      ]);

      veil.querySelector('#rla-copy-room')?.addEventListener('click', () => {
        navigator.clipboard?.writeText(code).catch(() => {});
        global.RLASound?.select();
        toast(`Room Code ${code} — local browser tabs only`);
      });

      veil.querySelectorAll('[data-toggle-seat]').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.dataset.toggleSeat);
          const cur = seats[idx];
          if (cur.type === 'human') { cur.type = 'ai'; cur.name = `Bot ${idx + 1}`; cur.avatar = '🤖'; }
          else if (cur.type === 'ai') { cur.type = 'empty'; cur.name = 'Empty'; cur.avatar = '➕'; }
          else { cur.type = 'human'; cur.name = `Friend ${idx + 1}`; cur.avatar = BOT_AVATARS[idx]; }
          global.RLASound?.click();
          veil.remove();
          renderRoomModal();
        });
      });
    }

    renderRoomModal();
  }

  function openCustomComputerModal(mode = 'classic', difficulty = 'medium') {
    const profile = global.RLAState.get().profile;
    const seats = [
      { color: 'blue', name: profile.name, type: 'human', aiLevel: difficulty },
      { color: 'red', name: 'Bot Vikram', type: 'ai', aiLevel: difficulty },
      { color: 'green', name: 'Bot Aanya', type: 'ai', aiLevel: difficulty },
      { color: 'yellow', name: 'Bot Rohan', type: 'ai', aiLevel: difficulty }
    ];

    function renderCustom() {
      const rows = seats.map((s, idx) => `
        <div class="rla-list-row">
          <span style="font-weight:800;color:${COLOR_THEME[s.color].light}">${COLOR_THEME[s.color].label}</span>
          <input data-seat-name="${idx}" value="${escapeHtml(s.name)}" maxlength="16" style="width:120px;padding:4px 7px;font-size:13px">
          <button type="button" class="rla-royal-btn secondary" data-seat-type="${idx}" style="padding:4px 8px;font-size:11px">${s.type.toUpperCase()}</button>
        </div>
      `).join('');

      const veil = openCustomModal('CUSTOM MATCH SETUP', `
        <p class="rla-hint">Customize player names and toggle each seat between HUMAN, AI, or OFF.</p>
        <div class="rla-list">${rows}</div>
      `, [
        ['Launch Custom Match', () => {
          const active = seats.filter(s => s.type !== 'off');
          if (active.length < 2) { toast('Select at least 2 active players!'); return; }
          startMatch({
            mode,
            entryMode: 'computer',
            difficulty,
            prizeCoins: 250,
            players: active.map((s, i) => ({
              color: s.color,
              name: s.name.trim() || `Player ${i + 1}`,
              avatar: s.type === 'human' ? profile.avatar : BOT_AVATARS[i + 1],
              isHuman: s.type === 'human',
              isLocalHuman: s.type === 'human',
              aiLevel: difficulty
            }))
          });
        }]
      ]);

      veil.querySelectorAll('[data-seat-name]').forEach(inp => {
        inp.addEventListener('input', () => { seats[Number(inp.dataset.seatName)].name = inp.value; });
      });
      veil.querySelectorAll('[data-seat-type]').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.dataset.seatType);
          const order = ['human', 'ai', 'off'];
          seats[idx].type = order[(order.indexOf(seats[idx].type) + 1) % order.length];
          global.RLASound?.click();
          veil.remove();
          renderCustom();
        });
      });
    }
    renderCustom();
  }

  function openTournamentModal() {
    const profile = global.RLAState.get().profile;
    openCustomModal('ROYAL TOURNAMENT 🏆', `
      <p style="margin:0;text-align:center;color:#ffe285;font-weight:800">2-Round Knockout · Grand Prize: 5,000 Coins</p>
      <div class="rla-list">
        <div class="rla-list-row self"><span><strong>Round 1: Semi-Final</strong> (Quick Mode)</span><span>4 Players</span></div>
        <div class="rla-list-row"><span><strong>Round 2: Grand Final</strong> (Classic Hard AI)</span><span>5,000 🪙</span></div>
      </div>
      <p class="rla-hint" style="text-align:center">Win the Semi-Final to unlock the Royal Grand Final!</p>
    `, [
      ['Enter Tournament (Free)', () => {
        tournamentState = { stage: 'semi' };
        startMatch({
          mode: 'quick',
          entryMode: 'tournament',
          difficulty: 'medium',
          prizeCoins: 500,
          players: [
            { color: 'blue', name: profile.name, avatar: profile.avatar, isHuman: true, isLocalHuman: true },
            { color: 'red', name: 'Duke Kabir', avatar: '🦅', isHuman: false, aiLevel: 'medium' },
            { color: 'green', name: 'Lady Meera', avatar: '🦊', isHuman: false, aiLevel: 'medium' },
            { color: 'yellow', name: 'Lord Arjun', avatar: '🐯', isHuman: false, aiLevel: 'hard' }
          ]
        });
      }]
    ]);
  }

  function openCustomModal(title, htmlBody, actions = []) {
    document.getElementById('rla-dialog')?.remove();
    const veil = document.createElement('div');
    veil.id = 'rla-dialog';
    veil.className = 'rla-dialog-veil';
    const card = document.createElement('section');
    card.className = 'rla-dialog';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.innerHTML = `
      <header class="rla-dialog-title">${title}<button class="rla-dialog-x" type="button" aria-label="Close">×</button></header>
      <div class="rla-dialog-body" style="white-space:normal">${htmlBody}</div>
      <footer></footer>
    `;
    const foot = card.querySelector('footer');
    if (actions.length) {
      for (const [label, fn] of actions) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'rla-dialog-action';
        b.textContent = label;
        b.addEventListener('click', () => { global.RLASound?.click(); veil.remove(); fn(); });
        foot.append(b);
      }
    } else {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'rla-dialog-action';
      b.textContent = 'OK';
      b.addEventListener('click', () => { global.RLASound?.click(); veil.remove(); });
      foot.append(b);
    }
    card.querySelector('.rla-dialog-x')?.addEventListener('click', () => { global.RLASound?.click(); veil.remove(); });
    veil.addEventListener('click', e => { if (e.target === veil) veil.remove(); });
    veil.append(card);
    document.body.append(veil);
    return veil;
  }

  // Spacebar shortcut to roll dice
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && window.location.hash === '#play' && engine && engine.phase === 'roll' && !animating) {
        if (engine.getCurrentPlayer()?.isLocalHuman && !document.getElementById('rla-dialog')) {
          e.preventDefault();
          triggerRoll();
        }
      }
    });
  }

  global.RLAGameView = {
    startMatch,
    resumeSavedMatch,
    openMatchmakingLobby,
    openPrivateRoomLobby,
    openCustomComputerModal,
    openTournamentModal,
    openCustomModal,
    toast,
    isActive: () => Boolean(engine),
    destroy: () => { clearTimers(); closeChannel(); engine = null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
