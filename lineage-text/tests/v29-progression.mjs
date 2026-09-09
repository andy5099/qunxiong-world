import assert from'node:assert/strict';
import{createPlayer,derived}from'../js/player.js?v=38';
import{migrate}from'../js/migration-v19.js?v=51';
import{BOSS_CATALOG,BOSS_SETS}from'../js/systems.js?v=60';
import{OFFICIAL_PROGRESSION_GEAR,EQUIPMENT_AUDIT,highMapBossLoot,weaponMagicProc,WEAPON_MAGIC}from'../js/equipment-v29.js?v=61';
import{equipmentTier}from'../js/equipment-progression.js?v=61';
import{DRAGON_MAPS,DRAGON_UTILITY_ITEMS,dragonUtilityDrops}from'../js/dragons-v26.js?v=61';
import{enhance,protectedEnhance}from'../js/enhance.js?v=61';
import{TRANSFORMATIONS,activateTransform,normalTransform,transformWeaponSpeed}from'../js/transformations.js?v=61';
import{togglePet,evolvePet,companionDeath}from'../js/companions.js?v=60';

let checks=0,ok=(v,m)=>{assert.ok(v,m);checks++},eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++};
const make=(cls='騎士')=>migrate({player:createPlayer('V29',cls),logs:[]}).player;
let gloves=OFFICIAL_PROGRESSION_GEAR.filter(x=>x.slot==='手套'),shirts=OFFICIAL_PROGRESSION_GEAR.filter(x=>x.slot==='內衣');ok(new Set(gloves.map(equipmentTier)).size>=4);ok(new Set(shirts.map(equipmentTier)).size>=5);ok(gloves.some(x=>x.name==='塔拉斯手套'));ok(shirts.some(x=>x.name==='智力T恤'));ok(EQUIPMENT_AUDIT.CUSTOM_CONFIRMED.length>0);

let p=make(),low={tier:0,dragon:false},high={tier:12,dragon:false},dragon=DRAGON_MAPS[0];eq(highMapBossLoot(p,low,()=>0),null);eq(highMapBossLoot(p,dragon,()=>0),null);let seq=a=>()=>a.shift();let bossWeapon=highMapBossLoot(p,high,seq([0,0]));ok(bossWeapon?.boss);let bossArmor=highMapBossLoot(p,high,seq([.0015,0]));ok(bossArmor?.bossSet==='set0');let material=highMapBossLoot(p,high,seq([.0025,0]));eq(material.kind,'boss-material');ok(!material.name.includes('安塔瑞斯')&&!material.name.includes('法利昂')&&!material.name.includes('林德拜爾')&&!material.name.includes('巴拉卡斯'));

let weapon=BOSS_CATALOG[10].item;p.equipment.武器={...weapon,uid:'magic',instanceId:'magic'};let seed=123456,random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296),procs=0;for(let i=0;i<10000;i++)if(weaponMagicProc(p,{name:'木樁'},random))procs++;let expected=WEAPON_MAGIC[weapon.id].proc;ok(Math.abs(procs/10000-expected)<.01);let mp=p.mp,cooldowns=JSON.stringify(p.skillCooldowns);weaponMagicProc(p,{},()=>0);eq(p.mp,mp);eq(JSON.stringify(p.skillCooldowns),cooldowns);

const item=(slot,uid)=>({uid,instanceId:uid,name:uid,slot,safe:slot==='武器'?6:4,enhance:slot==='武器'?6:4});let w=item('武器','w'),a=item('盔甲','a');p.bag=[w,a];p.consumables['防爆武器強化卷軸']=2;p.consumables['防爆防具強化卷軸']=2;let r=protectedEnhance(p,'w',()=>0);ok(r.ok);eq(w.enhance,7);eq(p.consumables['防爆武器強化卷軸'],1);r=protectedEnhance(p,'w',()=>1);ok(!r.ok&&!r.destroyed);ok(p.bag.includes(w));eq(w.enhance,7);r=protectedEnhance(p,'a',()=>0);ok(r.ok);eq(a.enhance,5);r=protectedEnhance(p,'a',()=>1);ok(!r.ok&&!r.destroyed);ok(p.bag.includes(a));let doomed=item('武器','doom');p.bag.push(doomed);p.consumables.武器強化卷軸=1;r=enhance(p,'doom',false,()=>1);ok(r.destroyed);ok(!p.bag.includes(doomed));

for(const map of DRAGON_MAPS){let q=make();let drops=dragonUtilityDrops(q,()=>0);eq(drops.sort(),Object.values(DRAGON_UTILITY_ITEMS).map(x=>x.name).sort());eq(q.consumables['防爆武器強化卷軸'],1);eq(q.consumables['防爆防具強化卷軸'],1)}

let tr=make();tr.rebirthCount=20;tr.level=1;tr.equipment.武器={type:'單手劍'};tr.consumables.變身卷軸=1;let milestone=TRANSFORMATIONS.find(x=>x.requiredRebirth===20);ok(milestone);ok(activateTransform(tr,milestone.id,1000));eq(normalTransform(tr,2000)?.id,milestone.id);ok(transformWeaponSpeed(tr,2000)>1);tr.rebirthCount=19;eq(normalTransform(tr,2000),null);

let petOwner=make(),pet=petOwner.pets[0];petOwner.petMaterials={'寵物進化石':0,'高級寵物進化石':0};pet.level=200;petOwner.activePets=[];ok(togglePet(petOwner,pet.uid));companionDeath(petOwner);ok(pet.alive);ok(togglePet(petOwner,pet.uid));petOwner.petMaterials['寵物進化石']=5;ok(evolvePet(petOwner,pet.uid));eq(pet.level,200);

let setPlayer=make();let set=BOSS_SETS[0];for(let n=0;n<=4;n++){setPlayer.equipment={};for(let i=0;i<n;i++)setPlayer.equipment[set.pieces[i].slot]={...set.pieces[i],uid:`s${i}`,instanceId:`s${i}`};let d=derived(setPlayer);if(n<2)eq(d.sets[set.id]||0,n);if(n===4)ok(d.transform===set.name)}
console.log(JSON.stringify({suite:'V29 progression',checks,official:{gloves:gloves.map(x=>x.name),shirts:shirts.map(x=>x.name)},highMap:{weapon:bossWeapon.name,armor:bossArmor.name,material:material.name},weaponMagic:{weapon:weapon.name,procs,rate:procs/10000,expected},rebirthTransform:milestone.name}));
