import { SAVE_KEY, createState } from './state.js';
import { getWorld } from './world-engine.js';
import { createAdultCharacter, createCharacterState } from './character-engine.js';
import { relationships } from './relationship-engine.js';
const plain = v => v && typeof v === 'object' && !Array.isArray(v);
const text = (v,max=600) => { if(typeof v !== 'string' || v.length > max) throw new Error('存檔文字格式不正確'); return v; };
const number = (v,min,max) => { if(!Number.isFinite(v) || v < min || v > max) throw new Error('存檔數值超出範圍'); return v; };
const flags = v => { if(!plain(v) || Object.keys(v).length > 200) throw new Error('存檔旗標格式不正確'); const out={}; for(const [k,val] of Object.entries(v)) { if (!/^[a-zA-Z0-9:_-]{1,80}$/.test(k) || ['__proto__','constructor','prototype'].includes(k) || typeof val !== 'boolean') throw new Error('存檔旗標格式不正確'); out[k]=val; } return out; };
const list = (v,max,fn) => { if(!Array.isArray(v) || v.length > max) throw new Error('存檔清單格式不正確'); return v.map(fn); };
const memory = m => ({text:text(m.text),turn:number(m.turn,0,1e7),character:m.character === null ? null : text(m.character,80)});
export function validateSave(raw) {
  if (!plain(raw) || raw.version !== 1) throw new Error('不支援的存檔版本');
  const world = getWorld(raw.worldId), state = createState(world);
  if (typeof raw.sceneId !== 'string' || !Object.hasOwn(world.events,raw.sceneId) || !world.locations.some(l=>l.id===raw.location)) throw new Error('存檔場景不存在');
  state.sceneId=raw.sceneId; state.location=raw.location; state.started=raw.started===true; state.turn=number(raw.turn,0,1e7);
  state.player={name:text(raw.player?.name,30),age:number(raw.player?.age,18,9999)};
  for(const [key,def] of Object.entries(world.stats)) state.stats[key]=number(raw.stats?.[key],def.min??0,def.max??999999);
  state.flags=flags(raw.flags);
  state.customCharacters=list(raw.customCharacters,20,c=>{
    if(!/^custom-[a-zA-Z0-9-]{1,60}$/.test(c.id) || c.adult !== true) throw new Error('自訂角色資料無效');
    const p=c.personas?.find(p=>p.worldId===world.id); if(!p) throw new Error('角色缺少世界身份');
    return createAdultCharacter({...c,...p},world.id,c.id);
  });
  const ids=[...world.characters,...state.customCharacters.map(c=>c.id)];
  if(new Set(ids).size !== ids.length) throw new Error('角色 ID 重複');
  state.characters={};
  for(const id of ids) {
    const input=raw.characters?.[id]; if(!plain(input)) throw new Error('角色狀態遺失');
    const c=createCharacterState();
    for(const key of ['affection','trust','intimacy']) c[key]=number(input[key],0,100);
    if(!relationships.includes(input.relationship)) throw new Error('關係資料無效');
    c.relationship=input.relationship; c.mood=text(input.mood,100); c.status=text(input.status,100); c.flags=flags(input.flags);
    for(const key of ['memories','worldMemories','history','intimacyHistory']) c[key]=list(input[key],24,memory);
    c.unlocked=list(input.unlocked,20,v=>text(v,60)); state.characters[id]=c;
  }
  if(!plain(raw.memory)) throw new Error('記憶資料遺失');
  state.memory={short:list(raw.memory.short,8,memory),long:list(raw.memory.long,40,memory),recent:list(raw.memory.recent,12,m=>({turn:number(m.turn,0,1e7),choice:text(m.choice,200),text:text(m.text)})),relationshipSummary:text(raw.memory.relationshipSummary,6000),worldSummary:text(raw.memory.worldSummary,10000)};
  state.savedAt=typeof raw.savedAt==='string' ? text(raw.savedAt,60) : null;
  // Imported outcomes are not rendered as effect payloads; the last narrative remains in recent memory.
  state.lastOutcome=state.memory.recent.length ? {text:state.memory.recent.at(-1).text,changes:{},label:state.memory.recent.at(-1).choice} : null;
  return state;
}
export function parseSave(content) { if(content.length > 500000) throw new Error('存檔超過 500 KB'); try { return validateSave(JSON.parse(content)); } catch(error) { throw new Error(`無法匯入：${error.message}`); } }
export function writeSave(state, storage=localStorage) { const saved={...state,savedAt:new Date().toISOString()}; storage.setItem(SAVE_KEY,JSON.stringify(saved)); state.savedAt=saved.savedAt; }
export function readSave(storage=localStorage) { const content=storage.getItem(SAVE_KEY); return content ? parseSave(content) : null; }
export function exportSave(state) { return JSON.stringify({...state,savedAt:new Date().toISOString()},null,2); }
