/**
 * Royal Ludo Arena — Authentic 15x15 Ludo Game Rules Engine
 * Pure logic module (works in both Browser and Node.js test runner).
 *
 * Board Orientation (matching Royal Ludo Arena artwork):
 *   Top-Left:     RED    (track start index 0)
 *   Top-Right:    GREEN  (track start index 13)
 *   Bottom-Right: YELLOW (track start index 26)
 *   Bottom-Left:  BLUE   (track start index 39)
 *
 * Token progress values:
 *   -1       : In home yard (base)
 *   0 .. 50  : On the 52-cell main loop (51 steps around outer track)
 *   51 .. 55 : On the 5 colored home-stretch cells
 *   56       : Reached center Crown Home (finished!)
 */
(function (global) {
  'use strict';

  const COLORS = ['blue', 'red', 'green', 'yellow'];

  // Clockwise 52-cell outer track coordinates [row, col] on a 15x15 grid (0..14)
  // Index 0 is RED's start square (row 6, col 1)
  const MAIN_TRACK = [
    [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
    [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
    [0, 7], [0, 8],
    [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
    [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
    [7, 14], [8, 14],
    [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
    [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
    [14, 7], [14, 6],
    [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
    [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
    [7, 0], [6, 0]
  ];

  // Starting track index for each color
  const START_INDEX = {
    red: 0,
    green: 13,
    yellow: 26,
    blue: 39
  };

  // Colored home-stretch coordinates (progress 51..55) + center arrival (56)
  const HOME_STRETCH = {
    red:    [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
    green:  [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
    yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
    blue:   [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]]
  };

  // Yard base slot coordinates [row, col] for the 4 pawns in each corner
  const YARD_SLOTS = {
    red:    [[1.6, 1.6], [1.6, 3.6], [3.6, 1.6], [3.6, 3.6]],
    green:  [[1.6, 10.4], [1.6, 12.4], [3.6, 10.4], [3.6, 12.4]],
    yellow: [[10.4, 10.4], [10.4, 12.4], [12.4, 10.4], [12.4, 12.4]],
    blue:   [[10.4, 1.6], [10.4, 3.6], [12.4, 1.6], [12.4, 3.6]]
  };

  // 8 Star Safe Zones on MAIN_TRACK: 4 start squares + 4 star squares
  const SAFE_TRACK_INDICES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

  const MAX_PROGRESS = 56;

  // Turn order clockwise starting from bottom-left (blue -> red -> green -> yellow)
  const CLOCKWISE_ORDER = ['blue', 'red', 'green', 'yellow'];

  function getSeatColors(playerCount, primaryColor = 'blue') {
    const startIdx = Math.max(0, CLOCKWISE_ORDER.indexOf(primaryColor));
    if (playerCount === 2) {
      // Opposite corners for balanced 1v1
      return [CLOCKWISE_ORDER[startIdx], CLOCKWISE_ORDER[(startIdx + 2) % 4]];
    }
    if (playerCount === 3) {
      return [
        CLOCKWISE_ORDER[startIdx],
        CLOCKWISE_ORDER[(startIdx + 1) % 4],
        CLOCKWISE_ORDER[(startIdx + 2) % 4]
      ];
    }
    return [
      CLOCKWISE_ORDER[startIdx],
      CLOCKWISE_ORDER[(startIdx + 1) % 4],
      CLOCKWISE_ORDER[(startIdx + 2) % 4],
      CLOCKWISE_ORDER[(startIdx + 3) % 4]
    ];
  }

  function getTrackIndex(color, progress) {
    if (progress < 0 || progress > 50) return -1;
    return (START_INDEX[color] + progress) % 52;
  }

  function getTokenCoords(color, tokenIndex, progress) {
    if (progress < 0) return YARD_SLOTS[color][tokenIndex];
    if (progress <= 50) return MAIN_TRACK[getTrackIndex(color, progress)];
    const stretchIdx = Math.min(5, progress - 51);
    return HOME_STRETCH[color][stretchIdx];
  }

  function isSafeProgress(color, progress) {
    if (progress < 0 || progress >= 51) return true;
    return SAFE_TRACK_INDICES.has(getTrackIndex(color, progress));
  }

  class LudoEngine {
    constructor(config = {}) {
      this.mode = config.mode || 'classic'; // classic | quick | rush | oneKillWin | teamUp | popular | mask
      this.entryMode = config.entryMode || 'computer'; // computer | pass | online | team | friends | tournament
      this.difficulty = config.difficulty || 'medium';
      this.prizeCoins = config.prizeCoins || 0;
      this.roomCode = config.roomCode || '';
      this.turnSeconds = config.turnSeconds || 18;
      this.rushSecondsLeft = this.mode === 'rush' ? (config.rushSeconds || 180) : 0;

      const playerConfigs = config.players || this._buildDefaultPlayers(config);
      this.players = playerConfigs.map((p, idx) => {
        const teamId = this.mode === 'teamUp'
          ? ((p.color === 'blue' || p.color === 'green') ? 0 : 1)
          : idx;
        // In Quick or Rush mode, 1 token starts pre-deployed on start square (0) for instant action
        const tokens = [0, 1, 2, 3].map(tid => ({
          id: tid,
          progress: (tid === 0 && (this.mode === 'quick' || this.mode === 'rush')) ? 0 : -1
        }));
        return {
          id: idx,
          color: p.color,
          name: p.name || `Player ${idx + 1}`,
          displayName: this.mode === 'mask' && !p.isHuman ? `Masked Rival #${idx + 1}` : (p.name || `Player ${idx + 1}`),
          avatar: this.mode === 'mask' && !p.isHuman ? '🎭' : (p.avatar || '👑'),
          isHuman: Boolean(p.isHuman),
          isLocalHuman: p.isLocalHuman !== undefined ? Boolean(p.isLocalHuman) : Boolean(p.isHuman),
          aiLevel: p.aiLevel || this.difficulty,
          teamId,
          tokens,
          score: 0,
          captures: 0,
          sixes: 0,
          rerollsLeft: this.mode === 'popular' ? 2 : 0,
          finishedRank: 0
        };
      });

      this.currentTurn = 0;
      this.phase = 'roll'; // 'roll' | 'move' | 'finished'
      this.diceValue = null;
      this.consecutiveSixes = 0;
      this.validTokenIds = [];
      this.rankings = []; // player indices in finish order
      this.winnerTeam = null;
      this.turnCount = 0;
      this.lastEvent = null;
    }

    _buildDefaultPlayers(config) {
      const count = Number(config.playerCount || 4);
      const colors = getSeatColors(count, config.primaryColor || 'blue');
      const names = ['You', 'Bot Vikram', 'Bot Aanya', 'Bot Rohan'];
      const avatars = ['👑', '🤖', '🦁', '🐉'];
      return colors.map((color, i) => ({
        color,
        name: config.entryMode === 'pass' ? `Player ${i + 1}` : names[i],
        avatar: avatars[i],
        isHuman: config.entryMode === 'pass' ? true : i === 0,
        aiLevel: config.difficulty || 'medium'
      }));
    }

    getCurrentPlayer() {
      return this.players[this.currentTurn];
    }

    tokensNeededToWin() {
      if (this.mode === 'quick') return 2;
      if (this.mode === 'oneKillWin') return 1;
      return 4;
    }

    getFinishedCount(player) {
      return player.tokens.filter(t => t.progress === MAX_PROGRESS).length;
    }

    isPlayerFinished(player) {
      return player.finishedRank > 0;
    }

    canMoveToken(player, token, dice) {
      if (!token || dice < 1 || dice > 6) return false;
      if (token.progress === MAX_PROGRESS) return false;
      if (token.progress === -1) return dice === 6;
      return token.progress + dice <= MAX_PROGRESS;
    }

    getValidTokenIds(playerIndex, dice) {
      const player = this.players[playerIndex];
      if (!player) return [];
      const ids = [];
      for (const token of player.tokens) {
        if (this.canMoveToken(player, token, dice)) {
          ids.push(token.id);
        }
      }
      return ids;
    }

    rollDice(forcedValue = null) {
      if (this.phase !== 'roll') {
        return { ok: false, reason: 'Not in roll phase' };
      }
      const player = this.getCurrentPlayer();
      const value = (forcedValue >= 1 && forcedValue <= 6)
        ? forcedValue
        : (Math.floor(Math.random() * 6) + 1);

      this.diceValue = value;
      this.turnCount += 1;

      if (value === 6) {
        this.consecutiveSixes += 1;
        player.sixes += 1;
        if (this.consecutiveSixes >= 3) {
          // Authentic three-6s forfeit rule
          this.consecutiveSixes = 0;
          this.validTokenIds = [];
          const event = {
            type: 'three-sixes-forfeit',
            playerIndex: this.currentTurn,
            diceValue: value
          };
          this.lastEvent = event;
          this._advanceTurn();
          return { ok: true, value, forfeit: true, validTokenIds: [], event };
        }
      } else {
        this.consecutiveSixes = 0;
      }

      const valid = this.getValidTokenIds(this.currentTurn, value);
      this.validTokenIds = valid;

      if (valid.length === 0) {
        const event = {
          type: 'no-moves',
          playerIndex: this.currentTurn,
          diceValue: value
        };
        this.lastEvent = event;
        this._advanceTurn();
        return { ok: true, value, noMoves: true, validTokenIds: [], event };
      }

      this.phase = 'move';
      const event = {
        type: 'rolled',
        playerIndex: this.currentTurn,
        diceValue: value,
        validTokenIds: valid.slice()
      };
      this.lastEvent = event;
      return { ok: true, value, validTokenIds: valid.slice(), event };
    }

    usePowerReroll() {
      if (this.phase !== 'move') return { ok: false, reason: 'Can only reroll after rolling' };
      const player = this.getCurrentPlayer();
      if (player.rerollsLeft <= 0) return { ok: false, reason: 'No rerolls remaining' };
      player.rerollsLeft -= 1;
      this.phase = 'roll';
      this.validTokenIds = [];
      this.diceValue = null;
      return { ok: true, rerollsLeft: player.rerollsLeft };
    }

    moveToken(tokenId) {
      if (this.phase !== 'move') return { ok: false, reason: 'Not in move phase' };
      if (!this.validTokenIds.includes(tokenId)) return { ok: false, reason: 'Invalid token move' };

      const player = this.getCurrentPlayer();
      const token = player.tokens[tokenId];
      const dice = this.diceValue;
      const fromProgress = token.progress;
      const toProgress = fromProgress === -1 ? 0 : fromProgress + dice;

      // Build step-by-step path for smooth hop animation
      const pathSteps = [];
      if (fromProgress === -1) {
        pathSteps.push(0);
      } else {
        for (let p = fromProgress + 1; p <= toProgress; p++) {
          pathSteps.push(p);
        }
      }

      token.progress = toProgress;
      player.score += (fromProgress === -1 ? 6 : dice);

      // Check captures on main track (0..50) if landing square is NOT a safe zone
      const captured = [];
      const landedTrack = getTrackIndex(player.color, toProgress);
      const landedSafe = isSafeProgress(player.color, toProgress);

      if (landedTrack !== -1 && !landedSafe) {
        for (const opp of this.players) {
          if (opp.id === player.id) continue;
          if (this.mode === 'teamUp' && opp.teamId === player.teamId) continue;
          for (const oppTok of opp.tokens) {
            if (oppTok.progress >= 0 && oppTok.progress <= 50 && getTrackIndex(opp.color, oppTok.progress) === landedTrack) {
              oppTok.progress = -1;
              captured.push({ playerIndex: opp.id, color: opp.color, tokenId: oppTok.id });
              player.captures += 1;
              player.score += 25;
            }
          }
        }
      }

      const reachedHome = toProgress === MAX_PROGRESS;
      if (reachedHome) {
        player.score += 50;
      }

      // Check win conditions
      let playerJustFinished = false;
      let gameFinished = false;

      if (this.mode === 'oneKillWin' && (captured.length > 0 || reachedHome)) {
        player.finishedRank = 1;
        this.rankings = [player.id, ...this.players.filter(p => p.id !== player.id).map(p => p.id)];
        this.phase = 'finished';
        playerJustFinished = true;
        gameFinished = true;
      } else if (this.getFinishedCount(player) >= this.tokensNeededToWin() && player.finishedRank === 0) {
        playerJustFinished = true;
        this.rankings.push(player.id);
        player.finishedRank = this.rankings.length;

        if (this.mode === 'teamUp') {
          const teamMembers = this.players.filter(p => p.teamId === player.teamId);
          if (teamMembers.every(m => m.finishedRank > 0)) {
            this.winnerTeam = player.teamId;
            for (const other of this.players) {
              if (!this.rankings.includes(other.id)) this.rankings.push(other.id);
            }
            this.phase = 'finished';
            gameFinished = true;
          }
        } else {
          const remaining = this.players.filter(p => p.finishedRank === 0);
          if (remaining.length <= 1) {
            for (const r of remaining) {
              this.rankings.push(r.id);
              r.finishedRank = this.rankings.length;
            }
            this.phase = 'finished';
            gameFinished = true;
          }
        }
      }

      const bonusTurn = !gameFinished && !playerJustFinished && (dice === 6 || captured.length > 0 || reachedHome);

      const moveResult = {
        ok: true,
        playerIndex: player.id,
        color: player.color,
        tokenId,
        fromProgress,
        toProgress,
        pathSteps,
        diceValue: dice,
        exitedBase: fromProgress === -1,
        landedSafe: landedSafe && toProgress <= 50 && toProgress >= 0,
        captured,
        reachedHome,
        playerJustFinished,
        bonusTurn,
        gameFinished
      };

      this.lastEvent = { type: 'moved', ...moveResult };

      if (!gameFinished) {
        this.validTokenIds = [];
        this.diceValue = null;
        if (bonusTurn) {
          this.phase = 'roll';
        } else {
          this.consecutiveSixes = 0;
          this._advanceTurn();
        }
      }

      return moveResult;
    }

    finishRushByTimer() {
      if (this.phase === 'finished') return this.rankings;
      const sorted = [...this.players].sort((a, b) => b.score - a.score || this.getFinishedCount(b) - this.getFinishedCount(a));
      this.rankings = sorted.map(p => p.id);
      sorted.forEach((p, idx) => { p.finishedRank = idx + 1; });
      this.phase = 'finished';
      return this.rankings;
    }

    _advanceTurn() {
      const n = this.players.length;
      for (let step = 1; step <= n; step++) {
        const next = (this.currentTurn + step) % n;
        if (this.players[next].finishedRank === 0) {
          this.currentTurn = next;
          this.phase = 'roll';
          this.diceValue = null;
          this.validTokenIds = [];
          return;
        }
      }
      this.phase = 'finished';
    }

    serialize() {
      return {
        mode: this.mode,
        entryMode: this.entryMode,
        difficulty: this.difficulty,
        prizeCoins: this.prizeCoins,
        roomCode: this.roomCode,
        turnSeconds: this.turnSeconds,
        rushSecondsLeft: this.rushSecondsLeft,
        players: this.players,
        currentTurn: this.currentTurn,
        phase: this.phase,
        diceValue: this.diceValue,
        consecutiveSixes: this.consecutiveSixes,
        validTokenIds: this.validTokenIds,
        rankings: this.rankings,
        winnerTeam: this.winnerTeam,
        turnCount: this.turnCount
      };
    }

    static deserialize(snap) {
      const eng = new LudoEngine({
        mode: snap.mode,
        entryMode: snap.entryMode,
        difficulty: snap.difficulty,
        prizeCoins: snap.prizeCoins,
        roomCode: snap.roomCode,
        turnSeconds: snap.turnSeconds,
        rushSeconds: snap.rushSecondsLeft,
        players: snap.players
      });
      eng.players = snap.players;
      eng.currentTurn = snap.currentTurn;
      eng.phase = snap.phase;
      eng.diceValue = snap.diceValue;
      eng.consecutiveSixes = snap.consecutiveSixes || 0;
      eng.validTokenIds = snap.validTokenIds || [];
      eng.rankings = snap.rankings || [];
      eng.winnerTeam = snap.winnerTeam ?? null;
      eng.turnCount = snap.turnCount || 0;
      return eng;
    }
  }

  const exported = {
    LudoEngine,
    COLORS,
    MAIN_TRACK,
    START_INDEX,
    HOME_STRETCH,
    YARD_SLOTS,
    SAFE_TRACK_INDICES,
    MAX_PROGRESS,
    getSeatColors,
    getTrackIndex,
    getTokenCoords,
    isSafeProgress
  };

  global.LudoCore = exported;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported;
  }
})(typeof window !== 'undefined' ? window : globalThis);
