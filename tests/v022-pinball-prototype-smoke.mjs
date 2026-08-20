import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createState } from '../src/store.js';
import { armMarbleSkill, createBossEncounter, createEncounter, resolveMarbleEvent } from '../src/engine.js';
import { activateMarbleFlippers, ensureMarbleBattle, stepMarblePhysics } from '../src/marble-battle.js';

let passed=0;const check=(value,label)=>{assert.ok(value,label);passed++;};const equal=(a,b,label)=>{assert.deepEqual(a,b,label);passed++;};
const zero=()=>0;
const make=()=>{const state=createState('彈射測試');state.screen='stronghold';state.unlocks.stronghold=true;state.ui.bossWarning=true;state.ui.bossRarityRank=2;createBossEncounter(state,2);return state;};

const normal=createState('普通戰');normal.screen='plain';createEncounter(normal,'wolf',zero);equal(normal.battle.mode,'text','normal enemies remain text battle');
const state=make(),marble=ensureMarbleBattle(state.battle,state.party,zero);equal(marble.phase,'pinball','Boss enters pinball prototype');equal(marble.entities.filter(Boolean).length,3,'only three deployed generals');
const entity=marble.entities[0];const initialY=entity.y;stepMarblePhysics(marble,.03);check(entity.y>initialY&&entity.vy>0,'gravity pulls general downward');
entity.y=390;entity.vy=120;check(activateMarbleFlippers(marble),'dual flippers activate');check(entity.vy<0,'near-bottom general launches upward');
marble.entities[0].x=150;marble.entities[0].y=250;marble.entities[1].x=180;marble.entities[1].y=250;marble.entities[0].vx=80;marble.entities[1].vx=-80;check(stepMarblePhysics(marble,.016).some(event=>event.type==='friend'),'general-to-general collision resolves');
for(let i=0;i<3;i++)resolveMarbleEvent(state,{type:'boss',entityIndex:0,weak:true,speed:500},zero);
check(marble.combo>=3,'continuous collisions build HIT combo');check(marble.breakTime>2,'three weak hits trigger BREAK');equal(marble.skills[0].energy,100,'weak collisions fill skill energy');
check(marble.skills[0].armed,'full skill slot auto-arms at its ideal trigger');const before=state.battle.enemies.find(enemy=>enemy.boss).hp;resolveMarbleEvent(state,{type:'boss',entityIndex:0,weak:false,speed:500},zero);check(state.battle.enemies.find(enemy=>enemy.boss).hp<before,'armed skill boosts next collision');equal(marble.skills[0].energy,0,'skill consumes energy once');check(!marble.skills[0].armed,'skill disarms after one collision');

const ui=fs.readFileSync(new URL('../src/marble-battle-ui.js',import.meta.url),'utf8');const view=fs.readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');const css=fs.readFileSync(new URL('../pinball-prototype.css',import.meta.url),'utf8');const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
check(ui.includes('activateMarbleFlippers')&&ui.includes('requestAnimationFrame'),'RAF flipper renderer connected');check(ui.includes("'pointerdown'")&&ui.includes("'touchstart'"),'pointer and iPhone touch controls exist');check(!view.includes('data-pinball-skill')&&view.includes('技能與奧義會自動施放'),'automatic skill UI rendered');check(css.includes('grid-template-columns:repeat(3')&&!css.includes('overflow-x:auto'),'390px layout has no horizontal rail');check(main.includes('cleanupMarbleBattle'),'Boss exit cleanup remains centralized');

console.log(`V0.2.2 pinball prototype smoke: ${passed} assertions passed.`);
