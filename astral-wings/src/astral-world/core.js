import { BALANCE, QUALITY, SLOTS } from './data.js';

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const format = value => value >= 1e9 ? `${(value/1e9).toFixed(1)}B` : value >= 1e6 ? `${(value/1e6).toFixed(1)}M` : value >= 1000 ? `${(value/1000).toFixed(1)}K` : Math.floor(value).toLocaleString();
export const expFor = level => Math.floor(55 * level ** 1.36 + level * 28);

export function basePlayer(level = 1) {
  return { name:'星界冒險者', className:'星刃使', level, exp:0, nextExp:expFor(level), hp:150+(level-1)*24, maxHp:150+(level-1)*24, attack:20+(level-1)*5, defense:5+(level-1)*1.4, crit:.05, critDamage:1.5, attackSpeed:BALANCE.attackInterval, shield:0, gold:0, diamonds:0, power:0 };
}

export function recompute(state) {
  const prior = state.player || basePlayer();
  const player = basePlayer(prior.level || 1);
  player.name = prior.name || player.name; player.exp = prior.exp || 0; player.gold = prior.gold || 0; player.diamonds = prior.diamonds || 0;
  for (const item of Object.values(state.equipped || {})) for (const [key,value] of Object.entries(item?.stats || {})) player[key] = (player[key] || 0) + value;
  const pet = state.pets?.find(entry => entry.id === state.activePetId);
  if (pet) { player.attack += pet.attack * (1 + (pet.stars - 1) * .08); player.maxHp += pet.hpBonus || 0; }
  player.attackSpeed = clamp(player.attackSpeed, .34, 2.4); player.hp = clamp(prior.hp ?? player.maxHp, 0, player.maxHp); player.shield = clamp(prior.shield || 0, 0, player.maxHp*.65); player.nextExp = expFor(player.level);
  player.power = Math.floor(player.attack*8 + player.maxHp*.42 + player.defense*5 + player.crit*220 + (1/player.attackSpeed)*50 + (pet?.attack||0)*4);
  state.player = player; return player;
}

function quality(random) { let roll = random()*100; for (const entry of BALANCE.quality) { roll -= entry.weight; if (roll <= 0) return entry; } return BALANCE.quality[0]; }
export function createEquipment(mapLevel=1, boss=false, random=Math.random) {
  const slot = Object.keys(SLOTS)[Math.floor(random()*Object.keys(SLOTS).length)];
  let tier = quality(random); if (boss && tier.id === 'common') tier = QUALITY.uncommon;
  const scale=(6+mapLevel*2.5)*tier.power*(boss?1.22:1); const stats={};
  if(slot==='weapon') stats.attack=Math.round(scale*1.9); else if(slot==='armor'){stats.maxHp=Math.round(scale*16);stats.defense=Math.round(scale*.42);} else if(slot==='helmet'){stats.defense=Math.round(scale*.48);stats.crit=+(scale*.0018).toFixed(3);} else if(slot==='gloves'){stats.attack=Math.round(scale);stats.crit=+(scale*.002).toFixed(3);} else if(slot==='boots'){stats.attackSpeed=-Math.min(.22,scale*.002);stats.defense=Math.round(scale*.18);} else if(slot==='necklace'){stats.attack=Math.round(scale*.8);stats.critDamage=+(scale*.005).toFixed(3);} else if(slot==='ring'){stats.crit=+(scale*.003).toFixed(3);stats.attack=Math.round(scale*.55);} else stats.maxHp=Math.round(scale*10);
  const names={weapon:'星痕長劍',helmet:'銀穹頭環',armor:'月紗鎧甲',gloves:'流光手甲',boots:'疾星戰靴',necklace:'星核項鍊',ring:'晨曦戒指',wings:'輝翼披風'};
  return {id:`gear_${Date.now()}_${Math.floor(random()*1e6)}`,slot,level:mapLevel,quality:tier.id,label:tier.label,color:tier.color,name:names[slot],stats,power:Math.floor(Object.values(stats).reduce((sum,v)=>sum+Math.abs(v)*(typeof v==='number'&&Math.abs(v)<1?220:4),0)),locked:false,obtainedAt:Date.now()};
}

export function enemyFor(source, mapId, stage, boss=false) { const [name,kind,level,hp,attack,exp,gold,capturable]=source; const factor=1+(stage-1)*.12; return {id:`${kind}_${Date.now()}`,name,kind,level:level+stage-1,maxHp:Math.floor(hp*factor),hp:Math.floor(hp*factor),attack:Math.floor(attack*factor),defense:Math.floor(level*.7),exp:Math.floor(exp*factor),gold:Math.floor(gold*factor),capturable,captureRate:boss?.015:.035,boss,attackSpeed:boss?1.7:2.05,hit:0,alive:true}; }
export function addExp(state,amount) { state.player.exp += Math.floor(amount); let levels=0; while(state.player.exp>=expFor(state.player.level)){state.player.exp-=expFor(state.player.level);state.player.level+=1;levels+=1;} if(levels){recompute(state);state.player.hp=state.player.maxHp;} return {levels}; }
export function petFromEnemy(enemy) { return {id:`pet_${enemy.kind}`,source:enemy.name,name:enemy.name,quality:enemy.boss?'epic':'rare',level:1,exp:0,stars:1,attack:Math.max(4,Math.floor(enemy.attack*(enemy.boss?.3:.18))),hpBonus:Math.floor(enemy.maxHp*.05)}; }
export function dailyQuests(){return[{id:'kill50',name:'擊敗 50 隻怪物',target:50,reward:{gold:1200}},{id:'boss3',name:'擊敗 3 隻 Boss',target:3,reward:{gold:2500}},{id:'gear10',name:'獲得 10 件裝備',target:10,reward:{gold:1800}},{id:'capture1',name:'收服 1 隻怪物',target:1,reward:{gold:1600}}];}
