import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createState } from '../src/store.js';
import { createBossEncounter, createEncounter, createWorldBossEncounter, resolveMarbleEvent, finishMarbleShot } from '../src/engine.js';
import { MARBLE_ARENA, MARBLE_SKILLS, aimVelocity, createMarbleBattleState, ensureMarbleBattle, getMarbleSkill, hitMultiplier, stepMarblePhysics } from '../src/marble-battle.js';

let passed=0;
const check=(value,label)=>{assert.ok(value,label);passed++;};
const equal=(actual,expected,label)=>{assert.deepEqual(actual,expected,label);passed++;};
const zero=()=>0;
const state=()=>{const s=createState('彈射測試');s.screen='stronghold';s.location='黑風寨';s.unlocks.stronghold=true;s.ui.bossWarning=true;s.ui.bossRarityRank=3;return s;};

const normal=state();normal.ui.bossWarning=false;createEncounter(normal,'strongholdSoldier',zero);equal(normal.battle.mode,'text','normal battle remains text');
const boss=state();createBossEncounter(boss,3);equal(boss.battle.mode,'marble','formal boss uses marble');check(Boolean(boss.battle.marble),'marble state created');equal(boss.battle.marble.entities.filter(Boolean).length,4,'four starting members become marbles');equal(boss.battle.marble.phase,'aim','starts in aim phase');
const world=state();world.ui.bossWarning=false;world.worldBoss.unlocked=true;createWorldBossEncounter(world,'crimsonTiger');equal(world.battle.mode,'marble','world boss uses marble');equal(world.battle.marble.boss.visualKey,'crimson-tiger','world boss visual selected');

equal(MARBLE_ARENA.width,360,'arena width');equal(MARBLE_ARENA.height,430,'arena height');
check(Object.keys(MARBLE_SKILLS).length>=10,'skill table centralized');equal(getMarbleSkill({id:'guan-yu'}).name,MARBLE_SKILLS['guan-yu'].name,'character skill lookup');check(hitMultiplier(6)>hitMultiplier(2),'hit chain grows');
const v=aimVelocity(0,100);check(v.vy<0&&v.power>.8,'pulling down launches upward');

let physicalHits=0,wallHits=0,obstacleHits=0;
for(let shot=0;shot<36;shot++){
  const fake={worldBoss:false,bossKind:'blackwindLord',bossRarityRank:1,areaId:shot%2?'forest':'stronghold'};
  const marble=createMarbleBattleState(fake,boss.party,()=>shot%2*.49);
  marble.turnIndex=0;const entity=marble.entities[0];entity.x=70+(shot%6)*42;entity.y=350;const targetX=marble.boss.x+(shot%5-2)*10,targetY=marble.boss.y;
  const dx=entity.x-targetX,dy=entity.y-targetY,len=Math.hypot(dx,dy);entity.vx=-dx/len*(440+(shot%4)*45);entity.vy=-dy/len*(440+(shot%4)*45);marble.phase='moving';
  for(let frame=0;frame<900&&marble.phase==='moving';frame++)for(const event of stepMarblePhysics(marble,1/60)){if(event.type==='boss')physicalHits++;if(event.type==='wall')wallHits++;if(event.type==='obstacle')obstacleHits++;}
  check(marble.phase==='settling','physical shot settles');
  check(entity.x>=MARBLE_ARENA.padding+entity.radius-1&&entity.x<=MARBLE_ARENA.width-MARBLE_ARENA.padding-entity.radius+1,'shot stays inside horizontal wall');
}
check(physicalHits>=20,'thirty-six real trajectories hit boss');check(wallHits>0,'wall collision exercised');check(obstacleHits>0,'obstacle collision exercised');

const damageState=state();createBossEncounter(damageState,3);const marble=ensureMarbleBattle(damageState.battle,damageState.party,zero),target=damageState.battle.enemies.find(e=>e.boss);const before=target.hp;
marble.skillArmed=true;const hit=resolveMarbleEvent(damageState,{type:'boss',weak:true,speed:600},zero);check(hit.damage>0&&target.hp<before,'weak-point hit deals real damage');check(marble.effects.length>0,'damage effect emitted');
finishMarbleShot(damageState,zero);equal(marble.turnIndex,1,'turn advances to next living member');

const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');const ui=fs.readFileSync(new URL('../src/marble-battle-ui.js',import.meta.url),'utf8');const css=fs.readFileSync(new URL('../style.css',import.meta.url),'utf8');const sw=fs.readFileSync(new URL('../service-worker.js',import.meta.url),'utf8');
check(main.includes('mountMarbleBattle')&&!main.includes('mountFormationPuzzle'),'main routes only marble Boss UI');check(main.includes("['puzzle', 'marble']"),'timer excludes marble battle');check(ui.includes('setPointerCapture')&&ui.includes('releasePointerCapture'),'pointer capture implemented');check(ui.includes('requestAnimationFrame')&&ui.includes('stepMarblePhysics'),'RAF delta physics connected');check(ui.includes('drawPortrait')&&ui.includes('drawBoss')&&ui.includes('drawObstacle'),'illustrated actors and scenery rendered');check(ui.includes('cleanupMarbleBattle'),'central cleanup implemented');check(css.includes('touch-action:none')&&css.includes('@media(max-width:430px)'),'touch and mobile CSS');check(sw.includes('v021-illustrated-marble-boss')&&sw.includes('marble-battle-ui.js'),'service worker updated');

console.log(`V0.2.1 marble Boss smoke: ${passed} assertions passed; 36 physical shots, ${physicalHits} boss hits, ${wallHits} wall contacts, ${obstacleHits} obstacle contacts.`);
