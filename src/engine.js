import {byId} from './data.js';
const random=list=>list[Math.floor(Math.random()*list.length)],clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const qualities=['普通','優良','稀有','史詩','傳說','神器'],qualityRank=q=>qualities.indexOf(q);
const captureItems={'capture-normal':{name:'普通收服符',bonus:.1},'capture-advanced':{name:'高級收服符',bonus:.25},'capture-legendary':{name:'傳說收服符',bonus:.45}};
let gearSequence=0;const uid=()=>`eq-${Date.now().toString(36)}-${++gearSequence}-${Math.random().toString(36).slice(2,9)}`;
function log(state,text,category='normal'){
  const mode=state.exploration.logMode;if(mode==='rare'&&!['rare','boss','capture','level'].includes(category))return;if(mode==='compact'&&category==='minor')return;
  state.log.push(text);state.log=state.log.slice(-100);
}
const needed=level=>70+level*40;
function gainExp(state,amount){state.player.exp+=amount;while(state.player.exp>=needed(state.player.level)){state.player.exp-=needed(state.player.level);state.player.level++;state.player.maxHp+=22;state.player.maxMp+=5;state.player.attack+=4;state.player.defense+=2;state.player.hp=state.player.maxHp;state.player.mp=state.player.maxMp;log(state,`✨ 升至 Lv.${state.player.level}！`,'level');}}
function mapOf(state,data){return byId(data.huntmaps,state.mapId)||data.huntmaps[0];}
export function isMapUnlocked(state,map,data){
  const u=map.unlock||{};if(state.player.level<(u.level||1)||state.exploration.kills<(u.kills||0))return false;
  if(u.previousBoss&&!state.mapProgress[previousMapId(u.previousBoss,data)]?.bossDefeated)return false;
  if(u.capturedBoss&&!state.bossPartners.some(b=>b.id===u.capturedBoss))return false;
  return true;
}
function previousMapId(bossId,data){return data.huntmaps.find(map=>map.boss===bossId)?.id;}
function affixTotal(state,id){return Object.values(state.equipment).map(instanceId=>state.inventory.gear.find(g=>g.instanceId===instanceId)).filter(Boolean).flatMap(g=>g.affixes).filter(a=>a.id===id).reduce((n,a)=>n+a.value,0);}
export function playerStats(state){
  const gear=Object.values(state.equipment).map(id=>state.inventory.gear.find(g=>g.instanceId===id)).filter(Boolean);
  const baseAttack=state.player.attack+gear.reduce((n,g)=>n+(g.baseStats.attack||0),0),baseDefense=state.player.defense+gear.reduce((n,g)=>n+(g.baseStats.defense||0),0);
  return {attack:Math.round(baseAttack*(1+affixTotal(state,'attackPct')/100)),defense:Math.round(baseDefense*(1+affixTotal(state,'defensePct')/100)),speed:state.player.speed+affixTotal(state,'speed'),captureBonus:affixTotal(state,'captureRate')/100,bossDamage:affixTotal(state,'bossDamage')/100};
}
function rollQuality(){const r=Math.random();return r<.48?'普通':r<.73?'優良':r<.88?'稀有':r<.96?'史詩':r<.99?'傳說':'神器';}
function rollGear(template,data,level){
  const quality=rollQuality(),count=[0,1,2,3,4,4][qualityRank(quality)],pool=[...data.affixes].sort(()=>Math.random()-.5).slice(0,count);
  return {instanceId:uid(),templateId:template.id,name:template.name,slot:template.slot,quality,level,baseStats:{attack:template.attack||0,defense:template.defense||0},affixes:pool.map(a=>({...a,value:Math.floor(a.min+Math.random()*(a.max-a.min+1))})),special:quality==='神器'?'狩獵時有 5% 機率追加一次攻擊':null,locked:false,obtainedAt:Date.now()};
}
function awardGear(state,data,map,forceRare=false){
  const template=byId(data.items,random(map.exclusiveDrops))||random(data.items.filter(i=>i.type==='裝備'));let gear=rollGear(template,data,state.player.level);
  if(forceRare&&qualityRank(gear.quality)<2){gear={...gear,quality:'稀有',affixes:[...data.affixes].slice(0,2).map(a=>({...a,value:a.min}))};}
  const autoRank=qualityRank(state.exploration.autoSellQuality);if(!gear.locked&&autoRank>=0&&qualityRank(gear.quality)<=autoRank){state.player.gold+=template.price||20;log(state,`自動出售${gear.quality}裝備【${gear.name}】。`);return;}
  state.inventory.gear.push(gear);if(qualityRank(gear.quality)>=2){state.latestRare=gear;log(state,`✨ 一道${gear.quality==='稀有'?'藍色':'耀眼'}光芒落下！獲得${gear.quality}裝備【${gear.name}】！`,'rare');}
}
function createEnemy(state,data){
  const map=mapOf(state,data),progress=state.mapProgress[map.id],bossReady=progress.kills>=map.bossThreshold;
  let base,type='normal';
  if(bossReady){base=byId(data.huntbosses,map.boss);type='boss';}
  else if(state.exploration.streak>=50&&Math.random()<.08){base=byId(data.huntbosses,map.hiddenBoss);type='hiddenBoss';}
  else if(Math.random()<.1){base=byId(data.huntmonsters,map.elite);type='elite';}
  else base=byId(data.huntmonsters,random(map.normal));
  const level=base.level,hp=base.hp||70+level*30;
  return {...base,type,isBoss:type.includes('Boss')||type==='boss',isElite:type==='elite',hp,maxHp:hp,attack:base.attack||10+level*3,defense:base.defense||4+level*1.5,speed:base.speed||8+level*.6,captureLocked:false,enraged:false};
}
function partnerAttack(state,enemy){
  const partner=state.bossPartners.find(b=>b.id===state.activeBoss);if(!partner)return;
  const damage=Math.max(1,Math.round(partner.attack*(1+partner.stars*.12)-enemy.defense*.25));enemy.hp=Math.max(1,enemy.hp-damage);partner.exp=(partner.exp||0)+4;
  if(partner.exp>=partner.level*30){partner.exp=0;partner.level++;partner.attack+=2;partner.defense++;}
  log(state,`${partner.name} 使用【${partner.activeSkill}】，造成 ${damage} 傷害。`,'minor');
}
function playerAttack(state,enemy){
  const stats=playerStats(state),useSkill=state.player.mp>=6;if(useSkill)state.player.mp-=6;
  let damage=Math.max(1,Math.round(stats.attack*(useSkill?1.45:1)*(enemy.isBoss?1+stats.bossDamage:1)-enemy.defense*.45));if(Math.random()<.12)damage=Math.round(damage*1.7);
  const floor=enemy.isBoss&&!enemy.captureLocked?Math.ceil(enemy.maxHp*.19):0;enemy.hp=Math.max(floor,enemy.hp-damage);log(state,`你${useSkill?'施展破陣擊':'普通攻擊'}，造成 ${damage} 傷害。`,'minor');
}
function enemyAttack(state,enemy,multiplier=1){const stats=playerStats(state),damage=Math.max(1,Math.round(enemy.attack*multiplier-stats.defense*.5));state.player.hp=Math.max(0,state.player.hp-damage);log(state,`${enemy.name} 反擊，造成 ${damage} 傷害。`,'minor');}
function addStack(state,id,count=1){state.inventory.stacks[id]=(state.inventory.stacks[id]||0)+count;}
function defeat(state,data,captured=false){
  const ex=state.exploration,enemy=ex.enemy,map=mapOf(state,data),progress=state.mapProgress[map.id];
  ex.kills++;if(enemy.isBoss){ex.bosses++;progress.kills=0;progress.bossDefeated=true;ex.streak=0;}else{progress.kills++;ex.streak++;}
  gainExp(state,(enemy.level||1)*(enemy.isBoss?35:enemy.isElite?14:8));state.player.gold+=(enemy.level||1)*(enemy.isBoss?25:enemy.isElite?10:5);
  if(enemy.isElite&&Math.random()<.25)addStack(state,'capture-normal');if(Math.random()<(enemy.isBoss?1:.28))awardGear(state,data,map,ex.count<25);
  log(state,captured?`收服成功，${enemy.name} 成為 Boss 夥伴！`:`擊敗${enemy.isBoss?' Boss ':''}【${enemy.name}】！`,enemy.isBoss?'boss':'normal');
  ex.enemy=null;ex.captureReady=false;ex.phase='reward';
}
function captureBase(rarity){return {普通:.35,精英:.2,稀有:.1,傳說:.03}[rarity]||.2;}
function rankBonus(rank){return {'青銅獵人':0,'白銀獵人':.03,'黃金獵人':.06,'白金獵人':.09,'王者獵人':.12,'傳說獵人':.15}[rank]||0;}
export function captureChance(state,itemId){
  const enemy=state.exploration.enemy;if(!enemy?.isBoss)return 0;const ratio=enemy.hp/enemy.maxHp,hpBonus=ratio<=.05?.25:ratio<=.1?.15:.05,first=state.bossPartners.some(b=>b.id===enemy.id)?0:.05;
  return clamp(captureBase(enemy.rarity)+hpBonus+(captureItems[itemId]?.bonus||0)+rankBonus(state.player.hunterRank)+playerStats(state).captureBonus+first,.01,.9);
}
function partnerFrom(enemy){return {id:enemy.id,name:enemy.name,rarity:enemy.rarity,role:enemy.role,level:1,exp:0,stars:1,hp:enemy.maxHp,attack:Math.max(8,Math.round(enemy.attack*.35)),defense:Math.max(4,Math.round(enemy.defense*.35)),speed:enemy.speed,activeSkill:enemy.activeSkill,passiveSkill:enemy.passiveSkill,seals:0,captures:1,deployed:false};}
export function attemptCapture(state,data,itemId=state.exploration.captureItem){
  const ex=state.exploration,enemy=ex.enemy;if(!enemy?.isBoss||!ex.captureReady)return false;
  if((state.inventory.stacks[itemId]||0)<=0){log(state,'收服符不足。','capture');return false;}state.inventory.stacks[itemId]--;
  const chance=captureChance(state,itemId);log(state,`對【${enemy.name}】使用${captureItems[itemId].name}，收服率 ${Math.round(chance*100)}%。`,'capture');
  if(Math.random()<chance){
    const existing=state.bossPartners.find(b=>b.id===enemy.id),seals={普通:1,精英:2,稀有:3,傳說:5}[enemy.rarity]||1;
    if(existing){existing.seals+=seals;existing.captures++;log(state,`重複收服轉為 ${seals} 枚魂印！`,'capture');}else state.bossPartners.push(partnerFrom(enemy));
    defeat(state,data,true);return true;
  }
  const outcomes=['counter','heal','enrage','escape','continue'],result=random(outcomes);log(state,'收服失敗！','capture');
  if(result==='counter')enemyAttack(state,enemy,1.5);if(result==='heal'){enemy.hp=Math.min(enemy.maxHp,enemy.hp+Math.round(enemy.maxHp*.1));log(state,`${enemy.name} 恢復 10% 生命。`,'capture');}
  if(result==='enrage'){enemy.attack=Math.round(enemy.attack*1.3);enemy.enraged=true;log(state,`${enemy.name} 陷入狂暴，攻擊提升 30%！`,'capture');}
  if(result==='escape'){log(state,`${enemy.name} 逃離戰場。`,'capture');ex.enemy=null;ex.captureReady=false;state.mapProgress[mapOf(state,data).id].kills=0;}
  if(ex.captureFailAction==='escape'){ex.enemy=null;ex.captureReady=false;}else if(ex.enemy){enemy.captureLocked=true;ex.captureReady=false;}
  return false;
}
function updateHunterRank(state){const captured=state.bossPartners.length,stars=state.bossPartners.reduce((n,b)=>n+b.stars,0),kills=state.exploration.kills,bosses=state.exploration.bosses,level=state.player.level;const ranks=[['傳說獵人',60,1000,40,8,20],['王者獵人',45,600,25,6,14],['白金獵人',30,350,15,4,9],['黃金獵人',20,180,8,3,6],['白銀獵人',10,60,3,1,2]];for(const [name,l,k,b,c,s] of ranks)if(level>=l&&kills>=k&&bosses>=b&&captured>=c&&stars>=s){state.player.hunterRank=name;return;}state.player.hunterRank='青銅獵人';}
export function step(state,data){
  const ex=state.exploration;if(!ex.running)return;if(state.player.hp/state.player.maxHp*100<=ex.returnBelow){ex.running=false;state.player.hp=Math.ceil(state.player.maxHp*.7);state.player.mp=state.player.maxMp;log(state,'生命過低，自動返回安全地點。');return;}
  if(ex.autoHeal&&state.player.hp/state.player.maxHp*100<=ex.healBelow&&(state.inventory.stacks.potion||0)>0){state.inventory.stacks.potion--;state.player.hp=Math.min(state.player.maxHp,state.player.hp+80);}
  if(state.inventory.gear.length>=ex.bagLimit){ex.running=false;log(state,'背包已滿，自動狩獵停止。');return;}
  if(!ex.enemy){ex.count++;ex.enemy=createEnemy(state,data);ex.phase='battle';if(ex.enemy.isBoss){log(state,`⚠️ Boss【${ex.enemy.name}】出現！`,'boss');if(ex.stopOnBoss&&!ex.autoChallengeBoss){ex.running=false;}}return;}
  const enemy=ex.enemy;if(ex.captureReady)return;if(enemy.isBoss&&enemy.hp/enemy.maxHp<=.2&&!enemy.captureLocked){ex.captureReady=true;log(state,`【${enemy.name}】生命低於 20%，進入可收服狀態！`,'capture');if(ex.autoCapture){const owned=state.bossPartners.some(b=>b.id===enemy.id);if((!owned||ex.captureDuplicates)&&(!ex.captureNewOnly||!owned)){attemptCapture(state,data);return;}}return;}
  playerAttack(state,enemy);partnerAttack(state,enemy);if(enemy.hp<=0||enemy.captureLocked&&enemy.hp<=1){defeat(state,data);updateHunterRank(state);return;}enemyAttack(state,enemy);
  if(!state.player.hp){ex.running=false;state.player.hp=Math.ceil(state.player.maxHp*.5);log(state,'戰敗後返回安全地點，等級與裝備不受影響。','boss');}
}
export function start(state){if(state.exploration.running)return false;state.exploration.running=true;log(state,'開始自動狩獵。');return true;}
export function stop(state){state.exploration.running=false;log(state,'已停止自動狩獵。');}
export function continueAttack(state){const enemy=state.exploration.enemy;if(enemy){enemy.captureLocked=true;state.exploration.captureReady=false;enemy.hp=Math.max(1,enemy.hp);}}
export function abandonCapture(state){continueAttack(state);}
export function selectMap(state,map,data){if(!isMapUnlocked(state,map,data))return false;state.mapId=map.id;return true;}
export function equipInstance(state,id){const gear=state.inventory.gear.find(g=>g.instanceId===id);if(gear)state.equipment[gear.slot]=id;}
export function unequip(state,slot){delete state.equipment[slot];}
export function toggleLock(state,id){const gear=state.inventory.gear.find(g=>g.instanceId===id);if(gear)gear.locked=!gear.locked;}
export function sellGear(state,id){const index=state.inventory.gear.findIndex(g=>g.instanceId===id&&!g.locked&&!Object.values(state.equipment).includes(g.instanceId));if(index<0)return;const [gear]=state.inventory.gear.splice(index,1);state.player.gold+=20+gear.level*5+qualityRank(gear.quality)*20;}
export function deployBoss(state,id){state.activeBoss=id;state.bossPartners.forEach(b=>b.deployed=b.id===id);}
export function trainBoss(state,id){const boss=state.bossPartners.find(b=>b.id===id),cost=boss?200+boss.level*60:Infinity;if(!boss||state.player.gold<cost)return;state.player.gold-=cost;boss.level++;boss.attack+=2;boss.defense++;boss.hp+=12;}
export function starBoss(state,id){const boss=state.bossPartners.find(b=>b.id===id),needs=[0,2,5,10,20][boss?.stars||0];if(!boss||boss.stars>=5||boss.seals<needs)return;boss.seals-=needs;boss.stars++;}
export {qualities,captureItems};
