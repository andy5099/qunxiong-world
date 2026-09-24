import { createCharacterState } from './character-engine.js';
export const SAVE_KEY = 'qunxiongDreamWorldSaveV1';
export function createState(world) {
  return { version:1, worldId:world.id, slotId:'main', player:{name:world.playerRole.name,age:world.playerRole.age}, started:false, turn:0, sceneId:world.startScene, location:world.locations[0].id, stats:Object.fromEntries(Object.entries(world.stats).map(([key,def])=>[key,def.initial])), characters:Object.fromEntries(world.characters.map(id=>[id,createCharacterState()])), customCharacters:[], flags:{...world.flags}, memory:{short:[],long:[],recent:[],relationshipSummary:'尚未相遇',worldSummary:world.memory}, lastOutcome:null, savedAt:null };
}
