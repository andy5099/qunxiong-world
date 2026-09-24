import { meets } from './choice-engine.js';
import { getCharacter } from './character-engine.js';
export function eligibleIntimacyEvent(state, event) {
  if (state.flags[`event:${event.id}`] || event.worldRequirement !== state.worldId) return false;
  return meets(state,event.requirements) && event.characters.every(id => {
    const card = getCharacter(state,id);
    return card?.adult === true && card.age >= 18 && meets(state,{character:id,relationship:event.relationshipRequirement,affection:event.affectionRequirement,trust:event.trustRequirement,intimacy:event.intimacyRequirement});
  });
}
