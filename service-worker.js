const CACHE = 'qunxiong-world-v021-formation-puzzle-five-color-polish-2';
const ASSETS = ['./', './index.html', './style.css?v=v021-puzzle-polish', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './src/main.js', './src/data.js', './src/store.js', './src/engine.js', './src/boss-progression.js', './src/boss-gear-system.js', './src/world-boss-system.js', './src/boss-codex-system.js', './src/chapter2-system.js', './src/gear-tier-system.js', './src/world-boss-breakthrough.js', './src/formation-puzzle.js', './src/formation-puzzle-ui.js', './src/ui.js'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => caches.match(event.request).then(hit => hit || caches.match('./index.html'))));
});
