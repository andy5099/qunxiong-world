const CACHE = 'astral-world-idle-v17';
const CORE = [
  './', './index.html', './styles.css', './manifest.webmanifest',
  './src/astral-world/main.js', './src/astral-world/data.js', './src/astral-world/core.js',
  './src/astral-world/save.js', './src/astral-world/renderer.js', './src/astral-world/monster-renderer.js', './src/astral-world/boss-renderer.js', './src/astral-world/pet-renderer.js', './src/astral-world/pet-system.js', './src/astral-world/pet-team-system.js', './src/astral-world/pet-synergy-system.js', './src/astral-world/pet-codex-system.js', './src/astral-world/game.js', './src/astral-world/ui.js', './src/astral-world/player-renderer.js',
  './src/astral-world/tutorial-system.js', './src/astral-world/objective-system.js', './css/alpha-v02.css',
  './src/astral-world/equipment-affix-system.js',
];

self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok && new URL(event.request.url).origin === self.location.origin) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => caches.match('./index.html'))));
});
