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
const { routes } = vm.runInContext('RLA.inspect()', ctx);

test('all V3 extended native routes are registered', () => {
  for (const r of ['events', 'profile', 'store', 'daily-goals', 'send-gift', 'club', 'inventory', 'social', 'more']) {
    assert.ok(routes[r], r);
  }
});

test('3D gameplay and hero assets exist', () => {
  for (const asset of ['board-royal-walnut.webp', 'crown-medallion.png', 'pawn-red.png', 'pawn-green.png', 'pawn-blue.png', 'pawn-yellow.png', 'avatar-hero.webp', 'hero-ludo-3d.webp', 'bot-mascot.webp']) {
    const p = 'public/assets/game/' + asset;
    assert.ok(existsSync(p), p);
    assert.ok(readFileSync(p).length > 5000, p);
  }
});

test('no free demo-pack minting exploit remains in store', () => {
  assert.doesNotMatch(code, /Add Demo Pack/);
  assert.match(code, /\/api\/payments\/razorpay\/verify/);
  assert.match(code, /\/api\/payments\/google-play\/verify/);
});

test('realtime client and v3 scripts loaded in index.html', () => {
  const h = readFileSync('public/index.html', 'utf8');
  assert.ok(h.includes('realtime-client.js'));
  assert.ok(h.includes('expansion.js'));
  assert.ok(h.includes('game.css'));
});