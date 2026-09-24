import { createAIState } from './ai-memory.js';
import { createCharacterState } from './character-engine.js';
import { createGimmick } from './gimmick-engine.js';
export const SAVE_KEY = 'qunxiongDreamWorldSaveV1';
export function createState(world) {
  const worldState=Object.fromEntries(Object.entries(world.systemBindings||{}).map(([key,stat])=>[key,world.stats[stat].initial]));
  return { version:2, ai:createAIState(), aiCharacters:[], worldId:world.id, worldType:world.worldType || 'cultivation',definition:world.definition?structuredClone(world.definition):null, slotId:'main', player:{name:world.playerRole.name,age:world.playerRole.age,identity:world.playerRole.identity},gimmick:createGimmick(world.gimmickSelection),inventory:{},worldState, started:false, turn:0, sceneId:world.startScene, location:world.locations[0].id, stats:Object.fromEntries(Object.entries(world.stats).map(([key,def])=>[key,def.initial])), characters:Object.fromEntries(world.characters.map(id=>[id,createCharacterState()])), customCharacters:[], flags:{...world.flags}, memory:{short:[],long:[],recent:[],relationshipSummary:'尚未相遇',worldSummary:world.memory}, lastOutcome:null, savedAt:null };
}
