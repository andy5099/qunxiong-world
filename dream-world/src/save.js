import { SAVE_KEY, createState } from './state.js';
import { getWorld } from './world-engine.js';
import { createWorldModule, validateDefinition } from './world-factory.js';
import { createAdultCharacter, createCharacterState } from './character-engine.js';
import { relationships, dialogueLevel } from './relationship-engine.js';
import { createGimmick } from './gimmick-engine.js';
import { gimmickLevel } from '../data/gimmicks/templates.js';
export const MAX_SAVE_BYTES=4000000;
const plain=v=>v && typeof v==='object' && !Array.isArray(v);
const text=(v,max=600)=>{if(typeof v!=='string' || v.length>max)throw new Error('存檔文字格式不正確');return v;};
const number=(v,min,max)=>{if(!Number.isFinite(v) || v<min || v>max)throw new Error('存檔數值超出範圍');return v;};
const list=(v,max,fn)=>{if(!Array.isArray(v) || v.length>max)throw new Error('存檔清單格式不正確');return v.map(fn);};
function record(v,check) {
  if(!plain(v) || Object.keys(v).length>200)throw new Error('存檔資料表格式不正確');
  const out={};for(const [key,value] of Object.entries(v)){if(!/^[a-zA-Z0-9:_-]{1,80}$/.test(key) || ['__proto__','constructor','prototype'].includes(key))throw new Error('存檔鍵值格式不正確');out[key]=check(value);}return out;
}
const flags=v=>record(v,value=>{if(typeof value!=='boolean')throw new Error('旗標格式不正確');return value;});
const counters=v=>record(v,value=>number(value,0,99999));
const memory=m=>({text:text(m.text,1500),turn:number(m.turn,0,1e7),character:m.character===null?null:text(m.character,80)});
export function validateWorldState(raw) {
  if(!plain(raw) || ![1,2].includes(raw.version))throw new Error('不支援的世界存檔版本');
  const legacy=raw.version===1,definition=raw.definition?validateDefinition(raw.definition):null;
  const world=definition?createWorldModule(definition):getWorld(raw.worldId);
  if(world.id!==raw.worldId)throw new Error('世界 ID 不一致');
  const s=createState(world);
  if(typeof raw.sceneId!=='string' || !Object.hasOwn(world.events,raw.sceneId) || !world.locations.some(l=>l.id===raw.location))throw new Error('存檔場景不存在');
  s.sceneId=raw.sceneId;s.location=raw.location;s.started=raw.started===true;s.turn=number(raw.turn,0,1e7);
  s.player={name:text(raw.player?.name,30),age:number(raw.player?.age,18,9999),identity:text(raw.player?.identity ?? world.playerRole.identity,100)};
  for(const [key,def] of Object.entries(world.stats))s.stats[key]=number(raw.stats?.[key],def.min??0,def.max??999999);
  s.flags=flags(raw.flags);
  s.customCharacters=list(raw.customCharacters,20,c=>{
    if(!/^custom-[a-zA-Z0-9-]{1,60}$/.test(c.id) || c.adult!==true)throw new Error('自訂角色資料無效');
    const p=c.personas?.find(p=>p.worldId===world.id);if(!p)throw new Error('角色缺少世界身份');
    return createAdultCharacter({...c,...p},world.id,c.id);
  });
  const ids=[...world.characters,...s.customCharacters.map(c=>c.id)];
  if(new Set(ids).size!==ids.length)throw new Error('角色 ID 重複');
  if(definition && definition.characters.some(id=>!ids.includes(id)))throw new Error('世界選取的角色資料缺失');
  s.characters={};
  for(const id of ids){
    const input=raw.characters?.[id];if(!plain(input))throw new Error('角色狀態遺失');
    const c=createCharacterState();for(const key of ['affection','trust','intimacy'])c[key]=number(input[key],0,100);
    if(!relationships.includes(input.relationship))throw new Error('關係資料無效');
    c.relationship=input.relationship;c.mood=text(input.mood,100);c.status=text(input.status,100);c.flags=flags(input.flags);
    for(const key of ['memories','worldMemories','history','intimacyHistory'])c[key]=list(input[key],24,memory);
    c.unlocked=list(input.unlocked,30,v=>text(v,60));c.progress=number(input.progress??0,0,99999);c.intimacyDialogueLevel=dialogueLevel(c);s.characters[id]=c;
  }
  if(!plain(raw.memory))throw new Error('記憶資料遺失');
  s.memory={short:list(raw.memory.short,8,memory),long:list(raw.memory.long,40,memory),recent:list(raw.memory.recent,12,m=>({turn:number(m.turn,0,1e7),choice:text(m.choice,200),text:text(m.text,2000)})),relationshipSummary:text(raw.memory.relationshipSummary,6000),worldSummary:text(raw.memory.worldSummary,10000)};
  s.inventory=legacy?{}:counters(raw.inventory);s.worldState=legacy?{}:counters(raw.worldState);
  if(legacy){s.gimmick.exp=Math.min(100000,s.turn*5);s.gimmick.level=gimmickLevel(s.gimmick.exp);s.gimmick.flags.migrated=true;}
  else {
    const g=raw.gimmick;if(!plain(g) || g.templateId!==s.gimmick.templateId)throw new Error('外掛與世界設定不一致');
    s.gimmick.exp=number(g.exp,0,100000);s.gimmick.level=gimmickLevel(s.gimmick.exp);
    s.gimmick.cooldowns=record(g.cooldowns,v=>number(v,0,1e7));s.gimmick.flags=flags(g.flags);
    for(const [key,max] of [['energy',100],['stamina',100],['yuan',9999]])s.gimmick.specialResources[key]=number(g.specialResources?.[key],0,max);
    if(typeof g.quest?.completed!=='boolean')throw new Error('外掛任務格式不正確');s.gimmick.quest.completed=g.quest.completed;
  }
  s.savedAt=typeof raw.savedAt==='string'?text(raw.savedAt,60):null;
  s.lastOutcome=s.memory.recent.length?{text:s.memory.recent.at(-1).text,changes:{},label:s.memory.recent.at(-1).choice}:null;
  return s;
}
export function validateSave(raw) {
  if(raw?.version===1){const s=validateWorldState(raw);return {version:2,activeWorldId:s.worldId,worlds:[s],savedAt:s.savedAt,migratedFrom:1};}
  if(!plain(raw) || raw.version!==2)throw new Error('不支援的存檔版本');
  // Also accept a standalone V2 world from development/export callers.
  if(raw.worldId && !raw.worlds){const s=validateWorldState(raw);return {version:2,activeWorldId:s.worldId,worlds:[s],savedAt:s.savedAt};}
  const worlds=list(raw.worlds,12,validateWorldState),ids=worlds.map(w=>w.worldId);
  if(!ids.length || new Set(ids).size!==ids.length || !ids.includes(raw.activeWorldId))throw new Error('世界清單或目前世界無效');
  return {version:2,worlds,activeWorldId:raw.activeWorldId,savedAt:typeof raw.savedAt==='string'?text(raw.savedAt,60):null};
}
export function parseSave(content){if(new TextEncoder().encode(content).length>MAX_SAVE_BYTES)throw new Error('存檔超過 4 MB');try{return validateSave(JSON.parse(content));}catch(error){throw new Error(`無法匯入：${error.message}`);}}
function envelope(value){return value.worlds?value:{version:2,activeWorldId:value.worldId,worlds:[value],savedAt:value.savedAt};}
export function exportSave(value){return JSON.stringify({...envelope(value),savedAt:new Date().toISOString()},null,2);}
export function writeSave(value,storage=localStorage){
  const saved={...envelope(value),savedAt:new Date().toISOString()},content=JSON.stringify(saved);
  if(new TextEncoder().encode(content).length>MAX_SAVE_BYTES)throw new Error('存檔超過 4 MB，請匯出備份後整理世界');
  storage.setItem(SAVE_KEY,content);value.savedAt=saved.savedAt;
}
export function readSave(storage=localStorage){const content=storage.getItem(SAVE_KEY);return content?parseSave(content):null;}
export function backupLegacy(storage=localStorage){const content=storage.getItem(SAVE_KEY);if(content && JSON.parse(content).version===1)storage.setItem(SAVE_KEY+'MigrationBackupV1',content);}
