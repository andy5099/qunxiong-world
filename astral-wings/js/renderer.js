const pickupColors = { gold: '#ffd568', power: '#ff9b38', hp: '#70ff9c', shield: '#62dfff', energy: '#bb79ff', magnet: '#ffe66b', rage: '#ff5871', double: '#ffd26d' };
const pickupMarks = { gold: '$', power: 'P', hp: '+', shield: 'S', energy: 'E', magnet: 'M', rage: 'R', double: '2' };

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
    triangle(p, '#74e8ff', true);
    ctx.fillStyle = '#d8ffff'; ctx.fillRect(p.x - 3, p.y - 8, 6, 16);
  }
  enemies.forEach((entry) => {
    triangle(entry, entry.color);
    if (entry.shield > 0) { ctx.strokeStyle = '#78cfff'; ctx.globalAlpha = 0.65; ctx.beginPath(); ctx.arc(entry.x, entry.y, entry.r + 4, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
  });
  if (boss) {
    ctx.save();
    ctx.shadowBlur = 18; ctx.shadowColor = boss.phase === 3 ? '#ff355f' : '#f98aaf';
    ctx.fillStyle = boss.color; ctx.fillRect(boss.x - 45, boss.y - 26, 90, 52);
    triangle({ x: boss.x, y: boss.y - 35, r: 25 }, '#ff91a7', true);
    ctx.restore();
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
