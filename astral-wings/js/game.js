import { C } from './config.js';
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
export function game(canvas, saveData, controls, onEnd, onHud) {
  const ctx = canvas.getContext('2d');
  const state = {
    p: player(saveData), enemies: [], bullets: [], pickups: [], particles: [], boss: null,
    stars: Array.from({ length: 50 }, () => ({ x: Math.random() * 360, y: Math.random() * 640, a: Math.random() })),
    wave: 0, left: 0, kind: 'scout', nextId: 1, score: 0, gold: 0, combo: 0, maxCombo: 0,
    kills: 0, paused: false, over: false, last: 0, hitStop: 0, shake: 0, bossEntrance: 0, victoryTimer: 0, message: ''
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
    onEnd({ win, score: state.score, kills: state.kills, combo: state.maxCombo, hp: state.p.hp, shield: state.p.shield, gold: state.gold });
  }

  function spawnNextWave() {
    if (state.boss || state.enemies.length || state.left || state.bossEntrance > 0 || state.victoryTimer > 0) return;
    const wave = stage.waves[state.wave++];
    if (!wave) return finish(true);
    if (wave[0] === 'boss') {
      state.bossEntrance = 2.2;
      state.message = '警告：鐵幕吞噬者接近中';
      return;
    }
    state.kind = wave[0];
    state.left = wave[1];
  }

  function emitPlayerShot(xOffset, angle, speed, pierce = 0, laser = false) {
    const p = state.p;
    const entry = bullet(p.x + xOffset, p.y - 18, Math.sin(angle) * speed, -Math.cos(angle) * speed, 'p', p.atk, pierce);
    entry.laser = laser;
    entry.trail = p.fireLevel >= 5 || p.rage > 0;
    state.bullets.push(entry);
  }

  function firePlayer() {
    const p = state.p;
    if (p.fire > 0) return;
    const rapid = p.rage > 0 ? 1.5 : 1;
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
    if (p.inv > 0 || state.over) return;
    p.inv = C.invincible;
    p.shield -= amount;
    if (p.shield < 0) { p.hp += p.shield; p.shield = 0; }
    state.combo = 0;
    state.shake = Math.max(state.shake, 6);
    spawnParticle(p.x, p.y, '#ff648a', 11, 3);
    if (p.hp <= 0) {
      // 火力與所有單局 Buff 在死亡瞬間清除；永久金幣仍在結算時保存。
      p.fireLevel = 1; p.magnet = 0; p.rage = 0; p.doubleGold = 0;
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
    roll(0.1, 'energy'); roll(0.04, 'magnet'); roll(0.03, 'rage'); roll(0.02, 'double');
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
    p.inv -= dt; p.fire -= dt; p.magnet = Math.max(0, p.magnet - dt); p.rage = Math.max(0, p.rage - dt); p.doubleGold = Math.max(0, p.doubleGold - dt);
    firePlayer();
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
      entry.y += entry.speed * dt; entry.x += Math.sin(time / 400 + entry.phase) * 40 * dt; entry.fireCd -= dt;
      if (entry.fireCd < 0 && entry.fire) {
        entry.fireCd = entry.kind === 'elite' ? 0.55 : 1.2;
        [-0.25, 0, 0.25].forEach((spread) => state.bullets.push(bullet(entry.x, entry.y, 110 * spread, 160, 'e', 10)));
      }
      if (entry.y > 680) entry.hp = 0;
    });
    const boss = state.boss;
    if (!boss) return;
    boss.phase = boss.hp / boss.maxHp > 0.7 ? 1 : boss.hp / boss.maxHp > 0.35 ? 2 : 3;
    boss.x += boss.dir * (boss.phase === 3 ? 108 : 60) * dt;
    if (boss.x < 55 || boss.x > 305) boss.dir *= -1;
    boss.fireCd -= dt; boss.summonCd -= dt; boss.laserWarn -= dt; boss.laserActive -= dt;
    if (boss.fireCd < 0) fireBoss(boss);
    if (boss.phase === 3 && boss.summonCd < 0) {
      boss.summonCd = 3.4;
      spawnEnemy('scout', Math.max(25, boss.x - 55)); spawnEnemy('scout', Math.min(335, boss.x + 55));
    }
    if (boss.laserWarn <= 0 && boss.laserActive <= 0 && boss.phase === 3) boss.laserActive = 0.32;
    if (boss.laserActive > 0 && Math.abs(state.p.x - boss.x) < state.p.r + 13) damagePlayer(20 * dt * 6);
  }

  function hitTarget(entry, target) {
    if (entry.hit.has(target.id)) return;
    if (distance(entry, target) >= entry.r + target.r) return;
    entry.hit.add(target.id); target.hp -= entry.damage; state.p.energy = Math.min(100, state.p.energy + 1);
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
      const defeated = state.boss; defeated.isBoss = true; defeat(defeated); state.boss = null; state.left = 0; state.victoryTimer = 1.1; state.message = '鐵幕吞噬者已瓦解';
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
      if (state.hitStop > 0) state.hitStop -= dt;
      else {
        if (state.victoryTimer > 0) {
          state.victoryTimer -= dt;
          if (state.victoryTimer <= 0) finish(true);
        } else if (state.bossEntrance > 0) {
          state.bossEntrance -= dt;
          if (state.bossEntrance <= 0) { state.boss = makeBoss(); state.boss.id = 'boss'; state.message = ''; state.shake = 7; }
        } else {
          updatePlayer(dt); updateEnemies(dt, time); updateProjectiles(dt); resolveDefeats(); updatePickups(dt); spawnNextWave();
        }
        state.stars.forEach((star) => { star.y = star.y > 640 ? 0 : star.y + 35 * dt; });
      }
      updateParticles(dt); state.shake = Math.max(0, state.shake - dt * 18); onHud(state);
    }
    render(ctx, state);
    if (!state.over) animationFrame = requestAnimationFrame(frame);
  }

  animationFrame = requestAnimationFrame(frame);
  return { pause: () => { state.paused = !state.paused; }, ultimate, stop: () => cancelAnimationFrame(animationFrame) };
}
