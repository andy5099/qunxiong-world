import { createState } from './state.js';
import { getWorld } from './world-engine.js';
import { createWorldModule } from './world-factory.js';
import { createCharacterState } from './character-engine.js';
export const MAX_WORLDS=12;
export function worldFor(state) {return state.definition?createWorldModule(state.definition):getWorld(state.worldId);}
export function createArchive() {const state=createState(getWorld('taixu'));return {version:2,activeWorldId:state.worldId,worlds:[state],savedAt:null};}
export function activeState(archive) {const s=archive.worlds.find(w=>w.worldId===archive.activeWorldId);if(!s)throw new Error('目前世界不存在');return s;}
export function putState(archive,state) {const i=archive.worlds.findIndex(w=>w.worldId===state.worldId);if(i<0)throw new Error('世界不存在');archive.worlds[i]=state;}
export function switchWorld(archive,id) {if(!archive.worlds.some(w=>w.worldId===id))throw new Error('世界不存在');archive.activeWorldId=id;}
export function addWorld(archive,definition,customCards=[]) {
  if(archive.worlds.length>=MAX_WORLDS)throw new Error('最多保留 12 個世界，請先匯出備份或刪除不需要的世界。');
  if(archive.worlds.some(w=>w.worldId===definition.id))throw new Error('世界 ID 重複');
  const s=createState(createWorldModule(definition));s.started=true;
  for(const id of definition.characters.filter(id=>id.startsWith('custom-'))) {
    const card=customCards.find(c=>c.id===id);if(!card || card.adult!==true || card.age<18)throw new Error('找不到選取的成年自創角色');
    const copy=structuredClone(card);copy.personas=[{...copy.personas[0],worldId:s.worldId,background:definition.background,worldMemories:[]}];
    s.customCharacters.push(copy);s.characters[id]=createCharacterState();
  }
  archive.worlds.push(s);archive.activeWorldId=s.worldId;return s;
}
export function deleteWorld(archive,id) {
  if(archive.worlds.length<=1)throw new Error('至少保留一個世界。可以重置目前世界，或先建立另一個世界。');
  if(!archive.worlds.some(w=>w.worldId===id))throw new Error('世界不存在');
  archive.worlds=archive.worlds.filter(w=>w.worldId!==id);if(archive.activeWorldId===id)archive.activeWorldId=archive.worlds[0].worldId;
}
export function characterLibrary(archive) {return [...new Map(archive.worlds.flatMap(s=>s.customCharacters).map(c=>[c.id,c])).values()];}
