import {test} from 'node:test';
import assert from 'node:assert/strict';
import {response} from './ai-fixtures.js';
import {createState} from '../src/state.js';
import {taixu} from '../data/worlds/taixu.js';
import {StoryDirector,aiDisplayScene,DIRECTOR_PROMPT} from '../src/story-director.js';
import {validateAIResponse} from '../src/ai-schema.js';
import {SessionCredentials,PROVIDER_PRESETS,DEFAULT_AI_CONFIG,validateConfig} from '../src/ai-adapters.js';
import {story} from '../src/ui.js';
import {aiWelcome,aiSettings} from '../src/ai-ui.js';
import {exportSave,parseSave} from '../src/save.js';
test('AI opening and zero-choice responses expose the same visible composer',()=>{
 const s=createState(taixu);
 for(const html of [aiWelcome(s),story(s,taixu,aiDisplayScene(response({choices:[]})))]){
  assert.match(html,/<form id="custom-form"/);assert.match(html,/<textarea id="custom-input"/);assert.ok(!html.includes('<details class="custom-action">'));assert.match(html,/送出對話／行動/);
 }
 for(let n=0;n<=3;n++)assert.equal(validateAIResponse(response({choices:response().choices.slice(0,n)})).choices.length,n);
});
test('free input reaches context verbatim, saves and reloads without losing conversation or NPC memory',async()=>{
 let context;const text='清霜，剛才我說的話讓你不開心嗎？';
 const d=new StoryDirector(taixu,{generateScene:async c=>{context=c.context;return response({sceneType:'dialogue',choices:[],memoryUpdates:[{id:'talk-1',text:'你詢問清霜的感受',character:'shen',kind:'event'}]});}});
 let s=await d.generate(createState(taixu),{custom:text});assert.equal(context.ACTION.intent,text);assert.match(DIRECTOR_PROMPT,/優先直接回應/);
 s=parseSave(exportSave(s)).worlds[0];assert.equal(s.ai.recent[0].choice,text);assert.equal(s.ai.scene.choices.length,0);assert.equal(s.ai.facts['talk-1'].character,'shen');assert.ok(s.characters.shen.memories.some(m=>m.text==='你詢問清霜的感受'));
 await assert.rejects(d.generate(s,{custom:'   '}),/輸入/);
});
test('OpenRouter preset and model switching send exact model, protect credentials and do not change saves',async()=>{
 const credentials=new SessionCredentials(),requests=[];
 const transport=async(url,options)=>{requests.push({url,body:JSON.parse(options.body)});return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:'{"ok":true}'}}]}));};
 const config={...DEFAULT_AI_CONFIG,provider:'openrouter',...PROVIDER_PRESETS.openrouter};
 credentials.configure(config,'test-only-sentinel');await credentials.adapter({fetchImpl:transport}).testConnection();
 assert.equal(requests[0].url,'https://openrouter.ai/api/v1/chat/completions');assert.equal(requests[0].body.model,'cognitivecomputations/dolphin-mistral-24b-venice-edition');
 credentials.configure({...config,model:'another-model'});assert.equal(credentials.hasKey,true);await credentials.adapter({fetchImpl:transport}).testConnection();assert.equal(requests[1].body.model,'another-model');
 const s=createState(taixu);assert.ok(!aiSettings(s,credentials).includes('test-only-sentinel'));assert.ok(!exportSave(s).includes('test-only-sentinel'));assert.equal(JSON.stringify(credentials),'{}');
 credentials.configure(DEFAULT_AI_CONFIG);assert.equal(credentials.hasKey,false);assert.throws(()=>credentials.adapter(),/AI 暫不可用/);
 assert.equal(validateConfig({...config,baseURL:'https://wrong.example'}).baseURL,PROVIDER_PRESETS.openrouter.baseURL);
});
test('429 and 402 retain AI mode and original zero-choice conversation without fallback',async()=>{
 const s=createState(taixu);s.ai.scene=response({choices:[]});const before=JSON.stringify(s),c=new SessionCredentials();c.configure(DEFAULT_AI_CONFIG,'test-only-sentinel');
 for(const status of [429,402]){
  const d=new StoryDirector(taixu,c.adapter({fetchImpl:async()=>new Response('{}',{status})}));
  await assert.rejects(d.generate(s,{custom:'我們繼續說吧'}),/AI 暫不可用/);assert.equal(JSON.stringify(s),before);assert.equal(s.ai.mode,'ai');
 }
});
