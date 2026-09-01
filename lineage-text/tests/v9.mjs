import assert from'node:assert/strict';
import{createPlayer,derived}from'../js/player.js';
import{migrate}from'../js/migration.js';
import{PET_CLASS_LIMIT}from'../js/balance.js';
import{togglePet,companionHits,petWin,summon}from'../js/companions.js';
import{skillDrop,skillSources,skillsFor}from'../js/skills.js';
import{hitChance}from'../js/combat.js';
import{HUNTING_MAPS}from'../js/systems.js';
import{calculateOffline,claimOffline}from'../js/offline.js';

let checks=0,ok=(v,m)=>{assert.ok(v,m);checks++},eq=(a,b,m)=>{assert.equal(a,b,m);checks++};
const clone=x=>JSON.parse(JSON.stringify(x));

// Auto-transform survives every serialization/migration path, including legacy aliases and no-scroll state.
let tp=migrate({player:createPlayer('變身','妖精'),logs:[]}).player;
tp.settings.autoTransform=true;tp.settings.autoTransformMode='fixed';tp.settings.autoTransformId='orc';tp.settings.autoSupplyTransform=true;tp.settings.target.變身卷軸=77;tp.transformState={id:'orc',until:123456789};tp.consumables.變身卷軸=0;
let ts=migrate({player:clone(tp),logs:[]});
eq(ts.player.settings.autoTransform,true);eq(ts.player.settings.autoTransformId,'orc');eq(ts.player.settings.autoSupplyTransform,true);eq(ts.player.settings.target.變身卷軸,77);eq(ts.player.transformState.id,'orc');eq(ts.player.transformState.until,123456789);
let legacy=createPlayer('舊檔','妖精');legacy.settings.autoTransformEnabled=true;legacy.settings.selectedTransformationId='orc';
let lm=migrate({player:legacy,logs:[]}).player;eq(lm.settings.autoTransform,true);eq(lm.settings.autoTransformId,'orc');

// Ordinary pets are multi-instance and class-limited only; summons retain their separate CHA budget.
for(let[cls,limit]of Object.entries(PET_CLASS_LIMIT)){let p=migrate({player:createPlayer('寵',cls),logs:[]}).player;p.stats.cha=1;p.pets=Array.from({length:4},(_,i)=>({uid:`${cls}-${i}`,type:'dog',name:`杜賓狗${i}`,level:10,exp:0,hp:70,alive:true,evolution:0,evolutionMultiplier:1}));p.activePets=[];for(let pet of p.pets)togglePet(p,pet.uid);eq(p.activePets.length,limit,`${cls}固定寵物上限`)}
let elf=migrate({player:createPlayer('低魅妖精','妖精'),logs:[]}).player;elf.stats.cha=1;elf.pets=[0,1].map(i=>({uid:`e${i}`,type:i?'wolf':'dog',name:i?'牧羊犬':'杜賓狗',level:50,exp:0,hp:100,alive:true,evolution:0,evolutionMultiplier:1}));elf.activePets=[];ok(togglePet(elf,'e0'));ok(togglePet(elf,'e1'));eq(companionHits(elf).length,2);let before=elf.pets.map(x=>x.exp);petWin(elf,300);eq(elf.pets[0].exp-before[0],150);eq(elf.pets[1].exp-before[1],150);
let petSave=migrate({player:clone(elf),logs:[]}).player;eq(petSave.activePets.length,2);eq(companionHits(petSave).length,2);
elf.inTown=false;elf.map=2;elf.gold=1e7;elf.settings.autoGreen=false;elf.settings.autoBrave=false;let now=2_000_000_000_000,off=calculateOffline({player:elf,lastOnlineTimestamp:now-3600000,logs:[]},now,()=>.5);eq(Object.keys(off.petShares).length,2);let share=Object.values(off.petShares);eq(share[0],share[1]);

// 10,000-attack analytical simulation at normal gear hit values.
const miss=(hit,ac,level)=>{let misses=0,x=123456789;for(let i=0;i<10000;i++){x=(1664525*x+1013904223)>>>0;if(x/4294967296>=hitChance(hit,ac,level))misses++}return misses/100};
let hitRows=[];for(let level of[20,30,40]){let rate=miss(level+19,-Math.max(0,(level-20)/2),level);hitRows.push(rate);ok(rate>=5&&rate<=10,`Lv${level}同級 MISS ${rate}%`)}
let gaps=[3,5,10].map(g=>miss(49,-5-g/2,30+g));ok(gaps[0]>=9&&gaps[0]<=18);ok(gaps[1]>gaps[0]&&gaps[2]>gaps[1]);

// Seeded Lv1→27 progression: 50 normal kills per level on the matching progression map.
const rngFor=seed=>()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
let totals=[],zeros=0;for(let seed=1;seed<=500;seed++){let p=migrate({player:createPlayer('進度','法師'),logs:[]}).player,rng=rngFor(seed),count=0;for(let level=1;level<=27;level++){p.level=level;let map=HUNTING_MAPS[Math.min(6,Math.floor((level-1)/4))];for(let k=0;k<50;k++){let e=map.normals[Math.floor(rng()*map.normals.length)];if(skillDrop(e,p,rng))count++}}totals.push(count);if(!count)zeros++}
let sorted=[...totals].sort((a,b)=>a-b),avg=totals.reduce((a,b)=>a+b,0)/totals.length;ok(avg>=35&&avg<=70,`Lv27 平均 ${avg}`);ok(zeros/500<=.01,`零本率 ${zeros/500}`);ok(sorted[250]>=35&&sorted[250]<=70,`中位數 ${sorted[250]}`);
for(let s of skillsFor(migrate({player:createPlayer('來源','法師')}).player))ok(skillSources(s).length>0,`${s[0]}有來源`);

console.log(JSON.stringify({suite:'V9',checks,transform:true,petLimits:PET_CLASS_LIMIT,hitSameLevel:hitRows,hitLevelGaps:gaps,skillBooks:{runs:500,average:+avg.toFixed(2),median:sorted[250],p10:sorted[49],p90:sorted[449],zeroRate:+(zeros/500*100).toFixed(2)}}));
