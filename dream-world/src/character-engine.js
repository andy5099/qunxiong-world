import { characters } from '../data/characters/cast.js';
import { worldPresets } from '../data/worlds/presets.js';
export function createCharacterState(character) {
  return { affection:0, trust:0, intimacy:0, intimacyDialogueLevel:0, progress:0, relationship:'陌生人', memories:[], worldMemories:[], flags:{}, mood:'觀望', status:'尚未相遇', history:[], intimacyHistory:[], unlocked:[] };
}
export function getCharacter(state,id) {
  const card=state.aiCharacters?.find(c=>c.id===id) || state.customCharacters.find(c=>c.id===id) || characters[id];
  if(!card || card.personas.some(p=>p.worldId===state.worldId))return card;
  const preset=worldPresets[state.worldType] || worldPresets.custom,index=['shen','su','gu'].indexOf(id),identity=preset.identity[Math.max(0,index)];
  return {...card,personas:[...card.personas,{worldId:state.worldId,identity,occupation:identity,abilities:'觀察、合作、領域經驗',clothing:'符合目前世界的日常服裝',background:state.definition?.background || preset.background,worldMemories:[]}]};
}
export function createAdultCharacter(input, worldId, id) {
  const age = Number(input.age);
  if (!Number.isInteger(age) || age < 18 || age > 9999) throw new Error('角色必須明確成年，年齡請填 18–9999 的整數。');
  if (!input.name?.trim()) throw new Error('請填寫角色姓名。');
  const field = (key, fallback) => String(input[key] || fallback).trim().slice(0, 400);
  return { id, name:field('name','旅人').slice(0,30), adult:true, age, appearance:field('appearance','由你想像的模樣'), corePersonality:field('corePersonality','獨立而好奇'), speechStyle:field('speechStyle','坦率'), likes:field('likes','真誠的交流'), dislikes:'不被尊重', relationshipStyle:field('relationshipStyle','循序漸進'), intimacyStyle:field('intimacyStyle','先溝通，後靠近'), boundaries:'所有互動都需雙方自願；拒絕即停止。', weakness:'尚未透露', secret:'等待後續故事揭曉', memories:[], relationship:'陌生人', affection:0, trust:0, intimacy:0, flags:{}, portrait:null, media:{type:'none',src:null,prompt:null}, personas:[{worldId,identity:field('identity','異鄉旅人'),occupation:field('identity','旅人'),abilities:field('abilities','觀察'),clothing:'旅裝',background:field('background','循著夢境來到此地。'),worldMemories:[]}] };
}
