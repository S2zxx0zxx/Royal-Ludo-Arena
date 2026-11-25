const CACHE = 'royal-ludo-arena-v3.1.2-floating-footer';
const BASE = [
  './',
  './index.html',
  './styles.css',
  './extended.css',
  './game.css',
  './hub-3d.css',
  './js/sound.js',
  './js/state.js',
  './js/realtime-client.js',
  './js/ludo-engine.js',
  './js/ludo-ai.js',
  './js/game-view.js',
  './js/modes-3d.js',
  './js/app.js',
  './js/splash-loader.js',
  './js/hub-3d.js',
  './js/expansion.js',
  './assets/icons/icon.svg',
  './assets/game/board-royal-walnut.webp',
  './assets/game/pawn-red.png',
  './assets/game/pawn-green.png',
  './assets/game/pawn-blue.png',
  './assets/game/pawn-yellow.png',
  './assets/game/crown-medallion.png',
  './assets/game/avatar-hero.webp',
  './assets/game/hero-ludo-3d.webp',
  './assets/game/bot-mascot.webp',
  './assets/ui/royal-home-v2/online.webp',
  './assets/ui/royal-home-v2/team.webp',
  './assets/ui/royal-home-v2/friends.webp',
  './assets/ui/royal-home-v2/computer.webp',
  './assets/ui/royal-home-v2/pass.webp',
  './assets/ui/royal-home-v2/lucky-spin.webp',
  './assets/ui/royal-footer-masks/lucky-spin.svg',
  './assets/ui/royal-footer-masks/free-coins.svg',
  './assets/ui/royal-home-v2/tournament.webp',
  './assets/ui/royal-home-v2/free-coins.webp',
  './assets/ui/royal-sidebar-masks/starter-pack.svg',
  './assets/ui/royal-sidebar-masks/events.svg',
  './assets/ui/royal-sidebar-masks/bonus-chest.svg',
  './assets/ui/royal-sidebar-masks/vip.svg',
  './assets/ui/royal-sidebar-masks/daily-reward.svg',
  './assets/ui/royal-sidebar-masks/missions.svg',
  './assets/ui/royal-sidebar-masks/ranks.svg',
  './assets/ui/royal-sidebar/starter-pack.webp',
  './assets/ui/royal-sidebar/events.webp',
  './assets/ui/royal-sidebar/bonus-chest.webp',
  './assets/ui/royal-sidebar/vip.webp',
  './assets/ui/royal-sidebar/daily-reward.webp',
  './assets/ui/royal-sidebar/missions.webp',
  './assets/ui/royal-sidebar/ranks.webp',
  './assets/ui/royal-nav/home.webp',
  './assets/ui/royal-nav/events.webp',
  './assets/ui/royal-nav/club.webp',
  './assets/ui/royal-nav/inventory.webp',
  './assets/ui/royal-nav/social.webp',
  './assets/ui/royal-nav/more.webp',
  './assets/ui/royal-coin-store-centered/royal_bundle.webp',
  './assets/ui/royal-coin-store-centered/coins_25k.webp',
  './assets/ui/royal-coin-store-centered/coins_100k.webp',
  './assets/ui/royal-coin-store-centered/coins_500k.webp',
  './assets/ui/royal-coin-store-centered/coins_1m.webp',
  './assets/ui/royal-coin-store-centered/coins_5m.webp',
  './assets/ui/royal-store-chrome/back.webp',
  './assets/ui/royal-store-chrome/header.webp',
  './assets/ui/royal-store-chrome/gift.webp',
  './assets/ui/royal-store-chrome/coins.webp',
  './assets/ui/royal-store-chrome/diamonds.webp',
  './assets/ui/royal-store-chrome/offers.webp',
  './manifest.webmanifest'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  const u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== self.location.origin || u.pathname.startsWith('/api/')) return;
  e.respondWith(
    caches.match(r).then(v => v || fetch(r).then(x => {
      if (x.ok) {
        const copy = x.clone();
        caches.open(CACHE).then(c => c.put(r, copy)).catch(() => {});
      }
      return x;
    }))
  );
});