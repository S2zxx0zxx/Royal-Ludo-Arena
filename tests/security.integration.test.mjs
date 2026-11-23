import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const view = readFileSync('public/js/game-view.js', 'utf8');
const app = readFileSync('public/js/app.js', 'utf8');
test('names and prompts are escaped before HTML insertion', () => {
  assert.match(view, /function escapeHtml\(/);
  for (const expression of ['escapeHtml(p.displayName)', 'escapeHtml(promptText)', 'escapeHtml(profile.name)', 'escapeHtml(s.name)']) assert.ok(view.includes(expression), expression);
});
test('save corruption cannot be blindly restored', () => {
  assert.match(view, /Invalid saved match/);
  assert.match(view, /Saved match could not be restored/);
});
test('offline matchmaking and private room are not advertised as genuine remote games', () => {
  assert.match(view, /OFFLINE BOT MATCH/);
  assert.match(view, /NOT an Internet multiplayer lobby/);
});
test('game remains available from each original launch screen', () => {
  for (const route of ['computer', 'pass', 'online', 'team', 'friends']) assert.ok(app.includes(`screen === '${route}'`));
});
test('source snippets with user names are protected in new game view', () => {
  assert.ok(!view.includes('<strong>${profile.name}</strong>'));
  assert.ok(!view.includes('value="${s.name}"'));
});
