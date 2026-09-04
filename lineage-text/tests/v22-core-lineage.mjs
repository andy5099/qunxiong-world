import assert from'node:assert/strict';
import{createPlayer,derived}from'../js/player.js?v=53';
import{migrate}from'../js/migration-v19.js?v=51';
import{buy,MAX_MANUAL_BUY}from'../js/shop.js?v=53';
import{skillsFor,skillSourceDetails,activeSkill}from'../js/skills.js?v=53';
import{Combat}from'../js/combat.js?v=53';
import{calculateOffline}from'../js/offline-v19.js?v=50';
import{ITEMS}from'../js/data.js?v=53';

let checks=0,ok=(v,m)=>{assert.ok(v,m);checks++},eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++};
const make=(cls='騎士')=>migrate({saveVersion:10,player:createPlayer('V22驗收',cls),logs:[]}).player;
const seeded=seed=>()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);

// SHOP-1..6: large/custom purchases are atomic and safe.
let shop=make();shop.gold=10_000_000;let start=shop.gold;
eq(buy(shop,'銀箭',10_000),10_000);eq(shop.consumables.銀箭,10_000);eq(shop.gold,start-50_000);
eq(buy(shop,'銀箭',50_000),50_000);eq(shop.consumables.銀箭,60_000);
eq(buy(shop,'紅色藥水',5_000),5_000);eq(shop.consumables.紅色藥水,5_060);
eq(buy(shop,'米索莉箭',12_345),12_345);eq(shop.consumables.米索莉箭,12_345);
let snapshot=JSON.stringify(shop);for(const bad of[0,-1,'abc',999999999999999999999,MAX_MANUAL_BUY+1])eq(buy(shop,'銀箭',bad),false);eq(JSON.stringify(shop),snapshot);
let poor=make();poor.gold=1;let poorBefore=JSON.stringify(poor);eq(buy(poor,'銀箭',10_000),false);eq(JSON.stringify(poor),poorBefore);

// Every learnable skill has at least one concrete online/offline source row.
let skillCounts={},missingSources=[];for(const cls of['王族','騎士','妖精','法師','黑暗妖精','龍騎士','幻術士']){let list=skillsFor(make(cls));skillCounts[cls]=list.length;for(const skill of list){let rows=skillSourceDetails(skill);if(!rows.some(x=>x.mapId!==undefined&&(x.monster||x.boss)))missingSources.push(`${cls}:${skill[0]}`)}}eq(missingSources,[]);

// Multiple attack selection skips CD/MP/condition failures and falls back to normal attack.
let mage=make('法師');mage.level=60;mage.learnedSkills=['光箭','火球','冰錐'];mage.activeSkillSettings.attack=['光箭','火球','冰錐'];mage.activeSkillSettings.selectedActiveSkill='光箭';mage.mp=100;let now=2_000_000;eq(activeSkill(mage,now)?.[0],'光箭');mage.skillCooldowns.光箭=now+9999;eq(activeSkill(mage,now)?.[0],'火球');mage.skillCooldowns.火球=now+9999;eq(activeSkill(mage,now)?.[0],'冰錐');mage.mp=0;eq(activeSkill(mage,now),null);
mage.inTown=false;mage.stats.str=200;let mageState={player:mage,logs:[]},mageCombat=new Combat(mageState);mageCombat.enemy={name:'測試木樁',level:1,hp:999,maxHp:999,ac:10,atk:1,hit:1,exp:0,gold:0,size:'Small'};let hp=mageCombat.enemy.hp,oldRandom=Math.random;Math.random=()=>0;try{mageCombat.tick(2)}finally{Math.random=oldRandom}ok(mageCombat.enemy.hp<hp,'MP不足時未普通攻擊');

// Healing is independent; soul conversion and triple arrow coexist with attack settings.
let healer=make('法師');healer.level=60;healer.learnedSkills=['光箭','初級治癒術'];healer.activeSkillSettings.attack=['光箭'];healer.activeSkillSettings.heal=['初級治癒術'];healer.activeSkillSettings.healThreshold=60;healer.hp=1;healer.mp=100;let healCombat=new Combat({player:healer,logs:[]}),healBefore=healer.hp,mpBefore=healer.mp;healCombat.skillTick(healer,derived(healer),now);ok(healer.hp>healBefore);ok(healer.mp<mpBefore);ok(healer.skillCooldowns.初級治癒術>now);
let elf=make('妖精');elf.level=60;elf.learnedSkills=['三重矢','風刃','治癒術','魂體轉換'];elf.activeSkillSettings.attack=['三重矢','風刃'];elf.activeSkillSettings.selectedActiveSkill='三重矢';elf.activeSkillSettings.heal=['治癒術'];elf.activeSkillSettings.resource={'魂體轉換':false};elf.equipment.武器={...ITEMS.find(x=>x.type==='弓'),uid:'v22-bow'};elf.settings.arrowType='銀箭';elf.consumables.銀箭=10;elf.hp=derived(elf).maxHp;elf.mp=derived(elf).maxMp;let elfCombat=new Combat({player:elf,logs:[]});elfCombat.enemy={name:'測試木樁',level:1,hp:999,maxHp:999,ac:10,atk:1,hit:1,exp:0,gold:0,size:'Small'};elfCombat.skillTick(elf,derived(elf),now);eq(elf.consumables.銀箭,7);ok(elfCombat.s.logs.some(x=>x.t.includes('三重矢')));
elf.skillCooldowns={};elf.consumables.銀箭=2;elf.mp=100;elfCombat.s.logs=[];elfCombat.skillTick(elf,derived(elf),now+20_000);ok(elfCombat.s.logs.some(x=>x.t.includes('風刃')),'三重矢條件失敗後未嘗試下一招');
elf.skillCooldowns={};elf.activeSkillSettings.resource['魂體轉換']=true;elf.mp=0;elf.hp=derived(elf).maxHp;let soulHp=elf.hp;elfCombat.skillTick(elf,derived(elf),now+40_000);ok(elf.hp<soulHp&&elf.mp>0,'魂體轉換未獨立運作');

// Online/offline share learned/enabled skill constraints; offline can drop books and never buys supplies.
let offline={};for(const cls of['法師','妖精']){offline[cls]={};for(const hours of[1,4,8,17]){let p=make(cls);p.level=30;p.map=7;p.inTown=false;p.gold=1e9;p.learnedSkills=skillsFor(p).filter(x=>x[2]==='active'&&x[1]<=30).map(x=>x[0]);p.activeSkillSettings.attack=[...p.learnedSkills];for(const k of Object.keys(p.consumables))p.consumables[k]=1e6;let end=8_000_000_000_000,r=calculateOffline({player:p,lastOnlineTimestamp:end-hours*3600e3},end,seeded(hours+(cls==='法師'?100:200)));ok(r.skillBookTrace.eligibleKills>0);eq(r.purchased,{});eq(r.cost,0);if(hours===17)ok(r.books.length>0,`${cls} 17小時零技能書`);offline[cls][hours]={kills:r.kills,total:r.books.length,unique:[...new Set(r.books.map(x=>x[0]))]}}}

// Ancient Boots display replacement keeps the stable legacy item id.
let boots=ITEMS.find(x=>x.id==='黑曜長靴');ok(boots);eq(boots.name,'黑長者涼鞋');ok(!ITEMS.some(x=>x.name==='古代長靴'));

console.log(JSON.stringify({suite:'V22 core lineage',checks,shop:'SHOP-1..6 PASS',skillCounts,missingSources,offline,classicBoots:{id:boots.id,name:boots.name}}));
