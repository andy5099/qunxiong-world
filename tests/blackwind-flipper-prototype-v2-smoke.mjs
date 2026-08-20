import { createState } from '../src/store.js';
import { createBossEncounter, resolveMarbleEvent, updateFlipperSystems } from '../src/engine.js';
import { activateMarbleFlippers, createMarbleBattleState, getFormationTier, stepMarblePhysics } from '../src/marble-battle.js';
import fs from 'node:fs';

let passed=0;
const check=(condition,message)=>{if(!condition)throw new Error(message);passed++;};
const zero=()=>0;

function blackwindState(){
  const state=createState('Prototype');
  state.screen='stronghold';state.location='黑風寨';state.unlocks.stronghold=true;
  state.progress.bossUnlocked=true;state.ui.bossWarning=true;state.ui.bossRarityRank=3;
  check(createBossEncounter(state,3,zero),'blackwind encounter starts');
  return state;
}

const isolated=blackwindState();
check(isolated.battle.marble.prototypeV2===true,'blackwind alone uses prototype V2');
check(isolated.battle.marble.obstacles.length===0,'prototype battlefield stays readable');
check(isolated.battle.marble.entities.filter(Boolean).length===3,'three main generals share arena');

const other=createMarbleBattleState({bossKind:'zhang-bao',areaId:'yellowFortress'},isolated.party,zero);
check(!other.prototypeV2,'other bosses retain V0.2.3 physics');

const launch=isolated.battle.marble;
launch.entities.forEach((entity,index)=>{entity.y=382+index*4;entity.vy=100;});
launch.formationReady=4;
check(activateMarbleFlippers(launch,'left'),'one tap activates dual prototype flippers');
check(launch.flippers.left>0&&launch.flippers.right>0,'both visual flippers rise together');
check(launch.entities.every(entity=>entity.vy<0),'all generals in launch zone launch together');
check(launch.perfectFlip,'wide perfect window rewards launch timing');
check(launch.formationActive?.tier===4&&!launch.formationReady,'MAX READY is consumed on valid FLIP');
check(launch.entities.every(entity=>Math.hypot(entity.vx,entity.vy)<=905),'MAX velocity remains readable');

const retained=createMarbleBattleState({areaId:'stronghold'},isolated.party,zero);
retained.formationReady=3;retained.entities.forEach(entity=>{entity.y=220;});
check(!activateMarbleFlippers(retained),'tap away from launch zone does not fake a launch');
check(retained.formationReady===3,'READY persists until a valid launch-zone FLIP');

let totalHits=0,totalDashes=0,totalPerfects=0,maxCombo=0,formationLevels=new Set();
for(let run=0;run<10;run++){
  const state=blackwindState(),marble=state.battle.marble,boss=state.battle.enemies[0];
  boss.hp=boss.maxHp=999999;
  for(let frame=0;frame<3600;frame++){
    const launchReady=marble.entities.some(entity=>entity&&entity.y>350);
    if(launchReady&&frame%5===0){if(activateMarbleFlippers(marble)){if(marble.perfectFlip)totalPerfects++;if(marble.formationActive)formationLevels.add(marble.formationActive.tier);}}
    for(const event of stepMarblePhysics(marble,1/60)){
      if(event.type==='dash')totalDashes++;
      if(event.type==='boss'){totalHits++;const result=resolveMarbleEvent(state,event,()=>.5);maxCombo=Math.max(maxCombo,result?.hit||0);}
    }
    updateFlipperSystems(state,1/60,()=>.5);
  }
}
check(totalHits>=100,'ten feel runs create sustained boss contact');
check(totalDashes>=20,'short cooldown dash reconnects falling generals');
check(totalPerfects>=10,'timed launch-zone taps produce PERFECT feedback');
check(maxCombo>=20,'ordinary scripted timing reaches meaningful combo');
check(getFormationTier(10)===1&&getFormationTier(20)===2&&getFormationTier(35)===3&&getFormationTier(50)===4,'formation thresholds stay 10/20/35/50');
for(const tier of [1,2,3,4])check(formationLevels.has(tier),`formation ${tier} becomes a physical special FLIP`);

const weak=blackwindState(),weakMarble=weak.battle.marble;
weakMarble.breakGauge=90;
const weakHit=resolveMarbleEvent(weak,{type:'boss',entityIndex:0,weak:true,speed:600,prototypeV2:true},()=>.5);
check(weakHit.damage>0,'weak collision deals damage');
check(weakMarble.breakTime>3,'weak hit activates visible BREAK');

const supportSkill=blackwindState(),liu=supportSkill.party[1],liuSlot=supportSkill.battle.marble.skills[1];
supportSkill.party.forEach(unit=>{if(unit)unit.hp=Math.max(1,Math.floor(unit.hp*.5));});
const hpBefore=liu.hp;liuSlot.energy=100;liuSlot.queued=true;supportSkill.battle.marble.skillQueue.push({type:'main',index:1,priority:1});
updateFlipperSystems(supportSkill,.4,()=>.5);
check(liu.hp>hpBefore&&liuSlot.energy===0&&!liuSlot.armed,'support skill heals automatically without pausing physics');

const mainSource=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const storeSource=fs.readFileSync(new URL('../src/store.js',import.meta.url),'utf8');
const workflow=fs.readFileSync(new URL('../.github/workflows/deploy-pages.yml',import.meta.url),'utf8');
check(mainSource.includes("!isBlackwindPreview && 'serviceWorker' in navigator"),'preview never registers the formal service worker');
check(mainSource.includes("createBossEncounter(state, 4)"),'preview opens directly into blackwind prototype');
check(storeSource.includes('qunxiong-world-blackwind-prototype-v2'),'preview uses isolated LocalStorage key');
check(workflow.includes('site/prototype-blackwind-v2')&&workflow.includes('ref: master'),'preview artifact preserves master at the root path');

console.log(`Blackwind Flipper Prototype V2: ${passed} assertions passed; 10 runs, ${totalHits} hits, ${totalDashes} dashes, max combo ${maxCombo}.`);
