/**
 * Royal Ludo Arena V4.1.0 — AAA 3D Interactive Mode Setup Screens
 * Upgrades all 5 core game modes:
 *  1. Play Online (Arena Tier Stakes + 5 3D Rule Cards + Live Match Summary)
 *  2. Team Battle 2v2 (3D Pawn VS Crest + 4 Online / 2 Friends Duo Party Inline Console)
 *  3. Play With Friends (Create/Join Console + 6-Box OTP Code + Paste + 4-Seat Preview)
 *  4. Play vs Computer (3D Crowned Bot Mascot + Dynamic Speech + Skill Bars + Pawn Color Picker)
 *  5. Pass & Play (Live Inline 2-4 Player Roster + Editable Names + Human/AI Toggle + 3D Pawns)
 */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  const DIFF_META = {
    easy:   { bars: 1, cls: 'diff-easy',   quote: 'Relaxed warm-up! Great for learning the Royal Board.' },
    medium: { bars: 2, cls: 'diff-medium', quote: 'Balanced rival! I guard safe stars & hunt captures.' },
    hard:   { bars: 3, cls: 'diff-hard',   quote: 'Tactical mode! Watch your back — I calculate threats.' },
    expert: { bars: 4, cls: 'diff-expert', quote: 'Grandmaster AI active. Full threat matrix — no mercy! 👑' }
  };

  function skillBars(count) {
    return `<span class="rla-skill-bars">${[1, 2, 3, 4].map(n => `<i class="${n <= count ? 'on' : ''}"></i>`).join('')}</span>`;
  }

  function renderOnline(cfg, isLive) {
    const stakes = [
      { id: '0', label: 'Free', pot: 'Practice', badge: 'Practice' },
      { id: '100', label: '100 🪙', pot: '380 🪙 Pot', badge: 'Silver' },
      { id: '500', label: '500 🪙', pot: '1,900 🪙 Pot', badge: 'Gold' },
      { id: '1000', label: '1K 🪙', pot: '3,800 🪙 Pot', badge: 'Royal' }
    ];
    const activeStake = '0'; // Entry-fee wallet/payout functionality is disabled in the preview.
    const modes = [
      ['classic', '👑 Classic Rules', '4-pawn race to the Royal Crown', '4 Pawns'],
      ['oneKillWin', '⚔️ One Kill Win', 'First capture or 1 pawn Home wins instantly', 'Sudden Death'],
      ['quick', '⚡ Quick Mode', '1 pawn starts out · First to 2 Home wins', 'Fast 5m'],
      ['popular', '🎲 Popular (+Reroll)', 'Classic rules with 2 Power Rerolls', '+2 Rerolls'],
      ['mask', '🎭 Mask Mode', 'Mystery masked rivals revealed on podium', 'Mystery']
    ];
    return `
      <div class="v3-screen-head">
        <button type="button" class="v3-round-btn" data-nav="home" aria-label="Back to Home">←</button>
        <div class="v3-ribbon"><h1 class="v3-ribbon-title">🌐 Play Online <span class="rla-live-tag">${isLive ? 'LIVE' : 'FAST'}</span></h1></div>
        <button type="button" class="v3-round-btn" data-open="help" aria-label="Rules help">?</button>
      </div>

      <div class="v3-panel">
        <span class="v3-section-pill">Select Arena Stake</span>
        <div class="v3-grid-4">
          ${stakes.map(st => `
            <button type="button" class="v3-choice rla-stake-card" data-group="entryFee" data-value="${st.id}" aria-pressed="${activeStake === st.id}" ${st.id === '0' ? '' : 'disabled aria-disabled="true" title="Paid arena stakes are not available"'}>
              <span class="rla-stake-tier">${st.badge}</span>
              <strong>${st.label}</strong>
              <span class="rla-stake-pot">${st.pot}</span>
            </button>
          `).join('')}
        </div>
        <p class="v3-choice-desc" role="status">Paid coin stakes and payout pools are preview-only and cannot be entered.</p>
      </div>

      <div class="v3-panel">
        <span class="v3-section-pill">Select Rule Mode</span>
        ${modes.map(([val, title, desc, tag]) => `
          <button type="button" class="v3-choice v3-choice-row rla-mode-opt" data-group="ruleMode" data-value="${val}" aria-pressed="${cfg.ruleMode === val}">
            <div style="min-width:0">
              <div style="font-size:13px">${title}</div>
              <div class="v3-choice-desc">${desc}</div>
            </div>
            <span class="rla-opt-tag">${tag}</span>
          </button>
        `).join('')}
      </div>

      <div class="rla-match-summary">
        <span>👥 4 Players</span>
        <span>•</span>
        <span>${isLive ? '🟢 Server Matchmaking' : '⚡ Instant AI Arena'}</span>
      </div>
      <button type="button" class="v3-cta-btn green rla-cta-pulse" id="v3-start-btn" data-hit-id="online-next">${isLive ? 'Find Live Match' : 'Start Free Practice Match'} ▶</button>
    `;
  }

  function renderTeam(cfg, partyCode, isLive) {
    const isDuo = cfg.teamComposition === '2Friends2Online';
    return `
      <div class="v3-screen-head">
        <button type="button" class="v3-round-btn" data-nav="home" aria-label="Back to Home">←</button>
        <div class="v3-ribbon"><h1 class="v3-ribbon-title">👥 Team Battle 2v2</h1></div>
        <button type="button" class="v3-round-btn" data-open="help" aria-label="Rules help">?</button>
      </div>

      <div class="rla-vs-stage">
        <div class="rla-vs-team t1">
          <div class="rla-vs-pawns">
            <img src="./assets/game/pawn-blue.png" alt="Blue" draggable="false">
            <img src="./assets/game/pawn-green.png" alt="Green" draggable="false">
          </div>
          <strong>TEAM 1</strong>
          <span>Blue + Green</span>
        </div>
        <div class="rla-vs-bolt">VS</div>
        <div class="rla-vs-team t2">
          <div class="rla-vs-pawns">
            <img src="./assets/game/pawn-red.png" alt="Red" draggable="false">
            <img src="./assets/game/pawn-yellow.png" alt="Yellow" draggable="false">
          </div>
          <strong>TEAM 2</strong>
          <span>Red + Yellow</span>
        </div>
      </div>

      <div class="v3-panel">
        <span class="v3-section-pill">Team Composition</span>
        <div class="v3-grid-2">
          <button type="button" class="v3-choice" data-group="teamComposition" data-value="4Online" aria-pressed="${!isDuo}">
            <span style="font-size:26px">🌐</span>
            <span>4 Online Players</span>
            <span class="v3-choice-desc">Auto-pair 2v2</span>
          </button>
          <button type="button" class="v3-choice" data-group="teamComposition" data-value="2Friends2Online" aria-pressed="${isDuo}">
            <span style="font-size:26px">🤝</span>
            <span>2 Friends + 2 Online</span>
            <span class="v3-choice-desc">6-Digit Duo Party</span>
          </button>
        </div>

        ${isDuo ? `
          <div class="rla-duo-box">
            <div style="font-size:11.5px;font-weight:800;color:#ffe680">Have a friend's Duo Party Code? (Leave blank to create new)</div>
            <input id="team-party-code" class="v3-input" type="text" inputmode="numeric" maxlength="6" placeholder="6-DIGIT PARTY CODE" value="${esc(partyCode)}" aria-label="Team duo party code">
          </div>
        ` : ''}

        <span class="v3-section-pill">2v2 Speed</span>
        <div class="v3-grid-2">
          <button type="button" class="v3-choice" data-group="ruleMode" data-value="classic" aria-pressed="${cfg.ruleMode === 'classic'}">👑 Classic 2v2<span class="v3-choice-desc">All 8 Team Pawns</span></button>
          <button type="button" class="v3-choice" data-group="ruleMode" data-value="quick" aria-pressed="${cfg.ruleMode === 'quick'}">⚡ Quick 2v2<span class="v3-choice-desc">Fast 2-Home Blitz</span></button>
        </div>
        <div class="rla-assist-callout">🤝 <strong>Partner Finish Assist ON:</strong> Finish your pawns to roll & move your partner's pawns!</div>
      </div>

      <button type="button" class="v3-cta-btn rla-cta-pulse" id="v3-start-btn" data-hit-id="team-next">
        ${isDuo ? (partyCode && partyCode.length === 6 ? 'Join Duo Party ▶' : 'Create Duo Party ▶') : (isLive ? 'Queue Live 2v2 ▶' : 'Start Team Battle ▶')}
      </button>
    `;
  }

  function renderFriends(cfg, roomCode, isLive) {
    const isJoin = cfg.roomAction === 'join';
    const digits = String(roomCode || '').padEnd(6, '•').slice(0, 6).split('');
    return `
      <div class="v3-screen-head">
        <button type="button" class="v3-round-btn" data-nav="home" aria-label="Back to Home">←</button>
        <div class="v3-ribbon"><h1 class="v3-ribbon-title">💖 Play With Friends</h1></div>
        <button type="button" class="v3-round-btn" data-open="help" aria-label="Rules help">?</button>
      </div>

      <div class="v3-panel">
        <span class="v3-section-pill">Private Room Mode</span>
        <div class="v3-grid-2">
          <button type="button" class="v3-choice" data-group="roomAction" data-value="create" aria-pressed="${!isJoin}">
            <span style="font-size:26px">🏰</span>
            <span>Create Room</span>
            <span class="v3-choice-desc">Host 6-digit lobby</span>
          </button>
          <button type="button" class="v3-choice" data-group="roomAction" data-value="join" aria-pressed="${isJoin}">
            <span style="font-size:26px">🔑</span>
            <span>Join Room</span>
            <span class="v3-choice-desc">Enter friend's code</span>
          </button>
        </div>

        <div class="rla-otp-wrap">
          <div class="rla-otp-boxes" aria-hidden="true">
            ${digits.map(d => `<span class="rla-otp-cell ${d !== '•' ? 'filled' : ''}">${esc(d)}</span>`).join('')}
          </div>
          <div style="display:flex;gap:6px;align-items:center">
            <input id="room-code" class="v3-input" type="text" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="ENTER 6 DIGIT CODE" value="${esc(roomCode)}" aria-label="Six digit room code" style="flex:1">
            <button type="button" class="rla-royal-btn secondary" id="v4-paste-code" style="padding:10px 12px;font-size:12px">Paste</button>
          </div>
        </div>

        <span class="v3-section-pill">Room Rules</span>
        <div class="v3-grid-2">
          <button type="button" class="v3-choice" data-group="ruleMode" data-value="classic" aria-pressed="${cfg.ruleMode === 'classic'}">👑 Classic</button>
          <button type="button" class="v3-choice" data-group="ruleMode" data-value="quick" aria-pressed="${cfg.ruleMode === 'quick'}">⚡ Quick</button>
          <button type="button" class="v3-choice" data-group="ruleMode" data-value="oneKillWin" aria-pressed="${cfg.ruleMode === 'oneKillWin'}">⚔️ One Kill Win</button>
          <button type="button" class="v3-choice" data-group="ruleMode" data-value="teamUp" aria-pressed="${cfg.ruleMode === 'teamUp'}">🤝 Team 2v2</button>
        </div>
      </div>

      <div class="rla-match-summary">
        <span>${isLive ? '🟢 Live WebSocket Room Ready' : '🟡 Offline Local Friends Mode'}</span>
      </div>
      <button type="button" class="v3-cta-btn gold rla-cta-pulse" id="v3-start-btn" data-hit-id="friends-start">
        ${isJoin ? 'Join Private Room ▶' : 'Create Private Room ▶'}
      </button>
    `;
  }

  function renderComputer(cfg) {
    const meta = DIFF_META[cfg.difficulty] || DIFF_META.medium;
    const colors = ['blue', 'red', 'green', 'yellow'];
    const myColor = cfg.tokenColor || 'blue';
    return `
      <div class="v3-screen-head">
        <button type="button" class="v3-round-btn" data-nav="home" aria-label="Back to Home">←</button>
        <div class="v3-ribbon"><h1 class="v3-ribbon-title">🤖 Play vs Computer</h1></div>
        <button type="button" class="v3-round-btn" data-open="help" aria-label="Rules help">?</button>
      </div>

      <div class="rla-mascot-stage">
        <img class="rla-mascot-img" src="./assets/game/bot-mascot.webp" alt="AI Bot Mascot" draggable="false">
        <div class="rla-mascot-bubble">
          <strong style="color:#ffe680;font-size:12.5px;text-transform:uppercase">${esc(cfg.difficulty)} AI Opponent</strong>
          <div>${meta.quote}</div>
        </div>
      </div>

      <div class="v3-panel">
        <span class="v3-section-pill">Game Mode</span>
        <div class="v3-grid-2">
          <button type="button" class="v3-choice" data-group="ruleMode" data-value="classic" aria-pressed="${cfg.ruleMode === 'classic'}">🎲 Classic</button>
          <button type="button" class="v3-choice" data-group="ruleMode" data-value="rush" aria-pressed="${cfg.ruleMode === 'rush'}">⚡ Rush Blitz</button>
          <button type="button" class="v3-choice" data-group="ruleMode" data-value="quick" aria-pressed="${cfg.ruleMode === 'quick'}">🚀 Quick 2-Home</button>
          <button type="button" class="v3-choice" data-group="ruleMode" data-value="oneKillWin" aria-pressed="${cfg.ruleMode === 'oneKillWin'}">⚔️ One Kill Win</button>
        </div>

        <span class="v3-section-pill">AI Intelligence Tier</span>
        <div class="v3-grid-4">
          ${['easy', 'medium', 'hard', 'expert'].map(lv => `
            <button type="button" class="v3-choice ${DIFF_META[lv].cls}" data-group="difficulty" data-value="${lv}" aria-pressed="${cfg.difficulty === lv}">
              <span>${lv === 'easy' ? '😊' : lv === 'medium' ? '🤖' : lv === 'hard' ? '😈' : '👑'}</span>
              <span style="text-transform:capitalize;font-size:11px">${lv}</span>
              ${skillBars(DIFF_META[lv].bars)}
            </button>
          `).join('')}
        </div>

        <span class="v3-section-pill">Players & Your 3D Pawn</span>
        <div class="v3-grid-4">
          <button type="button" class="v3-choice" data-hit-id="computer-two" data-group="playerCount" data-value="2" aria-pressed="${cfg.playerCount === '2'}">2P</button>
          <button type="button" class="v3-choice" data-hit-id="computer-three" data-group="playerCount" data-value="3" aria-pressed="${cfg.playerCount === '3'}">3P</button>
          <button type="button" class="v3-choice" data-hit-id="computer-four" data-group="playerCount" data-value="4" aria-pressed="${cfg.playerCount === '4'}">4P</button>
          <button type="button" class="v3-choice" id="v3-custom-btn" data-hit-id="computer-custom" aria-pressed="false">⚙️ Custom</button>
        </div>
        <div class="v3-grid-4">
          ${colors.map(c => `
            <button type="button" class="v3-choice rla-pawn-pick" data-group="tokenColor" data-value="${c}" aria-pressed="${myColor === c}" aria-label="Play as ${c}">
              <img src="./assets/game/pawn-${c}.png" alt="${c}" style="width:32px;height:32px;object-fit:contain" draggable="false">
            </button>
          `).join('')}
        </div>
      </div>

      <button type="button" class="v3-cta-btn rla-cta-pulse" id="v3-start-btn" data-hit-id="computer-start">Start AI Match ▶</button>
    `;
  }

  function renderPass(cfg, passRoster) {
    const colors = ['blue', 'red', 'green', 'yellow'];
    const count = Number(cfg.playerCount || 4);
    const seatColors = global.LudoCore ? global.LudoCore.getSeatColors(count, cfg.tokenColor || 'blue') : colors.slice(0, count);

    return `
      <div class="v3-screen-head">
        <button type="button" class="v3-round-btn" data-nav="home" aria-label="Back to Home">←</button>
        <div class="v3-ribbon"><h1 class="v3-ribbon-title">🎲 Pass & Play</h1></div>
        <button type="button" class="v3-round-btn" data-open="help" aria-label="Rules help">?</button>
      </div>

      <div class="v3-panel">
        <span class="v3-section-pill">Players & Starting Color</span>
        <div class="v3-grid-3">
          <button type="button" class="v3-choice" data-group="playerCount" data-value="2" aria-pressed="${cfg.playerCount === '2'}">2 Players</button>
          <button type="button" class="v3-choice" data-group="playerCount" data-value="3" aria-pressed="${cfg.playerCount === '3'}">3 Players</button>
          <button type="button" class="v3-choice" data-group="playerCount" data-value="4" aria-pressed="${cfg.playerCount === '4'}">4 Players</button>
        </div>
        <div class="v3-grid-4">
          ${colors.map(c => `
            <button type="button" class="v3-choice rla-pawn-pick" data-group="tokenColor" data-value="${c}" aria-pressed="${cfg.tokenColor === c}" aria-label="${c} pawn">
              <img src="./assets/game/pawn-${c}.png" alt="${c}" style="width:32px;height:32px;object-fit:contain" draggable="false">
              <span style="text-transform:capitalize;font-size:10px">${c}</span>
            </button>
          `).join('')}
        </div>

        <span class="v3-section-pill">Player Roster (Tap to Rename or Add AI)</span>
        <div class="rla-list">
          ${seatColors.map((col, idx) => {
            const seat = passRoster[idx] || { name: `Player ${idx + 1}`, isBot: false };
            return `
              <div class="rla-roster-row">
                <img src="./assets/game/pawn-${col}.png" alt="${col}" style="width:28px;height:28px;object-fit:contain" draggable="false">
                <input class="rla-roster-input" data-pass-name="${idx}" maxlength="18" value="${esc(seat.name)}" aria-label="Player ${idx + 1} name">
                ${idx === 0
                  ? '<span class="rla-pill-chip">Host</span>'
                  : `<button type="button" class="rla-royal-btn secondary" data-pass-bot="${idx}" style="padding:5px 9px;font-size:11px">${seat.isBot ? '🤖 Bot' : '👤 Human'}</button>`}
              </div>
            `;
          }).join('')}
        </div>

        <span class="v3-section-pill">Rule Mode</span>
        <div class="v3-grid-2">
          <button type="button" class="v3-choice" data-group="ruleMode" data-value="classic" aria-pressed="${cfg.ruleMode === 'classic'}">👑 Classic</button>
          <button type="button" class="v3-choice" data-group="ruleMode" data-value="teamUp" aria-pressed="${cfg.ruleMode === 'teamUp'}">🤝 Team Up 2v2</button>
          <button type="button" class="v3-choice" data-group="ruleMode" data-value="quick" aria-pressed="${cfg.ruleMode === 'quick'}">⚡ Quick 2-Home</button>
          <button type="button" class="v3-choice" data-group="ruleMode" data-value="oneKillWin" aria-pressed="${cfg.ruleMode === 'oneKillWin'}">⚔️ One Kill Win</button>
        </div>
      </div>

      <button type="button" class="v3-cta-btn green rla-cta-pulse" id="v3-start-btn" data-hit-id="pass-start">Start Pass & Play ▶</button>
    `;
  }

  global.RLAModes3D = { renderOnline, renderTeam, renderFriends, renderComputer, renderPass };
})(typeof window !== 'undefined' ? window : globalThis);
