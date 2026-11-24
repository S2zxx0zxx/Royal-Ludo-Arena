/**
 * Royal Ludo Arena V4.0.0 — Splash/Loader, 3D Lucky Spin, 3D Free Coins Chest,
 * Compact Footer Sizing, 6 Upgraded Home Hubs & High-Load Caching Tests
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = p => readFileSync(p, 'utf8');

test('V4 splash loader, 3D hub engine, and hub-3d.css exist and are loaded in index.html & sw.js', () => {
  for (const f of ['public/hub-3d.css', 'public/js/splash-loader.js', 'public/js/hub-3d.js']) {
    assert.ok(existsSync(f), f);
  }
  const html = read('public/index.html');
  assert.ok(html.includes('hub-3d.css'));
  assert.ok(html.includes('splash-loader.js'));
  assert.ok(html.includes('hub-3d.js'));

  const sw = read('public/sw.js');
  assert.ok(sw.includes('hub-3d.css'));
  assert.ok(sw.includes('splash-loader.js'));
  assert.ok(sw.includes('hub-3d.js'));
});

test('compact Lucky Spin and Free Coins footer strip sizing is configured', () => {
  const css = read('public/hub-3d.css');
  assert.match(css, /\.v3-home-footer-strip\s*\{[^}]*56px 1fr 56px/);
  assert.match(css, /\.rla-splash-overlay/);
  assert.match(css, /\.rla-spin-bezel/);
  assert.match(css, /\.rla-chest-stage/);
  assert.match(css, /\.rla-podium/);
  assert.doesNotMatch(css, /(?:linear|radial|conic|repeating-linear|repeating-radial)-gradient\s*\(/i);
});

test('3D hubs wire Lucky Spin physics, Free Coins chest, Daily Reward, Ranks podium, and Starter Pack', () => {
  const hub = read('public/js/hub-3d.js');
  assert.match(hub, /openLuckySpin/);
  assert.match(hub, /requestAnimationFrame/);
  assert.match(hub, /RLASound\?\.spinTick/);
  assert.match(hub, /openFreeCoinsVault/);
  assert.match(hub, /rla-chest-lid/);
  assert.match(hub, /openDailyReward/);
  assert.match(hub, /openLeaderboard/);
  assert.match(hub, /rla-podium/);
  assert.match(hub, /openStarterPack/);
  assert.match(hub, /clearAllHubTimers/);
});

test('high-load client request deduplication and server leaderboard cache are enabled', () => {
  const rc = read('public/js/realtime-client.js');
  assert.match(rc, /_lbInflight/);
  assert.match(rc, /_lbCache/);

  const srv = read('server/index.js');
  assert.match(srv, /server\._lbCache/);
});

test('V4.1 AAA 3D mode setup screens (Online, Team, Friends, Computer, Pass) are wired and gradient-free', () => {
  assert.ok(existsSync('public/js/modes-3d.js'));
  const m = read('public/js/modes-3d.js');
  for (const fn of ['renderOnline', 'renderTeam', 'renderFriends', 'renderComputer', 'renderPass']) {
    assert.ok(m.includes(fn), fn);
  }
  assert.ok(read('public/index.html').includes('modes-3d.js'));
  assert.ok(read('public/sw.js').includes('modes-3d.js'));
  const css = read('public/hub-3d.css');
  assert.match(css, /\.rla-vs-stage/);
  assert.match(css, /\.rla-otp-boxes/);
  assert.match(css, /\.rla-mascot-stage/);
  assert.match(css, /\.rla-roster-row/);
  assert.doesNotMatch(css, /(?:linear|radial|conic|repeating-linear|repeating-radial)-gradient\s*\(/i);
});
