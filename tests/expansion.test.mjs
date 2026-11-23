import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const code = readFileSync('public/js/expansion.js', 'utf8');
const ctx = vm.createContext({
  window: { addEventListener() {} },
  document: { getElementById() { return null; }, addEventListener() {} },
  location: { hash: '' },
  localStorage: { getItem() { return null; } },
  structuredClone,
  queueMicrotask() {}
});
vm.runInContext(code, ctx);
const { routes, hits, home } = vm.runInContext('RLA.inspect()', ctx);

test('all six new original images exist', () => {
  assert.equal(Object.keys(routes).length, 6);
  for (const name of Object.keys(routes)) {
    const p = 'public/assets/screens/' + name + '.jpg';
    assert.ok(existsSync(p), p);
    assert.ok(readFileSync(p).length > 20000, p);
  }
});

test('all new hotspots have valid bounding boxes', () => {
  for (const [name, arr] of Object.entries(hits)) {
    const { width, height } = routes[name];
    assert.ok(arr.length > 5, name);
    const ids = new Set();
    for (const h of arr) {
      assert.ok(!ids.has(h.id), name + ':' + h.id);
      ids.add(h.id);
      const [x, y, w, hh] = h.rect;
      assert.ok(x >= 0 && y >= 0 && w > 0 && hh > 0 && x + w <= width + 1 && y + hh <= height + 1, name + ':' + h.id);
    }
  }
});

test('key navigation and interactive feature actions are mapped', () => {
  assert.ok(home.some(h => h.id === 'profile'));
  assert.ok(home.some(h => h.id === 'lucky' && h.action === 'lucky-spin'));
  assert.ok(home.some(h => h.id === 'daily-reward' && h.action === 'daily-reward'));
  assert.ok(home.some(h => h.id === 'nav-inventory' && h.action === 'inventory'));
  assert.ok(home.some(h => h.id === 'leaderboard' && h.action === 'leaderboard'));
  assert.ok(home.some(h => h.id === 'settings' && h.action === 'settings'));
  assert.ok(hits.events.some(h => h.to === 'daily-goals'));
  assert.ok(hits.profile.some(h => h.action === 'edit'));
  assert.ok(hits.store.some(h => h.id === 'tab-diamonds'));
  assert.ok(hits['send-gift'].some(h => h.action === 'gift'));
});

test('store clearly notes real-money purchases are offline', () => {
  assert.match(code, /Real-money purchases are disabled/);
});

test('new scripts and stylesheets loaded in index.html', () => {
  const h = readFileSync('public/index.html', 'utf8');
  assert.ok(h.includes('expansion.js'));
  assert.ok(h.includes('extended.css'));
  assert.ok(h.includes('game.css'));
});