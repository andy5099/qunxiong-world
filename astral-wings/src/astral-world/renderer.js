import { MAPS, QUALITY, SLOTS } from './data.js';
import { clamp } from './core.js';
import { drawMonster } from './monster-renderer.js';
import { drawPlayer } from './player-renderer.js';
import { drawPet as drawBattlePet } from './pet-renderer.js';
import { drawBattleBackground } from './battle-background-renderer.js';
import { getArtAsset } from './art-asset-manager.js';
import { drawCoverImage } from './sprite-renderer.js';
import { drawCc0PixelMonster, drawCc0PixelPet, drawCc0PixelPlayer, getCc0PixelBackground, shouldUseCc0PixelTheme } from './cc0-pixel-theme.js';
import { activeCombatEvents, getCombatOffset } from './combat-presentation-system.js?v=28';

const W = 390;
const H = 430;

function rgba(hex, alpha) {
  const value = hex.replace('#', '');
  const n = Number.parseInt(value, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export class BattleRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.time = 0;
    this.effects = [];
    this.numbers = [];
    this.stars = Array.from({ length: 38 }, (_, index) => ({ x: (index * 83) % W, y: (index * 131) % H, r: 0.5 + (index % 3) * 0.45, speed: 5 + (index % 5) * 4 }));
    this.scene = null;
    this.resize();
    window.addEventListener('resize', () => this.resize(), { passive: true });
  }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = W * dpr;
    this.canvas.height = H * dpr;
    this.canvas.style.aspectRatio = `${W} / ${H}`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  setScene(scene) { this.scene = scene; }

  pulse(type, x, y, color = '#7fd9ff', size = 28) {
    const duration = type === 'evolution' ? 2 : 0.52;
    this.effects.push({ type, x, y, color, size, life: duration, max: duration });
    if (this.effects.length > 38) this.effects.shift();
  }

  damage(value, x, y, critical = false, color = '#e9f7ff') {
    this.numbers.push({ value, x, y, critical, color, life: 0.75 });
    if (this.numbers.length > 24) this.numbers.shift();
  }

  update(dt) {
    this.time += dt;
    for (const star of this.stars) { star.y += star.speed * dt; if (star.y > H) star.y = -3; }
    for (const list of [this.effects, this.numbers]) {
      for (let i = list.length - 1; i >= 0; i -= 1) {
        list[i].life -= dt;
        if ('y' in list[i] && list === this.numbers) list[i].y -= 28 * dt;
        if (list[i].life <= 0) list.splice(i, 1);
      }
    }
    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    const scene = this.scene;
    ctx.clearRect(0, 0, W, H);
    const map = MAPS[(scene?.state?.mapId || 1) - 1] || MAPS[0];
    const pixelTheme=shouldUseCc0PixelTheme(scene?.state);
    const background=pixelTheme?getCc0PixelBackground():(map.id===1?getArtAsset('background.region01.battle'):null);
    if(!drawCoverImage(ctx,background,W,H))drawBattleBackground(ctx, map, { time: this.time, powerSave: scene?.state?.settings?.powerSave, stars: this.stars });
    else if(!scene?.state?.settings?.powerSave){ctx.save();ctx.globalAlpha=.22;ctx.fillStyle='#eaf8ff';this.stars.slice(0,10).forEach(star=>{ctx.beginPath();ctx.arc(star.x,star.y,star.r,0,Math.PI*2);ctx.fill();});ctx.restore();}
    if (!scene?.battle) return;
    const enemy = scene.battle.enemy;
    const presentation=scene.battle.presentation,shake=presentation?.shake||{x:0,y:0};
    const enemyOffset=getCombatOffset(presentation,'enemy'),playerOffset=getCombatOffset(presentation,'player'),petOffset=getCombatOffset(presentation,'pet');
    ctx.save();ctx.translate(shake.x||0,shake.y||0);
    this.drawBossEncounter(ctx,scene.battle.bossRuntime);
    if (enemy) pixelTheme?this.drawCc0Monster(ctx,enemy,scene.battle,enemyOffset):this.drawMonster(ctx, enemy, scene.battle, scene.state.settings?.powerSave,enemyOffset);
    if(pixelTheme)this.drawCc0Pet(ctx,scene.state,scene.battle,142+petOffset,300);else this.drawPet(ctx, scene.state, scene.battle, 142+petOffset,300);
    if(pixelTheme)drawCc0PixelPlayer(ctx,scene.state,scene.battle,110+playerOffset,315,this.time);else drawPlayer(ctx, scene.state, scene.battle,110+playerOffset,315,this.time);
    this.drawPresentationEffects(ctx,presentation);
    this.drawEffects(ctx);
    ctx.restore();
    this.drawPresentationNumbers(ctx,presentation);
    this.drawCombo(ctx,presentation);
    this.drawNumbers(ctx);
  }

  drawBackdrop(ctx, map) {
    ctx.save();
    for (const star of this.stars) {
      ctx.globalAlpha = 0.3 + star.r / 3;
      ctx.fillStyle = '#d9ebff'; ctx.beginPath(); ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2); ctx.fill();
    }
    const halo = ctx.createRadialGradient(290, 82, 4, 290, 82, 100);
    halo.addColorStop(0, rgba(map.colors[2], 0.58)); halo.addColorStop(1, rgba(map.colors[2], 0));
    ctx.fillStyle = halo; ctx.fillRect(180, 0, 210, 210);
    ctx.globalAlpha = 0.17; ctx.strokeStyle = '#e6f3ff'; ctx.lineWidth = 1;
    for (let i = -100; i < 500; i += 55) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i - 160, H); ctx.stroke(); }
    ctx.restore();
  }

  drawBiome(ctx, map) {
    const t = this.time;
    ctx.save();
    if (map.id === 1) {
      ctx.fillStyle = 'rgba(57,115,83,.45)';
      for (let x = -10; x < W + 20; x += 24) { const h = 18 + (x % 5) * 4; ctx.beginPath(); ctx.moveTo(x, 330); ctx.quadraticCurveTo(x + 8, 330 - h, x + 16, 330); ctx.fill(); }
      ctx.fillStyle = 'rgba(178,232,255,.38)'; for (let i=0;i<12;i+=1){const x=(i*61+20)%W,y=70+(i*37)%220;ctx.beginPath();ctx.arc(x,y,1.2+Math.sin(t*2+i)*.5,0,Math.PI*2);ctx.fill();}
    } else if (map.id === 2) {
      ctx.fillStyle = 'rgba(16,48,54,.75)'; for (let x=4;x<W;x+=72){ctx.fillRect(x,48+(x%3)*18,12,230);ctx.beginPath();ctx.arc(x+6,70,37,0,Math.PI*2);ctx.fill();}
      ctx.fillStyle='rgba(106,255,203,.26)';for(let i=0;i<9;i+=1){ctx.beginPath();ctx.arc(25+i*46,220+Math.sin(t+i)*10,4,0,Math.PI*2);ctx.fill();}
    } else if (map.id === 3) {
      ctx.strokeStyle='rgba(255,120,65,.52)';ctx.lineWidth=3;for(let x=0;x<W;x+=65){ctx.beginPath();ctx.moveTo(x,338);ctx.lineTo(x+18,315);ctx.lineTo(x+35,345);ctx.stroke();}
      ctx.fillStyle='rgba(255,177,80,.35)';for(let i=0;i<14;i+=1){ctx.fillRect((i*47)%W,270+((i*29)%120),2,2+Math.sin(t*4+i)*2);}
    } else if (map.id === 4) {
      ctx.fillStyle='rgba(159,230,255,.18)';for(let x=0;x<W;x+=70){ctx.beginPath();ctx.moveTo(x,320);ctx.lineTo(x+25,245);ctx.lineTo(x+50,320);ctx.fill();}
      ctx.fillStyle='rgba(238,250,255,.62)';for(let i=0;i<24;i+=1){ctx.fillRect((i*37)%W,(t*14+i*29)%360,1.5,4);}
    } else {
      ctx.strokeStyle='rgba(204,129,255,.38)';ctx.lineWidth=2;for(let i=0;i<5;i+=1){const x=45+i*76;ctx.beginPath();ctx.arc(x,155,20+Math.sin(t+i)*4,0,Math.PI*2);ctx.stroke();}
      ctx.fillStyle='rgba(159,120,255,.34)';for(let i=0;i<8;i+=1){ctx.fillRect(22+i*51,280+Math.sin(t*1.5+i)*15,9,23);}
    }
    ctx.restore();
  }

  drawFloor(ctx, map) {
    const floor = ctx.createLinearGradient(0, 260, 0, H);
    floor.addColorStop(0, rgba(map.colors[2], 0)); floor.addColorStop(1, rgba('#050719', 0.65));
    ctx.fillStyle = floor; ctx.fillRect(0, 240, W, H - 240);
    ctx.strokeStyle = rgba('#b8deff', 0.16); ctx.lineWidth = 1;
    for (let y = 280; y < H; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y - 26); ctx.stroke(); }
  }

  drawPet(ctx, state, battle, x, y) {
    const pet = state.pets.find(item => item.id === state.activePetId);
    if (!pet) return;
    drawBattlePet(ctx, pet, { time:this.time, action:battle?.petAction, actionIn:battle?.petActionIn, returnIn:battle?.petReturnIn, summonIn:battle?.petSummonIn, skillType:battle?.petAction==='skill' ? 'active' : null, skillProgress:battle?.petActionIn, powerSave:state.settings?.powerSave }, x, y);
  }

  drawCc0Pet(ctx,state,battle,x,y){const pet=state.pets.find(item=>item.id===state.activePetId);drawCc0PixelPet(ctx,pet,{time:this.time,action:battle?.petAction,actionIn:battle?.petActionIn},x,y);}

  drawCc0Monster(ctx,enemy,battle,offset=0){const pose=drawCc0PixelMonster(ctx,enemy,{time:this.time,attackIn:battle.enemyAttackIn,x:278+offset});if(!pose)return;const boss=enemy.boss;this.bar(ctx,pose.x-(boss?76:34),pose.y+(boss?108:42),boss?152:68,boss?8:7,enemy.hp/enemy.maxHp,boss?(pose.rage?'#ff5578':'#ff8269'):'#dc80ff');if(boss){ctx.save();ctx.textAlign='center';ctx.font='700 11px system-ui';ctx.fillStyle=pose.rage?'#ff8a9c':'#ffe2a8';ctx.fillText(`${enemy.name}${pose.rage?' · 狂暴':''}`,pose.x,Math.max(22,pose.y-112));ctx.restore();}}

  drawEnemy(ctx, enemy, map) {
    const x = 278 + Math.sin(this.time * 1.6) * 8;
    const y = 267 + Math.sin(this.time * 2.1) * 4;
    const scale = enemy.boss ? 1.55 : 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.shadowColor = enemy.boss ? '#ff8f6b' : '#d665ec'; ctx.shadowBlur = enemy.hit > 0 ? 24 : 12;
    const kind = enemy.kind || 'slime';
    if (enemy.boss) {
      ctx.fillStyle = '#351f53'; ctx.beginPath(); ctx.moveTo(-48, 10); ctx.lineTo(-62, -5); ctx.lineTo(-44, -28); ctx.lineTo(-20, -16); ctx.lineTo(0, -45); ctx.lineTo(22, -16); ctx.lineTo(49, -27); ctx.lineTo(64, -3); ctx.lineTo(48, 16); ctx.lineTo(19, 27); ctx.lineTo(0, 42); ctx.lineTo(-20, 27); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#f49461'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#7d3e6f'; ctx.beginPath(); ctx.ellipse(0, -2, 28, 31, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffcf70'; ctx.beginPath(); ctx.arc(0, 0, 8 + Math.sin(this.time * 5), 0, Math.PI * 2); ctx.fill();
      for (const side of [-1, 1]) { ctx.fillStyle = '#54275d'; ctx.fillRect(side * 40 - 11, -10, 22, 20); ctx.fillStyle = '#ff6b76'; ctx.fillRect(side * 40 - 4, -6, 8, 12); }
    } else if (kind.includes('兔') || kind.includes('wolf') || kind.includes('狼')) {
      ctx.fillStyle = '#324d86'; ctx.beginPath(); ctx.ellipse(0, 1, 25, 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6987c8'; ctx.beginPath(); ctx.moveTo(-17, -13); ctx.lineTo(-24, -37); ctx.lineTo(-6, -16); ctx.moveTo(17, -13); ctx.lineTo(24, -37); ctx.lineTo(6, -16); ctx.fill();
      ctx.fillStyle = '#d9eeff'; ctx.fillRect(-13, -3, 7, 5); ctx.fillRect(6, -3, 7, 5);
    } else if (kind.includes('slime') || kind.includes('史萊姆')) {
      ctx.fillStyle = '#4c78c7'; ctx.beginPath(); ctx.moveTo(-29, 17); ctx.quadraticCurveTo(-26, -25, 0, -29); ctx.quadraticCurveTo(27, -25, 29, 17); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#e6fbff'; ctx.fillRect(-13, -2, 7, 5); ctx.fillRect(6, -2, 7, 5);
    } else if (kind.includes('甲') || kind.includes('guard') || kind.includes('機甲')) {
      ctx.fillStyle = '#61718c'; ctx.beginPath(); ctx.moveTo(-26, -19); ctx.lineTo(0, -30); ctx.lineTo(26, -19); ctx.lineTo(30, 15); ctx.lineTo(0, 27); ctx.lineTo(-30, 15); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#aee3ff'; ctx.stroke(); ctx.fillStyle = '#e4b95e'; ctx.fillRect(-15, -2, 30, 7);
    } else {
      ctx.fillStyle = '#7852a6'; ctx.beginPath(); ctx.ellipse(0, 0, 27, 24, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#c9b2ff'; ctx.beginPath(); ctx.arc(-9, -2, 4, 0, 6.3); ctx.arc(9, -2, 4, 0, 6.3); ctx.fill();
    }
    if (enemy.hit > 0) { ctx.globalAlpha = .65; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    this.bar(ctx, x - (enemy.boss ? 64 : 34), y + (enemy.boss ? 68 : 42), enemy.boss ? 128 : 68, 7, enemy.hp / enemy.maxHp, enemy.boss ? '#ff8269' : '#dc80ff');
  }

  drawMonster(ctx, enemy, battle, powerSave = false, offset = 0) {
    const pose = drawMonster(ctx, enemy, { time:this.time, attackIn:battle.enemyAttackIn, powerSave, x:278+offset });
    const boss = enemy.boss;
    if (!enemy.alive && !boss) return;
    ctx.save(); ctx.globalAlpha = enemy.alive ? 1 : Math.max(.12, pose.alpha);
    this.bar(ctx, pose.x - (boss ? 76 : 34), pose.y + (boss ? 108 : 42), boss ? 152 : 68, boss ? 8 : 7, enemy.hp / enemy.maxHp, boss ? (pose.rage ? '#ff5578' : '#ff8269') : '#dc80ff');
    if (boss) { ctx.textAlign='center'; ctx.font='700 11px system-ui'; ctx.fillStyle=pose.rage?'#ff8a9c':'#ffe2a8'; ctx.fillText(`${enemy.name}${pose.rage?' · 狂暴':''}`,pose.x,Math.max(22, pose.y - 148)); }
    ctx.restore();
  }

  bar(ctx, x, y, width, height, ratio, color) {
    ctx.fillStyle = 'rgba(5,9,24,.76)'; ctx.fillRect(x, y, width, height); ctx.fillStyle = color; ctx.fillRect(x + 1, y + 1, Math.max(0, (width - 2) * clamp(ratio, 0, 1)), height - 2); ctx.strokeStyle = 'rgba(220,240,255,.4)'; ctx.strokeRect(x, y, width, height);
  }

  drawBossEncounter(ctx,runtime){
    if(!runtime)return;const powerSave=this.scene?.state?.settings?.powerSave,telegraph=runtime.telegraph;
    ctx.save();
    if(telegraph){const ratio=telegraph.total?1-telegraph.remaining/telegraph.total:0;ctx.globalAlpha=.18+ratio*.35;ctx.strokeStyle=telegraph.aoe?'#ff4f72':'#ffb45e';ctx.fillStyle=telegraph.aoe?'#ff365622':'#ffb45e18';ctx.lineWidth=powerSave?2:3;ctx.setLineDash([8,6]);ctx.beginPath();ctx.arc(110,315,(telegraph.aoe?72:42)*(1-ratio*.25),0,Math.PI*2);ctx.fill();ctx.stroke();ctx.setLineDash([]);}
    for(let i=0;i<runtime.adds.length;i+=1){const x=230+i*75,y=304+Math.sin(this.time*5+i)*4;ctx.globalAlpha=.9;ctx.fillStyle='#8f66c9';ctx.strokeStyle='#dfc1ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-14);ctx.lineTo(x+13,y);ctx.lineTo(x,y+13);ctx.lineTo(x-13,y);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#bff6ff';ctx.fillRect(x-3,y-3,6,6);}
    ctx.restore();
  }

  drawPresentationEffects(ctx, presentation) {
    const powerSave=this.scene?.state?.settings?.powerSave;
    for(const event of activeCombatEvents(presentation)){
      if(!['hit','death','skillImpact'].includes(event.type))continue;
      const progress=event.elapsed/event.duration,fade=1-progress,color=event.payload?.color||'#8eeaff',size=event.payload?.size||28;
      ctx.save();ctx.globalAlpha=Math.max(0,fade);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=powerSave?3:12;
      if(event.type==='hit'){
        ctx.lineWidth=2.5;for(let i=0;i<(powerSave?3:6);i+=1){const a=i*Math.PI/3+.2;ctx.beginPath();ctx.moveTo(event.x+Math.cos(a)*4,event.y+Math.sin(a)*4);ctx.lineTo(event.x+Math.cos(a)*(8+20*progress),event.y+Math.sin(a)*(8+20*progress));ctx.stroke();}
      }else if(event.type==='death'){
        ctx.lineWidth=3;ctx.beginPath();ctx.arc(event.x,event.y,(event.payload?.boss?64:34)*progress,0,Math.PI*2);ctx.stroke();if(!powerSave)for(let i=0;i<8;i+=1){const a=i*Math.PI/4;ctx.fillRect(event.x+Math.cos(a)*size*progress,event.y+Math.sin(a)*size*.65*progress,3,3);}
      }else{
        const id=event.payload?.skillId;ctx.lineWidth=powerSave?3:5;
        if(id==='slash'){ctx.beginPath();ctx.moveTo(event.x-34+progress*12,event.y+31);ctx.quadraticCurveTo(event.x,event.y-24,event.x+38,event.y-34);ctx.stroke();}
        else if(id==='vortex'){for(let i=0;i<(powerSave?2:3);i+=1){ctx.beginPath();ctx.arc(event.x,event.y,size*(.35+i*.2+progress*.25),progress*4+i,progress*4+i+Math.PI*1.45);ctx.stroke();}}
        else if(id==='burst'){const radius=size*(.18+progress*.82);ctx.beginPath();ctx.arc(event.x,event.y,radius,0,Math.PI*2);ctx.stroke();ctx.globalAlpha*=.3;ctx.fill();}
        else if(id==='shelter'){for(let i=0;i<2;i+=1){ctx.beginPath();ctx.arc(event.x,event.y,size*(.65+i*.22+progress*.18),0,Math.PI*2);ctx.stroke();}}
        else{ctx.beginPath();ctx.arc(event.x,event.y,size*(.25+progress*.8),0,Math.PI*2);ctx.stroke();if(event.payload?.bossFx==='interrupted'){ctx.font='900 13px system-ui';ctx.textAlign='center';ctx.fillText('INTERRUPTED',event.x,event.y-56);}}
      }
      ctx.restore();
    }
  }

  drawPresentationNumbers(ctx, presentation) {
    const events=activeCombatEvents(presentation).filter(event=>['damage','critical','miss','evade','heal','shield'].includes(event.type));
    ctx.save();ctx.textAlign='center';
    for(const event of events){
      const progress=event.elapsed/event.duration,stagger=(Number(event.id.split('-').pop())%3-1)*12,x=clamp(event.x+stagger,28,W-28),y=clamp(event.y-progress*34,34,H-74),critical=event.type==='critical';
      ctx.globalAlpha=Math.min(1,(1-progress)*1.8);ctx.font=`${critical?900:800} ${critical?19:15}px system-ui`;ctx.lineWidth=3;ctx.strokeStyle='#11162b';ctx.fillStyle=event.payload?.color||(event.type==='heal'?'#78f0a3':event.type==='shield'?'#8edfff':event.type==='miss'||event.type==='evade'?'#f0f4ff':'#e9f7ff');
      const label=event.type==='miss'?'MISS':event.type==='evade'?'EVADE':event.type==='heal'?`+${Math.floor(event.value)}`:event.type==='shield'?`盾 +${Math.floor(event.value)}`:`${Math.floor(event.value)}`;
      if(critical){ctx.strokeText('CRITICAL',x,y-18);ctx.fillText('CRITICAL',x,y-18);}ctx.strokeText(label,x,y);ctx.fillText(label,x,y);
    }
    ctx.restore();
  }

  drawCombo(ctx,presentation){
    const combo=presentation?.combo;if(!combo?.count||combo.remaining<=0)return;
    ctx.save();ctx.textAlign='center';ctx.font='900 17px system-ui';ctx.fillStyle=combo.count>=20?'#ffd56a':'#9eeaff';ctx.strokeStyle='#10152b';ctx.lineWidth=4;const label=`${combo.count} COMBO${combo.label?` · ${combo.label}`:''}`;ctx.strokeText(label,W/2,53);ctx.fillText(label,W/2,53);ctx.restore();
  }

  drawEffects(ctx) {
    for (const effect of this.effects) {
      const ratio = effect.life / effect.max;
      ctx.save(); ctx.globalAlpha = ratio; ctx.strokeStyle = effect.color; ctx.fillStyle = effect.color; ctx.lineWidth = 2;
      if (effect.type === 'slash') { ctx.lineWidth=5;ctx.shadowColor=effect.color;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(effect.x, effect.y, effect.size * (1.35 - ratio), -.95, 1.55);ctx.stroke();ctx.lineWidth=1.2;ctx.strokeStyle='#fff';ctx.stroke(); }
      else if (effect.type === 'burst') { ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.size * (1.2 - ratio), 0, Math.PI * 2); ctx.stroke(); for (let i = 0; i < 7; i += 1) { const a = i * .9 + this.time; ctx.fillRect(effect.x + Math.cos(a) * effect.size * (1 - ratio), effect.y + Math.sin(a) * effect.size * (1 - ratio), 3, 3); } }
      else if (effect.type === 'beam') { const beam=ctx.createLinearGradient(effect.x,effect.y,278,effect.y-18);beam.addColorStop(0,'rgba(255,255,255,.9)');beam.addColorStop(.4,effect.color);beam.addColorStop(1,'rgba(255,255,255,.2)');ctx.strokeStyle=beam;ctx.lineWidth=12;ctx.shadowColor=effect.color;ctx.shadowBlur=18;ctx.globalAlpha=ratio*.8;ctx.beginPath();ctx.moveTo(effect.x-4,effect.y);ctx.lineTo(278,effect.y-18);ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.stroke(); }
      else if (effect.type === 'fire') { for(let i=0;i<(this.scene?.state?.settings?.powerSave?3:7);i+=1){const a=i*.9+this.time*4;ctx.fillRect(effect.x+Math.cos(a)*effect.size*(1-ratio),effect.y+Math.sin(a)*effect.size*.45,4,7);} }
      else if (effect.type === 'frost') { for(let i=0;i<6;i+=1){const a=i*Math.PI/3;ctx.beginPath();ctx.moveTo(effect.x,effect.y);ctx.lineTo(effect.x+Math.cos(a)*effect.size*(1-ratio),effect.y+Math.sin(a)*effect.size*(1-ratio));ctx.stroke();} }
      else if (effect.type === 'shield' || effect.type === 'heal') { ctx.beginPath();ctx.arc(effect.x,effect.y,effect.size*(1.15-ratio*.35),0,Math.PI*2);ctx.stroke();if(effect.type==='heal'){ctx.globalAlpha*=.7;ctx.fillText?.('✦',effect.x,effect.y-effect.size*(1-ratio));} }
      else if (effect.type === 'evolution') { ctx.globalAlpha = Math.min(1, ratio * 1.7); ctx.fillStyle = rgba(effect.color, .16); ctx.fillRect(effect.x - effect.size * .22, effect.y - effect.size * 1.1, effect.size * .44, effect.size * 1.45); for (let i = 0; i < 3; i += 1) { ctx.beginPath(); ctx.arc(effect.x, effect.y + 18, effect.size * (.22 + i * .16) * (1 - ratio * .35), 0, Math.PI * 2); ctx.stroke(); } for (let i = 0; i < 8; i += 1) { const a = this.time * 2.8 + i * Math.PI / 4; ctx.fillRect(effect.x + Math.cos(a) * effect.size * .5, effect.y - 20 + Math.sin(a) * effect.size * .42, 3, 3); } }
      else { ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.size * (1.1 - ratio), 0, Math.PI * 2); ctx.stroke(); }
      ctx.restore();
    }
  }

  drawNumbers(ctx) {
    ctx.save(); ctx.font = '700 14px system-ui'; ctx.textAlign = 'center';
    for (const item of this.numbers) { ctx.globalAlpha = Math.min(1, item.life * 2); ctx.fillStyle = item.color; ctx.strokeStyle = '#101526'; ctx.lineWidth = 3; const label = `${item.critical ? '暴擊 ' : ''}${Math.floor(item.value)}`; ctx.strokeText(label, item.x, item.y); ctx.fillText(label, item.x, item.y); }
    ctx.restore();
  }
}
