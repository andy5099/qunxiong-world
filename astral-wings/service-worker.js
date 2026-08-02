const CACHE = 'astral-world-idle-v23';
const CORE = [
  './', './index.html', './styles.css', './manifest.webmanifest', './PRODUCTION_ASSET_SPEC.json', './assets/game-art/manifest.json', './assets/game-art/region-01-asset-spec.json',
  './src/astral-world/main.js', './src/astral-world/data.js', './src/astral-world/core.js',
  './src/astral-world/save.js', './src/astral-world/renderer.js', './src/astral-world/monster-renderer.js', './src/astral-world/boss-renderer.js', './src/astral-world/pet-renderer.js', './src/astral-world/pet-system.js', './src/astral-world/pet-team-system.js', './src/astral-world/pet-synergy-system.js', './src/astral-world/pet-codex-system.js', './src/astral-world/game.js', './src/astral-world/ui.js', './src/astral-world/player-renderer.js',
  './src/astral-world/tutorial-system.js', './src/astral-world/objective-system.js', './css/alpha-v02.css', './css/visual-icons.css',
  './src/astral-world/equipment-affix-system.js',
  './src/astral-world/visual-theme.js', './src/astral-world/battle-background-renderer.js',
  './src/astral-world/ui-icons.js', './src/astral-world/equipment-icon-renderer.js', './src/astral-world/skill-icon-renderer.js',
  './src/astral-world/art-asset-manager.js', './src/astral-world/sprite-renderer.js', './src/astral-world/region-one-art-validator.js', './css/art-assets.css', './css/region-01-slice.css', './css/region-01-production.css',
  './assets/reference/astral-world-art-bible.png', './assets/reference/astral-world-ui-target.png', './assets/reference/astral-world-region1-production-guide.png',
  './assets/game-art/backgrounds/region-01/battle.webp',
  './assets/game-art/characters/astral-blade/idle.webp', './assets/game-art/characters/astral-blade/attack.webp', './assets/game-art/characters/astral-blade/skill.webp', './assets/game-art/characters/astral-blade/hurt.webp', './assets/game-art/characters/astral-blade/death.webp',
  './assets/game-art/monsters/region-01/star-slime.webp', './assets/game-art/monsters/region-01/moon-rabbit.webp', './assets/game-art/monsters/region-01/star-beetle.webp', './assets/game-art/bosses/region-01/crowned-beast.webp', './assets/game-art/pets/region-01/star-slime.webp',
  './assets/game-art/skills/player/star-blade.webp', './assets/game-art/skills/player/meteor-combo.webp', './assets/game-art/skills/player/star-burst.webp', './assets/game-art/skills/player/astral-shield.webp',
  './assets/game-art/ui/battle-hud.webp', './assets/game-art/ui/skill-frame.webp', './assets/game-art/ui/equipment-frame.webp', './assets/game-art/ui/inventory-slot.webp', './assets/game-art/ui/boss-bar-frame.webp', './assets/game-art/ui/hp-bar-frame.webp', './assets/game-art/ui/mp-bar-frame.webp', './assets/game-art/ui/panel-frame.webp', './assets/game-art/ui/button-normal.webp', './assets/game-art/ui/button-primary.webp', './assets/game-art/ui/button-danger.webp', './assets/game-art/ui/dialogue-frame.webp', './assets/game-art/ui/combat-log-frame.webp',
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
