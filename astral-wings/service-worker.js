const CACHE = 'astral-world-idle-v21';
const CORE = [
  './', './index.html', './styles.css', './manifest.webmanifest', './assets/game-art/manifest.json', './assets/game-art/region-01-asset-spec.json',
  './src/astral-world/main.js', './src/astral-world/data.js', './src/astral-world/core.js',
  './src/astral-world/save.js', './src/astral-world/renderer.js', './src/astral-world/monster-renderer.js', './src/astral-world/boss-renderer.js', './src/astral-world/pet-renderer.js', './src/astral-world/pet-system.js', './src/astral-world/pet-team-system.js', './src/astral-world/pet-synergy-system.js', './src/astral-world/pet-codex-system.js', './src/astral-world/game.js', './src/astral-world/ui.js', './src/astral-world/player-renderer.js',
  './src/astral-world/tutorial-system.js', './src/astral-world/objective-system.js', './css/alpha-v02.css', './css/visual-icons.css',
  './src/astral-world/equipment-affix-system.js',
  './src/astral-world/visual-theme.js', './src/astral-world/battle-background-renderer.js',
  './src/astral-world/ui-icons.js', './src/astral-world/equipment-icon-renderer.js', './src/astral-world/skill-icon-renderer.js',
  './src/astral-world/art-asset-manager.js', './src/astral-world/sprite-renderer.js', './css/art-assets.css', './css/region-01-slice.css', './css/region-01-production.css',
  './assets/reference/astral-world-art-bible.png', './assets/reference/astral-world-ui-target.png', './assets/reference/astral-world-region1-production-guide.png',
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
