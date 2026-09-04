import assert from'node:assert/strict';
import{createPlayer,derived}from'../js/player.js';
import{migrate}from'../js/migration.js';
import{Combat}from'../js/combat.js';
import{ITEMS}from'../js/data.js';
import{HUNTING_MAPS,SUMMON_TYPES}from'../js/systems.js';
import{manaRegenPerSecond}from'../js/magic-v18.js';
import{addItem,equip,countInstanceId}from'../js/inventory.js';
import{petWin,summon,summonStatus,companionHits}from'../js/companions.js';
import{calculateOffline}from'../js/offline.js';
let checks=0,ok=(v,m)=>{assert.ok(v,m);checks++},eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++};
const make=cls=>migrate({player:createPlayer(cls,cls),logs:[]}).player;
const enemy=()=>({name:'循環測試怪',level:15,hp:99999,maxHp:99999,ac:10,atk:1,hit:1,exp:1,gold:1,size:'Small'});

// Monster identity is stable and late zones no longer inflate every normal to 60+.
let orcs=HUNTING_MAPS.flatMap(m=>m.normals).filter(x=>x.name==='妖魔戰士');eq(new Set(orcs.map(x=>x.level)).size,1);ok(Math.max(...HUNTING_MAPS.flatMap(m=>m.normals).map(x=>x.level))<=50);ok(HUNTING_MAPS.at(-1).normals.every(x=>x.hp<1000));

// CASE A mage: shared regen, blue buff, multiple attacks, healing, low-MP fallback.
let mage=make('法師');mage.level=50;mage.learnedSkills=['光箭','火球','冰錐','初級治癒術'];mage.activeSkillSettings.attack=['光箭','火球','冰錐'];mage.activeSkillSettings.heal='初級治癒術';mage.inTown=false;mage.mp=100;mage.hp=derived(mage).maxHp;let state={player:mage,logs:[]},combat=new Combat(state);combat.enemy=enemy();let plain=manaRegenPerSecond(mage),blue=manaRegenPerSecond(mage,{blue:true});ok(blue>plain);for(let i=0;i<18;i++)combat.skillTick(mage,derived(mage),1000+i*1000);let casts=new Set(state.logs.filter(x=>/造成/.test(x.t)).map(x=>x.t.match(/【([^】]+)/)?.[1]).filter(Boolean));ok(casts.size>=2);mage.hp=1;mage.mp=100;mage.skillCooldowns['初級治癒術']=0;combat.skillTick(mage,derived(mage),999999);ok(mage.hp>1);mage.mp=0;let beforeHp=combat.enemy.hp;combat.skillTick(mage,derived(mage),2000000);eq(combat.enemy.hp,beforeHp);mage.pcd=0;combat.tick(.1);ok(state.logs.some(x=>/你造成|沒有命中/.test(x.t)));

// CASE B elf: triple arrow, soul conversion, heal and normal bow attack coexist.
let elf=make('妖精');elf.level=40;elf.learnedSkills=['三重矢','魂體轉換','治癒術'];elf.activeSkillSettings.attack=['三重矢'];elf.activeSkillSettings.heal='治癒術';elf.settings.arrowType='木箭';elf.consumables.木箭=100;elf.inTown=false;elf.mp=derived(elf).maxMp;elf.hp=derived(elf).maxHp;let es={player:elf,logs:[]},ec=new Combat(es);ec.enemy=enemy();ec.skillTick(elf,derived(elf),1000);ok(es.logs.some(x=>/三重矢/.test(x.t)));elf.mp=0;elf.hp=derived(elf).maxHp;ec.skillTick(elf,derived(elf),8000);ok(es.logs.some(x=>/魂體轉換/.test(x.t)));elf.hp=1;elf.mp=100;elf.skillCooldowns.治癒術=0;ec.skillTick(elf,derived(elf),16000);ok(elf.hp>1);ec.pcd=0;ec.tick(.1);ok(es.logs.some(x=>/你造成|沒有命中/.test(x.t)));

// CASE C WIS and actual MPR gear raise the shared formula; offline uses enabled skills.
let low=make('法師'),high=make('法師');high.stats.wis+=8;high.equipment.斗篷={id:'mpr-test',name:'回魔斗篷',slot:'斗篷',mpRegen:4};ok(manaRegenPerSecond(high)>manaRegenPerSecond(low));high.level=40;high.learnedSkills=['光箭'];high.activeSkillSettings.attack=['光箭'];high.inTown=false;let report=calculateOffline({player:high,lastOnlineTimestamp:1_000_000},4_600_000,()=>.5);ok(report.kills>0);

// CASE D only participating pets gain EXP and shares are equal.
let petOwner=make('王族');petOwner.pets=[{uid:'a',type:'dog',name:'A',level:5,exp:0,hp:70,alive:true},{uid:'b',type:'dog',name:'B',level:5,exp:0,hp:70,alive:true},{uid:'wait',type:'dog',name:'等待',level:5,exp:0,hp:70,alive:true}];petOwner.activePets=['a','b'];petWin(petOwner,20);eq(petOwner.pets[0].exp,10);eq(petOwner.pets[1].exp,10);eq(petOwner.pets[2].exp,0);

// CASE E summon requires class/level/CHA/skill; participates and has no permanent EXP.
let summoner=make('法師'),unit=SUMMON_TYPES[0];ok(!summonStatus(summoner,unit.id).ok);summoner.level=unit.level;summoner.stats.cha=unit.requiredCha;summoner.learnedSkills=['召喚術'];ok(summon(summoner,unit.id));ok(companionHits(summoner).some(x=>x.name===unit.name));ok(!('exp'in summoner.summons[0]));ok(SUMMON_TYPES.every(x=>!x.boss));

// CASE F the legacy boot itemId keeps every instance after its canonical display-name correction.
let bootsOwner=make('騎士'),boots=ITEMS.find(x=>x.id==='黑曜長靴');eq(boots.name,'黑長者涼鞋');addItem(bootsOwner,boots);addItem(bootsOwner,ITEMS[0]);let idsBefore=bootsOwner.bag.map(x=>x.instanceId).sort(),bootId=bootsOwner.bag.find(x=>x.id==='黑曜長靴').instanceId;ok(equip(bootsOwner,bootId));eq(countInstanceId(bootsOwner,bootId),1);let allAfter=[...bootsOwner.bag,...Object.values(bootsOwner.equipment)].filter(Boolean).map(x=>x.instanceId).sort();eq(allAfter,idsBefore);

// CASE G JSON persistence keeps equipped IDs.
let saved=JSON.parse(JSON.stringify(bootsOwner)),equipped=saved.equipment.鞋子.instanceId;eq(equipped,bootId);eq(countInstanceId(saved,bootId),1);
console.log(JSON.stringify({suite:'V18 classic calibration',checks,cases:'A-G PASS',monsterMaxLevel:Math.max(...HUNTING_MAPS.flatMap(m=>m.normals).map(x=>x.level)),mana:{plain,blue,wisGear:manaRegenPerSecond(high)},summons:SUMMON_TYPES.map(x=>x.name)}));
