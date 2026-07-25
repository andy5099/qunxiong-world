// 應用程式入口：單一排程避免重複自動狩獵計時器。
import {loadGameData} from './data.js';
import {newState,load,save,exportSave,importSave} from './store.js';
import {migrateHunt,huntStep,attemptCapture,equipGear,toggleGear,sellGear,deployPartner,starPartner} from './hunting-core.js';
import {render} from './ui.js';
const app=document.querySelector('#app');let data,state,timer=null;
function stopTimer(){if(timer){clearTimeout(timer);timer=null;}}
function schedule(){if(timer||!state.exploration.running)return;timer=setTimeout(()=>{timer=null;huntStep(state);save(state);draw();},Math.max(180,900/state.hunting.auto.speed));}
function draw(){app.innerHTML=render(state,data);requestAnimationFrame(()=>{const log=app.querySelector('.battle-log');if(log)log.scrollTop=log.scrollHeight;});schedule();}
function screen(name){state.screen=name;draw();}
async function boot(){try{data=await loadGameData();state=migrateHunt(load()||newState());draw();}catch(error){app.innerHTML=`<section class="card notice bad">無法載入遊戲資料：${error.message}</section>`;}}
app.addEventListener('click',async event=>{const el=event.target.closest('[data-action]');if(!el)return;const a=el.dataset.action;
  if(a==='start'){state.exploration.running=true;}else if(a==='stop'){state.exploration.running=false;stopTimer();}else if(a==='hunt-once')huntStep(state);else if(a.startsWith('screen:'))return screen(a.slice(7));else if(a.startsWith('hunt-map:')){state.hunting.mapId=a.slice(9);state.exploration.enemy=null;screen('home');return;}else if(a.startsWith('capture:'))attemptCapture(state,a.slice(8));else if(a.startsWith('gear-equip:'))equipGear(state,a.slice(11));else if(a.startsWith('gear-lock:'))toggleGear(state,a.slice(10));else if(a.startsWith('gear-sell:'))sellGear(state,a.slice(10));else if(a.startsWith('partner-deploy:'))deployPartner(state,a.slice(15));else if(a.startsWith('partner-star:'))starPartner(state,a.slice(13));else if(a==='save')save(state);else if(a==='export')exportSave(state);else if(a==='import')document.querySelector('#save-file')?.click();save(state);draw();
});
app.addEventListener('change',async event=>{const el=event.target;if(el.dataset.auto){state.hunting.auto[el.dataset.auto]=el.type==='checkbox'?el.checked:Number(el.value);}if(el.id==='save-file'&&el.files[0])state=migrateHunt(await importSave(el.files[0]));save(state);draw();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopTimer();save(state);}else schedule();});window.addEventListener('pagehide',()=>save(state));
boot();
