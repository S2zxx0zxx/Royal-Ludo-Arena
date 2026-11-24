/**
 * Royal Ludo Arena v2.0.0 — Production HTTP + REST API + WebSocket Server
 * Zero external dependencies — run directly with `node server/index.js` or `npm start`.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AuthoritativeDB } from './store-db.js';
import { SKU_CATALOG, verifyRazorpayPayment, verifyGooglePlayPurchase } from './payments.js';
import { WSServer } from './ws-server.js';
import { RoomManager } from './rooms.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 131072) {
        reject(new Error('Body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function sendJSON(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

export function createArenaServer(options = {}) {
  if (process.env.NODE_ENV === 'production' && process.env.RLA_ALLOW_SINGLE_NODE_PREVIEW !== 'true') {
    throw new Error('Single-file single-process preview server must not be used as scalable production; configure durable storage first.');
  }
  const dataDir = options.dataDir || path.join(__dirname, 'data');
  const db = new AuthoritativeDB(dataDir, options.secret);
  const rooms = new RoomManager(db, PUBLIC_DIR, options);

  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
        res.writeHead(403, { 'Cache-Control': 'no-store' });
        return res.end();
      }

      const urlObj = new URL(req.url || '/', 'http://localhost');
      const pathname = urlObj.pathname;

      /* ---------- REST API ROUTES ---------- */
      if (pathname.startsWith('/api/')) {
        const ip = req.socket.remoteAddress || 'local';
        if (!db.checkRateLimit(`ip:${ip}`, 180, 60000)) {
          return sendJSON(res, 429, { ok: false, error: 'Too many requests' });
        }

        if (pathname === '/api/health' && req.method === 'GET') {
          return sendJSON(res, 200, {
            ok: true,
            version: '2.0.0',
            ledger: db.verifyLedgerIntegrity(),
            activeRooms: rooms.rooms.size
          });
        }

        if (pathname === '/api/auth/guest' && req.method === 'POST') {
          if (!db.checkRateLimit(`guest:${ip}`, 12, 3600000)) {
            return sendJSON(res, 429, { ok: false, error: 'Too many guest account requests' });
          }
          const body = await readBody(req);
          const created = db.createGuestAccount(body.name);
          return sendJSON(res, 200, { ok: true, token: created.token, user: created.user });
        }

        if (pathname === '/api/store/catalog' && req.method === 'GET') {
          return sendJSON(res, 200, { ok: true, catalog: SKU_CATALOG });
        }

        if (pathname === '/api/leaderboard' && req.method === 'GET') {
          const now = Date.now();
          if (!server._lbCache || (now - server._lbCache.ts) > 5000) {
            server._lbCache = { ts: now, data: db.getLeaderboard() };
          }
          return sendJSON(res, 200, { ok: true, leaderboard: server._lbCache.data, cached: true });
        }

        // All routes below require valid HMAC-signed Bearer token
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        const userId = db.verifyToken(token);
        if (!userId) return sendJSON(res, 401, { ok: false, error: 'Invalid or missing session token' });

        if (pathname === '/api/me' && req.method === 'GET') {
          return sendJSON(res, 200, { ok: true, user: db.getUser(userId) });
        }

        if (pathname === '/api/profile/update' && req.method === 'POST') {
          const body = await readBody(req);
          const result = db.updateProfile(userId, body);
          return sendJSON(res, result.ok ? 200 : 400, result);
        }

        if (pathname === '/api/economy/daily-reward' && req.method === 'POST') {
          const result = db.claimDailyReward(userId);
          return sendJSON(res, result.ok ? 200 : 400, result);
        }

        if (pathname === '/api/economy/lucky-spin' && req.method === 'POST') {
          const result = db.spinLuckyWheel(userId);
          return sendJSON(res, result.ok ? 200 : 400, result);
        }

        if (pathname === '/api/economy/free-chest' && req.method === 'POST') {
          const result = db.claimFreeChest(userId);
          return sendJSON(res, result.ok ? 200 : 400, result);
        }

        if (pathname === '/api/economy/claim-mission' && req.method === 'POST') {
          const body = await readBody(req);
          const result = db.claimMission(userId, body.missionId);
          return sendJSON(res, result.ok ? 200 : 400, result);
        }

        if (pathname === '/api/inventory/cosmetic' && req.method === 'POST') {
          const body = await readBody(req);
          const result = db.buyOrEquipCosmetic(userId, body.kind, body.itemId);
          return sendJSON(res, result.ok ? 200 : 400, result);
        }

        if (pathname === '/api/payments/razorpay/verify' && req.method === 'POST') {
          const body = await readBody(req);
          const result = verifyRazorpayPayment(db, userId, body);
          return sendJSON(res, result.status, result.body);
        }

        if (pathname === '/api/payments/google-play/verify' && req.method === 'POST') {
          const body = await readBody(req);
          const result = await verifyGooglePlayPurchase(db, userId, body);
          return sendJSON(res, result.status, result.body);
        }

        return sendJSON(res, 404, { ok: false, error: 'Unknown API endpoint' });
      }

      /* ---------- STATIC FILE SERVER (public/) ---------- */
      let rel;
      try { rel = decodeURIComponent(pathname === '/' ? '/index.html' : pathname); }
      catch { return sendJSON(res, 400, { ok: false, error: 'Invalid path' }); }
      const filePath = path.resolve(PUBLIC_DIR, '.' + rel);
      if (!filePath.startsWith(PUBLIC_DIR + path.sep) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404);
        return res.end('Not found');
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' });
      fs.createReadStream(filePath).pipe(res);
    } catch (err) {
      sendJSON(res, 400, { ok: false, error: err.message || 'Bad request' });
    }
  });

  /* ---------- WEBSOCKET REAL-TIME PROTOCOL (/ws) ---------- */
  const wss = new WSServer(server, '/ws');
  wss.on('connection', (ws) => {
    let authedUserId = null;
    let msgBucket = { count: 0, resetAt: Date.now() + 10000 };

    ws.on('message', (raw) => {
      if (Date.now() > msgBucket.resetAt) msgBucket = { count: 0, resetAt: Date.now() + 10000 };
      if (++msgBucket.count > 100) { ws.close(1008); return; }
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }
      if (!msg || typeof msg !== 'object' || Array.isArray(msg) || typeof msg.type !== 'string') return;

      if (msg.type === 'AUTH') {
        if (authedUserId) { ws.sendJSON({ type: 'AUTH_ERROR', error: 'Already authenticated' }); return; }
        const uid = db.verifyToken(msg.token);
        if (!uid) {
          ws.sendJSON({ type: 'AUTH_ERROR', error: 'Invalid session token' });
          return;
        }
        authedUserId = uid;
        rooms.registerSocket(uid, ws);
        ws.sendJSON({ type: 'AUTH_OK', user: db.getUser(uid) });
        return;
      }

      if (!authedUserId) {
        ws.sendJSON({ type: 'ERROR', error: 'Authenticate first' });
        return;
      }

      let res = null;
      switch (msg.type) {
        case 'CREATE_ROOM':      res = rooms.createPrivateRoom(authedUserId, msg); break;
        case 'JOIN_ROOM':        res = rooms.joinPrivateRoom(authedUserId, msg.code); break;
        case 'TOGGLE_READY':     res = rooms.toggleReady(authedUserId); break;
        case 'ADD_BOT':          res = rooms.addBotToRoom(authedUserId, msg.difficulty); break;
        case 'REMOVE_SEAT':      res = rooms.removeSeat(authedUserId, msg.seatIndex); break;
        case 'LEAVE_ROOM':       rooms.leaveRoom(authedUserId); break;
        case 'START_ROOM':       res = rooms.startPrivateRoom(authedUserId); break;
        case 'QUEUE_ONLINE':     res = rooms.queueOnline(authedUserId, msg); break;
        case 'QUEUE_TEAM_SOLO':  res = rooms.queueTeamSolo(authedUserId, msg); break;
        case 'CREATE_TEAM_PARTY':res = rooms.createTeamParty(authedUserId, msg); break;
        case 'JOIN_TEAM_PARTY':  res = rooms.joinTeamParty(authedUserId, msg.code); break;
        case 'START_TEAM_PARTY': res = rooms.startTeamPartyMatch(authedUserId, msg.code); break;
        case 'CANCEL_QUEUE':     rooms.cancelQueue(authedUserId); break;
        case 'ROLL_DICE':        res = rooms.handleRoll(authedUserId); break;
        case 'MOVE_TOKEN':       res = rooms.handleMove(authedUserId, msg.tokenId); break;
        case 'POWER_REROLL':     res = rooms.handlePowerReroll(authedUserId); break;
        case 'EMOTE':            rooms.handleEmote(authedUserId, msg.emote, Boolean(msg.teamOnly)); break;
        default: ws.sendJSON({ type: 'ERROR', error: 'Unknown action' }); return;
      }
      if (res && res.ok === false) {
        ws.sendJSON({ type: 'ERROR', error: res.error, forType: msg.type });
      }
    });

    ws.on('close', () => {
      if (authedUserId) rooms.unregisterSocket(authedUserId, ws);
    });
  });

  const originalClose = server.close.bind(server);
  server.close = (cb) => {
    rooms.closeAll();
    wss.close();
    return originalClose(cb);
  };

  return { server, db, rooms, wss };
}

// Start directly when executed as main entry point
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const PORT = Number(process.env.PORT || 4173);
  const { server } = createArenaServer();
  const bindHost = process.env.RLA_BIND_HOST || '127.0.0.1';
  server.listen(PORT, bindHost, () => {
    console.log(`Royal Ludo Arena v2.0.0 preview at http://${bindHost}:${PORT} (WebSocket: ws://localhost:${PORT}/ws)`);
  });
}
