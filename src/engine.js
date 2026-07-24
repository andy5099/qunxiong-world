import {byId} from './data.js';
const qualityOrder=['白','綠','藍','紫','橙','紅','神話','遠古'];
const random=list=>list[Math.floor(Math.random()*list.length)];
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const log=(state,text,rare=false)=>{state.log.push(`${rare?'✨ ':''}${text}`);state.log=state.log.slice(-120);};
const needed=level=>80+level*45;
function gainExp(state,amount){state.player.exp+=amount;while(state.player.exp>=needed(state.player.level)){state.player.exp-=needed(state.player.level);state.player.level++;state.player.maxHp+=24;state.player.maxMp+=6;state.player.attack+=4;state.player.defense+=2;state.player.hp=state.player.maxHp;state.player.mp=state.player.maxMp;log(state,`升至 ${state.player.level} 級，能力全面提升！`,true);}}
function addItem(state,item){
  if(item.type==='裝備'&&item.quality==='白'&&state.exploration.autoSellWhite){state.player.gold+=item.price;log(state,`自動出售 ${item.name}，獲得 ${item.price} 金。`);return;}
  if(item.type==='裝備'&&state.exploration.autoDismantle&&qualityOrder.indexOf(item.quality)<=1){const entry=state.inventory.find(x=>x.id==='material-1');entry?entry.quantity++:state.inventory.push({id:'material-1',quantity:1});log(state,`自動分解 ${item.name}。`);return;}
  const entry=state.inventory.find(x=>x.id===item.id);entry?entry.quantity++:state.inventory.push({id:item.id,quantity:1});
  log(state,`獲得【${item.name}】（${item.quality||'普通'}）`,qualityOrder.indexOf(item.quality)>=3);
}
function usePotion(state,data){const entry=state.inventory.find(x=>x.id==='potion'&&x.quantity>0);if(!entry)return false;entry.quantity--;state.player.hp=Math.min(state.player.maxHp,state.player.hp+(byId(data.items,'potion')?.heal||80));log(state,'自動使用行軍藥。');return true;}
function createEnemy(state,data){
  const map=byId(data.maps,state.mapId),bossRoll=Math.random()<.09;
  const base=bossRoll?byId(data.bosses,map.boss):byId(data.monsters,random(map.monsters));
  const weather=map.weather;state.weather=weather;
  return {...base,maxHp:base.hp,hp:base.hp,isBoss:bossRoll,attack:base.attack||30,defense:base.defense||10,speed:base.speed||10};
}
function heroRecord(state,id){return state.heroes.find(hero=>(typeof hero==='string'?hero:hero.id)===id);}
function combatBonuses(state,data){
  const artifact=state.activeArtifact?byId(data.artifacts,state.activeArtifact):null,artifactState=artifact?state.artifacts[artifact.id]:null;
  const soul=state.activeSoul?state.bossSouls.find(entry=>entry.id===state.activeSoul):null;
  const artifactScale=artifactState?(artifactState.level||1)*(artifactState.awakened?2:1):0;
  return {attack:(artifact?.attack||0)*artifactScale+(soul?.attack||0)*(soul?.rank||1),defense:(artifact?.defense||0)*artifactScale+(soul?.defense||0)*(soul?.rank||1),speed:(artifact?.speed||0)*artifactScale};
}
function playerDamage(state,enemy,data){
  const owned=state.heroes[0],hero=owned?byId(data.heroes,typeof owned==='string'?owned:owned.id):null,progress=hero?heroRecord(state,hero.id):null,skill=hero?byId(data.skills,hero.skill):byId(data.skills,'skill-1'),bonus=combatBonuses(state,data);
  const useSkill=state.player.mp>=skill.mp&&Math.random()<.65;if(useSkill)state.player.mp-=skill.mp;
  let modifier=useSkill?skill.power/100:1;if(state.weather==='雷雨'&&skill.name.startsWith('雷'))modifier*=1.25;
  const heroScale=progress?1+(progress.level-1)*.025+progress.breakthrough*.12+progress.rebirth*.3:1;
  const critical=Math.random()<.12,damage=Math.max(1,Math.round((state.player.attack+bonus.attack+(hero?.might||0)*.15*heroScale)*modifier*(critical?1.7:1)-enemy.defense*.45));
  log(state,`${hero?.name||state.player.name}${useSkill?`使用【${skill.name}】`:'發動攻擊'}${critical?'，暴擊！':''}造成 ${damage} 傷害。`,critical);
  return damage;
}
function enemyDamage(state,enemy,data){const skill=enemy.mechanic&&Math.random()<.25?enemy.mechanic:null,bonus=combatBonuses(state,data),damage=Math.max(1,Math.round(enemy.attack*(skill?1.45:1)-(state.player.defense+bonus.defense)*.55));log(state,`${enemy.name}${skill?`觸發【${skill}】`:'反擊'}，造成 ${damage} 傷害。`);return damage;}
function subdueBoss(state,enemy){
  if(!enemy.isBoss)return;const world=enemy.type==='世界頭目',difficulty=state.exploration.dungeonDifficulty;
  const chance=(world?0.08:0.25)+({普通:.04,困難:.07,地獄:.1,深淵:.15}[difficulty]||0);
  if(Math.random()>chance){log(state,`${enemy.name} 的戰魂消散，收服失敗。`);return;}
  const existing=state.bossSouls.find(soul=>soul.id===enemy.id);
  if(existing){existing.seals=(existing.seals||0)+1;log(state,`再次收服 ${enemy.name}，獲得 1 枚魂印。`,true);}
  else{state.bossSouls.push({id:enemy.id,name:enemy.name,level:1,rank:1,seals:0,attack:Math.max(3,Math.round(enemy.attack*.15)),defense:Math.max(2,Math.round(enemy.defense*.15))});log(state,`成功收服戰魂【${enemy.name}】！`,true);}
}
function win(state,data){
  const enemy=state.exploration.enemy;state.exploration.kills++;if(enemy.isBoss)state.exploration.bosses++;
  const exp=enemy.exp||enemy.level*35,gold=enemy.gold||enemy.level*22;gainExp(state,exp);state.player.gold+=gold;
  log(state,`戰鬥勝利！獲得 ${exp} EXP、${gold} 金。`,enemy.isBoss);
  const dropId=random(enemy.drops||[]);const item=byId(data.items,dropId);if(item)addItem(state,item);
  subdueBoss(state,enemy);
  if(Math.random()<.04){const ownedIds=new Set(state.heroes.map(h=>typeof h==='string'?h:h.id)),candidates=data.heroes.filter(h=>h.level<=state.player.level+10&&!ownedIds.has(h.id));const hero=random(candidates);if(hero){state.heroes.push({id:hero.id,level:1,breakthrough:0,rebirth:0,skillLevel:1});log(state,`隱藏武將 ${hero.name} 願意加入隊伍！`,true);}}
  if(state.exploration.dungeonId){const dungeon=byId(data.dungeons,state.exploration.dungeonId);state.dungeon.completions[dungeon.id]=(state.dungeon.completions[dungeon.id]||0)+1;state.player.gold+=dungeon.rewardGold;const artifactId=`artifact-${(data.dungeons.indexOf(dungeon)%5)+1}`,current=state.artifacts[artifactId]||{level:0,shards:0,awakened:false};current.shards+=dungeon.rewardShards;state.artifacts[artifactId]=current;log(state,`副本通關！額外獲得 ${dungeon.rewardGold} 金與 ${dungeon.rewardShards} 枚神器碎片。`,true);state.exploration.running=false;state.exploration.dungeonId=null;state.exploration.dungeonDifficulty=null;}
  state.exploration.enemy=null;state.exploration.phase='reward';
}
export function step(state,data){
  const ex=state.exploration;if(!ex.running)return;
  if(state.player.hp/state.player.maxHp*100<=ex.returnBelow){ex.running=false;ex.phase='idle';state.player.hp=Math.ceil(state.player.maxHp*.7);state.player.mp=state.player.maxMp;log(state,'體力過低，自動返回城池休整。');return;}
  if(state.inventory.reduce((n,x)=>n+x.quantity,0)>=ex.bagLimit){ex.running=false;ex.phase='idle';log(state,'背包已滿，自動返回城池。');return;}
  if(state.player.hp/state.player.maxHp*100<=ex.healBelow&&ex.autoHeal)usePotion(state,data);
  if(!ex.enemy){ex.count++;ex.enemy=createEnemy(state,data);ex.phase='battle';log(state,`你進入${byId(data.maps,state.mapId).name}，遭遇${ex.enemy.isBoss?'首領 ':''}${ex.enemy.name}！`,ex.enemy.isBoss);return;}
  const enemy=ex.enemy,playerFirst=state.player.speed>=enemy.speed;
  if(playerFirst){enemy.hp=clamp(enemy.hp-playerDamage(state,enemy,data),0,enemy.maxHp);if(!enemy.hp)return win(state,data);}
  state.player.hp=clamp(state.player.hp-enemyDamage(state,enemy,data),0,state.player.maxHp);
  if(!state.player.hp){ex.running=false;ex.phase='idle';state.player.hp=Math.ceil(state.player.maxHp*.5);log(state,'隊伍戰敗，被巡邏隊救回城中。');return;}
  if(!playerFirst){enemy.hp=clamp(enemy.hp-playerDamage(state,enemy,data),0,enemy.maxHp);if(!enemy.hp)return win(state,data);}
}
export function start(state){state.exploration.running=true;state.exploration.phase='explore';log(state,'開始自動探索。');}
export function stop(state){state.exploration.running=false;state.exploration.phase='idle';log(state,'已停止自動探索。');}
export function equip(state,data,id){const item=byId(data.items,id);if(!item||item.type!=='裝備')return;state.equipment[item.slot]=id;log(state,`已裝備 ${item.name}。`);}
export function trainHero(state,id){const hero=heroRecord(state,id);if(!hero)return;const cost=100+hero.level*40;if(state.player.gold<cost)return;state.player.gold-=cost;hero.level++;log(state,`武將訓練完成，提升至 Lv.${hero.level}。`);}
export function breakthroughHero(state,id){const hero=heroRecord(state,id),need=(hero.breakthrough+1)*10,cost=(hero.breakthrough+1)*600;if(!hero||hero.level<need||state.player.gold<cost)return;state.player.gold-=cost;hero.breakthrough++;log(state,`武將突破至 ${hero.breakthrough} 階！`,true);}
export function rebirthHero(state,id){const hero=heroRecord(state,id);if(!hero||hero.level<50||hero.breakthrough<5||state.player.gold<5000)return;state.player.gold-=5000;hero.level=1;hero.breakthrough=0;hero.rebirth++;log(state,`武將完成第 ${hero.rebirth} 次轉生！`,true);}
export function evolveArtifact(state,id){const current=state.artifacts[id]||{level:0,shards:0,awakened:false},need=(current.level+1)*5;if(current.shards<need||current.level>=5)return;current.shards-=need;current.level++;state.artifacts[id]=current;if(!state.activeArtifact)state.activeArtifact=id;log(state,`神器進化至 ${current.level} 階。`,true);}
export function awakenArtifact(state,id){const current=state.artifacts[id];if(!current||current.level<5||current.shards<30||current.awakened)return;current.shards-=30;current.awakened=true;state.activeArtifact=id;log(state,'神器覺醒成功，能力效果翻倍！',true);}
export function setArtifact(state,id){if(state.artifacts[id]?.level>0)state.activeArtifact=id;}
export function startDungeon(state,data,id){const dungeon=byId(data.dungeons,id),base=byId(data.bosses,dungeon?.boss);if(!dungeon||!base||state.player.level<dungeon.level)return false;const hp=Math.round(base.hp*dungeon.hpMultiplier);state.exploration.enemy={...base,hp,maxHp:hp,attack:Math.round(base.attack*dungeon.statMultiplier),defense:Math.round(base.defense*dungeon.statMultiplier),isBoss:true};state.exploration.dungeonId=id;state.exploration.dungeonDifficulty=dungeon.difficulty;state.exploration.running=true;state.exploration.phase='battle';state.screen='home';log(state,`進入【${dungeon.chapter}·${dungeon.difficulty}】，${base.name} 現身！`,true);return true;}
export function setSoul(state,id){if(state.bossSouls.some(soul=>soul.id===id))state.activeSoul=id;}
export function strengthenSoul(state,id){const soul=state.bossSouls.find(entry=>entry.id===id),cost=soul?300+soul.level*80:Infinity;if(!soul||state.player.gold<cost)return;state.player.gold-=cost;soul.level++;soul.attack++;if(soul.level%3===0)soul.defense++;log(state,`${soul.name} 戰魂提升至 Lv.${soul.level}。`);}
export function rankSoul(state,id){const soul=state.bossSouls.find(entry=>entry.id===id);if(!soul||soul.seals<2||soul.rank>=5)return;soul.seals-=2;soul.rank++;log(state,`${soul.name} 戰魂升至 ${soul.rank} 階！`,true);}
