import { updateRelationship, relationships } from './relationship-engine.js';
import { remember, summarize } from './memory-engine.js';
export function meets(state, req = {}) {
  if (req.flags && !Object.entries(req.flags).every(([k,v])=>state.flags[k] === v)) return false;
  if (req.stats && !Object.entries(req.stats).every(([k,v])=>state.stats[k] >= v)) return false;
  if (req.character) {
    const c = state.characters[req.character];
    if (!c || ['affection','trust','intimacy'].some(k=>c[k] < (req[k] || 0))) return false;
    if (req.maxTrust != null && c.trust > req.maxTrust) return false;
    if (req.relationship && relationships.indexOf(c.relationship) < relationships.indexOf(req.relationship)) return false;
  }
  return true;
}
export function applyChoice(state, world, choice) {
  const next = structuredClone(state), effects = choice.effects || {};
  if (!meets(state, choice.requirements)) throw new Error('條件尚未達成');
  next.turn++;
  for (const [key,amount] of Object.entries(effects.stats || {})) {
    const def = world.stats[key];
    if (!def || !Number.isFinite(amount)) throw new Error('未知世界數值');
    next.stats[key] = Math.max(def.min ?? 0, Math.min(def.max ?? 999999, next.stats[key] + amount));
  }
  Object.assign(next.flags, effects.flags || {});
  for (const [id,changes] of Object.entries(effects.characters || {})) { if (!next.characters[id]) throw new Error('未知角色'); updateRelationship(next.characters[id], changes); }
  if (effects.location) next.location = effects.location;
  for (const memory of choice.memoryEffects || []) remember(next, memory);
  next.sceneId = choice.next || next.sceneId;
  next.lastOutcome = { text:choice.result || '你做出了選擇。', changes:effects, label:choice.label };
  next.memory.recent = [...next.memory.recent,{turn:next.turn,choice:choice.label,text:next.lastOutcome.text}].slice(-12);
  summarize(next, world);
  return next;
}
