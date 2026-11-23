import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const view = readFileSync('public/js/game-view.js', 'utf8');
const app = readFileSync('public/js/app.js', 'utf8');
const engineCode = readFileSync('public/js/ludo-engine.js', 'utf8');
test('user-owned display names are escaped in v2 board and modals', () => {
  assert.match(view, /function escapeHtml\(/);
  for (const expression of ['escapeHtml(p.displayName)', 'escapeHtml(promptText)', 'escapeHtml(p.name)', 'escapeHtml(s.name)', 'escapeHtml(m.name)', 'escapeHtml(title)']) {
    assert.ok(view.includes(expression), expression);
  }
  assert.ok(!view.includes('<strong>${p.name}</strong>'));
  assert.ok(!view.includes('value="${s.name}"'));
});
test('corrupt game snapshots cannot bypass v1 restore protections', () => {
  const sandbox = { console, Math, Set, Map, Array, Object, Number, String, Boolean, JSON };
  sandbox.globalThis = sandbox;
  const ctx = vm.createContext(sandbox);
  vm.runInContext(engineCode, ctx);
  assert.throws(() => ctx.LudoCore.LudoEngine.deserialize({ players: [{ name: '<img src=x onerror=alert(1)>' }], currentTurn: 0 }), /Invalid saved match/);
  assert.match(view, /Saved match could not be restored/);
});
test('game setup still reachable from all five original modes', () => {
  for (const route of ['computer', 'pass', 'online', 'team', 'friends']) assert.ok(app.includes(`screen === '${route}'`));
});
test('monetization modal explains explicit billing block', () => {
  const ext = readFileSync('public/js/expansion.js', 'utf8');
  assert.match(ext, /STORE PURCHASES NOT YET AVAILABLE/);
  assert.match(ext, /no virtual currency will be credited/);
});
