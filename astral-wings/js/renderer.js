const pickupColors = { gold: '#ffd568', chest: '#ffc45e', power: '#ff9b38', hp: '#70ff9c', shield: '#62dfff', energy: '#bb79ff', magnet: '#ffe66b', rage: '#ff5871', double: '#ffd26d', pierce: '#f6a5ff', crit: '#ffdf66', barrier: '#9cefff', rapid: '#ff9c5d' };
const pickupMarks = { gold: '$', chest: '箱', power: 'P', hp: '+', shield: 'S', energy: 'E', magnet: 'M', rage: 'R', double: '2', pierce: 'I', crit: 'C', barrier: 'B', rapid: 'H' };

// 原創 AI 機體圖集。圖尚未完成載入時，會無縫退回原本的 Canvas 幾何造型。
// 原創敵機與補給圖集：透明 PNG 直接在 Canvas 內裁切，避免以單色幾何代替實體機械輪廓。
const aiCombatRoster = document.querySelector('#ai-enemy-pickups-v2') || new Image();
if (!aiCombatRoster.src) aiCombatRoster.src = new URL('../assets/images/astral-ai-enemy-pickups-v2.png', import.meta.url).href;
const combatEnemyCells = {
  scout: [18, 38, 324, 330], sprinter: [350, 22, 365, 380], sniper: [710, 25, 365, 370], shield: [1080, 48, 325, 350],
  armor: [18, 420, 330, 350], bomber: [350, 420, 365, 350], support: [720, 415, 350, 365], elite: [1060, 392, 350, 390]
  ,flare: [18, 38, 324, 330], formation: [350, 22, 365, 380], thresher: [18, 420, 330, 350], reaper: [350, 420, 365, 350]
  ,bastion: [1080, 48, 325, 350], medic: [720, 415, 350, 365], laser: [710, 25, 365, 370], phantom: [350, 22, 365, 380]
  ,miner: [18, 420, 330, 350], warder: [1080, 48, 325, 350], beacon: [720, 415, 350, 365], splitter: [710, 25, 365, 370]
};
const combatPickupCells = {
  power: [42, 780, 175, 265], shield: [240, 785, 190, 250], hp: [465, 805, 205, 225],
  energy: [700, 795, 205, 240], magnet: [940, 790, 245, 245], rage: [1180, 785, 230, 250]
};
const drawCombatArt = (ctx, source, x, y, width, height, rotation = 0) => {
  if (!source || !aiCombatRoster.complete || !aiCombatRoster.naturalWidth) return false;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rotation);
  ctx.drawImage(aiCombatRoster, source[0], source[1], source[2], source[3], -width / 2, -height / 2, width, height);
  ctx.restore();
  return true;
};

const aiCraftRoster = document.querySelector('#ai-craft-roster') || new Image();
aiCraftRoster.decoding = 'async';
if (!aiCraftRoster.src) aiCraftRoster.src = new URL('../assets/images/astral-ai-craft-premium.png', import.meta.url).href;
const aiCraftClean = document.createElement('canvas');
let aiCraftReady = false;

// 生成器輸出的淺灰棋盤格只用作預覽背景；載入後將近乎中性的亮色像素轉為透明。
function prepareAiCraft() {
  if (!aiCraftRoster.naturalWidth || aiCraftReady) return;
  aiCraftClean.width = aiCraftRoster.naturalWidth;
  aiCraftClean.height = aiCraftRoster.naturalHeight;
  const cleanContext = aiCraftClean.getContext('2d', { willReadFrequently: true });
  cleanContext.drawImage(aiCraftRoster, 0, 0);
  const pixels = cleanContext.getImageData(0, 0, aiCraftClean.width, aiCraftClean.height);
  for (let index = 0; index < pixels.data.length; index += 4) {
    const red = pixels.data[index]; const green = pixels.data[index + 1]; const blue = pixels.data[index + 2];
    const neutral = Math.max(red, green, blue) - Math.min(red, green, blue) < 9;
    if (neutral && red > 170 && green > 170 && blue > 170) pixels.data[index + 3] = 0;
  }
  cleanContext.putImageData(pixels, 0, 0);
  aiCraftReady = true;
}
if (aiCraftRoster.complete) prepareAiCraft();
else aiCraftRoster.addEventListener('load', prepareAiCraft, { once: true });

const aiReady = () => aiCraftReady;
const drawAiCraft = (ctx, cell, x, y, width, height, alpha = 1) => {
  if (!aiReady()) return false;
  const cellWidth = aiCraftClean.width / 2;
  const cellHeight = aiCraftClean.height / 3;
  const sourceX = (cell % 2) * cellWidth;
  const sourceY = Math.floor(cell / 2) * cellHeight;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(aiCraftClean, sourceX, sourceY, cellWidth, cellHeight, x - width / 2, y - height / 2, width, height);
  ctx.restore();
  return true;
};

// 第二代圖集已經是透明背景，直接以 3×2 角色格繪製。這套圖用於目前
// 可選戰機，避免在高細節插畫上再疊加粗重的舊幾何外框。
const refinedCraftRoster = document.querySelector('#ai-craft-refined') || new Image();
refinedCraftRoster.decoding = 'async';
if (!refinedCraftRoster.src) refinedCraftRoster.src = new URL('../assets/images/astral-ai-craft-premium-v2.png', import.meta.url).href;
const refinedCraftCells = { dawn: 0, ember: 1, violet: 2, bulwark: 3, auric: 4, specter: 5, tide: 0, rime: 3, nova: 4, helix: 1, aurora: 0, caldera: 1, seraph: 4, voidlance: 5, solaris: 4 };
const drawRefinedCraft = (ctx, shipId, x, y, width, height, alpha = 1) => {
  if (!refinedCraftRoster.complete || !refinedCraftRoster.naturalWidth) return false;
  const cell = refinedCraftCells[shipId] ?? 0;
  const cellWidth = refinedCraftRoster.naturalWidth / 3;
  const cellHeight = refinedCraftRoster.naturalHeight / 2;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(refinedCraftRoster, (cell % 3) * cellWidth, Math.floor(cell / 3) * cellHeight, cellWidth, cellHeight, x - width / 2, y - height / 2, width, height);
  ctx.restore();
  return true;
};

// 敵方圖集同樣以 3×2 格排列。保留舊圖集作為載入失敗時的安全後備。
const refinedEnemyRoster = document.querySelector('#ai-enemies-refined') || new Image();
refinedEnemyRoster.decoding = 'async';
if (!refinedEnemyRoster.src) refinedEnemyRoster.src = new URL('../assets/images/astral-ai-enemies-refined.png', import.meta.url).href;
const refinedEnemyCells = {
  scout: 0, sprinter: 1, sniper: 3, shield: 4, armor: 2, bomber: 1, support: 4, elite: 5,
  flare: 0, formation: 1, thresher: 2, reaper: 3, bastion: 2, medic: 4, laser: 3, phantom: 1,
  miner: 2, warder: 4, beacon: 5, splitter: 0
};
const drawRefinedEnemy = (ctx, kind, x, y, width, height, rotation = 0) => {
  if (!refinedEnemyRoster.complete || !refinedEnemyRoster.naturalWidth) return false;
  const cell = refinedEnemyCells[kind];
  if (cell === undefined) return false;
  const cellWidth = refinedEnemyRoster.naturalWidth / 3;
  const cellHeight = refinedEnemyRoster.naturalHeight / 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.drawImage(refinedEnemyRoster, (cell % 3) * cellWidth, Math.floor(cell / 3) * cellHeight, cellWidth, cellHeight, -width / 2, -height / 2, width, height);
  ctx.restore();
  return true;
};

// 補給圖集：4×3 格，讓火力、護盾與各種短暫增益在彈幕中仍然一眼可辨。
const refinedPickupRoster = document.querySelector('#ai-pickups-refined') || new Image();
refinedPickupRoster.decoding = 'async';
if (!refinedPickupRoster.src) refinedPickupRoster.src = new URL('../assets/images/astral-ai-pickups-refined.png', import.meta.url).href;
const refinedPickupCells = { power: 0, hp: 1, shield: 2, energy: 3, magnet: 4, rage: 5, double: 6, pierce: 7, crit: 8, barrier: 9, rapid: 10, chest: 11, gold: 6 };
const drawRefinedPickup = (ctx, type, x, y, width, height, rotation = 0) => {
  if (!refinedPickupRoster.complete || !refinedPickupRoster.naturalWidth) return false;
  const cell = refinedPickupCells[type];
  if (cell === undefined) return false;
  const cellWidth = refinedPickupRoster.naturalWidth / 4;
  const cellHeight = refinedPickupRoster.naturalHeight / 3;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.drawImage(refinedPickupRoster, (cell % 4) * cellWidth, Math.floor(cell / 4) * cellHeight, cellWidth, cellHeight, -width / 2, -height / 2, width, height);
  ctx.restore();
  return true;
};

// 子彈與補給專用 AI 圖集；移除生成圖的淺色底後以小精靈形式繪製。
const aiVfxRoster = document.querySelector('#ai-vfx-roster') || new Image();
if (!aiVfxRoster.src) aiVfxRoster.src = new URL('../assets/images/astral-ai-vfx-sprites.png', import.meta.url).href;
const aiVfxClean = document.createElement('canvas');
let aiVfxReady = false;
function prepareAiVfx() {
  if (!aiVfxRoster.naturalWidth || aiVfxReady) return;
  aiVfxClean.width = aiVfxRoster.naturalWidth; aiVfxClean.height = aiVfxRoster.naturalHeight;
  const clean = aiVfxClean.getContext('2d', { willReadFrequently: true }); clean.drawImage(aiVfxRoster, 0, 0);
  const pixels = clean.getImageData(0, 0, aiVfxClean.width, aiVfxClean.height);
  for (let index = 0; index < pixels.data.length; index += 4) {
    const red = pixels.data[index]; const green = pixels.data[index + 1]; const blue = pixels.data[index + 2];
    if (Math.min(red, green, blue) > 180 && Math.max(red, green, blue) - Math.min(red, green, blue) < 34) pixels.data[index + 3] = 0;
  }
  clean.putImageData(pixels, 0, 0); aiVfxReady = true;
}
if (aiVfxRoster.complete) prepareAiVfx(); else aiVfxRoster.addEventListener('load', prepareAiVfx, { once: true });
const drawAiVfx = (ctx, cell, x, y, width, height) => {
  if (!aiVfxReady) return false;
  const cellWidth = aiVfxClean.width / 4; const cellHeight = aiVfxClean.height / 3;
  ctx.drawImage(aiVfxClean, (cell % 4) * cellWidth, Math.floor(cell / 4) * cellHeight, cellWidth, cellHeight, x - width / 2, y - height / 2, width, height);
  return true;
};

// 敵方彈幕使用另一組原創圖集與紅紫色系，避免與玩家子彈、金幣或補給混淆。
const aiEnemyVfxRoster = document.querySelector('#ai-enemy-vfx-roster') || new Image();
if (!aiEnemyVfxRoster.src) aiEnemyVfxRoster.src = new URL('../assets/images/astral-ai-enemy-vfx.png', import.meta.url).href;
const aiEnemyVfxClean = document.createElement('canvas');
let aiEnemyVfxReady = false;
function prepareAiEnemyVfx() {
  if (!aiEnemyVfxRoster.naturalWidth || aiEnemyVfxReady) return;
  aiEnemyVfxClean.width = aiEnemyVfxRoster.naturalWidth; aiEnemyVfxClean.height = aiEnemyVfxRoster.naturalHeight;
  const clean = aiEnemyVfxClean.getContext('2d', { willReadFrequently: true }); clean.drawImage(aiEnemyVfxRoster, 0, 0);
  const pixels = clean.getImageData(0, 0, aiEnemyVfxClean.width, aiEnemyVfxClean.height);
  for (let index = 0; index < pixels.data.length; index += 4) {
    const red = pixels.data[index]; const green = pixels.data[index + 1]; const blue = pixels.data[index + 2];
    if (green > red * 1.22 && green > blue * 1.22 && green > 120) pixels.data[index + 3] = 0;
  }
  clean.putImageData(pixels, 0, 0); aiEnemyVfxReady = true;
}
if (aiEnemyVfxRoster.complete) prepareAiEnemyVfx(); else aiEnemyVfxRoster.addEventListener('load', prepareAiEnemyVfx, { once: true });
const drawEnemyVfx = (ctx, cell, x, y, width, height, rotation) => {
  if (!aiEnemyVfxReady) return false;
  const cellWidth = aiEnemyVfxClean.width / 4; const cellHeight = aiEnemyVfxClean.height / 2;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rotation);
  ctx.drawImage(aiEnemyVfxClean, (cell % 4) * cellWidth, Math.floor(cell / 4) * cellHeight, cellWidth, cellHeight, -width / 2, -height / 2, width, height);
  ctx.restore();
  return true;
};

// 原創幾何輪廓讓敵機在手機小畫面上仍可一眼辨識職能。
function drawEnemy(ctx, entry, triangle) {
  const combatCell = combatEnemyCells[entry.kind];
  // 機體外觀縮小至可閃避比例，保留高解析原創圖集的裝甲細節與輪廓。
  const visualSize = entry.kind === 'elite' ? 78 : entry.r >= 32 ? 62 : entry.r >= 28 ? 56 : 48;
  if (drawRefinedEnemy(ctx, entry.kind, entry.x, entry.y, visualSize, visualSize + 8, Math.sin(entry.age * 1.7) * 0.025)) {
    if (entry.shield > 0) { ctx.save(); ctx.strokeStyle = '#78cfff'; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.arc(entry.x, entry.y, entry.r + 5, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    return;
  }
  const aiCells = { scout: 2, sprinter: 2, armor: 3, sniper: 2, bomber: 3, shield: 4, support: 5, elite: 1 };
  if (aiCells[entry.kind] !== undefined && drawAiCraft(ctx, aiCells[entry.kind], entry.x, entry.y, entry.kind === 'elite' ? 112 : 82, entry.kind === 'elite' ? 112 : 82, 0.92)) {
    if (entry.shield > 0) { ctx.save(); ctx.strokeStyle = '#78cfff'; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.arc(entry.x, entry.y, entry.r + 5, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    return;
  }
  ctx.save(); ctx.translate(entry.x, entry.y); ctx.shadowBlur = 8; ctx.shadowColor = entry.color;
  ctx.fillStyle = entry.color;
  if (entry.kind === 'sprinter') { ctx.beginPath(); ctx.moveTo(0, 18); ctx.lineTo(-11, -13); ctx.lineTo(0, -6); ctx.lineTo(11, -13); ctx.closePath(); ctx.fill(); }
  else if (entry.kind === 'armor' || entry.kind === 'elite') { ctx.fillRect(-18, -14, 36, 28); ctx.fillStyle = '#3b2023'; ctx.fillRect(-5, -19, 10, 38); ctx.fillStyle = entry.color; ctx.fillRect(-25, -4, 12, 10); ctx.fillRect(13, -4, 12, 10); }
  else if (entry.kind === 'sniper') { ctx.beginPath(); ctx.moveTo(0, 19); ctx.lineTo(-14, -12); ctx.lineTo(14, -12); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#f5dbff'; ctx.fillRect(-2, -19, 4, 25); }
  else if (entry.kind === 'bomber') { ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill(); }
  else if (entry.kind === 'shield') { ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(-18, -4); ctx.lineTo(0, -18); ctx.lineTo(18, -4); ctx.closePath(); ctx.fill(); }
  else if (entry.kind === 'support') { ctx.fillRect(-12, -10, 24, 20); ctx.fillStyle = '#fff3a0'; ctx.fillRect(-22, -3, 44, 6); }
  else { ctx.restore(); triangle(entry, entry.color); if (entry.shield > 0) { ctx.strokeStyle = '#78cfff'; ctx.globalAlpha = 0.65; ctx.beginPath(); ctx.arc(entry.x, entry.y, entry.r + 4, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; } return; }
  ctx.restore();
  if (entry.shield > 0) { ctx.strokeStyle = '#78cfff'; ctx.globalAlpha = 0.65; ctx.beginPath(); ctx.arc(entry.x, entry.y, entry.r + 5, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
}

function drawEnemyVitalBar(ctx, entry, boss = false) {
  const width = boss ? 104 : Math.max(28, entry.r * 2.1);
  const x = entry.x - width / 2; const y = entry.y - entry.r - (boss ? 46 : 13);
  const ratio = Math.max(0, entry.hp / entry.maxHp);
  ctx.save();
  ctx.fillStyle = '#12070dcc'; ctx.fillRect(x - 1, y - 1, width + 2, 6);
  ctx.fillStyle = '#3b1825'; ctx.fillRect(x, y, width, 4);
  ctx.fillStyle = boss ? '#ff5b78' : (entry.kind === 'elite' ? '#ffb45c' : '#ff6e87');
  ctx.fillRect(x, y, width * ratio, 4);
  ctx.restore();
}

// 副武器不只影響攻擊資料，也在戰機上繪出可辨識的掛載模組與動態能量核心。
function drawSecondaryRig(ctx, p, secondary, elapsed) {
  if (!secondary) return;
  const pulse = 0.75 + Math.sin(elapsed * 7) * 0.25;
  const glow = (color, blur = 10) => { ctx.shadowColor = color; ctx.shadowBlur = blur; ctx.fillStyle = color; };
  ctx.save();
  if (secondary === 's1') {
    // 追跡飛彈：雙翼橘紅飛彈莢艙。
    glow('#ff8a58'); [-31, 31].forEach(x => { ctx.fillRect(p.x + x - 4, p.y + 6, 8, 20); ctx.fillStyle = '#ffe1ba'; ctx.fillRect(p.x + x - 2, p.y + 4, 4, 7); glow('#ff8a58'); });
  } else if (secondary === 's2' || secondary === 's6') {
    // 軌道雷射：兩側青白導軌，可看出雷射的發射來源。
    glow('#9df7ff', 14); [-28, 28].forEach(x => { ctx.fillRect(p.x + x - 3, p.y - 17, 6, 34); ctx.fillStyle = '#ecffff'; ctx.fillRect(p.x + x - 1, p.y - 22, 2, 15); glow('#9df7ff', 14); });
  } else if (secondary === 's3') {
    // 爆裂無人機：兩顆伴飛球會環繞機身。
    [-1, 1].forEach(side => { const angle = elapsed * 2.4 + (side > 0 ? 0 : Math.PI); const x = p.x + Math.cos(angle) * 31; const y = p.y + Math.sin(angle) * 13; glow('#62efff', 12); ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#f0ffff'; ctx.fillRect(x - 2, y - 2, 4, 4); });
  } else if (secondary === 's4') {
    // 電磁脈衝：紫色核心環。
    ctx.strokeStyle = '#d398ff'; ctx.shadowColor = '#b772ff'; ctx.shadowBlur = 13; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y + 4, 24 + pulse * 4, 0, Math.PI * 2); ctx.stroke();
  } else if (secondary === 's5') {
    // 導引集束：金色三角鎖定器。
    glow('#ffe477', 12); [-22, 0, 22].forEach(x => { ctx.beginPath(); ctx.moveTo(p.x + x, p.y - 23); ctx.lineTo(p.x + x - 5, p.y - 11); ctx.lineTo(p.x + x + 5, p.y - 11); ctx.closePath(); ctx.fill(); });
  } else if (secondary === 's7') {
    // 稜鏡散射：四枚紫晶節點。
    [-25, -9, 9, 25].forEach((x, index) => { glow('#ad91ff', 11); ctx.save(); ctx.translate(p.x + x, p.y + 12 + (index % 2) * 5); ctx.rotate(Math.PI / 4); ctx.fillRect(-5, -5, 10, 10); ctx.restore(); });
  } else if (secondary === 's8') {
    // 爆裂彈：兩座赤橙短炮塔。
    glow('#ff9a5a', 12); [-24, 24].forEach(x => { ctx.fillRect(p.x + x - 6, p.y - 9, 12, 15); ctx.fillStyle = '#ffdfb3'; ctx.fillRect(p.x + x - 2, p.y - 22, 4, 15); glow('#ff9a5a', 12); });
  }
  ctx.restore();
}

// 引擎欄位同時提供可見的僚機：兩翼維持隊形、實際射擊，且不會遮蔽彈幕。
function drawWingmanRig(ctx, p, wingman, elapsed) {
  if (!wingman) return;
  const colors = { e1: '#62eaff', e2: '#ff9768', e3: '#b7fbff', e4: '#ce94ff', e5: '#75f7c0', e6: '#8ccfff', e7: '#ffd96c', e8: '#ff7aa9' };
  const color = colors[wingman] || '#72eaff';
  ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 12;
  [-1, 1].forEach((side, index) => {
    const x = p.x + side * (30 + Math.sin(elapsed * 2.5 + index) * 3);
    const y = p.y + 8 + Math.cos(elapsed * 3 + index) * 4;
    ctx.save(); ctx.translate(x, y); ctx.rotate(side * 0.18);
    ctx.fillStyle = '#15283c'; ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(side * 8, 6); ctx.lineTo(0, 11); ctx.lineTo(-side * 8, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 1, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `${color}99`; ctx.fillRect(-2, 10, 4, 7 + Math.sin(elapsed * 9 + index) * 2);
    ctx.restore();
  });
  ctx.restore();
}

// 直接顯示在我方戰機上的耐久條，讓玩家不必只看 HUD 也能掌握危險程度。
function drawPlayerVitalBars(ctx, p) {
  const width = 56; const x = p.x - width / 2; const y = p.y - 60;
  ctx.save();
  ctx.fillStyle = '#07111ccc'; ctx.fillRect(x - 1, y - 1, width + 2, 11);
  ctx.fillStyle = '#271521'; ctx.fillRect(x, y, width, 4);
  ctx.fillStyle = '#48e98d'; ctx.fillRect(x, y, width * Math.max(0, p.hp / p.maxHp), 4);
  ctx.fillStyle = '#15283e'; ctx.fillRect(x, y + 6, width, 3);
  ctx.fillStyle = '#66dfff'; ctx.fillRect(x, y + 6, width * Math.max(0, p.shield / p.maxShield), 3);
  ctx.restore();
}

// 三架首要戰機使用不同的覆蓋式機械輪廓，與共用底圖一起形成可辨識的機頭、翼型與炮位。
function drawCraftSignature(ctx, p, elapsed) {
  const color = p.shipId === 'ember' ? '#ff7653' : p.shipId === 'violet' ? '#cb8cff' : '#69eaff';
  ctx.save(); ctx.translate(p.x, p.y); ctx.scale(0.72, 0.72); ctx.strokeStyle = color; ctx.fillStyle = `${color}44`; ctx.lineWidth = 1.25; ctx.shadowColor = color; ctx.shadowBlur = 5;
  if (p.shipId === 'ember') { ctx.beginPath(); ctx.moveTo(0,-42); ctx.lineTo(-18,16); ctx.lineTo(-7,11); ctx.lineTo(0,28); ctx.lineTo(7,11); ctx.lineTo(18,16); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillRect(-4,-31,8,35); }
  else if (p.shipId === 'violet') { ctx.beginPath(); ctx.moveTo(0,-44); ctx.lineTo(-30,5); ctx.lineTo(-11,13); ctx.lineTo(-18,27); ctx.lineTo(0,19); ctx.lineTo(18,27); ctx.lineTo(11,13); ctx.lineTo(30,5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(0,0,7+Math.sin(elapsed*7)*2,0,Math.PI*2); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(0,-43); ctx.lineTo(-22,-3); ctx.lineTo(-16,24); ctx.lineTo(0,16); ctx.lineTo(16,24); ctx.lineTo(22,-3); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillRect(-16,-16,5,17); ctx.fillRect(11,-16,5,17); }
  ctx.restore();
}

// 玩家彈藥不共用圓點圖樣：依武器類型畫出不同的機械投射體與短拖尾。
function drawPlayerProjectile(ctx, entry, visual) {
  const style = entry.style || 'dawn';
  const angle = Math.atan2(entry.vy, entry.vx) + Math.PI / 2;
  const form = style.includes('rail') || style.includes('aurora') ? 'rail'
    : style.includes('missile') || style.includes('seeker') ? 'missile'
    : style.includes('burst') || style.includes('ember') || style.includes('caldera') ? 'burst'
    : style.includes('blade') ? 'blade'
    : style.includes('arc') || style.includes('prism') || style.includes('violet') ? 'arc'
    : style.includes('star') || style.includes('auric') || style.includes('solaris') ? 'star' : 'pulse';
  ctx.save();
  ctx.translate(entry.x, entry.y);
  ctx.rotate(angle);
  ctx.shadowColor = visual.color;
  ctx.shadowBlur = form === 'rail' ? 16 : 10;
  ctx.fillStyle = visual.color;
  ctx.strokeStyle = '#efffff';
  ctx.lineWidth = 1;
  if (form === 'rail') {
    const beamLength = Math.max(30, visual.height * 1.15);
    const gradient = ctx.createLinearGradient(0, beamLength / 2, 0, -beamLength / 2);
    gradient.addColorStop(0, `${visual.color}22`); gradient.addColorStop(0.42, visual.color); gradient.addColorStop(0.62, '#ffffff'); gradient.addColorStop(1, `${visual.color}22`);
    ctx.fillStyle = gradient; ctx.fillRect(-visual.width / 4, -beamLength / 2, visual.width / 2, beamLength);
    ctx.strokeRect(-visual.width / 4, -beamLength / 2, visual.width / 2, beamLength);
  } else if (form === 'missile') {
    ctx.beginPath(); ctx.moveTo(0, -visual.height / 2); ctx.lineTo(visual.width / 2, visual.height / 4); ctx.lineTo(visual.width / 4, visual.height / 2); ctx.lineTo(0, visual.height / 3); ctx.lineTo(-visual.width / 4, visual.height / 2); ctx.lineTo(-visual.width / 2, visual.height / 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff2dc'; ctx.fillRect(-1.5, -visual.height / 2 + 5, 3, visual.height * .43);
  } else if (form === 'burst') {
    ctx.beginPath(); for (let point = 0; point < 8; point += 1) { const radius = point % 2 ? visual.width * .25 : visual.width * .58; const a = point * Math.PI / 4 - Math.PI / 2; const x = Math.cos(a) * radius; const y = Math.sin(a) * radius; point ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (form === 'blade') {
    ctx.rotate(entry.age * 13); ctx.beginPath(); ctx.moveTo(0, -visual.height / 2); ctx.quadraticCurveTo(visual.width / 1.5, 0, 0, visual.height / 2); ctx.quadraticCurveTo(-visual.width / 1.5, 0, 0, -visual.height / 2); ctx.fill(); ctx.stroke();
  } else if (form === 'arc') {
    ctx.beginPath(); ctx.moveTo(0, -visual.height / 2); ctx.lineTo(visual.width / 2, -visual.height * .05); ctx.lineTo(visual.width * .18, visual.height / 2); ctx.lineTo(-visual.width / 2, visual.height * .1); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (form === 'star') {
    ctx.beginPath(); for (let point = 0; point < 10; point += 1) { const radius = point % 2 ? visual.width * .22 : visual.width * .56; const a = point * Math.PI / 5 - Math.PI / 2; const x = Math.cos(a) * radius; const y = Math.sin(a) * radius; point ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.fill();
  } else {
    const half = visual.width * .28; const radius = Math.min(half, visual.height * .22);
    ctx.beginPath(); ctx.moveTo(-half + radius, -visual.height / 2); ctx.lineTo(half - radius, -visual.height / 2); ctx.quadraticCurveTo(half, -visual.height / 2, half, -visual.height / 2 + radius); ctx.lineTo(half, visual.height / 2 - radius); ctx.quadraticCurveTo(half, visual.height / 2, half - radius, visual.height / 2); ctx.lineTo(-half + radius, visual.height / 2); ctx.quadraticCurveTo(-half, visual.height / 2, -half, visual.height / 2 - radius); ctx.lineTo(-half, -visual.height / 2 + radius); ctx.quadraticCurveTo(-half, -visual.height / 2, -half + radius, -visual.height / 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#f6ffff'; ctx.fillRect(-1, -visual.height * .28, 2, visual.height * .42);
  }
  ctx.restore();
  return true;
}

export function render(ctx, state) {
  const { p, enemies, bullets, pickups, particles, boss, stars, nebulae, debris } = state;
  const shakeX = state.shake ? (Math.random() - 0.5) * state.shake : 0;
  const shakeY = state.shake ? (Math.random() - 0.5) * state.shake : 0;
  ctx.save(); ctx.translate(shakeX, shakeY);
  ctx.fillStyle = '#030914'; ctx.fillRect(-12, -12, 384, 664);
  // 三層緩速背景：星雲、星點、殘骸；不使用圖片也能保有飛行深度。
  nebulae.forEach((cloud) => { ctx.fillStyle = cloud.color; ctx.beginPath(); ctx.arc(cloud.x, cloud.y, cloud.r, 0, Math.PI * 2); ctx.fill(); });
  ctx.fillStyle = '#9fdfff';
  stars.forEach((star) => { ctx.globalAlpha = star.a; ctx.fillRect(star.x, star.y, 2, 2); });
  ctx.globalAlpha = 1;
  debris.forEach((piece) => { ctx.save(); ctx.translate(piece.x, piece.y); ctx.rotate(piece.spin); ctx.fillStyle = '#60728c'; ctx.fillRect(-piece.r, -piece.r / 2, piece.r * 2, piece.r); ctx.restore(); });

  const triangle = (object, color, flip = false) => {
    ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(object.x, object.y + (flip ? -object.r : object.r));
    ctx.lineTo(object.x - object.r, object.y + (flip ? object.r : -object.r));
    ctx.lineTo(object.x + object.r, object.y + (flip ? object.r : -object.r));
    ctx.closePath(); ctx.fill();
  };
  if (p.inv <= 0 || Math.floor(p.inv * 12) % 2) {
    const usingRefinedCraft = drawRefinedCraft(ctx, p.shipId, p.x, p.y, 62, 74, 0.98);
    if (usingRefinedCraft || drawAiCraft(ctx, p.sprite ?? 0, p.x, p.y, 62, 74, 0.96)) {
      // AI 戰機已繪製，仍保留尾焰讓移動與無敵狀態具有清楚辨識。
      const engineColors = { dawn: '#ffb553', ember: '#ff704f', violet: '#d488ff', bulwark: '#70dcff', auric: '#ffe27c', specter: '#ff90ef', tide: '#71e7ff', rime: '#a7f4ff', nova: '#fff0a5' };
      const engineColor = engineColors[p.shipId] || '#ffb553';
      ctx.save(); ctx.fillStyle = engineColor; ctx.shadowBlur = 8; ctx.shadowColor = engineColor; ctx.fillRect(p.x - 7, p.y + 20, 4, 7); ctx.fillRect(p.x + 3, p.y + 20, 4, 7); ctx.restore();
    } else {
    ctx.save(); ctx.translate(p.x, p.y); ctx.shadowBlur = 14; ctx.shadowColor = '#4ee9ff';
    ctx.fillStyle = '#254f78'; ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(-15, 16); ctx.lineTo(0, 11); ctx.lineTo(15, 16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8ff3ff'; ctx.beginPath(); ctx.moveTo(0, -19); ctx.lineTo(-6, 8); ctx.lineTo(0, 13); ctx.lineTo(6, 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f3feff'; ctx.fillRect(-2, -14, 4, 18); ctx.fillStyle = '#ffb553'; ctx.fillRect(-9, 15, 5, 8); ctx.fillRect(4, 15, 5, 8); ctx.restore();
    }
  }
  // 火力等級直接改變炮口數、核心環與待機光，不只增加子彈數值。
  ctx.save();
  const fireCount = p.fireLevel === 1 ? 2 : p.fireLevel === 2 ? 3 : p.fireLevel < 5 ? 5 : 7;
  const fireSpread = fireCount === 2 ? [-11, 11] : Array.from({ length: fireCount }, (_, i) => (i - (fireCount - 1) / 2) * (p.fireLevel >= 5 ? 7 : 5));
  ctx.globalAlpha = 0.62 + Math.sin((state.elapsed || 0) * 12) * 0.18;
  ctx.fillStyle = p.fireLevel >= 5 ? '#fff0a0' : '#88eeff'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 10 + p.fireLevel * 2;
  fireSpread.forEach(offset => ctx.fillRect(p.x + offset - 2, p.y - 43 - Math.abs(offset) * 0.06, 4, 10 + p.fireLevel * 1.5));
  if (p.fireLevel >= 4) { ctx.strokeStyle = '#8cf6ff99'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, 37 + Math.sin((state.elapsed || 0) * 5) * 3, 0, Math.PI * 2); ctx.stroke(); }
  if (state.upgradePulse > 0) { const progress = 1 - state.upgradePulse / 0.72; ctx.strokeStyle = '#ffe99b'; ctx.lineWidth = 3 * (1 - progress); ctx.globalAlpha = 1 - progress; ctx.beginPath(); ctx.arc(p.x, p.y, 22 + progress * 74, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
  drawSecondaryRig(ctx, p, state.secondary, state.elapsed || 0);
  // 舊線條輪廓僅在新版圖集還沒載入時顯示，避免壓住精細機體美術。
  if (!refinedCraftRoster.complete || !refinedCraftRoster.naturalWidth) drawCraftSignature(ctx, p, state.elapsed || 0);
  drawWingmanRig(ctx, p, state.wingman, state.elapsed || 0);
  drawPlayerVitalBars(ctx, p);
  enemies.forEach((entry) => { drawEnemy(ctx, entry, triangle); drawEnemyVitalBar(ctx, entry); });
  if (boss) {
    if (!drawAiCraft(ctx, 1, boss.x, boss.y, 220, 190, 0.95)) { ctx.save();
    ctx.shadowBlur = 18; ctx.shadowColor = boss.phase === 3 ? '#ff355f' : '#f98aaf';
    ctx.fillStyle = '#5c1835'; ctx.fillRect(boss.x - 49, boss.y - 24, 98, 51);
    ctx.fillStyle = boss.color; ctx.fillRect(boss.x - 39, boss.y - 30, 78, 48);
    ctx.fillStyle = '#ffc5d4'; ctx.fillRect(boss.x - 6, boss.y - 22, 12, 22);
    ctx.fillStyle = '#2e1024'; ctx.fillRect(boss.x - 68, boss.y - 5, 25, 15); ctx.fillRect(boss.x + 43, boss.y - 5, 25, 15);
    triangle({ x: boss.x, y: boss.y - 38, r: 25 }, '#ff91a7', true);
    ctx.restore(); }
    if (boss.laserWarn > 0 || boss.laserActive > 0) {
      ctx.fillStyle = boss.laserActive > 0 ? '#ff4571aa' : '#ff739066';
      ctx.fillRect(boss.x - 10, boss.y + 18, 20, 620 - boss.y);
      ctx.strokeStyle = '#fff2f4'; ctx.lineWidth = 1; ctx.strokeRect(boss.x - 10, boss.y + 18, 20, 620 - boss.y);
    }
    drawEnemyVitalBar(ctx, boss, true);
  }
  bullets.forEach((entry) => {
    const projectileVisuals = {
      dawn: { cell: 0, color: '#66eaff', width: 15, height: 25, trail: '#72efff99' },
      ember: { cell: 1, color: '#ff8a55', width: 18, height: 30, trail: '#ff9c6399' },
      violet: { cell: 2, color: '#c98bff', width: 16, height: 27, trail: '#d4a4ff99' },
      auric: { cell: 3, color: '#ffe078', width: 17, height: 30, trail: '#ffe98a99' },
      bulwark: { cell: 0, color: '#69dfff', width: 18, height: 27, trail: '#7de9ff99' },
      specter: { cell: 2, color: '#ff8ff5', width: 13, height: 24, trail: '#e9a6ff99' },
      tide: { cell: 0, color: '#63dfff', width: 15, height: 26, trail: '#83edff99' },
      rime: { cell: 4, color: '#dfffff', width: 20, height: 42, trail: '#aef4ffcc' },
      nova: { cell: 3, color: '#fff093', width: 16, height: 28, trail: '#ffe695aa' },
      helix: { cell: 1, color: '#ffbd63', width: 18, height: 26, trail: '#ffd38cbb' },
      aurora: { cell: 4, color: '#9effff', width: 22, height: 48, trail: '#c5ffffdd' },
      caldera: { cell: 1, color: '#ff7651', width: 28, height: 34, trail: '#ffb27aaa' },
      seraph: { cell: 3, color: '#fff4ae', width: 17, height: 30, trail: '#fff8c0bb' },
      voidlance: { cell: 2, color: '#bb83ff', width: 16, height: 40, trail: '#d9b8ffcc' },
      solaris: { cell: 3, color: '#ffe777', width: 20, height: 36, trail: '#fff3a9cc' },
      'secondary-missile': { cell: 1, color: '#ff875f', width: 19, height: 33, trail: '#ff9a6fbb' },
      'secondary-rail': { cell: 4, color: '#dfffff', width: 20, height: 42, trail: '#b9f5ffcc' },
      'secondary-drone': { cell: 0, color: '#66eeff', width: 13, height: 24, trail: '#60e8ff99' },
      'secondary-pulse': { cell: 2, color: '#ce87ff', width: 21, height: 24, trail: '#d69affaa' },
      'secondary-seeker': { cell: 3, color: '#ffe174', width: 15, height: 29, trail: '#ffe998aa' },
      'secondary-prism': { cell: 2, color: '#a88cff', width: 13, height: 25, trail: '#bda6ff99' },
      'secondary-burst': { cell: 1, color: '#ff9b58', width: 20, height: 28, trail: '#ffae70aa' },
      'primary-star': { cell: 3, color: '#ffd76c', width: 18, height: 25, trail: '#ffe69a99' },
      'primary-rail': { cell: 4, color: '#c8f8ff', width: 18, height: 42, trail: '#c4f6ffbb' },
      'primary-ember': { cell: 1, color: '#ff7a51', width: 14, height: 24, trail: '#ff9d7e99' },
      'primary-burst': { cell: 1, color: '#ffb15c', width: 25, height: 33, trail: '#ffcf8a99' },
      'primary-aurora': { cell: 4, color: '#8cfaff', width: 21, height: 46, trail: '#b7fbffcc' },
      'primary-arc': { cell: 2, color: '#b99aff', width: 18, height: 28, trail: '#d5bbff99' },
      'primary-blade': { cell: 2, color: '#73f0dd', width: 24, height: 28, trail: '#9dfff099' },
      'wing-pulse': { cell: 0, color: '#70ecff', width: 13, height: 21, trail: '#75f1ff88' },
      'wing-missile': { cell: 1, color: '#ff9a6a', width: 16, height: 27, trail: '#ffad8799' },
      'wing-rail': { cell: 4, color: '#b8faff', width: 14, height: 34, trail: '#c6fbffbb' },
      'wing-prism': { cell: 2, color: '#d093ff', width: 16, height: 22, trail: '#dfaaff99' },
      'wing-heal': { cell: 0, color: '#79f6bd', width: 14, height: 24, trail: '#9bffd099' },
      'wing-chain': { cell: 3, color: '#ffe071', width: 15, height: 24, trail: '#fff0a099' },
      'wing-burst': { cell: 1, color: '#ff80ae', width: 18, height: 27, trail: '#ffa1c299' }
    };
    const visual = projectileVisuals[entry.style] || projectileVisuals.dawn;
    if (entry.trail) { ctx.strokeStyle = visual.trail; ctx.lineWidth = entry.laser ? 4 : 2; ctx.beginPath(); ctx.moveTo(entry.x, entry.y + 12); ctx.lineTo(entry.x - entry.vx * 0.032, entry.y - entry.vy * 0.032 + 12); ctx.stroke(); }
    if (entry.from === 'p' && drawPlayerProjectile(ctx, entry, visual)) return;
    if (entry.from === 'e') {
      const enemyCell = entry.damage >= 14 ? 7 : entry.damage >= 12 ? 4 : entry.damage >= 10 ? 1 : 3;
      const enemySize = entry.damage >= 14 ? 29 : entry.damage >= 12 ? 25 : 21;
      if (drawEnemyVfx(ctx, enemyCell, entry.x, entry.y, enemySize, enemySize + 10, Math.atan2(entry.vy, entry.vx) - Math.PI / 2)) return;
    }
    // 圖集無法載入時仍維持長條、晶片或菱形備援，不退回圓點。
    ctx.save(); ctx.translate(entry.x, entry.y); ctx.rotate(Math.atan2(entry.vy, entry.vx) + Math.PI / 2); ctx.fillStyle = entry.from === 'p' ? visual.color : '#ff6e87';
    if (entry.laser) ctx.fillRect(-3, -16, 6, 32);
    else { ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(6, 7); ctx.lineTo(0, 11); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  });
  pickups.forEach((entry) => {
    const color = pickupColors[entry.type]; const pulse = 1 + Math.sin(entry.age * 6) * 0.12;
    ctx.save(); ctx.translate(entry.x, entry.y); ctx.scale(pulse, pulse); ctx.shadowBlur = 12; ctx.shadowColor = color;
    if (entry.type !== 'gold' && entry.type !== 'chest') {
      ctx.strokeStyle = `${color}aa`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 13 + Math.sin(entry.age * 5) * 2, entry.age * 1.8, entry.age * 1.8 + Math.PI * 1.35); ctx.stroke();
      ctx.fillStyle = `${color}bb`; ctx.beginPath(); ctx.arc(Math.cos(entry.age * 3) * 12, Math.sin(entry.age * 3) * 12, 2, 0, Math.PI * 2); ctx.fill();
    }
    // 核心補給使用獨立圖樣；臨時增益亦沿用不同色相的能量標記，避免與玩家彈幕混淆。
    if (drawRefinedPickup(ctx, entry.type, 0, 0, entry.type === 'gold' ? 28 : 38, entry.type === 'gold' ? 28 : 38, entry.age * 1.9)) { ctx.restore(); return; }
    const pickupArt = combatPickupCells[entry.type];
    if (drawCombatArt(ctx, pickupArt, 0, 0, 34, 34, entry.age * 1.9)) { ctx.restore(); return; }
    const pickupCells = { gold: 11, hp: 5, shield: 6, energy: 7, power: 8, magnet: 9, rage: 10, double: 11, pierce: 2, crit: 3, barrier: 6, rapid: 1 };
    if (pickupCells[entry.type] !== undefined && drawAiVfx(ctx, pickupCells[entry.type], 0, 0, 32, 32)) { ctx.restore(); return; }
    if (entry.type === 'chest') { ctx.fillStyle = '#a76429'; ctx.fillRect(-10, -7, 20, 15); ctx.fillStyle = '#ffcb61'; ctx.fillRect(-10, -10, 20, 5); ctx.fillStyle = '#fff2b0'; ctx.fillRect(-2, -7, 4, 15); ctx.restore(); return; }
    ctx.fillStyle = color; ctx.rotate(Math.PI / 4); ctx.fillRect(-8, -8, 16, 16); ctx.rotate(-Math.PI / 4);
    ctx.shadowBlur = 0; ctx.fillStyle = '#08111d'; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(pickupMarks[entry.type], 0, 1); ctx.restore();
  });
  if (state.messageTimer > 0 && state.message) {
    ctx.save(); ctx.globalAlpha = Math.min(1, state.messageTimer * 2); ctx.textAlign = 'center';
    ctx.font = '900 18px system-ui'; ctx.fillStyle = '#fff0a3'; ctx.shadowColor = '#ffbc55'; ctx.shadowBlur = 12;
    ctx.fillText(state.message, 180, 330); ctx.restore();
  }
  particles.forEach((entry) => { ctx.globalAlpha = Math.max(0, entry.life * 2); ctx.fillStyle = entry.color; ctx.fillRect(entry.x - entry.size / 2, entry.y - entry.size / 2, entry.size, entry.size); });
  ctx.globalAlpha = 1;
  ctx.restore();
}
