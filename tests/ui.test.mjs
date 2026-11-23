import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const js = readFileSync('public/js/app.js', 'utf8');
const html = readFileSync('public/index.html', 'utf8');

test('six art screens and five home card sprites exist', () => {
  for (const x of ['home', 'online', 'team', 'friends', 'computer', 'pass']) {
    assert.ok(existsSync('public/assets/screens/' + x + '.webp'));
  }
  for (const x of ['online', 'team', 'friends', 'computer', 'pass']) {
    assert.ok(existsSync('public/assets/ui/home_' + x + '.webp'));
  }
});

test('visual screens are routed and accessible', () => {
  for (const x of ['online', 'team', 'friends', 'computer', 'pass']) {
    assert.ok(js.includes("to: '" + x + "'"));
  }
  assert.match(html, /aria-label="Royal Ludo Arena"/);
  assert.match(js, /aria-label/);
});

test('all game launch entry points are enabled and wired', () => {
  assert.match(js, /action: 'start'/);
  assert.match(js, /action: 'custom'/);
  assert.match(html, /ludo-engine\.js/);
  assert.match(html, /ludo-ai\.js/);
  assert.match(html, /game-view\.js/);
  assert.match(html, /sound\.js/);
  assert.match(html, /state\.js/);
  assert.match(html, /game\.css/);
});

test('room code and team-up validation present', () => {
  assert.match(js, /slice\(0, 6\)/);
  assert.match(js, /Team Up needs exactly four players/);
});
