import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const sandbox = { console, Math, Set, Map, Array, Object, Number, String, Boolean, JSON };
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);
vm.runInContext(readFileSync('public/js/ludo-engine.js', 'utf8'), ctx);
vm.runInContext(readFileSync('public/js/ludo-ai.js', 'utf8'), ctx);

const { LudoEngine, getTrackIndex, isSafeProgress, MAX_PROGRESS } = ctx.LudoCore;
const LudoAI = ctx.LudoAI;

test('classic game requires rolling 6 to exit base and grants bonus turn', () => {
  const eng = new LudoEngine({ mode: 'classic', playerCount: 2, primaryColor: 'blue' });
  const r1 = eng.rollDice(4);
  assert.equal(r1.noMoves, true);
  assert.equal(eng.currentTurn, 1);

  const r2 = eng.rollDice(6);
  assert.equal(r2.validTokenIds.length, 4);
  const m = eng.moveToken(0);
  assert.equal(m.exitedBase, true);
  assert.equal(m.toProgress, 0);
  assert.equal(m.bonusTurn, true);
  assert.equal(eng.currentTurn, 1);
  assert.equal(eng.phase, 'roll');
});

test('three consecutive 6s forfeits turn', () => {
  const eng = new LudoEngine({ mode: 'classic', playerCount: 2 });
  eng.rollDice(6);
  eng.moveToken(0);
  eng.rollDice(6);
  eng.moveToken(1);
  const r3 = eng.rollDice(6);
  assert.equal(r3.forfeit, true);
  assert.equal(eng.currentTurn, 1);
});

test('capture sends opponent back to yard and awards bonus turn', () => {
  const eng = new LudoEngine({
    mode: 'classic',
    players: [
      { color: 'red', name: 'R', isHuman: true },
      { color: 'green', name: 'G', isHuman: false }
    ]
  });
  eng.players[0].tokens[0].progress = 12; // track 12
  eng.players[1].tokens[0].progress = 2;  // track 15 (not safe)
  assert.equal(isSafeProgress('green', 2), false);

  eng.rollDice(3); // 12 + 3 = 15 -> captures green!
  const m = eng.moveToken(0);
  assert.equal(m.captured.length, 1);
  assert.equal(eng.players[1].tokens[0].progress, -1);
  assert.equal(m.bonusTurn, true);
  assert.equal(eng.currentTurn, 0);
});

test('star safe zones prevent captures', () => {
  const eng = new LudoEngine({
    mode: 'classic',
    players: [
      { color: 'red', name: 'R', isHuman: true },
      { color: 'green', name: 'G', isHuman: false }
    ]
  });
  eng.players[0].tokens[0].progress = 10;
  eng.players[1].tokens[0].progress = 0; // track 13 (safe)
  assert.equal(getTrackIndex('green', 0), 13);
  assert.equal(isSafeProgress('green', 0), true);

  eng.rollDice(3);
  const m = eng.moveToken(0);
  assert.equal(m.captured.length, 0);
  assert.equal(eng.players[1].tokens[0].progress, 0);
});

test('oneKillWin mode wins immediately on first capture', () => {
  const eng = new LudoEngine({
    mode: 'oneKillWin',
    players: [
      { color: 'red', name: 'R', isHuman: true },
      { color: 'green', name: 'G', isHuman: false }
    ]
  });
  eng.players[0].tokens[0].progress = 12;
  eng.players[1].tokens[0].progress = 2;
  eng.rollDice(3);
  const m = eng.moveToken(0);
  assert.equal(m.gameFinished, true);
  assert.equal(eng.phase, 'finished');
  assert.equal(eng.rankings[0], 0);
});

test('teamUp mode prevents capturing partner and shares teamId', () => {
  const eng = new LudoEngine({
    mode: 'teamUp',
    players: [
      { color: 'blue', name: 'B', isHuman: true },
      { color: 'red', name: 'R', isHuman: false },
      { color: 'green', name: 'G', isHuman: false },
      { color: 'yellow', name: 'Y', isHuman: false }
    ]
  });
  assert.equal(eng.players[0].teamId, eng.players[2].teamId);
  eng.players[0].tokens[0].progress = 25;
  eng.players[2].tokens[0].progress = 2;
  eng.rollDice(3);
  const m = eng.moveToken(0);
  assert.equal(m.captured.length, 0);
  assert.equal(eng.players[2].tokens[0].progress, 2);
});

test('quick mode pre-deploys 1 token and wins with 2 tokens home', () => {
  const eng = new LudoEngine({ mode: 'quick', playerCount: 2 });
  assert.equal(eng.players[0].tokens[0].progress, 0);
  assert.equal(eng.tokensNeededToWin(), 2);
  eng.players[0].tokens[0].progress = MAX_PROGRESS;
  eng.players[0].tokens[1].progress = 54;
  eng.rollDice(2);
  const m = eng.moveToken(1);
  assert.equal(m.reachedHome, true);
  assert.equal(m.gameFinished, true);
});

test('AI chooses capture move over idle pawn move on hard/expert', () => {
  const eng = new LudoEngine({
    mode: 'classic',
    difficulty: 'expert',
    players: [
      { color: 'red', name: 'R', isHuman: false, aiLevel: 'expert' },
      { color: 'green', name: 'G', isHuman: false, aiLevel: 'expert' }
    ]
  });
  eng.players[0].tokens[0].progress = 12;
  eng.players[0].tokens[1].progress = 2;
  eng.players[1].tokens[0].progress = 2;
  const pick = LudoAI.chooseBestToken(eng, 0, 3, [0, 1], 'expert');
  assert.equal(pick, 0);
});

test('serialize and deserialize preserve full match state', () => {
  const eng = new LudoEngine({ mode: 'popular', playerCount: 3 });
  eng.rollDice(6);
  eng.moveToken(0);
  const snap = eng.serialize();
  const restored = LudoEngine.deserialize(snap);
  assert.equal(restored.mode, 'popular');
  assert.equal(restored.players[0].tokens[0].progress, 0);
  assert.equal(restored.players[0].rerollsLeft, 2);
});

test('teamUp Partner Finish Assist lets finished player roll and move partner pawns', () => {
  const eng = new LudoEngine({
    mode: 'teamUp',
    players: [
      { color: 'blue', name: 'B', isHuman: true },
      { color: 'red', name: 'R', isHuman: false },
      { color: 'green', name: 'G', isHuman: false },
      { color: 'yellow', name: 'Y', isHuman: false }
    ]
  });
  // Blue finishes all 4 pawns; Green still has pawns in play
  eng.players[0].tokens.forEach(t => { t.progress = MAX_PROGRESS; });
  eng.players[0].finishedRank = 1;
  eng.players[2].tokens[0].progress = 10;
  eng.currentTurn = 0;

  const roll = eng.rollDice(4);
  assert.equal(roll.partnerAssist, true);
  assert.equal(roll.controlledPlayerId, 2);
  const mv = eng.moveToken(0);
  assert.equal(mv.partnerAssist, true);
  assert.equal(eng.players[2].tokens[0].progress, 14);
});
