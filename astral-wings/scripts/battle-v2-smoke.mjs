import assert from 'node:assert/strict';
import { SKILLS, SAVE_VERSION } from '../src/astral-world/data.js?v=27';
import { addRage, advanceSkillRuntime, cancelActiveSkill, chooseAutoSkill, ensureBattle2State, requestSkillCast, tickSkillCooldowns } from '../src/astral-world/battle-skill-system.js?v=27';

const makeState = () => ensureBattle2State({
  player:{mp:100,maxMp:100,mpRegenPerSecond:8,rage:0,maxRage:100},
  skillCooldowns:{}, skillAutoSettings:{}, skillRuntimeState:{},
});
const target = 'enemy-1';

assert.equal(SKILLS.length, 4);
for (const field of ['id','name','type','cooldown','mpCost','rageCost','castTime','animation','target','damageMultiplier','priority','autoCast']) {
  assert.ok(SKILLS.every(skill => field in skill), `missing skill field ${field}`);
}

{
  const state=makeState(); state.player.mp=0;
  assert.deepEqual(requestSkillCast(state,'slash',target,true),{ok:false,reason:'mp'});
  assert.equal(state.skillCooldowns.slash,0);
}
{
  const state=makeState(); state.player.rage=0;
  assert.deepEqual(requestSkillCast(state,'burst',target,true),{ok:false,reason:'rage'});
  assert.equal(state.skillCooldowns.burst,0);
}
{
  const state=makeState(); let resolutions=0;
  assert.equal(requestSkillCast(state,'slash',target,true).ok,true);
  assert.equal(state.skillRuntimeState.phase,'queued');
  advanceSkillRuntime(state,.01,{isTargetValid:id=>id===target,onResolve:()=>resolutions++});
  assert.equal(state.skillRuntimeState.phase,'casting');
  assert.equal(state.player.mp,82);
  assert.equal(state.skillCooldowns.slash,0);
  advanceSkillRuntime(state,1,{isTargetValid:id=>id===target,onResolve:()=>resolutions++});
  assert.equal(resolutions,1);
  assert.equal(state.skillCooldowns.slash,4);
  advanceSkillRuntime(state,.01,{isTargetValid:()=>true,onResolve:()=>resolutions++});
  assert.equal(state.skillRuntimeState.phase,'ready');
  tickSkillCooldowns(state,2);
  assert.equal(state.skillCooldowns.slash,2);
  tickSkillCooldowns(state,2);
  assert.equal(state.skillCooldowns.slash,0);
}
{
  const state=makeState(); state.player.rage=100; state.player.mp=100;
  const selected=chooseAutoSkill(state,true);
  assert.equal(selected.id,'burst');
  assert.equal(requestSkillCast(state,selected.id,target,true).ok,true);
  assert.equal(chooseAutoSkill(state,true),null);
}
{
  const state=makeState();
  requestSkillCast(state,'slash',target,true);
  advanceSkillRuntime(state,.01,{isTargetValid:()=>true});
  assert.equal(state.player.mp,82);
  cancelActiveSkill(state);
  assert.equal(state.player.mp,100);
  assert.equal(state.skillRuntimeState.phase,'ready');
}
{
  const state=makeState(); addRage(state,150); assert.equal(state.player.rage,100);
  tickSkillCooldowns(state,2); assert.ok(Object.values(state.skillCooldowns).every(value=>value>=0));
}

const memory = new Map();
globalThis.localStorage={getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value),removeItem:key=>memory.delete(key)};
const { importSave } = await import('../src/astral-world/save.js?v=27');
const migrated=importSave(JSON.stringify({version:10,player:{level:7,gold:321},skills:[2,3,4,5],inventory:[],equipped:{},pets:[],settings:{artTheme:'cc0-pixel'}}));
assert.equal(migrated.version,SAVE_VERSION);
assert.equal(migrated.player.level,7);
assert.equal(migrated.player.gold,321);
assert.equal(migrated.player.mp,migrated.player.maxMp);
assert.equal(migrated.player.rage,0);
assert.deepEqual(Object.keys(migrated.skillCooldowns),SKILLS.map(skill=>skill.id));
assert.equal(migrated.skillAutoSettings.shelter,false);
assert.equal(migrated.settings.artTheme,'cc0-pixel');

console.log('Battle 2.0 smoke: PASS');
