/**
 * Royal Ludo Arena v2.0.0 — 3D Studio Board Renderer, Glossy 3D Pawns,
 * Live Server-Authoritative Private Rooms, 2v2 Team Battle (Solo & Duo Party),
 * Partner Finish Assist UI, Team Tactical Signals & Tournament Controller.
 */
(function (global) {
  'use strict';

  const PIP_MAP = {
    1: [4], 2: [0, 8], 3: [0, 4, 8],
    4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8]
  };

  const COLOR_THEME = {
    red:    { light: '#ff6b6b', label: 'Red' },
    green:  { light: '#57df7e', label: 'Green' },
    yellow: { light: '#ffe073', label: 'Yellow' },
    blue:   { light: '#6bb0ff', label: 'Blue' }
  };

  const MODE_LABELS = {
    classic: 'Classic',
    quick: 'Quick (2 Home)',
    rush: 'Rush Blitz',
    oneKillWin: 'One Kill Win',
    teamUp: 'Team Battle 2v2',
    popular: 'Popular (+Reroll)',
    mask: 'Mask Mode'
  };

  const EMOTES = ['😂', '😎', '🔥', '👏', '😱'];
  const TEAM_SIGNALS = ['🛡️ Cover!', '⚔️ Attack!', '👑 Home!'];
  const BOT_NAMES = ['Vikram_King', 'AanyaRoyal', 'RohanBlitz', 'PriyaDice', 'Kabir_99', 'MeeraStar'];
  const BOT_AVATARS = ['🦁', '👑', '🐉', '💎', '🦅', '🦊'];
  // All account, lobby and saved-match names are untrusted, even when delivered by our server.
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  let engine = null;
  let containerEl = null;
  let animating = false;
  let turnTimerId = null;
  let rushTimerId = null;
  let aiTimeoutId = null;
  let turnRemaining = 18;
  let fastMode = false;
  let isServerMatch = false;
  let tournamentState = null;
  let activeLobbyModal = null;

  function toast(msg, ms = 2400) {
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

  function buildDiceFaceHTML(value, rolling = false) {
    const on = new Set(PIP_MAP[value || 6] || PIP_MAP[6]);
    let pips = '';
    for (let i = 0; i < 9; i++) pips += `<span class="rla-pip ${on.has(i) ? 'on' : ''}"></span>`;
    return `<div class="rla-dice-face ${rolling ? 'rolling' : ''}">${pips}</div>`;
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function canLocalControlCurrentTurn() {
    if (!engine || engine.phase === 'finished') return false;
    const cur = engine.getCurrentPlayer();
    if (isServerMatch) {
      return cur.userId === global.RLAClient?.getUserId();
    }
    return Boolean(cur.isLocalHuman);
  }

  function renderArena() {
    if (!engine || !containerEl) return;
    const state = global.RLAState.get();
    const boardTheme = `theme-${state.inventory.activeBoard || 'royal-walnut'}`;
    const diceSkin = `dice-${state.inventory.activeDice || 'classic-ivory'}`;

    const byColor = {};
    engine.players.forEach(p => { byColor[p.color] = p; });

    const current = engine.getCurrentPlayer();
    const controlled = engine.getControlledPlayer(engine.currentTurn);
    const partnerAssist = controlled && controlled.id !== current.id;
    const localCanAct = canLocalControlCurrentTurn();

    const renderSeat = (color, rightSide) => {
      const p = byColor[color];
      if (!p) return `<div class="rla-seat-card empty color-${color} ${rightSide ? 'seat-right' : ''}">Open Seat</div>`;
      const isActive = engine.phase !== 'finished' && current.id === p.id;
      const done = engine.getFinishedCount(p);
      const needed = engine.tokensNeededToWin();
      const pips = Array.from({ length: needed }, (_, i) => `<span class="rla-home-pip ${i < done ? 'done' : ''}"></span>`).join('');
      const canClickDice = isActive && engine.phase === 'roll' && localCanAct && !animating;
      const diceVal = isActive && engine.diceValue ? engine.diceValue : 6;
      const isMe = isServerMatch ? p.userId === global.RLAClient?.getUserId() : p.isLocalHuman;
      const tag = engine.mode === 'teamUp' ? `T${p.teamId + 1}` : (isMe ? 'YOU' : p.aiLevel.toUpperCase());

      return `
        <div class="rla-seat-card color-${color} ${rightSide ? 'seat-right' : ''} ${isActive ? 'active' : ''}" data-seat-color="${color}">
          <div class="rla-avatar-wrap">
            <svg class="rla-timer-ring" viewBox="0 0 50 50">
              <circle class="bg" cx="25" cy="25" r="22"></circle>
              <circle class="fg" data-timer-ring="${color}" cx="25" cy="25" r="22" stroke-dasharray="138.2" stroke-dashoffset="${isActive ? 0 : 138.2}"></circle>
            </svg>
            <div class="rla-avatar-circle">${escapeHtml(p.avatar)}</div>
          </div>
          <div class="rla-seat-meta">
            <div class="rla-seat-name">${escapeHtml(p.displayName)}${p.finishedRank ? ` (#${p.finishedRank})` : ''}</div>
            <div class="rla-seat-sub">
              <span class="rla-home-pips">${pips}</span>
              <span>${tag}${engine.mode === 'rush' ? ` · ${p.score}pt` : ''}</span>
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

    const sfxOn = state.settings.sfx !== false;
    let promptText = '';
    if (engine.phase === 'finished') {
      promptText = 'Match Complete!';
    } else if (engine.phase === 'roll') {
      promptText = localCanAct
        ? (partnerAssist ? `🤝 Partner Assist! Roll for ${controlled.displayName}` : `${current.displayName}: Tap Dice or Space!`)
        : `${current.displayName} is rolling...`;
    } else {
      promptText = localCanAct
        ? (partnerAssist ? `🤝 Rolled ${engine.diceValue} — Move ${controlled.displayName}'s pawn!` : `Rolled ${engine.diceValue} — Choose a pawn!`)
        : `${current.displayName} rolled ${engine.diceValue}...`;
    }

    const showReroll = engine.mode === 'popular' && engine.phase === 'move' && localCanAct && current.rerollsLeft > 0;
    let teamBarHtml = '';
    if (engine.mode === 'teamUp') {
      const t0 = engine.getTeamProgress(0);
      const t1 = engine.getTeamProgress(1);
      teamBarHtml = `
        <div class="rla-team-bar">
          <div class="rla-team-side">
            <span style="color:#85d8ff">TEAM 1 (Blue+Green) · ${t0.finished}/${t0.needed}</span>
            <div class="rla-team-track"><div class="rla-team-fill-t1" style="width:${t0.pct}%"></div></div>
          </div>
          <span style="color:#ffd86b">${partnerAssist ? '🤝 ASSIST' : '2v2'}</span>
          <div class="rla-team-side right">
            <span style="color:#ffb385">TEAM 2 (Red+Yellow) · ${t1.finished}/${t1.needed}</span>
            <div class="rla-team-track"><div class="rla-team-fill-t2" style="width:${t1.pct}%"></div></div>
          </div>
        </div>
      `;
    }

    containerEl.innerHTML = `
      <div class="rla-arena-shell ${boardTheme}">
        <div class="rla-arena-inner">
          <header class="rla-top-bar">
            <div class="rla-top-left">
              <button type="button" class="rla-icon-btn" id="rla-btn-exit" title="Leave Match" aria-label="Leave Match">←</button>
              <span class="rla-mode-pill">${isServerMatch ? '🟢' : '👑'} ${MODE_LABELS[engine.mode] || engine.mode}</span>
              ${engine.mode === 'rush' ? `<span class="rla-timer-pill" id="rla-rush-clock">⏱ ${formatTime(engine.rushSecondsLeft)}</span>` : ''}
              ${engine.prizeCoins > 0 ? `<span class="rla-timer-pill">🪙 ${engine.prizeCoins.toLocaleString()}</span>` : ''}
              ${engine.roomCode ? `<span class="rla-timer-pill">#${engine.roomCode}</span>` : ''}
            </div>
            <div class="rla-top-right">
              <button type="button" class="rla-icon-btn ${fastMode ? 'active' : ''}" id="rla-btn-speed" title="Toggle 2x Speed">${fastMode ? '2x' : '1x'}</button>
              <button type="button" class="rla-icon-btn" id="rla-btn-sfx" title="Toggle Sound">${sfxOn ? '🔊' : '🔇'}</button>
              <button type="button" class="rla-icon-btn" id="rla-btn-rules" title="Game Rules">?</button>
            </div>
          </header>

          ${teamBarHtml}

          <div class="rla-seat-row">
            ${renderSeat('red', false)}
            ${renderSeat('green', true)}
          </div>

          <div class="rla-board-frame">
            <img class="rla-board-art-img" src="./assets/game/board-royal-walnut.webp" alt="Royal Ludo 3D Board" draggable="false">
            <div class="rla-board-surface">
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
              ${(engine.mode === 'teamUp' ? TEAM_SIGNALS : EMOTES).map(e =>
                `<button type="button" class="rla-emote-btn" data-emote="${e}" data-team-only="${engine.mode === 'teamUp' ? '1' : '0'}">${e}</button>`
              ).join('')}
            </div>
          </footer>
        </div>
      </div>
    `;

    containerEl.querySelector('#rla-btn-exit')?.addEventListener('click', confirmExit);
    containerEl.querySelector('#rla-btn-speed')?.addEventListener('click', () => {
      fastMode = !fastMode;
      global.RLAState.updateSettings({ fastSpeed: fastMode });
      global.RLASound?.click();
      renderArena();
    });
    containerEl.querySelector('#rla-btn-sfx')?.addEventListener('click', () => {
      const next = !(global.RLAState.getSettings().sfx !== false);
      global.RLAState.updateSettings({ sfx: next });
      if (next) global.RLASound?.click();
      renderArena();
    });
    containerEl.querySelector('#rla-btn-rules')?.addEventListener('click', showRulesModal);
    containerEl.querySelector('#rla-btn-reroll')?.addEventListener('click', handlePowerReroll);

    containerEl.querySelectorAll('[data-dice-player]').forEach(btn => {
      btn.addEventListener('click', () => { if (!animating) requestRoll(); });
    });

    containerEl.querySelectorAll('[data-emote]').forEach(btn => {
      btn.addEventListener('click', () => {
        const teamOnly = btn.dataset.teamOnly === '1';
        if (isServerMatch) {
          global.RLAClient?.sendEmote(btn.dataset.emote, teamOnly);
        } else {
          const human = engine.players.find(p => p.isLocalHuman) || engine.getCurrentPlayer();
          showEmoteOnSeat(human.color, teamOnly ? `🤝 ${btn.dataset.emote}` : btn.dataset.emote);
        }
      });
    });

    renderTokens();
    updateTimerRing();
  }

  function renderTokens(overridePos = null) {
    const layer = containerEl?.querySelector('#rla-tokens-layer');
    if (!layer || !engine) return;
    const { getTokenCoords, MAX_PROGRESS } = global.LudoCore;

    const cellGroups = new Map();
    const tokenList = [];

    engine.players.forEach(p => {
      p.tokens.forEach(tok => {
        if (tok.progress === MAX_PROGRESS) return;
        const prog = (overridePos && overridePos.playerId === p.id && overridePos.tokenId === tok.id)
          ? overridePos.progress
          : tok.progress;
        const coords = getTokenCoords(p.color, tok.id, prog);
        const key = `${coords[0].toFixed(1)},${coords[1].toFixed(1)}`;
        if (!cellGroups.has(key)) cellGroups.set(key, []);
        const entry = { player: p, token: tok, coords, key };
        cellGroups.get(key).push(entry);
        tokenList.push(entry);
      });
    });

    const controlled = engine.getControlledPlayer(engine.currentTurn);
    const localCanAct = canLocalControlCurrentTurn();
    const stackOffsets = [[0, 0], [-1.4, -1.0], [1.4, -1.0], [-1.4, 1.0], [1.4, 1.0], [0, -1.6]];

    layer.innerHTML = '';
    tokenList.forEach(({ player, token, coords, key }) => {
      const group = cellGroups.get(key);
      const idxInGroup = group.indexOf(group.find(g => g.player.id === player.id && g.token.id === token.id));
      const [ox, oy] = group.length > 1 ? (stackOffsets[idxInGroup % stackOffsets.length] || [0, 0]) : [0, 0];

      const isMovable = !animating && engine.phase === 'move' && controlled && controlled.id === player.id && localCanAct && engine.validTokenIds.includes(token.id);
      const isHopping = overridePos && overridePos.playerId === player.id && overridePos.tokenId === token.id;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `rla-pawn-btn ${isMovable ? 'movable' : ''} ${isHopping ? 'hopping' : ''}`;
      btn.style.left = `${((coords[1] + 0.5) / 15) * 100 + ox}%`;
      btn.style.top = `${((coords[0] + 0.5) / 15) * 100 + oy}%`;
      if (group.length > 1 && !isMovable) {
        btn.style.width = '6.2%';
        btn.style.height = '6.2%';
      }
      btn.setAttribute('aria-label', `${player.displayName} ${player.color} pawn ${token.id + 1}`);
      btn.innerHTML = `${isMovable ? '<span class="rla-pawn-ring"></span>' : ''}<img class="rla-pawn-img" src="./assets/game/pawn-${player.color}.png" alt="" draggable="false">${group.length > 1 && idxInGroup === group.length - 1 ? `<span class="rla-stack-badge">${group.length}</span>` : ''}`;

      if (isMovable) btn.addEventListener('click', () => requestMove(token.id));
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

    if (isServerMatch) {
      // Visual countdown only; server enforces authoritative timeout
      turnTimerId = setInterval(() => {
        if (!engine || engine.phase === 'finished') return;
        turnRemaining = Math.max(0, turnRemaining - 1);
        updateTimerRing();
      }, 1000);
      return;
    }

    const current = engine.getCurrentPlayer();
    if (!current.isLocalHuman) {
      aiTimeoutId = setTimeout(() => {
        if (!engine || engine.phase === 'finished') return;
        if (engine.phase === 'roll') executeLocalRoll();
      }, fastMode ? 300 : 650);
      return;
    }

    turnTimerId = setInterval(() => {
      if (!engine || engine.phase === 'finished' || animating) return;
      turnRemaining -= 1;
      updateTimerRing();
      if (turnRemaining <= 0) {
        clearInterval(turnTimerId);
        turnTimerId = null;
        if (engine.phase === 'roll') executeLocalRoll();
        else if (engine.phase === 'move' && engine.validTokenIds.length > 0) executeLocalMove(engine.validTokenIds[0]);
      }
    }, 1000);
  }

  function startRushClock() {
    if (rushTimerId) clearInterval(rushTimerId);
    if (!engine || engine.mode !== 'rush' || engine.phase === 'finished' || isServerMatch) return;
    rushTimerId = setInterval(() => {
      if (!engine || engine.phase === 'finished') { clearInterval(rushTimerId); return; }
      engine.rushSecondsLeft = Math.max(0, engine.rushSecondsLeft - 1);
      const clock = containerEl?.querySelector('#rla-rush-clock');
      if (clock) clock.textContent = `⏱ ${formatTime(engine.rushSecondsLeft)}`;
      if (engine.rushSecondsLeft <= 0) {
        clearTimers();
        engine.finishRushByTimer();
        handleLocalFinished();
      }
    }, 1000);
  }

  /* ---------- Action Dispatchers (Server vs Local) ---------- */
  function requestRoll() {
    if (!engine || engine.phase !== 'roll' || animating) return;
    if (isServerMatch) {
      global.RLASound?.diceRoll();
      const cur = engine.getCurrentPlayer();
      const diceBtn = containerEl?.querySelector(`[data-dice-player="${cur.id}"]`);
      if (diceBtn) diceBtn.innerHTML = buildDiceFaceHTML(6, true);
      global.RLAClient?.rollDice();
    } else {
      executeLocalRoll();
    }
  }

  function requestMove(tokenId) {
    if (!engine || engine.phase !== 'move' || animating) return;
    if (isServerMatch) global.RLAClient?.moveToken(tokenId);
    else executeLocalMove(tokenId);
  }

  function handlePowerReroll() {
    if (!engine || animating) return;
    if (isServerMatch) {
      global.RLAClient?.powerReroll();
      return;
    }
    const res = engine.usePowerReroll();
    if (!res.ok) return;
    global.RLASound?.select();
    showBoardBanner('🎲 POWER REROLL!');
    renderArena();
    startTurnClock();
  }

  /* ---------- Local Offline Match Execution ---------- */
  function executeLocalRoll() {
    if (!engine || engine.phase !== 'roll' || animating) return;
    animating = true;
    if (turnTimerId) { clearInterval(turnTimerId); turnTimerId = null; }

    const current = engine.getCurrentPlayer();
    const diceBtn = containerEl?.querySelector(`[data-dice-player="${current.id}"]`);
    if (diceBtn) diceBtn.innerHTML = buildDiceFaceHTML(6, true);
    global.RLASound?.diceRoll();

    setTimeout(() => {
      const res = engine.rollDice();
      if (!res.ok) { animating = false; return; }
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

      const autoSingle = global.RLAState.getSettings().autoSingleMove !== false;
      const controlled = engine.getControlledPlayer(engine.currentTurn);
      if (!current.isLocalHuman) {
        const aiPick = global.LudoAI.chooseBestToken(engine, controlled.id, res.value, res.validTokenIds, current.aiLevel);
        aiTimeoutId = setTimeout(() => executeLocalMove(aiPick), fastMode ? 240 : 520);
      } else if (autoSingle && res.validTokenIds.length === 1 && !(engine.mode === 'popular' && current.rerollsLeft > 0)) {
        aiTimeoutId = setTimeout(() => executeLocalMove(res.validTokenIds[0]), fastMode ? 170 : 340);
      } else {
        startTurnClock();
      }
    }, fastMode ? 220 : 440);
  }

  async function animateMoveResult(res) {
    animating = true;
    const hopMs = fastMode ? 65 : 135;
    for (let i = 0; i < res.pathSteps.length; i++) {
      renderTokens({ playerId: res.playerIndex, tokenId: res.tokenId, progress: res.pathSteps[i] });
      if (res.exitedBase && i === 0) global.RLASound?.tokenExit();
      else global.RLASound?.hop(i);
      await new Promise(r => setTimeout(r, hopMs));
    }

    if (res.captured && res.captured.length > 0) {
      global.RLASound?.capture();
      const coords = global.LudoCore.getTokenCoords(res.color, res.tokenId, res.toProgress);
      spawnCaptureBurst(coords[0], coords[1]);
      showBoardBanner('💥 CAPTURED! +1 BONUS TURN');
    } else if (res.reachedHome) {
      global.RLASound?.homeReach();
      spawnConfetti(22);
      showBoardBanner(res.partnerAssist ? '🤝 PARTNER PAWN HOME!' : '👑 PAWN REACHED HOME!');
    } else if (res.landedSafe && !res.exitedBase) {
      global.RLASound?.safeZone();
    } else if (res.bonusTurn && res.diceValue === 6) {
      showBoardBanner('🎲 ROLLED 6 — ROLL AGAIN!');
    }
    animating = false;
  }

  async function executeLocalMove(tokenId) {
    if (!engine || engine.phase !== 'move' || animating) return;
    if (turnTimerId) { clearInterval(turnTimerId); turnTimerId = null; }
    const res = engine.moveToken(tokenId);
    if (!res.ok) return;

    await animateMoveResult(res);
    global.RLAState.saveActiveMatch(res.gameFinished ? null : engine.serialize());
    renderArena();

    if (res.gameFinished) handleLocalFinished();
    else startTurnClock();
  }

  function handleLocalFinished() {
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
    const info = global.RLAState.recordMatchResult({
      won: humanWon,
      captures: humanPlayer ? humanPlayer.captures : 0,
      sixes: humanPlayer ? humanPlayer.sixes : 0,
      prizeCoins: prizeWon,
      tournament: Boolean(tournamentState && tournamentState.stage === 'final' && humanWon)
    });

    if (tournamentState && tournamentState.stage === 'semi') {
      if (humanWon) { setTimeout(() => showTournamentAdvanceModal(), 650); return; }
      tournamentState = null;
    } else if (tournamentState) {
      tournamentState = null;
    }

    showVictoryModal(winner, humanWon, prizeWon, info.leveledUp);
  }

  function showVictoryModal(winner, humanWon, prizeWon, leveledUp) {
    const rows = engine.rankings.map((pid, idx) => {
      const p = engine.players[pid];
      const medal = ['🥇', '🥈', '🥉', '4️⃣'][idx] || `#${idx + 1}`;
      return `<div class="rla-list-row ${p.isLocalHuman || p.userId === global.RLAClient?.getUserId() ? 'self' : ''}">
        <span>${medal} ${escapeHtml(p.avatar)} <strong>${escapeHtml(p.name)}</strong>${engine.mode === 'teamUp' ? ` (T${p.teamId + 1})` : ''}</span>
        <span>⚔️ ${p.captures} · 👑 ${engine.getFinishedCount(p)}</span>
      </div>`;
    }).join('');

    const title = engine.mode === 'teamUp' ? `TEAM ${engine.winnerTeam + 1} WINS!` : `${escapeHtml(winner.name.toUpperCase())} WINS!`;
    const summary = humanWon
      ? `Victory! +${prizeWon.toLocaleString()} Coins & +60 XP${leveledUp ? ' — LEVEL UP! 🎉' : ''}`
      : `Good match! +20 XP earned.`;

    setTimeout(() => {
      openCustomModal(title, `
        <p style="margin:0;text-align:center;font-weight:800;color:#ffe28a">${escapeHtml(summary)}</p>
        <div class="rla-list">${rows}</div>
      `, [
        ['Home', () => exitToHome()]
      ]);
    }, 600);
  }

  /* ===================== SERVER REAL-TIME MESSAGE HANDLER ===================== */
  function attachServerEvents() {
    if (!global.RLAClient) return;
    global.RLAClient.onMessage(async (msg) => {
      if (msg.type === 'ERROR') {
        toast(`⚠️ ${msg.error}`);
        return;
      }
      if (msg.type === 'ROOM_LOBBY') {
        renderLivePrivateRoomModal(msg.room);
        return;
      }
      if (msg.type === 'ROOM_KICKED') {
        document.getElementById('rla-dialog')?.remove();
        toast('You were removed from the room.');
        return;
      }
      if (msg.type === 'TEAM_PARTY_UPDATE') {
        renderLiveTeamPartyModal(msg.party);
        return;
      }
      if (msg.type === 'QUEUE_STATUS') {
        toast(`Searching ${msg.queue === 'team-solo' ? '2v2 Team' : 'Online'} players (${msg.count}/${msg.needed})...`);
        return;
      }
      if (msg.type === 'MATCH_STARTED') {
        document.getElementById('rla-dialog')?.remove();
        clearTimers();
        isServerMatch = true;
        fastMode = Boolean(global.RLAState.getSettings().fastSpeed);
        engine = global.LudoCore.LudoEngine.deserialize(msg.state);
        containerEl = document.getElementById('app');
        if (window.location.hash !== '#play') window.location.hash = 'play';
        document.title = `Live ${MODE_LABELS[engine.mode] || 'Ludo'} | Royal Ludo Arena`;
        renderArena();
        startTurnClock();
        global.RLAClient.refreshMe();
        return;
      }
      if (msg.type === 'GAME_ROLL' && isServerMatch) {
        global.RLASound?.diceRoll();
        if (msg.result?.value === 6) global.RLASound?.rollSix();
        engine = global.LudoCore.LudoEngine.deserialize(msg.state);
        if (msg.result?.forfeit) {
          global.RLASound?.forfeit();
          showBoardBanner('🚫 THREE 6s — TURN FORFEITED!');
        } else if (msg.result?.noMoves) {
          showBoardBanner(`Rolled ${msg.result.value} — No valid moves`);
        }
        renderArena();
        startTurnClock();
        return;
      }
      if (msg.type === 'GAME_MOVE' && isServerMatch) {
        if (msg.result) await animateMoveResult(msg.result);
        engine = global.LudoCore.LudoEngine.deserialize(msg.state);
        renderArena();
        startTurnClock();
        return;
      }
      if (msg.type === 'GAME_STATE' && isServerMatch) {
        engine = global.LudoCore.LudoEngine.deserialize(msg.state);
        renderArena();
        startTurnClock();
        return;
      }
      if (msg.type === 'EMOTE' && isServerMatch) {
        showEmoteOnSeat(msg.color, msg.emote);
        return;
      }
      if (msg.type === 'MATCH_FINISHED' && isServerMatch) {
        clearTimers();
        engine = global.LudoCore.LudoEngine.deserialize(msg.state);
        renderArena();
        global.RLASound?.victory();
        spawnConfetti(60);
        const uid = global.RLAClient.getUserId();
        const myPayout = msg.payouts?.[uid] || { won: false, prizeCoins: 0, leveledUp: false };
        const winner = engine.players[engine.rankings[0]];
        global.RLAClient.refreshMe();
        showVictoryModal(winner, myPayout.won, myPayout.prizeCoins, myPayout.leveledUp);
      }
    });
  }

  /* ===================== LIVE PRIVATE ROOM & 2v2 TEAM PARTY UI ===================== */
  function renderLivePrivateRoomModal(room) {
    const myId = global.RLAClient.getUserId();
    const isHost = room.hostId === myId;
    const seatRows = room.seats.map((s, idx) => {
      const col = ['blue', 'red', 'green', 'yellow'][idx];
      if (!s) {
        return `<div class="rla-list-row"><span style="opacity:0.6">${COLOR_THEME[col].label} · Waiting for friend...</span><span>Empty</span></div>`;
      }
      const badge = s.userId === room.hostId ? '👑 Host' : s.isBot ? '🤖 Bot' : (s.ready ? '✅ Ready' : '⏳ Waiting');
      const kickBtn = (isHost && s.userId !== myId)
        ? `<button type="button" class="rla-royal-btn secondary" data-kick="${idx}" style="padding:3px 7px;font-size:11px">✕</button>`
        : '';
      return `<div class="rla-list-row ${s.userId === myId ? 'self' : ''}">
        <span><strong style="color:${COLOR_THEME[col].light}">${COLOR_THEME[col].label}</strong> · ${escapeHtml(s.avatar)} ${escapeHtml(s.name)}</span>
        <span style="display:flex;align-items:center;gap:6px">${badge} ${kickBtn}</span>
      </div>`;
    }).join('');

    const actions = [];
    if (isHost) {
      actions.push(['+ Add Bot', () => { global.RLAClient.addBot('medium'); }]);
      actions.push(['Start Match', () => { global.RLAClient.startRoom(); }]);
    } else {
      actions.push(['Toggle Ready', () => { global.RLAClient.toggleReady(); }]);
    }
    actions.push(['Leave', () => { global.RLAClient.leaveRoom(); }]);

    const veil = openCustomModal(`LIVE PRIVATE ROOM #${room.code}`, `
      <div style="display:flex;align-items:center;justify-content:space-between;background:#260e05;padding:9px 12px;border-radius:10px;border:1.5px solid #f4bd41">
        <span style="font-weight:900;font-size:18px;letter-spacing:0.14em;color:#ffe282">${room.code}</span>
        <button type="button" class="rla-royal-btn" id="rla-copy-live-room" style="padding:5px 10px;font-size:12px">Copy Code</button>
      </div>
      <p class="rla-hint">🟢 Live Server Room · Mode: ${MODE_LABELS[room.mode] || room.mode} · Entry: ${room.entryFee} 🪙</p>
      <div class="rla-list">${seatRows}</div>
    `, actions, true);

    veil.querySelector('#rla-copy-live-room')?.addEventListener('click', () => {
      navigator.clipboard?.writeText(room.code).catch(() => {});
      toast(`Room Code ${room.code} copied!`);
    });
    veil.querySelectorAll('[data-kick]').forEach(b => {
      b.addEventListener('click', () => global.RLAClient.removeSeat(Number(b.dataset.kick)));
    });
  }

  function renderLiveTeamPartyModal(party) {
    const myId = global.RLAClient.getUserId();
    const isHost = party.hostId === myId;
    const rows = [0, 1].map(idx => {
      const m = party.members[idx];
      return m
        ? `<div class="rla-list-row self"><span>${escapeHtml(m.avatar)} <strong>${escapeHtml(m.name)}</strong> (${idx === 0 ? 'Blue' : 'Green'})</span><span>TEAM 1 ✓</span></div>`
        : `<div class="rla-list-row"><span style="opacity:0.7">Waiting for Teammate (Green)...</span><span>Share Code</span></div>`;
    }).join('');

    const actions = isHost
      ? [['Find 2v2 Opponents', () => global.RLAClient.startTeamParty(party.code)], ['Cancel', () => {}]]
      : [['Waiting for Host...', () => {}]];

    const veil = openCustomModal(`2v2 DUO PARTY #${party.code}`, `
      <div style="display:flex;align-items:center;justify-content:space-between;background:#260e05;padding:9px 12px;border-radius:10px;border:1.5px solid #f4bd41">
        <span style="font-weight:900;font-size:18px;letter-spacing:0.14em;color:#ffe282">${party.code}</span>
        <button type="button" class="rla-royal-btn" id="rla-copy-party" style="padding:5px 10px;font-size:12px">Copy Invite</button>
      </div>
      <p class="rla-hint">You & your friend are locked onto Team 1 (Blue + Green) with Partner Finish Assist!</p>
      <div class="rla-list">${rows}</div>
    `, actions, true);

    veil.querySelector('#rla-copy-party')?.addEventListener('click', () => {
      navigator.clipboard?.writeText(party.code).catch(() => {});
      toast(`Team Party Code ${party.code} copied!`);
    });
  }

  /* ===================== ENTRY POINTS ===================== */
  function startMatch(config) {
    clearTimers();
    isServerMatch = false;
    fastMode = Boolean(global.RLAState.getSettings().fastSpeed);
    engine = new global.LudoCore.LudoEngine(config);
    containerEl = document.getElementById('app');
    if (window.location.hash !== '#play') window.location.hash = 'play';
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
    isServerMatch = false;
    fastMode = Boolean(global.RLAState.getSettings().fastSpeed);
    try {
      engine = global.LudoCore.LudoEngine.deserialize(snap);
    } catch {
      global.RLAState.saveActiveMatch(null);
      toast('Saved match could not be restored. Invalid saved match data was cleared.');
      return false;
    }
    containerEl = document.getElementById('app');
    if (window.location.hash !== '#play') window.location.hash = 'play';
    renderArena();
    startTurnClock();
    startRushClock();
    return true;
  }

  function openMatchmakingLobby({ mode = 'classic', entryMode = 'online', teamBattle = false, teamComposition = '4Online' }) {
    if (global.RLAClient?.isOnline()) {
      if (teamBattle && teamComposition === '2Friends2Online') {
        const veil = openCustomModal('2v2 FRIENDS + ONLINE', `
          <p class="rla-hint">Create a Duo Party to team up with a friend on Team 1, or enter your friend's 6-digit Party Code:</p>
          <input id="rla-party-input" maxlength="6" placeholder="Enter 6-Digit Party Code" style="text-align:center;font-weight:800;letter-spacing:0.12em">
        `, [
          ['Create Duo Party', () => global.RLAClient.createTeamParty(mode, 100)],
          ['Join Party', () => {
            const c = veil.querySelector('#rla-party-input')?.value.replace(/[^0-9]/g, '');
            if (c && c.length === 6) global.RLAClient.joinTeamParty(c);
            else toast('Enter a valid 6-digit Party Code!');
          }]
        ]);
        return;
      }

      if (teamBattle) global.RLAClient.queueTeamSolo(mode, 100);
      else global.RLAClient.queueOnline(mode, 100);

      openCustomModal(teamBattle ? '🟢 LIVE 2v2 TEAM MATCHMAKING' : '🟢 LIVE ONLINE MATCHMAKING', `
        <p style="margin:0;text-align:center;color:#ffe082;font-weight:800">Searching live players on server... (Entry: 100 🪙)</p>
        <p class="rla-hint" style="text-align:center">Unfilled seats auto-fill with tactical opponents after 6 seconds so you never wait long.</p>
      `, [['Cancel Queue', () => global.RLAClient.cancelQueue()]]);
      return;
    }

    // Offline fallback when server is not started
    const profile = global.RLAState.get().profile;
    const colors = ['blue', 'red', 'green', 'yellow'];
    startMatch({
      mode: teamBattle ? 'teamUp' : mode,
      entryMode,
      difficulty: 'medium',
      prizeCoins: teamBattle ? 400 : 350,
      players: [
        { color: colors[0], name: profile.name, avatar: profile.avatar, isHuman: true, isLocalHuman: true },
        { color: colors[1], name: BOT_NAMES[0], avatar: BOT_AVATARS[0], isHuman: false, aiLevel: 'medium' },
        { color: colors[2], name: BOT_NAMES[1], avatar: BOT_AVATARS[1], isHuman: false, aiLevel: 'hard' },
        { color: colors[3], name: BOT_NAMES[2], avatar: BOT_AVATARS[2], isHuman: false, aiLevel: 'medium' }
      ]
    });
  }

  function openPrivateRoomLobby({ roomAction = 'create', roomCode = '', mode = 'classic' }) {
    if (global.RLAClient?.isOnline()) {
      if (roomAction === 'join') {
        global.RLAClient.joinRoom(roomCode);
      } else {
        global.RLAClient.createRoom(mode, 0);
      }
      return;
    }
    toast('Start the Node server (`npm start`) for live online Private Rooms — launching offline Pass & Play room!');
    const profile = global.RLAState.get().profile;
    startMatch({
      mode,
      entryMode: 'friends',
      roomCode: roomCode || String(Math.floor(100000 + Math.random() * 900000)),
      prizeCoins: 250,
      players: [
        { color: 'blue', name: profile.name, avatar: profile.avatar, isHuman: true, isLocalHuman: true },
        { color: 'red', name: 'Friend 2', avatar: '🦁', isHuman: true, isLocalHuman: true },
        { color: 'green', name: 'Bot Aanya', avatar: '🤖', isHuman: false, aiLevel: 'medium' },
        { color: 'yellow', name: 'Bot Rohan', avatar: '🐉', isHuman: false, aiLevel: 'medium' }
      ]
    });
  }

  function openCustomComputerModal(mode = 'classic', difficulty = 'medium') {
    const profile = global.RLAState.get().profile;
    const seats = [
      { color: 'blue', name: profile.name, type: 'human' },
      { color: 'red', name: 'Bot Vikram', type: 'ai' },
      { color: 'green', name: 'Bot Aanya', type: 'ai' },
      { color: 'yellow', name: 'Bot Rohan', type: 'ai' }
    ];
    function renderCustom() {
      const rows = seats.map((s, idx) => `
        <div class="rla-list-row">
          <span style="font-weight:800;color:${COLOR_THEME[s.color].light}">${COLOR_THEME[s.color].label}</span>
          <input data-seat-name="${idx}" value="${escapeHtml(s.name)}" maxlength="16" style="width:120px;padding:4px 7px;font-size:13px">
          <button type="button" class="rla-royal-btn secondary" data-seat-type="${idx}" style="padding:4px 8px;font-size:11px">${s.type.toUpperCase()}</button>
        </div>
      `).join('');
      const veil = openCustomModal('CUSTOM MATCH SETUP', `<div class="rla-list">${rows}</div>`, [
        ['Launch Match', () => {
          const active = seats.filter(s => s.type !== 'off');
          if (active.length < 2) { toast('Select at least 2 active players!'); return; }
          startMatch({
            mode, entryMode: 'computer', difficulty, prizeCoins: 250,
            players: active.map((s, i) => ({
              color: s.color, name: s.name.trim() || `Player ${i + 1}`,
              avatar: s.type === 'human' ? profile.avatar : BOT_AVATARS[i + 1],
              isHuman: s.type === 'human', isLocalHuman: s.type === 'human', aiLevel: difficulty
            }))
          });
        }]
      ]);
      veil.querySelectorAll('[data-seat-name]').forEach(inp => inp.addEventListener('input', () => { seats[Number(inp.dataset.seatName)].name = inp.value; }));
      veil.querySelectorAll('[data-seat-type]').forEach(btn => btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.seatType);
        const order = ['human', 'ai', 'off'];
        seats[idx].type = order[(order.indexOf(seats[idx].type) + 1) % 3];
        veil.remove();
        renderCustom();
      }));
    }
    renderCustom();
  }

  function openTournamentModal() {
    const profile = global.RLAState.get().profile;
    openCustomModal('ROYAL TOURNAMENT 🏆', `
      <p style="margin:0;text-align:center;color:#ffe285;font-weight:800">2-Round Knockout · Grand Prize: 5,000 Coins</p>
      <div class="rla-list">
        <div class="rla-list-row self"><span><strong>Semi-Final</strong> (Quick Mode)</span><span>4 Players</span></div>
        <div class="rla-list-row"><span><strong>Grand Final</strong> (Classic Hard AI)</span><span>5,000 🪙</span></div>
      </div>
    `, [
      ['Enter Tournament', () => {
        tournamentState = { stage: 'semi' };
        startMatch({
          mode: 'quick', entryMode: 'tournament', difficulty: 'medium', prizeCoins: 500,
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

  function showTournamentAdvanceModal() {
    const profile = global.RLAState.get().profile;
    openCustomModal('SEMI-FINAL WON! 🏆', '<p style="margin:0;text-align:center">Advance to the <strong>Royal Grand Final</strong> for 5,000 Coins!</p>', [
      ['Play Grand Final', () => {
        tournamentState.stage = 'final';
        startMatch({
          mode: 'classic', entryMode: 'tournament', difficulty: 'hard', prizeCoins: 5000,
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
    const desc = engine.mode === 'teamUp'
      ? '2v2 Team Battle! Blue + Green vs Red + Yellow. Partners cannot capture each other. When you get all 4 pawns Home, Partner Finish Assist activates so your rolls move your partner\'s pawns!'
      : 'Roll 6 to exit base. Star squares (★) are safe zones. Rolling 6, capturing, or reaching Home grants a bonus roll. Three consecutive 6s forfeits your turn.';
    openCustomModal(`RULES — ${MODE_LABELS[engine.mode] || 'LUDO'}`, `<p style="margin:0;line-height:1.5">${desc}</p>`);
  }

  function confirmExit() {
    openCustomModal('LEAVE MATCH?', `<p style="margin:0">${isServerMatch ? 'Leave this live multiplayer room?' : 'Save and return to Home, or abandon match?'}</p>`, [
      ['Return Home', () => {
        if (isServerMatch) global.RLAClient?.leaveRoom();
        else if (engine && engine.phase !== 'finished') global.RLAState.saveActiveMatch(engine.serialize());
        exitToHome();
      }]
    ]);
  }

  function exitToHome() {
    clearTimers();
    engine = null;
    isServerMatch = false;
    window.location.hash = 'home';
  }

  function openCustomModal(title, htmlBody, actions = [], keepOpenOnAction = false) {
    document.getElementById('rla-dialog')?.remove();
    const veil = document.createElement('div');
    veil.id = 'rla-dialog';
    veil.className = 'rla-dialog-veil';
    const card = document.createElement('section');
    card.className = 'rla-dialog';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.innerHTML = `<header class="rla-dialog-title">${escapeHtml(title)}<button class="rla-dialog-x" type="button" aria-label="Close">×</button></header><div class="rla-dialog-body" style="white-space:normal">${htmlBody}</div><footer></footer>`;
    const foot = card.querySelector('footer');
    if (actions.length) {
      for (const [label, fn] of actions) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'rla-dialog-action';
        b.textContent = label;
        b.addEventListener('click', () => {
          global.RLASound?.click();
          if (!keepOpenOnAction) veil.remove();
          fn();
        });
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
    card.querySelector('.rla-dialog-x')?.addEventListener('click', () => veil.remove());
    veil.addEventListener('click', e => { if (e.target === veil) veil.remove(); });
    veil.append(card);
    document.body.append(veil);
    activeLobbyModal = veil;
    return veil;
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', attachServerEvents);
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && window.location.hash === '#play' && engine && engine.phase === 'roll' && !animating) {
        if (canLocalControlCurrentTurn() && !document.getElementById('rla-dialog')) {
          e.preventDefault();
          requestRoll();
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
    destroy: () => { clearTimers(); engine = null; isServerMatch = false; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
