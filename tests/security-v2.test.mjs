import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { AuthoritativeDB } from '../server/store-db.js';
import { createArenaServer } from '../server/index.js';
import { RoomManager } from '../server/rooms.js';

function withDb(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rla-v2-safe-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return { db: new AuthoritativeDB(dir, crypto.randomBytes(32).toString('hex')), dir };
}

test('wallet rejects invalid non-integer and non-finite amounts', t => {
  const { db } = withDb(t), { user } = db.createGuestAccount('Tester');
  const before = JSON.stringify(user.currency);
  for (const n of [NaN, Infinity, -1, 1.1, 1e40, '15', null, undefined]) {
    assert.equal(db.creditWallet(user.id, n, 0, 'bad').ok, false);
    assert.equal(db.debitWallet(user.id, 0, n, 'bad').ok, false);
    assert.equal(JSON.stringify(user.currency), before);
  }
  assert.equal(db.verifyLedgerIntegrity().valid, true);
});

test('session expires, can not be forged and has a bounded lifetime', t => {
  const { db } = withDb(t), { user, token } = db.createGuestAccount('Tester');
  assert.equal(db.verifyToken(token), user.id);
  assert.equal(db.verifyToken(token + '.extra'), null);
  const [payload] = token.split('.');
  const data = JSON.parse(Buffer.from(payload, 'base64url'));
  data.exp = Date.now() - 1;
  const p = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig = crypto.createHmac('sha256', db.secret).update(p).digest('base64url');
  assert.equal(db.verifyToken(p + '.' + sig), null);
});

test('broken persistence fails closed rather than wiping ledger', t => {
  const { dir } = withDb(t);
  fs.writeFileSync(path.join(dir, 'db.json'), '{ invalid JSON');
  assert.throws(() => new AuthoritativeDB(dir, 'test-secret'), SyntaxError);
});

test('match settlement is idempotent', t => {
  const { db } = withDb(t), { user } = db.createGuestAccount('Tester');
  const initial = user.stats.gamesPlayed;
  assert.ok(db.recordAuthoritativeMatch(user.id, { won: true, matchId: 'match1' }));
  assert.equal(db.recordAuthoritativeMatch(user.id, { won: true, matchId: 'match1' }), null);
  assert.equal(user.stats.gamesPlayed, initial + 1);
});

test('single-node server rejects CORS preflights, payment grants and rate-limits guest creation', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rla-safe-server-'));
  const { server, db } = createArenaServer({ dataDir: dir, secret: crypto.randomBytes(32).toString('hex') });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  t.after(async () => { await new Promise(r => server.close(r)); fs.rmSync(dir, { recursive: true, force: true }); });
  const opt = await fetch(base + '/api/me', { method: 'OPTIONS', headers: { Origin: 'https://attacker.example', 'Access-Control-Request-Method': 'POST' } });
  assert.equal(opt.status, 403);
  assert.equal(opt.headers.has('access-control-allow-origin'), false);
  const users = [];
  for (let i = 0; i < 12; i++) {
    const res = await fetch(base + '/api/auth/guest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `A${i}` }) });
    assert.equal(res.status, 200);
    users.push((await res.json()).user.id);
  }
  assert.equal(new Set(users).size, 12);
  const denied = await fetch(base + '/api/auth/guest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(denied.status, 429);
  assert.equal(Object.keys(db.state.users).length, 12);
});

test('untrusted cross-site WebSocket origin is refused', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rla-ws-safe-'));
  const { server } = createArenaServer({ dataDir: dir, secret: crypto.randomBytes(32).toString('hex') });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  t.after(async () => { await new Promise(r => server.close(r)); fs.rmSync(dir, { recursive: true, force: true }); });
  const resp = await new Promise((resolve, reject) => {
    const socket = net.connect(port, '127.0.0.1', () => {
      socket.write(`GET /ws HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nOrigin: https://attacker.example\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: ${crypto.randomBytes(16).toString('base64')}\r\n\r\n`);
    });
    socket.on('data', b => { resolve(b.toString('utf8')); socket.destroy(); });
    socket.on('error', reject);
  });
  assert.match(resp, /^HTTP\/1\.1 403 Forbidden/);
});

test('entry fees and game prize pool are disabled in non-transactional preview', t => {
  const { db } = withDb(t);
  const { user: a } = db.createGuestAccount('A');
  const { user: b } = db.createGuestAccount('B');
  const rooms = new RoomManager(db, path.resolve('public'), { queueFillMs: 10 });
  const created = rooms.createPrivateRoom(a.id, { entryFee: 10000, mode: 'classic' });
  assert.equal(created.room.entryFee, 0);
  assert.equal(rooms.joinPrivateRoom(b.id, created.room.code).ok, true);
  rooms.toggleReady(b.id);
  const before = db.getUser(a.id).currency.coins;
  const started = rooms.startPrivateRoom(a.id);
  assert.equal(started.ok, true);
  assert.equal(db.getUser(a.id).currency.coins, before);
  assert.equal(rooms.rooms.get(created.room.code).engine.prizeCoins, 0);
  rooms.closeAll();
});
