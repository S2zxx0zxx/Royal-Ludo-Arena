import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const read = p => readFileSync(p, 'utf8');
const expansion = read('public/js/expansion.js');
const app = read('public/js/app.js');
const view = read('public/js/game-view.js');

const approvedArtwork = {
  'home.webp': '1e9e11b39df9ee1dd8c0cb7c59f91a5bd253a2d4',
  'events.jpg': '09aaaa03568291c9118faf3564466d0d3d3d97de',
  'profile.jpg': '2f0a85474fb2673e2fefcc8ddc6015c37624c0e3',
  'online.webp': '32f4dab231a5f13efd9c39eebcba187afdc48bfc',
  'friends.webp': 'b7e1f1b78900cbac3c02a3274e7e236ec52f47e0',
  'team.webp': '2a57d8478c088ece08194226b2fa1f92aced1bc0',
  'pass.webp': '30eabf7df3073c6cf5601c2c3587528611ecb795'
};
function gitHash(content) { return createHash('sha1').update(`blob ${content.length}\0`).update(content).digest('hex'); }

test('prior user-approved source artwork is preserved byte-for-byte', () => {
  for (const [name, expected] of Object.entries(approvedArtwork)) {
    assert.equal(gitHash(readFileSync('public/assets/screens/' + name)), expected, name);
  }
});

test('component UI has no forbidden gradient fills', () => {
  for (const path of ['public/styles.css', 'public/game.css', 'public/extended.css']) {
    assert.doesNotMatch(read(path), /(?:linear|radial|conic|repeating-linear|repeating-radial)-gradient\s*\(/i, path);
  }
});

test('v3 native screens have accessible routes with original five entry modes', () => {
  for (const screen of ['online', 'team', 'friends', 'computer', 'pass']) assert.ok(app.includes(`screen === '${screen}'`), screen);
  for (const screen of ['profile', 'events', 'store', 'daily-goals']) assert.ok(expansion.includes(`route === '${screen}'`), screen);
  assert.match(app, /data-nav="profile"/);
  assert.match(app, /data-nav="events"/);
});

test('server-active mission claim all never calls local mint function', () => {
  assert.match(expansion, /window\.RLAClient\?\.isServerAvailable\(\)/);
  assert.match(expansion, /window\.RLAClient\.claimMission\(mission\.id\)/);
  assert.match(expansion, /Claimed \$\{res\.count\} practice mission\(s\)!/);
  const block=expansion.slice(expansion.indexOf("querySelector('#v3-claim-all-m')"),expansion.indexOf("querySelectorAll('[data-store-tab]')"));
  assert.ok(block.indexOf('return;') < block.lastIndexOf('window.RLAState.claimAllMissions()'));
});

test('online profile write requires success before saved confirmation', () => {
  assert.match(expansion, /const result = await window\.RLAClient\.updateProfile/);
  assert.match(expansion, /if \(!result\?\.ok\)/);
  assert.match(expansion, /Profile was not saved/);
});

test('server stores remain preview-only and payment fulfillment fail-closed', () => {
  const payments=read('server/payments.js');
  assert.match(payments, /501/);
  const server=read('server/index.js');
  assert.match(server, /RLA_ALLOW_SINGLE_NODE_PREVIEW/);
  assert.match(server, /NODE_ENV/);
});

test('player names escaped in DOM and corrupted match snapshots rejected', () => {
  assert.match(view, /function escapeHtml/);
  assert.match(view, /escapeHtml\(p\.displayName\)/);
  assert.match(view, /Invalid saved match|Saved match could not be restored/);
  assert.match(read('public/js/ludo-engine.js'), /Invalid saved match/);
});

test('PWA has versioned cache and all v3 art resources present', () => {
  const sw=read('public/sw.js');
  assert.match(sw, /royal-ludo-arena-v3/);
  for (const f of ['hero-ludo-3d.webp','avatar-hero.webp','bot-mascot.webp']) {
    assert.ok(existsSync('public/assets/game/'+f));
    assert.ok(readFileSync('public/assets/game/'+f).length > 9000);
    assert.ok(sw.includes(f));
  }
});
