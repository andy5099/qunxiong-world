import { PET_CODEX_DATA } from './pet-codex-system.js';
import { getPetEvolutionStage } from './pet-system.js';
import { getPetTeamMembers } from './pet-team-system.js';

export const PET_TEAM_SYNERGY_BALANCE = Object.freeze({
  attackCap:.15, hpCap:.15, critCap:.08, petDamageCap:.20,
  bossDamageCap:.25, normalDamageCap:.10, goldBonusCap:.10, expBonusCap:.10,
});

export const PET_TEAM_ROLE_GROUPS = Object.freeze({
  attack:Object.freeze(['rabbit','wolf','lizard','lava','hawk','snowwolf','mech','horn','dragon','destroyer']),
  defense:Object.freeze(['beetle','golem','ruin','guardian']),
  support:Object.freeze(['slime','flower','spirit','ice','orb','queen']),
});

export const PET_TEAM_SYNERGIES = Object.freeze([
  { id:'region_resonance', name:'同區共鳴', description:'三隻隊伍成員來自相同區域。', condition:{type:'sameRegion'}, effects:{attack:.04,hp:.04} },
  { id:'cross_region', name:'跨域遠征', description:'三隻隊伍成員來自三個不同區域。', condition:{type:'distinctRegions',count:3}, effects:{goldBonus:.05,expBonus:.05} },
  { id:'royal_retinue', name:'王之隨從', description:'一隻 Boss 寵物與兩隻非 Boss 寵物同行。', condition:{type:'bossCount',count:1}, effects:{bossDamage:.06,normalDamage:.03} },
  { id:'three_kings', name:'三王降臨', description:'三隻隊伍成員都是 Boss 寵物。', condition:{type:'bossCount',count:3}, effects:{bossDamage:.12,attackIntervalMultiplier:1.05} },
  { id:'evolution_e2', name:'進化之隊・E2', description:'三隻隊伍成員都達到 E2。', condition:{type:'evolutionMin',rank:2}, effects:{petDamage:.05} },
  { id:'evolution_e4', name:'進化之隊・E4', description:'三隻隊伍成員都達到 E4。', condition:{type:'evolutionMin',rank:4}, effects:{petDamage:.10}, replaces:'evolution_e2' },
  { id:'balanced_roles', name:'均衡陣型', description:'隊伍同時包含攻擊、防禦與輔助定位。', condition:{type:'roleGroups'}, effects:{attack:.03,hp:.03,crit:.02} },
]);

const REGION_NAMES = Object.freeze({1:'星光共鳴',2:'幽森共鳴',3:'灼熱共鳴',4:'冰晶共鳴',5:'遺跡共鳴'});
const cap = (value, key) => Math.min(PET_TEAM_SYNERGY_BALANCE[`${key}Cap`] ?? value, value);
const kindOf = pet => pet?.sourceKind || null;
const codexOf = pet => PET_CODEX_DATA[kindOf(pet)] || null;
const isBoss = pet => codexOf(pet)?.rarity === 'boss';

function matches(synergy, pets) {
  const condition=synergy.condition; const regions=pets.map(pet=>codexOf(pet)?.region);
  if (condition.type==='sameRegion') return regions.every(region=>region&&region===regions[0]);
  if (condition.type==='distinctRegions') return new Set(regions).size===condition.count && regions.every(Boolean);
  if (condition.type==='bossCount') return pets.filter(isBoss).length===condition.count;
  if (condition.type==='evolutionMin') return pets.every(pet=>(pet.evolutionRank||0)>=condition.rank);
  if (condition.type==='roleGroups') return Object.values(PET_TEAM_ROLE_GROUPS).every(kinds=>pets.some(pet=>kinds.includes(kindOf(pet))));
  return false;
}

function effectText(effects) {
  const labels={attack:'攻擊',hp:'生命',crit:'暴擊',petDamage:'寵物傷害',bossDamage:'Boss 傷害',normalDamage:'普通怪傷害',goldBonus:'金幣收益',expBonus:'經驗收益'};
  const text=Object.entries(labels).filter(([key])=>effects[key]).map(([key,label])=>`${label} +${Math.round(effects[key]*100)}%`);
  if (effects.attackIntervalMultiplier>1) text.push(`攻擊速度 -${Math.round((effects.attackIntervalMultiplier-1)*100)}%`);
  return text.join('・');
}

export function getActivePetTeamSynergies(state) {
  const {main,support}=getPetTeamMembers(state); const pets=[main,...support];
  if (pets.some(pet=>!pet)) return [];
  let active=PET_TEAM_SYNERGIES.filter(item=>matches(item,pets));
  const replacements=new Set(active.map(item=>item.replaces).filter(Boolean));
  active=active.filter(item=>!replacements.has(item.id));
  return active.map(item=>{
    const region=item.id==='region_resonance'?codexOf(pets[0])?.region:null;
    return {...item,name:region?REGION_NAMES[region]||item.name:item.name,effectText:effectText(item.effects),members:pets.map(kindOf)};
  });
}

export function getPetTeamSynergyBonuses(state) {
  const active=getActivePetTeamSynergies(state);
  const bonuses={attack:0,hp:0,crit:0,petDamage:0,bossDamage:0,normalDamage:0,goldBonus:0,expBonus:0,attackIntervalMultiplier:1,active};
  for(const synergy of active){for(const [key,value] of Object.entries(synergy.effects)){if(key==='attackIntervalMultiplier')bonuses[key]*=value;else bonuses[key]+=value;}}
  for(const key of ['attack','hp','crit','petDamage','bossDamage','normalDamage','goldBonus','expBonus'])bonuses[key]=cap(bonuses[key],key);
  return bonuses;
}

export function validatePetTeamSynergyData() {
  const issues=[]; const ids=PET_TEAM_SYNERGIES.map(item=>item.id); const validKinds=new Set(Object.keys(PET_CODEX_DATA));
  if(new Set(ids).size!==ids.length)issues.push('duplicate synergy id');
  for(const [group,kinds] of Object.entries(PET_TEAM_ROLE_GROUPS)){if(!kinds.length)issues.push(`${group}: empty role group`);for(const kind of kinds)if(!validKinds.has(kind))issues.push(`${group}: unknown ${kind}`);}
  const roleKinds=Object.values(PET_TEAM_ROLE_GROUPS).flat();if(new Set(roleKinds).size!==roleKinds.length)issues.push('source kind appears in multiple role groups');for(const kind of validKinds)if(!roleKinds.includes(kind))issues.push(`unclassified role: ${kind}`);
  for(const item of PET_TEAM_SYNERGIES){if(!item.name||!item.description)issues.push(`${item.id}: missing copy`);for(const [key,value] of Object.entries(item.effects||{}))if(!Number.isFinite(value)||value<0)issues.push(`${item.id}: invalid ${key}`);}
  if(issues.length)console.warn('[Astral World] Pet synergy data validation:',issues);return issues;
}

export function describePetTeamSynergy(synergy){return synergy.effectText||effectText(synergy.effects||{});}

// The role map stays data-driven; this fallback avoids localized display-name matching.
export function getPetSynergyRole(pet){const kind=kindOf(pet);return Object.entries(PET_TEAM_ROLE_GROUPS).find(([,kinds])=>kinds.includes(kind))?.[0]||getPetEvolutionStage(pet).role||'support';}
