import {test} from 'node:test';
import assert from 'node:assert/strict';
import {adventureResponse} from './dynamic-fixture.js';
import {response} from './ai-fixtures.js';
import {createState} from '../src/state.js';
import {taixu} from '../data/worlds/taixu.js';
import {StoryDirector,aiDisplayScene} from '../src/story-director.js';
import {exportSave,parseSave} from '../src/save.js';
test('20 selected actions advance unique scenes/options and survive reload',async()=>{
 let observed;const director=new StoryDirector(taixu,{generateScene:async({context})=>{observed=context;return adventureResponse(context);}});
 let s=await director.generate(createState(taixu));const texts=new Set([s.ai.scene.sceneText]),labels=new Set(s.ai.scene.choices.map(c=>c.label));
 for(let i=1;i<=20;i++){
  const choice=aiDisplayScene(s.ai.scene).choices[(i-1)%3];s=await director.generate(s,{choice});assert.equal(observed.ACTION.intent,choice.intent);assert.equal(s.turn,i);assert.equal(s.ai.scene.choices.length,3);
  assert.ok(!texts.has(s.ai.scene.sceneText));texts.add(s.ai.scene.sceneText);for(const c of s.ai.scene.choices){assert.ok(!labels.has(c.label));labels.add(c.label);}
  s=parseSave(exportSave(s)).worlds[0];assert.equal(s.turn,i);
 }
 assert.equal(Object.keys(s.ai.facts).filter(id=>id.startsWith('milestone-')).length,4);assert.ok(!Object.keys(s.ai.facts).some(id=>id.startsWith('routine-')));assert.equal(s.ai.quests['bell-case'].status,'resolved');assert.match(s.characters.shen.status,/幕後主使/);
 s=await director.generate(s,{choice:aiDisplayScene(s.ai.scene).choices[0]});assert.equal(s.turn,21);
});
test('repeated scene or all reused choices fail without committing action',async()=>{
 let s=await new StoryDirector(taixu,{generateScene:async()=>response()}).generate(createState(taixu));const before=JSON.stringify(s);
 for(const r of [response(),response({sceneText:'不同文字但選項重用'})]){await assert.rejects(new StoryDirector(taixu,{generateScene:async()=>r}).generate(s,{choice:aiDisplayScene(s.ai.scene).choices[0]}),/重複|重用/);assert.equal(JSON.stringify(s),before);}
});
