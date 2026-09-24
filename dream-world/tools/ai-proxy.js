// Optional private proxy. Secrets only come from process environment, never files.
import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
const key=process.env.DREAM_AI_KEY,token=process.env.DREAM_PROXY_TOKEN;
if(!key||!token||token.length<24)throw new Error('Set DREAM_AI_KEY and a random DREAM_PROXY_TOKEN (24+ characters) in the process environment.');
const upstream=new URL(process.env.DREAM_AI_BASE_URL||'https://api.openai.com/v1/');
if(upstream.protocol!=='https:'||upstream.username||upstream.password||upstream.search||upstream.hash)throw new Error('Upstream requires HTTPS without credentials in its URL.');
const allowed=new Set((process.env.DREAM_ALLOWED_ORIGINS||'https://andy5099.github.io,http://127.0.0.1:4190').split(','));
const model=process.env.DREAM_AI_MODEL||'gpt-4.1-mini';let active=false;
const equals=(a,b)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);};
createServer(async(req,res)=>{
  const origin=req.headers.origin;
  res.setHeader('Cache-Control','no-store');res.setHeader('Vary','Origin');
  if(!allowed.has(origin)){res.writeHead(403).end();return;}
  res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  if(req.url!=='/v1/chat/completions'){res.writeHead(404).end();return;}
  if(req.method==='OPTIONS'){res.writeHead(204).end();return;}
  if(req.method!=='POST'||!equals(req.headers.authorization||'',`Bearer ${token}`)){res.writeHead(401).end();return;}
  if(active){res.writeHead(429).end();return;}active=true;
  try{
    let body='',size=0;
    for await(const chunk of req){size+=chunk.length;if(size>250000)throw new Error('size');body+=chunk;}
    const input=JSON.parse(body);
    if(!Array.isArray(input.messages)||input.messages.length!==2||input.messages.some(m=>!['system','user'].includes(m.role)||typeof m.content!=='string'))throw new Error('messages');
    const response=await fetch(new URL('chat/completions',upstream.href.replace(/\/?$/,'/')),{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model,messages:input.messages,response_format:{type:'json_object'},temperature:Math.max(0,Math.min(2,Number(input.temperature)||0.9)),max_tokens:6000}),signal:AbortSignal.timeout(40000),redirect:'error'});
    if(!response.ok){res.writeHead(response.status).end();return;}
    const data=await response.json();res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify({choices:data.choices}));
  }catch{res.writeHead(502).end();}finally{active=false;}
}).listen(Number(process.env.DREAM_PROXY_PORT||4191),'127.0.0.1',()=>console.log('Private AI proxy listening on loopback. No request bodies or credentials are logged.'));
