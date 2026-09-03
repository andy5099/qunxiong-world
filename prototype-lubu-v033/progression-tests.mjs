import assert from 'node:assert/strict';
import {normalizeProgression,previewEnhance,enhance,breakthrough,combatBonus,characterPower,partyPower,recommendedPower,STAR_COSTS,QUALITY_SOULS} from './character-progression.mjs';
const old=normalizeProgression({lubu:{captured:true,souls:20,breakthrough:2},gold:999999});
assert.equal(old.characters.lubu.stars,2);assert.equal(old.characters.lubu.souls,20);assert.equal(old.characters.guanyu.level,1);
old.characters.guanyu.exp=999999;const p=previewEnhance(old,'guanyu',true);assert.ok(p.to>1);enhance(old,'guanyu',true);assert.equal(old.characters.guanyu.level,p.to);
old.characters.guanyu.souls=STAR_COSTS[0];assert.equal(breakthrough(old,'guanyu').to,1);assert.equal(old.characters.guanyu.souls,0);
const zero=normalizeProgression({gold:0});assert.equal(previewEnhance(zero,'zhangfei',true).to,1);assert.equal(breakthrough(zero,'zhangfei'),null);
const base=combatBonus(zero,'zhangfei');zero.characters.zhangfei.stars=5;const max=combatBonus(zero,'zhangfei');assert.ok(max.breakPower>base.breakPower);
for(const id of ['guanyu','liubei','lubu']){const rank0=normalizeProgression({gold:0}),before=combatBonus(rank0,id);rank0.characters[id].stars=5;const after=combatBonus(rank0,id);assert.ok(after.damage>before.damage,`${id} ★5 damage`);assert.ok(after.skill>before.skill,`${id} ★5 skill`)}
const cap=normalizeProgression({gold:999999999});cap.characters.guanyu.exp=999999999;enhance(cap,'guanyu',true);assert.equal(cap.characters.guanyu.level,100);
assert.ok(characterPower(old,'guanyu')>620);assert.ok(partyPower(old)>0);assert.ok(recommendedPower(20)>recommendedPower(1));assert.deepEqual(QUALITY_SOULS,{normal:1,rare:2,epic:4,legendary:8});
console.log('Character progression: 25 assertions passed');
