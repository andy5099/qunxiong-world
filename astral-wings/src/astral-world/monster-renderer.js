const TAU = Math.PI * 2;

function circle(ctx, x, y, radius, fill, stroke = null) {
  ctx.fillStyle = fill;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU); ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
}

function shape(ctx, points, fill, stroke = null) {
  ctx.fillStyle = fill; ctx.beginPath();
  points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath(); ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
}

function line(ctx, x1, y1, x2, y2, color, width = 4) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}

function eyes(ctx, y = -4, spacing = 8, color = '#19213b') {
  circle(ctx, -spacing, y, 3.1, color); circle(ctx, spacing, y, 3.1, color);
  circle(ctx, -spacing + .8, y - .9, .95, '#fff'); circle(ctx, spacing + .8, y - .9, .95, '#fff');
}

function softShadow(ctx, height, flying) {
  ctx.save(); ctx.globalAlpha = flying ? .18 : .3; ctx.fillStyle = '#07101c';
  ctx.beginPath(); ctx.ellipse(0, height, flying ? 22 : 27, flying ? 5 : 7, 0, 0, TAU); ctx.fill(); ctx.restore();
}

function attackTrail(ctx, state, color) {
  if (!state.attack) return;
  ctx.save(); ctx.globalAlpha = .48; ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(-5, -5, 36 + Math.sin(state.time * 20) * 3, -.65, .65); ctx.stroke(); ctx.restore();
}

function drawSlime(ctx, enemy, state) {
  const bounce = Math.sin(state.time * 4.4) * 2.5 + (state.attack ? -6 : 0);
  const squash = state.hurt ? .83 : 1 + Math.sin(state.time * 4.4) * .035;
  const icy = enemy.visualType === 'iceSlime';
  ctx.save(); ctx.translate(0, bounce); ctx.scale(1 / squash, squash);
  const gradient = ctx.createRadialGradient(-8, -15, 2, 0, 1, 31);
  gradient.addColorStop(0, icy ? '#f5ffff' : '#e1ffff'); gradient.addColorStop(1, icy ? '#53aee0' : '#4fc4ab');
  ctx.fillStyle = gradient; ctx.beginPath(); ctx.moveTo(-29, 19); ctx.quadraticCurveTo(-29, -20, -8, -28); ctx.quadraticCurveTo(7, -36, 26, -17); ctx.quadraticCurveTo(32, 0, 28, 19); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = .28; circle(ctx, -9, -13, 9, '#fff'); ctx.globalAlpha = 1;
  eyes(ctx, -2, 8); ctx.strokeStyle = '#294665'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 7, 5, .15, Math.PI - .15); ctx.stroke();
  if (icy) { for (const x of [-16, 0, 16]) shape(ctx, [[x - 4, -18], [x, -38], [x + 5, -18]], '#baf7ff', '#e8ffff'); }
  else { line(ctx, 0, -25, 0, -39, '#62aa6c', 3); circle(ctx, 4, -42, 5, '#b9ef86'); }
  ctx.restore();
}

function drawRabbit(ctx, enemy, state) {
  const hop = Math.max(0, Math.sin(state.time * 3.2)) * 2 + (state.attack ? -9 : 0);
  ctx.save(); ctx.translate(0, hop);
  circle(ctx, 22, 14, 8, '#f3eaff');
  ctx.fillStyle = '#cdbcf1'; ctx.beginPath(); ctx.ellipse(-1, 9, 23, 17, -.08, 0, TAU); ctx.fill();
  circle(ctx, -4, -13, 18, '#ebddff');
  shape(ctx, [[-15, -24], [-21, -56], [-4, -30]], '#dccbff', '#725b9e'); shape(ctx, [[8, -25], [17, -56], [20, -26]], '#dccbff', '#725b9e');
  shape(ctx, [[-13, -29], [-17, -49], [-8, -30]], '#f79fca'); shape(ctx, [[12, -29], [15, -49], [16, -28]], '#f79fca');
  eyes(ctx, -13, 6); circle(ctx, 1, -5, 2, '#ef839e');
  line(ctx, -13, 20, -18, 29, '#9a82ca', 4); line(ctx, 9, 20, 15, 29, '#9a82ca', 4);
  attackTrail(ctx, state, '#f4c5ff'); ctx.restore();
}

function drawBeetle(ctx, enemy, state) {
  const skitter = Math.sin(state.time * 7) * 1.4;
  shape(ctx, [[-28, 12], [-21, -14], [0, -26], [22, -12], [28, 12], [17, 23], [-16, 23]], '#446a79', '#b0ecd4');
  shape(ctx, [[-18, 13], [-12, -16], [0, -21], [0, 21]], '#5bc08f', '#d7ffd9'); shape(ctx, [[18, 13], [12, -16], [0, -21], [0, 21]], '#4a9c7c', '#d7ffd9');
  circle(ctx, 0, -25, 12, '#9deaa2'); eyes(ctx, -26, 4); line(ctx, -8, -34, -15, -45, '#6ac086', 2); line(ctx, 8, -34, 15, -45, '#6ac086', 2);
  for (const side of [-1, 1]) { line(ctx, side * 17, 7, side * 34, 15 + skitter, '#2d5560', 3); line(ctx, side * 15, 15, side * 31, 29 - skitter, '#2d5560', 3); }
  attackTrail(ctx, state, '#8affb2');
}

function drawWolf(ctx, enemy, state) {
  const frost = enemy.visualType === 'frostWolf'; const step = Math.sin(state.time * 5) * 3; const lunge = state.attack ? -11 : 0;
  ctx.save(); ctx.translate(lunge, 0);
  shape(ctx, [[-36, 13], [-22, -11], [4, -18], [27, -8], [38, 6], [25, 17], [-3, 21]], frost ? '#8bcce4' : '#658d83', frost ? '#dfffff' : '#b8dfb5');
  shape(ctx, [[5, -14], [20, -33], [39, -18], [34, 2], [15, 1]], frost ? '#c8f7ff' : '#97baa0', '#dfffe4');
  shape(ctx, [[17, -27], [17, -48], [27, -30]], frost ? '#d9feff' : '#78a67e'); shape(ctx, [[31, -26], [40, -45], [40, -22]], frost ? '#d9feff' : '#78a67e');
  eyes(ctx, -17, 5); line(ctx, -28, 13, -47, -1, frost ? '#7ec7e6' : '#4b746d', 5);
  for (const side of [-1, 1]) { line(ctx, side * 11, 14, side * 15, 31 + (side > 0 ? step : -step), frost ? '#5ca7c9' : '#446a5f', 5); }
  if (frost) for (const x of [-12, 0, 12]) shape(ctx, [[x - 4, -14], [x, -36], [x + 4, -14]], '#b7f6ff', '#ecffff');
  attackTrail(ctx, state, frost ? '#b5f9ff' : '#9ce9b3'); ctx.restore();
}

function drawBloom(ctx, enemy, state) {
  const sway = Math.sin(state.time * 2.2) * 4; const spirit = enemy.visualType === 'spirit';
  ctx.save(); ctx.rotate(sway * .015);
  if (spirit) { shape(ctx, [[-20, -11], [0, -32], [22, -10], [17, 22], [0, 29], [-18, 21]], '#8b6ac2', '#dfc7ff'); eyes(ctx, -4, 7); for (const side of [-1, 1]) line(ctx, side * 14, 15, side * 31, 35 + Math.sin(state.time * 4 + side) * 4, '#c68cff', 3); circle(ctx, 0, -2, 8, '#e3b4ff'); }
  else { line(ctx, 0, 11, 0, 31, '#4f9e69', 8); for (let i = 0; i < 6; i += 1) { ctx.save(); ctx.rotate(i * Math.PI / 3 + state.time * .15); ctx.fillStyle = i % 2 ? '#81dcad' : '#4cae9b'; ctx.beginPath(); ctx.ellipse(0, -25, 12, 22, 0, 0, TAU); ctx.fill(); ctx.restore(); } circle(ctx, 0, -2, 17, '#e3d08a'); eyes(ctx, 0, 5); line(ctx, -3, 17, -24, 26, '#4b9562', 4); line(ctx, 3, 17, 24, 26, '#4b9562', 4); }
  if (state.attack) { ctx.globalAlpha = .55; for (const x of [-20, 0, 20]) circle(ctx, x, -30, 4, spirit ? '#dda7ff' : '#b3ffd5'); }
  ctx.restore();
}

function drawLizard(ctx, enemy, state) {
  const lunge = state.attack ? -10 : 0; ctx.save(); ctx.translate(lunge, 0);
  shape(ctx, [[-39, 13], [-57, 18], [-37, 1], [-17, -13], [12, -16], [34, -5], [28, 16], [-8, 22]], '#873f3d', '#ffb45d');
  shape(ctx, [[7, -13], [29, -32], [48, -12], [37, 5], [19, 3]], '#bd6345', '#ffbd70'); eyes(ctx, -15, 5); line(ctx, -33, 11, -55, 27, '#69333b', 5);
  for (const x of [-8, 8, 23]) line(ctx, x, -6, x + 5, 13, '#ff9854', 2); for (const side of [-1, 1]) line(ctx, side * 13, 13, side * 20, 29, '#69333b', 5);
  attackTrail(ctx, state, '#ff9b4f'); ctx.restore();
}

function drawFiend(ctx, enemy, state) {
  const flap = Math.sin(state.time * 7) * 7; const leap = state.attack ? -7 : 0; ctx.save(); ctx.translate(0, leap);
  shape(ctx, [[-15, 16], [-19, -16], [0, -29], [20, -15], [15, 17]], '#c94c59', '#ffc873');
  shape(ctx, [[-15, -9], [-43, -27 - flap], [-30, 8]], '#783d70', '#d985a4'); shape(ctx, [[15, -9], [43, -27 + flap], [30, 8]], '#783d70', '#d985a4');
  shape(ctx, [[-11, -22], [-19, -42], [-3, -27]], '#ffc65f'); shape(ctx, [[11, -22], [19, -42], [3, -27]], '#ffc65f'); eyes(ctx, -10, 6); line(ctx, 12, 13, 35, 24, '#7e2e50', 4); circle(ctx, 38, 25, state.attack ? 10 : 6, '#ff9c4a');
  ctx.restore();
}

function drawHawk(ctx, enemy, state) {
  const flap = Math.sin(state.time * 8) * 9; const dive = state.attack ? 9 : 0; ctx.save(); ctx.translate(-dive, -7);
  shape(ctx, [[-28, 2], [-53, -23 - flap], [-19, -9], [0, -22], [19, -9], [52, -23 + flap], [28, 4], [9, 19], [-11, 19]], '#ba5c4c', '#ffc567');
  circle(ctx, 2, -8, 13, '#ed9657'); eyes(ctx, -10, 5); shape(ctx, [[14, -7], [31, -2], [14, 3]], '#ffd15d'); shape(ctx, [[-4, 14], [-20, 31], [7, 19]], '#853d52');
  if (state.attack) { ctx.globalAlpha = .55; circle(ctx, -48, -12, 5, '#ffd668'); } ctx.restore();
}

function drawGolem(ctx, enemy, state) {
  const ancient = enemy.visualType === 'golem'; const core = ancient ? '#b9f8ff' : '#f6bc7d';
  shape(ctx, [[-20, 22], [-27, -9], [0, -28], [27, -9], [20, 23]], ancient ? '#78a9c5' : '#6d708a', '#e3fbff');
  shape(ctx, [[-14, -28], [0, -44], [15, -28], [11, -14], [-11, -14]], ancient ? '#c8f5ff' : '#b4b4ca', '#f0ffff'); eyes(ctx, -24, 5);
  for (const side of [-1, 1]) { line(ctx, side * 19, -2, side * 38, 12 + (state.attack ? -7 : 0), ancient ? '#5c91b0' : '#52566d', 8); circle(ctx, side * 42, 14, 7, ancient ? '#9feaff' : '#b8bdd4'); line(ctx, side * 11, 20, side * 16, 35, ancient ? '#548baa' : '#50556c', 7); }
  circle(ctx, 0, 1, state.attack ? 10 : 7, core); if (state.attack) { ctx.globalAlpha = .45; circle(ctx, 0, 1, 20, core); }
}

function drawSentinel(ctx, enemy, state) {
  const mech = enemy.visualType === 'mech'; const palette = mech ? ['#68709a', '#c5d4ff', '#e39dff'] : ['#716887', '#d9ccff', '#73f0df'];
  shape(ctx, [[-19, 24], [-24, -8], [0, -28], [24, -8], [19, 24]], palette[0], palette[1]);
  shape(ctx, [[-14, -27], [0, -43], [14, -27], [10, -14], [-10, -14]], palette[1], '#f6f1ff'); eyes(ctx, -23, 5);
  for (const side of [-1, 1]) { line(ctx, side * 18, -5, side * 37, 12, palette[0], 7); circle(ctx, side * 40, 14, 6, palette[1]); line(ctx, side * 10, 21, side * 15, 37, palette[0], 6); }
  circle(ctx, 0, 0, state.attack ? 10 : 6, palette[2]); if (state.attack) line(ctx, 27, -5, 49, -18, palette[2], 3);
}

function drawFloater(ctx, enemy, state) {
  const bob = Math.sin(state.time * 3.1) * 7; ctx.save(); ctx.translate(0, bob);
  shape(ctx, [[-24, -6], [0, -27], [25, -6], [19, 17], [0, 26], [-19, 17]], '#8065bc', '#e9cbff');
  circle(ctx, 0, 0, 14, '#c49dff'); circle(ctx, 0, 0, 6, '#2f3058'); circle(ctx, 2, -2, 2, '#fff');
  for (const side of [-1, 1]) line(ctx, side * 12, 14, side * 28, 35 + Math.sin(state.time * 4 + side) * 4, '#c78cff', 3);
  if (state.attack) { ctx.globalAlpha = .55; circle(ctx, -33, -6, 7, '#e2b2ff'); } ctx.restore();
}

const MONSTER_DRAWERS = {
  slime: drawSlime, iceSlime: drawSlime, rabbit: drawRabbit, beetle: drawBeetle,
  wolf: drawWolf, frostWolf: drawWolf, bloom: drawBloom, spirit: drawBloom,
  lizard: drawLizard, fiend: drawFiend, hawk: drawHawk, golem: drawGolem,
  sentinel: drawSentinel, mech: drawSentinel, floater: drawFloater,
};

function drawEliteDetails(ctx, enemy, state) {
  if (!enemy.elite) return;
  const accent = enemy.accentColor || '#ffe37d';
  ctx.save(); ctx.globalAlpha = state.powerSave ? .2 : .35; ctx.strokeStyle = accent; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, 31, 35 + Math.sin(state.time * 3) * 2, 0, TAU); ctx.stroke();
  if (!state.powerSave) { ctx.beginPath(); ctx.arc(0, 31, 25, 0, TAU); ctx.stroke(); }
  ctx.globalAlpha = 1; shape(ctx, [[0, -59], [7, -50], [0, -41], [-7, -50]], '#ffe89a', '#fff6cb');
  if (enemy.eliteVariant === 'crystal' || enemy.eliteVariant === 'prism') { shape(ctx, [[-29, -13], [-39, -36], [-20, -18]], accent, '#fff'); shape(ctx, [[29, -13], [39, -36], [20, -18]], accent, '#fff'); }
  else if (enemy.eliteVariant === 'horned' || enemy.eliteVariant === 'fang') { shape(ctx, [[-15, -25], [-28, -48], [-4, -30]], '#ffe2a2', '#a66d42'); shape(ctx, [[15, -25], [28, -48], [4, -30]], '#ffe2a2', '#a66d42'); }
  else { circle(ctx, 0, -44, 5, accent, '#fff'); }
  ctx.restore();
}

function drawBossLegacy(ctx, type, time, rage) {
  const base = { crownBeast:['#8c6240','#ffd66a'], ancientTree:['#485c36','#aaf08b'], coreTyrant:['#7d3438','#ff9d55'], frostWarden:['#4c7aa2','#c7fbff'], astralJudge:['#522d78','#f0a5ff'] }[type] || ['#49345f','#ffcf7b'];
  const pulse = 1 + Math.sin(time * 4) * .04; ctx.scale(pulse, pulse);
  if (type === 'ancientTree') { line(ctx, -18, 16, -53, -40, '#5c432d', 10); line(ctx, 18, 16, 53, -40, '#5c432d', 10); for (const x of [-46, 0, 46]) circle(ctx, x, -45, 17, '#78b95e'); }
  else if (type === 'coreTyrant') { shape(ctx, [[-60,28],[-82,12],[-55,-2],[-30,18]], '#6b3036','#ff895b'); shape(ctx, [[60,28],[82,12],[55,-2],[30,18]], '#6b3036','#ff895b'); }
  else if (type === 'frostWarden') for (const side of [-1, 1]) shape(ctx, [[side*30,-10],[side*74,-62],[side*58,17]], '#7ccce9','#e3ffff');
  else if (type === 'astralJudge') for (const side of [-1, 1]) line(ctx, side * 28, -20, side * 72, -42, '#ecacff', 5);
  shape(ctx, [[-55,22],[-68,-5],[-46,-32],[-21,-22],[0,-54],[22,-22],[49,-32],[67,-4],[53,25],[22,36],[0,49],[-22,36]], base[0], base[1]);
  circle(ctx, 0, -2, 31, base[0]); circle(ctx, 0, 0, 13, base[1]); eyes(ctx, -9, 13);
  for (const side of [-1, 1]) { shape(ctx, [[side*33,-15],[side*63,-31],[side*55,2],[side*35,12]], base[0], base[1]); circle(ctx, side*45, -6, 5, base[1]); }
  if (type === 'crownBeast') { for (const side of [-1, 1]) shape(ctx, [[side*15,-35],[side*32,-68],[side*39,-32]], '#e6a64a','#fff0a6'); }
  if (rage) { ctx.strokeStyle='#ff4d74'; ctx.lineWidth=3; ctx.globalAlpha=.75; for(let i=0;i<3;i+=1){ctx.beginPath();ctx.arc(0,0,47+i*9+Math.sin(time*5+i)*4,0,TAU);ctx.stroke();} }
}

export function drawMonster(ctx, enemy, { time = 0, x = 278, y = 267, attackIn = 1, powerSave = false } = {}) {
  const action = enemy.action || 'idle';
  const spawnProgress = enemy.spawnIn ? Math.max(.08, 1 - enemy.spawnIn / .36) : 1;
  const dying = action === 'death'; const deathProgress = enemy.deathIn ? Math.max(0, enemy.deathIn / .46) : (dying ? 0 : 1);
  const state = { time, attack: action === 'attack' || attackIn < .23, hurt: action === 'hurt' || enemy.hit > 0, powerSave };
  const floating = ['hawk', 'fiend', 'floater', 'spirit'].includes(enemy.visualType);
  const size = (enemy.bodyScale || 1) * (enemy.elite ? 1.2 : 1) * (enemy.boss ? 1.55 : 1);
  const knock = state.hurt ? -7 : 0; const bob = floating ? Math.sin(time * 3) * 3 : Math.sin(time * 2) * 1.4;
  ctx.save(); ctx.translate(x + knock, y + bob + (dying ? (1 - deathProgress) * 20 : 0)); ctx.globalAlpha = dying ? deathProgress : spawnProgress;
  ctx.scale(size * (dying ? .65 + deathProgress * .35 : spawnProgress), size * (dying ? .65 + deathProgress * .35 : spawnProgress));
  softShadow(ctx, 35, floating); ctx.shadowColor = enemy.accentColor || '#cf96ff'; ctx.shadowBlur = state.hurt ? 18 : (powerSave ? 4 : 9);
  if (enemy.boss) drawBossLegacy(ctx, enemy.visualType, time, enemy.hp / enemy.maxHp < .4);
  else { drawEliteDetails(ctx, enemy, state); (MONSTER_DRAWERS[enemy.visualType] || drawSentinel)(ctx, enemy, state); }
  if (state.hurt) { ctx.globalAlpha = .34; circle(ctx, 0, -2, 38, '#fff'); }
  ctx.restore();
  return { x:x + knock, y:y + bob, scale:size, rage:enemy.boss && enemy.hp / enemy.maxHp < .4, alpha:dying ? deathProgress : spawnProgress };
}
