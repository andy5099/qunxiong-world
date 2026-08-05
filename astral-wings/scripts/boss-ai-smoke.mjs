import assert from 'node:assert/strict';
import { defaultState } from '../src/astral-world/save.js?v=27';
import { IdleGame } from '../src/astral-world/game.js?v=29';
import { MAX_BOSS_ADDS, applyBossInterrupt, createBossRuntime, getBossSkill, updateBossRuntime } from '../src/astral-world/boss-ai-system.js?v=29';

const tick=(runtime,seconds,ratio=1,powerSave=false)=>{const actions=[];for(let t=0;t<seconds;t+=.1)actions.push(...updateBossRuntime(runtime,{dt:.1,hpRatio:ratio,alive:true,powerSave}));return actions;};

{
  const r=createBossRuntime();let a=updateBossRuntime(r,{dt:.1,hpRatio:.69,alive:true});assert.equal(a.filter(x=>x.type==='phaseTransition').length,1);a=updateBossRuntime(r,{dt:.1,hpRatio:.69,alive:true});assert.equal(a.filter(x=>x.type==='phaseTransition').length,0,'phase 2 once');
  tick(r,1,.69);a=updateBossRuntime(r,{dt:.1,hpRatio:.29,alive:true});assert.equal(a.filter(x=>x.type==='phaseTransition').length,1);tick(r,1,.29);a=updateBossRuntime(r,{dt:.1,hpRatio:.29,alive:true});assert.equal(a.filter(x=>x.type==='enraged').length,0,'phase 3/enrage once');assert.equal(r.enraged,true);
}
{
  const r=createBossRuntime(),actions=tick(r,3,1);const telegraph=actions.findIndex(x=>x.type==='telegraph'),resolve=actions.findIndex(x=>x.type==='resolve');assert.ok(telegraph>=0&&resolve>telegraph,'telegraph precedes resolve');const resolved=createBossRuntime();resolved.state='resolving';resolved.skillId='crown-smash';resolved.skillCursor=1;const first=updateBossRuntime(resolved,{dt:.1,hpRatio:1,alive:true}),second=updateBossRuntime(resolved,{dt:.1,hpRatio:1,alive:true});assert.equal([...first,...second].filter(x=>x.type==='resolve').length,1,'skill resolves once');
}
{
  const r=createBossRuntime();r.phase=2;r.state='resolving';r.skillId='summon-minions';r.skillCursor=1;let a=updateBossRuntime(r,{dt:.1,hpRatio:.5,alive:true});assert.equal(a[0].type,'summon');assert.ok(r.adds.length<=MAX_BOSS_ADDS);r.state='resolving';r.skillId='summon-minions';r.resolvedToken=null;r.skillCursor=2;updateBossRuntime(r,{dt:.1,hpRatio:.5,alive:true});assert.ok(r.adds.length<=MAX_BOSS_ADDS,'summon cap');updateBossRuntime(r,{dt:.1,hpRatio:0,alive:false});assert.equal(r.adds.length,0,'boss death clears adds');assert.equal(r.state,'dead');
}
{
  const r=createBossRuntime();r.phase=3;r.state='charging';r.skillId='final-cataclysm';r.telegraph={interruptible:true,threshold:70};let result=applyBossInterrupt(r,30);assert.equal(result.ok,false);result=applyBossInterrupt(r,40);assert.equal(result.ok,true);assert.equal(r.state,'staggered');tick(r,2.2,.2);assert.notEqual(r.state,'staggered','stagger recovers');
}
{
  const r=createBossRuntime(),skill=getBossSkill('final-cataclysm');r.phase=3;r.enraged=true;r.state='charging';r.skillId=skill.id;r.stateRemaining=.05;r.telegraph={remaining:.05,total:skill.chargeTime,interruptible:true,threshold:70};const actions=tick(r,.4,.2);assert.ok(actions.some(x=>x.type==='resolve'),'failed interrupt resolves normally');assert.equal(actions.filter(x=>x.type==='resolve').length,1);
}
{
  const renderer={setScene(){},update(){},pulse(){},damage(){}};const state=defaultState();const game=new IdleGame(state,renderer,{});game.spawn(true);game.battle.enemy.hp=game.battle.enemy.maxHp*.69;game.updateBossAI(.1);assert.equal(game.battle.bossRuntime.transitionLock,true);const hp=game.battle.enemy.hp;game.damageEnemy(999,'測試','#fff');assert.equal(game.battle.enemy.hp,hp,'transition lock prevents damage');
  for(const theme of ['current','cc0-pixel']){state.settings.artTheme=theme;game.battle.bossRuntime=createBossRuntime();const actions=tick(game.battle.bossRuntime,1,1,theme==='cc0-pixel');assert.ok(actions.some(x=>x.type==='telegraph'),'themes retain telegraph');}
}

console.log('Boss AI smoke: PASS');
