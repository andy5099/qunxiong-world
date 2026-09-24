const CACHE='dream-world-v0.2.2-dynamic1';
const BASE=new URL('./',self.location.href);
const FILES=['./','index.html','style.css','manifest.webmanifest','assets/icon.svg','src/ai-schema.js','src/ai-adapters.js','src/ai-memory.js','src/ai-save.js','src/ai-ui.js','src/story-director.js','src/main.js','src/ui.js','src/state.js','src/save.js','src/world-engine.js','src/character-engine.js','src/relationship-engine.js','src/memory-engine.js','src/choice-engine.js','src/intimacy-engine.js','src/ai-provider.js','src/story-engine.js','src/media-engine.js','data/worlds/taixu.js','data/characters/cast.js','data/events/taixu.js','src/archive-engine.js','src/world-factory.js','src/world-ui.js','src/gimmick-engine.js','data/gimmicks/templates.js','data/worlds/presets.js','data/intimacy/dialogue.js','data/intimacy/events.js','data/intimacy/moon.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(f=>new URL(f,BASE).href))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('dream-world-') && k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET' || url.origin!==BASE.origin || !url.pathname.startsWith(BASE.pathname))return;
  event.respondWith(caches.match(event.request,{cacheName:CACHE}).then(cached=>cached || fetch(event.request)));
});
