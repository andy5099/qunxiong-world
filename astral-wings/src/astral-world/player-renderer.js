import { getArtAsset, getArtAssetDefinition } from './art-asset-manager.js';
import { drawSpriteAnimation } from './sprite-renderer.js';

// Canvas art is retained strictly as a safe fallback until licensed final art is supplied.
const poly = (ctx, pts) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i=1;i<pts.length;i+=1) ctx.lineTo(pts[i][0],pts[i][1]); ctx.closePath(); };

function drawBlade(ctx, swing) {
  ctx.save(); ctx.rotate(-.24+swing); ctx.shadowColor='#75e4ff';ctx.shadowBlur=14;
  ctx.fillStyle='#e9fbff';poly(ctx,[[20,7],[31,-43],[38,-55],[36,-37],[26,10]]);ctx.fill();
  ctx.fillStyle='#78caff';poly(ctx,[[26,5],[34,-43],[36,-37],[31,8]]);ctx.fill();ctx.strokeStyle='#183d80';ctx.lineWidth=2;ctx.stroke();
  ctx.shadowBlur=0;ctx.fillStyle='#e9bc68';ctx.fillRect(15,4,17,4);ctx.fillStyle='#2c1d4d';ctx.fillRect(20,8,5,13);ctx.restore();
}

function drawFace(ctx, time, hurt) {
  ctx.fillStyle=hurt?'#ffe7df':'#f7d6bd';ctx.beginPath();ctx.arc(0,-39,12.5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#263663';poly(ctx,[[-13,-42],[-10,-53],[-2,-57],[4,-54],[13,-48],[10,-39],[4,-46],[-2,-43],[-8,-38]]);ctx.fill();
  ctx.fillStyle='#6ecfff';ctx.beginPath();ctx.arc(-4,-39,1.65,0,Math.PI*2);ctx.arc(5,-39,1.65,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-4.5,-39.6,.55,0,7);ctx.arc(4.5,-39.6,.55,0,7);ctx.fill();
  ctx.strokeStyle='#a25c65';ctx.lineWidth=1.1;ctx.beginPath();ctx.arc(1,-34,2.7,.1,Math.PI-.1);ctx.stroke();
  ctx.fillStyle='#f09bad';ctx.globalAlpha=.45+.12*Math.sin(time*4);ctx.beginPath();ctx.arc(-8,-33,2,0,Math.PI*2);ctx.arc(9,-33,2,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
}

function drawArmor(ctx, time, level, low) {
  ctx.fillStyle='#1e2a64';poly(ctx,[[-18,-17],[-27,-5],[-18,8],[-14,27],[0,34],[15,27],[19,8],[28,-5],[18,-17],[0,-24]]);ctx.fill();
  const steel=ctx.createLinearGradient(0,-24,0,28);steel.addColorStop(0,'#c9f2ff');steel.addColorStop(.35,'#4d83c4');steel.addColorStop(1,'#1b275e');ctx.fillStyle=steel;poly(ctx,[[-13,-21],[0,-27],[13,-21],[15,8],[8,24],[0,29],[-8,24],[-15,8]]);ctx.fill();ctx.strokeStyle='#d9f9ff';ctx.lineWidth=1.4;ctx.stroke();
  ctx.fillStyle='#66dcff';ctx.shadowColor='#4ddcff';ctx.shadowBlur=12+level*1.4;ctx.beginPath();ctx.arc(0,1,4+Math.sin(time*6)*.7,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  ctx.strokeStyle=low?'#ff6a7d':'#78baff';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-10,8);ctx.lineTo(10,8);ctx.moveTo(-7,16);ctx.lineTo(7,16);ctx.stroke();
  ctx.fillStyle='#e8c16d';poly(ctx,[[-18,-16],[-27,-11],[-25,-3],[-15,-8]]);ctx.fill();poly(ctx,[[18,-16],[27,-11],[25,-3],[15,-8]]);ctx.fill();
  ctx.fillStyle='#17204b';ctx.fillRect(-13,27,9,17);ctx.fillRect(4,27,9,17);ctx.fillStyle='#d5efff';ctx.fillRect(-14,40,11,5);ctx.fillRect(3,40,11,5);
  if(level>=3){ctx.fillStyle='#4775c9';poly(ctx,[[-16,-12],[-34,-1],[-22,10],[-12,4]]);ctx.fill();poly(ctx,[[16,-12],[34,-1],[22,10],[12,4]]);ctx.fill();}
  if(level>=5){ctx.strokeStyle='#baf6ff';ctx.globalAlpha=.65;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,2,27+Math.sin(time*4)*2,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
}

function drawMagic(ctx, action, time) {
  ctx.save();ctx.globalCompositeOperation='lighter';
  if(action==='attack'){ctx.strokeStyle='#95f4ff';ctx.shadowColor='#59cfff';ctx.shadowBlur=16;ctx.lineWidth=3;ctx.beginPath();ctx.arc(36,-11,25,-1.9,.9);ctx.stroke();}
  if(action.startsWith('skill')){const color=action==='skill4'?'#ffd16a':'#9c92ff';ctx.strokeStyle=color;ctx.shadowColor=color;ctx.shadowBlur=18;ctx.lineWidth=2.4;for(let i=0;i<3;i+=1){ctx.beginPath();ctx.arc(0,2,18+i*8+Math.sin(time*7+i)*2,i*.8,i*.8+1.6);ctx.stroke();}}
  if(action==='revive'){ctx.fillStyle='#b9f8ff';for(let i=0;i<7;i+=1){const a=time*5+i*.9;ctx.fillRect(Math.cos(a)*25-2,-10+Math.sin(a)*14,4,8);}}ctx.restore();
}

export function drawPlayer(ctx, state, battle, x, y, time) {
  const player=state.player,action=battle.playerAction||'idle',hurt=action==='hurt'||battle.playerFlash>0,downed=action==='downed'||battle.reviveIn>0;
  const animation=downed?'death':hurt?'hurt':action.startsWith('skill')?'skill':action==='attack'?'attack':action==='move'?'move':'idle';const id=`character.astralBlade.${animation}`,image=getArtAsset(id),definition=getArtAssetDefinition(id);
  const spriteElapsed=definition?.loop===false?Math.max(0,(definition.frameCount/definition.fps)-(battle.playerActionIn||0)):time;
  if(image&&definition&&drawSpriteAnimation(ctx,image,{...definition,elapsed:spriteElapsed,x,y,scale:1,loop:definition.loop!==false,powerSave:state.settings?.powerSave}))return;
  const bob=downed?16:Math.sin(time*2.5)*2.2,swing=(action==='attack'||action.startsWith('skill'))?Math.sin(Math.min(1,(battle.playerActionIn||0)*7)*Math.PI)*.9:0,low=player.hp/player.maxHp<.3,walk=Math.sin(time*4)*2;
  ctx.save();ctx.translate(x,y+bob);if(downed)ctx.rotate(-.82);if(hurt&&Math.floor(time*18)%2===0)ctx.globalAlpha=.58;ctx.shadowColor=low?'#ff6980':'#65cfff';ctx.shadowBlur=15;
  ctx.fillStyle=low?'#5a263f':'#2a2466';poly(ctx,[[-14,14],[-31,36],[-12,31],[-3,16]]);ctx.fill();poly(ctx,[[13,14],[31,36],[11,31],[3,16]]);ctx.fill();
  ctx.fillStyle='#12183f';poly(ctx,[[-12,21],[-22,48],[-7,48],[-1,29],[6,48],[22,48],[12,21]]);ctx.fill();ctx.fillStyle='#67b8eb';ctx.fillRect(-22,46+walk,15,5);ctx.fillRect(7,46-walk,15,5);
  drawArmor(ctx,time,player.level||1,low);ctx.fillStyle='#34549d';ctx.beginPath();ctx.ellipse(-22,-4,7,15,-.45,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(22,-4,7,15,.45,0,Math.PI*2);ctx.fill();drawFace(ctx,time,hurt);drawBlade(ctx,swing);drawMagic(ctx,action,time);
  if(low&&!downed){ctx.globalAlpha=.65;ctx.strokeStyle='#ff8292';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-12,12);ctx.lineTo(-4,7);ctx.moveTo(13,18);ctx.lineTo(6,11);ctx.stroke();}ctx.restore();
}
