import { getPetEffectiveAttack, getPetEffectiveHpBonus, getPetEvolutionAbilities } from './pet-system.js';

export const PET_SUPPORT_RATIO = .2;

const emptyTeam = () => ({ main:null, support:[null, null] });
const validPetIds = state => new Set((state.pets || []).map(pet => pet.id));

export function ensurePetTeam(state, legacyMain = state.activePetId) {
  const valid = validPetIds(state);
  const source = state.petTeam && typeof state.petTeam === 'object' ? state.petTeam : emptyTeam();
  let main = valid.has(source.main) ? source.main : valid.has(legacyMain) ? legacyMain : null;
  const support = Array.isArray(source.support) ? source.support.slice(0, 2) : [];
  while (support.length < 2) support.push(null);
  const used = new Set(main ? [main] : []);
  for (let index = 0; index < support.length; index += 1) {
    const id = support[index];
    if (!valid.has(id) || used.has(id)) support[index] = null;
    else used.add(id);
  }
  state.petTeam = { main, support };
  state.activePetId = main;
  return state.petTeam;
}

function slotValue(team, slot) {
  if (slot === 'main') return team.main;
  const index = slot === 'support1' ? 0 : slot === 'support2' ? 1 : -1;
  return index >= 0 ? team.support[index] : null;
}

function assignSlot(team, slot, value) {
  if (slot === 'main') team.main = value;
  else if (slot === 'support1') team.support[0] = value;
  else if (slot === 'support2') team.support[1] = value;
}

export function setPetTeamSlot(state, petId, slot) {
  const team = ensurePetTeam(state);
  if (!['main', 'support1', 'support2'].includes(slot)) return { ok:false, reason:'slot', team };
  if (petId !== null && !(state.pets || []).some(pet => pet.id === petId)) return { ok:false, reason:'missing', team };
  const currentSlot = team.main === petId ? 'main' : team.support[0] === petId ? 'support1' : team.support[1] === petId ? 'support2' : null;
  const destinationPet = slotValue(team, slot);
  if (currentSlot === slot) assignSlot(team, slot, null);
  else {
    if (currentSlot) assignSlot(team, currentSlot, destinationPet || null);
    assignSlot(team, slot, petId);
  }
  ensurePetTeam(state, team.main);
  return { ok:true, team:state.petTeam, slot, petId };
}

export function getPetTeamMembers(state) {
  const team = ensurePetTeam(state);
  const byId = new Map((state.pets || []).map(pet => [pet.id, pet]));
  return { main:byId.get(team.main) || null, support:team.support.map(id => byId.get(id) || null) };
}

export function getPetSupportBonuses(state) {
  const { main, support } = getPetTeamMembers(state);
  const bonuses = {
    mainAttack:main ? getPetEffectiveAttack(main) : 0,
    mainHp:main ? getPetEffectiveHpBonus(main) : 0,
    attack:0, hp:0, attackMultiplier:1, intervalMultiplier:1,
    crit:0, extraHit:0, bossDamage:0, shieldRatio:0, regenRatio:0,
  };
  for (const pet of support.filter(Boolean)) {
    bonuses.attack += getPetEffectiveAttack(pet) * PET_SUPPORT_RATIO;
    bonuses.hp += getPetEffectiveHpBonus(pet) * PET_SUPPORT_RATIO;
    for (const ability of getPetEvolutionAbilities(pet)) {
      if (ability.effect === 'power') bonuses.attackMultiplier += ability.value;
      else if (ability.effect === 'haste') bonuses.intervalMultiplier *= 1 - ability.value;
      else if (ability.effect === 'crit') bonuses.crit += ability.value;
      else if (ability.effect === 'extraHit') bonuses.extraHit += ability.value;
      else if (ability.effect === 'bossDamage') bonuses.bossDamage += ability.value;
      else if (ability.effect === 'shield') bonuses.shieldRatio += ability.value;
      else if (ability.effect === 'heal') bonuses.regenRatio += ability.value;
    }
  }
  bonuses.attack = Math.round(bonuses.attack);
  bonuses.hp = Math.round(bonuses.hp);
  bonuses.extraHit = Math.min(.7, bonuses.extraHit);
  bonuses.shieldRatio = Math.min(.2, bonuses.shieldRatio);
  bonuses.regenRatio = Math.min(.02, bonuses.regenRatio);
  return bonuses;
}
