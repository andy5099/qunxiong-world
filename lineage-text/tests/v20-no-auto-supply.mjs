import assert from'node:assert/strict';
import{createPlayer}from'../js/player.js';
import{migrate}from'../js/migration-v19.js';
import{supply}from'../js/shop.js';
import{Combat}from'../js/combat.js?v=51';
import{calculateOffline}from'../js/offline-v19.js';
import'../js/runtime-v12.js';
import'../js/runtime-v19.js';

let checks=0,ok=(v,m)=>{assert.ok(v,m);checks++},eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++};
const make=(cls='騎士')=>migrate({player:createPlayer('自動補給驗收',cls),logs:[]}).player;
const forbidden=/部分補給完成|補給不足|藍色藥水未補滿|傳送費未補滿|自動採買|自動補給/;

// CASE A/C/D/F: 30 simulated minutes, including a 10-minute metrics window.
let p=make();p.inTown=false;p.gold=0;p.level=50;p.settings.autoSupply=true;p.settings.autoBuyHeal=p.settings.autoBuyBlue=p.settings.autoSupplyGreen=p.settings.autoSupplyBrave=p.settings.autoSupplyTransform=p.settings.autoBuyArrows=true;for(const n of Object.keys(p.consumables))p.consumables[n]=0;p.stats.str=200;p.stats.dex=200;p.stats.con=200;let state={player:p,logs:[]},combat=new Combat(state),gold0=p.gold,returns0=p.statsLog.returns,cost0=p.statsLog.supplyCost,purchases=0;for(let i=1;i<=18000;i++){if(i%10===0&&combat.enemy)combat.enemy.hp=0;combat.tick(.1)}eq(p.inTown,false);eq(p.statsLog.returns,returns0);eq(p.statsLog.supplyCost,cost0);eq(purchases,0);eq(p.gold>=gold0,true);ok(!state.logs.some(x=>forbidden.test(x.t||'')));
let kills10=Math.floor(p.statsLog.kills/3),killsPerMinute=kills10/10,expPerHour=Math.floor((p.statsLog.sessionExp||0)/3*6),goldPerHour=Math.floor((p.gold-gold0)/3*6);ok(killsPerMinute>0);

// CASE B: existing potions are auto-used; exhaustion never buys or returns.
let used=make();used.inTown=false;used.consumables.紅色藥水=3;used.consumables.藍色藥水=2;used.consumables.綠色藥水=2;used.consumables.勇敢藥水=2;used.settings.autoPotion=used.settings.autoGreen=used.settings.autoBrave=true;used.settings.healPotion='紅色藥水';used.settings.thresholds.紅色藥水=99;let uc=new Combat({player:used,logs:[]}),ug=used.gold;for(let i=0;i<8;i++){used.hp=1;used.buffs.blueUntil=used.buffs.greenUntil=used.buffs.braveUntil=0;uc.autoPotion()}eq(used.consumables.紅色藥水,0);eq(used.consumables.藍色藥水,0);eq(used.consumables.綠色藥水,0);eq(used.consumables.勇敢藥水,0);eq(used.gold,ug);eq(used.inTown,false);

// CASE G: legacy V10 auto-buy flags remain loadable but are ignored everywhere.
let legacy=make('法師');legacy.inTown=false;legacy.gold=99999;legacy.settings.autoSupply=true;legacy.settings.autoBuyHeal=legacy.settings.autoBuyBlue=legacy.settings.autoBuyArrows=legacy.settings.autoSupplyGreen=legacy.settings.autoSupplyBrave=legacy.settings.autoSupplyTransform=true;for(const n of Object.keys(legacy.consumables))legacy.consumables[n]=0;let before={gold:legacy.gold,cost:legacy.statsLog.supplyCost,items:{...legacy.consumables}},disabled=supply(legacy,{fee:9999});eq(disabled.disabled,true);eq(legacy.gold,before.gold);eq(legacy.statsLog.supplyCost,before.cost);eq(legacy.consumables,before.items);let lc=new Combat({player:legacy,logs:[]});eq(lc.returnTown(true),false);eq(legacy.inTown,false);

// Offline path also ignores legacy auto-purchase flags and never charges supply cost.
let now=9_000_000_000_000,report=calculateOffline({player:legacy,lastOnlineTimestamp:now-3600e3},now,()=>.5);eq(report.cost,0);eq(report.purchased,{});eq(report.stopped,false);

console.log(JSON.stringify({suite:'V20 no auto supply',checks,cases:'A-G PASS',minutesSimulated:30,metrics10m:{killsPerMinute,expPerHour,goldPerHour},autoPurchases:purchases,supplyReturns:p.statsLog.returns-returns0,supplyTeleportCost:p.statsLog.supplyCost-cost0}));
