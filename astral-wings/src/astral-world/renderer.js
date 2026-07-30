import { MAPS, QUALITY, SLOTS } from './data.js';
import { clamp } from './core.js';

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
    this.effects.push({ type, x, y, color, size, life: 0.52, max: 0.52 });
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
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, map.colors[0]); gradient.addColorStop(1, map.colors[1]);
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, W, H);
    this.drawBackdrop(ctx, map);
    this.drawBiome(ctx, map);
    if (!scene?.battle) return;
    this.drawFloor(ctx, map);
    const enemy = scene.battle.enemy;
    if (enemy?.alive) this.drawEnemy(ctx, enemy, map);
    this.drawPet(ctx, scene.state, 132, 290);
    this.drawHero(ctx, scene.state, 110, 315, scene.battle.playerFlash || 0);
    this.drawEffects(ctx);
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

  drawHero(ctx, state, x, y, flash) {
    const t = this.time;
    const bob = Math.sin(t * 2.6) * 3;
    const low = state.player.hp / state.player.maxHp < 0.3;
    ctx.save(); ctx.translate(x, y + bob);
    if (flash > 0 && Math.floor(t * 17) % 2 === 0) ctx.globalAlpha = 0.42;
    ctx.shadowColor = '#6dcaff'; ctx.shadowBlur = 18;
    // cape / wing blades
    ctx.fillStyle = '#172f6a'; ctx.beginPath(); ctx.moveTo(-27, 14); ctx.lineTo(-47, 34); ctx.lineTo(-22, 30); ctx.lineTo(-5, 4); ctx.fill();
    ctx.fillStyle = '#253b86'; ctx.beginPath(); ctx.moveTo(24, 14); ctx.lineTo(47, 34); ctx.lineTo(20, 30); ctx.lineTo(5, 4); ctx.fill();
    // legs and coat silhouette
    ctx.fillStyle = '#111b46'; ctx.beginPath(); ctx.moveTo(-13, 15); ctx.lineTo(-22, 43); ctx.lineTo(-5, 43); ctx.lineTo(0, 25); ctx.lineTo(7, 43); ctx.lineTo(24, 43); ctx.lineTo(13, 14); ctx.fill();
    // armor body
    const body = ctx.createLinearGradient(0, -25, 0, 28); body.addColorStop(0, '#b7e7ff'); body.addColorStop(.35, '#3d77bc'); body.addColorStop(1, '#151f5b');
    ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(0, -29); ctx.lineTo(18, -12); ctx.lineTo(14, 18); ctx.lineTo(0, 29); ctx.lineTo(-14, 18); ctx.lineTo(-18, -12); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#caefff'; ctx.lineWidth = 1.5; ctx.stroke();
    // shoulders
    ctx.fillStyle = '#294a95'; ctx.beginPath(); ctx.moveTo(-17, -12); ctx.lineTo(-35, 0); ctx.lineTo(-22, 10); ctx.lineTo(-8, 3); ctx.fill(); ctx.beginPath(); ctx.moveTo(17, -12); ctx.lineTo(35, 0); ctx.lineTo(22, 10); ctx.lineTo(8, 3); ctx.fill();
    // sword
    ctx.strokeStyle = '#a8f2ff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(19, 4); ctx.lineTo(39, -35); ctx.stroke(); ctx.strokeStyle = '#3851a4'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(18, 6); ctx.lineTo(34, -25); ctx.stroke();
    // head, hair and core
    ctx.fillStyle = '#f3d5bf'; ctx.beginPath(); ctx.arc(0, -37, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#25316e'; ctx.beginPath(); ctx.moveTo(-11, -39); ctx.quadraticCurveTo(0, -55, 12, -41); ctx.lineTo(7, -50); ctx.lineTo(-8, -49); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#73e9ff'; ctx.beginPath(); ctx.arc(0, 0, 4.7 + Math.sin(t * 6) * .7, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = '#80baff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-10, -4); ctx.lineTo(10, -4); ctx.moveTo(-8, 9); ctx.lineTo(8, 9); ctx.stroke();
    if (low) { ctx.strokeStyle = '#ff6b79'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-10, 13); ctx.lineTo(-2, 7); ctx.moveTo(10, 16); ctx.lineTo(4, 10); ctx.stroke(); }
    ctx.restore();
  }

  drawPet(ctx, state, x, y) {
    const pet = state.pets.find(item => item.id === state.activePetId);
    if (!pet) return;
    const yBob = y + Math.sin(this.time * 4.2) * 5;
    ctx.save(); ctx.translate(x, yBob); ctx.shadowColor = '#f6d66b'; ctx.shadowBlur = 12;
    ctx.fillStyle = '#f3bd58'; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(13, -5); ctx.lineTo(10, 10); ctx.lineTo(0, 16); ctx.lineTo(-10, 10); ctx.lineTo(-13, -5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff4bf'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

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

  bar(ctx, x, y, width, height, ratio, color) {
    ctx.fillStyle = 'rgba(5,9,24,.76)'; ctx.fillRect(x, y, width, height); ctx.fillStyle = color; ctx.fillRect(x + 1, y + 1, Math.max(0, (width - 2) * clamp(ratio, 0, 1)), height - 2); ctx.strokeStyle = 'rgba(220,240,255,.4)'; ctx.strokeRect(x, y, width, height);
  }

  drawEffects(ctx) {
    for (const effect of this.effects) {
      const ratio = effect.life / effect.max;
      ctx.save(); ctx.globalAlpha = ratio; ctx.strokeStyle = effect.color; ctx.fillStyle = effect.color; ctx.lineWidth = 2;
      if (effect.type === 'slash') { ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.size * (1.35 - ratio), -.8, 1.7); ctx.stroke(); }
      else if (effect.type === 'burst') { ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.size * (1.2 - ratio), 0, Math.PI * 2); ctx.stroke(); for (let i = 0; i < 7; i += 1) { const a = i * .9 + this.time; ctx.fillRect(effect.x + Math.cos(a) * effect.size * (1 - ratio), effect.y + Math.sin(a) * effect.size * (1 - ratio), 3, 3); } }
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
