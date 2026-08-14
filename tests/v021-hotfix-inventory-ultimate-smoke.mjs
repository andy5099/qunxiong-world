import assert from 'node:assert/strict';
import { createState, normalize } from '../src/store.js';
import { ITEMS } from '../src/data.js';
import { render } from '../src/ui.js';
import { createBossEncounter, createWorldBossEncounter, armMarbleUltimate, commitMarbleLaunch, resolveMarbleEvent } from '../src/engine.js';
import { MARBLE_ULTIMATES, getMarbleUltimate, getUltimateEnergy } from '../src/marble-battle.js';

let passed=0;const check=(v,m)=>{assert.ok(v,m);passed++;};const equal=(a,b,m)=>{assert.deepEqual(a,b,m);passed++;};const zero=()=>0;

const inventory=createState('背包測試');inventory.screen='inventory';
for(const item of Object.values(ITEMS).filter(item=>item.type==='equipment').slice(0,8))inventory.inventory[item.id]=4;
const inventoryHtml=render(inventory);
check(inventoryHtml.includes('inventory-panel'),'backpack renders');
check(inventoryHtml.includes('quick:')&&inventoryHtml.includes('inspect:')&&inventoryHtml.includes('sell:'),'backpack actions render');
check(inventoryHtml.includes('optimize-equipment'),'one click best renders');
const migrated=normalize({...inventory,party:inventory.party.map((m,i)=>m?{...m,ultimateEnergy:i?150:'bad'}:m)});
equal(migrated.party[0].ultimateEnergy,0,'bad legacy energy repaired');equal(migrated.party[1].ultimateEnergy,100,'energy clamped');

check(Object.keys(MARBLE_ULTIMATES).length>=10,'all ten character ultimates exist');
equal(new Set(Object.values(MARBLE_ULTIMATES).map(x=>x.name)).size,Object.keys(MARBLE_ULTIMATES).length,'ultimate names unique');
equal(new Set(Object.values(MARBLE_ULTIMATES).map(x=>x.effect)).size,Object.keys(MARBLE_ULTIMATES).length,'ultimate roles unique');

const normal=createState('全力測試');normal.screen='stronghold';normal.unlocks.stronghold=true;normal.ui.bossWarning=true;normal.ui.bossRarityRank=1;createBossEncounter(normal,1);
const hero=normal.party[0],boss=normal.battle.enemies.find(e=>e.boss);hero.ultimateEnergy=100;
check(armMarbleUltimate(normal),'ready ultimate arms');
commitMarbleLaunch(normal,{vx:0,vy:-700,power:1});equal(hero.ultimateEnergy,0,'valid ultimate consumes energy');
check(normal.battle.marble.shot.ultimate,'shot marked ultimate');
const hp=boss.hp;const result=resolveMarbleEvent(normal,{type:'boss',weak:true,speed:700},zero);check(result.damage>0&&boss.hp<hp,'ultimate deals real damage');

const low=createState('低蓄力');low.screen='stronghold';low.unlocks.stronghold=true;low.ui.bossWarning=true;low.ui.bossRarityRank=1;createBossEncounter(low,1);low.party[0].ultimateEnergy=100;armMarbleUltimate(low);commitMarbleLaunch(low,{vx:0,vy:-100,power:.2});equal(low.party[0].ultimateEnergy,100,'low power does not consume ultimate');check(!low.battle.marble.shot.ultimate,'low power becomes normal shot');

const charge=createState('充能');charge.screen='stronghold';charge.unlocks.stronghold=true;charge.ui.bossWarning=true;charge.ui.bossRarityRank=1;createBossEncounter(charge,1);resolveMarbleEvent(charge,{type:'boss',weak:true,speed:500},zero);equal(getUltimateEnergy(charge.party[0]),27,'boss and weak point energy stack');
charge.battle.marble.combo=2;resolveMarbleEvent(charge,{type:'boss',weak:false,speed:500},zero);equal(getUltimateEnergy(charge.party[0]),50,'three hit bonus energy');

const oneShot=createState('一擊擊破');oneShot.screen='stronghold';oneShot.unlocks.stronghold=true;oneShot.ui.bossWarning=true;oneShot.ui.bossRarityRank=1;createBossEncounter(oneShot,1);oneShot.party[0].might=99999;oneShot.party[0].ultimateEnergy=100;const weakBoss=oneShot.battle.enemies.find(e=>e.boss);weakBoss.hp=weakBoss.maxHp=50;armMarbleUltimate(oneShot);commitMarbleLaunch(oneShot,{vx:0,vy:-720,power:1});resolveMarbleEvent(oneShot,{type:'boss',weak:true,speed:720},zero);equal(weakBoss.hp,0,'normal boss can be one-shot by ultimate');

for(const id of ['crimson-tiger','nether-thunder-beast']){const s=createState(id);s.screen='stronghold';s.unlocks.stronghold=true;s.ui.bossWarning=true;s.ui.bossRarityRank=1;s.party[0]={...s.party[0],id,name:id,might:99999,ultimateEnergy:100};createBossEncounter(s,1);const t=s.battle.enemies.find(e=>e.boss);t.hp=t.maxHp=50;armMarbleUltimate(s);commitMarbleLaunch(s,{vx:0,vy:-720,power:1});resolveMarbleEvent(s,{type:'boss',weak:true,speed:720},zero);equal(t.hp,0,`${id} ultimate one-shot assertion`);}

const world=createState('世界王上限');world.worldBoss.unlocked=true;createWorldBossEncounter(world,'crimsonTiger');world.party[0].might=999999;world.party[0].ultimateEnergy=100;const worldTarget=world.battle.enemies[0],worldBefore=worldTarget.hp;armMarbleUltimate(world);commitMarbleLaunch(world,{vx:0,vy:-720,power:1});resolveMarbleEvent(world,{type:'boss',weak:true,speed:720},zero);check(worldBefore-worldTarget.hp<=Math.floor(worldTarget.maxHp*.24),'world boss ultimate cap is 24 percent');
check(render({...normal,screen:'inventory',battle:null}).includes('inventory-panel'),'backpack opens after boss battle cleanup');
check(getMarbleUltimate({id:'guan-yu'}).name.includes('青龍'),'unified ultimate lookup');

console.log(`V0.2.1 hotfix smoke: ${passed} assertions passed.`);
