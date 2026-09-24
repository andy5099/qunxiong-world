import { getCharacter } from './character-engine.js';
export const MEMORY_LIMITS = { short:8, long:40, recent:12, character:24 };
export function remember(state, memory) {
  const entry = { text:memory.text, turn:state.turn, character:memory.character || null };
  state.memory.short = [...state.memory.short, entry].slice(-MEMORY_LIMITS.short);
  if (memory.important && !state.memory.long.some(m => m.text === entry.text)) state.memory.long = [...state.memory.long, entry].slice(-MEMORY_LIMITS.long);
  if (memory.character && state.characters[memory.character]) {
    const character = state.characters[memory.character];
    character.memories = [...character.memories, entry].slice(-MEMORY_LIMITS.character);
    character.worldMemories = character.memories;
    character.history = [...character.history, entry].slice(-MEMORY_LIMITS.character);
    if (memory.intimate) character.intimacyHistory = [...character.intimacyHistory, entry].slice(-MEMORY_LIMITS.character);
  }
}
export function summarize(state, world) {
  state.memory.relationshipSummary = Object.entries(state.characters).map(([id,c]) => `${getCharacter(state,id)?.name || id}：${c.relationship}，好感${c.affection}／信任${c.trust}／親密${c.intimacy}`).join('；');
  state.memory.worldSummary = `${world.name}，已做出 ${state.turn} 次選擇，目前位於${world.locations.find(l=>l.id===state.location)?.name || '旅途中'}。${state.memory.recent.at(-1)?.text || ''}`;
}
