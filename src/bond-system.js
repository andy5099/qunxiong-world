export const BOND_DATA = Object.freeze([
  {id:'peach-oath',name:'桃園結義',comboName:'桃園・義絕天下',requiredCharacterIds:['liu-bei','guan-yu','zhang-fei'],minimumActiveCount:2,triggerType:['break','powerMax'],effectType:'tripleCombo',cooldown:14,priority:3,visualTheme:'peach',description:'軍陣、青龍斬與破陣重撞合流。',hint:'三名義兄弟'},
  {id:'ten-thousand',name:'萬人敵',comboName:'萬人敵・雙雄夾擊',requiredCharacterIds:['guan-yu','zhang-fei'],minimumActiveCount:2,triggerType:['power3','powerMax','perfectCounter'],effectType:'pincerBreak',cooldown:10,priority:4,visualTheme:'jadeImpact',description:'Power 或完美反擊後左右夾擊。',hint:'兩名萬人敵'},
  {id:'zhaolie-spirit',name:'昭烈軍心',comboName:'昭烈・龍膽突陣',requiredCharacterIds:['liu-bei','hero'],minimumActiveCount:1,triggerType:['perfectCounter','danger'],effectType:'commandDash',cooldown:10,priority:1,visualTheme:'gold',description:'危急或完美操作時軍陣救場並加速追擊。',hint:'仁德之主與無名勇將'},
  {id:'yellow-heaven',name:'黃天當立',comboName:'黃天・雷陣反擊',requiredCharacterIds:['zhang-bao','yellow-captain','yellow-commander'],minimumActiveCount:2,triggerType:['perfectCounter','break'],effectType:'counterStorm',cooldown:13,priority:2,visualTheme:'thunderGold',description:'護陣、追殺與落雷組成反擊鏈。',hint:'三名黃巾將領'},
  {id:'yellow-vanguard',name:'黃巾雙鋒',comboName:'黃巾・守殺連陣',requiredCharacterIds:['yellow-captain','yellow-commander'],minimumActiveCount:1,triggerType:['bossLow','telegraph'],effectType:'guardHunt',cooldown:9,priority:1,visualTheme:'yellow',description:'擋下危險強襲後立刻追殺。',hint:'黃巾的盾與鋒'},
  {id:'blackwind-thunder',name:'黑風雷陣',comboName:'黑風・雷壁亂舞',requiredCharacterIds:['blackwind-lord','zhang-bao'],minimumActiveCount:1,triggerType:['wallCombo'],effectType:'wallStorm',cooldown:11,priority:4,visualTheme:'darkThunder',description:'高連擊撞牆蓄雷，最後風雷合擊。',hint:'黑風與雷法'},
  {id:'fire-thunder',name:'雷火天災',comboName:'雷火・天災滅陣',requiredCharacterIds:['crimson-tiger','nether-thunder-beast'],minimumActiveCount:1,triggerType:['powerMax','break'],effectType:'worldCataclysm',cooldown:17,priority:3,visualTheme:'fireThunder',description:'兩大世界王交錯穿擊，維持 Combo 並引爆雷火。',hint:'兩頭天災世界王'},
  {id:'saint-thunder',name:'武聖雷引',comboName:'武聖・引雷斬',requiredCharacterIds:['guan-yu','zhang-bao'],minimumActiveCount:1,triggerType:['weak'],effectType:'weakLightning',cooldown:9,priority:5,visualTheme:'jadeThunder',description:'武聖命中弱點後引落追擊雷。',hint:'青龍刀光引動天雷'}
]);

import { getBondAwakeningBonus } from './equipment-awakening.js?v=v027-divine-awakening-1';

export function normalizeBondState(raw={}){
  return {discovered:[...new Set(Array.isArray(raw.discovered)?raw.discovered.filter(id=>BOND_DATA.some(b=>b.id===id)):[])],codex:{...(raw.codex||{})}};
}

export function getActiveBonds(party=[]){
  const ids=new Set(party.filter(Boolean).map(unit=>unit.id));
  const activeIds=new Set(party.slice(0,3).filter(Boolean).map(unit=>unit.id));
  return BOND_DATA.filter(bond=>bond.requiredCharacterIds.every(id=>ids.has(id))&&bond.requiredCharacterIds.filter(id=>activeIds.has(id)).length>=bond.minimumActiveCount);
}

export function discoverActiveBonds(state){
  state.bonds=normalizeBondState(state.bonds);
  const discovered=[];
  for(const bond of getActiveBonds(state.party)){if(!state.bonds.discovered.includes(bond.id)){state.bonds.discovered.push(bond.id);state.bonds.codex[bond.id]={discoveredAt:Date.now()};discovered.push(bond);}}
  if(discovered.length)state.notice=`【新羈絆發現！】${discovered.map(b=>b.name).join('、')}`;
  return discovered;
}

export function getFormableBonds(party,candidate,slot){const next=party.slice();next[slot]=candidate;const before=new Set(getActiveBonds(party).map(b=>b.id));return getActiveBonds(next).filter(b=>!before.has(b.id));}

export function initializeBondRuntime(state,marble){
  discoverActiveBonds(state);
  const active=getActiveBonds(state.party);
  marble.bonds={active:active.map(b=>b.id),cooldowns:{},queue:[],running:null,triggerSerials:{},wallHits:0,lastPerfectCounters:marble.stats?.perfectCounters||0,lastBreaks:marble.stats?.breaks||0,lastPowerMax:marble.stats?.powerLevels?.[3]||0,lastWeakHits:0};
  return marble.bonds;
}

const eligible=(bond,state,marble,boss)=>{
  const rt=marble.bonds,stats=marble.stats||{},signals=[];
  if((stats.breaks||0)>(rt.lastBreaks||0))signals.push('break');
  if((stats.powerLevels?.[3]||0)>(rt.lastPowerMax||0))signals.push('powerMax');
  if((stats.powerLevels?.[2]||0)>0&&marble.formationActive?.tier>=3)signals.push('power3');
  if((stats.perfectCounters||0)>(rt.lastPerfectCounters||0))signals.push('perfectCounter');
  if((rt.lastWeakHits||0)>0)signals.push('weak');
  if((marble.combo||0)>=30&&(rt.wallHits||0)>0)signals.push('wallCombo');
  if(boss.hp/boss.maxHp<.4)signals.push('bossLow');
  if((marble.bossTelegraph||0)>0)signals.push('telegraph');
  const living=state.party.filter(unit=>unit&&unit.hp>0),avg=living.reduce((sum,u)=>sum+u.hp/Math.max(1,u.maxHp),0)/Math.max(1,living.length);if(avg<.45)signals.push('danger');
  return bond.triggerType.some(type=>signals.includes(type));
};

function cappedDamage(battle,boss,raw,hits){const cap=battle.worldBoss?Math.max(1,Math.floor(boss.maxHp*.045)):Infinity,each=Math.max(1,Math.min(cap,Math.round(raw/hits)));let total=0;for(let i=0;i<hits&&boss.hp>0;i++){const damage=Math.min(boss.hp,each);boss.hp-=damage;total+=damage;}return total;}

export function executeBondCombo(state,bond){
  const battle=state.battle,marble=battle?.marble,boss=battle?.enemies.find(e=>e.boss&&e.hp>0);if(!marble||!boss)return 0;
  const units=bond.requiredCharacterIds.map(id=>state.party.find(u=>u?.id===id)).filter(Boolean),might=units.reduce((sum,u)=>sum+(Number(u.might)||1),0),legendary=units.filter(u=>u.individualQuality==='legendary'),talents=new Set(units.map(u=>u.individualTalent).filter(Boolean));let hits=3,multiplier=2.2;
  if(bond.effectType==='tripleCombo'){hits=5;multiplier=2.5;marble.breakGauge=Math.min(100,marble.breakGauge+32);for(const unit of state.party.filter(u=>u&&u.hp>0)){unit.hp=Math.min(unit.maxHp,unit.hp+Math.round(unit.maxHp*.04));}marble.skills.forEach(s=>{if(s)s.energy=Math.min(100,s.energy+10);});}
  if(bond.effectType==='pincerBreak'){hits=3;multiplier=2.25;marble.breakGauge=Math.min(100,marble.breakGauge+26);}
  if(bond.effectType==='commandDash'){hits=2;multiplier=1.55;marble.assistIn=0;marble.skills.forEach(s=>{if(s)s.energy=Math.min(100,s.energy+18);});for(const unit of state.party.filter(u=>u&&u.hp>0))unit.hp=Math.min(unit.maxHp,unit.hp+Math.round(unit.maxHp*.07));}
  if(bond.effectType==='counterStorm'){hits=6;multiplier=2.15;marble.supportGuard=1;marble.breakGauge=Math.min(100,marble.breakGauge+22);}
  if(bond.effectType==='guardHunt'){hits=3;multiplier=1.8;marble.supportGuard=1;}
  if(bond.effectType==='wallStorm'){hits=7;multiplier=2.15;marble.combo=Math.max(marble.combo,30)+hits;marble.comboTime=3;}
  if(bond.effectType==='worldCataclysm'){hits=8+(talents.has('thunderChain')?1:0)+(talents.has('netherLightning')?2:0);multiplier=2.45+legendary.length*.22+(talents.has('wildfire')?.12:0);boss.marbleBurn=Math.max(boss.marbleBurn||0,talents.has('heavenBlood')?4:3);marble.combo+=hits;marble.comboTime=4;marble.climaxTime=Math.max(marble.climaxTime,1.5+(talents.has('heavenBlood')?.4:0));}
  if(bond.effectType==='weakLightning'){hits=3;multiplier=1.8;}
  const awakening=getBondAwakeningBonus(state,bond.id);hits+=awakening.extraHits;multiplier*=awakening.multiplier;if(awakening.extraHits)marble.effects.push({type:'awakening-bond',x:marble.boss.x,y:marble.boss.y+28,text:'神裝羈絆進化！',life:1});
  const damage=cappedDamage(battle,boss,might*multiplier,hits);marble.shot.damage=(marble.shot.damage||0)+damage;marble.camera.shake=Math.max(marble.camera.shake||0,.3);marble.hitStop=Math.max(marble.hitStop||0,.08);marble.effects.push({type:`bond-${bond.visualTheme}`,bondId:bond.id,participants:units.map(unit=>unit.id),x:marble.boss.x,y:marble.boss.y+48,text:`${bond.name}・${bond.comboName}`,life:1.3});marble.effects.push({type:'bond-damage',x:marble.boss.x,y:marble.boss.y+75,text:`-${damage}`,life:1});marble.lastProgressAt=Date.now();return damage;
}

export function updateBondScheduler(state,dt){
  const battle=state.battle,marble=battle?.marble,boss=battle?.enemies.find(e=>e.boss&&e.hp>0);if(!marble||!boss||battle.finished)return null;
  const rt=marble.bonds||initializeBondRuntime(state,marble);for(const id of Object.keys(rt.cooldowns))rt.cooldowns[id]=Math.max(0,rt.cooldowns[id]-dt);
  for(const id of rt.active){const bond=BOND_DATA.find(b=>b.id===id);if(!bond||rt.cooldowns[id]>0||rt.queue.includes(id)||rt.running?.id===id)continue;if(eligible(bond,state,marble,boss))rt.queue.push(id);}
  rt.lastPerfectCounters=marble.stats?.perfectCounters||0;rt.lastBreaks=marble.stats?.breaks||0;rt.lastPowerMax=marble.stats?.powerLevels?.[3]||0;rt.lastWeakHits=0;
  if(rt.running){rt.running.time-=dt;if(rt.running.time<=0)rt.running=null;return null;}
  if((marble.schedulerCooldown||0)>0||!rt.queue.length)return null;
  rt.queue.sort((a,b)=>(BOND_DATA.find(x=>x.id===a)?.priority||9)-(BOND_DATA.find(x=>x.id===b)?.priority||9));const id=rt.queue.shift(),bond=BOND_DATA.find(b=>b.id===id);if(!bond)return null;rt.running={id,time:Math.min(2.2,.75+bond.requiredCharacterIds.length*.3)};rt.cooldowns[id]=bond.cooldown;executeBondCombo(state,bond);marble.schedulerCooldown=.45;return bond;
}

export function noteBondEvent(marble,type){if(!marble?.bonds)return;if(type==='wall')marble.bonds.wallHits=(marble.bonds.wallHits||0)+1;if(type==='weak')marble.bonds.lastWeakHits=(marble.bonds.lastWeakHits||0)+1;}

export function clearBondRuntime(marble){if(!marble)return;marble.bonds=null;}
