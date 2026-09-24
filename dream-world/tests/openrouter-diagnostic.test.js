import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ChatCompletionsAdapter,DEFAULT_AI_CONFIG,PROVIDER_PRESETS} from '../src/ai-adapters.js';
const config={...DEFAULT_AI_CONFIG,provider:'openrouter',...PROVIDER_PRESETS.openrouter};
const key='test-secret-never-display';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status});
const models=()=>json({data:[{id:config.model}]});
test('OpenRouter verifies key, catalog then short current-model call without leaking key',async()=>{
 const calls=[],progress=[];const a=new ChatCompletionsAdapter(config,key,{fetchImpl:async(url,o)=>{calls.push({url,o});return url.endsWith('/key')?json({data:{}}):url.endsWith('/models')?models():json({choices:[{message:{content:'OK'}}]});}});
 assert.equal(await a.testConnection(d=>progress.push(d)),true);assert.deepEqual(calls.map(c=>c.url.split('/').at(-1)),['key','models','completions']);assert.equal(calls[0].o.headers.Authorization,'Bearer '+key);assert.equal(calls[1].o.headers,undefined);assert.equal(JSON.parse(calls[2].o.body).model,config.model);assert.equal(JSON.parse(calls[2].o.body).max_tokens,16);assert.equal(progress.at(-1).model,'成功');assert.ok(!JSON.stringify(progress).includes(key));
});
test('all real HTTP errors retain code and sanitized message, never mislabeled CORS',async()=>{
 for(const status of [400,401,402,403,404,429,500,503]){
  const a=new ChatCompletionsAdapter(config,key,{fetchImpl:async url=>url.endsWith('/key')?json({data:{}}):url.endsWith('/models')?models():json({error:{message:'Provider denied '+key+' sk-or-v1-secretvalue'}},status)});
  await assert.rejects(a.testConnection(),e=>e.message.includes(String(status))&&e.message.includes('Provider denied')&&!e.message.includes(key)&&!e.message.includes('secretvalue')&&!e.message.includes('CORS'));
 }
});
test('invalid key stops paid request; missing model remains selected and explicitly fails',async()=>{
 for(const missing of [false,true]){let posts=0;const a=new ChatCompletionsAdapter(config,key,{fetchImpl:async(url,o)=>{if(o.method==='POST')posts++;return url.endsWith('/key')?(missing?json({data:{}}):json({error:{message:'Invalid key'}},401)):json({data:missing?[]:[{id:config.model}]});}});await assert.rejects(a.testConnection(),missing?/模型不存在或目前不可用/:/401/);assert.equal(posts,0);assert.equal(a.config.model,config.model);}
});
test('fetch rejection and timeout are distinct from HTTP JSON failures',async()=>{
 const network=new ChatCompletionsAdapter(config,key,{fetchImpl:async()=>{throw Error('secret '+key);}});await assert.rejects(network.testConnection(),/瀏覽器網路\/CORS連線失敗/);
 const timeout=new ChatCompletionsAdapter(config,key,{fetchImpl:()=>new Promise(()=>{}),timeoutMs:5});await assert.rejects(timeout.testConnection(),/逾時/);
 const bad=new ChatCompletionsAdapter(config,key,{fetchImpl:async()=>new Response('bad',{status:502})});await assert.rejects(bad.testConnection(),e=>e.message.includes('502')&&!e.message.includes('CORS'));
});
