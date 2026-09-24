// Local UI verification only. Not included in service-worker cache or provider options.
import { createServer } from 'node:http';
import { adventureResponse } from './dynamic-fixture.js';
import { response,npc } from './ai-fixtures.js';
createServer(async(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin',process.env.DREAM_TEST_ORIGIN||'http://127.0.0.1:4190');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
  if(req.method==='OPTIONS'){res.writeHead(204).end();return;}
  if(req.url!=='/v1/chat/completions'){res.writeHead(404).end();return;}
  let body='';for await(const c of req)body+=c;
  const input=JSON.parse(body);if(input.model==='test-error'){res.writeHead(429).end();return;}
  if(input.model==='test-malformed'){res.end(JSON.stringify({choices:[{message:{content:'not json'}}]}));return;}
  const ctx=JSON.parse(input.messages[1].content);
  const r=ctx.test?{ok:true}:input.model==='test-adventure'?adventureResponse(ctx):response({sceneText:'【本機模擬回應：驗證流程用，非真正 AI】\n\n霧港鐘聲響起，行商藍笙遞來銅鑰匙。「若你願意幫忙找船，我就說出鐘聲的秘密。」沈清霜看了你一眼，忍著笑補上一句：「先別把鑰匙弄丟。」',location:ctx.WORLD.location,newCharacters:ctx.CHARACTER_CATALOG.some(c=>c.id===npc.id)?[]:[npc],memoryUpdates:[{id:'ui-'+Date.now(),text:'藍笙記得你在霧港的幫忙',character:npc.id,kind:'promise'}]});
  if(!ctx.test && input.model==='test-dialogue'){r.sceneText='【本機模擬，非真實模型】沈清霜回應你的話：「'+ctx.ACTION.intent+'」——我聽見了，我們可以慢慢說。';r.sceneType='dialogue';r.choices=[];r.timeAdvance=0;}
  res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(r)}}]}));
}).listen(Number(process.env.DREAM_TEST_PORT||4192),'127.0.0.1',()=>console.log('Local mock provider: UI verification only.'));
