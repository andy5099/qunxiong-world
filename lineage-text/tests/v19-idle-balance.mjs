import assert from'node:assert/strict';
import{createPlayer,weight}from'../js/player.js';
import{migrate}from'../js/migration-v19.js';
import{CONSUMABLES,ITEMS}from'../js/data.js';
import{supply}from'../js/shop.js';
import{BALANCE_CONFIG,expReward,goldReward}from'../js/balance-config.js';
import{calculateOffline}from'../js/offline-v19.js';
import{addItem}from'../js/inventory.js';
import{Combat}from'../js/combat.js?v=38';
import'../js/runtime-v19.js';
let checks=0,ok=(v,m)=>{assert.ok(v,m);checks++},eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++};
const make=()=>migrate({player:createPlayer('掛機驗收','騎士'),logs:[]}).player;

// CASE A: legacy auto-purchase flags are ignored.
let partial=make();partial.gold=500;partial.settings.autoSell=false;partial.settings.autoBuyHeal=true;partial.settings.autoBuyBlue=true;partial.settings.autoSupplyGreen=true;partial.settings.autoSupplyBrave=true;partial.settings.autoSupplyTransform=false;partial.settings.target.紅色藥水=100;partial.settings.target.藍色藥水=20;partial.settings.target.綠色藥水=20;partial.settings.target.勇敢藥水=20;let goldBefore=partial.gold,itemsBefore={...partial.consumables},a=supply(partial,{fee:0});ok(a.ok);ok(a.disabled);eq(a.cost,0);eq(partial.gold,goldBefore);eq(partial.consumables,itemsBefore);

// CASE B: zero gold never makes supply or auto hunt stop.
let zero=make();zero.gold=0;zero.settings.autoSell=false;for(const n of Object.keys(zero.consumables))zero.consumables[n]=0;let b=supply(zero,{fee:999});ok(b.ok);ok(b.disabled);zero.inTown=false;let cs={player:zero,logs:[]},combat=new Combat(cs);eq(combat.returnTown(true),false);eq(zero.inTown,false);ok(combat.enemy);

// CASE C: no carry restriction with large mixed inventory.
let heavy=make();for(let i=0;i<2000;i++)addItem(heavy,{...ITEMS[i%ITEMS.length],id:`bulk-${i}`});heavy.consumables.紅色藥水=1e7;heavy.bossMaterials.測試材料=1e7;heavy.bag.push({uid:'book',instanceId:'book',kind:'book',name:'技能書',count:999});eq(weight(heavy).current,0);eq(weight(heavy).max,Infinity);eq(heavy.bag.length,2001);

// CASE D/E: product and legacy settings are removed safely.
ok(!('魔力藥水'in CONSUMABLES));let legacy=createPlayer('舊檔','法師');legacy.consumables.魔力藥水=77;legacy.consumables.magicPotion=3;legacy.settings.autoBuyMana=true;legacy.settings.autoManaPotion=true;legacy.settings.target.魔力藥水=50;legacy.settings.autoBuyBlue=false;legacy.consumables.紅色藥水=123;legacy=migrate({player:legacy,logs:[]}).player;ok(!('魔力藥水'in legacy.consumables));ok(!('magicPotion'in legacy.consumables));ok(!('autoBuyMana'in legacy.settings));eq(legacy.settings.autoBuyBlue,false);eq(legacy.consumables.紅色藥水,123);

// CASE F/G/H: single centralized reward source and no multiplier stacking.
let oldGold=BALANCE_CONFIG.goldRate,oldExp=BALANCE_CONFIG.expRate,oldBoss=BALANCE_CONFIG.bossGoldRate;BALANCE_CONFIG.goldRate=1;let normal1=Array.from({length:1000},()=>goldReward(10)).reduce((a,v)=>a+v,0)/1000;BALANCE_CONFIG.goldRate=3;let normal3=Array.from({length:1000},()=>goldReward(10)).reduce((a,v)=>a+v,0)/1000;eq(normal3/normal1,3);BALANCE_CONFIG.expRate=1;let exp1=expReward(100);BALANCE_CONFIG.expRate=2;let exp2=expReward(100);eq(exp2/exp1,2);BALANCE_CONFIG.expRate=1;BALANCE_CONFIG.bossGoldRate=1.3;eq(goldReward(100,{boss:true})/(100*10),3.9);BALANCE_CONFIG.goldRate=oldGold;BALANCE_CONFIG.expRate=oldExp;BALANCE_CONFIG.bossGoldRate=oldBoss;
const formalAverage=(goldRate,boss=false)=>{BALANCE_CONFIG.goldRate=goldRate;let p=make();p.inTown=false;p.gold=0,p.statsLog.sessionGold=0;let c=new Combat({player:p,logs:[]}),random=Math.random;Math.random=()=>.99;try{for(let i=0;i<1000;i++){c.enemy={name:'正式倍率怪',level:1,hp:0,maxHp:1,ac:10,atk:1,hit:1,exp:0,gold:10,size:'Small',boss};c.win()}}finally{Math.random=random}return p.gold/1000};let formal1=formalAverage(1),formal3=formalAverage(3);eq(formal3/formal1,3);BALANCE_CONFIG.bossGoldRate=1.3;let formalBoss=formalAverage(3,true);eq(formalBoss/(10*10),3.9);BALANCE_CONFIG.goldRate=oldGold;BALANCE_CONFIG.expRate=oldExp;BALANCE_CONFIG.bossGoldRate=oldBoss;

// CASE I: offline uses the same core rates once, with only offline modifiers extra.
let off=make();off.level=30;off.inTown=false;off.map=1;off.gold=1e8;off.settings.autoGreen=off.settings.autoBrave=false;let now=9_000_000_000_000,report=calculateOffline({player:off,lastOnlineTimestamp:now-3600e3},now,()=>.5);ok(report.kills>0);let averageBaseGold=21;ok(report.gross/report.kills>averageBaseGold*10*2.5);ok(!('魔力藥水'in(report.consumed||{})));ok(!('魔力藥水'in(report.purchased||{})));

console.log(JSON.stringify({suite:'V19 idle balance',checks,cases:'A-I PASS',gold:{before:formal1,after:formal3,ratio:formal3/formal1,boss:formalBoss,bossMultiplier:formalBoss/(10*10)},config:BALANCE_CONFIG}));
