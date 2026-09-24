export const relationships = ['陌生人','相識','朋友','曖昧','戀人','伴侶'];
export function dialogueLevel(c) {
  if(c.flags.platonic)return 0;
  if(['戀人','伴侶'].includes(c.relationship) && c.trust>=70 && c.intimacy>=50 && c.flags.privateEvening)return 4;
  if(['戀人','伴侶'].includes(c.relationship) && c.trust>=50 && c.intimacy>=25)return 3;
  if(c.affection>=40 && c.trust>=30 && c.intimacy>=12)return 2;
  return c.affection>=15 && c.trust>=10?1:0;
}
export function updateRelationship(character, changes = {}) {
  for (const key of ['affection','trust','intimacy']) character[key] = Math.max(0, Math.min(100, character[key] + (changes[key] || 0)));
  if (changes.relationship) { character.relationship = changes.relationship; if (changes.relationship === '朋友') character.flags.platonic = true; }
  else if (!['戀人','伴侶'].includes(character.relationship)) character.relationship = character.affection >= 40 && character.trust >= 35 && character.intimacy >= 12 ? '曖昧' : character.affection >= 20 && character.trust >= 20 ? '朋友' : character.affection + character.trust >= 8 ? '相識' : '陌生人';
  if (changes.mood) character.mood = changes.mood;
  if (character.flags.platonic) character.relationship = '朋友';
  if (changes.status) character.status = changes.status;
  if (changes.unlock) character.unlocked = [...new Set([...character.unlocked, ...changes.unlock])];
  if(changes.progress)character.progress=Math.min(99999,(character.progress||0)+changes.progress);
  if(changes.flags)Object.assign(character.flags,changes.flags);
  character.intimacyDialogueLevel=dialogueLevel(character);
}
