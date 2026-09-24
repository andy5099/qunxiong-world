import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.json':'application/json'};
http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://localhost'),prefix='/dream-world/';
  if(!url.pathname.startsWith(prefix)){res.writeHead(302,{Location:prefix});res.end();return;}
  const relative=decodeURIComponent(url.pathname.slice(prefix.length))||'index.html',file=path.resolve(root,relative);
  if(!file.startsWith(root)){res.writeHead(403);res.end();return;}
  const body=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);
}catch{res.writeHead(404);res.end('Not found');}}).listen(Number(process.argv[2] || 4173),'127.0.0.1',()=>console.log('Dream World server ready'));
