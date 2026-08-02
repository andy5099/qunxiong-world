import { BALANCE, MONSTER_VISUALS, QUALITY, SLOTS } from './data.js';
import { equipmentPower as calculateEquipmentPower, generateEquipmentAffixes, getEquipmentAffixBonuses, getEquipmentStatProfile } from './equipment-affix-system.js';
import { createPetFromEnemy, getPetEffectiveAttack, getPetEffectiveHpBonus, normalizePet } from './pet-system.js';
import { getPetCodexBonuses, syncPetCodex } from './pet-codex-system.js';
import { ensurePetTeam, getPetSupportBonuses } from './pet-team-system.js';
import { getPetTeamSynergyBonuses } from './pet-synergy-system.js';

export { getPetEffectiveAttack, getPetEffectiveHpBonus, normalizePet } from './pet-system.js';

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const format = value => value >= 1e9 ? `${(value/1e9).toFixed(1)}B` : value >= 1e6 ? `${(value/1e6).toFixed(1)}M` : value >= 1000 ? `${(value/1000).toFixed(1)}K` : Math.floor(value).toLocaleString();
export const expFor = level => Math.floor(55 * level ** 1.36 + level * 28);

export function basePlayer(level = 1) {
  return { name:'星界冒險者', className:'星刃使', level, exp:0, nextExp:expFor(level), hp:150+(level-1)*24, maxHp:150+(level-1)*24, attack:20+(level-1)*5, defense:5+(level-1)*1.4, crit:.05, critDamage:1.5, attackSpeed:BALANCE.attackInterval, shield:0, gold:0, diamonds:0, power:0 };
}

export function recompute(state) {
  ensurePetTeam(state);
  syncPetCodex(state);
  const prior = state.player || basePlayer();
  const player = basePlayer(prior.level || 1);
  player.name = prior.name || player.name; player.exp = prior.exp || 0; player.gold = prior.gold || 0; player.diamonds = prior.diamonds || 0;
  const percent={attack:0,defense:0,maxHp:0};
  const affixBonuses={flat:{},additiveRate:{},intervalMultiplier:1,bossDamage:0,normalDamage:0,goldBonus:0,expBonus:0};
  for (const item of Object.values(state.equipped || {})) {
    const multiplier=1+(item?.enhance||0)*.08;
    for (const [key,value] of Object.entries(item?.stats || {})) player[key] = (player[key] || 0) + value*multiplier;
    const bonus=getEquipmentAffixBonuses(item);
    for(const [key,value] of Object.entries(bonus.flat)) affixBonuses.flat[key]=(affixBonuses.flat[key]||0)+value;
    for(const [key,value] of Object.entries(bonus.percent)) percent[key]=(percent[key]||0)+value;
    for(const [key,value] of Object.entries(bonus.additiveRate)) affixBonuses.additiveRate[key]=(affixBonuses.additiveRate[key]||0)+value;
    affixBonuses.intervalMultiplier*=bonus.intervalMultiplier;
    for(const key of ['bossDamage','normalDamage','goldBonus','expBonus']) affixBonuses[key]+=bonus[key];
  }
  for(const [key,value] of Object.entries(affixBonuses.flat)) player[key]=(player[key]||0)+value;
  for(const [key,value] of Object.entries(percent)) player[key]*=1+value;
  for(const [key,value] of Object.entries(affixBonuses.additiveRate)) player[key]=(player[key]||0)+value;
  player.attackSpeed*=affixBonuses.intervalMultiplier;
  player.equipmentBossDamageBonus=affixBonuses.bossDamage; player.equipmentNormalDamageBonus=affixBonuses.normalDamage;
  player.equipmentGoldBonus=affixBonuses.goldBonus; player.equipmentExpBonus=affixBonuses.expBonus;
  player.bossDamage=affixBonuses.bossDamage; player.normalDamage=affixBonuses.normalDamage;
  player.goldBonus=affixBonuses.goldBonus; player.expBonus=affixBonuses.expBonus;
  const pet = state.pets?.find(entry => entry.id === state.petTeam.main);
  const team = getPetSupportBonuses(state);
  if (pet) { player.attack += getPetEffectiveAttack(pet); player.maxHp += getPetEffectiveHpBonus(pet); }
  player.petSupportAttack = team.attack;
  player.petSupportHp = team.hp;
  player.attack += team.attack;
  player.maxHp += team.hp;
  player.attack *= team.attackMultiplier;
  player.attackSpeed *= team.intervalMultiplier;
  player.crit += team.crit;
  player.bossDamage = (player.bossDamage || 0) + team.bossDamage;
  player.petSupportExtraHit = team.extraHit;
  player.petSupportShieldRatio = team.shieldRatio;
  player.regen = (player.regen || 0) + player.maxHp * team.regenRatio;
  const synergy = getPetTeamSynergyBonuses(state);
  player.petSynergyAttackBonus = synergy.attack;
  player.petSynergyHpBonus = synergy.hp;
  player.petSynergyCritBonus = synergy.crit;
  player.petSynergyPetDamageBonus = synergy.petDamage;
  player.petSynergyBossDamageBonus = synergy.bossDamage;
  player.petSynergyNormalDamageBonus = synergy.normalDamage;
  player.petSynergyGoldBonus = synergy.goldBonus;
  player.petSynergyExpBonus = synergy.expBonus;
  player.attack *= 1 + synergy.attack;
  player.maxHp *= 1 + synergy.hp;
  player.crit += synergy.crit;
  player.bossDamage = (player.bossDamage || 0) + synergy.bossDamage;
  player.normalDamage = (player.normalDamage || 0) + synergy.normalDamage;
  player.goldBonus = (player.goldBonus || 0) + synergy.goldBonus;
  player.expBonus = (player.expBonus || 0) + synergy.expBonus;
  player.attackSpeed *= synergy.attackIntervalMultiplier;
  const codex = getPetCodexBonuses(state);
  player.codexAttackBonus = codex.attack;
  player.codexHpBonus = codex.hp;
  player.codexPetDamageBonus = codex.petDamage;
  player.codexBossDamageBonus = codex.bossDamage;
  player.attack *= 1 + codex.attack;
  player.maxHp *= 1 + codex.hp;
  player.bossDamage = (player.bossDamage || 0) + codex.bossDamage;
  player.attackSpeed = clamp(player.attackSpeed, .34, 2.4); player.hp = clamp(prior.hp ?? player.maxHp, 0, player.maxHp); player.shield = clamp(prior.shield || 0, 0, player.maxHp*.65); player.nextExp = expFor(player.level);
  player.power = Math.floor(player.attack*8 + player.maxHp*.42 + player.defense*5 + player.crit*220 + (1/player.attackSpeed)*50 + (getPetEffectiveAttack(pet)||0)*4);
  state.player = player; return player;
}

function quality(random) { let roll = random()*100; for (const entry of BALANCE.quality) { roll -= entry.weight; if (roll <= 0) return entry; } return BALANCE.quality[0]; }
export function createEquipment(mapLevel=1, boss=false, random=Math.random) {
  const slot = Object.keys(SLOTS)[Math.floor(random()*Object.keys(SLOTS).length)];
  let tier = quality(random); if (boss && tier.id === 'common') tier = QUALITY.uncommon;
  const scale=(6+mapLevel*2.5)*tier.power*(boss?1.22:1); const stats={};
  if(slot==='weapon') stats.attack=Math.round(scale*1.9); else if(slot==='armor'){stats.maxHp=Math.round(scale*16);stats.defense=Math.round(scale*.42);} else if(slot==='helmet'){stats.defense=Math.round(scale*.48);stats.crit=+(scale*.0018).toFixed(3);} else if(slot==='gloves'){stats.attack=Math.round(scale);stats.crit=+(scale*.002).toFixed(3);} else if(slot==='boots'){stats.attackSpeed=-Math.min(.22,scale*.002);stats.defense=Math.round(scale*.18);} else if(slot==='necklace'){stats.attack=Math.round(scale*.8);stats.critDamage=+(scale*.005).toFixed(3);} else if(slot==='ring'){stats.crit=+(scale*.003).toFixed(3);stats.attack=Math.round(scale*.55);} else stats.maxHp=Math.round(scale*10);
  const names={weapon:'星痕長劍',helmet:'銀穹頭環',armor:'月紗鎧甲',gloves:'流光手甲',boots:'疾星戰靴',necklace:'星核項鍊',ring:'晨曦戒指',wings:'輝翼披風'};
  const affixes=generateEquipmentAffixes({slot,quality:tier.id,level:mapLevel,random});
  const item={id:`gear_${Date.now()}_${Math.floor(random()*1e6)}`,slot,level:mapLevel,quality:tier.id,label:tier.label,color:tier.color,name:names[slot],stats,affixes,enhance:0,locked:false,obtainedAt:Date.now()};
  item.power=calculateEquipmentPower(item); return item;
}

export function equipmentPower(item){return calculateEquipmentPower(item);}
export function compareEquipment(next,current){const keys=['attack','defense','maxHp','crit','critDamage','attackSpeed','bossDamage','normalDamage','goldBonus','expBonus'];const a=getEquipmentStatProfile(next),b=getEquipmentStatProfile(current);return {power:equipmentPower(next)-equipmentPower(current),stats:Object.fromEntries(keys.map(key=>[key,(a[key]||0)-(b[key]||0)])),affixes:{next:next?.affixes||[],current:current?.affixes||[]}};}
export function enhanceCost(item){return Math.floor(80*(item.level+1)*(1+(item.enhance||0))**1.45);}
export function enhanceChance(item){const n=item.enhance||0;if(n<3)return 1;if(n===3)return .9;if(n===4)return .85;if(n===5)return .75;if(n===6)return .65;if(n===7)return .55;if(n===8)return .45;if(n===9)return .35;return Math.max(.2,.32-(n-10)*.02);}

export function enemyFor(source, mapId, stage, boss=false) { const [name,kind,level,hp,attack,exp,gold,capturable]=source; const factor=1+(stage-1)*.12; const visual=MONSTER_VISUALS[kind]||MONSTER_VISUALS.slime; return {id:`${kind}_${Date.now()}`,name,kind,level:level+stage-1,maxHp:Math.floor(hp*factor),hp:Math.floor(hp*factor),attack:Math.floor(attack*factor),defense:Math.floor(level*.7),exp:Math.floor(exp*factor),gold:Math.floor(gold*factor),capturable,captureRate:boss?.015:.035,boss,attackSpeed:boss?1.7:2.05,hit:0,alive:true,action:'spawn',actionIn:.36,spawnIn:.36,deathIn:0,elite:false,...visual}; }
export function addExp(state,amount) { state.player.exp += Math.floor(amount); let levels=0; while(state.player.exp>=expFor(state.player.level)){state.player.exp-=expFor(state.player.level);state.player.level+=1;levels+=1;} if(levels){recompute(state);state.player.hp=state.player.maxHp;} return {levels}; }
export function petFromEnemy(enemy) { return createPetFromEnemy(enemy); }
export function dailyQuests(){return[{id:'kill50',name:'擊敗 50 隻怪物',target:50,reward:{gold:1200}},{id:'boss3',name:'擊敗 3 隻 Boss',target:3,reward:{gold:2500}},{id:'gear10',name:'獲得 10 件裝備',target:10,reward:{gold:1800}},{id:'capture1',name:'收服 1 隻怪物',target:1,reward:{gold:1600}}];}
