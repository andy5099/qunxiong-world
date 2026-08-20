import assert from 'node:assert/strict';
import fs from 'node:fs';

const sw=fs.readFileSync(new URL('../service-worker.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
let passed=0;const check=(value,label)=>{assert.ok(value,label);passed++;};

check(sw.includes("const BUILD_VERSION = 'v023-prototype-v21'"),'single build version');
check(sw.includes('skipWaiting()'),'install skips waiting');
check(sw.includes('self.clients.claim()'),'activate claims clients');
check(sw.includes("key.startsWith('qunxiong-world-')")&&sw.includes('caches.delete(key)'),'old app caches deleted');
check(sw.includes("event.request.mode === 'navigate'")&&sw.includes('networkFirst(event.request)'),'navigation is network first');
check(sw.includes("fetch(request, { cache: 'no-store' })"),'HTML bypasses HTTP cache');
check(sw.includes('staleWhileRevalidate(event.request)'),'static assets use SWR');
check(sw.includes("type: 'SW_UPDATED'")&&sw.includes('postMessage'),'activate notifies clients');
check(html.includes('style.css?v=v023-prototype-v21')&&html.includes('src/main.js?v=v023-prototype-v21'),'HTML asset versions match');
check(main.includes("buildVersion = 'v023-prototype-v21'")&&main.includes("updateViaCache: 'none'"),'registration bypasses SW HTTP cache');
check(main.includes('sessionStorage.getItem(reloadKey)')&&main.includes('controllerchange'),'one reload session guard');
check(!sw.includes("respondWith(caches.match(event.request)"),'navigation is not cache first');

console.log(`V0.2.1 PWA cache hotfix smoke: ${passed} assertions passed.`);
