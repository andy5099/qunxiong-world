import { createState, SAVE_KEY } from './state.js';
import { getWorld } from './world-engine.js';
import { StoryEngine } from './story-engine.js';
import { applyChoice } from './choice-engine.js';
import { createAdultCharacter, createCharacterState } from './character-engine.js';
import { readSave, writeSave, exportSave, parseSave } from './save.js';
import { presentMedia } from './media-engine.js';
import * as ui from './ui.js';

const app=document.querySelector('#app'), nav=document.querySelector('#navigation'), modal=document.querySelector('#modal'), modalContent=document.querySelector('#modal-content');
let state, storageError=false, tab='story', selectedCharacter=null, scene, busy=false, toastTimer;
try { state=readSave() || createState(getWorld('taixu')); } catch(error) { state=createState(getWorld('taixu')); storageError=true; setTimeout(()=>notify(`舊存檔未載入：${error.message}。開始新旅程前請先在存檔頁備份。`),100); }
let world=getWorld(state.worldId), engine=new StoryEngine(world);
function notify(message) { const toast=document.querySelector('#toast');toast.textContent=message;toast.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('visible'),5500); }
function save() { try { writeSave(state);storageError=false;return true; } catch {storageError=true;notify('無法保存到瀏覽器，請在存檔頁匯出 JSON 備份。');return false;} }
async function render(scroll=false) {
  if(tab==='story') { if(!state.started) app.innerHTML=ui.landing(state,world);else {scene=await engine.scene(state);app.innerHTML=ui.story(state,world,scene);} }
  else if(tab==='cast') app.innerHTML=selectedCharacter?ui.characterPage(state,world,selectedCharacter):ui.castPage(state,world);
  else if(tab==='world') app.innerHTML=ui.worldPage(state,world);
  else if(tab==='forge') app.innerHTML=ui.forgePage(state);
  else app.innerHTML=ui.settingsPage(state,storageError);
  nav.innerHTML=ui.navigation(tab);nav.hidden=!state.started;
  if(tab==='settings') document.querySelector('#large-text').checked=document.body.classList.contains('large-text');
  if(scroll) {window.scrollTo({top:0,behavior:'instant'});app.focus({preventScroll:true});}
}
function showModal(html) {modalContent.innerHTML=html;modal.showModal();}
document.querySelector('#close-modal').addEventListener('click',()=>modal.close());
document.addEventListener('click',async event=>{
  const target=event.target.closest('[data-action]');if(!target || busy)return;
  const {action,id}=target.dataset;
  try {
    busy=true;
    if(action==='start') { if(storageError) {showModal('<h2>先保留原本的存檔</h2><p>先前存檔無法讀取。請先備份，再決定是否重置。</p><button class="secondary" data-action="raw-export">備份原始存檔</button><button class="danger" data-action="confirm-reset">確認重置並開始</button>');return;} state.started=true;save();await render(true); }
    if(action==='tab') {tab=id;selectedCharacter=null;await render(true);}
    if(action==='cast') {selectedCharacter=null;await render(true);}
    if(action==='character') {selectedCharacter=id;await render(true);}
    if(action==='choose') {
      const choice=scene.choices.find(c=>c.id===id);if(!choice)throw new Error('選項已更新，請再試一次。');
      app.querySelectorAll('button').forEach(b=>b.disabled=true);
      await presentMedia(choice.media?.type!=='none'?choice.media:scene.media,modal,modalContent);
      state=applyChoice(state,world,choice);save();await render(true);
    }
    if(action==='new-world') showModal('<span class="eyebrow">NEXT DREAM / 世界工坊</span><h2>下一個世界，由你想像。</h2><p>修仙、現代、武俠、古代、末日、奇幻、科幻、隨機世界、自由創造。</p><p class="muted">V0.1 目前可遊玩《太虛仙緣》。此處是未來入口；世界生成與切換尚未開放。</p>');
    if(action==='save') {if(save())notify('這場夢，已好好保存。');await render();}
    if(action==='export') {const content=exportSave(state);download(content,'dream-world-save.json');showModal(`<h2>保存這段旅程</h2><p>已請瀏覽器下載 JSON。若裝置沒有提供下載，可展開下方文字，複製並保存為 .json 檔。</p><details><summary>顯示備份 JSON</summary><label for="export-text">完整存檔文字</label><textarea id="export-text" readonly rows="10">${ui.esc(content)}</textarea></details>`);}
    if(action==='raw-export') download(localStorage.getItem(SAVE_KEY)||'{}','dream-world-recovery.json');
    if(action==='reset') showModal('<h2>重新開始這場夢？</h2><p>這會清除目前夢境世界的進度與自創角色。建議先匯出備份。</p><button class="danger" data-action="confirm-reset">確認重置</button>');
    if(action==='confirm-reset') {state=createState(world);state.started=true;tab='story';save();modal.close();await render(true);notify('新的夢境開始了。');}
    if(action==='confirm-import') {state=pendingImport;pendingImport=null;world=getWorld(state.worldId);engine=new StoryEngine(world);tab='story';selectedCharacter=null;save();modal.close();await render(true);notify('旅程已恢復。');}
  } catch(error) {notify(error.message);await render();} finally {busy=false;}
});
document.addEventListener('submit',async event=>{
  if(!['custom-form','forge-form'].includes(event.target.id))return;
  event.preventDefault();if(busy)return;
  try {
    busy=true;const data=Object.fromEntries(new FormData(event.target));
    if(event.target.id==='custom-form') {scene=engine.custom(state,data.action);app.innerHTML=ui.story(state,world,scene);window.scrollTo({top:0,behavior:'instant'});app.focus();}
    else {
      if(state.customCharacters.length>=20)throw new Error('V0.1 最多建立 20 位自創角色。');
      if(!data.adult)throw new Error('請確認角色成年。');
      const c=createAdultCharacter(data,state.worldId,`custom-${crypto.randomUUID()}`);
      state.customCharacters.push(c);state.characters[c.id]={...createCharacterState(),status:'已加入世界名冊'};state.flags[`met:${c.id}`]=true;save();tab='cast';selectedCharacter=c.id;await render(true);notify(`${c.name} 已加入世界名冊。`);
    }
  } catch(error) {notify(error.message);} finally {busy=false;}
});
let pendingImport=null;
document.addEventListener('change',async event=>{
  if(event.target.id==='large-text') document.body.classList.toggle('large-text',event.target.checked);
  if(event.target.id!=='import-file')return;
  try {const file=event.target.files[0];if(!file)return;if(file.size>500000)throw new Error('存檔超過 500 KB');pendingImport=parseSave(await file.text());showModal(`<h2>恢復這段旅程？</h2><p>${ui.esc(pendingImport.player.name)} · ${getWorld(pendingImport.worldId).name} · ${pendingImport.turn} 次選擇</p><p>將取代目前進度。尚未備份時，可返回匯出。</p><button class="primary" data-action="confirm-import">確認匯入</button>`);}catch(error){notify(error.message);}event.target.value='';
});
function download(content,name) { const url=URL.createObjectURL(new Blob([content],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000); }
document.addEventListener('keydown',event=>{if(busy || modal.open || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable || tab!=='story' || !state.started)return;if(['1','2','3'].includes(event.key))app.querySelectorAll('[data-action="choose"]')[Number(event.key)-1]?.click();});
await render();
if('serviceWorker' in navigator) navigator.serviceWorker.register(new URL('../service-worker.js',import.meta.url),{scope:new URL('../',import.meta.url).pathname}).catch(()=>{});
