import assert from'node:assert/strict';
import{normalizeRoster}from'../js/multi-character.js';
import{createPlayer,derived}from'../js/player.js';
import{weaponDamage}from'../js/combat.js';
import{petDamage}from'../js/companions.js';
import{TREASURE_DREAM_WEAPONS,TREASURE_DREAM_ARMOR,TREASURE_EXCLUSIVE_GEAR,treasureEquipmentDrop,treasureBossEquipmentDrop,TREASURE_EXCLUDED_NAMES}from'../js/treasure-v30.js';

const classes=['王族','騎士','妖精','法師','黑暗妖精','龍騎士','幻術士'];
const legacy=(cls,i)=>({saveVersion:i,logs:null,player:{name:`Slot${i+1}`,cls,level:60+i,stats:null,equipment:{武器:{id:`old-${i}`,name:`舊武器${i}`,slot:'武器',type:cls==='妖精'?'弓':cls==='法師'||cls==='幻術士'?'法杖':'單手劍',small:10,large:12}},bag:[null,{id:`bag-${i}`,name:'舊裝備',slot:'頭盔',ac:-1}],consumables:i%2?null:{紅色藥水:7},settings:i%3?{}:{target:null},statsLog:null,pets:[{id:`pet-old-${i}`,type:i%2?'unknown':'dog',level:'200',alive:true}],activePets:[`pet-old-${i}`],map:i===3?999:56,learnedSkills:['測試技能'],rebirthCount:i}});
let raw={saveVersion:8,characters:classes.map((cls,i)=>({id:`c${i}`,slot:i,state:legacy(cls,i)}))};
let roster=normalizeRoster(raw,null,1700000000000);
assert.equal(roster.characters.filter(Boolean).length,7);
for(let i=0;i<7;i++){let p=roster.characters[i].state.player;assert.equal(p.name,`Slot${i+1}`);assert.equal(p.equipment.武器.id,`old-${i}`);assert.equal(p.bag[0].id,`bag-${i}`);assert.equal(p.learnedSkills[0],'測試技能');assert.equal(p.pets.length,1);assert.ok(Number.isFinite(p.rebirthCount));assert.ok(Number.isFinite(p.map))}
let reload=normalizeRoster(JSON.parse(JSON.stringify(roster)));for(let i=0;i<7;i++)assert.equal(reload.characters[i].state.player.equipment.武器.id,`old-${i}`);

const enemy={name:'V64標準Boss',size:'Large',boss:true},report=[];
for(const cls of classes){let p=createPlayer(cls,cls);p.level=80;p.stats={str:35,dex:35,con:25,int:35,wis:25,cha:15};let weapon=TREASURE_DREAM_WEAPONS.find(x=>x.classes.includes(cls));assert.ok(weapon,`${cls} dream weapon`);p.equipment.武器={...weapon,enhance:7};let charDps=weaponDamage(p,enemy,()=>.5)*derived(p).speed,pet={type:'dog',level:200,evolution:2,bossForm:'death-knight'},bossDps=petDamage(pet);report.push({cls,charDps:+charDps.toFixed(2),petDps:bossDps,ratio:+(bossDps/charDps).toFixed(3)});assert.ok(bossDps<charDps,`${cls} owner remains primary`)}
assert.equal(TREASURE_DREAM_WEAPONS.length,8);assert.ok(TREASURE_DREAM_ARMOR.some(x=>x.slot==='戒指2'));assert.ok(TREASURE_EXCLUSIVE_GEAR.every(x=>x.sourceType==='TREASURE_EXCLUSIVE'));assert.ok(TREASURE_EXCLUSIVE_GEAR.every(x=>!TREASURE_EXCLUDED_NAMES.includes(x.name)));
let p=createPlayer('測試','騎士'),map={treasure:true,treasureStage:4};assert.equal(treasureEquipmentDrop(p,map,[],()=>0).sourceType,'TREASURE_EXCLUSIVE');assert.equal(treasureBossEquipmentDrop(p,map,()=>0).sourceType,'TREASURE_EXCLUSIVE');
console.log('V64 7/7 LOGIN PASS');console.table(report);console.log('V64 TREASURE/PET PASS');
