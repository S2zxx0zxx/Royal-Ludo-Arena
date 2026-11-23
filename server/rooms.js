/**
 * Royal Ludo Arena v2.0.0 — Authoritative Private Rooms, Online & 2v2 Team Battle Matchmaking
 *
 * Features:
 * - Server-authoritative LudoEngine + CSPRNG dice (`crypto.randomInt(1, 7)`)
 * - Friends Private Rooms (6-digit code, ready states, host migration, bots, live reconnect)
 * - 2v2 Team Battle Matchmaking:
 *     * 4Online: pairs queued players into Team 1 (Blue+Green) vs Team 2 (Red+Yellow)
 *     * 2Friends2Online: 6-digit Duo Party code locks 2 friends onto Team 1 together!
 * - Server-side entry fee escrow & atomic winning-team prize distribution
 * - Team-only tactical signals + public emotes
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const COLORS = ['blue', 'red', 'green', 'yellow'];
const BOT_POOL = [
  { name: 'Vikram_King', avatar: '🦁' },
  { name: 'AanyaRoyal', avatar: '👑' },
  { name: 'RohanBlitz', avatar: '🐉' },
  { name: 'PriyaDice', avatar: '💎' }
];

function loadSharedEngine(publicDir) {
  const sandbox = { console, Math, Set, Map, Array, Object, Number, String, Boolean, JSON };
  sandbox.globalThis = sandbox;
  const ctx = vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(publicDir, 'js/ludo-engine.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(publicDir, 'js/ludo-ai.js'), 'utf8'), ctx);
  return { LudoCore: ctx.LudoCore, LudoAI: ctx.LudoAI };
}

export class RoomManager {
  constructor(db, publicDir, options = {}) {
    this.db = db;
    this.queueFillMs = options.queueFillMs ?? 6000;
    this.turnTimeoutMs = options.turnTimeoutMs ?? 19000;
    const { LudoCore, LudoAI } = loadSharedEngine(publicDir);
    this.LudoCore = LudoCore;
    this.LudoAI = LudoAI;

    this.rooms = new Map();        // roomCode -> Room
    this.userRoom = new Map();     // userId -> roomCode
    this.sockets = new Map();      // userId -> WSClient
    this.onlineQueue = [];         // [{ userId, mode, entryFee, timer }]
    this.teamSoloQueue = [];       // [{ userId, mode, entryFee, timer }]
    this.teamParties = new Map();  // partyCode -> { code, mode, hostId, members: [userId], entryFee }
  }

  registerSocket(userId, ws) {
    const old = this.sockets.get(userId);
    if (old && old !== ws && !old.closed) old.close(1008);
    this.sockets.set(userId, ws);
    // Auto-reconnect if user is already in an active room
    const code = this.userRoom.get(userId);
    if (code && this.rooms.has(code)) {
      const room = this.rooms.get(code);
      this._sendRoomSnapshot(ws, room, userId);
    }
  }

  unregisterSocket(userId, ws) {
    if (this.sockets.get(userId) === ws) {
      this.sockets.delete(userId);
    }
    // Only the currently registered socket may cancel active queues on disconnect.
    if (!this.sockets.has(userId)) this._removeFromQueues(userId);
  }

  _send(userId, payload) {
    const ws = this.sockets.get(userId);
    if (ws && !ws.closed) ws.sendJSON(payload);
  }

  _broadcast(room, payload) {
    for (const seat of room.seats) {
      if (seat && seat.userId && !seat.isBot) {
        this._send(seat.userId, payload);
      }
    }
  }

  _genCode(map) {
    for (let i = 0; i < 30; i++) {
      const code = String(crypto.randomInt(100000, 999999));
      if (!map.has(code)) return code;
    }
    return String(crypto.randomInt(100000, 999999));
  }

  /* ===================== FRIENDS PRIVATE ROOMS ===================== */
  createPrivateRoom(userId, { mode = 'classic', entryFee = 0 } = {}) {
    if (!['classic', 'quick', 'oneKillWin', 'popular', 'mask', 'teamUp'].includes(mode)) return { ok: false, error: 'Unsupported game mode' };
    if (this._getRoomForUser(userId)?.status === 'playing') return { ok: false, error: 'Finish current match first' };
    const user = this.db.getUser(userId);
    if (!user) return { ok: false, error: 'Unauthorized' };
    this.leaveRoom(userId);

    const code = this._genCode(this.rooms);
    const room = {
      code,
      kind: 'private',
      mode,
      entryFee: 0, // virtual stakes disabled until a transactional ledger exists
      hostId: userId,
      status: 'lobby', // 'lobby' | 'playing' | 'finished'
      seats: [
        { seatIndex: 0, color: 'blue', userId, name: user.profile.name, avatar: user.profile.avatar, isBot: false, ready: true },
        null,
        null,
        null
      ],
      engine: null,
      matchId: null,
      turnTimer: null,
      aiTimer: null,
      createdAt: Date.now()
    };
    this.rooms.set(code, room);
    this.userRoom.set(userId, code);
    this._broadcastLobby(room);
    return { ok: true, room: this._publicLobby(room) };
  }

  joinPrivateRoom(userId, code) {
    const user = this.db.getUser(userId);
    if (!user) return { ok: false, error: 'Unauthorized' };
    const clean = String(code || '').replace(/[^0-9]/g, '');
    const room = this.rooms.get(clean);
    if (!room) return { ok: false, error: 'Room not found' };

    // Rejoin if already seated
    const existing = room.seats.find(s => s && s.userId === userId);
    if (existing) {
      this.userRoom.set(userId, clean);
      const ws = this.sockets.get(userId);
      if (ws) this._sendRoomSnapshot(ws, room, userId);
      return { ok: true, room: this._publicLobby(room), rejoined: true };
    }

    if (room.status !== 'lobby') return { ok: false, error: 'Match already in progress' };
    const openIdx = room.seats.findIndex(s => s === null);
    if (openIdx === -1) return { ok: false, error: 'Room is full (4/4)' };

    this.leaveRoom(userId);
    room.seats[openIdx] = {
      seatIndex: openIdx,
      color: COLORS[openIdx],
      userId,
      name: user.profile.name,
      avatar: user.profile.avatar,
      isBot: false,
      ready: false
    };
    this.userRoom.set(userId, clean);
    this._broadcastLobby(room);
    return { ok: true, room: this._publicLobby(room) };
  }

  toggleReady(userId) {
    const room = this._getRoomForUser(userId);
    if (!room || room.status !== 'lobby') return { ok: false, error: 'Not in lobby' };
    const seat = room.seats.find(s => s && s.userId === userId);
    if (!seat) return { ok: false, error: 'Seat not found' };
    seat.ready = !seat.ready;
    this._broadcastLobby(room);
    return { ok: true, ready: seat.ready };
  }

  addBotToRoom(userId, difficulty = 'medium') {
    const room = this._getRoomForUser(userId);
    if (!room || room.status !== 'lobby') return { ok: false, error: 'Not in lobby' };
    if (room.hostId !== userId) return { ok: false, error: 'Only host can add bots' };
    const openIdx = room.seats.findIndex(s => s === null);
    if (openIdx === -1) return { ok: false, error: 'Room is full' };
    const bot = BOT_POOL[openIdx % BOT_POOL.length];
    room.seats[openIdx] = {
      seatIndex: openIdx,
      color: COLORS[openIdx],
      userId: `BOT_${room.code}_${openIdx}`,
      name: `Bot ${bot.name}`,
      avatar: bot.avatar,
      isBot: true,
      aiLevel: difficulty,
      ready: true
    };
    this._broadcastLobby(room);
    return { ok: true };
  }

  removeSeat(userId, seatIndex) {
    const room = this._getRoomForUser(userId);
    if (!room || room.status !== 'lobby') return { ok: false, error: 'Not in lobby' };
    if (room.hostId !== userId) return { ok: false, error: 'Only host can kick seats' };
    const target = room.seats[seatIndex];
    if (!target || target.userId === userId) return { ok: false, error: 'Cannot remove host' };
    if (!target.isBot) {
      this.userRoom.delete(target.userId);
      this._send(target.userId, { type: 'ROOM_KICKED', code: room.code });
    }
    room.seats[seatIndex] = null;
    this._broadcastLobby(room);
    return { ok: true };
  }

  leaveRoom(userId) {
    const code = this.userRoom.get(userId);
    if (!code) return;
    this.userRoom.delete(userId);
    const room = this.rooms.get(code);
    if (!room) return;

    if (room.status === 'lobby') {
      const idx = room.seats.findIndex(s => s && s.userId === userId);
      if (idx !== -1) room.seats[idx] = null;
      const humansLeft = room.seats.filter(s => s && !s.isBot);
      if (humansLeft.length === 0) {
        this._cleanupRoom(room);
        return;
      }
      if (room.hostId === userId) {
        room.hostId = humansLeft[0].userId;
        humansLeft[0].ready = true;
      }
      this._broadcastLobby(room);
    }
  }

  startPrivateRoom(userId) {
    const room = this._getRoomForUser(userId);
    if (!room || room.status !== 'lobby') return { ok: false, error: 'Not in lobby' };
    if (room.hostId !== userId) return { ok: false, error: 'Only host can start match' };
    const seated = room.seats.filter(Boolean);
    if (seated.length < 2) return { ok: false, error: 'Need at least 2 players (or add a Bot)' };
    if (room.mode === 'teamUp' && seated.length !== 4) {
      return { ok: false, error: 'Team Up requires all 4 seats filled' };
    }
    const unready = seated.find(s => !s.isBot && !s.ready && s.userId !== room.hostId);
    if (unready) return { ok: false, error: `${unready.name} is not ready yet` };
    return this._launchMatch(room);
  }

  /* ===================== 2v2 TEAM BATTLE & ONLINE MATCHMAKING ===================== */
  queueTeamSolo(userId, { mode = 'classic', entryFee = 100 } = {}) {
    if (!['classic', 'quick'].includes(mode)) return { ok: false, error: 'Unsupported team mode' };
    entryFee = 0;
    if (this._getRoomForUser(userId)?.status === 'playing') return { ok: false, error: 'Finish current match first' };
    const user = this.db.getUser(userId);
    if (!user) return { ok: false, error: 'Unauthorized' };
    this._removeFromQueues(userId);

    const entry = { userId, mode, entryFee, joinedAt: Date.now(), timer: null };
    this.teamSoloQueue.push(entry);
    this._send(userId, { type: 'QUEUE_STATUS', queue: 'team-solo', count: this.teamSoloQueue.length, needed: 4 });

    // Check if 4 players are ready immediately
    const sameMode = this.teamSoloQueue.filter(q => q.mode === mode);
    if (sameMode.length >= 4) {
      const picked = sameMode.slice(0, 4);
      picked.forEach(p => this._removeFromQueues(p.userId));
      this._spawnTeamMatch(picked.map(p => p.userId), mode, entryFee);
      return { ok: true, matched: true };
    }

    // Fill remaining seats with tactical bots after queueFillMs
    entry.timer = setTimeout(() => {
      const stillIn = this.teamSoloQueue.filter(q => q.mode === mode);
      if (!stillIn.some(q => q.userId === userId)) return;
      const picked = stillIn.slice(0, 4);
      picked.forEach(p => this._removeFromQueues(p.userId));
      this._spawnTeamMatch(picked.map(p => p.userId), mode, entryFee);
    }, this.queueFillMs);
    entry.timer.unref?.();
    return { ok: true, queued: true };
  }

  createTeamParty(userId, { mode = 'classic', entryFee = 100 } = {}) {
    if (!['classic', 'quick'].includes(mode)) return { ok: false, error: 'Unsupported team mode' };
    entryFee = 0;
    if (this._getRoomForUser(userId)?.status === 'playing') return { ok: false, error: 'Finish current match first' };
    const user = this.db.getUser(userId);
    if (!user) return { ok: false, error: 'Unauthorized' };
    this._removeFromQueues(userId);
    const code = this._genCode(this.teamParties);
    const party = {
      code,
      mode,
      entryFee,
      hostId: userId,
      members: [userId], // Index 0 -> Blue (Team 1), Index 1 -> Green (Team 1 partner!)
      createdAt: Date.now()
    };
    this.teamParties.set(code, party);
    this._broadcastParty(party);
    return { ok: true, party: this._publicParty(party) };
  }

  joinTeamParty(userId, code) {
    const user = this.db.getUser(userId);
    if (!user) return { ok: false, error: 'Unauthorized' };
    const clean = String(code || '').replace(/[^0-9]/g, '');
    const party = this.teamParties.get(clean);
    if (!party) return { ok: false, error: 'Team Party code not found' };
    if (party.members.includes(userId)) {
      this._broadcastParty(party);
      return { ok: true, party: this._publicParty(party) };
    }
    if (party.members.length >= 2) return { ok: false, error: 'Duo Party is already full (2/2)' };
    this._removeFromQueues(userId);
    party.members.push(userId);
    this._broadcastParty(party);
    return { ok: true, party: this._publicParty(party) };
  }

  startTeamPartyMatch(userId, code) {
    const party = this.teamParties.get(String(code || ''));
    if (!party) return { ok: false, error: 'Team Party not found' };
    if (party.hostId !== userId) return { ok: false, error: 'Only Party Host can launch' };
    if (party.members.length !== 2) return { ok: false, error: 'Duo Party needs two human teammates' };
    this.teamParties.delete(party.code);

    // Pull up to 2 online solo-queued opponents for Team 2 (Red & Yellow), fill rest with tactical bots
    const opponents = this.teamSoloQueue.filter(q => q.mode === party.mode).slice(0, 2);
    opponents.forEach(o => this._removeFromQueues(o.userId));

    // Seat order: [0: Blue (T1), 1: Red (T2), 2: Green (T1 partner), 3: Yellow (T2)]
    const seatUserIds = [
      party.members[0] || null,
      opponents[0]?.userId || null,
      party.members[1] || null,
      opponents[1]?.userId || null
    ];
    this._spawnTeamMatchOrdered(seatUserIds, party.mode, party.entryFee);
    return { ok: true };
  }

  queueOnline(userId, { mode = 'classic', entryFee = 100 } = {}) {
    if (!['classic', 'quick', 'oneKillWin', 'popular', 'mask'].includes(mode)) return { ok: false, error: 'Unsupported online mode' };
    entryFee = 0;
    if (this._getRoomForUser(userId)?.status === 'playing') return { ok: false, error: 'Finish current match first' };
    const user = this.db.getUser(userId);
    if (!user) return { ok: false, error: 'Unauthorized' };
    this._removeFromQueues(userId);
    const entry = { userId, mode, entryFee, joinedAt: Date.now(), timer: null };
    this.onlineQueue.push(entry);
    this._send(userId, { type: 'QUEUE_STATUS', queue: 'online', count: this.onlineQueue.length, needed: 4 });

    const sameMode = this.onlineQueue.filter(q => q.mode === mode);
    if (sameMode.length >= 4) {
      const picked = sameMode.slice(0, 4);
      picked.forEach(p => this._removeFromQueues(p.userId));
      this._spawnOnlineMatch(picked.map(p => p.userId), mode, entryFee);
      return { ok: true, matched: true };
    }

    entry.timer = setTimeout(() => {
      const stillIn = this.onlineQueue.filter(q => q.mode === mode);
      if (!stillIn.some(q => q.userId === userId)) return;
      const picked = stillIn.slice(0, 4);
      picked.forEach(p => this._removeFromQueues(p.userId));
      this._spawnOnlineMatch(picked.map(p => p.userId), mode, entryFee);
    }, this.queueFillMs);
    entry.timer.unref?.();
    return { ok: true, queued: true };
  }

  cancelQueue(userId) {
    this._removeFromQueues(userId);
    this._send(userId, { type: 'QUEUE_CANCELLED' });
  }

  _removeFromQueues(userId) {
    const strip = (arr) => {
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].userId === userId) {
          if (arr[i].timer) clearTimeout(arr[i].timer);
          arr.splice(i, 1);
        }
      }
    };
    strip(this.onlineQueue);
    strip(this.teamSoloQueue);
  }

  _spawnTeamMatch(userIds, mode, entryFee) {
    // Place humans into seats [0: Blue T1, 2: Green T1, 1: Red T2, 3: Yellow T2]
    const ordered = [userIds[0] || null, userIds[2] || null, userIds[1] || null, userIds[3] || null];
    this._spawnTeamMatchOrdered(ordered, mode, entryFee);
  }

  _spawnTeamMatchOrdered(seatUserIds, _subMode, entryFee) {
    const code = this._genCode(this.rooms);
    const seats = COLORS.map((color, idx) => {
      const uid = seatUserIds[idx];
      if (uid && this.db.getUser(uid)) {
        const u = this.db.getUser(uid);
        this.leaveRoom(uid);
        this.userRoom.set(uid, code);
        return { seatIndex: idx, color, userId: uid, name: u.profile.name, avatar: u.profile.avatar, isBot: false, ready: true };
      }
      const bot = BOT_POOL[idx % BOT_POOL.length];
      return { seatIndex: idx, color, userId: `BOT_${code}_${idx}`, name: bot.name, avatar: bot.avatar, isBot: true, aiLevel: 'hard', ready: true };
    });

    const room = {
      code,
      kind: 'team',
      mode: 'teamUp',
      entryFee,
      hostId: seats.find(s => !s.isBot)?.userId || null,
      status: 'lobby',
      seats,
      engine: null,
      matchId: null,
      turnTimer: null,
      aiTimer: null,
      createdAt: Date.now()
    };
    this.rooms.set(code, room);
    this._launchMatch(room);
  }

  _spawnOnlineMatch(userIds, mode, entryFee) {
    const code = this._genCode(this.rooms);
    const seats = COLORS.map((color, idx) => {
      const uid = userIds[idx];
      if (uid && this.db.getUser(uid)) {
        const u = this.db.getUser(uid);
        this.leaveRoom(uid);
        this.userRoom.set(uid, code);
        return { seatIndex: idx, color, userId: uid, name: u.profile.name, avatar: u.profile.avatar, isBot: false, ready: true };
      }
      const bot = BOT_POOL[idx % BOT_POOL.length];
      return { seatIndex: idx, color, userId: `BOT_${code}_${idx}`, name: bot.name, avatar: bot.avatar, isBot: true, aiLevel: 'medium', ready: true };
    });

    const room = {
      code,
      kind: 'online',
      mode,
      entryFee,
      hostId: seats.find(s => !s.isBot)?.userId || null,
      status: 'lobby',
      seats,
      engine: null,
      matchId: null,
      turnTimer: null,
      aiTimer: null,
      createdAt: Date.now()
    };
    this.rooms.set(code, room);
    this._launchMatch(room);
  }

  /* ===================== AUTHORITATIVE MATCH EXECUTION ===================== */
  _launchMatch(room) {
    // Escrow and virtual-currency wagering require a durable transactional DB.
    // Run local-network preview matches without any transfer of virtual coins.
    room.entryFee = 0;
    const activeSeats = room.seats.filter(Boolean);
    const matchId = crypto.randomUUID();
    room.matchId = matchId;
    room.status = 'playing';

    const prizePool = 0; // No unearned or partly-funded payout; demo matches are free.

    const players = activeSeats.map(s => ({
      userId: s.userId,
      color: s.color,
      name: s.name,
      avatar: s.avatar,
      isHuman: !s.isBot,
      isLocalHuman: false,
      aiLevel: s.aiLevel || 'medium'
    }));

    room.engine = new this.LudoCore.LudoEngine({
      mode: room.mode,
      entryMode: room.kind,
      roomCode: room.code,
      prizeCoins: prizePool,
      players
    });

    this._broadcast(room, {
      type: 'MATCH_STARTED',
      roomCode: room.code,
      kind: room.kind,
      matchId,
      state: room.engine.serialize()
    });

    this._scheduleTurn(room);
    return { ok: true, matchId };
  }

  handleRoll(userId) {
    const room = this._getRoomForUser(userId);
    if (!room || room.status !== 'playing' || !room.engine) return { ok: false, error: 'No active match' };
    const cur = room.engine.getCurrentPlayer();
    if (cur.userId !== userId) return { ok: false, error: 'Not your turn' };
    if (room.engine.phase !== 'roll') return { ok: false, error: 'Cannot roll now' };
    return this._executeServerRoll(room);
  }

  handleMove(userId, tokenId) {
    const room = this._getRoomForUser(userId);
    if (!room || room.status !== 'playing' || !room.engine) return { ok: false, error: 'No active match' };
    const cur = room.engine.getCurrentPlayer();
    if (cur.userId !== userId) return { ok: false, error: 'Not your turn' };
    if (room.engine.phase !== 'move') return { ok: false, error: 'Roll dice first' };
    return this._executeServerMove(room, Number(tokenId));
  }

  handlePowerReroll(userId) {
    const room = this._getRoomForUser(userId);
    if (!room || room.status !== 'playing' || !room.engine) return { ok: false, error: 'No active match' };
    if (room.engine.getCurrentPlayer().userId !== userId) return { ok: false, error: 'Not your turn' };
    const res = room.engine.usePowerReroll();
    if (!res.ok) return res;
    this._broadcast(room, { type: 'GAME_STATE', roomCode: room.code, event: { type: 'reroll', userId }, state: room.engine.serialize() });
    this._scheduleTurn(room);
    return { ok: true };
  }

  handleEmote(userId, emote, teamOnly = false) {
    const room = this._getRoomForUser(userId);
    if (!room || !room.engine) return;
    const sender = room.engine.players.find(p => p.userId === userId);
    if (!sender) return;
    const safeText = String(emote || '').slice(0, 24);
    if (teamOnly && room.engine.mode === 'teamUp') {
      for (const p of room.engine.players) {
        if (p.teamId === sender.teamId && p.userId && !p.userId.startsWith('BOT_')) {
          this._send(p.userId, { type: 'EMOTE', color: sender.color, emote: `🤝 ${safeText}`, teamOnly: true });
        }
      }
    } else {
      this._broadcast(room, { type: 'EMOTE', color: sender.color, emote: safeText, teamOnly: false });
    }
  }

  _executeServerRoll(room) {
    this._clearRoomTimers(room);
    const eng = room.engine;
    // Server CSPRNG dice roll — impossible for any client to rig!
    const fairDice = crypto.randomInt(1, 7);
    const res = eng.rollDice(fairDice);
    if (!res.ok) return res;

    this._broadcast(room, {
      type: 'GAME_ROLL',
      roomCode: room.code,
      result: res,
      state: eng.serialize()
    });

    this._scheduleTurn(room);
    return res;
  }

  _executeServerMove(room, tokenId) {
    this._clearRoomTimers(room);
    const eng = room.engine;
    const res = eng.moveToken(tokenId);
    if (!res.ok) return res;

    this._broadcast(room, {
      type: 'GAME_MOVE',
      roomCode: room.code,
      result: res,
      state: eng.serialize()
    });

    if (res.gameFinished) {
      this._settleMatch(room);
    } else {
      this._scheduleTurn(room);
    }
    return res;
  }

  _scheduleTurn(room) {
    this._clearRoomTimers(room);
    const eng = room.engine;
    if (!eng || eng.phase === 'finished') return;

    const cur = eng.getCurrentPlayer();
    const isBot = !cur.isHuman;

    if (isBot) {
      room.aiTimer = setTimeout(() => {
        if (room.status !== 'playing') return;
        if (eng.phase === 'roll') {
          this._executeServerRoll(room);
        } else if (eng.phase === 'move') {
          const controlled = eng.getControlledPlayer(eng.currentTurn);
          const pick = this.LudoAI.chooseBestToken(eng, controlled.id, eng.diceValue, eng.validTokenIds, cur.aiLevel);
          this._executeServerMove(room, pick);
        }
      }, 650);
      room.aiTimer.unref?.();
      return;
    }

    // Human turn timeout enforcement on server
    room.turnTimer = setTimeout(() => {
      if (room.status !== 'playing') return;
      if (eng.phase === 'roll') {
        this._executeServerRoll(room);
      } else if (eng.phase === 'move' && eng.validTokenIds.length > 0) {
        this._executeServerMove(room, eng.validTokenIds[0]);
      }
    }, this.turnTimeoutMs);
    room.turnTimer.unref?.();
  }

  _settleMatch(room) {
    this._clearRoomTimers(room);
    room.status = 'finished';
    const eng = room.engine;
    const winnerIdx = eng.rankings[0];
    const payouts = {};

    for (const p of eng.players) {
      if (!p.userId || p.userId.startsWith('BOT_')) continue;
      const won = eng.mode === 'teamUp' ? p.teamId === eng.winnerTeam : p.id === winnerIdx;
      const share = won ? (eng.mode === 'teamUp' ? Math.round(eng.prizeCoins / 2) : eng.prizeCoins) : 0;
      const settled = this.db.recordAuthoritativeMatch(p.userId, {
        won,
        captures: p.captures,
        sixes: p.sixes,
        prizeCoins: share,
        matchId: room.matchId
      });
      payouts[p.userId] = { won, prizeCoins: share, leveledUp: settled?.leveledUp || false };
      this.userRoom.delete(p.userId);
    }

    this._broadcast(room, {
      type: 'MATCH_FINISHED',
      roomCode: room.code,
      rankings: eng.rankings,
      winnerTeam: eng.winnerTeam,
      payouts,
      state: eng.serialize()
    });
    room.cleanupTimer = setTimeout(() => this._cleanupRoom(room), 5 * 60 * 1000);
    room.cleanupTimer.unref?.();
  }

  _getRoomForUser(userId) {
    const code = this.userRoom.get(userId);
    return code ? this.rooms.get(code) : null;
  }

  _publicLobby(room) {
    return {
      code: room.code,
      kind: room.kind,
      mode: room.mode,
      entryFee: room.entryFee,
      hostId: room.hostId,
      status: room.status,
      seats: room.seats
    };
  }

  _publicParty(party) {
    return {
      code: party.code,
      mode: party.mode,
      entryFee: party.entryFee,
      hostId: party.hostId,
      members: party.members.map((uid, idx) => {
        const u = this.db.getUser(uid);
        return { userId: uid, color: idx === 0 ? 'blue' : 'green', name: u?.profile.name || 'Player', avatar: u?.profile.avatar || '👑' };
      })
    };
  }

  _broadcastLobby(room) {
    this._broadcast(room, { type: 'ROOM_LOBBY', room: this._publicLobby(room) });
  }

  _broadcastParty(party) {
    const payload = { type: 'TEAM_PARTY_UPDATE', party: this._publicParty(party) };
    for (const uid of party.members) this._send(uid, payload);
  }

  _sendRoomSnapshot(ws, room) {
    if (room.status === 'lobby') {
      ws.sendJSON({ type: 'ROOM_LOBBY', room: this._publicLobby(room) });
    } else if (room.engine) {
      ws.sendJSON({ type: 'MATCH_STARTED', roomCode: room.code, kind: room.kind, matchId: room.matchId, state: room.engine.serialize() });
    }
  }

  _clearRoomTimers(room) {
    if (room.turnTimer) { clearTimeout(room.turnTimer); room.turnTimer = null; }
    if (room.aiTimer) { clearTimeout(room.aiTimer); room.aiTimer = null; }
  }

  _cleanupRoom(room) {
    this._clearRoomTimers(room);
    if (room.cleanupTimer) { clearTimeout(room.cleanupTimer); room.cleanupTimer = null; }
    this.rooms.delete(room.code);
  }

  closeAll() {
    for (const room of this.rooms.values()) { this._clearRoomTimers(room); if (room.cleanupTimer) clearTimeout(room.cleanupTimer); }
    this.onlineQueue.forEach(q => q.timer && clearTimeout(q.timer));
    this.teamSoloQueue.forEach(q => q.timer && clearTimeout(q.timer));
  }
}
