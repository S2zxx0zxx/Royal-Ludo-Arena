/**
 * Royal Ludo Arena v2.0.0 — Live Server, Anti-Fraud Economy, Razorpay HMAC,
 * Multi-Client WebSocket Private Rooms & 2v2 Team Battle Integration Tests
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { createArenaServer } from '../server/index.js';

/** Minimal RFC 6455 WebSocket test client (zero external dependencies) */
function connectTestWS(port) {
  return new Promise((resolve, reject) => {
    const key = crypto.randomBytes(16).toString('base64');
    const socket = net.createConnection({ port, host: '127.0.0.1' }, () => {
      socket.write(
        `GET /ws HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`
      );
    });
    let upgraded = false;
    let buf = Buffer.alloc(0);
    const queue = [];
    const waiters = [];

    function pushMsg(obj) {
      if (waiters.length) waiters.shift()(obj);
      else queue.push(obj);
    }

    socket.on('data', chunk => {
      buf = Buffer.concat([buf, chunk]);
      if (!upgraded) {
        const idx = buf.indexOf('\r\n\r\n');
        if (idx === -1) return;
        upgraded = true;
        buf = buf.subarray(idx + 4);
        resolve(client);
      }
      while (buf.length >= 2) {
        const opcode = buf[0] & 0x0f;
        let len = buf[1] & 0x7f;
        let offset = 2;
        if (len === 126) {
          if (buf.length < 4) return;
          len = buf.readUInt16BE(2);
          offset = 4;
        } else if (len === 127) {
          if (buf.length < 10) return;
          len = Number(buf.readBigUInt64BE(2));
          offset = 10;
        }
        if (buf.length < offset + len) return;
        const payload = buf.subarray(offset, offset + len);
        buf = buf.subarray(offset + len);
        if (opcode === 0x1) pushMsg(JSON.parse(payload.toString('utf8')));
      }
    });
    socket.on('error', reject);

    const client = {
      send(obj) {
        const data = Buffer.from(JSON.stringify(obj), 'utf8');
        const mask = crypto.randomBytes(4);
        let hdr;
        if (data.length < 126) {
          hdr = Buffer.alloc(2);
          hdr[0] = 0x81;
          hdr[1] = 0x80 | data.length;
        } else {
          hdr = Buffer.alloc(4);
          hdr[0] = 0x81;
          hdr[1] = 0x80 | 126;
          hdr.writeUInt16BE(data.length, 2);
        }
        const masked = Buffer.alloc(data.length);
        for (let i = 0; i < data.length; i++) masked[i] = data[i] ^ mask[i % 4];
        socket.write(Buffer.concat([hdr, mask, masked]));
      },
      nextMsg(predicate = null, timeoutMs = 4000) {
        return new Promise((res, rej) => {
          const timer = setTimeout(() => rej(new Error('WS timeout')), timeoutMs);
          const check = (m) => {
            if (!predicate || predicate(m)) { clearTimeout(timer); res(m); }
            else waiters.push(check);
          };
          while (queue.length) {
            const m = queue.shift();
            if (!predicate || predicate(m)) { clearTimeout(timer); return res(m); }
          }
          waiters.push(check);
        });
      },
      close() { socket.destroy(); }
    };
  });
}

test('single-node preview: auth, payment fail-closed, ledger, live private room and 2v2 duo party', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rla-test-'));
  process.env.RAZORPAY_KEY_SECRET = 'test_rzp_secret_key_999';
  const { server, db } = createArenaServer({ dataDir: tmpDir, secret: 'test_jwt_secret', queueFillMs: 1200 });

  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  try {
    // 1. Auth two players
    const aRes = await fetch(`${base}/api/auth/guest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'PlayerA' }) }).then(r => r.json());
    const bRes = await fetch(`${base}/api/auth/guest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'PlayerB' }) }).then(r => r.json());
    assert.equal(aRes.ok, true);
    assert.equal(bRes.ok, true);

    // 2. Forged token rejected (401)
    const badAuth = await fetch(`${base}/api/me`, { headers: { Authorization: 'Bearer fake.token' } });
    assert.equal(badAuth.status, 401);

    // 3. Daily Reward claimed once, duplicate rejected (400)
    const d1 = await fetch(`${base}/api/economy/daily-reward`, { method: 'POST', headers: { Authorization: `Bearer ${aRes.token}` } });
    assert.equal(d1.status, 200);
    const d2 = await fetch(`${base}/api/economy/daily-reward`, { method: 'POST', headers: { Authorization: `Bearer ${aRes.token}` } });
    assert.equal(d2.status, 400);

    // 4. Payment endpoints must never mint coins from client-chosen SKUs.
    const beforeCoins = db.getUser(aRes.user.id).currency.coins;
    const validSig = crypto.createHmac('sha256', 'test_rzp_secret_key_999').update('order_1|pay_1').digest('hex');
    for (const [url, body] of [
      ['/api/payments/razorpay/verify', { sku: 'coins_10m', razorpayOrderId: 'order_1', razorpayPaymentId: 'pay_1', razorpaySignature: validSig }],
      ['/api/payments/google-play/verify', { sku: 'coins_10m', purchaseToken: 'fake-token' }]
    ]) {
      const pay = await fetch(`${base}${url}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aRes.token}` }, body: JSON.stringify(body)
      });
      assert.equal(pay.status, 501);
    }
    assert.equal(db.getUser(aRes.user.id).currency.coins, beforeCoins);

    // 5. Verify hash-chained wallet ledger integrity
    const integrity = db.verifyLedgerIntegrity();
    assert.equal(integrity.valid, true);
    assert.ok(integrity.count >= 3);

    // 6. Live Multi-Client WebSocket Friends Private Room
    const wsA = await connectTestWS(port);
    const wsB = await connectTestWS(port);

    wsA.send({ type: 'AUTH', token: aRes.token });
    wsB.send({ type: 'AUTH', token: bRes.token });
    await wsA.nextMsg(m => m.type === 'AUTH_OK');
    await wsB.nextMsg(m => m.type === 'AUTH_OK');

    wsA.send({ type: 'CREATE_ROOM', mode: 'classic', entryFee: 0 });
    const lobbyA = await wsA.nextMsg(m => m.type === 'ROOM_LOBBY');
    const roomCode = lobbyA.room.code;
    assert.match(roomCode, /^\d{6}$/);

    wsB.send({ type: 'JOIN_ROOM', code: roomCode });
    await wsB.nextMsg(m => m.type === 'ROOM_LOBBY' && m.room.seats.filter(Boolean).length === 2);

    wsB.send({ type: 'TOGGLE_READY' });
    await wsA.nextMsg(m => m.type === 'ROOM_LOBBY' && m.room.seats[1]?.ready === true);

    wsA.send({ type: 'START_ROOM' });
    const startedA = await wsA.nextMsg(m => m.type === 'MATCH_STARTED');
    const startedB = await wsB.nextMsg(m => m.type === 'MATCH_STARTED');
    assert.equal(startedA.roomCode, roomCode);
    assert.equal(startedB.state.players.length, 2);

    // Out-of-turn roll by Player B must be rejected
    wsB.send({ type: 'ROLL_DICE' });
    const errB = await wsB.nextMsg(m => m.type === 'ERROR');
    assert.match(errB.error, /Not your turn/);

    // Valid roll by Player A succeeds with server CSPRNG dice
    wsA.send({ type: 'ROLL_DICE' });
    const rollA = await wsA.nextMsg(m => m.type === 'GAME_ROLL');
    assert.ok(rollA.result.value >= 1 && rollA.result.value <= 6);

    // 7. Already-playing users cannot escape their match to enter a new party.
    wsA.send({ type: 'CREATE_TEAM_PARTY', mode: 'classic', entryFee: 100 });
    const busy = await wsA.nextMsg(m => m.type === 'ERROR');
    assert.match(busy.error, /Finish current match first/);

    // 8. Live 2v2 Duo Party is tested with two different guest accounts.
    const cRes = await fetch(`${base}/api/auth/guest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'PlayerC' }) }).then(r => r.json());
    const dRes = await fetch(`${base}/api/auth/guest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'PlayerD' }) }).then(r => r.json());
    const wsC = await connectTestWS(port);
    const wsD = await connectTestWS(port);
    wsC.send({ type: 'AUTH', token: cRes.token });
    wsD.send({ type: 'AUTH', token: dRes.token });
    await wsC.nextMsg(m => m.type === 'AUTH_OK');
    await wsD.nextMsg(m => m.type === 'AUTH_OK');
    wsC.send({ type: 'CREATE_TEAM_PARTY', mode: 'classic', entryFee: 100 });
    const partyMsg = await wsC.nextMsg(m => m.type === 'TEAM_PARTY_UPDATE');
    const partyCode = partyMsg.party.code;
    assert.match(partyCode, /^\d{6}$/);
    assert.equal(partyMsg.party.entryFee, 0);

    // Host may not launch without the human partner.
    wsC.send({ type: 'START_TEAM_PARTY', code: partyCode });
    const notReady = await wsC.nextMsg(m => m.type === 'ERROR');
    assert.match(notReady.error, /two human teammates/);

    wsD.send({ type: 'JOIN_TEAM_PARTY', code: partyCode });
    const party2 = await wsD.nextMsg(m => m.type === 'TEAM_PARTY_UPDATE' && m.party.members.length === 2);
    assert.equal(party2.party.members[0].color, 'blue');
    assert.equal(party2.party.members[1].color, 'green');

    wsC.send({ type: 'START_TEAM_PARTY', code: partyCode });
    const teamMatch = await wsC.nextMsg(m => m.type === 'MATCH_STARTED' && m.kind === 'team');
    assert.equal(teamMatch.state.mode, 'teamUp');
    assert.equal(teamMatch.state.players.length, 4);
    assert.equal(teamMatch.state.players[0].userId, cRes.user.id);
    assert.equal(teamMatch.state.players[2].userId, dRes.user.id);
    assert.equal(teamMatch.state.players[0].teamId, teamMatch.state.players[2].teamId);
    assert.equal(teamMatch.state.prizeCoins, 0);
    wsC.close();
    wsD.close();

    wsA.close();
    wsB.close();
  } finally {
    delete process.env.RAZORPAY_KEY_SECRET;
    await new Promise(r => server.close(r));
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
