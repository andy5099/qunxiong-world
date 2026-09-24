import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SessionCredentials,DEFAULT_AI_CONFIG,PROVIDER_PRESETS,CREDENTIALS_KEY} from '../src/ai-adapters.js';
import {createArchive,switchWorld,addWorld} from '../src/archive-engine.js';
import {createWorldDefinition} from '../src/world-factory.js';
import {exportSave,writeSave} from '../src/save.js';
import {aiSettings} from '../src/ai-ui.js';
const config=p=>({...DEFAULT_AI_CONFIG,provider:p,...PROVIDER_PRESETS[p]});
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
const transport=log=>async(url,options)=>{log.push({url,authorization:options.headers.Authorization});return new Response(JSON.stringify({choices:[{message:{content:'{"ok":true}'}}]}));};
test('device opt-in survives fresh sessions, game writes and exports; clear never restores',async()=>{
 const store=storage(),key='test-only-router-sentinel';let c=new SessionCredentials(store);assert.equal(c.remembered,false);c.configure(config('openrouter'),key);assert.equal(store.getItem(CREDENTIALS_KEY),null);c.setRemember(true);
 for(let i=0;i<3;i++){c=new SessionCredentials(store);assert.equal(c.hasKey,true);assert.equal(c.remembered,true);assert.equal(c.config.provider,'openrouter');}
 const archive=createArchive();const original=archive.activeWorldId;addWorld(archive,createWorldDefinition({worldType:'fantasy',name:'測試世界',gimmickMode:'template',template:'prosperity',characters:[]},'world-device'));switchWorld(archive,original);writeSave(archive,store);assert.equal(new SessionCredentials(store).hasKey,true);assert.ok(!exportSave(archive).includes(key));assert.ok(!JSON.stringify(c).includes(key));assert.ok(!aiSettings(archive.worlds[0],c).includes(key));assert.match(aiSettings(archive.worlds[0],c),/sk-or-v1-••••••••••••/);
 const log=[];await c.adapter({fetchImpl:transport(log)}).testConnection();assert.equal(log[0].authorization,'Bearer '+key);
 c.clearSaved();assert.equal(c.hasKey,false);c=new SessionCredentials(store);assert.equal(c.hasKey,false);assert.ok(!store.getItem(CREDENTIALS_KEY).includes(key));
});
test('provider and compatible endpoint keys cannot cross; settings restore and opt-out removes',async()=>{
 const store=storage(),log=[];let c=new SessionCredentials(store);
 c.configure(config('openrouter'),'router-test');c.setRemember(true);c.selectProvider('openai');assert.equal(c.hasKey,false);
 c.configure({...config('openai'),temperature:0.4},'openai-test');c.setRemember(true);
 c.selectProvider('openrouter');await c.adapter({fetchImpl:transport(log)}).testConnection();assert.equal(log.at(-1).authorization,'Bearer router-test');assert.match(log.at(-1).url,/openrouter/);
 c.selectProvider('openai');assert.equal(c.config.temperature,0.4);await c.adapter({fetchImpl:transport(log)}).testConnection();assert.equal(log.at(-1).authorization,'Bearer openai-test');assert.match(log.at(-1).url,/api.openai.com/);
 c.configure({...DEFAULT_AI_CONFIG,provider:'compatible',baseURL:'https://a.example/v1'},'a-test');c.setRemember(true);c.configure({...c.config,baseURL:'https://b.example/v1'});assert.equal(c.hasKey,false);
 c.selectProvider('openai');c.setRemember(false);assert.equal(c.hasKey,true);c=new SessionCredentials(store);c.selectProvider('openai');assert.equal(c.hasKey,false);c.selectProvider('openrouter');assert.equal(c.hasKey,true);
});
test('unavailable device storage reports failure without claiming saved or leaking key',()=>{
 const c=new SessionCredentials({getItem:()=>null,setItem:()=>{throw Error('quota');}});c.configure(config('openrouter'),'test-only-private');assert.throws(()=>c.setRemember(true),/無法保存/);assert.equal(c.remembered,false);assert.ok(!c.storageError.includes('test-only-private'));
 const blocked=new SessionCredentials(()=>{throw Error('denied');});assert.equal(blocked.hasKey,false);assert.match(blocked.storageError,/無法讀取/);
});

