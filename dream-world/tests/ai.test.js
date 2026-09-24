import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { response,npc } from './ai-fixtures.js';
import { taixu } from '../data/worlds/taixu.js';
import { createState,SAVE_KEY } from '../src/state.js';
import { validateAIResponse } from '../src/ai-schema.js';
import { StoryDirector,aiDisplayScene,setStoryMode } from '../src/story-director.js';
import { directorContext } from '../src/ai-memory.js';
import { ChatCompletionsAdapter,SessionCredentials,DEFAULT_AI_CONFIG,validateConfig } from '../src/ai-adapters.js';
import { exportSave,parseSave,validateWorldState,writeSave } from '../src/save.js';
import { StoryEngine } from '../src/story-engine.js';
import { applyChoice } from '../src/choice-engine.js';
import { createArchive,addWorld,activeState,putState } from '../src/archive-engine.js';
import { createWorldDefinition } from '../src/world-factory.js';
import { getCharacter } from '../src/character-engine.js';
const director=r=>new StoryDirector(taixu,{generateScene:async()=>structuredClone(r)});
const choice={id:'ai-choice-0',label:'前進',intent:'前進調查'};
const load=s=>activeState(parseSave(exportSave(s)));
test('AI response validates every field, 0–3 distinct optional actions, adult NPCs and safe identifiers',()=>{
  assert.equal(validateAIResponse(response()).choices.length,3);
  for(const mutate of [r=>r.choices.push({...r.choices[0]}),r=>r.choices[1].intent=r.choices[0].intent,r=>r.media={src:'https://invalid.example'},r=>r.sceneText='',r=>r.newCharacters=[{...npc,age:17}],r=>r.stateChanges.stats.cultivation=Infinity,r=>r.location='__proto__',r=>r.stateChanges.flags={admin:true},r=>delete r.timeAdvance,r=>r.relationshipChanges.shen.trust=50,r=>r.extra='ignored']){
    const r=response();mutate(r);assert.throws(()=>validateAIResponse(r));
  }
  assert.throws(()=>validateAIResponse(JSON.parse('{"__proto__":{}}')));
});
test('AI generation has no fixed next scene and commits only validated detached state',async()=>{
  const s=createState(taixu),before=structuredClone(s);let context;
  const d=new StoryDirector(taixu,{generateScene:async c=>{context=c;return response();}});
  const next=await d.generate(s,{choice});assert.deepEqual(s,before);assert.equal(next.turn,1);assert.equal(next.stats.cultivation,2);assert.equal(next.ai.recent.length,1);assert.equal(next.ai.minutes,15);assert.equal(next.ai.scene.choices.length,3);assert.equal(next.sceneId,s.sceneId);assert.equal(context.context.ACTION.intent,'前進調查');assert.ok(!JSON.stringify(context).includes('"next":'));
  await assert.rejects(director(response({location:'missing'})).generate(next,{choice}));assert.equal(next.turn,1);
});
test('malformed output, quota, HTTP errors and empty/truncated results preserve source state',async()=>{
  for(const [body,status] of [['bad-json',200],[JSON.stringify({choices:[{message:{content:'oops'}}]}),200],[JSON.stringify({choices:[{finish_reason:'length',message:{content:'{}'}}]}),200],['{}',429],['{}',401],['{}',500]]){
    const adapter=new ChatCompletionsAdapter(DEFAULT_AI_CONFIG,'not-a-real-key',{fetchImpl:async()=>new Response(body,{status})}),s=createState(taixu),before=JSON.stringify(s);
    await assert.rejects(new StoryDirector(taixu,adapter).generate(s,{choice}));assert.equal(JSON.stringify(s),before);
  }
});
test('timeout aborts transport and leaves turn, save, relationships, resources unchanged',async()=>{
  let signal;const a=new ChatCompletionsAdapter(DEFAULT_AI_CONFIG,'not-a-real-key',{timeoutMs:15,fetchImpl:async(_,options)=>{signal=options.signal;return new Promise(()=>{});}}),s=createState(taixu),before=exportSave(s);
  await assert.rejects(new StoryDirector(taixu,a).generate(s,{choice}),/逾時/);assert.equal(signal.aborted,true);assert.deepEqual(JSON.parse(exportSave(s)).worlds,JSON.parse(before).worlds);
});
test('real HTTP adapter sends JSON mode and authorization, parses response and tests connection',async()=>{
  let request;const server=createServer(async(req,res)=>{let body='';for await(const c of req)body+=c;request={path:req.url,authorization:req.headers.authorization,body:JSON.parse(body)};res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(request.body.messages[0].content.includes('connection test')?{ok:true}:response())}}]}));});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {const adapter=new ChatCompletionsAdapter({...DEFAULT_AI_CONFIG,provider:'compatible',baseURL:`http://127.0.0.1:${server.address().port}/v1`},'local-test-only');
    const s=await new StoryDirector(taixu,adapter).generate(createState(taixu),{custom:'調查山道'});assert.equal(s.turn,1);assert.equal(request.path,'/v1/chat/completions');assert.equal(request.authorization,'Bearer local-test-only');assert.equal(request.body.response_format.type,'json_object');assert.equal(request.body.messages.length,2);assert.equal(await adapter.testConnection(),true);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
test('rewrite replaces last scene from checkpoint with no duplicate XP, stats, characters or facts, including after reload',async()=>{
  let s=createState(taixu);const r=response({newCharacters:[npc],memoryUpdates:[{id:'promise-1',kind:'promise',text:'答應藍笙尋找失蹤船隊',character:'ai-lan'}]});
  s=await director(r).generate(s,{choice});const xp=s.gimmick.exp,turn=s.turn;
  for(let i=0;i<3;i++){s=load(s);s=await director(r).generate(s,{rewrite:true});assert.equal(s.turn,turn);assert.equal(s.gimmick.exp,xp);assert.equal(s.stats.cultivation,2);assert.equal(s.aiCharacters.length,1);assert.equal(Object.keys(s.ai.facts).length,1);assert.equal(s.ai.checkpoint.state.ai.checkpoint,null);}
  const old=JSON.stringify(s);await assert.rejects(director(response({choices:null})).generate(s,{rewrite:true}));assert.equal(JSON.stringify(s),old);
});
test('AI/offline switching preserves progress, offline actions invalidate stale AI and can return to AI',async()=>{
  let s=await director(response()).generate(createState(taixu),{choice});const stats={...s.stats};s=setStoryMode(s,'offline');assert.equal(s.ai.checkpoint,null);assert.deepEqual(s.stats,stats);
  const local=await new StoryEngine(taixu).scene(s);s=applyChoice(s,taixu,local.choices[0]);s.ai.scene=null;s=setStoryMode(s,'ai');s=await director(response()).generate(s,{choice});assert.equal(s.turn,3);assert.equal(s.ai.mode,'ai');assert.equal(load(s).ai.mode,'ai');
});
test('new NPC, locations, quests, threads, items, factions and secrets survive save/import and enter context',async()=>{
  const r=response({newCharacters:[npc],newLocations:[{id:'harbor',name:'霧港',description:'隱藏港口'}],location:'harbor',participants:['ai-lan'],memoryUpdates:[{id:'meet-lan',text:'在霧港結識藍笙',character:'ai-lan',kind:'event'}],questUpdates:[{id:'fleet',title:'失蹤船隊',description:'尋找藍笙的姐姐',status:'active'}],stateChanges:{stats:{},inventory:{key:1},entities:[{id:'key',kind:'item',name:'銅鑰匙',description:'船倉鑰匙'},{id:'sailors',kind:'faction',name:'渡海盟',description:'航海勢力'},{id:'secret',kind:'secret',name:'霧中鐘',description:'鐘聲引領船隻'}],threads:[{id:'bell',title:'鐘聲',description:'調查霧港鐘聲',status:'active'}]}});
  const s=load(await director(r).generate(createState(taixu),{choice}));assert.equal(getCharacter(s,'ai-lan').secret,npc.secret);assert.equal(s.inventory.key,1);assert.equal(s.ai.quests.fleet.status,'active');assert.equal(s.ai.entities.sailors.kind,'faction');assert.equal(s.location,'harbor');assert.equal(s.ai.threads.bell.status,'active');const ctx=directorContext(s,taixu,'與 ai-lan 交談');assert.ok(ctx.CHARACTERS.some(c=>c.id==='ai-lan'));assert.equal(ctx.MEMORY.unresolvedThreads.length,1);
});
test('120 scenes compact to 12 recent scenes while early promises, enemy, item and unresolved quest persist',async()=>{
  let s=createState(taixu);for(let turn=0;turn<120;turn++){
    const r=response({memoryUpdates:[{id:`fact-${turn}`,text:turn===0?'答應保護沈清霜並歸還銅鑰匙':`第${turn}件重要事件`,character:'shen',kind:turn===0?'promise':'event'}],questUpdates:turn===0?[{id:'promise',title:'歸還銅鑰匙',description:'承諾尚未履行',status:'active'}]:[]});
    if(turn===0){r.memoryUpdates.push({id:'enemy-first',text:'黑帆是船隊的敵人',character:null,kind:'enemy'});r.stateChanges.entities=[{id:'old-key',name:'銅鑰匙',description:'承諾歸還的特殊物品',kind:'item'}];r.stateChanges.inventory={'old-key':1};}
    s=await director(r).generate(s,{choice});
  }
  s=load(s);assert.equal(s.inventory['old-key'],1);assert.equal(s.ai.entities['old-key'].name,'銅鑰匙');assert.equal(s.ai.facts['enemy-first'].kind,'enemy');assert.equal(s.ai.recent.length,12);assert.equal(s.ai.compactedScenes,108);assert.equal(s.ai.summaries.length,12);assert.equal(Object.keys(s.ai.facts).length,121);assert.match(s.ai.facts['fact-0'].text,/歸還/);assert.equal(s.ai.quests.promise.status,'active');const ctx=directorContext(s,taixu,'沈清霜的承諾');assert.ok(ctx.MEMORY.longTerm.some(f=>f.id==='fact-0'));assert.equal(ctx.MEMORY.recent.length,12);assert.ok(!('checkpoint' in ctx));
});
test('V0.1.1 migrates losslessly and isolation keeps other worlds and storage namespaces untouched',async()=>{
  const original=createState(taixu);delete original.ai;delete original.aiCharacters;original.turn=3;original.memory.long.push({text:'舊承諾',turn:2,character:'shen'});
  const old=JSON.stringify(original),s=load(original);assert.equal(s.ai.mode,'offline');assert.equal(s.turn,3);assert.deepEqual(s.memory,JSON.parse(old).memory);assert.equal(s.ai.facts['legacy-0'].text,'舊承諾');
  const archive=createArchive();addWorld(archive,createWorldDefinition({worldType:'fantasy',name:'另一個世界',gimmickMode:'template',template:'return',characters:[]},'world-other'));const other=structuredClone(activeState(archive));putState(archive,await director(response()).generate(archive.worlds[0],{choice}));assert.deepEqual(archive.worlds[1],other);
  const map=new Map([['lineage-save','untouched']]);writeSave(archive,{setItem:(k,v)=>map.set(k,v)});assert.equal(map.get('lineage-save'),'untouched');assert.ok(map.has(SAVE_KEY));assert.equal(map.size,2);
});
test('AI cannot bypass intimacy conditions, erase refusal, invent locked powers or unknown effects',async()=>{
  const s=createState(taixu);s.flags['met:shen']=true;s.characters.shen.flags.refusePrivate=true;
  for(const r of [response({relationshipChanges:{shen:{intimacy:3}}}),response({sceneType:'intimacy',intimacyChecks:[{character:'shen',kind:'date'}]}),response({relationshipChanges:{shen:{refusePrivate:false}}}),response({stateChanges:{stats:{unknown:1}}}),response({gimmickEvents:[{ability:'resonance',text:'未解鎖'}]}),response({stateChanges:{inventory:{unknown:1}}})])await assert.rejects(director(r).generate(s,{choice}));
});
test('repeated dialogue is accepted without mandatory new events',async()=>{
  let s=createState(taixu);
  for(let i=0;i<15;i++)s=await director(response({sceneType:'dialogue',choices:[],stateChanges:{},relationshipChanges:{},timeAdvance:0})).generate(s,{custom:`我想繼續聊剛才的事，第${i}次回覆`});
  assert.equal(s.turn,15);assert.equal(s.ai.scene.choices.length,0);assert.equal(s.ai.recent.length,12);assert.equal(load(s).turn,15);assert.equal(load(s).ai.scene.choices.length,0);assert.equal(directorContext(s,taixu,'繼續').PACING.mustAdvance,undefined);
});
test('AI ability choice spends resources once and rewrite keeps the same settled ability result',async()=>{
  const r=response();r.choices[2].abilityAction={ability:'eye',target:'shen'};
  let s=await director(r).generate(createState(taixu));
  s=await director(response()).generate(s,{choice:aiDisplayScene(s.ai.scene).choices[2]});
  assert.equal(s.gimmick.specialResources.energy,34);assert.equal(s.gimmick.exp,7);assert.equal(s.flags['eye:shen'],true);
  const rewritten=await director(response()).generate(load(s),{rewrite:true});assert.equal(rewritten.gimmick.specialResources.energy,34);assert.equal(rewritten.gimmick.exp,7);
});
test('consensual AI dates progress romance while platonic decisions persist',async()=>{
  const s=createState(taixu);s.flags['met:shen']=true;Object.assign(s.characters.shen,{affection:60,trust:60,intimacy:15,relationship:'曖昧'});
  let next=await director(response({sceneType:'intimacy',intimacyChecks:[{character:'shen',kind:'date'}],relationshipChanges:{shen:{intimacy:3}}})).generate(s,{choice});assert.equal(next.characters.shen.relationship,'戀人');assert.equal(next.characters.shen.flags.privateEvening,true);
  next=await director(response({relationshipChanges:{shen:{platonic:true}}})).generate(next,{choice});assert.equal(next.characters.shen.relationship,'朋友');await assert.rejects(director(response({intimacyChecks:[{character:'shen',kind:'date'}]})).generate(next,{choice}));
});
test('memory credentials are excluded from JSON, save, context and clear on endpoint change',()=>{
  const c=new SessionCredentials();c.configure(DEFAULT_AI_CONFIG,'sentinel-private-key');assert.equal(c.hasKey,true);assert.equal(JSON.stringify(c),'{}');assert.ok(!exportSave(createState(taixu)).includes('sentinel-private-key'));c.configure({...DEFAULT_AI_CONFIG,provider:'compatible',baseURL:'https://example.test/v1'});assert.equal(c.hasKey,false);assert.throws(()=>c.adapter());
  for(const baseURL of ['http://example.test','https://user:password@example.test','https://example.test?key=secret','javascript:alert(1)'])assert.throws(()=>validateConfig({...DEFAULT_AI_CONFIG,provider:'compatible',baseURL}));
});
test('save rejects nested checkpoints and unsupported untrusted fields; UI escapes generated story',async()=>{
  const s=await director(response()).generate(createState(taixu),{choice});const bad=structuredClone(s);bad.ai.checkpoint.state.ai.checkpoint=structuredClone(s.ai.checkpoint);assert.throws(()=>validateWorldState(bad),/巢狀/);
  const {story}=await import('../src/ui.js');const r=response({sceneText:'<img src=x onerror=alert(1)>'});assert.ok(story(s,taixu,aiDisplayScene(r)).includes('&lt;img'));const source=readFileSync(new URL('../src/ai-adapters.js',import.meta.url),'utf8');assert.ok(!source.includes('localStorage'));
});
