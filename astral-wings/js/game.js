import { C, balanceConfig } from './config.js';
import { player } from './entities/player.js';
import { enemy } from './entities/enemy.js';
import { makeBoss } from './entities/boss.js';
import { bullet } from './entities/bullet.js';
import { pickup } from './entities/pickup.js';
import { stage } from './data/stages.js';
import { render } from './renderer.js';

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const pickupTypes = ['gold', 'power', 'hp', 'shield', 'energy', 'magnet', 'rage', 'double'];

// v0.2 的單局戰鬥狀態：火力與增益只活在這一場，不會污染永久存檔。
export function game(canvas, saveData, controls, onEnd, onHud, mode = 'stage') {
  const ctx = canvas.getContext('2d');
  const state = {
    p: player(saveData), enemies: [], bullets: [], pickups: [], particles: [], boss: null,
    stars: Array.from({ length: 50 }, () => ({ x: Math.random() * 360, y: Math.random() * 640, a: Math.random(), speed: 18 + Math.random() * 42 })),
    nebulae: Array.from({ length: 4 }, () => ({ x: Math.random() * 440 - 40, y: Math.random() * 720 - 40, r: 65 + Math.random() * 85, speed: 5 + Math.random() * 8, color: Math.random() > 0.5 ? '#243f7655' : '#542d6a44' })),
    debris: Array.from({ length: 8 }, () => ({ x: Math.random() * 360, y: Math.random() * 640, r: 2 + Math.random() * 5, speed: 45 + Math.random() * 55, spin: Math.random() * 6 })),
    mode, wave: 0, left: 0, kind: 'scout', nextId: 1, score: 0, gold: 0, combo: 0, maxCombo: 0,
    kills: 0, paused: false, over: false, last: 0, hitStop: 0, shake: 0,
    bossEntrance: 0, supplyTimer: 0, victoryTimer: 0, message: '', messageTimer: 0, secondaryTimer: 0
  };
  let animationFrame = 0;

  function spawnParticle(x, y, color, count = 7, size = 3) {
    for (let index = 0; index < count && state.particles.length < 90; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 35 + Math.random() * 120;
      state.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, color, life: 0.28 + Math.random() * 0.35, size });
    }
  }

  function addPickup(x, y, type, value = 1) {
    if (state.pickups.length < 35) state.pickups.push(pickup(x, y, type, value));
  }

  function finish(win) {
    if (state.over) return;
    state.over = true;
    cancelAnimationFrame(animationFrame);
    onEnd({ win, mode, wave: state.wave, score: state.score, kills: state.kills, combo: state.maxCombo, hp: state.p.hp, shield: state.p.shield, gold: state.gold });
  }

  function announce(message, seconds = 1.3) {
    state.message = message;
    state.messageTimer = seconds;
  }

  function spawnNextWave() {
    if (state.boss || state.enemies.length || state.left || state.bossEntrance > 0 || state.supplyTimer > 0 || state.victoryTimer > 0) return;
    const wave = getNextWave();
    if (!wave) return finish(true);
    if (wave[0] === 'boss') {
      state.bossEntrance = 2.2;
      announce('警告：鐵幕吞噬者接近中', 2.2);
      return;
    }
    if (wave[0] === 'supply') {
      ['power', 'energy', Math.random() < 0.5 ? 'hp' : 'shield', 'gold', 'gold'].forEach((type, index) => addPickup(112 + index * 34, 170, type));
      state.supplyTimer = 1.8;
      announce('補給艙已開啟', 1.8);
      return;
    }
    state.kind = wave[0];
    state.left = wave[1];
  }

  function getNextWave() {
    if (mode === 'boss') return state.wave++ === 0 ? ['supply', 1] : state.wave === 2 ? ['boss', 1] : null;
    if (mode !== 'endless') return stage.waves[state.wave++];
    const index = state.wave++;
    if (index > 0 && index % 8 === 7) return ['boss', 1];
    const types = ['scout', 'sprinter', 'armor', 'sniper', 'bomber', 'shield', 'support'];
    const kind = index % 3 === 2 ? 'elite' : types[index % types.length];
    return [kind, Math.min(6, 3 + Math.floor(index / 3))];
  }

  function emitPlayerShot(xOffset, angle, speed, pierce = 0, laser = false) {
    const p = state.p;
    const damage = p.atk * (1 + (p.fireLevel - 1) * 0.18);
    const entry = bullet(p.x + xOffset, p.y - 18, Math.sin(angle) * speed, -Math.cos(angle) * speed, 'p', damage, pierce + (p.pierceBuff > 0 ? 1 : 0));
    if (p.crit > 0 && Math.random() < 0.25) { entry.damage *= 1.65; entry.critical = true; }
    entry.laser = laser;
    entry.trail = p.fireLevel >= 5 || p.rage > 0;
    state.bullets.push(entry);
  }

  function firePlayer() {
    const p = state.p;
    if (p.fire > 0) return;
    const rapid = (p.rage > 0 ? 1.5 : 1) * (p.rapid > 0 ? 1.55 : 1);
    const level = p.fireLevel;
    const speed = (level >= 5 ? 540 : level >= 4 ? 510 : 455) * (p.rage > 0 ? 1.3 : 1);
    p.fire = C.shot / rapid;
    if (level === 1) [-8, 8].forEach((offset) => emitPlayerShot(offset, 0, speed));
    if (level === 2) [-12, 0, 12].forEach((offset) => emitPlayerShot(offset, 0, speed));
    if (level === 3 || level === 4) [-0.22, -0.11, 0, 0.11, 0.22].forEach((angle) => emitPlayerShot(0, angle, speed, level === 4 ? 1 : 0));
    if (level === 5) {
      [-0.31, -0.21, -0.11, 0, 0.11, 0.21, 0.31].forEach((angle) => emitPlayerShot(0, angle, speed, 1));
      emitPlayerShot(0, 0, 650 * (p.rage > 0 ? 1.3 : 1), 2, true);
    }
  }

  function damagePlayer(amount) {
    const p = state.p;
    if (p.barrier > 0) { p.barrier = 0; p.inv = 0.45; spawnParticle(p.x, p.y, '#82e8ff', 16, 3); return; }
    if (p.inv > 0 || state.over) return;
    p.inv = C.invincible;
    p.shield -= amount;
    if (p.shield < 0) { p.hp += p.shield; p.shield = 0; }
    state.combo = 0;
    state.shake = Math.max(state.shake, 6);
    spawnParticle(p.x, p.y, '#ff648a', 11, 3);
    // 只清除核心周圍的危險彈，避免受傷後被同一團彈幕連續鎖死。
    state.bullets = state.bullets.filter(entry => entry.from === 'p' || distance(entry, p) > 54);
    if (p.hp <= 0) {
      // 火力與所有單局 Buff 在死亡瞬間清除；永久金幣仍在結算時保存。
      p.fireLevel = 1; p.magnet = 0; p.rage = 0; p.doubleGold = 0; p.pierceBuff = 0; p.crit = 0; p.barrier = 0; p.rapid = 0;
      finish(false);
    }
  }

  function dropForEnemy(target) {
    const roll = (chance, type) => { if (Math.random() < chance) addPickup(target.x, target.y, type); };
    if (target.kind === 'elite') {
      const guaranteed = ['gold', 'power', 'energy', 'shield', 'hp'];
      for (let index = 0; index < 2; index += 1) addPickup(target.x + (index ? 12 : -12), target.y, guaranteed[Math.floor(Math.random() * guaranteed.length)]);
      roll(0.4, 'power'); roll(0.18, 'magnet'); roll(0.14, 'rage');
      return;
    }
    roll(0.8, 'gold'); roll(0.15, 'power'); roll(0.06, 'hp'); roll(0.08, 'shield');
    roll(0.1, 'energy'); roll(0.04, 'magnet'); roll(0.03, 'rage'); roll(0.02, 'double'); roll(0.025, 'pierce'); roll(0.02, 'crit'); roll(0.02, 'barrier'); roll(0.025, 'rapid');
  }

  function dropBoss(target) {
    // Boss 必掉火力、金幣與星能，並在 HP／護盾中擇一；額外金幣營造大量掉寶感。
    ['power', 'energy', Math.random() < 0.5 ? 'hp' : 'shield'].forEach((type, index) => addPickup(target.x + (index - 1) * 18, target.y, type));
    for (let index = 0; index < 10; index += 1) addPickup(target.x + (Math.random() - 0.5) * 80, target.y + (Math.random() - 0.5) * 35, 'gold', 2);
  }

  function defeat(target) {
    state.score += target.score || 60;
    state.combo += 1;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    state.kills += 1;
    state.p.energy = Math.min(100, state.p.energy + 6);
    state.hitStop = target.kind === 'elite' || target.isBoss ? 0.045 : 0.018;
    state.shake = Math.max(state.shake, target.isBoss ? 11 : 2);
    spawnParticle(target.x, target.y, target.color || '#ffb56e', target.isBoss ? 42 : 10, target.isBoss ? 5 : 2);
    if (target.isBoss) dropBoss(target); else dropForEnemy(target);
  }

  function ultimate() {
    if (state.p.energy < 100 || state.over) return;
    state.p.energy = 0;
    state.p.inv = 2;
    state.shake = 9;
    spawnParticle(state.p.x, state.p.y, '#b688ff', 38, 4);
    state.bullets = state.bullets.filter((entry) => entry.from === 'p');
    state.enemies.forEach((entry) => { entry.hp -= 180; });
    if (state.boss) state.boss.hp -= Math.min(400, state.boss.maxHp * 0.16);
  }

  function updatePlayer(dt) {
    const p = state.p;
    const speed = 275 * dt;
    if (controls.drag) {
      // 指標控制使用緩動，手指與滑鼠都更平順、不會因瞬移而穿越彈幕。
      p.x += (controls.x - p.x) * Math.min(1, 14 * dt);
      p.y += (controls.y - 38 - p.y) * Math.min(1, 14 * dt);
    }
    if (controls.keys.arrowleft || controls.keys.a) p.x -= speed;
    if (controls.keys.arrowright || controls.keys.d) p.x += speed;
    if (controls.keys.arrowup || controls.keys.w) p.y -= speed;
    if (controls.keys.arrowdown || controls.keys.s) p.y += speed;
    p.x = Math.max(15, Math.min(345, p.x)); p.y = Math.max(40, Math.min(610, p.y));
    p.inv -= dt; p.fire -= dt; p.magnet = Math.max(0, p.magnet - dt); p.rage = Math.max(0, p.rage - dt); p.doubleGold = Math.max(0, p.doubleGold - dt); p.pierceBuff = Math.max(0, p.pierceBuff - dt); p.crit = Math.max(0, p.crit - dt); p.rapid = Math.max(0, p.rapid - dt);
    p.secondaryTimer -= dt;
    firePlayer();
    fireSecondary(p);
  }

  function fireSecondary(p) {
    const secondary = saveData.equipped?.secondary;
    if (!secondary || p.secondaryTimer > 0) return;
    if (secondary === 's1') {
      const target = state.boss || state.enemies.reduce((best, item) => !best || distance(item, p) < distance(best, p) ? item : best, null);
      if (target) { const aim = Math.atan2(target.y - p.y, target.x - p.x); state.bullets.push(bullet(p.x, p.y - 14, Math.cos(aim) * 285, Math.sin(aim) * 285, 'p', p.atk * 2.1, 0)); }
      p.secondaryTimer = 2.1;
    } else if (secondary === 's2') {
      const beam = bullet(p.x, p.y - 20, 0, -610, 'p', p.atk * 1.65, 3, true); beam.laser = true; beam.trail = true; state.bullets.push(beam); p.secondaryTimer = 2.5;
    } else if (secondary === 's3') {
      [-22, 22].forEach(offset => state.bullets.push(bullet(p.x + offset, p.y - 9, 0, -360, 'p', p.atk * 0.6))); p.secondaryTimer = 0.62;
    } else if (secondary === 's4') {
      [-0.18, 0.18].forEach(angle => state.bullets.push(bullet(p.x, p.y - 18, Math.sin(angle) * 330, -Math.cos(angle) * 330, 'p', p.atk * 0.8, 1))); p.secondaryTimer = 1.15;
    }
  }

  function spawnEnemy(kind, x) {
    const entry = enemy(kind, x);
    entry.id = state.nextId++;
    state.enemies.push(entry);
  }

  function fireBoss(boss) {
    const phase = boss.phase;
    boss.fireCd = phase === 1 ? 1.0 : phase === 2 ? 0.62 : 0.42;
    if (phase === 1) {
      [-0.32, -0.16, 0, 0.16, 0.32].forEach((spread) => state.bullets.push(bullet(boss.x, boss.y, spread * 270, 175, 'e', 10)));
    } else if (phase === 2) {
      [-0.45, -0.28, -0.12, 0.12, 0.28, 0.45].forEach((spread) => state.bullets.push(bullet(boss.x, boss.y, spread * 300, 190, 'e', 12)));
      [-1, 1].forEach((side) => state.bullets.push(bullet(boss.x + side * 34, boss.y, side * 95, 220, 'e', 12)));
    } else {
      [-0.55, -0.36, -0.18, 0, 0.18, 0.36, 0.55].forEach((spread) => state.bullets.push(bullet(boss.x, boss.y, spread * 320, 210, 'e', 14)));
      if (boss.laserWarn <= 0 && boss.laserActive <= 0) boss.laserWarn = 0.75;
    }
  }

  function updateEnemies(dt, time) {
    if (state.left && state.enemies.length < 4) { spawnEnemy(state.kind, 35 + Math.random() * 290); state.left -= 1; }
    state.enemies.forEach((entry) => {
      entry.age += dt; entry.fireCd -= dt;
      if (entry.pattern === 'dash') { entry.y += entry.speed * dt; entry.x += Math.sin(entry.age * 8 + entry.phase) * 105 * dt; }
      if (entry.pattern === 'drift') { entry.y += entry.speed * dt; entry.x += Math.sin(entry.age * 2 + entry.phase) * 38 * dt; }
      if (entry.pattern === 'heavy') { entry.y = Math.min(entry.lockedY, entry.y + entry.speed * dt); entry.x += Math.sin(entry.age + entry.phase) * 16 * dt; }
      if (entry.pattern === 'hold') { entry.y = Math.min(entry.lockedY, entry.y + entry.speed * dt); }
      if (entry.pattern === 'suicide') { entry.y += entry.speed * dt; entry.x += Math.sign(state.p.x - entry.x) * 38 * dt; }
      if (entry.pattern === 'orbit') { entry.y = Math.min(entry.lockedY, entry.y + entry.speed * dt); entry.x += Math.sin(entry.age * 2.4 + entry.phase) * 62 * dt; }
      if (entry.pattern === 'sweep') { entry.y = Math.min(entry.lockedY, entry.y + entry.speed * dt); entry.x += Math.cos(entry.age * 2 + entry.phase) * 68 * dt; }
      entry.x = Math.max(18, Math.min(342, entry.x));
      if (entry.fireCd <= 0 && entry.attack !== 'none') fireEnemy(entry);
      if (entry.pattern === 'suicide' && distance(entry, state.p) < entry.r + state.p.r + 8) { damagePlayer(22); entry.hp = 0; }
      if (entry.y > 680) entry.hp = 0;
    });
    const boss = state.boss;
    if (!boss) return;
    const ratio = boss.hp / boss.maxHp;
    const nextPhase = ratio > balanceConfig.boss.phaseTwo ? 1 : ratio > balanceConfig.boss.phaseThree ? 2 : 3;
    if (boss.phase !== nextPhase) {
      boss.phase = nextPhase; boss.rest = 1.0; boss.sequence = 0;
      state.shake = 5; announce(`鐵幕吞噬者・第 ${nextPhase} 階段`, 1.15);
      spawnParticle(boss.x, boss.y, nextPhase === 3 ? '#ff476d' : '#ffb0be', 20, 4);
    }
    boss.x += boss.dir * (boss.phase === 3 ? 72 : 48) * dt;
    if (boss.x < 62 || boss.x > 298) boss.dir *= -1;
    boss.rest -= dt; boss.telegraph -= dt; boss.laserWarn -= dt; boss.laserActive -= dt; boss.volley -= dt; boss.summonCd -= dt;
    if (boss.telegraph > 0) return;
    if (boss.pendingAimed) {
      boss.pendingAimed = false;
      for (let index = 0; index < 3; index += 1) state.bullets.push(bullet(boss.x, boss.y, Math.cos(boss.pendingAim) * balanceConfig.boss.aimedSpeed, Math.sin(boss.pendingAim) * balanceConfig.boss.aimedSpeed, 'e', 11));
      return;
    }
    if (boss.pendingLaser) { boss.pendingLaser = false; boss.laserActive = balanceConfig.boss.laserDuration; return; }
    if (boss.laserActive > 0) {
      if (Math.abs(state.p.x - boss.x) < state.p.r + 10) damagePlayer(14 * dt * 5);
      return;
    }
    if (boss.rest > 0) return;
    runBossPattern(boss);
  }

  function runBossPattern(boss) {
    // 每輪只執行一種主攻擊，結束後固定喘息，避免攻擊模式疊加成無解。
    const phasePatterns = boss.phase === 1 ? ['fan', 'lanes'] : boss.phase === 2 ? ['ring', 'aimed'] : ['laser', 'rageFan', 'summon'];
    boss.attack = phasePatterns[boss.sequence++ % phasePatterns.length];
    if (boss.attack === 'fan') {
      [-0.42, -0.21, 0, 0.21, 0.42].forEach(spread => state.bullets.push(bullet(boss.x, boss.y, spread * 150, balanceConfig.boss.fanSpeed, 'e', 9)));
      boss.rest = 1.0;
    } else if (boss.attack === 'lanes') {
      // 左右交替直線彈，中央保留可讀通道。
      const side = boss.sequence % 2 ? -1 : 1;
      [-1, 1].forEach(offset => state.bullets.push(bullet(boss.x + side * 26, boss.y, offset * 54, 148, 'e', 10)));
      boss.rest = 0.9;
    } else if (boss.attack === 'ring') {
      for (let index = 0; index < 8; index += 1) { const angle = Math.PI / 2 + index * Math.PI / 4 + 0.18; state.bullets.push(bullet(boss.x, boss.y, Math.cos(angle) * balanceConfig.boss.ringSpeed, Math.sin(angle) * balanceConfig.boss.ringSpeed, 'e', 10)); }
      boss.rest = 1.05;
    } else if (boss.attack === 'aimed') {
      boss.telegraph = 0.55; boss.pendingAimed = true; boss.rest = 1.3;
      boss.pendingAim = Math.atan2(state.p.y - boss.y, state.p.x - boss.x);
    } else if (boss.attack === 'laser') {
      boss.laserWarn = balanceConfig.boss.laserWarning; boss.telegraph = balanceConfig.boss.laserWarning; boss.pendingLaser = true; boss.rest = 1.55;
    } else if (boss.attack === 'rageFan') {
      [-0.5, -0.33, -0.16, 0, 0.16, 0.33, 0.5].forEach(spread => state.bullets.push(bullet(boss.x, boss.y, spread * 135, 150, 'e', 11)));
      boss.rest = 1.05;
    } else {
      spawnEnemy('scout', Math.max(35, boss.x - 54)); spawnEnemy('sprinter', Math.min(325, boss.x + 54));
      boss.rest = 1.2;
    }
  }

  function fireEnemy(entry) {
    const aimed = Math.atan2(state.p.y - entry.y, state.p.x - entry.x);
    if (entry.attack === 'needle') {
      entry.fireCd = 1.35;
      state.bullets.push(bullet(entry.x, entry.y, Math.cos(aimed) * 210, Math.sin(aimed) * 210, 'e', 8));
    }
    if (entry.attack === 'fan') {
      entry.fireCd = 1.45;
      [-0.22, 0, 0.22].forEach((spread) => state.bullets.push(bullet(entry.x, entry.y, Math.cos(aimed + spread) * 165, Math.sin(aimed + spread) * 165, 'e', 10)));
    }
    if (entry.attack === 'aim') {
      entry.fireCd = 1.7;
      state.bullets.push(bullet(entry.x, entry.y, Math.cos(aimed) * 265, Math.sin(aimed) * 265, 'e', 13));
    }
    if (entry.attack === 'burst') {
      entry.fireCd = 1.05;
      [-0.12, 0.12].forEach((spread) => state.bullets.push(bullet(entry.x, entry.y, Math.cos(aimed + spread) * 175, Math.sin(aimed + spread) * 175, 'e', 9)));
    }
    if (entry.attack === 'ring') {
      entry.fireCd = 1.65;
      for (let index = 0; index < 6; index += 1) { const angle = Math.PI / 2 + index * Math.PI / 3; state.bullets.push(bullet(entry.x, entry.y, Math.cos(angle) * 130, Math.sin(angle) * 130, 'e', 8)); }
    }
    if (entry.attack === 'elite') {
      entry.fireCd = 0.62;
      [-0.32, -0.16, 0, 0.16, 0.32].forEach((spread) => state.bullets.push(bullet(entry.x, entry.y, Math.sin(spread) * 180, Math.cos(spread) * 180, 'e', 11)));
    }
  }

  function hitTarget(entry, target) {
    if (entry.hit.has(target.id)) return;
    if (distance(entry, target) >= entry.r + target.r) return;
    entry.hit.add(target.id);
    if (target.shield > 0) target.shield = Math.max(0, target.shield - entry.damage);
    else target.hp -= entry.damage;
    state.p.energy = Math.min(100, state.p.energy + 1);
    state.hitStop = Math.max(state.hitStop, 0.009);
    spawnParticle(entry.x, entry.y, entry.laser ? '#d6ffff' : '#fff1a0', 3, 1.5);
    if (entry.pierce > 0) entry.pierce -= 1; else entry.life = 0;
  }

  function updateProjectiles(dt) {
    state.bullets.forEach((entry) => { entry.x += entry.vx * dt; entry.y += entry.vy * dt; entry.life -= dt; });
    state.bullets = state.bullets.filter((entry) => entry.life > 0 && entry.y > -35 && entry.y < 680 && entry.x > -35 && entry.x < 395);
    state.bullets.filter((entry) => entry.from === 'p').forEach((entry) => {
      state.enemies.forEach((target) => { if (target.hp > 0) hitTarget(entry, target); });
      if (state.boss) hitTarget(entry, state.boss);
    });
    state.bullets.filter((entry) => entry.from === 'e').forEach((entry) => {
      if (distance(entry, state.p) < entry.r + state.p.r) { damagePlayer(entry.damage); entry.life = 0; }
    });
  }

  function collect(entry) {
    const p = state.p;
    if (entry.type === 'gold') state.gold += (entry.value || 1) * (p.doubleGold > 0 ? 2 : 1);
    if (entry.type === 'power') p.fireLevel = Math.min(5, p.fireLevel + 1);
    if (entry.type === 'hp') p.hp = Math.min(p.maxHp, p.hp + 25);
    if (entry.type === 'shield') p.shield = Math.min(p.maxShield, p.shield + 30);
    if (entry.type === 'energy') p.energy = Math.min(100, p.energy + 25);
    if (entry.type === 'magnet') p.magnet = 10;
    if (entry.type === 'rage') p.rage = 8;
    if (entry.type === 'double') p.doubleGold = 20;
    if (entry.type === 'pierce') p.pierceBuff = Math.min(15, p.pierceBuff + balanceConfig.buffs.pierce);
    if (entry.type === 'crit') p.crit = Math.min(15, p.crit + balanceConfig.buffs.crit);
    if (entry.type === 'barrier') p.barrier = 1;
    if (entry.type === 'rapid') p.rapid = Math.min(12, p.rapid + balanceConfig.buffs.rapid);
    if (entry.type === 'power') announce(`火力提升：Lv${p.fireLevel}`, 0.85);
    if (entry.type === 'magnet') announce('磁力核心啟動', 0.85);
    if (entry.type === 'rage') announce('狂暴核心啟動', 0.85);
    if (entry.type === 'double') announce('雙倍金幣啟動', 0.85);
    state.shake = Math.max(state.shake, entry.type === 'power' ? 3 : 1);
    spawnParticle(entry.x, entry.y, '#fff2a2', entry.type === 'power' ? 15 : 6, 2);
    entry.collected = true;
  }

  function updatePickups(dt) {
    const p = state.p;
    state.pickups.forEach((entry) => {
      entry.age += dt; entry.y += entry.vy * dt; entry.x += Math.sin(entry.age * 4 + entry.drift) * 18 * dt;
      const range = p.magnet > 0 ? 150 : 42;
      const gap = distance(entry, p);
      if (gap < range) {
        const pull = p.magnet > 0 ? 500 : 255;
        entry.x += (p.x - entry.x) / Math.max(1, gap) * pull * dt;
        entry.y += (p.y - entry.y) / Math.max(1, gap) * pull * dt;
      }
      if (gap < p.r + entry.r + 4) collect(entry);
    });
    state.pickups = state.pickups.filter((entry) => !entry.collected && entry.y < 675);
  }

  function resolveDefeats() {
    state.enemies.filter((entry) => entry.hp <= 0).forEach(defeat);
    state.enemies = state.enemies.filter((entry) => entry.hp > 0);
    if (state.boss && state.boss.hp <= 0) {
      const defeated = state.boss; defeated.isBoss = true; defeat(defeated); state.boss = null; state.left = 0; state.victoryTimer = 1.1; announce('鐵幕吞噬者已瓦解', 1.1);
    }
  }

  function updateParticles(dt) {
    state.particles.forEach((entry) => { entry.x += entry.vx * dt; entry.y += entry.vy * dt; entry.vy += 70 * dt; entry.life -= dt; });
    state.particles = state.particles.filter((entry) => entry.life > 0);
  }

  function frame(time) {
    const dt = Math.min(0.033, (time - state.last || 0) / 1000);
    state.last = time;
    if (!state.paused && !state.over) {
      state.messageTimer = Math.max(0, state.messageTimer - dt);
      if (state.hitStop > 0) state.hitStop -= dt;
      else {
        if (state.victoryTimer > 0) {
          state.victoryTimer -= dt;
          if (state.victoryTimer <= 0 && mode !== 'endless') finish(true);
        } else if (state.supplyTimer > 0) {
          state.supplyTimer -= dt;
          updatePlayer(dt); updatePickups(dt);
        } else if (state.bossEntrance > 0) {
          state.bossEntrance -= dt;
          if (state.bossEntrance <= 0) { state.boss = makeBoss(); state.boss.id = 'boss'; state.shake = 7; announce('鐵幕吞噬者・第一階段', 1.1); }
        } else {
          updatePlayer(dt); updateEnemies(dt, time); updateProjectiles(dt); resolveDefeats(); updatePickups(dt); spawnNextWave();
        }
        state.stars.forEach((star) => { star.y = star.y > 640 ? 0 : star.y + star.speed * dt; });
        state.nebulae.forEach((cloud) => { cloud.y = cloud.y > 730 ? -cloud.r : cloud.y + cloud.speed * dt; });
        state.debris.forEach((piece) => { piece.y = piece.y > 660 ? -piece.r : piece.y + piece.speed * dt; piece.spin += dt * 1.5; });
      }
      updateParticles(dt); state.shake = Math.max(0, state.shake - dt * 18); onHud(state);
    }
    render(ctx, state);
    if (!state.over) animationFrame = requestAnimationFrame(frame);
  }

  animationFrame = requestAnimationFrame(frame);
  return { pause: () => { state.paused = !state.paused; }, ultimate, stop: () => cancelAnimationFrame(animationFrame) };
}
