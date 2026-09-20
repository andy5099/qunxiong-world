import assert from'node:assert/strict';
import{createPlayer,derived}from'../js/player.js?v=65';
import{weaponDamage}from'../js/combat.js?v=65';
import{TREASURE_DREAM_WEAPONS,TREASURE_DREAM_ARMOR}from'../js/treasure-v30.js?v=65';
import{TRANSFORMATIONS,ATTACK_SPEED_CAP}from'../js/transformations.js?v=65';
import{BOSS_CATALOG}from'../js/systems.js';
const enemy={name:'標準怪',size:'Large'},boss={...enemy,boss:true},dragon={...boss,dragon:true},classes=['王族','騎士','妖精','法師','黑暗妖精','龍騎士','幻術士'],rows=[];
for(const cls of classes){let p=createPlayer(cls,cls);p.level=80;p.stats={str:40,dex:40,con:30,int:40,wis:30,cha:15};let nw=TREASURE_DREAM_WEAPONS.find(x=>x.classes.includes(cls)),old=BOSS_CATALOG.map(x=>x.item).filter(x=>x.type===nw.type&&(!x.classes||x.classes.includes(cls))).sort((a,b)=>(b.small+b.large)-(a.small+a.large))[0];p.equipment.武器={...old,enhance:7};let oldD=weaponDamage(p,enemy,()=>.5)*derived(p).speed*60;p.equipment.武器={...nw,enhance:7};let newD=weaponDamage(p,enemy,()=>.5)*derived(p).speed*60;assert.ok(newD>oldD,`${nw.name} must beat ${old.name}`);rows.push({cls,weapon:nw.name,old:Math.round(oldD),next:Math.round(newD),gain:+((newD/oldD-1)*100).toFixed(1)})}
let knight=createPlayer('測試','騎士'),slayer=TREASURE_DREAM_WEAPONS.find(x=>x.name==='屠龍劍');knight.level=80;knight.equipment.武器=slayer;let normal=weaponDamage(knight,enemy,()=>.5),bd=weaponDamage(knight,boss,()=>.5),dd=weaponDamage(knight,dragon,()=>.5);assert.ok(normal<bd&&bd<dd);
let speeds=[0,3,5,10,15,20].map(n=>{knight.rebirthCount=n;let t=n?TRANSFORMATIONS.find(x=>x.requiredRebirth===n):null;knight.transformState=t?{id:t.id,until:Date.now()+1e6}:{id:null,until:0};let speed=derived(knight).speed;return{rebirth:n,speed,attacks:Math.floor(speed*60)}});for(let i=1;i<speeds.length;i++)assert.ok(speeds[i].attacks>speeds[i-1].attacks);assert.ok(speeds.at(-1).speed<=ATTACK_SPEED_CAP);for(const set of['戰神','神射','賢者'])assert.equal(TREASURE_DREAM_ARMOR.filter(x=>x.treasureSet===set).length,6);
console.table(rows);console.table(speeds);console.log('V65 PASS',{normal,bd,dd,armor:TREASURE_DREAM_ARMOR.length});
