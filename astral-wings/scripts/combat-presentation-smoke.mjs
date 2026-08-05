import assert from 'node:assert/strict';
import { defaultState } from '../src/astral-world/save.js?v=27';
import { IdleGame } from '../src/astral-world/game.js?v=28';
import { activeCombatEvents, clearCombatEvents, createCombatPresentationState, emitCombatEvent, recordComboHit, triggerCombatShake, updateCombatPresentation } from '../src/astral-world/combat-presentation-system.js?v=28';

const renderer={setScene(){},update(){},pulse(){},damage(){}};
const game=()=>new IdleGame(defaultState(),renderer,{});
const enemy=()=>({id:'test-enemy',name:'測試敵人',alive:true,boss:false,hp:500,maxHp:500,defense:0,attack:1,attackSpeed:2,exp:1,gold:1,captureRate:0,hit:0,action:'idle',actionIn:0,effects:{}});

{
  const g=game();g.battle.enemy=enemy();g.damageEnemy(50,'普通攻擊','#fff');
  assert.equal(activeCombatEvents(g.battle.presentation,'damage').length,1,'one damage event per resolved hit');
  assert.equal(g.battle.enemy.hp,450);
}
{
  const g=game();g.battle.enemy=enemy();g.damageEnemy(50,'暴擊','#fff',true);
  assert.equal(activeCombatEvents(g.battle.presentation,'critical').length,1,'critical marker emitted');
  assert.ok(g.battle.presentation.shake.intensity>0,'critical triggers shake');
}
{
  const g=game();g.battle.enemy=enemy();const hp=g.battle.enemy.hp;g.damageEnemy(50,'閃避','#fff',false,'player',1,'miss');
  assert.equal(g.battle.enemy.hp,hp,'MISS deals no damage');assert.equal(activeCombatEvents(g.battle.presentation,'miss').length,1);
}
{
  const g=game();g.state.player.hp=g.state.player.maxHp-5;g.applyPlayerHitEffects([{type:'heal',ratio:.5,source:'test'}]);
  assert.equal(g.state.player.hp,g.state.player.maxHp,'healing clamps to maxHp');assert.equal(activeCombatEvents(g.battle.presentation,'heal')[0].value,5);
  g.applyPlayerHitEffects([{type:'shield',ratio:.1,source:'test'}]);assert.ok(activeCombatEvents(g.battle.presentation,'shield')[0].value>0);
}
{
  const p=createCombatPresentationState();const a=emitCombatEvent(p,{type:'hit'}),b=emitCombatEvent(p,{type:'hit'});assert.notEqual(a.id,b.id,'event IDs unique');
  clearCombatEvents(p);assert.equal(p.events.length,0,'enemy/map transition clears events');
}
{
  const g=game();g.battle.enemy={...enemy(),hp:1,maxHp:1};g.damageEnemy(5,'擊殺','#fff');const kills=g.state.stats.kills;g.killEnemy();assert.equal(g.state.stats.kills,kills,'death reward cannot repeat');
}
{
  const p=createCombatPresentationState();triggerCombatShake(p,{intensity:5,duration:.2});updateCombatPresentation(p,.1,false);assert.notEqual(Math.abs(p.shake.x)+Math.abs(p.shake.y),0);updateCombatPresentation(p,.2,false);assert.equal(p.shake.x,0);assert.equal(p.shake.y,0);
  triggerCombatShake(p,{intensity:5,duration:.2},true);assert.equal(p.shake.intensity,0,'power save disables shake');
}
{
  const p=createCombatPresentationState();for(let i=0;i<30;i+=1)emitCombatEvent(p,{type:'hit',powerSave:true});assert.equal(p.events.length,18,'power save limits transient effects');
  for(let i=0;i<5;i+=1)recordComboHit(p);assert.equal(p.combo.count,5);assert.equal(p.combo.label,'GOOD');for(let i=0;i<16;i+=1)updateCombatPresentation(p,.1,false);assert.equal(p.combo.count,0,'combo expires');
}
{
  for(const artTheme of ['current','cc0-pixel']){const g=game();g.state.settings.artTheme=artTheme;g.battle.enemy=enemy();g.damageEnemy(10,'主題測試','#fff');assert.equal(activeCombatEvents(g.battle.presentation,'damage').length,1,`${artTheme} emits presentation events`);}
}

console.log('Combat Presentation smoke: PASS');
