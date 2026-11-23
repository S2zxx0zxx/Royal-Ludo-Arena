/**
 * Royal Ludo Arena — Multi-Tier Tactical AI Engine (Easy, Medium, Hard, Expert)
 */
(function (global) {
  'use strict';

  function getCore() {
    if (global.LudoCore) return global.LudoCore;
    if (typeof require === 'function') return require('./ludo-engine.js');
    throw new Error('LudoCore not loaded');
  }

  function distanceBehind(fromTrack, toTrack) {
    return (toTrack - fromTrack + 52) % 52;
  }

  function countThreatsAt(engine, player, trackIdx) {
    const { getTrackIndex } = getCore();
    if (trackIdx < 0) return 0;
    let threats = 0;
    for (const opp of engine.players) {
      if (opp.id === player.id) continue;
      if (engine.mode === 'teamUp' && opp.teamId === player.teamId) continue;
      for (const tok of opp.tokens) {
        if (tok.progress >= 0 && tok.progress <= 50) {
          const oppTrack = getTrackIndex(opp.color, tok.progress);
          const dist = distanceBehind(oppTrack, trackIdx);
          if (dist >= 1 && dist <= 6) threats += 1;
        }
      }
    }
    return threats;
  }

  function countCaptureTargets(engine, player, targetTrack) {
    const { getTrackIndex, SAFE_TRACK_INDICES } = getCore();
    if (targetTrack < 0 || SAFE_TRACK_INDICES.has(targetTrack)) return [];
    const hits = [];
    for (const opp of engine.players) {
      if (opp.id === player.id) continue;
      if (engine.mode === 'teamUp' && opp.teamId === player.teamId) continue;
      for (const tok of opp.tokens) {
        if (tok.progress >= 0 && tok.progress <= 50 && getTrackIndex(opp.color, tok.progress) === targetTrack) {
          hits.push({ opp, tok });
        }
      }
    }
    return hits;
  }

  function scoreMove(engine, player, tokenId, dice, level) {
    const { getTrackIndex, isSafeProgress, MAX_PROGRESS } = getCore();
    const token = player.tokens[tokenId];
    const from = token.progress;
    const to = from === -1 ? 0 : from + dice;

    if (level === 'easy') {
      let s = Math.random() * 25;
      if (from === -1) s += 18;
      if (to === MAX_PROGRESS) s += 30;
      return s;
    }

    let score = 0;
    const fromTrack = getTrackIndex(player.color, from);
    const toTrack = getTrackIndex(player.color, to);
    const fromSafe = isSafeProgress(player.color, from);
    const toSafe = isSafeProgress(player.color, to);

    // 1. Reaching Home is huge
    if (to === MAX_PROGRESS) {
      score += (engine.mode === 'oneKillWin' ? 500 : 180);
    }

    // 2. Capturing an opponent pawn
    const captures = countCaptureTargets(engine, player, toTrack);
    if (captures.length > 0) {
      const victimProgress = Math.max(...captures.map(c => c.tok.progress));
      score += (engine.mode === 'oneKillWin' ? 600 : 150) + victimProgress * 1.4;
      if (engine.mode === 'rush') score += 40;
    }

    // 3. Exiting home base on a 6
    if (from === -1) {
      const activeCount = player.tokens.filter(t => t.progress >= 0 && t.progress < MAX_PROGRESS).length;
      score += activeCount === 0 ? 120 : (activeCount === 1 ? 85 : 55);
    }

    // 4. Entering home stretch (safe forever!)
    if (from <= 50 && to >= 51 && to < MAX_PROGRESS) {
      score += 95;
    }

    // 5. Landing on a Star safe zone
    if (to <= 50 && toSafe) {
      score += 48;
    }

    // Medium stops here with light progress preference
    if (level === 'medium') {
      score += to * 0.6 + Math.random() * 14;
      return score;
    }

    // 6. Hard & Expert: Threat & escape analysis
    const currentThreats = (from >= 0 && from <= 50 && !fromSafe) ? countThreatsAt(engine, player, fromTrack) : 0;
    const futureThreats = (to >= 0 && to <= 50 && !toSafe) ? countThreatsAt(engine, player, toTrack) : 0;

    if (currentThreats > 0 && futureThreats === 0) {
      // Escaping immediate danger!
      score += 65 + from * 0.9;
    }
    if (futureThreats > 0) {
      // Risk of getting captured increases with how far the pawn has traveled
      score -= futureThreats * (32 + to * 0.85);
    }

    // Penalize leaving a safe square into danger
    if (fromSafe && from >= 0 && !toSafe && futureThreats > 0) {
      score -= 28;
    }

    // Expert adds proactive hunting (moving within 1-6 steps behind an opponent)
    if (level === 'expert' && to >= 0 && to <= 50) {
      for (const opp of engine.players) {
        if (opp.id === player.id) continue;
        if (engine.mode === 'teamUp' && opp.teamId === player.teamId) continue;
        for (const oppTok of opp.tokens) {
          if (oppTok.progress >= 0 && oppTok.progress <= 50 && !isSafeProgress(opp.color, oppTok.progress)) {
            const oppTrack = getTrackIndex(opp.color, oppTok.progress);
            const dist = distanceBehind(toTrack, oppTrack);
            if (dist >= 1 && dist <= 6) {
              score += 18 + oppTok.progress * 0.25;
            }
          }
        }
      }
      // Advance lead pawn carefully
      score += to * 0.55;
      score += Math.random() * 3;
    } else {
      score += to * 0.45 + Math.random() * 8;
    }

    return score;
  }

  function chooseBestToken(engine, playerIndex, dice, validTokenIds, difficulty) {
    if (!validTokenIds || validTokenIds.length === 0) return null;
    if (validTokenIds.length === 1) return validTokenIds[0];

    const player = engine.players[playerIndex];
    const level = difficulty || player.aiLevel || engine.difficulty || 'medium';

    let bestId = validTokenIds[0];
    let bestScore = -Infinity;
    for (const id of validTokenIds) {
      const s = scoreMove(engine, player, id, dice, level);
      if (s > bestScore) {
        bestScore = s;
        bestId = id;
      }
    }
    return bestId;
  }

  const LudoAI = { chooseBestToken, scoreMove };
  global.LudoAI = LudoAI;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LudoAI;
  }
})(typeof window !== 'undefined' ? window : globalThis);
