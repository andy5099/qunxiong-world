import { createState } from '../src/store.js';
import { createWorldBossEncounter, resolveMarbleEvent, retreatFlipperBattle } from '../src/engine.js';
import { activateMarbleFlippers, createMarbleBattleState, stepMarblePhysics } from '../src/marble-battle.js';

let passed=0;const check=(value,label)=>{if(!value)throw new Error(label);passed++;};
const state=createState('測試者');state.worldBoss.unlocked=true;createWorldBossEncounter(state,'crimsonTiger');
const boss=state.battle.enemies[0],marble=state.battle.marble;check(marble.entities.filter(Boolean).length===3,'three active marbles');
const damages=[];for(let i=0;i<80&&boss.hp>1;i++){if(i===8)boss.hp=Math.floor(boss.maxHp*.69);if(i===30)boss.hp=Math.floor(boss.maxHp*.34);marble.contact0=false;const result=resolveMarbleEvent(state,{type:'boss',entityIndex:0,weak:i%3===0,speed:620},()=>.5);damages.push(result.damage);}
check(damages.every(value=>Number.isFinite(value)&&value>0),'world boss damage never becomes zero');
check(boss.phase>=2,'world boss phase advances');check(marble.breakTime>0||marble.breakImmunity>0||marble.breakGauge>=0,'break state finite');
const beforeLeft=marble.flippers.left;activateMarbleFlippers(marble,'left');check(marble.flippers.left>beforeLeft&&marble.flippers.right===0,'independent left flipper');
const events=stepMarblePhysics(marble,.016);check(Array.isArray(events),'stable delta physics');
const oldId=state.battle.worldBossId;check(retreatFlipperBattle(state),'active boss can retreat');check(!state.battle&&state.screen==='worldBoss'&&oldId==='crimsonTiger','retreat clears battle safely');
console.log(`V0.2.2 final flipper smoke: ${passed} passed`);
