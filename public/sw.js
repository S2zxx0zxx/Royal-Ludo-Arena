const CACHE = 'royal-ludo-arena-v1.0.0';
const BASE = [
  './',
  './index.html',
  './styles.css',
  './extended.css',
  './game.css',
  './js/sound.js',
  './js/state.js',
  './js/ludo-engine.js',
  './js/ludo-ai.js',
  './js/game-view.js',
  './js/app.js',
  './js/expansion.js',
  './assets/icons/icon.svg',
  './assets/screens/home.webp',
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
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return;
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