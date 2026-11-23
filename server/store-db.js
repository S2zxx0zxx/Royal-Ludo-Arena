/**
 * Royal Ludo Arena v2.0.0 — Server-Authoritative Economy, Tamper-Evident Ledger & Fraud Prevention
 *
 * Security guarantees:
 * 1. HMAC-SHA256 signed session tokens (client cannot forge user IDs or balances).
 * 2. Append-only SHA-256 hash-chained wallet ledger (`prevHash -> txHash`).
 * 3. Strict idempotency keys on every transaction (prevents double-spend & replay attacks).
 * 4. CSPRNG (`crypto.randomInt`) for Lucky Spin & server-side dice rolls.
 * 5. Server UTC clock enforcement for Daily Rewards & 30-min Free Chest cooldowns.
 * 6. Atomic write-temp-and-rename persistence (`server/data/db.json`).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const AVATARS = ['👑', '🦁', '🐯', '🦅', '🐉', '🦊', '🤖', '💎'];

export const BOARD_THEMES = [
  { id: 'royal-walnut', name: 'Royal Walnut 3D', price: 0, currency: 'coins', desc: 'Carved walnut wood & antique gold 3D studio arena.' },
  { id: 'emerald-palace', name: 'Emerald Palace', price: 1500, currency: 'coins', desc: 'Deep emerald velvet with regal brass accents.' },
  { id: 'midnight-gold', name: 'Midnight Gold', price: 25, currency: 'diamonds', desc: 'Obsidian midnight marble inlaid with 24K gold.' }
];

export const DICE_SKINS = [
  { id: 'classic-ivory', name: 'Classic Ivory', price: 0, currency: 'coins', desc: 'Polished ivory cube with obsidian pips.' },
  { id: 'royal-gold', name: 'Royal Gold', price: 1200, currency: 'coins', desc: 'Burnished gold die with ruby pips.' },
  { id: 'ruby-crimson', name: 'Ruby Crimson', price: 20, currency: 'diamonds', desc: 'Imperial crimson die with gleaming gold pips.' }
];

export const DAILY_REWARDS = [
  { day: 1, label: '500 Coins', coins: 500, diamonds: 0 },
  { day: 2, label: '10 Diamonds', coins: 0, diamonds: 10 },
  { day: 3, label: '1,000 Coins', coins: 1000, diamonds: 0 },
  { day: 4, label: '15 Diamonds', coins: 0, diamonds: 15 },
  { day: 5, label: '2,000 Coins', coins: 2000, diamonds: 0 },
  { day: 6, label: '25 Diamonds', coins: 0, diamonds: 25 },
  { day: 7, label: '5,000 Coins + 50 💎', coins: 5000, diamonds: 50 }
];

export const SPIN_PRIZES = [
  { label: '250 🪙', coins: 250, diamonds: 0, weight: 22 },
  { label: '10 💎', coins: 0, diamonds: 10, weight: 14 },
  { label: '500 🪙', coins: 500, diamonds: 0, weight: 18 },
  { label: '150 🪙', coins: 150, diamonds: 0, weight: 20 },
  { label: '1,500 🪙', coins: 1500, diamonds: 0, weight: 8 },
  { label: '25 💎', coins: 0, diamonds: 25, weight: 6 },
  { label: '750 🪙', coins: 750, diamonds: 0, weight: 9 },
  { label: '2,500 🪙', coins: 2500, diamonds: 0, weight: 3 }
];

function utcDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function xpForNextLevel(level) {
  return 100 + (level - 1) * 75;
}

function defaultMissions() {
  return [
    { id: 'play-3', title: 'Play 3 Games', target: 3, progress: 0, rewardCoins: 500, rewardDiamonds: 0, claimed: false },
    { id: 'win-1', title: 'Win 1 Match', target: 1, progress: 0, rewardCoins: 1000, rewardDiamonds: 10, claimed: false },
    { id: 'capture-3', title: 'Capture 3 Opponent Pawns', target: 3, progress: 0, rewardCoins: 600, rewardDiamonds: 5, claimed: false },
    { id: 'roll-six-5', title: 'Roll Five 6s', target: 5, progress: 0, rewardCoins: 400, rewardDiamonds: 0, claimed: false },
    { id: 'daily-login', title: 'Daily Arena Check-In', target: 1, progress: 1, rewardCoins: 300, rewardDiamonds: 5, claimed: false }
  ];
}

export class AuthoritativeDB {
  constructor(dataDir, secret) {
    this.dataDir = dataDir;
    this.filePath = path.join(dataDir, 'db.json');
    this.secret = secret || process.env.RLA_JWT_SECRET || crypto.randomBytes(32).toString('hex');
    if (process.env.NODE_ENV === 'production' && (!process.env.RLA_JWT_SECRET || Buffer.byteLength(process.env.RLA_JWT_SECRET) < 32)) {
      throw new Error('Production requires RLA_JWT_SECRET with at least 32 bytes');
    }
    fs.mkdirSync(dataDir, { recursive: true });
    this.state = this._load();
  }

  _load() {
    if (fs.existsSync(this.filePath)) {
      // Never silently reset financial state to an empty account on JSON corruption.
      const value = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      if (!value || typeof value !== 'object' || !value.users || !Array.isArray(value.ledger) || !value.processedPayments) {
        throw new Error('Persistent state has invalid structure; manual recovery required');
      }
      value.settledMatches ||= {};
      value.rateLimits = {}; // ephemeral rate limits, not persisted across restart
      return value;
    }
    return {
      users: {},
      ledger: [],
      processedPayments: {},
      settledMatches: {},
      rateLimits: {}
    };
  }

  _save() {
    const tmp = `${this.filePath}.tmp.${process.pid}`;
    const { rateLimits: _rateLimits, ...persisted } = this.state;
    fs.writeFileSync(tmp, JSON.stringify(persisted), 'utf8');
    fs.renameSync(tmp, this.filePath);
  }

  /* ---------- Signed Session Tokens (HMAC-SHA256) ---------- */
  signToken(userId) {
    const now = Date.now();
    const payload = Buffer.from(JSON.stringify({ uid: userId, iat: now, exp: now + 7 * 86400000 })).toString('base64url');
    const sig = crypto.createHmac('sha256', this.secret).update(payload).digest('base64url');
    return `${payload}.${sig}`;
  }

  verifyToken(token) {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null;
    const parts = token.split('.');
    if (parts.length !== 2 || token.length > 4096) return null;
    const [payload, sig] = parts;
    const expected = crypto.createHmac('sha256', this.secret).update(payload).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    try {
      const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      if (!data || typeof data.uid !== 'string' || !Number.isSafeInteger(data.iat) ||
          !Number.isSafeInteger(data.exp) || data.exp <= Date.now() || data.iat > Date.now() + 60000 ||
          data.exp - data.iat > 7 * 86400000) return null;
      return this.state.users[data.uid] ? data.uid : null;
    } catch {
      return null;
    }
  }

  /* ---------- Rate Limiter (Anti-Abuse) ---------- */
  checkRateLimit(key, maxRequests = 60, windowMs = 60000) {
    const now = Date.now();
    const bucket = this.state.rateLimits[key] || { count: 0, resetAt: now + windowMs };
    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }
    bucket.count += 1;
    this.state.rateLimits[key] = bucket;
    return bucket.count <= maxRequests;
  }

  /* ---------- Account Creation & Retrieval ---------- */
  createGuestAccount(name = 'RoyalPlayer') {
    let userId;
    do { userId = 'RL' + crypto.randomInt(100000000, 1000000000); }
    while (this.state.users[userId]);
    const cleanName = String(name || 'RoyalPlayer').trim().slice(0, 22) || 'RoyalPlayer';
    const user = {
      id: userId,
      profile: { id: userId, name: cleanName, bio: 'Play • Win • Repeat!', avatar: '👑' },
      currency: { coins: 2250, diamonds: 50 },
      progression: { level: 1, xp: 40 },
      stats: { gamesPlayed: 0, wins: 0, captures: 0, sixesRolled: 0, tournamentsWon: 0, winStreak: 0, bestStreak: 0 },
      dailyReward: { streakDay: 0, lastClaimDate: '' },
      luckySpin: { lastFreeSpinDate: '', totalSpins: 0 },
      freeChest: { lastClaimTs: 0 },
      missionsDate: utcDateKey(),
      missions: defaultMissions(),
      inbox: [
        { id: 'welcome-gift', title: 'Welcome to Royal Ludo Arena v2!', body: 'Server-verified welcome bonus ready to claim.', coins: 500, diamonds: 10, claimed: false, date: 'Today' }
      ],
      inventory: {
        ownedBoards: ['royal-walnut'],
        activeBoard: 'royal-walnut',
        ownedDice: ['classic-ivory'],
        activeDice: 'classic-ivory'
      },
      createdAt: Date.now()
    };
    this.state.users[userId] = user;
    this._appendLedger(userId, 2250, 50, 'account_genesis', `genesis:${userId}`);
    this._save();
    return { user, token: this.signToken(userId) };
  }

  getUser(userId) {
    const u = this.state.users[userId];
    if (!u) return null;
    if (u.missionsDate !== utcDateKey()) {
      u.missionsDate = utcDateKey();
      u.missions = defaultMissions();
      this._save();
    }
    return u;
  }

  /* ---------- Tamper-Evident Hash-Chained Wallet Ledger ---------- */
  _appendLedger(userId, deltaCoins, deltaDiamonds, reason, idempotencyKey) {
    if (idempotencyKey && this.state.ledger.some(tx => tx.idempotencyKey === idempotencyKey)) {
      return { duplicate: true };
    }
    const prevHash = this.state.ledger.length > 0 ? this.state.ledger[this.state.ledger.length - 1].txHash : 'GENESIS';
    const u = this.state.users[userId];
    const tx = {
      txId: crypto.randomUUID(),
      userId,
      deltaCoins,
      deltaDiamonds,
      balanceCoins: u.currency.coins,
      balanceDiamonds: u.currency.diamonds,
      reason,
      idempotencyKey: idempotencyKey || crypto.randomUUID(),
      ts: Date.now(),
      prevHash
    };
    tx.txHash = crypto.createHash('sha256').update(JSON.stringify(tx)).digest('hex');
    this.state.ledger.push(tx);
    return { duplicate: false, tx };
  }

  verifyLedgerIntegrity() {
    let prev = 'GENESIS';
    for (const tx of this.state.ledger) {
      if (tx.prevHash !== prev) return { valid: false, brokenAt: tx.txId };
      const { txHash, ...rest } = tx;
      const computed = crypto.createHash('sha256').update(JSON.stringify(rest)).digest('hex');
      if (computed !== txHash) return { valid: false, brokenAt: tx.txId };
      prev = txHash;
    }
    return { valid: true, count: this.state.ledger.length };
  }

  creditWallet(userId, coins, diamonds, reason, idempotencyKey) {
    if (![coins, diamonds].every(x => Number.isSafeInteger(x) && x >= 0 && x <= 1000000000)) {
      return { ok: false, error: 'Invalid credit amount' };
    }
    const u = this.getUser(userId);
    if (!u) return { ok: false, error: 'User not found' };
    if (coins < 0 || diamonds < 0) return { ok: false, error: 'Invalid negative credit' };
    if (idempotencyKey && this.state.ledger.some(tx => tx.idempotencyKey === idempotencyKey)) {
      return { ok: false, error: 'Duplicate transaction', duplicate: true };
    }
    u.currency.coins += Math.round(coins);
    u.currency.diamonds += Math.round(diamonds);
    const entry = this._appendLedger(userId, Math.round(coins), Math.round(diamonds), reason, idempotencyKey);
    this._save();
    return { ok: true, currency: u.currency, tx: entry.tx };
  }

  debitWallet(userId, coins, diamonds, reason, idempotencyKey) {
    if (![coins, diamonds].every(x => Number.isSafeInteger(x) && x >= 0 && x <= 1000000000)) {
      return { ok: false, error: 'Invalid debit amount' };
    }
    const u = this.getUser(userId);
    if (!u) return { ok: false, error: 'User not found' };
    if (coins < 0 || diamonds < 0) return { ok: false, error: 'Invalid debit' };
    if (u.currency.coins < coins || u.currency.diamonds < diamonds) {
      return { ok: false, error: 'Insufficient balance' };
    }
    if (idempotencyKey && this.state.ledger.some(tx => tx.idempotencyKey === idempotencyKey)) {
      return { ok: false, error: 'Duplicate transaction', duplicate: true };
    }
    u.currency.coins -= Math.round(coins);
    u.currency.diamonds -= Math.round(diamonds);
    const entry = this._appendLedger(userId, -Math.round(coins), -Math.round(diamonds), reason, idempotencyKey);
    this._save();
    return { ok: true, currency: u.currency, tx: entry.tx };
  }

  /* ---------- Authoritative Progression & Reward Actions ---------- */
  addXp(userId, amount) {
    const u = this.getUser(userId);
    if (!u) return false;
    let leveledUp = false;
    u.progression.xp += amount;
    while (u.progression.xp >= xpForNextLevel(u.progression.level)) {
      u.progression.xp -= xpForNextLevel(u.progression.level);
      u.progression.level += 1;
      this.creditWallet(userId, 250 * u.progression.level, 5, `level_up_${u.progression.level}`, `lvl:${userId}:${u.progression.level}`);
      leveledUp = true;
    }
    this._save();
    return leveledUp;
  }

  updateProfile(userId, { name, bio, avatar }) {
    const u = this.getUser(userId);
    if (!u) return { ok: false, error: 'User not found' };
    if (typeof name === 'string' && name.trim()) u.profile.name = name.trim().slice(0, 22);
    if (typeof bio === 'string') u.profile.bio = bio.trim().slice(0, 70);
    if (typeof avatar === 'string' && AVATARS.includes(avatar)) u.profile.avatar = avatar;
    this._save();
    return { ok: true, profile: u.profile };
  }

  claimDailyReward(userId) {
    const u = this.getUser(userId);
    if (!u) return { ok: false, error: 'User not found' };
    const today = utcDateKey();
    if (u.dailyReward.lastClaimDate === today) return { ok: false, error: 'Already claimed today' };
    const nextIdx = u.dailyReward.streakDay % DAILY_REWARDS.length;
    const reward = DAILY_REWARDS[nextIdx];
    u.dailyReward.streakDay = nextIdx + 1;
    u.dailyReward.lastClaimDate = today;
    this.creditWallet(userId, reward.coins, reward.diamonds, `daily_reward_day_${reward.day}`, `daily:${userId}:${today}`);
    this.addXp(userId, 25);
    return { ok: true, reward, user: u };
  }

  spinLuckyWheel(userId) {
    const u = this.getUser(userId);
    if (!u) return { ok: false, error: 'User not found' };
    const today = utcDateKey();
    const isFree = u.luckySpin.lastFreeSpinDate !== today;
    if (!isFree) {
      const deb = this.debitWallet(userId, 0, 10, 'lucky_spin_fee', `spin_fee:${userId}:${Date.now()}:${crypto.randomInt(1000, 9999)}`);
      if (!deb.ok) return { ok: false, error: 'Not enough Diamonds (10 required)' };
    } else {
      u.luckySpin.lastFreeSpinDate = today;
    }
    // Cryptographically fair weighted pick
    const totalWeight = SPIN_PRIZES.reduce((s, p) => s + p.weight, 0);
    let roll = crypto.randomInt(0, totalWeight);
    let winIndex = 0;
    for (let i = 0; i < SPIN_PRIZES.length; i++) {
      roll -= SPIN_PRIZES[i].weight;
      if (roll < 0) { winIndex = i; break; }
    }
    const prize = SPIN_PRIZES[winIndex];
    u.luckySpin.totalSpins += 1;
    this.creditWallet(userId, prize.coins, prize.diamonds, `lucky_spin_${prize.label}`, `spin_win:${userId}:${u.luckySpin.totalSpins}`);
    return { ok: true, winIndex, prize, usedFree: isFree, user: u };
  }

  claimFreeChest(userId) {
    const u = this.getUser(userId);
    if (!u) return { ok: false, error: 'User not found' };
    const cooldownMs = 30 * 60 * 1000;
    const rem = Math.max(0, cooldownMs - (Date.now() - (u.freeChest.lastClaimTs || 0)));
    if (rem > 0) return { ok: false, error: 'Chest cooling down', remainingMs: rem };
    u.freeChest.lastClaimTs = Date.now();
    this.creditWallet(userId, 350, 0, 'free_chest', `chest:${userId}:${u.freeChest.lastClaimTs}`);
    return { ok: true, coins: 350, user: u };
  }

  claimMission(userId, missionId) {
    const u = this.getUser(userId);
    if (!u) return { ok: false, error: 'User not found' };
    const m = u.missions.find(x => x.id === missionId);
    if (!m || m.claimed || m.progress < m.target) return { ok: false, error: 'Mission not ready' };
    m.claimed = true;
    this.creditWallet(userId, m.rewardCoins, m.rewardDiamonds, `mission_${m.id}`, `mission:${userId}:${u.missionsDate}:${m.id}`);
    this.addXp(userId, 30);
    return { ok: true, mission: m, user: u };
  }

  buyOrEquipCosmetic(userId, kind, itemId) {
    const u = this.getUser(userId);
    if (!u) return { ok: false, error: 'User not found' };
    const catalog = kind === 'board' ? BOARD_THEMES : DICE_SKINS;
    const ownedKey = kind === 'board' ? 'ownedBoards' : 'ownedDice';
    const activeKey = kind === 'board' ? 'activeBoard' : 'activeDice';
    const item = catalog.find(i => i.id === itemId);
    if (!item) return { ok: false, error: 'Unknown item' };

    if (u.inventory[ownedKey].includes(itemId)) {
      u.inventory[activeKey] = itemId;
      this._save();
      return { ok: true, equipped: true, user: u };
    }
    const deb = item.currency === 'diamonds'
      ? this.debitWallet(userId, 0, item.price, `buy_${kind}_${itemId}`, `buy:${userId}:${kind}:${itemId}`)
      : this.debitWallet(userId, item.price, 0, `buy_${kind}_${itemId}`, `buy:${userId}:${kind}:${itemId}`);
    if (!deb.ok) return { ok: false, error: deb.error };
    u.inventory[ownedKey].push(itemId);
    u.inventory[activeKey] = itemId;
    this._save();
    return { ok: true, bought: true, user: u };
  }

  recordAuthoritativeMatch(userId, { won, captures = 0, sixes = 0, prizeCoins = 0, matchId }) {
    const u = this.getUser(userId);
    if (!u || typeof matchId !== 'string' || !matchId) return null;
    const settlementKey = `${matchId}:${userId}`;
    if (this.state.settledMatches[settlementKey]) return null;
    this.state.settledMatches[settlementKey] = Date.now();
    u.stats.gamesPlayed += 1;
    u.stats.captures += captures;
    u.stats.sixesRolled += sixes;
    if (won) {
      u.stats.wins += 1;
      u.stats.winStreak += 1;
      u.stats.bestStreak = Math.max(u.stats.bestStreak, u.stats.winStreak);
      if (prizeCoins > 0) {
        this.creditWallet(userId, prizeCoins, 0, `match_prize_${matchId}`, `prize:${matchId}:${userId}`);
      }
    } else {
      u.stats.winStreak = 0;
    }
    const inc = (id, n) => {
      const m = u.missions.find(x => x.id === id);
      if (m && !m.claimed) m.progress = Math.min(m.target, m.progress + n);
    };
    inc('play-3', 1);
    if (won) inc('win-1', 1);
    if (captures > 0) inc('capture-3', captures);
    if (sixes > 0) inc('roll-six-5', sixes);
    const leveledUp = this.addXp(userId, won ? 60 : 20);
    this._save();
    return { leveledUp, user: u };
  }

  getLeaderboard() {
    const real = Object.values(this.state.users).map(u => ({
      id: u.id,
      name: u.profile.name,
      avatar: u.profile.avatar,
      wins: u.stats.wins,
      coins: u.currency.coins,
      level: u.progression.level
    }));
    return real.sort((a, b) => b.wins - a.wins || b.coins - a.coins).slice(0, 50);
  }
}
