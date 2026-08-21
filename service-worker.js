const BUILD_VERSION = 'v031-rematch-1';
const CACHE = `qunxiong-world-${BUILD_VERSION}`;
// Upgrade source: v021-illustrated-marble-boss. Kept as a readable migration marker.
const APP_SHELL = [
  './index.html',
  `./style.css?v=${BUILD_VERSION}`,
  `./ios-hotfix.css?v=${BUILD_VERSION}`,
  `./pinball-prototype.css?v=${BUILD_VERSION}`,
  `./src/main.js?v=${BUILD_VERSION}`,
  `./src/boot.js?v=${BUILD_VERSION}`,
  `./src/data.js?v=${BUILD_VERSION}`,
  `./src/store.js?v=${BUILD_VERSION}`,
  `./src/engine.js?v=${BUILD_VERSION}`,
  `./src/boss-progression.js?v=${BUILD_VERSION}`,
  `./src/boss-gear-system.js?v=${BUILD_VERSION}`,
  `./src/world-boss-system.js?v=${BUILD_VERSION}`,
  `./src/world-boss-collection.js?v=${BUILD_VERSION}`,
  `./src/bond-system.js?v=${BUILD_VERSION}`,
  `./src/equipment-awakening.js?v=${BUILD_VERSION}`,
  `./src/boss-codex-system.js?v=${BUILD_VERSION}`,
  `./src/chapter2-system.js?v=${BUILD_VERSION}`,
  `./src/chapter3-system.js?v=${BUILD_VERSION}`,
  `./src/quick-battle-system.js?v=${BUILD_VERSION}`,
  `./src/gear-tier-system.js?v=${BUILD_VERSION}`,
  `./src/world-boss-breakthrough.js?v=${BUILD_VERSION}`,
  `./src/marble-battle.js?v=${BUILD_VERSION}`,
  `./src/marble-battle-ui.js?v=${BUILD_VERSION}`,
  `./src/ui.js?v=${BUILD_VERSION}`,
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('qunxiong-world-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.forEach(client => client.postMessage({ type: 'SW_UPDATED', version: BUILD_VERSION }));
  })());
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || (await cache.match('./index.html')) || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const update = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || (await update) || Response.error();
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(networkFirst(event.request));
    return;
  }
  event.respondWith(staleWhileRevalidate(event.request));
});
