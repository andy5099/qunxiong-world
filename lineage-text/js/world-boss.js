import{WORLD_BOSSES}from'./data.js?v=21';import{derived}from'./player.js?v=21';import{addItem}from'./inventory.js?v=21';
export function worldStatus(now=Date.now()){return WORLD_BOSSES.map((b,i)=>{let cycle=b.interval*1000,start=Math.floor(now/cycle)*cycle,end=start+1800000,active=now<end;return{...b,active,remaining:active?end-now:start+cycle-now}})}
export function fightWorldBoss(p,id,rng=Math.random){p.worldBoss??={};let b=WORLD_BOSSES.find(x=>x.id===id),d=derived(p);if(!b)return{win:false};let dps=Math.max(1,(p.equipment.武器?.small||2)+(p.equipment.武器?.enhance||0)+p.stats.str*.4)*d.speed,time=b.hp/dps,survive=d.maxHp+Object.values(p.consumables).reduce((n,v)=>n+v*20,0)>b.atk*time/2.5,win=survive&&((d.melee+d.ranged)/2)>b.hit*.58;if(win){let gold=Math.floor((b.atk+b.hit)*1000);p.gold+=gold;p.statsLog.goldEarned+=gold;p.worldMaterials[b.material]=(p.worldMaterials[b.material]||0)+1;p.statsLog.worldBosses++;if(rng()<.01)addItem(p,b.weapon,true)}p.worldBoss[id]={attempts:(p.worldBoss[id]?.attempts||0)+1,wins:(p.worldBoss[id]?.wins||0)+(win?1:0)};return{win,time,b}}



