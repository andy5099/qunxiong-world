const CACHE='dream-world-v0.1.2';
const BASE=new URL('./',self.location.href);
const FILES=['./','index.html','style.css','manifest.webmanifest','assets/icon.svg','src/main.js','src/ui.js','src/state.js','src/save.js','src/world-engine.js','src/character-engine.js','src/relationship-engine.js','src/memory-engine.js','src/choice-engine.js','src/intimacy-engine.js','src/ai-provider.js','src/story-engine.js','src/media-engine.js','data/worlds/taixu.js','data/characters/cast.js','data/events/taixu.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(f=>new URL(f,BASE).href)))));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('dream-world-') && k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET' || url.origin!==BASE.origin || !url.pathname.startsWith(BASE.pathname))return;
  event.respondWith(caches.match(event.request,{cacheName:CACHE}).then(cached=>cached || fetch(event.request)));
});
