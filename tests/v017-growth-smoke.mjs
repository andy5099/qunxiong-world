import fs from 'node:fs';
import { ITEMS, SAVE_VERSION, createCrimsonTiger } from '../src/data.js';
import { createState, normalize } from '../src/store.js';
import { equipItem, getFinalStats, optimizeEquipment, sellItem } from '../src/engine.js';
import { getAvailableGearCount, getNextGearTier, promoteAllGear, promoteGear } from '../src/gear-tier-system.js';
import { WORLD_BOSS_BREAKTHROUGH_COSTS, breakthroughWorldBoss, canBreakthrough, getBreakthroughProfile } from '../src/world-boss-breakthrough.js';
import { render } from '../src/ui.js';

let passed=0;const check=(v,m)=>{if(!v)throw new Error(m);passed++};const equal=(a,b,m)=>check(a===b,`${m}: ${a} !== ${b}`);
equal(SAVE_VERSION,14,'save v14');
const tigerState=createState('突破測試');tigerState.worldBoss.captured=true;tigerState.party[4]=createCrimsonTiger();tigerState.equipment['crimson-tiger'].weapon='crimsonTigerClaw';tigerState.inventory.crimsonTigerClaw=1;tigerState.worldBossMastery.exp=345;
const level=tigerState.party[4].level,exp=tigerState.party[4].exp,gear=tigerState.equipment['crimson-tiger'].weapon,mastery=tigerState.worldBossMastery.exp;
check(!canBreakthrough(tigerState),'insufficient materials blocked');
tigerState.bossProgress.talismans.legendary=6;tigerState.bossProgress.divineTalismans.advanced=12;
const base=getFinalStats(tigerState,'crimson-tiger');
for(let target=1;target<=3;target++){check(breakthroughWorldBoss(tigerState).ok,`breakthrough ${target}`);equal(tigerState.worldBoss.breakthroughLevel,target,`level ${target}`);}
check(!breakthroughWorldBoss(tigerState).ok,'breakthrough capped');
equal(tigerState.party[4].level,level,'level preserved');equal(tigerState.party[4].exp,exp,'exp preserved');equal(tigerState.equipment['crimson-tiger'].weapon,gear,'gear preserved');equal(tigerState.worldBossMastery.exp,mastery,'mastery preserved');
const boosted=getFinalStats(tigerState,'crimson-tiger');check(boosted.maxHp>base.maxHp,'hp bonus');check(boosted.might>base.might,'might bonus');check(boosted.defense>base.defense,'defense bonus');check(boosted.speed>base.speed,'speed bonus');equal(getBreakthroughProfile(3).sweepPct,.1,'skill bonus');
const reloaded=normalize(tigerState);equal(reloaded.worldBoss.breakthroughLevel,3,'breakthrough reload');equal(getFinalStats(reloaded,'crimson-tiger').might,boosted.might,'reload no double stack');

const gearState=createState('裝備測試');gearState.inventory.ironSword=9;
const fine=getNextGearTier('ironSword');check(fine&&fine.quality==='精良','normal next fine');
check(promoteGear(gearState,'ironSword').ok,'3 normal to fine');equal(gearState.inventory.ironSword,6,'normal consumed');equal(gearState.inventory[fine.id],1,'fine created');
gearState.inventory[fine.id]=3;const rare=getNextGearTier(fine.id);check(promoteGear(gearState,fine.id).ok,'3 fine to rare');equal(gearState.inventory[rare.id],1,'rare created');
gearState.inventory[rare.id]=3;const epic=getNextGearTier(rare.id);check(promoteGear(gearState,rare.id).ok,'3 rare to epic');equal(gearState.inventory[epic.id],1,'epic created');check(!getNextGearTier(epic.id),'epic cap');
equal(ITEMS[fine.id].stats.might,Math.round(ITEMS.ironSword.baseStats.might*1.2),'fine multiplier');equal(ITEMS[rare.id].stats.might,Math.round(ITEMS.ironSword.baseStats.might*1.45),'rare multiplier');equal(ITEMS[epic.id].stats.might,Math.round(ITEMS.ironSword.baseStats.might*1.8),'epic multiplier');
const protect=createState('保護');protect.inventory.ironSword=3;equipItem(protect,'hero','ironSword');equal(getAvailableGearCount(protect,'ironSword'),2,'equipped excluded');check(!promoteGear(protect,'ironSword').ok,'equipped protected');protect.inventory.ironSword=4;check(promoteGear(protect,'ironSword').ok,'three available promote');equal(protect.inventory.ironSword,1,'equipped copy remains');check(Object.values(protect.inventory).every(v=>v>=0),'no negative');
const cascade=createState('一鍵');cascade.inventory.ironSword=27;equal(promoteAllGear(cascade),13,'cascade total crafts');equal(cascade.inventory[epic.id],1,'cascade epic');equal(cascade.inventory.ironSword,0,'cascade consumes exact');
check(equipItem(cascade,'hero',epic.id).ok,'epic general equips');check(getFinalStats(cascade,'hero').might>cascade.party[0].might,'epic affects combat');optimizeEquipment(cascade);check(Object.values(cascade.equipment).some(slots=>slots.weapon===epic.id),'optimizer understands tier');
const gold=cascade.gold,epicSell=ITEMS[epic.id].sell;check(!sellItem(cascade,epic.id).ok,'equipped epic sale protected');cascade.inventory[epic.id]++;check(sellItem(cascade,epic.id).ok,'spare epic sells');equal(cascade.gold,gold+epicSell,'tier sell price');check(epicSell>ITEMS.ironSword.sell,'higher sale value');
const old=normalize({...createState('舊檔'),version:12,inventory:{ironSword:7,blackwindBlade:2,crimsonTigerClaw:1},worldBoss:{captured:true}});equal(old.inventory.ironSword,7,'old inventory preserved');equal(old.inventory.blackwindBlade,2,'boss gear preserved');equal(old.inventory.crimsonTigerClaw,1,'world gear preserved');equal(old.worldBoss.breakthroughLevel,0,'old breakthrough defaults');
old.screen='inventory';let html=render(old);check(html.includes('一鍵升階可合成裝備'),'one click UI');check(html.includes('可升階 2 次'),'stack craft count UI');old.roster=[createCrimsonTiger()];old.screen='party';html=render(old);check(html.includes('世界王突破'),'roster breakthrough UI');
equal(WORLD_BOSS_BREAKTHROUGH_COSTS[3].divineAdvanced,6,'cost centralized');
const sw=fs.readFileSync(new URL('../service-worker.js',import.meta.url),'utf8');check(sw.includes('v021-formation-puzzle'),'cache bumped');check(sw.includes('gear-tier-system.js')&&sw.includes('world-boss-breakthrough.js'),'modules cached');
console.log(`V0.1.7 growth smoke: ${passed} assertions passed.`);
