import { C } from './config.js';
import { player } from './entities/player.js';
import { enemy } from './entities/enemy.js';
import { makeBoss } from './entities/boss.js';
import { bullet } from './entities/bullet.js';
import { pickup } from './entities/pickup.js';
import { stage } from './data/stages.js';
import { render } from './renderer.js';

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// 使用單一 requestAnimationFrame 執行整場關卡，避免重複計時器。
export function game(canvas, saveData, controls, onEnd, onHud) {
  const ctx = canvas.getContext('2d');
  const state = {
    p: player(saveData),
    enemies: [], bullets: [], pickups: [], boss: null,
    stars: Array.from({ length: 50 }, () => ({ x: Math.random() * 360, y: Math.random() * 640, a: Math.random() })),
    wave: 0, left: 0, kind: 'scout', score: 0, combo: 0, maxCombo: 0,
    kills: 0, paused: false, over: false, last: 0
  };
  let animationFrame = 0;

  function finish(win) {
    if (state.over) return;
    state.over = true;
    cancelAnimationFrame(animationFrame);
    onEnd({
      win, score: state.score, kills: state.kills, combo: state.maxCombo,
      hp: state.p.hp, shield: state.p.shield, gold: Math.floor(state.score / 15)
    });
  }

  function spawnNextWave() {
    if (state.boss || state.enemies.length || state.left) return;
    const wave = stage.waves[state.wave++];
    if (!wave) {
      finish(true);
      return;
    }
    if (wave[0] === 'boss') {
      state.boss = makeBoss();
      return;
    }
    state.kind = wave[0];
    state.left = wave[1];
  }

  function firePlayer() {
    const p = state.p;
    if (p.fire > 0) return;
    p.fire = C.shot / (p.boost > 0 ? 1.8 : 1);
    state.bullets.push(
      bullet(p.x - 8, p.y - 16, 0, -430, 'p', p.atk),
      bullet(p.x + 8, p.y - 16, 0, -430, 'p', p.atk)
    );
  }

  function damagePlayer(amount) {
    const p = state.p;
    if (p.inv > 0 || state.over) return;
    p.inv = C.invincible;
    p.shield -= amount;
    if (p.shield < 0) {
      p.hp += p.shield;
      p.shield = 0;
    }
    state.combo = 0;
    if (p.hp <= 0) finish(false);
  }

  function defeat(target) {
    state.score += target.score || 60;
    state.combo += 1;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    state.kills += 1;
    state.p.energy = Math.min(100, state.p.energy + 8);
    if (Math.random() < 0.45) {
      const kinds = ['hp', 'shield', 'energy', 'fire', 'gold'];
      state.pickups.push(pickup(target.x, target.y, kinds[Math.floor(Math.random() * kinds.length)]));
    }
  }

  function ultimate() {
    if (state.p.energy < 100 || state.over) return;
    state.p.energy = 0;
    state.p.inv = 2;
    state.bullets = state.bullets.filter((entry) => entry.from === 'p');
    state.enemies.forEach((entry) => { entry.hp -= 180; });
    if (state.boss) state.boss.hp -= Math.min(400, state.boss.maxHp * 0.16);
  }

  function updatePlayer(dt) {
    const p = state.p;
    const speed = 260 * dt;
    if (controls.drag) {
      p.x += (controls.x - p.x) * Math.min(1, 12 * dt);
      p.y += (controls.y - 38 - p.y) * Math.min(1, 12 * dt);
    }
    if (controls.keys.arrowleft || controls.keys.a) p.x -= speed;
    if (controls.keys.arrowright || controls.keys.d) p.x += speed;
    if (controls.keys.arrowup || controls.keys.w) p.y -= speed;
    if (controls.keys.arrowdown || controls.keys.s) p.y += speed;
    p.x = Math.max(15, Math.min(345, p.x));
    p.y = Math.max(40, Math.min(610, p.y));
    p.inv -= dt;
    p.fire -= dt;
    p.boost -= dt;
    firePlayer();
  }

  function updateEnemies(dt, time) {
    if (state.left && state.enemies.length < 4) {
      state.enemies.push(enemy(state.kind, 35 + Math.random() * 290));
      state.left -= 1;
    }
    state.enemies.forEach((entry) => {
      entry.y += entry.speed * dt;
      entry.x += Math.sin(time / 400 + entry.phase) * 40 * dt;
      entry.fireCd -= dt;
      if (entry.fireCd < 0 && entry.fire) {
        entry.fireCd = entry.kind === 'elite' ? 0.55 : 1.2;
        [-0.25, 0, 0.25].forEach((spread) => state.bullets.push(bullet(entry.x, entry.y, 110 * spread, 160, 'e', 10)));
      }
      if (entry.y > 680) entry.hp = 0;
    });

    const boss = state.boss;
    if (!boss) return;
    boss.phase = boss.hp / boss.maxHp > 0.7 ? 1 : boss.hp / boss.maxHp > 0.35 ? 2 : 3;
    boss.x += boss.dir * (boss.phase === 3 ? 95 : 55) * dt;
    if (boss.x < 55 || boss.x > 305) boss.dir *= -1;
    boss.fireCd -= dt;
    if (boss.fireCd < 0) {
      boss.fireCd = boss.phase === 1 ? 1.05 : boss.phase === 2 ? 0.65 : 0.38;
      const count = boss.phase === 1 ? 5 : boss.phase === 2 ? 9 : 11;
      for (let index = 0; index < count; index += 1) {
        const angle = Math.PI * (0.2 + index / (count - 1) * 0.6);
        state.bullets.push(bullet(boss.x, boss.y, Math.cos(angle) * 150, Math.sin(angle) * 150, 'e', boss.phase === 3 ? 13 : 10));
      }
    }
  }

  function updateProjectiles(dt) {
    state.bullets.forEach((entry) => {
      entry.x += entry.vx * dt;
      entry.y += entry.vy * dt;
      entry.life -= dt;
    });
    state.bullets = state.bullets.filter((entry) => entry.life > 0 && entry.y > -30 && entry.y < 680);
    state.bullets.filter((entry) => entry.from === 'p').forEach((entry) => {
      state.enemies.forEach((target) => {
        if (target.hp > 0 && distance(entry, target) < entry.r + target.r) {
          target.hp -= entry.damage;
          entry.life = 0;
          state.p.energy = Math.min(100, state.p.energy + 1);
        }
      });
      if (state.boss && distance(entry, state.boss) < entry.r + state.boss.r) {
        state.boss.hp -= entry.damage;
        entry.life = 0;
        state.p.energy = Math.min(100, state.p.energy + 1);
      }
    });
    state.bullets.filter((entry) => entry.from === 'e').forEach((entry) => {
      if (distance(entry, state.p) < entry.r + state.p.r) {
        damagePlayer(entry.damage);
        entry.life = 0;
      }
    });
  }

  function updatePickups(dt) {
    const p = state.p;
    state.pickups.forEach((entry) => {
      entry.y += entry.vy * dt;
      if (distance(entry, p) >= 35) return;
      if (entry.type === 'hp') p.hp = Math.min(p.maxHp, p.hp + 28);
      if (entry.type === 'shield') p.shield = Math.min(p.maxShield, p.shield + 25);
      if (entry.type === 'energy') p.energy = Math.min(100, p.energy + 30);
      if (entry.type === 'fire') p.boost = 6;
      if (entry.type === 'gold') state.score += 100;
      entry.y = 700;
    });
    state.pickups = state.pickups.filter((entry) => entry.y < 670);
  }

  function resolveDefeats() {
    state.enemies.filter((entry) => entry.hp <= 0).forEach(defeat);
    state.enemies = state.enemies.filter((entry) => entry.hp > 0);
    if (state.boss && state.boss.hp <= 0) {
      defeat(state.boss);
      state.boss = null;
      state.left = 0;
    }
  }

  function frame(time) {
    const dt = Math.min(0.033, (time - state.last || 0) / 1000);
    state.last = time;
    if (!state.paused && !state.over) {
      updatePlayer(dt);
      state.stars.forEach((star) => { star.y = star.y > 640 ? 0 : star.y + 35 * dt; });
      updateEnemies(dt, time);
      updateProjectiles(dt);
      resolveDefeats();
      updatePickups(dt);
      spawnNextWave();
      onHud(state);
    }
    render(ctx, state);
    if (!state.over) animationFrame = requestAnimationFrame(frame);
  }

  animationFrame = requestAnimationFrame(frame);
  return {
    pause: () => { state.paused = !state.paused; },
    ultimate,
    retry: () => { cancelAnimationFrame(animationFrame); return game(canvas, saveData, controls, onEnd, onHud); },
    stop: () => cancelAnimationFrame(animationFrame)
  };
}
