import {loadGameData,byId} from './data.js';import {newState,load,save,exportSave,importSave,getLoadError} from './store.js';
import {start,stop,step,attemptCapture,continueAttack,abandonCapture,selectMap,equipInstance,toggleLock,sellGear,deployBoss,trainBoss,starBoss} from './engine.js';import {render} from './ui.js';
const app=document.querySelector('#app');let data,state,timer=null;
function schedule(){if(timer!==null||!state.exploration.running)return;timer=setTimeout(()=>{timer=null;step(state,data);save(state);draw();},Math.max(180,900/state.settings.speed));}
function draw(){app.innerHTML=render(state,data);requestAnimationFrame(()=>{const log=app.querySelector('.battle-log');if(log)log.scrollTop=log.scrollHeight;});schedule();}
function clearTimer(){if(timer!==null){clearTimeout(timer);timer=null;}}
async function boot(){try{data=await loadGameData();state=load()||newState();state.loadError=getLoadError();draw();}catch(error){app.innerHTML=`<div class="app-wrap"><section class="card notice bad">遊戲資料載入失敗：${error.message}</section></div>`;}}
app.addEventListener('click',event=>{const target=event.target.closest('[data-action]');if(!target)return;const action=target.dataset.action;
  if(action==='start')start(state);else if(action==='stop'){stop(state);clearTimer();}
  else if(action.startsWith('screen:'))state.screen=action.slice(7);
  else if(action.startsWith('map:')){const map=byId(data.huntmaps,action.slice(4));if(selectMap(state,map,data))state.screen='hunting';}
  else if(action.startsWith('capture:')){const choice=action.slice(8);if(choice==='continue')continueAttack(state);else if(choice==='abandon')abandonCapture(state);else attemptCapture(state,data,choice);}
  else if(action.startsWith('equip:'))equipInstance(state,action.slice(6));else if(action.startsWith('lock:'))toggleLock(state,action.slice(5));else if(action.startsWith('sell:'))sellGear(state,action.slice(5));
  else if(action==='sell-batch')state.inventory.gear.filter(g=>g.quality==='普通'&&!g.locked&&!Object.values(state.equipment).includes(g.instanceId)).map(g=>g.instanceId).forEach(id=>sellGear(state,id));
  else if(action.startsWith('boss-deploy:'))deployBoss(state,action.slice(12));else if(action.startsWith('boss-train:'))trainBoss(state,action.slice(11));else if(action.startsWith('boss-star:'))starBoss(state,action.slice(10));
  else if(action==='save')save(state);else if(action==='export')exportSave(state);else if(action==='import')document.querySelector('#save-file')?.click();
  save(state);draw();
});
app.addEventListener('change',async event=>{const el=event.target;
  if(el.dataset.setting){state.exploration[el.dataset.setting]=el.type==='checkbox'?el.checked:el.type==='number'?Number(el.value):el.value;}
  if(el.dataset.filter){state.inventoryFilter={...(state.inventoryFilter||{}),[el.dataset.filter]:el.value};}
  if(el.matches('[data-speed]'))state.settings.speed=Number(el.value);
  if(el.id==='save-file'&&el.files[0]){clearTimer();try{state=await importSave(el.files[0]);}catch{state.loadError='匯入失敗，現有存檔未被覆蓋。';}}
  save(state);draw();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimer();save(state);}else schedule();});window.addEventListener('pagehide',()=>save(state));
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));boot();
