/**
 * Royal Ludo Arena v2.0.0 — Authoritative REST & WebSocket Realtime Client
 * Connects automatically to the Node.js server when served over HTTP(S).
 * Gracefully detects offline/static-only preview mode without crashing.
 */
(function (global) {
  'use strict';

  const TOKEN_KEY = 'rla.auth.token.v2';
  let ws = null;
  let connected = false;
  let serverAvailable = false;
  let token = '';
  let userId = '';
  let reconnectTimer = null;
  const listeners = new Set();

  function emit(msg) {
    listeners.forEach(fn => {
      try { fn(msg); } catch {}
    });
  }

  function getStoredToken() {
    try { return global.localStorage?.getItem(TOKEN_KEY) || ''; } catch { return ''; }
  }

  function setStoredToken(t) {
    token = t || '';
    try {
      if (t) global.localStorage?.setItem(TOKEN_KEY, t);
      else global.localStorage?.removeItem(TOKEN_KEY);
    } catch {}
  }

  async function api(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(endpoint, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({ ok: false, error: 'Invalid response' }));
    return { status: res.status, ...data };
  }

  function connectWS() {
    if (!serverAvailable || !token || typeof WebSocket === 'undefined') return;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${location.host}/ws`;
    try {
      ws = new WebSocket(wsUrl);
    } catch {
      return;
    }

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ type: 'AUTH', token }));
    });

    ws.addEventListener('message', (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.type === 'AUTH_OK') {
        connected = true;
        userId = msg.user.id;
        global.RLAState?.hydrateFromServer(msg.user);
      }
      emit(msg);
    });

    ws.addEventListener('close', () => {
      connected = false;
      emit({ type: 'WS_DISCONNECTED' });
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connectWS, 3000);
    });
  }

  function sendWS(payload) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify(payload));
    return true;
  }

  async function init() {
    if (!location.protocol.startsWith('http')) return false;
    try {
      const health = await api('/api/health', 'GET');
      if (!health.ok) return false;
      serverAvailable = true;
    } catch {
      serverAvailable = false;
      return false;
    }

    token = getStoredToken();
    if (token) {
      const me = await api('/api/me', 'GET');
      if (me.ok && me.user) {
        userId = me.user.id;
        global.RLAState?.hydrateFromServer(me.user);
        connectWS();
        return true;
      }
    }

    // Create fresh server-authoritative guest account
    const localName = global.RLAState?.get().profile.name || 'RoyalPlayer';
    const guest = await api('/api/auth/guest', 'POST', { name: localName });
    if (guest.ok && guest.token) {
      setStoredToken(guest.token);
      userId = guest.user.id;
      global.RLAState?.hydrateFromServer(guest.user);
      connectWS();
      return true;
    }
    return false;
  }

  const RLAClient = {
    init,
    isOnline: () => serverAvailable && connected,
    isServerAvailable: () => serverAvailable,
    getUserId: () => userId,
    onMessage(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    // Authoritative Economy REST APIs
    async refreshMe() {
      if (!serverAvailable) return null;
      const res = await api('/api/me', 'GET');
      if (res.ok && res.user) global.RLAState?.hydrateFromServer(res.user);
      return res;
    },
    async updateProfile(patch) {
      const res = await api('/api/profile/update', 'POST', patch);
      if (res.ok) await this.refreshMe();
      return res;
    },
    async claimDailyReward() {
      const res = await api('/api/economy/daily-reward', 'POST', {});
      if (res.ok && res.user) global.RLAState?.hydrateFromServer(res.user);
      return res;
    },
    async spinLuckyWheel() {
      const res = await api('/api/economy/lucky-spin', 'POST', {});
      if (res.ok && res.user) global.RLAState?.hydrateFromServer(res.user);
      return res;
    },
    async claimFreeChest() {
      const res = await api('/api/economy/free-chest', 'POST', {});
      if (res.ok && res.user) global.RLAState?.hydrateFromServer(res.user);
      return res;
    },
    async claimMission(missionId) {
      const res = await api('/api/economy/claim-mission', 'POST', { missionId });
      if (res.ok && res.user) global.RLAState?.hydrateFromServer(res.user);
      return res;
    },
    async buyOrEquipCosmetic(kind, itemId) {
      const res = await api('/api/inventory/cosmetic', 'POST', { kind, itemId });
      if (res.ok && res.user) global.RLAState?.hydrateFromServer(res.user);
      return res;
    },
    async fetchLeaderboard() {
      return api('/api/leaderboard', 'GET');
    },
    async verifyRazorpay(payload) {
      const res = await api('/api/payments/razorpay/verify', 'POST', payload);
      if (res.ok) await this.refreshMe();
      return res;
    },
    async verifyGooglePlay(payload) {
      const res = await api('/api/payments/google-play/verify', 'POST', payload);
      if (res.ok) await this.refreshMe();
      return res;
    },

    // Live WebSocket Room, Team 2v2 & Match Actions
    createRoom: (mode = 'classic', entryFee = 0) => sendWS({ type: 'CREATE_ROOM', mode, entryFee }),
    joinRoom: (code) => sendWS({ type: 'JOIN_ROOM', code }),
    toggleReady: () => sendWS({ type: 'TOGGLE_READY' }),
    addBot: (difficulty = 'medium') => sendWS({ type: 'ADD_BOT', difficulty }),
    removeSeat: (seatIndex) => sendWS({ type: 'REMOVE_SEAT', seatIndex }),
    startRoom: () => sendWS({ type: 'START_ROOM' }),
    leaveRoom: () => sendWS({ type: 'LEAVE_ROOM' }),
    queueOnline: (mode = 'classic', entryFee = 100) => sendWS({ type: 'QUEUE_ONLINE', mode, entryFee }),
    queueTeamSolo: (mode = 'classic', entryFee = 100) => sendWS({ type: 'QUEUE_TEAM_SOLO', mode, entryFee }),
    createTeamParty: (mode = 'classic', entryFee = 100) => sendWS({ type: 'CREATE_TEAM_PARTY', mode, entryFee }),
    joinTeamParty: (code) => sendWS({ type: 'JOIN_TEAM_PARTY', code }),
    startTeamParty: (code) => sendWS({ type: 'START_TEAM_PARTY', code }),
    cancelQueue: () => sendWS({ type: 'CANCEL_QUEUE' }),
    rollDice: () => sendWS({ type: 'ROLL_DICE' }),
    moveToken: (tokenId) => sendWS({ type: 'MOVE_TOKEN', tokenId }),
    powerReroll: () => sendWS({ type: 'POWER_REROLL' }),
    sendEmote: (emote, teamOnly = false) => sendWS({ type: 'EMOTE', emote, teamOnly })
  };

  global.RLAClient = RLAClient;
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => { RLAClient.init().catch(() => {}); });
  }
})(typeof window !== 'undefined' ? window : globalThis);
