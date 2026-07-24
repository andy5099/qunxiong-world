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
function playerDamage(state,enemy,data){
  const hero=state.heroes.length?byId(data.heroes,state.heroes[0]):null,skill=hero?byId(data.skills,hero.skill):byId(data.skills,'skill-1');
  const useSkill=state.player.mp>=skill.mp&&Math.random()<.65;if(useSkill)state.player.mp-=skill.mp;
  let modifier=useSkill?skill.power/100:1;if(state.weather==='雷雨'&&skill.name.startsWith('雷'))modifier*=1.25;
  const critical=Math.random()<.12,damage=Math.max(1,Math.round((state.player.attack+(hero?.might||0)*.15)*modifier*(critical?1.7:1)-enemy.defense*.45));
  log(state,`${hero?.name||state.player.name}${useSkill?`使用【${skill.name}】`:'發動攻擊'}${critical?'，暴擊！':''}造成 ${damage} 傷害。`,critical);
  return damage;
}
function enemyDamage(state,enemy){const skill=enemy.mechanic&&Math.random()<.25?enemy.mechanic:null,damage=Math.max(1,Math.round(enemy.attack*(skill?1.45:1)-state.player.defense*.55));log(state,`${enemy.name}${skill?`觸發【${skill}】`:'反擊'}，造成 ${damage} 傷害。`);return damage;}
function win(state,data){
  const enemy=state.exploration.enemy;state.exploration.kills++;if(enemy.isBoss)state.exploration.bosses++;
  const exp=enemy.exp||enemy.level*35,gold=enemy.gold||enemy.level*22;gainExp(state,exp);state.player.gold+=gold;
  log(state,`戰鬥勝利！獲得 ${exp} EXP、${gold} 金。`,enemy.isBoss);
  const dropId=random(enemy.drops||[]);const item=byId(data.items,dropId);if(item)addItem(state,item);
  if(Math.random()<.04){const candidates=data.heroes.filter(h=>h.level<=state.player.level+10&&!state.heroes.includes(h.id));const hero=random(candidates);if(hero){state.heroes.push(hero.id);log(state,`隱藏武將 ${hero.name} 願意加入隊伍！`,true);}}
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
  state.player.hp=clamp(state.player.hp-enemyDamage(state,enemy),0,state.player.maxHp);
  if(!state.player.hp){ex.running=false;ex.phase='idle';state.player.hp=Math.ceil(state.player.maxHp*.5);log(state,'隊伍戰敗，被巡邏隊救回城中。');return;}
  if(!playerFirst){enemy.hp=clamp(enemy.hp-playerDamage(state,enemy,data),0,enemy.maxHp);if(!enemy.hp)return win(state,data);}
}
export function start(state){state.exploration.running=true;state.exploration.phase='explore';log(state,'開始自動探索。');}
export function stop(state){state.exploration.running=false;state.exploration.phase='idle';log(state,'已停止自動探索。');}
export function equip(state,data,id){const item=byId(data.items,id);if(!item||item.type!=='裝備')return;state.equipment[item.slot]=id;log(state,`已裝備 ${item.name}。`);}
