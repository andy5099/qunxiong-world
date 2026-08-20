import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const html = read('../index.html');
const css = read('../ios-hotfix.css');
const boot = read('../src/boot.js');
const main = read('../src/main.js');
const marble = read('../src/marble-battle-ui.js');
const sw = read('../service-worker.js');
const sources = fs.readdirSync(new URL('../src/', import.meta.url)).filter(name => name.endsWith('.js')).map(name => read(`../src/${name}`));
let passed = 0;
const check = (value, label) => { assert.ok(value, label); passed += 1; };

check(html.includes('boot-fallback') && html.includes('boot-error'), 'visible boot fallback exists');
check(html.includes('src/boot.js?v=v023-prototype-v21'), 'classic boot guard loads before module');
check(boot.includes("addEventListener('error'") && boot.includes("addEventListener('unhandledrejection'"), 'startup exceptions are visible');
check(main.includes("boot.mark('SAVE LOAD')") && main.includes("boot.mark('UI INIT')") && main.includes("boot.mark('MARBLE INIT')") && main.includes("boot.mark('SW REGISTER')"), 'boot phases recorded');
check(main.includes("state?.battle?.mode === 'marble'") && main.includes("querySelectorAll('.marble-overlay')"), 'marble layer only mounts for active marble battle');
check(css.includes('.marble-overlay{display:none;pointer-events:none}') && css.includes('.marble-overlay.is-active{display:grid;pointer-events:auto}'), 'marble overlay is hidden by default');
check(marble.includes("typeof ctx.roundRect==='function'") && marble.includes('quadraticCurveTo'), 'Canvas roundRect fallback exists');
check(marble.includes('if(window.PointerEvent)') && marble.includes("'touchstart'"), 'touch fallback exists without Pointer Events');
check(css.includes('min-height:100vh;min-height:100dvh') && css.includes('-webkit-backdrop-filter'), 'legacy iOS CSS fallbacks exist');
check(sw.includes("const BUILD_VERSION = 'v023-prototype-v21'") && sw.includes('skipWaiting()') && sw.includes('self.clients.claim()'), 'service worker activation is current');
check(sw.includes("event.request.mode === 'navigate'") && sw.includes("fetch(request, { cache: 'no-store' })"), 'navigation remains network first');
check(sources.every(source => !/^import .*\?v=(?!v023-prototype-v21)/m.test(source)), 'all module imports use one build version');
check(!main.includes('localStorage.clear') && !sw.includes('localStorage'), 'player save is never cleared');

console.log(`V0.2.1 iOS boot hotfix smoke: ${passed} assertions passed.`);
