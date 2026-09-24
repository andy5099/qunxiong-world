import { createState, SAVE_KEY } from './state.js';
import { StoryEngine } from './story-engine.js';
import { applyChoice } from './choice-engine.js';
import { createAdultCharacter, createCharacterState } from './character-engine.js';
import { readSave, writeSave, exportSave, parseSave, backupLegacy, MAX_SAVE_BYTES } from './save.js';
import { createArchive, activeState, putState, switchWorld, addWorld, deleteWorld, worldFor, characterLibrary } from './archive-engine.js';
import { createWorldDefinition, parseWorldStats } from './world-factory.js';
import { worldPresets } from '../data/worlds/presets.js';
import { presentMedia } from './media-engine.js';
import { worldsPage, wizardPage, gimmickPanel } from './world-ui.js';
import * as ui from './ui.js';

const app=document.querySelector('#app'),nav=document.querySelector('#navigation'),modal=document.querySelector('#modal'),modalContent=document.querySelector('#modal-content');
let archive,state,world,engine,storageError=false,recoveryBlocked=false,tab='story',selectedCharacter=null,scene,busy=false,toastTimer,pendingImport=null,pendingDelete=null;
let wizard=null,wizardStep=1;
try {archive=readSave() || createArchive();if(archive.migratedFrom===1){try{backupLegacy();writeSave(archive);}catch{storageError=true;}setTimeout(()=>notify(storageError?'舊旅程已在記憶體升級，但儲存空間不足，請先匯出備份。':'舊旅程已升級：進度、關係與記憶保留，太虛系統已覺醒。'),100);}}
catch(error){archive=createArchive();storageError=true;recoveryBlocked=true;setTimeout(()=>notify(`存檔未載入：${error.message}。原始資料仍保留，可先備份。`),100);}
function syncActive(){state=activeState(archive);world=worldFor(state);engine=new StoryEngine(world);scene=null;selectedCharacter=null;}
syncActive();
function notify(message){const toast=document.querySelector('#toast');toast.textContent=message;toast.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('visible'),6500);}
function save(){if(recoveryBlocked)return false;try{putState(archive,state);state.savedAt=new Date().toISOString();writeSave(archive);storageError=false;return true;}catch(error){storageError=true;notify(`未能保存：${error.message}。請匯出全部世界備份。`);return false;}}
async function render(scroll=false,override=null){
  if(wizard)app.innerHTML=wizardPage(wizard,wizardStep,archive);
  else if(tab==='story'){if(!state.started)app.innerHTML=ui.landing(state,world);else{scene=override || await engine.scene(state);app.innerHTML=ui.story(state,world,scene);}}
  else if(tab==='cast')app.innerHTML=selectedCharacter?ui.characterPage(state,world,selectedCharacter):ui.castPage(state,world);
  else if(tab==='world')app.innerHTML=worldsPage(archive);
  else if(tab==='forge')app.innerHTML=ui.forgePage(state);
  else app.innerHTML=ui.settingsPage(state,storageError,archive.worlds.length);
  nav.innerHTML=ui.navigation(tab);nav.hidden=!state.started || !!wizard;
  if(tab==='settings' && !wizard)document.querySelector('#large-text').checked=document.body.classList.contains('large-text');
  if(scroll){window.scrollTo({top:0,behavior:'instant'});app.focus({preventScroll:true});}
}
function showModal(html){modalContent.innerHTML=html;if(!modal.open)modal.showModal();}
document.querySelector('#close-modal').addEventListener('click',()=>modal.close());
function wizardDraft(type='cultivation'){const p=worldPresets[type];return {worldType:type,name:p.title,description:p.intro,playerIdentity:p.role,rules:p.rules,statsText:p.stats,background:p.background,gimmickMode:'recommended',template:p.gimmick,characters:[]};}
function collectWizard(){const form=document.querySelector('#world-form');if(!form)return;const fd=new FormData(form);Object.assign(wizard,Object.fromEntries(fd));if(wizardStep===4)wizard.characters=fd.getAll('characters');}
function exportDialog(){const content=exportSave(archive);download(content,'dream-world-worlds.json');showModal(`<h2>保存全部 ${archive.worlds.length} 個世界</h2><p>已請瀏覽器下載 JSON。下載受限時，可展開並複製完整存檔文字。</p><details><summary>顯示備份 JSON</summary><label for="export-text">完整存檔文字</label><textarea id="export-text" readonly rows="10">${ui.esc(content)}</textarea></details>`);}
document.addEventListener('click',async event=>{
  const target=event.target.closest('[data-action]');if(!target || busy)return;
  const {action,id}=target.dataset;
  try{
    busy=true;
    if(action==='start'){
      if(recoveryBlocked){showModal('<h2>先保留原本的存檔</h2><p>原始存檔無法讀取，尚未覆蓋。</p><button class="secondary" data-action="raw-export">備份原始存檔</button><button class="danger" data-action="confirm-recovery-reset">確認捨棄損壞存檔並重開</button>');return;}
      state.started=true;save();await render(true);
    }
    if(action==='tab'){tab=id;selectedCharacter=null;await render(true);}
    if(action==='cast'){selectedCharacter=null;await render(true);}
    if(action==='character'){selectedCharacter=id;await render(true);}
    if(action==='choose'){
      const choice=scene.choices.find(c=>c.id===id);if(!choice)throw new Error('選項已更新');
      app.querySelectorAll('button').forEach(b=>b.disabled=true);
      await presentMedia(choice.media?.type!=='none'?choice.media:scene.media,modal,modalContent);
      state=applyChoice(state,world,choice);save();await render(true);
    }
    if(action==='gimmick')showModal(gimmickPanel(state,world));
    if(action==='prepare-ability'){
      const targetId=document.querySelector('#gimmick-target')?.value || null;
      const next=engine.abilityScene(state,id,targetId);modal.close();tab='story';await render(true,next);
    }
    if(action==='private'){const next=engine.privateScene(state,id);tab='story';await render(true,next);}
    if(action==='social'){const next=engine.socialScene(state,id);tab='story';await render(true,next);}
    if(action==='new-world'){save();wizard=wizardDraft();wizardStep=1;await render(true);}
    if(action==='wizard-back'){collectWizard();wizardStep=Math.max(1,wizardStep-1);await render(true);}
    if(action==='wizard-cancel'){wizard=null;tab='world';await render(true);}
    if(action==='switch-world'){save();switchWorld(archive,id);syncActive();state.started=true;tab='story';save();await render(true);}
    if(action==='delete-world'){pendingDelete=id;const w=worldFor(archive.worlds.find(s=>s.worldId===id));showModal(`<h2>刪除「${ui.esc(w.name)}」？</h2><p>這個世界的進度、關係、外掛與背包都會移除。其他世界保留。建議先匯出全部世界。</p><button class="danger" data-action="confirm-delete-world">確認刪除這個世界</button>`);}
    if(action==='confirm-delete-world'){if(!pendingDelete)throw new Error('請重新選擇世界');deleteWorld(archive,pendingDelete);pendingDelete=null;syncActive();tab='world';save();modal.close();await render(true);notify('指定世界已刪除，其餘旅程保留。');}
    if(action==='save'){if(save())notify('全部世界已保存。');await render();}
    if(action==='export'){putState(archive,state);exportDialog();}
    if(action==='raw-export')download(localStorage.getItem(SAVE_KEY)||'{}','dream-world-recovery.json');
    if(action==='reset')showModal(`<h2>重置「${ui.esc(world.name)}」？</h2><p>只重置目前世界。其他 ${archive.worlds.length-1} 個世界保留。</p><button class="danger" data-action="confirm-reset">確認重置目前世界</button>`);
    if(action==='confirm-reset'){
      const old=state;state=createState(world);state.started=true;
      for(const card of old.customCharacters){state.customCharacters.push(structuredClone(card));state.characters[card.id]=createCharacterState();}
      tab='story';save();modal.close();await render(true);
    }
    if(action==='confirm-recovery-reset'){archive=createArchive();syncActive();recoveryBlocked=false;state.started=true;save();modal.close();await render(true);}
    if(action==='confirm-import'){if(!pendingImport)throw new Error('請重新選取存檔');archive=pendingImport;pendingImport=null;recoveryBlocked=false;syncActive();tab='story';wizard=null;save();modal.close();await render(true);notify('全部世界與目前旅程已恢復。');}
  }catch(error){notify(error.message);await render();}finally{busy=false;}
});
document.addEventListener('submit',async event=>{
  if(!['custom-form','forge-form','world-form'].includes(event.target.id))return;
  event.preventDefault();if(busy)return;
  try{
    busy=true;const data=Object.fromEntries(new FormData(event.target));
    if(event.target.id==='world-form'){
      if(wizardStep===1 && wizard.worldType!==data.worldType)wizard=wizardDraft(data.worldType);
      collectWizard();
      if(wizardStep===2)parseWorldStats(wizard.statsText);
      if(wizardStep===3)createWorldDefinition(wizard,'world-validation');
      if(wizardStep<5){wizardStep++;await render(true);}
      else {const definition=createWorldDefinition(wizard,`world-${crypto.randomUUID()}`);addWorld(archive,definition,characterLibrary(archive));wizard=null;syncActive();tab='story';save();await render(true);notify('新世界已建立，舊旅程仍在世界頁。');}
    }else if(event.target.id==='custom-form')await render(true,engine.custom(state,data.action));
    else {
      if(state.customCharacters.length>=20)throw new Error('每個世界最多建立 20 位自創角色。');if(!data.adult)throw new Error('請確認角色成年。');
      const c=createAdultCharacter(data,state.worldId,`custom-${crypto.randomUUID()}`);state.customCharacters.push(c);state.characters[c.id]={...createCharacterState(),status:'已加入世界名冊'};state.flags[`met:${c.id}`]=true;
      if(state.definition){state.definition.characters.push(c.id);world=worldFor(state);engine=new StoryEngine(world);}
      save();tab='cast';selectedCharacter=c.id;await render(true);notify(`${c.name} 已加入目前世界，也可在建立新世界時選取。`);
    }
  }catch(error){notify(error.message);}finally{busy=false;}
});
document.addEventListener('change',async event=>{
  if(event.target.id==='large-text')document.body.classList.toggle('large-text',event.target.checked);
  if(event.target.id==='gimmick-mode')document.querySelector('#custom-gimmick-fields').hidden=event.target.value!=='custom';
  if(event.target.id!=='import-file')return;
  try{const file=event.target.files[0];if(!file)return;if(file.size>MAX_SAVE_BYTES)throw new Error('存檔超過 4 MB');pendingImport=parseSave(await file.text());showModal(`<h2>恢復 ${pendingImport.worlds.length} 個世界？</h2><p>將取代目前的全部世界。V0.1 單世界存檔會自動升級，請先匯出目前旅程備份。</p><button class="primary" data-action="confirm-import">確認匯入全部世界</button>`);}catch(error){notify(error.message);}event.target.value='';
});
function download(content,name){const url=URL.createObjectURL(new Blob([content],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
document.addEventListener('keydown',event=>{if(busy || modal.open || wizard || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable || tab!=='story' || !state.started)return;if(['1','2','3'].includes(event.key))app.querySelectorAll('[data-action="choose"]')[Number(event.key)-1]?.click();});
await render();
if('serviceWorker' in navigator){const hadController=!!navigator.serviceWorker.controller;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadController)notify('新版資源已就緒，下次重新開啟會使用新版本。');});navigator.serviceWorker.register(new URL('../service-worker.js',import.meta.url),{scope:new URL('../',import.meta.url).pathname,updateViaCache:'none'}).catch(()=>{});}
