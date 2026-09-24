import { getCharacter } from './character-engine.js';
export function buildContext(state, world) {
  return structuredClone({ world:{id:world.id,name:world.name,theme:world.theme,rules:world.rules,stats:world.stats}, recentStory:state.memory.recent.slice(-6), player:{...state.player,stats:state.stats}, characters:Object.keys(state.characters).filter(id=>state.flags[`met:${id}`]).map(id=>({core:getCharacter(state,id),persona:getCharacter(state,id)?.personas.find(p=>p.worldId===world.id),state:state.characters[id]})), memories:{short:state.memory.short,long:state.memory.long,relationshipSummary:state.memory.relationshipSummary,worldSummary:state.memory.worldSummary},flags:state.flags });
}
export class AIProvider { async generateScene(_context) { throw new Error('請實作 generateScene(context)'); } }
export function validateScene(scene) {
  if (!scene || typeof scene.sceneText !== 'string' || scene.choices?.length !== 3 || new Set(scene.choices.map(c=>c.id)).size !== 3 || scene.choices.some(c=>typeof c.id !== 'string' || typeof c.label !== 'string')) throw new Error('劇情必須提供三個不同選項');
  return scene;
}
// Remote providers must validate effects against the world's allowlist before committing.
// Generation is read-only: effects are applied only when the player chooses an action.
