const TAU = Math.PI * 2;

function disc(ctx, x, y, radius, fill, stroke = null) {
  ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU); ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
}

function poly(ctx, points, fill, stroke = null) {
  ctx.fillStyle = fill; ctx.beginPath();
  for (let i = 0; i < points.length; i += 1) { const point = points[i]; if (i) ctx.lineTo(point[0], point[1]); else ctx.moveTo(point[0], point[1]); }
  ctx.closePath(); ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
}

function stroke(ctx, x1, y1, x2, y2, color, width = 4) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}

function glow(ctx, color, blur = 12) { ctx.shadowColor = color; ctx.shadowBlur = blur; }

function ring(ctx, radius, color, alpha = .55, width = 2, start = 0, end = TAU) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.beginPath(); ctx.arc(0, 0, radius, start, end); ctx.stroke(); ctx.restore();
}

function bossEyes(ctx, x, y, color, angry = false) {
  disc(ctx, x - 9, y, 3.5, color); disc(ctx, x + 9, y, 3.5, color);
  ctx.strokeStyle = angry ? '#2a1224' : '#1a2434'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(x - 15, y - 5); ctx.lineTo(x - 4, y - 2); ctx.moveTo(x + 15, y - 5); ctx.lineTo(x + 4, y - 2); ctx.stroke();
}

function localFlash(ctx, state, x, y, radius, color = '#fff') {
  if (!state.hurt) return;
  ctx.save(); ctx.globalAlpha = .24 + Math.sin(state.time * 42) * .1; glow(ctx, color, 14); disc(ctx, x, y, radius, color); ctx.restore();
}

function groundShadow(ctx, width, alpha = .3, offset = 31) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = '#07101b'; ctx.beginPath(); ctx.ellipse(0, offset, width, width * .2, 0, 0, TAU); ctx.fill(); ctx.restore();
}

function drawCrownBeast(ctx, enemy, state) {
  const breath = Math.sin(state.time * (state.rage ? 6 : 3.2)) * 1.6;
  const charge = state.attack ? -22 : 0;
  const enter = state.spawn;
  const dying = state.death < 1;
  ctx.save();
  ctx.translate((1 - enter) * 46 + charge, dying ? (1 - state.death) * 17 : 0);
  ctx.rotate(dying ? (1 - state.death) * .24 : 0);
  groundShadow(ctx, 48, .35 + (state.rage ? .12 : 0), 34);
  if (state.attack) {
    ctx.save(); ctx.globalAlpha = .34; stroke(ctx, 60, 8, 112, 8, state.rage ? '#ff6575' : '#ffd078', 4); stroke(ctx, 67, 18, 104, 18, '#fff2bd', 1.5); ctx.restore();
  }
  const body = ctx.createLinearGradient(-35, -24, 37, 34); body.addColorStop(0, '#a5794d'); body.addColorStop(1, '#4b3435');
  poly(ctx, [[-50, 8], [-37, -18], [-7, -27], [28, -16], [47, 2], [38, 21], [4, 27], [-31, 24]], body, '#e9bd76');
  // rear and front legs are deliberately separate heavy limbs.
  for (const x of [-29, 24]) { stroke(ctx, x, 17, x - 4, 39 + (x < 0 ? breath : -breath), '#4a3030', 11); disc(ctx, x - 5, 40, 7, '#2b2430'); }
  poly(ctx, [[-14, -13], [8, -39], [38, -32], [49, -12], [34, 5], [5, 0]], '#8b5d42', '#ffd789');
  // Crown horns and jaw form the recognizable head silhouette.
  poly(ctx, [[10, -29], [14, -61], [25, -36], [34, -63], [38, -28]], state.rage ? '#ffba67' : '#e6bd62', '#fff0a8');
  poly(ctx, [[23, -4], [48, -9], [51, 7], [32, 15], [10, 8]], '#5c3a3a', '#f2cf8e');
  bossEyes(ctx, 29, -14, state.rage ? '#ff6d75' : '#fff0a0', state.rage);
  stroke(ctx, 34, 6, 42, 15, '#fff0c4', 3); stroke(ctx, 19, 7, 23, 16, '#fff0c4', 3);
  poly(ctx, [[-38, -8], [-62, -22], [-58, -6], [-39, 4]], '#6c493d', '#e7b871');
  if (!state.powerSave) { for (let i = 0; i < 3; i += 1) { const a = state.time * 3 + i * 1.7; disc(ctx, -48 - i * 7, -9 + Math.sin(a) * 4, 2.2, state.rage ? '#ff7f72' : '#f6d1a0'); } }
  if (state.rage) { ring(ctx, 49 + Math.sin(state.time * 6) * 3, '#ff6179', .46, 2); for (const x of [-28, 2, 30]) stroke(ctx, x, 34, x + 5, 43, '#ff6f66', 1.5); }
  localFlash(ctx, state, 25, -10, 19); ctx.restore();
}

function drawAncientTree(ctx, enemy, state) {
  const sway = Math.sin(state.time * 1.7) * .08;
  const grow = .35 + state.spawn * .65;
  const wilt = 1 - (1 - state.death) * .52;
  ctx.save(); ctx.scale(1, grow * wilt); ctx.rotate(dyingAngle(state) + sway);
  groundShadow(ctx, 46, .34, 36);
  if (state.attack) { ctx.save(); ctx.globalAlpha = .34; ctx.strokeStyle = state.rage ? '#c45b9e' : '#89d26c'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(18, 36, 31, Math.PI, TAU); ctx.stroke(); for (const x of [-28, 3, 32]) stroke(ctx, x, 34, x + 5, 48, '#629347', 3); ctx.restore(); }
  stroke(ctx, -16, 17, -27, 42, '#4a3328', 12); stroke(ctx, 16, 17, 27, 42, '#4a3328', 12);
  poly(ctx, [[-31, 20], [-25, -28], [-7, -42], [15, -38], [31, -16], [27, 21], [5, 32], [-20, 29]], '#624432', '#c29459');
  // massive branch arms make this a tree creature rather than bark on a humanoid.
  stroke(ctx, -20, -14, -58, state.attack ? -1 : -21, '#573b2c', 10); stroke(ctx, 19, -16, 57, state.attack ? 5 : -25, '#573b2c', 10);
  for (const side of [-1, 1]) { stroke(ctx, side * 48, -20, side * 65, -38, '#553a2c', 5); stroke(ctx, side * 42, -17, side * 52, -48, '#553a2c', 4); }
  for (const leaf of [[-46,-43],[-24,-57],[3,-61],[29,-52],[50,-39],[-6,-47]]) disc(ctx, leaf[0], leaf[1] + Math.sin(state.time * 2 + leaf[0]) * 2, 16, state.rage ? '#9a3e6e' : '#5c9652', '#c5e986');
  disc(ctx, 0, -5, state.rage ? 10 : 7, state.rage ? '#e96b99' : '#a9ef8f');
  ctx.fillStyle = '#271d26'; ctx.beginPath(); ctx.ellipse(0, -20, 15, 10, 0, 0, TAU); ctx.fill(); bossEyes(ctx, 0, -20, state.rage ? '#ff9ebd' : '#ddffb6', state.rage);
  for (const x of [-10, 10]) stroke(ctx, x, 6, x - 3, 18, '#d9a86b', 1.4);
  if (!state.powerSave) { for (let i = 0; i < 5; i += 1) { const x = -43 + i * 21; disc(ctx, x, -62 + ((state.time * 18 + i * 13) % 18), 1.5, state.rage ? '#ec77aa' : '#b9ee81'); } }
  localFlash(ctx, state, 0, -5, 15, '#eeffd9'); ctx.restore();
}

function drawCoreTyrant(ctx, enemy, state) {
  const pulse = 1 + Math.sin(state.time * (state.rage ? 8 : 4.5)) * .07;
  const descent = (1 - state.spawn) * -58;
  const collapse = (1 - state.death) * .23;
  ctx.save(); ctx.translate(0, descent); ctx.rotate(collapse); ctx.scale(pulse, pulse);
  groundShadow(ctx, 52, .3 + (state.rage ? .15 : 0), 39);
  if (state.attack) { ctx.save(); ctx.globalAlpha = .44; const flame = ctx.createLinearGradient(12, -13, 102, -13); flame.addColorStop(0, '#ffed8a'); flame.addColorStop(1, state.rage ? '#d53376' : '#ff623f'); ctx.fillStyle = flame; ctx.beginPath(); ctx.moveTo(22,-11); ctx.quadraticCurveTo(72,-31,105,-12); ctx.quadraticCurveTo(69,8,22,0); ctx.fill(); ctx.restore(); }
  // wings first, then a distinctly bipedal dragon torso and tail.
  const wingLift = state.rage ? -10 : Math.sin(state.time * 2.6) * 4;
  poly(ctx, [[-22,-18],[-77,-50+wingLift],[-63,11],[-24,15]], '#5a2c38', '#ff855b');
  poly(ctx, [[22,-18],[77,-50-wingLift],[63,11],[24,15]], '#5a2c38', '#ff855b');
  poly(ctx, [[-27,14],[-68,25],[-44,5],[-12,-2],[15,6],[31,20],[10,30],[-18,29]], '#6f3334', '#ff9a5b');
  for (const x of [-16, 18]) { stroke(ctx, x, 20, x - 3, 45, '#4b292f', 12); poly(ctx, [[x-10,45],[x+9,45],[x+4,51],[x-12,51]], '#342331', '#ff9b62'); }
  poly(ctx, [[-14,-1],[-7,-41],[14,-52],[38,-32],[28,-5],[9,4]], '#8a3b38', '#ffab63');
  poly(ctx, [[1,-39],[5,-61],[16,-43]], '#f26d3f', '#ffe08a'); poly(ctx, [[20,-39],[34,-58],[30,-31]], '#f26d3f', '#ffe08a');
  bossEyes(ctx, 15, -26, state.rage ? '#ff4b70' : '#ffe593', true);
  disc(ctx, 0, 4, state.attack ? 13 : 9, state.rage ? '#ff5773' : '#ffb259', '#ffeec0');
  for (const x of [-17, -5, 10, 22]) stroke(ctx, x, 7, x + 5, 19, state.rage ? '#ff5c6d' : '#f68a4b', 2);
  poly(ctx, [[-25,13],[-60,38],[-48,15],[-21,5]], '#5a2d37', '#ff8657');
  if (state.rage) { ring(ctx, 47 + Math.sin(state.time * 6) * 4, '#ff5e72', .48, 3); ring(ctx, 61, '#ff914d', .28, 1); }
  localFlash(ctx, state, 0, 4, 18, '#fff4d9'); ctx.restore();
}

function drawFrostWarden(ctx, enemy, state) {
  const float = Math.sin(state.time * 2.5) * 5;
  const assemble = .25 + state.spawn * .75;
  ctx.save(); ctx.translate(0, float); ctx.scale(assemble, assemble);
  groundShadow(ctx, 39, .18, 46);
  const spin = state.time * (state.rage ? 2.3 : .8);
  ctx.save(); ctx.rotate(spin);
  for (const side of [-1, 1]) poly(ctx, [[side*18,-11],[side*63,-54],[side*49,20],[side*22,29]], state.rage ? '#7d73df' : '#76cbed', '#e5ffff');
  ctx.restore();
  if (state.attack) { ctx.save(); ctx.globalAlpha=.48; poly(ctx, [[-2,-22],[72,-38],[47,-7]], state.rage ? '#9c8cff' : '#c9f8ff', '#fff'); ring(ctx, 37, '#b8f7ff', .4, 1.5, -.9, .5); ctx.restore(); }
  // crystal gown is a floating lower body, separate from the upper torso and arms.
  poly(ctx, [[-25,24],[-17,-4],[0,-19],[19,-4],[28,27],[0,44]], '#4b79ad', '#d9fcff');
  poly(ctx, [[-17,-13],[0,-39],[17,-13],[13,7],[-13,7]], '#7fb7de', '#efffff');
  poly(ctx, [[-13,-36],[0,-57],[14,-35],[9,-18],[-10,-18]], '#d2f7ff', '#a7ddff');
  for (const side of [-1, 1]) { stroke(ctx, side*17, -5, side*40, state.attack ? -25 : 12, '#76b9dc', 7); disc(ctx, side*43, state.attack ? -28 : 14, 6, '#c8f8ff'); }
  poly(ctx, [[-4,-55],[0,-76],[6,-55]], state.rage ? '#a782ff' : '#d9fcff', '#fff');
  disc(ctx, 0, -5, state.rage ? 10 : 7, state.rage ? '#8f78ff' : '#9ff4ff');
  bossEyes(ctx, 0, -29, state.rage ? '#ddc5ff' : '#f8ffff');
  stroke(ctx, 39, 14, 57, -35, '#9cdcff', 3); poly(ctx, [[53,-39],[59,-53],[63,-37]], '#e3ffff', '#8ecff0');
  if (state.rage) { ring(ctx, 57 + Math.sin(state.time*5)*3, '#a184ff', .43, 2); for (let i=0;i<4;i+=1){const a=spin+i*1.57; disc(ctx,Math.cos(a)*50,Math.sin(a)*23,2,'#d2cbff');} }
  localFlash(ctx, state, 0, -5, 18, '#fff'); ctx.restore();
}

function drawAstralJudge(ctx, enemy, state) {
  const portal = state.spawn;
  const drift = Math.sin(state.time * 1.8) * 4;
  const breakApart = 1 - state.death;
  ctx.save(); ctx.translate(0, drift); ctx.scale(.45 + portal * .55, .45 + portal * .55);
  groundShadow(ctx, 44, .16, 48);
  const orbit = state.time * (state.rage ? 3.3 : 1.25);
  ctx.save(); ctx.rotate(orbit); ring(ctx, 56, state.rage ? '#ec5f9a' : '#d6aaff', state.powerSave ? .24 : .58, 3); ring(ctx, 43, '#94dfff', .34, 1, .5, 3.4); ctx.restore();
  if (state.attack) { ctx.save(); ctx.globalAlpha=.5; const beam=ctx.createLinearGradient(-12,0,-125,0);beam.addColorStop(0,state.rage?'#ff7cb7':'#caa7ff');beam.addColorStop(1,'rgba(178,226,255,0)');ctx.fillStyle=beam;ctx.fillRect(-133,-9,121,18);ctx.fillStyle='#ecf8ff';ctx.fillRect(-121,-2,110,4);ctx.restore(); }
  // Floating arms, asymmetric cannon and robes are independent masses.
  ctx.save(); ctx.translate(-50 - breakApart*22, -7); ctx.rotate(-.25-breakApart*.35); poly(ctx,[[-16,-13],[3,-24],[17,-9],[12,18],[-7,23],[-20,7]],'#483262','#e7b6ff'); disc(ctx,0,0,6,'#94e8ff'); ctx.restore();
  ctx.save(); ctx.translate(49 + breakApart*25, 6); ctx.rotate(.2+breakApart*.4); poly(ctx,[[-20,-12],[9,-19],[23,-2],[18,16],[-7,24],[-21,8]],'#58316f','#f0a6ff'); stroke(ctx,13,-3,37,-20,state.rage?'#ff77ac':'#b8e9ff',4); ctx.restore();
  poly(ctx,[[-28,28],[-20,-13],[0,-29],[21,-13],[31,29],[0,48]],'#382a5e','#d9b5ff');
  poly(ctx,[[-18,-15],[0,-47],[20,-15],[14,11],[-14,11]],'#5f4382','#f0c8ff');
  poly(ctx,[[-13,-48],[0,-69],[14,-48],[10,-28],[-10,-28]],'#d9d6ff','#fff');
  // featureless mask, chest core and armor panels create the judge silhouette.
  poly(ctx,[[-12,-51],[0,-62],[12,-51],[9,-36],[-9,-36]],'#e7eaff','#a597d8');
  disc(ctx,0,-3,state.attack?13:9,state.rage?'#ff5f9b':'#a9eaff','#fff');
  for(const side of [-1,1]) poly(ctx,[[side*18,-14],[side*37,-21],[side*33,4],[side*18,11]],'#4a3370','#d9b1ff');
  if (state.rage) { ring(ctx, 70 + Math.sin(state.time*8)*3, '#f55d9c', .52, 2); for(let i=0;i<3;i+=1){const a=orbit+i*2.1; stroke(ctx,Math.cos(a)*32,Math.sin(a)*32,Math.cos(a)*78,Math.sin(a)*54,'#f38dca',1.5);} }
  localFlash(ctx, state, 0, -3, 17, '#fff'); ctx.restore();
}

function dyingAngle(state) { return state.death < 1 ? (1 - state.death) * .16 : 0; }

function drawFallbackBoss(ctx, enemy, state) {
  groundShadow(ctx, 43, .3, 35); poly(ctx, [[-39,20],[-47,-13],[0,-43],[47,-13],[39,20],[0,37]], '#49345f', '#ffcf7b'); disc(ctx,0,-2,13,state.rage?'#ff6586':'#ffcf7b');
  if (state.attack) ring(ctx, 45, '#ffcf7b', .55, 2); localFlash(ctx, state, 0, -2, 16);
}

const BOSS_DRAWERS = { crownBeast: drawCrownBeast, ancientTree: drawAncientTree, coreTyrant: drawCoreTyrant, frostWarden: drawFrostWarden, astralJudge: drawAstralJudge };

export function drawBoss(ctx, enemy, state) {
  const drawer = BOSS_DRAWERS[enemy.visualType] || drawFallbackBoss;
  drawer(ctx, enemy, state);
}
