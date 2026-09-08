import assert from'node:assert/strict';
import{createPlayer}from'../js/player.js';
import{migrate}from'../js/migration-v19.js';
import{ALL_MAPS,mapFor,rollEnemy,equipmentDrop}from'../js/hunting.js?v=58';
import{DRAGON_MAPS,DRAGON_T7_EQUIPMENT}from'../js/dragons-v26.js?v=58';
import{equipmentTier}from'../js/equipment-progression.js?v=58';
import{calculateOffline}from'../js/offline-v19.js?v=58';

let checks=0,ok=(v,m)=>{assert.ok(v,m);checks++},eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++};
let names=['安塔瑞斯','巴拉卡斯','法利昂','林德拜爾'];
eq(DRAGON_MAPS.map(x=>x.boss),names);
eq(new Set(DRAGON_MAPS.map(x=>x.id)).size,4);
for(const map of DRAGON_MAPS){
 ok(ALL_MAPS.includes(map),`${map.boss} 地圖未公開`);
 eq(map.fee,0);ok(map.directBoss);ok(map.dragon);eq(map.normals.length,0);
 let enemy=rollEnemy({map:map.id},()=>.99);eq(enemy.name,map.boss);ok(enemy.dragon);ok(enemy.boss);ok(enemy.hp>=6400000);ok(enemy.hit>=100);ok(enemy.atk>=400);
 eq(enemy.material,`${map.boss}之心`);eq(equipmentTier(enemy.bossEntry.item),7);ok(enemy.bossEntry.item.source.boss===map.boss);
}
ok(!ALL_MAPS.filter(x=>!x.dragon).some(x=>names.includes(x.boss)),'一般地圖仍含四大龍 Boss');
ok(DRAGON_T7_EQUIPMENT.every(x=>equipmentTier(x)===7&&x.dragon));
let ordinary=migrate({player:createPlayer('普通掉落','騎士'),logs:[]}).player,ordinaryMap=mapFor(13);for(let i=0;i<10000;i++){let item=equipmentDrop(ordinary,ordinaryMap,()=>.001);ok(!item?.dragon,'一般掉落穿透 T7')}
let weak=migrate({player:createPlayer('弱者','騎士'),logs:[]}).player;weak.inTown=false;weak.map=52;let end=8e12,report=calculateOffline({player:weak,lastOnlineTimestamp:end-3600e3},end,()=>.5);eq(report.kills,0);eq(report.deaths,1);ok(report.stopped);ok(report.dropTrace.dragon);eq(report.gear.length,0);eq(Object.keys(report.materials).length,0);
console.log(JSON.stringify({suite:'V26 four dragons',checks,maps:DRAGON_MAPS.map(x=>({id:x.id,name:x.name,boss:x.boss,hp:x.dragonBoss.hp,atk:x.dragonBoss.atk,hit:x.dragonBoss.hit,ac:x.dragonBoss.ac,item:x.dragonBoss.bossEntry.item.name,tier:equipmentTier(x.dragonBoss.bossEntry.item)})),weakOffline:{kills:report.kills,deaths:report.deaths,combatSec:report.combatSec,survivalSec:report.dropTrace.survivalSeconds}}));
