import { visualMapTheme } from './visual-theme.js';

const path = (ctx, points) => { ctx.beginPath(); ctx.moveTo(...points[0]); points.slice(1).forEach(point => ctx.lineTo(...point)); ctx.closePath(); };
const hill = (ctx, y, color, offset, height) => { ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,430);ctx.lineTo(0,y);for(let x=0;x<=420;x+=48)ctx.quadraticCurveTo(x+24,y-height-Math.sin((x+offset)*.025)*height*.35,x+48,y);ctx.lineTo(420,430);ctx.fill(); };

function meadow(ctx,t,powerSave){
  const sun=ctx.createRadialGradient(315,70,3,315,70,78);sun.addColorStop(0,'rgba(255,242,172,.8)');sun.addColorStop(1,'rgba(255,236,167,0)');ctx.fillStyle=sun;ctx.fillRect(225,0,165,160);
  hill(ctx,245,'#315f68',t*3,50); hill(ctx,286,'#286452',t*8,34);
  ctx.fillStyle='#d9e8e6';for(let i=0;i<5;i++){const x=38+i*73;ctx.fillRect(x,205-(i%2)*13,7,62);ctx.fillStyle='#8ea7b4';ctx.beginPath();ctx.moveTo(x-12,205);ctx.lineTo(x+3,177);ctx.lineTo(x+18,205);ctx.fill();ctx.fillStyle='#d9e8e6';}
  ctx.fillStyle='#3b8055';ctx.fillRect(0,310,390,120);if(!powerSave)for(let i=0;i<22;i++){const x=(i*53)%390,y=322+(i*29)%92;ctx.fillStyle=i%3?'#8ee37d':'#ffe07a';ctx.beginPath();ctx.arc(x,y,1.8,0,7);ctx.fill();}
}
function forest(ctx,t,powerSave){
  ctx.fillStyle='#0a2631';for(let i=0;i<7;i++){const x=i*68-20;ctx.fillRect(x,88+(i%2)*18,18,235);ctx.beginPath();ctx.arc(x+8,93,48,0,7);ctx.arc(x+35,115,38,0,7);ctx.fill();}
  ctx.strokeStyle='rgba(99,255,196,.32)';ctx.lineWidth=3;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(i*95,150);ctx.bezierCurveTo(i*80+60,190,i*110,250,i*90+70,315);ctx.stroke();}
  hill(ctx,318,'#103a31',t*4,28);if(!powerSave)for(let i=0;i<12;i++){const x=(i*79+t*9)%410-10,y=90+(i*43)%210;ctx.fillStyle='rgba(113,255,203,.6)';ctx.beginPath();ctx.arc(x,y,2,0,7);ctx.fill();}
}
function lava(ctx,t,powerSave){
  path(ctx,[[0,245],[48,160],[77,237],[130,118],[175,244],[220,155],[270,245],[326,124],[390,240],[390,430],[0,430]]);ctx.fillStyle='#321b29';ctx.fill();
  ctx.fillStyle='#1c1420';ctx.fillRect(0,285,390,145);ctx.strokeStyle='#ff6b38';ctx.lineWidth=4;for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(i*67,430);ctx.lineTo(i*67+20,370);ctx.lineTo(i*67+5,342);ctx.stroke();}
  if(!powerSave)for(let i=0;i<13;i++){const x=(i*43)%390,y=340-((t*36+i*51)%245);ctx.fillStyle=i%2?'#ffae4f':'#ff6542';ctx.fillRect(x,y,3,7);}
}
function ice(ctx,t,powerSave){
  ctx.fillStyle='rgba(215,249,255,.16)';for(let i=0;i<7;i++){const x=i*62-12;path(ctx,[[x,306],[x+25,174-(i%3)*28],[x+54,306]]);ctx.fill();ctx.strokeStyle='rgba(220,250,255,.42)';ctx.stroke();}
  ctx.fillStyle='#29536c';ctx.fillRect(0,316,390,114);ctx.strokeStyle='#aeeaff';ctx.lineWidth=1.5;for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(i*55,430);ctx.lineTo(i*55+36,350);ctx.lineTo(i*55+9,320);ctx.stroke();}
  if(!powerSave)for(let i=0;i<24;i++){ctx.fillStyle='rgba(239,253,255,.65)';ctx.fillRect((i*71+t*7)%400,(i*37+t*16)%330,1.5,5);}
}
function ruins(ctx,t,powerSave){
  const portal=ctx.createRadialGradient(300,102,8,300,102,82);portal.addColorStop(0,'rgba(224,176,255,.55)');portal.addColorStop(.4,'rgba(126,85,232,.22)');portal.addColorStop(1,'rgba(90,48,160,0)');ctx.fillStyle=portal;ctx.fillRect(210,12,180,180);
  ctx.strokeStyle='#886dd1';ctx.lineWidth=5;ctx.beginPath();ctx.arc(300,106,46,0,7);ctx.stroke();ctx.lineWidth=1;ctx.strokeStyle='#d4b8ff';ctx.beginPath();ctx.arc(300,106,36+t%1,0,7);ctx.stroke();
  ctx.fillStyle='#201a4b';for(let i=0;i<6;i++){const x=i*78-8;ctx.fillRect(x,176+(i%2)*35,20,164);path(ctx,[[x-8,180+(i%2)*35],[x+10,146+(i%2)*35],[x+28,180+(i%2)*35]]);ctx.fill();}
  ctx.fillStyle='#19153d';ctx.fillRect(0,318,390,112);ctx.strokeStyle='rgba(184,136,255,.35)';for(let y=330;y<430;y+=25){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(390,y-12);ctx.stroke();}
  if(!powerSave)for(let i=0;i<10;i++){const a=t*.35+i*.63;ctx.fillStyle='rgba(205,160,255,.5)';ctx.fillRect(190+Math.cos(a)*150,190+Math.sin(a)*75,3,3);}
}

export function drawBattleBackground(ctx,map,{time=0,powerSave=false,stars=[]}={}){
  const theme=visualMapTheme(map?.id);const g=ctx.createLinearGradient(0,0,0,430);g.addColorStop(0,theme.sky[0]);g.addColorStop(1,theme.sky[1]);ctx.fillStyle=g;ctx.fillRect(0,0,390,430);
  ctx.save();ctx.globalAlpha=.4;ctx.fillStyle='#eef7ff';stars.forEach(s=>{ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,7);ctx.fill();});ctx.restore();
  ({1:meadow,2:forest,3:lava,4:ice,5:ruins}[map?.id]||meadow)(ctx,time,powerSave);
  const shade=ctx.createLinearGradient(0,250,0,430);shade.addColorStop(0,'rgba(4,8,25,0)');shade.addColorStop(1,'rgba(4,7,20,.72)');ctx.fillStyle=shade;ctx.fillRect(0,245,390,185);
}

export function validateBattleBackgrounds(){return [1,2,3,4,5].every(id=>typeof ({1:meadow,2:forest,3:lava,4:ice,5:ruins}[id])==='function');}
