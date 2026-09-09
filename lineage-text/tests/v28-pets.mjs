import assert from'node:assert/strict';
import{createPlayer}from'../js/player.js?v=38';
import{migrate}from'../js/migration-v19.js?v=51';
import{PET_EVOLUTIONS,PET_STONES}from'../js/systems.js?v=60';
import{BOSS_PET_FORMS}from'../js/content-v13.js?v=60';
import{togglePet,companionDeath,evolvePet,evolvePetBoss,petEvolutionStatus,petMaxHp}from'../js/companions.js?v=60';

let checks=0,ok=(value,message)=>{assert.ok(value,message);checks++},eq=(actual,expected,message)=>{assert.deepEqual(actual,expected,message);checks++};
const owner=()=>{let p=migrate({player:createPlayer('寵物驗收','騎士'),logs:[]}).player;p.petMaterials??={};p.bossMaterials??={};return p};
const pet=(level=1,evolution=0)=>({uid:`pet-${level}-${evolution}`,type:'dog',name:'杜賓狗',level,exp:4321,hp:70,alive:true,evolution,evolutionMultiplier:1});

eq(PET_EVOLUTIONS.dog.map(x=>[x.material,x.count]),[[PET_STONES.normal,5],[PET_STONES.advanced,3]]);
for(const type of Object.keys(PET_EVOLUTIONS))eq(PET_EVOLUTIONS[type].map(x=>[x.material,x.count]),[[PET_STONES.normal,5],[PET_STONES.advanced,3]]);

for(const level of[1,199,200,201,250]){let p=owner(),x=pet(level);p.pets=[x];p.activePets=[];ok(togglePet(p,x.uid),`Lv${level} 出戰`);eq(p.activePets,[x.uid]);ok(togglePet(p,x.uid),`Lv${level} 待命`);eq(p.activePets,[]);ok(togglePet(p,x.uid),`Lv${level} 再出戰`)}

let deadOwner=owner(),dead=pet(200);deadOwner.pets=[dead];deadOwner.activePets=[dead.uid];companionDeath(deadOwner);eq(deadOwner.activePets,[]);ok(dead.alive);eq(dead.hp,petMaxHp(dead));ok(togglePet(deadOwner,dead.uid));eq(deadOwner.activePets,[dead.uid]);
let legacyDead=pet(200);legacyDead.alive=false;legacyDead.hp=0;deadOwner.pets=[legacyDead];deadOwner.activePets=[];ok(togglePet(deadOwner,legacyDead.uid));ok(legacyDead.alive);eq(legacyDead.hp,petMaxHp(legacyDead));

let stageOwner=owner(),stagePet=pet(200),uid=stagePet.uid,exp=stagePet.exp;stageOwner.pets=[stagePet];stageOwner.activePets=[uid];stageOwner.petMaterials[PET_STONES.normal]=5;ok(evolvePet(stageOwner,uid));eq(stagePet.evolution,1);eq(stageOwner.petMaterials[PET_STONES.normal],0);eq(stagePet.level,200);eq(stagePet.exp,exp);eq(stagePet.uid,uid);eq(stageOwner.activePets,[uid]);stageOwner.petMaterials[PET_STONES.advanced]=3;ok(evolvePet(stageOwner,uid));eq(stagePet.evolution,2);eq(stageOwner.petMaterials[PET_STONES.advanced],0);eq(stagePet.level,200);eq(stagePet.exp,exp);eq(stagePet.uid,uid);eq(stageOwner.activePets,[uid]);

let poor=owner(),poorPet=pet(200);poor.pets=[poorPet];poor.petMaterials[PET_STONES.normal]=4;let poorBefore=structuredClone(poorPet),status=petEvolutionStatus(poor,poorPet.uid);ok(!status.ok);eq(status.reason,`${PET_STONES.normal}不足，需要 ×5。`);ok(!evolvePet(poor,poorPet.uid));eq(poorPet,poorBefore);eq(poor.petMaterials[PET_STONES.normal],4);

let form=BOSS_PET_FORMS.find(x=>x.id==='death-knight');stageOwner.bossMaterials[form.material]=1;ok(evolvePetBoss(stageOwner,uid,form.id));eq(stagePet.evolution,3);eq(stagePet.bossForm,form.id);eq(stagePet.uid,uid);eq(stagePet.level,200);eq(stagePet.exp,exp);eq(stageOwner.bossMaterials[form.material],0);eq(stageOwner.activePets,[uid]);

let roster={saveVersion:10,activeCharacterId:'A',characters:[{id:'A',state:{player:stageOwner,lastOnlineTimestamp:Date.now(),logs:[]}},{id:'B',state:{player:owner(),lastOnlineTimestamp:Date.now(),logs:[]}}]},roundTrip=JSON.parse(JSON.stringify(roster)),saved=roundTrip.characters[0].state.player.pets[0];eq(saved.uid,uid);eq(saved.level,200);eq(saved.exp,exp);eq(saved.evolution,3);eq(saved.bossForm,form.id);eq(roundTrip.characters[0].state.player.activePets,[uid]);ok(saved.alive);

console.log(JSON.stringify({suite:'V28 pets',checks,deployLevels:[1,199,200,201,250],deathRecovery:{alive:dead.alive,hp:dead.hp,redeploy:deadOwner.activePets.includes(legacyDead.uid)},evolution:{uid:stagePet.uid,level:stagePet.level,exp:stagePet.exp,stage:stagePet.evolution,bossForm:stagePet.bossForm},materials:PET_EVOLUTIONS.dog.map(x=>({material:x.material,count:x.count}))}));
