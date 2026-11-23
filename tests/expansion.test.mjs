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

test('all six new original images and 3D gameplay assets exist', () => {
  assert.equal(Object.keys(routes).length, 6);
  for (const name of Object.keys(routes)) {
    const p = 'public/assets/screens/' + name + '.jpg';
    assert.ok(existsSync(p), p);
    assert.ok(readFileSync(p).length > 20000, p);
  }
  for (const asset of ['board-royal-walnut.webp', 'crown-medallion.png', 'pawn-red.png', 'pawn-green.png', 'pawn-blue.png', 'pawn-yellow.png']) {
    const p = 'public/assets/game/' + asset;
    assert.ok(existsSync(p), p);
    assert.ok(readFileSync(p).length > 5000, p);
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

test('no free demo-pack minting exploit remains in store', () => {
  assert.doesNotMatch(code, /Add Demo Pack/);
  assert.match(code, /STORE PURCHASES NOT YET AVAILABLE/);
  assert.match(code, /No payment will be collected/);
});

test('realtime client and v2 scripts loaded in index.html', () => {
  const h = readFileSync('public/index.html', 'utf8');
  assert.ok(h.includes('realtime-client.js'));
  assert.ok(h.includes('expansion.js'));
  assert.ok(h.includes('game.css'));
});