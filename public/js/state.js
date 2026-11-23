/**
 * Royal Ludo Arena v2.0.0 — Player State Store
 * Hydrates from authoritative Node.js server when connected; falls back to local practice state when offline.
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'rla.player.state.v2';
  const SAVE_MATCH_KEY = 'rla.active.match.v2';

  const AVATARS = ['👑', '🦁', '🐯', '🦅', '🐉', '🦊', '🤖', '💎'];

  const BOARD_THEMES = [
    { id: 'royal-walnut', name: 'Royal Walnut 3D', price: 0, currency: 'coins', desc: 'Carved walnut wood & antique gold 3D studio arena.' },
    { id: 'emerald-palace', name: 'Emerald Palace', price: 1500, currency: 'coins', desc: 'Deep emerald velvet with regal brass accents.' },
    { id: 'midnight-gold', name: 'Midnight Gold', price: 25, currency: 'diamonds', desc: 'Obsidian midnight marble inlaid with 24K gold.' }
  ];

  const DICE_SKINS = [
    { id: 'classic-ivory', name: 'Classic Ivory', price: 0, currency: 'coins', desc: 'Polished ivory cube with obsidian pips.' },
    { id: 'royal-gold', name: 'Royal Gold', price: 1200, currency: 'coins', desc: 'Burnished gold die with ruby pips.' },
    { id: 'ruby-crimson', name: 'Ruby Crimson', price: 20, currency: 'diamonds', desc: 'Imperial crimson die with gleaming gold pips.' }
  ];

  const DAILY_REWARDS = [
    { day: 1, label: '500 Coins', coins: 500, diamonds: 0 },
    { day: 2, label: '10 Diamonds', coins: 0, diamonds: 10 },
    { day: 3, label: '1,000 Coins', coins: 1000, diamonds: 0 },
    { day: 4, label: '15 Diamonds', coins: 0, diamonds: 15 },
    { day: 5, label: '2,000 Coins', coins: 2000, diamonds: 0 },
    { day: 6, label: '25 Diamonds', coins: 0, diamonds: 25 },
    { day: 7, label: '5,000 Coins + 50 💎', coins: 5000, diamonds: 50 }
  ];

  const DEFAULT_MISSIONS = [
    { id: 'play-3', title: 'Play 3 Games', target: 3, progress: 0, rewardCoins: 500, rewardDiamonds: 0, claimed: false },
    { id: 'win-1', title: 'Win 1 Match', target: 1, progress: 0, rewardCoins: 1000, rewardDiamonds: 10, claimed: false },
    { id: 'capture-3', title: 'Capture 3 Opponent Pawns', target: 3, progress: 0, rewardCoins: 600, rewardDiamonds: 5, claimed: false },
    { id: 'roll-six-5', title: 'Roll Five 6s', target: 5, progress: 0, rewardCoins: 400, rewardDiamonds: 0, claimed: false },
    { id: 'daily-login', title: 'Daily Arena Check-In', target: 1, progress: 1, rewardCoins: 300, rewardDiamonds: 5, claimed: false }
  ];

  const DEFAULT_INBOX = [
    { id: 'welcome-gift', title: 'Welcome to Royal Ludo Arena!', body: 'Explore the game modes and practice rewards. Live rewards require a connected game server.', coins: 500, diamonds: 10, claimed: false, date: 'Today' }
  ];

  const SEED_LEADERBOARD = [
    { name: 'Vikram_King', avatar: '🦁', wins: 48, coins: 128500, level: 18 },
    { name: 'AanyaRoyal', avatar: '👑', wins: 41, coins: 96400, level: 15 },
    { name: 'RohanBlitz', avatar: '🐉', wins: 34, coins: 74200, level: 13 },
    { name: 'PriyaDice', avatar: '💎', wins: 29, coins: 58900, level: 11 }
  ];

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function createDefaultState() {
    return {
      serverSynced: false,
      profile: { id: 'RL782346', name: 'Satzzxzxx', bio: 'Play • Win • Repeat!', avatar: '👑' },
      currency: { coins: 2250, diamonds: 50 },
      progression: { level: 1, xp: 40 },
      stats: { gamesPlayed: 0, wins: 0, captures: 0, sixesRolled: 0, tournamentsWon: 0, winStreak: 0, bestStreak: 0 },
      dailyReward: { streakDay: 0, lastClaimDate: '' },
      luckySpin: { lastFreeSpinDate: '', totalSpins: 0 },
      freeChest: { lastClaimTs: 0 },
      missionsDate: todayKey(),
      missions: JSON.parse(JSON.stringify(DEFAULT_MISSIONS)),
      inbox: JSON.parse(JSON.stringify(DEFAULT_INBOX)),
      inventory: {
        ownedBoards: ['royal-walnut'],
        activeBoard: 'royal-walnut',
        ownedDice: ['classic-ivory'],
        activeDice: 'classic-ivory'
      },
      settings: { sfx: true, haptics: true, fastSpeed: false, autoSingleMove: true }
    };
  }

  let data = load();
  const listeners = new Set();

  function load() {
    const base = createDefaultState();
    try {
      const raw = global.localStorage && global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return base;
      const parsed = JSON.parse(raw);
      return {
        ...base,
        ...parsed,
        profile: { ...base.profile, ...(parsed.profile || {}) },
        currency: { ...base.currency, ...(parsed.currency || {}) },
        progression: { ...base.progression, ...(parsed.progression || {}) },
        stats: { ...base.stats, ...(parsed.stats || {}) },
        dailyReward: { ...base.dailyReward, ...(parsed.dailyReward || {}) },
        luckySpin: { ...base.luckySpin, ...(parsed.luckySpin || {}) },
        freeChest: { ...base.freeChest, ...(parsed.freeChest || {}) },
        inventory: { ...base.inventory, ...(parsed.inventory || {}) },
        settings: { ...base.settings, ...(parsed.settings || {}) }
      };
    } catch {
      return base;
    }
  }

  function save() {
    try {
      if (global.localStorage) {
        global.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch {}
    listeners.forEach(fn => { try { fn(data); } catch {} });
  }

  function xpForNextLevel(level) {
    return 100 + (level - 1) * 75;
  }

  const RLAState = {
    AVATARS,
    BOARD_THEMES,
    DICE_SKINS,
    DAILY_REWARDS,

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    get() { return data; },
    getSettings() { return data.settings; },

    hydrateFromServer(serverUser) {
      if (!serverUser) return;
      data.serverSynced = true;
      data.profile = { ...data.profile, ...serverUser.profile };
      data.currency = { ...serverUser.currency };
      data.progression = { ...serverUser.progression };
      data.stats = { ...serverUser.stats };
      data.dailyReward = { ...serverUser.dailyReward };
      data.luckySpin = { ...serverUser.luckySpin };
      data.freeChest = { ...serverUser.freeChest };
      data.missions = serverUser.missions || data.missions;
      data.inbox = serverUser.inbox || data.inbox;
      data.inventory = { ...data.inventory, ...serverUser.inventory };
      save();
    },

    updateSettings(patch) {
      data.settings = { ...data.settings, ...patch };
      save();
    },

    updateProfile(patch) {
      if (typeof patch.name === 'string' && patch.name.trim()) data.profile.name = patch.name.trim().slice(0, 22);
      if (typeof patch.bio === 'string') data.profile.bio = patch.bio.trim().slice(0, 70);
      if (typeof patch.avatar === 'string' && AVATARS.includes(patch.avatar)) data.profile.avatar = patch.avatar;
      save();
    },

    addCurrency(coins = 0, diamonds = 0) {
      data.currency.coins = Math.max(0, Math.round(data.currency.coins + coins));
      data.currency.diamonds = Math.max(0, Math.round(data.currency.diamonds + diamonds));
      save();
    },

    spendCurrency(coins = 0, diamonds = 0) {
      if (data.currency.coins < coins || data.currency.diamonds < diamonds) return false;
      data.currency.coins -= coins;
      data.currency.diamonds -= diamonds;
      save();
      return true;
    },

    addXp(amount) {
      let leveledUp = false;
      data.progression.xp += amount;
      while (data.progression.xp >= xpForNextLevel(data.progression.level)) {
        data.progression.xp -= xpForNextLevel(data.progression.level);
        data.progression.level += 1;
        data.currency.coins += 250 * data.progression.level;
        data.currency.diamonds += 5;
        leveledUp = true;
      }
      save();
      return leveledUp;
    },

    xpProgress() {
      const req = xpForNextLevel(data.progression.level);
      return { level: data.progression.level, xp: data.progression.xp, required: req, pct: Math.min(100, Math.round((data.progression.xp / req) * 100)) };
    },

    incrementMission(id, amount = 1) {
      const m = data.missions.find(x => x.id === id);
      if (!m || m.claimed) return;
      m.progress = Math.min(m.target, m.progress + amount);
      save();
    },

    claimMission(id) {
      const m = data.missions.find(x => x.id === id);
      if (!m || m.claimed || m.progress < m.target) return null;
      m.claimed = true;
      data.currency.coins += m.rewardCoins;
      data.currency.diamonds += m.rewardDiamonds;
      this.addXp(30);
      save();
      return { coins: m.rewardCoins, diamonds: m.rewardDiamonds };
    },

    claimAllMissions() {
      let totalCoins = 0, totalDiamonds = 0, count = 0;
      for (const m of data.missions) {
        if (!m.claimed && m.progress >= m.target) {
          m.claimed = true;
          totalCoins += m.rewardCoins;
          totalDiamonds += m.rewardDiamonds;
          count++;
        }
      }
      if (count > 0) {
        data.currency.coins += totalCoins;
        data.currency.diamonds += totalDiamonds;
        this.addXp(count * 25);
        save();
      }
      return { count, coins: totalCoins, diamonds: totalDiamonds };
    },

    canClaimDailyReward() { return data.dailyReward.lastClaimDate !== todayKey(); },

    claimDailyReward() {
      if (!this.canClaimDailyReward()) return null;
      const nextIndex = data.dailyReward.streakDay % DAILY_REWARDS.length;
      const reward = DAILY_REWARDS[nextIndex];
      data.dailyReward.streakDay = nextIndex + 1;
      data.dailyReward.lastClaimDate = todayKey();
      data.currency.coins += reward.coins;
      data.currency.diamonds += reward.diamonds;
      this.addXp(25);
      save();
      return reward;
    },

    canFreeSpin() { return data.luckySpin.lastFreeSpinDate !== todayKey(); },

    recordSpin(usedFree, coinsWon, diamondsWon) {
      if (usedFree) data.luckySpin.lastFreeSpinDate = todayKey();
      data.luckySpin.totalSpins += 1;
      data.currency.coins += coinsWon;
      data.currency.diamonds += diamondsWon;
      save();
    },

    freeChestCooldownMs() {
      return Math.max(0, 30 * 60 * 1000 - (Date.now() - (data.freeChest.lastClaimTs || 0)));
    },

    claimFreeChest() {
      if (this.freeChestCooldownMs() > 0) return null;
      data.freeChest.lastClaimTs = Date.now();
      data.currency.coins += 350;
      save();
      return { coins: 350 };
    },

    claimInbox(id) {
      const msg = data.inbox.find(m => m.id === id);
      if (!msg || msg.claimed) return null;
      msg.claimed = true;
      data.currency.coins += msg.coins || 0;
      data.currency.diamonds += msg.diamonds || 0;
      save();
      return { coins: msg.coins || 0, diamonds: msg.diamonds || 0 };
    },

    buyOrEquipBoard(id) {
      const item = BOARD_THEMES.find(b => b.id === id);
      if (!item) return { ok: false, reason: 'Not found' };
      if (data.inventory.ownedBoards.includes(id)) {
        data.inventory.activeBoard = id; save(); return { ok: true, equipped: true };
      }
      const ok = item.currency === 'diamonds' ? this.spendCurrency(0, item.price) : this.spendCurrency(item.price, 0);
      if (!ok) return { ok: false, reason: `Not enough ${item.currency}` };
      data.inventory.ownedBoards.push(id);
      data.inventory.activeBoard = id;
      save();
      return { ok: true, bought: true };
    },

    buyOrEquipDice(id) {
      const item = DICE_SKINS.find(d => d.id === id);
      if (!item) return { ok: false, reason: 'Not found' };
      if (data.inventory.ownedDice.includes(id)) {
        data.inventory.activeDice = id; save(); return { ok: true, equipped: true };
      }
      const ok = item.currency === 'diamonds' ? this.spendCurrency(0, item.price) : this.spendCurrency(item.price, 0);
      if (!ok) return { ok: false, reason: `Not enough ${item.currency}` };
      data.inventory.ownedDice.push(id);
      data.inventory.activeDice = id;
      save();
      return { ok: true, bought: true };
    },

    recordMatchResult({ won, captures = 0, sixes = 0, prizeCoins = 0, tournament = false }) {
      data.stats.gamesPlayed += 1;
      data.stats.captures += captures;
      data.stats.sixesRolled += sixes;
      if (won) {
        data.stats.wins += 1;
        data.stats.winStreak += 1;
        data.stats.bestStreak = Math.max(data.stats.bestStreak, data.stats.winStreak);
        if (tournament) data.stats.tournamentsWon += 1;
        data.currency.coins += prizeCoins;
      } else {
        data.stats.winStreak = 0;
      }
      this.incrementMission('play-3', 1);
      if (won) this.incrementMission('win-1', 1);
      if (captures > 0) this.incrementMission('capture-3', captures);
      if (sixes > 0) this.incrementMission('roll-six-5', sixes);
      const leveledUp = this.addXp(won ? 60 : 20);
      save();
      return { leveledUp };
    },

    getLeaderboard() {
      const me = { name: data.profile.name, avatar: data.profile.avatar, wins: data.stats.wins, coins: data.currency.coins, level: data.progression.level, isSelf: true };
      return [...SEED_LEADERBOARD, me].sort((a, b) => b.wins - a.wins || b.coins - a.coins);
    },

    saveActiveMatch(snapshot) {
      try {
        if (global.localStorage) {
          if (snapshot) global.localStorage.setItem(SAVE_MATCH_KEY, JSON.stringify(snapshot));
          else global.localStorage.removeItem(SAVE_MATCH_KEY);
        }
      } catch {}
    },

    loadActiveMatch() {
      try {
        const raw = global.localStorage && global.localStorage.getItem(SAVE_MATCH_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    },

    resetAll() {
      data = createDefaultState();
      this.saveActiveMatch(null);
      save();
    }
  };

  global.RLAState = RLAState;
})(typeof window !== 'undefined' ? window : globalThis);
