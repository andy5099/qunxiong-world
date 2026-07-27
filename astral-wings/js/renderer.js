const pickupColors = { gold: '#ffd568', power: '#ff9b38', hp: '#70ff9c', shield: '#62dfff', energy: '#bb79ff', magnet: '#ffe66b', rage: '#ff5871', double: '#ffd26d', pierce: '#f6a5ff', crit: '#ffdf66', barrier: '#9cefff', rapid: '#ff9c5d' };
const pickupMarks = { gold: '$', power: 'P', hp: '+', shield: 'S', energy: 'E', magnet: 'M', rage: 'R', double: '2', pierce: 'I', crit: 'C', barrier: 'B', rapid: 'H' };

// 原創 AI 機體圖集。圖尚未完成載入時，會無縫退回原本的 Canvas 幾何造型。
const aiCraftRoster = document.querySelector('#ai-craft-roster') || new Image();
aiCraftRoster.decoding = 'async';
if (!aiCraftRoster.src) aiCraftRoster.src = new URL('../assets/images/astral-ai-craft-sprites.png', import.meta.url).href;
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

// 原創幾何輪廓讓敵機在手機小畫面上仍可一眼辨識職能。
function drawEnemy(ctx, entry, triangle) {
  const aiCells = { scout: 2, sprinter: 2, armor: 3, sniper: 2, bomber: 3, shield: 4, support: 5, elite: 1 };
  if (aiCells[entry.kind] !== undefined && drawAiCraft(ctx, aiCells[entry.kind], entry.x, entry.y, entry.kind === 'elite' ? 150 : 110, entry.kind === 'elite' ? 150 : 110, 0.92)) {
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
    if (drawAiCraft(ctx, 0, p.x, p.y, 150, 175, 0.96)) {
      // AI 戰機已繪製，仍保留尾焰讓移動與無敵狀態具有清楚辨識。
      ctx.save(); ctx.fillStyle = '#ffb553'; ctx.shadowBlur = 12; ctx.shadowColor = '#ff9a4c'; ctx.fillRect(p.x - 9, p.y + 27, 5, 9); ctx.fillRect(p.x + 4, p.y + 27, 5, 9); ctx.restore();
    } else {
    ctx.save(); ctx.translate(p.x, p.y); ctx.shadowBlur = 14; ctx.shadowColor = '#4ee9ff';
    ctx.fillStyle = '#254f78'; ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(-15, 16); ctx.lineTo(0, 11); ctx.lineTo(15, 16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8ff3ff'; ctx.beginPath(); ctx.moveTo(0, -19); ctx.lineTo(-6, 8); ctx.lineTo(0, 13); ctx.lineTo(6, 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f3feff'; ctx.fillRect(-2, -14, 4, 18); ctx.fillStyle = '#ffb553'; ctx.fillRect(-9, 15, 5, 8); ctx.fillRect(4, 15, 5, 8); ctx.restore();
    }
  }
  enemies.forEach((entry) => drawEnemy(ctx, entry, triangle));
  if (boss) {
    if (!drawAiCraft(ctx, 1, boss.x, boss.y, 300, 255, 0.95)) { ctx.save();
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
  }
  bullets.forEach((entry) => {
    if (entry.trail) { ctx.strokeStyle = entry.laser ? '#cfffff99' : '#ffde8299'; ctx.lineWidth = entry.laser ? 4 : 2; ctx.beginPath(); ctx.moveTo(entry.x, entry.y + 12); ctx.lineTo(entry.x - entry.vx * 0.025, entry.y - entry.vy * 0.025 + 12); ctx.stroke(); }
    ctx.fillStyle = entry.from === 'p' ? (entry.laser ? '#dfffff' : '#fff4a0') : '#ff6e87';
    ctx.beginPath(); ctx.arc(entry.x, entry.y, entry.laser ? 5 : entry.r, 0, Math.PI * 2); ctx.fill();
  });
  pickups.forEach((entry) => {
    const color = pickupColors[entry.type]; const pulse = 1 + Math.sin(entry.age * 6) * 0.12;
    ctx.save(); ctx.translate(entry.x, entry.y); ctx.scale(pulse, pulse); ctx.shadowBlur = 12; ctx.shadowColor = color;
    ctx.fillStyle = color; ctx.rotate(Math.PI / 4); ctx.fillRect(-8, -8, 16, 16); ctx.rotate(-Math.PI / 4);
    ctx.shadowBlur = 0; ctx.fillStyle = '#08111d'; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(pickupMarks[entry.type], 0, 1); ctx.restore();
  });
  particles.forEach((entry) => { ctx.globalAlpha = Math.max(0, entry.life * 2); ctx.fillStyle = entry.color; ctx.fillRect(entry.x - entry.size / 2, entry.y - entry.size / 2, entry.size, entry.size); });
  ctx.globalAlpha = 1;
  if (state.messageTimer > 0 || state.bossEntrance > 0) {
    ctx.fillStyle = state.bossEntrance > 0 ? '#ff5f7a' : '#fff2a3';
    ctx.font = 'bold 19px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(state.message, 180, 300);
  }
  ctx.restore();
}
