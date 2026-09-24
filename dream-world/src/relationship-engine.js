export const relationships = ['陌生人','相識','朋友','曖昧','戀人','伴侶'];
export function updateRelationship(character, changes = {}) {
  for (const key of ['affection','trust','intimacy']) character[key] = Math.max(0, Math.min(100, character[key] + (changes[key] || 0)));
  if (changes.relationship) { character.relationship = changes.relationship; if (changes.relationship === '朋友') character.flags.platonic = true; }
  else if (!['戀人','伴侶'].includes(character.relationship)) character.relationship = character.affection >= 40 && character.trust >= 35 && character.intimacy >= 12 ? '曖昧' : character.affection >= 20 && character.trust >= 20 ? '朋友' : character.affection + character.trust >= 8 ? '相識' : '陌生人';
  if (changes.mood) character.mood = changes.mood;
  if (character.flags.platonic) character.relationship = '朋友';
  if (changes.status) character.status = changes.status;
  if (changes.unlock) character.unlocked = [...new Set([...character.unlocked, ...changes.unlock])];
}
