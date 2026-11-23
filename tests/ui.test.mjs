import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const js = readFileSync('public/js/app.js', 'utf8');
const html = readFileSync('public/index.html', 'utf8');

test('all V3 3D game assets and original art archives exist', () => {
  for (const x of ['board-royal-walnut.webp', 'crown-medallion.png', 'pawn-red.png', 'pawn-green.png', 'pawn-blue.png', 'pawn-yellow.png', 'avatar-hero.webp', 'hero-ludo-3d.webp', 'bot-mascot.webp']) {
    assert.ok(existsSync('public/assets/game/' + x), x);
  }
});

test('all five game modes are native componentized screens', () => {
  for (const x of ['online', 'team', 'friends', 'computer', 'pass']) {
    assert.ok(js.includes(`screen === '${x}'`), x);
  }
  assert.match(html, /aria-label="Royal Ludo Arena"/);
  assert.match(js, /renderGameShell/);
});

test('all game modules loaded in index.html', () => {
  for (const mod of ['ludo-engine.js', 'ludo-ai.js', 'game-view.js', 'sound.js', 'state.js', 'realtime-client.js', 'game.css']) {
    assert.ok(html.includes(mod), mod);
  }
});

test('room code and team-up validation present', () => {
  assert.match(js, /slice\(0, 6\)/);
  assert.match(js, /Team Up needs exactly four players/);
});
