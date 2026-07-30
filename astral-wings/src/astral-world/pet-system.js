import { PET_EVOLUTION_COST, PET_EVOLUTION_DATA, PET_SOURCE_KINDS, PET_STAR_BALANCE, PET_VISUALS } from './data.js';

const bossKinds = new Set(['horn', 'guardian', 'dragon', 'queen', 'destroyer']);
const clampStars = value => Math.max(1, Math.min(PET_STAR_BALANCE.maxStars, Math.floor(Number(value) || 1)));
const clampEvolution = value => Math.max(0, Math.min(4, Math.floor(Number(value) || 0)));
const round = value => Math.max(0, Math.round(Number(value) || 0));

export function getPetSpeciesId(pet = {}) {
  if (pet.speciesId) return pet.speciesId;
  const kind = pet.sourceKind || (typeof pet.id === 'string' && pet.id.startsWith('pet_') ? pet.id.slice(4) : null) || PET_SOURCE_KINDS[pet.source] || PET_SOURCE_KINDS[pet.name] || 'slime';
  return `pet_${kind}`;
}

export function getPetStarMultiplier(stars = 1) { return 1 + (clampStars(stars) - 1) * PET_STAR_BALANCE.starStep; }
export function getPetEvolutionMultiplier(rank = 0) { return 1.15 ** clampEvolution(rank); }
export function getPetStarCost(stars = 1) { return PET_STAR_BALANCE.costs[clampStars(stars)] || 0; }
export function getPetEffectiveAttack(pet = {}) { return round((pet.baseAttack ?? pet.attack ?? 0) * getPetStarMultiplier(pet.stars) * getPetEvolutionMultiplier(pet.evolutionRank)); }
export function getPetEffectiveHpBonus(pet = {}) { return round((pet.baseHpBonus ?? pet.hpBonus ?? 0) * getPetStarMultiplier(pet.stars) * getPetEvolutionMultiplier(pet.evolutionRank)); }

export function getPetEvolutionStage(pet = {}) {
  const kind = pet.sourceKind || 'slime'; const rank = clampEvolution(pet.evolutionRank);
  return PET_EVOLUTION_DATA[kind]?.stages?.[rank] || PET_EVOLUTION_DATA.slime.stages[rank];
}

export function getPetEvolutionAbilities(pet = {}) {
  const data = PET_EVOLUTION_DATA[pet.sourceKind] || PET_EVOLUTION_DATA.slime;
  return data.stages.slice(1, clampEvolution(pet.evolutionRank) + 1).map(stage => stage.ability).filter(Boolean);
}

export function getPetCombatModifiers(pet = {}) {
  const modifiers = { intervalMultiplier:1, damageMultiplier:1, crit:0, extraHit:0, bossDamage:0, shieldRatio:0 };
  for (const ability of getPetEvolutionAbilities(pet)) {
    if (ability.effect === 'haste') modifiers.intervalMultiplier *= 1 - ability.value;
    else if (ability.effect === 'power') modifiers.damageMultiplier += ability.value;
    else if (ability.effect === 'crit') modifiers.crit += ability.value;
    else if (ability.effect === 'extraHit') modifiers.extraHit = Math.max(modifiers.extraHit, ability.value);
    else if (ability.effect === 'bossDamage') modifiers.bossDamage += ability.value;
    else if (ability.effect === 'shield') modifiers.shieldRatio += ability.value;
  }
  return modifiers;
}

export function normalizePet(pet = {}) {
  const sourceKind = pet.sourceKind || (typeof pet.id === 'string' && pet.id.startsWith('pet_') ? pet.id.slice(4) : null) || PET_SOURCE_KINDS[pet.source] || PET_SOURCE_KINDS[pet.name] || 'slime';
  const speciesId = pet.speciesId || `pet_${sourceKind}`;
  const stars = clampStars(pet.stars);
  const multiplier = getPetStarMultiplier(stars) * getPetEvolutionMultiplier(pet.evolutionRank);
  const visual = PET_VISUALS[sourceKind] || { visualType:'fallbackPet', species:'unknown', palette:'astral' };
  const baseAttack = Math.max(1, round(pet.baseAttack ?? (pet.attack || 1) / multiplier));
  const baseHpBonus = round(pet.baseHpBonus ?? (pet.hpBonus || 0) / multiplier);
  const captureTier = pet.captureTier || (bossKinds.has(sourceKind) ? 'boss' : 'normal');
  const evolutionRank = clampEvolution(pet.evolutionRank);
  const normalized = { ...pet, id:pet.id || speciesId, speciesId, sourceKind, captureTier, visualType:pet.visualType || visual.visualType, species:pet.species || visual.species, palette:pet.palette || visual.palette, evolutionRank, evolutionStage:evolutionRank, evolutionAppearance:evolutionRank, evolutionSkills:Array.isArray(pet.evolutionSkills) ? pet.evolutionSkills : getPetEvolutionAbilities({ ...pet, sourceKind, evolutionRank }).map(ability => ability.id), stars, baseAttack, baseHpBonus };
  normalized.attack = getPetEffectiveAttack(normalized);
  normalized.hpBonus = getPetEffectiveHpBonus(normalized);
  return normalized;
}

export function createPetFromEnemy(enemy) {
  const visual = PET_VISUALS[enemy.kind] || PET_VISUALS.slime;
  return normalizePet({ id:`pet_${enemy.kind}`, speciesId:`pet_${enemy.kind}`, source:enemy.name, name:enemy.name, sourceKind:enemy.kind, captureTier:enemy.boss?'boss':enemy.elite?'elite':'normal', quality:enemy.boss?'epic':'rare', level:1, exp:0, stars:1, baseAttack:Math.max(4, Math.floor(enemy.attack * (enemy.boss ? .3 : .18))), baseHpBonus:Math.floor(enemy.maxHp * .05), ...visual });
}

export function getPetFragments(state, pet) { return Math.max(0, Number(state.petFragments?.[getPetSpeciesId(pet)]) || 0); }

export function canStarPet(state, pet) {
  if (!pet) return { ok:false, reason:'missing', cost:0, fragments:0 };
  if (clampStars(pet.stars) >= PET_STAR_BALANCE.maxStars) return { ok:false, reason:'max', cost:0, fragments:getPetFragments(state, pet) };
  const cost = getPetStarCost(pet.stars); const fragments = getPetFragments(state, pet);
  return { ok:fragments >= cost, reason:fragments >= cost ? 'ready' : 'fragments', cost, fragments };
}

export function previewPetStar(pet) {
  const normalized = normalizePet(pet);
  if (normalized.stars >= PET_STAR_BALANCE.maxStars) return { stars:normalized.stars, attack:getPetEffectiveAttack(normalized), hpBonus:getPetEffectiveHpBonus(normalized), max:true };
  const next = { ...normalized, stars:normalized.stars + 1 };
  return { stars:next.stars, attack:getPetEffectiveAttack(next), hpBonus:getPetEffectiveHpBonus(next), max:false };
}

export function starPet(state, petId) {
  state.pets ||= [];
  state.petFragments ||= {};
  const index = state.pets.findIndex(pet => pet.id === petId);
  if (index < 0) return { ok:false, reason:'missing' };
  const pet = normalizePet(state.pets[index]); const check = canStarPet(state, pet);
  if (!check.ok) return { ok:false, reason:check.reason, pet, ...check };
  const before = { attack:getPetEffectiveAttack(pet), hpBonus:getPetEffectiveHpBonus(pet), stars:pet.stars };
  state.petFragments[pet.speciesId] = check.fragments - check.cost;
  pet.stars += 1; pet.attack = getPetEffectiveAttack(pet); pet.hpBonus = getPetEffectiveHpBonus(pet);
  state.pets[index] = pet;
  return { ok:true, pet, cost:check.cost, fragments:state.petFragments[pet.speciesId], before, after:{ attack:pet.attack, hpBonus:pet.hpBonus, stars:pet.stars } };
}

export function getPetEvolutionCost(pet = {}) { return PET_EVOLUTION_COST[clampEvolution(pet.evolutionRank)] || null; }

export function canEvolvePet(state, pet) {
  const normalized = normalizePet(pet); const cost = getPetEvolutionCost(normalized); const fragments = getPetFragments(state, normalized);
  if (!cost) return { ok:false, reason:'max', pet:normalized, fragments, cost:null };
  if (normalized.stars < PET_STAR_BALANCE.maxStars) return { ok:false, reason:'stars', pet:normalized, fragments, cost };
  if ((normalized.level || 1) < cost.level) return { ok:false, reason:'level', pet:normalized, fragments, cost };
  if (fragments < cost.fragments) return { ok:false, reason:'fragments', pet:normalized, fragments, cost };
  if ((state.player?.gold || 0) < cost.gold) return { ok:false, reason:'gold', pet:normalized, fragments, cost };
  if ((state.evolutionCores || 0) < cost.core) return { ok:false, reason:'core', pet:normalized, fragments, cost };
  return { ok:true, reason:'ready', pet:normalized, fragments, cost };
}

export function evolvePet(state, petId) {
  state.pets ||= []; state.petFragments ||= {};
  const index = state.pets.findIndex(pet => pet.id === petId); if (index < 0) return { ok:false, reason:'missing' };
  const check = canEvolvePet(state, state.pets[index]); if (!check.ok) return { ok:false, ...check };
  const before = { rank:check.pet.evolutionRank, stars:check.pet.stars, attack:getPetEffectiveAttack(check.pet), hpBonus:getPetEffectiveHpBonus(check.pet), stage:getPetEvolutionStage(check.pet) };
  const pet = { ...check.pet, evolutionRank:check.pet.evolutionRank + 1, stars:1 };
  pet.evolutionStage = pet.evolutionRank; pet.evolutionAppearance = pet.evolutionRank; pet.evolutionSkills = getPetEvolutionAbilities(pet).map(ability => ability.id);
  const normalized = normalizePet(pet); state.pets[index] = normalized;
  state.petFragments[normalized.speciesId] = check.fragments - check.cost.fragments;
  state.player.gold -= check.cost.gold; state.evolutionCores -= check.cost.core;
  return { ok:true, pet:normalized, cost:check.cost, before, after:{ rank:normalized.evolutionRank, stars:normalized.stars, attack:getPetEffectiveAttack(normalized), hpBonus:getPetEffectiveHpBonus(normalized), stage:getPetEvolutionStage(normalized) } };
}

export function grantPetExperience(state, amount) {
  const pet = state.pets?.find(entry => entry.id === state.activePetId); if (!pet) return { levels:0, pet:null };
  const normalized = normalizePet(pet); normalized.exp = Math.max(0, Number(normalized.exp) || 0) + Math.max(0, Math.floor(amount)); let levels = 0;
  while (normalized.level < 100) { const needed = 40 + normalized.level * 35; if (normalized.exp < needed) break; normalized.exp -= needed; normalized.level += 1; levels += 1; }
  const index = state.pets.findIndex(entry => entry.id === normalized.id); if (index >= 0) state.pets[index] = normalized;
  return { levels, pet:normalized };
}

export function applyDuplicatePet(state, candidate) {
  state.pets ||= [];
  state.petFragments ||= {};
  const pet = normalizePet(candidate); const existing = state.pets.find(entry => getPetSpeciesId(entry) === pet.speciesId);
  const amount = PET_STAR_BALANCE.duplicateFragments[pet.captureTier] || PET_STAR_BALANCE.duplicateFragments.normal;
  state.petFragments[pet.speciesId] = getPetFragments(state, pet) + amount;
  return { kind:'duplicate', pet:existing ? normalizePet(existing) : pet, amount, fragments:state.petFragments[pet.speciesId] };
}

export function applyPetCapture(state, candidate) {
  state.pets ||= [];
  state.petFragments ||= {};
  const pet = normalizePet(candidate); const existing = state.pets.find(entry => getPetSpeciesId(entry) === pet.speciesId);
  if (!existing) { state.pets.push(pet); return { kind:'new', pet, fragments:0 }; }
  return applyDuplicatePet(state, pet);
}

function fragmentKeyToSpecies(key, pets) {
  const match = pets.find(pet => key === pet.id || key === pet.speciesId || key === pet.sourceKind);
  if (match) return getPetSpeciesId(match);
  if (typeof key === 'string' && key.startsWith('pet_') && PET_VISUALS[key.slice(4)]) return key;
  if (PET_VISUALS[key]) return `pet_${key}`;
  return key;
}

export function migratePets(pets = [], fragments = {}, activePetId = null) {
  const normalized = pets.map(normalizePet); const groups = new Map();
  for (const pet of normalized) { const speciesId = getPetSpeciesId(pet); const list = groups.get(speciesId) || []; list.push(pet); groups.set(speciesId, list); }
  const nextFragments = {};
  for (const [key, value] of Object.entries(fragments || {})) { const speciesId = fragmentKeyToSpecies(key, normalized); nextFragments[speciesId] = (nextFragments[speciesId] || 0) + Math.max(0, Math.floor(Number(value) || 0)); }
  const nextPets = []; const replacedIds = new Map();
  for (const [speciesId, group] of groups) {
    group.sort((a, b) => b.evolutionRank - a.evolutionRank || b.stars - a.stars || b.level - a.level || b.baseAttack - a.baseAttack);
    const keep = normalizePet(group[0]); nextPets.push(keep);
    for (let i = 1; i < group.length; i += 1) {
      const duplicate = group[i]; const amount = PET_STAR_BALANCE.duplicateFragments[duplicate.captureTier] || PET_STAR_BALANCE.duplicateFragments.normal;
      nextFragments[speciesId] = (nextFragments[speciesId] || 0) + amount; replacedIds.set(duplicate.id, keep.id);
    }
  }
  return { pets:nextPets, fragments:nextFragments, activePetId:replacedIds.get(activePetId) || activePetId };
}
