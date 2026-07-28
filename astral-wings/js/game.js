import { C, balanceConfig } from './config.js?v=20260727-visual-12stage';
import { player } from './entities/player.js?v=20260727-visual-12stage';
import { enemy } from './entities/enemy.js?v=20260727-visual-12stage';
import { makeBoss } from './entities/boss.js?v=20260727-visual-12stage';
import { bullet } from './entities/bullet.js';
import { pickup } from './entities/pickup.js';
import { stage } from './data/stages.js?v=20260727-visual-12stage';
import { render } from './renderer.js?v=20260728-arcade-craft-bolts';
import { createFormation } from './systems/formationManager.js';

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const pickupTypes = ['gold', 'power', 'hp', 'shield', 'energy', 'magnet', 'rage', 'double', 'chest'];

// v0.2 的單局戰鬥狀態：火力與增益只活在這一場，不會污染永久存檔。
export function game(canvas, saveData, controls, onEnd, onHud, mode = 'stage', selectedStage = stage) {
  const ctx = canvas.getContext('2d');
  const state = {
    p: player(saveData), enemies: [], bullets: [], pickups: [], particles: [], boss: null,
    stars: Array.from({ length: 50 }, () => ({ x: Math.random() * 360, y: Math.random() * 640, a: Math.random(), speed: 18 + Math.random() * 42 })),
    nebulae: Array.from({ length: 4 }, () => ({ x: Math.random() * 440 - 40, y: Math.random() * 720 - 40, r: 65 + Math.random() * 85, speed: 5 + Math.random() * 8, color: Math.random() > 0.5 ? '#243f7655' : '#542d6a44' })),
    debris: Array.from({ length: 8 }, () => ({ x: Math.random() * 360, y: Math.random() * 640, r: 2 + Math.random() * 5, speed: 45 + Math.random() * 55, spin: Math.random() * 6 })),
    mode, stage: selectedStage, fusion: saveData.fusion || null, primary: saveData.equipped?.weapon || 'w1', secondary: saveData.equipped?.secondary || null, wingman: saveData.equipped?.engine || null, wave: 0, left: 0, kind: 'scout', nextId: 1, score: 0, gold: 0, combo: 0, maxCombo: 0,
    kills: 0, chests: 0, paused: false, over: false, last: 0, shake: 0,
    message: '', messageTimer: 0, secondaryTimer: 0, wingTimer: 0, elapsed: 0,
    formation: null, formationIndex: 0, upgradePulse: 0, timeScale: 1
  };
  let animationFrame = 0;

  // Centralized projectile budget prevents late-game bullet storms from growing
  // without bound on mobile devices. Player fire evicts only its oldest shots;
  // enemy fire is simply skipped so visual safety lanes remain intact.
  function addBullet(entry) {
    const isEnemy = entry.from === 'e';
    const limit = isEnemy ? balanceConfig.performance.maxEnemyBullets : balanceConfig.performance.maxPlayerBullets;
    let total = 0;
    for (const current of state.bullets) if ((current.from === 'e') === isEnemy) total += 1;
    if (total >= limit) {
      if (isEnemy) return false;
      const oldest = state.bullets.findIndex(current => current.from !== 'e');
      if (oldest >= 0) state.bullets.splice(oldest, 1);
    }
    state.bullets.push(entry);
    return true;
  }

  function spawnParticle(x, y, color, count = 7, size = 3) {
    for (let index = 0; index < count && state.particles.length < balanceConfig.performance.maxParticles; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 35 + Math.random() * 120;
      state.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, color, life: 0.28 + Math.random() * 0.35, size });
    }
  }

  function addPickup(x, y, type, value = 1) {
    if (state.pickups.length < balanceConfig.performance.maxPickups) state.pickups.push(pickup(x, y, type, value));
  }

  function finish(win) {
    if (state.over) return;
    state.over = true;
    cancelAnimationFrame(animationFrame);
    controls.destroy?.();
    onEnd({ win, mode, wave: state.wave, score: state.score, kills: state.kills, combo: state.maxCombo, hp: state.p.hp, shield: state.p.shield, gold: state.gold, chests: state.chests });
  }

  // 短暫提示只呈現關鍵事件，不會以彈窗或停頓打斷射擊。
  function announce(text, duration = 0.8) { state.message = text; state.messageTimer = duration; }

  function spawnNextWave() {
    if (state.boss || state.enemies.length || state.left) return;
    const wave = getNextWave();
    if (!wave) return finish(true);
    if (wave[0] === 'boss') {
      // Boss 直接進場，保留安全起手時間但不凍結玩家、子彈或背景。
      state.boss = makeBoss(state.stage.boss);
      state.boss.id = 'boss';
      // 後段關卡提高耐久與傷害；射速不會急遽增加，仍保留清楚的閃避空隙。
      const stageOrder = Math.max(0, state.stage?.order || 0);
      const bossScale = 1 + stageOrder * 0.16 + (mode === 'endless' ? Math.min(state.wave, 28) * 0.025 : 0);
      state.boss.hp = Math.round(state.boss.hp * bossScale);
      state.boss.maxHp = state.boss.hp;
      state.boss.damageScale = 1 + stageOrder * 0.1;
      state.shake = 7;
      return;
    }
    if (wave[0] === 'supply') {
      ['power', 'energy', Math.random() < 0.5 ? 'hp' : 'shield', 'gold', 'gold'].forEach((type, index) => addPickup(112 + index * 34, 170, type));
      return;
    }
    state.kind = wave[0];
    state.left = wave[1];
    // 固定波次配合隊形，不再讓同種敵機隨機散落進場。
    const forms = ['vee', 'column', 'row', 'cross', 'pincer', 'wave', 'spiral', 'pass'];
    state.formation = createFormation(forms[(state.wave + state.stage.order * 2) % forms.length], wave[1], state.elapsed);
    state.formationIndex = 0;
  }

  function getNextWave() {
    if (mode === 'boss') return state.wave++ === 0 ? ['supply', 1] : state.wave === 2 ? ['boss', 1] : null;
    if (mode !== 'endless') return state.stage.waves[state.wave++];
    const index = state.wave++;
    if (index > 0 && index % 8 === 7) return ['boss', 1];
    const types = ['scout', 'sprinter', 'armor', 'sniper', 'bomber', 'shield', 'support'];
    const kind = index % 3 === 2 ? 'elite' : types[index % types.length];
    return [kind, Math.min(6, 3 + Math.floor(index / 3))];
  }

  function emitPlayerShot(xOffset, angle, speed, pierce = 0, laser = false, multiplier = 1, style = 'dawn') {
    const p = state.p;
    const damage = p.atk * (1 + (p.fireLevel - 1) * 0.18) * multiplier;
    const entry = bullet(p.x + xOffset, p.y - 18, Math.sin(angle) * speed, -Math.cos(angle) * speed, 'p', damage, pierce + (p.pierceBuff > 0 ? 1 : 0));
    entry.style = style;
    // 部分機體使用蛇行、潮汐或螺旋軌跡；軌跡本身會隨 delta time 前進。
    if (style === 'violet' || style === 'tide' || style === 'helix') {
      entry.wave = style === 'tide' ? 54 : style === 'helix' ? 72 : 38;
      entry.waveRate = style === 'helix' ? 13 : style === 'tide' ? 7 : 10;
      entry.wavePhase = angle * 10;
    }
    if (p.crit > 0 && Math.random() < 0.25 + (p.critBase || 0)) { entry.damage *= 1.65; entry.critical = true; }
    entry.laser = laser;
    entry.trail = p.fireLevel >= 5 || p.rage > 0;
    addBullet(entry);
  }

  function firePlayer() {
    const p = state.p;
    if (p.fire > 0) return;
    const rapid = (p.rage > 0 ? 1.5 : 1) * (p.rapid > 0 ? 1.55 : 1);
    const level = p.fireLevel;
    const speed = (level >= 5 ? 540 : level >= 4 ? 510 : 455) * (p.rage > 0 ? 1.3 : 1);
    p.fire = C.shot / rapid;
    // 主武器在每個火力等級都有可見且不同的彈道，而不是只有數字加成。
    const count = level === 1 ? 2 : level === 2 ? 3 : level < 5 ? 5 : 7;
    const spread = count === 2 ? [-0.04, 0.04] : Array.from({ length: count }, (_, index) => (index - (count - 1) / 2) * (level >= 5 ? 0.105 : 0.075));
    const launch = (angle, shotSpeed = speed, pierce = 0, laser = false, multiplier = 1, style = 'dawn') => emitPlayerShot(0, angle, shotSpeed, pierce, laser, multiplier, style);
    if (state.primary === 'w2') spread.forEach(angle => launch(angle * 1.65, speed * 0.92, 0, false, 0.82, 'primary-star'));
    else if (state.primary === 'w3') [-0.025, 0.025].forEach(angle => launch(angle, speed * 1.18, level >= 3 ? 3 : 1, false, 1.16, 'primary-rail'));
    else if (state.primary === 'w4') {
      const rapidSpread = level >= 4 ? [-0.12, -0.04, 0.04, 0.12] : [-0.06, 0.06];
      rapidSpread.forEach(angle => launch(angle, speed * 1.24, 0, false, 0.55, 'primary-ember'));
    } else if (state.primary === 'w5') {
      launch(0, speed * 0.72, 0, false, 2.25, 'primary-burst');
      if (level >= 3) [-0.16, 0.16].forEach(angle => launch(angle, speed * 0.7, 0, false, 0.9, 'primary-burst'));
    } else if (state.primary === 'w6') {
      launch(0, 690, level >= 4 ? 4 : 2, true, 1.38, 'primary-aurora');
      if (level >= 5) [-0.08, 0.08].forEach(angle => launch(angle, 620, 1, true, 0.65, 'primary-aurora'));
    } else if (state.primary === 'w7') {
      spread.slice(0, Math.min(3, spread.length)).forEach(angle => launch(angle, speed, 1, false, 0.88, 'primary-arc'));
    } else if (state.primary === 'w8') {
      [-0.16, 0.16].forEach(angle => launch(angle, speed * 0.84, 2, false, 1.15, 'primary-blade'));
      if (level >= 4) launch(0, speed * 0.86, 3, false, 1.05, 'primary-blade');
    } else {
      spread.forEach(angle => launch(angle, speed, level >= 4 ? 1 : 0, false, 1, 'dawn'));
      if (level === 5) launch(0, 650 * (p.rage > 0 ? 1.3 : 1), 2, true, 1.25, 'dawn');
    }
    // 每架戰機的額外主炮：改變射擊節奏與彈道，不只是數值倍率。
    if (p.shipId === 'ember') emitPlayerShot(0, 0, speed * 0.82, 0, true, 1.45, 'ember');
    if (p.shipId === 'violet') [-0.29, 0.29].forEach(angle => emitPlayerShot(0, angle, speed * 1.16, 0, false, 0.72, 'violet'));
    if (p.shipId === 'bulwark') [-20, 20].forEach(offset => emitPlayerShot(offset, 0, speed * 0.9, 1, false, 0.72, 'bulwark'));
    if (p.shipId === 'auric') emitPlayerShot(0, 0, speed * 1.08, 1, false, 1.1, 'auric');
    if (p.shipId === 'specter') [-0.36, -0.18, 0.18, 0.36].forEach(angle => emitPlayerShot(0, angle, speed * 1.32, 0, false, 0.55, 'specter'));
    if (p.shipId === 'tide') [-0.42, -0.21, 0, 0.21, 0.42].forEach(angle => emitPlayerShot(0, angle, speed * 0.93, 0, false, 0.5, 'tide'));
    if (p.shipId === 'rime') emitPlayerShot(0, 0, speed * 0.76, 3, true, 1.8, 'rime');
    if (p.shipId === 'nova') [-0.25, 0, 0.25].forEach(angle => emitPlayerShot(0, angle, speed * 1.1, 1, false, 0.85, 'nova'));
    if (p.shipId === 'helix') [-0.15, 0.15].forEach(angle => emitPlayerShot(0, angle, speed * 1.08, 1, false, 0.92, 'helix'));
    if (p.shipId === 'aurora') emitPlayerShot(0, 0, 705, 3, true, 1.36, 'aurora');
    if (p.shipId === 'caldera') emitPlayerShot(0, 0, speed * 0.7, 0, false, 2.35, 'caldera');
    if (p.shipId === 'seraph') [-0.3, -0.18, -0.06, 0.06, 0.18, 0.3].forEach(angle => emitPlayerShot(0, angle, speed * 1.04, 1, false, 0.7, 'seraph'));
    if (p.shipId === 'voidlance') [-0.055, 0.055].forEach(angle => emitPlayerShot(0, angle, speed * 1.32, 4, false, 1.18, 'voidlance'));
    if (p.shipId === 'solaris') [-0.26, -0.13, 0, 0.13, 0.26].forEach(angle => emitPlayerShot(0, angle, speed * 1.18, 2, angle === 0, 0.98, 'solaris'));
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
    // 金幣是基礎成長來源：普通敵必掉，部分額外掉落；拾取時自動吸附。
    addPickup(target.x, target.y, 'gold'); roll(0.42, 'gold'); roll(0.15, 'power'); roll(0.06, 'hp'); roll(0.08, 'shield');
    roll(0.1, 'energy'); roll(0.04, 'magnet'); roll(0.03, 'rage'); roll(0.02, 'double'); roll(0.025, 'pierce'); roll(0.02, 'crit'); roll(0.02, 'barrier'); roll(0.025, 'rapid');
  }

  function dropBoss(target) {
    if (mode !== 'endless') { state.gold += 20; return; }
    // Boss 必掉火力、金幣與星能，並在 HP／護盾中擇一；額外金幣營造大量掉寶感。
    ['power', 'energy', Math.random() < 0.5 ? 'hp' : 'shield'].forEach((type, index) => addPickup(target.x + (index - 1) * 18, target.y, type));
    for (let index = 0; index < 10; index += 1) addPickup(target.x + (Math.random() - 0.5) * 80, target.y + (Math.random() - 0.5) * 35, 'gold', 2);
    // 無盡每擊破一隻 Boss 都掉星匣；越高層可同時取得更多箱子。
    const chestCount = Math.min(5, 1 + Math.floor(state.wave / 16));
    addPickup(target.x, target.y - 16, 'chest', chestCount);
  }

  function defeat(target) {
    state.score += target.score || 60;
    state.combo += 1;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    state.kills += 1;
    state.p.energy = Math.min(100, state.p.energy + 6);
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
    if (state.fusion === 'nova') {
      // 新星協調技：集中穿透光束，對 Boss 額外造成固定比例傷害。
      state.enemies.forEach((entry) => { entry.hp -= 140; });
      if (state.boss) state.boss.hp -= Math.min(250, state.boss.maxHp * 0.1);
      for (let index = 0; index < 5; index += 1) { const beam = bullet(state.p.x + (index - 2) * 9, state.p.y - 26, 0, -720, 'p', state.p.atk * 3, 5); beam.laser = true; beam.trail = true; addBullet(beam); }
      announce('合體技：新星貫流', 1.1);
    }
    if (state.fusion === 'aegis') {
      // 天穹護航技：回復護盾並清理近身彈幕，保留遠方壓力。
      state.p.shield = state.p.maxShield;
      state.p.inv = 3;
      state.bullets = state.bullets.filter(entry => entry.from === 'p' || distance(entry, state.p) > 135);
      spawnParticle(state.p.x, state.p.y, '#88eaff', 30, 4);
      announce('合體技：天穹壁壘', 1.1);
    }
    if (state.fusion === 'comet') {
      // 彗尾突進技：短暫超載射擊與全屏小型目標清掃。
      state.p.rapid = 8; state.p.pierceBuff = 8; state.p.rage = 8;
      state.enemies.forEach((entry) => { entry.hp -= 220; });
      spawnParticle(state.p.x, state.p.y, '#ffbd6b', 30, 4);
      announce('合體技：彗尾超載', 1.1);
    }
  }

  function updatePlayer(dt) {
    const p = state.p;
    const speed = p.speed * dt;
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
    p.secondaryTimer -= dt; p.wingTimer -= dt;
    firePlayer();
    fireSecondary(p);
    fireWingman(p);
  }

  function fireWingman(p) {
    const wingman = state.wingman;
    if (!wingman || p.wingTimer > 0) return;
    const launch = (x, angle, speed, damage, style, pierce = 0, laser = false) => {
      const entry = bullet(x, p.y - 20, Math.sin(angle) * speed, -Math.cos(angle) * speed, 'p', p.atk * damage, pierce);
      entry.style = style; entry.trail = true; entry.laser = laser; addBullet(entry);
    };
    if (wingman === 'e1') { [-30, 30].forEach(x => launch(p.x + x, 0, 340, 0.42, 'wing-pulse')); p.wingTimer = 0.74; }
    else if (wingman === 'e2') { [-32, 32].forEach(x => launch(p.x + x, x < p.x ? -0.12 : 0.12, 300, 0.52, 'wing-missile', 1)); p.wingTimer = 1.3; }
    else if (wingman === 'e3') { [-31, 31].forEach(x => launch(p.x + x, 0, 560, 0.45, 'wing-rail', 2, true)); p.wingTimer = 1.08; }
    else if (wingman === 'e4') { [-34, 34].forEach(x => launch(p.x + x, x < p.x ? -0.22 : 0.22, 360, 0.56, 'wing-prism', 1)); p.wingTimer = 0.82; }
    else if (wingman === 'e5') { [-34, 34].forEach(x => launch(p.x + x, 0, 315, 0.58, 'wing-heal')); p.wingTimer = 0.92; }
    else if (wingman === 'e6') { [-28, 28].forEach(x => launch(p.x + x, 0, 600, 0.46, 'wing-rail', 3, true)); p.wingTimer = 0.86; }
    else if (wingman === 'e7') { [-0.26, 0, 0.26].forEach(angle => launch(p.x, angle, 330, 0.43, 'wing-chain', 1)); p.wingTimer = 0.78; }
    else { [-36, 36].forEach(x => launch(p.x + x, 0, 275, 0.78, 'wing-burst', 2)); p.wingTimer = 1.42; }
  }

  function fireSecondary(p) {
    const secondary = saveData.equipped?.secondary;
    if (!secondary || p.secondaryTimer > 0) return;
    // 每種副武器都帶著獨立 style，渲染器會依此繪出不同彈型、顏色與拖尾。
    const launch = (entry, style) => { entry.style = style; entry.trail = true; addBullet(entry); };
    if (secondary === 's1') {
      const target = state.boss || state.enemies.reduce((best, item) => !best || distance(item, p) < distance(best, p) ? item : best, null);
      if (target) { const aim = Math.atan2(target.y - p.y, target.x - p.x); launch(bullet(p.x, p.y - 14, Math.cos(aim) * 285, Math.sin(aim) * 285, 'p', p.atk * 2.1, 0), 'secondary-missile'); }
      p.secondaryTimer = 2.1;
    } else if (secondary === 's2') {
      const beam = bullet(p.x, p.y - 20, 0, -610, 'p', p.atk * 1.65, 3, true); beam.laser = true; launch(beam, 'secondary-rail'); p.secondaryTimer = 2.5;
    } else if (secondary === 's3') {
      [-22, 22].forEach(offset => launch(bullet(p.x + offset, p.y - 9, 0, -360, 'p', p.atk * 0.6), 'secondary-drone')); p.secondaryTimer = 0.62;
    } else if (secondary === 's4') {
      [-0.18, 0.18].forEach(angle => launch(bullet(p.x, p.y - 18, Math.sin(angle) * 330, -Math.cos(angle) * 330, 'p', p.atk * 0.8, 1), 'secondary-pulse')); p.secondaryTimer = 1.15;
    } else if (secondary === 's5') {
      const target = state.boss || state.enemies.reduce((best, item) => !best || distance(item, p) < distance(best, p) ? item : best, null);
      if (target) [-0.18, 0, 0.18].forEach(offset => { const aim = Math.atan2(target.y - p.y, target.x - (p.x + offset * 40)); launch(bullet(p.x + offset * 40, p.y - 16, Math.cos(aim) * 250, Math.sin(aim) * 250, 'p', p.atk * 0.82, 1), 'secondary-seeker'); });
      p.secondaryTimer = 1.45;
    } else if (secondary === 's6') {
      [-14, 14].forEach(offset => { const beam = bullet(p.x + offset, p.y - 20, 0, -520, 'p', p.atk * 0.9, 2, true); beam.laser = true; launch(beam, 'secondary-rail'); }); p.secondaryTimer = 1.75;
    } else if (secondary === 's7') {
      [-0.38, -0.13, 0.13, 0.38].forEach(angle => launch(bullet(p.x, p.y - 16, Math.sin(angle) * 310, -Math.cos(angle) * 310, 'p', p.atk * 0.68, 1), 'secondary-prism')); p.secondaryTimer = 1.05;
    } else if (secondary === 's8') {
      [-0.3, 0, 0.3].forEach(angle => { const shell = bullet(p.x, p.y - 18, Math.sin(angle) * 240, -Math.cos(angle) * 240, 'p', p.atk * 1.15, 2); launch(shell, 'secondary-burst'); }); p.secondaryTimer = 1.55;
    }
  }

  function spawnEnemy(kind, x) {
    const entry = enemy(kind, x);
    const stageOrder = Math.max(0, state.stage?.order || 0);
    const endlessScale = mode === 'endless' ? Math.min(state.wave, 36) * 0.045 : 0;
    const hpScale = 1 + stageOrder * 0.28 + endlessScale;
    entry.hp = Math.round(entry.hp * hpScale);
    entry.maxHp = entry.hp;
    entry.damageScale = 1 + stageOrder * 0.09 + endlessScale * 0.2;
    entry.speed *= 1 + Math.min(0.18, stageOrder * 0.025 + endlessScale * 0.01);
    entry.fireRateScale = Math.max(0.82, 1 - stageOrder * 0.025 - endlessScale * 0.015);
    entry.id = state.nextId++;
    entry.formation = state.formation;
    entry.formationSlot = state.formationIndex;
    state.enemies.push(entry);
  }

  function fireBoss(boss) {
    const phase = boss.phase;
    boss.fireCd = phase === 1 ? 1.0 : phase === 2 ? 0.62 : 0.42;
    if (phase === 1) {
      [-0.32, -0.16, 0, 0.16, 0.32].forEach((spread) => addBullet(bullet(boss.x, boss.y, spread * 270, 175, 'e', 10)));
    } else if (phase === 2) {
      [-0.45, -0.28, -0.12, 0.12, 0.28, 0.45].forEach((spread) => addBullet(bullet(boss.x, boss.y, spread * 300, 190, 'e', 12)));
      [-1, 1].forEach((side) => addBullet(bullet(boss.x + side * 34, boss.y, side * 95, 220, 'e', 12)));
    } else {
      [-0.55, -0.36, -0.18, 0, 0.18, 0.36, 0.55].forEach((spread) => addBullet(bullet(boss.x, boss.y, spread * 320, 210, 'e', 14)));
      if (boss.laserWarn <= 0 && boss.laserActive <= 0) boss.laserWarn = 0.75;
    }
  }

  function updateEnemies(dt, time) {
    if (state.left && state.enemies.length < Math.min(6, balanceConfig.performance.maxEnemies)) {
      const point = state.formation.point(state.formationIndex, 0);
      spawnEnemy(state.kind, point.x);
      state.formationIndex += 1;
      state.left -= 1;
    }
    state.enemies.forEach((entry) => {
      entry.age += dt; entry.fireCd -= dt;
      if (entry.formation && entry.age < entry.formation.hold) {
        const point = entry.formation.point(entry.formationSlot, entry.age);
        entry.x += (point.x - entry.x) * Math.min(1, dt * 8);
        entry.y += (point.y - entry.y) * Math.min(1, dt * 7);
      } else {
      if (entry.pattern === 'dash') { entry.y += entry.speed * dt; entry.x += Math.sin(entry.age * 8 + entry.phase) * 105 * dt; }
      if (entry.pattern === 'drift') { entry.y += entry.speed * dt; entry.x += Math.sin(entry.age * 2 + entry.phase) * 38 * dt; }
      if (entry.pattern === 'heavy') { entry.y = Math.min(entry.lockedY, entry.y + entry.speed * dt); entry.x += Math.sin(entry.age + entry.phase) * 16 * dt; }
      if (entry.pattern === 'hold') { entry.y = Math.min(entry.lockedY, entry.y + entry.speed * dt); }
      if (entry.pattern === 'suicide') { entry.y += entry.speed * dt; entry.x += Math.sign(state.p.x - entry.x) * 38 * dt; }
      if (entry.pattern === 'orbit') { entry.y = Math.min(entry.lockedY, entry.y + entry.speed * dt); entry.x += Math.sin(entry.age * 2.4 + entry.phase) * 62 * dt; }
      if (entry.pattern === 'sweep') { entry.y = Math.min(entry.lockedY, entry.y + entry.speed * dt); entry.x += Math.cos(entry.age * 2 + entry.phase) * 68 * dt; }
      }
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
      const damage = Math.round(11 * (boss.damageScale || 1));
      for (let index = 0; index < 3; index += 1) addBullet(bullet(boss.x, boss.y, Math.cos(boss.pendingAim) * balanceConfig.boss.aimedSpeed, Math.sin(boss.pendingAim) * balanceConfig.boss.aimedSpeed, 'e', damage));
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
    const damage = value => Math.round(value * (boss.damageScale || 1));
    boss.attack = phasePatterns[boss.sequence++ % phasePatterns.length];
    if (boss.attack === 'fan') {
      [-0.42, -0.21, 0, 0.21, 0.42].forEach(spread => addBullet(bullet(boss.x, boss.y, spread * 128, balanceConfig.boss.fanSpeed, 'e', damage(9))));
      boss.rest = 1.25;
    } else if (boss.attack === 'lanes') {
      // 左右交替直線彈，中央保留可讀通道。
      const side = boss.sequence % 2 ? -1 : 1;
      [-1, 1].forEach(offset => addBullet(bullet(boss.x + side * 26, boss.y, offset * 45, 118, 'e', damage(10))));
      boss.rest = 1.12;
    } else if (boss.attack === 'ring') {
      for (let index = 0; index < 8; index += 1) { const angle = Math.PI / 2 + index * Math.PI / 4 + 0.18; addBullet(bullet(boss.x, boss.y, Math.cos(angle) * balanceConfig.boss.ringSpeed, Math.sin(angle) * balanceConfig.boss.ringSpeed, 'e', damage(10))); }
      boss.rest = 1.05;
    } else if (boss.attack === 'aimed') {
      boss.telegraph = 0.72; boss.pendingAimed = true; boss.rest = 1.5;
      boss.pendingAim = Math.atan2(state.p.y - boss.y, state.p.x - boss.x);
    } else if (boss.attack === 'laser') {
      boss.laserWarn = balanceConfig.boss.laserWarning; boss.telegraph = balanceConfig.boss.laserWarning; boss.pendingLaser = true; boss.rest = 1.55;
    } else if (boss.attack === 'rageFan') {
      [-0.5, -0.33, -0.16, 0, 0.16, 0.33, 0.5].forEach(spread => addBullet(bullet(boss.x, boss.y, spread * 112, 118, 'e', damage(11))));
      boss.rest = 1.3;
    } else {
      spawnEnemy('scout', Math.max(35, boss.x - 54)); spawnEnemy('sprinter', Math.min(325, boss.x + 54));
      boss.rest = 1.2;
    }
  }

  function fireEnemy(entry) {
    const aimed = Math.atan2(state.p.y - entry.y, state.p.x - entry.x);
    const damage = value => Math.max(1, Math.round(value * (entry.damageScale || 1)));
    const cooldown = value => value * (entry.fireRateScale || 1);
    if (entry.attack === 'needle') {
      entry.fireCd = cooldown(1.6);
      addBullet(bullet(entry.x, entry.y, Math.cos(aimed) * 150, Math.sin(aimed) * 150, 'e', damage(8)));
    }
    if (entry.attack === 'fan') {
      entry.fireCd = cooldown(1.7);
      [-0.24, 0, 0.24].forEach((spread) => addBullet(bullet(entry.x, entry.y, Math.cos(aimed + spread) * 120, Math.sin(aimed + spread) * 120, 'e', damage(10))));
    }
    if (entry.attack === 'aim') {
      entry.fireCd = cooldown(2.05);
      addBullet(bullet(entry.x, entry.y, Math.cos(aimed) * 165, Math.sin(aimed) * 165, 'e', damage(13)));
    }
    if (entry.attack === 'burst') {
      entry.fireCd = cooldown(1.35);
      [-0.14, 0.14].forEach((spread) => addBullet(bullet(entry.x, entry.y, Math.cos(aimed + spread) * 128, Math.sin(aimed + spread) * 128, 'e', damage(9))));
    }
    if (entry.attack === 'ring') {
      entry.fireCd = cooldown(1.9);
      for (let index = 0; index < 6; index += 1) { const angle = Math.PI / 2 + index * Math.PI / 3; addBullet(bullet(entry.x, entry.y, Math.cos(angle) * 96, Math.sin(angle) * 96, 'e', damage(8))); }
    }
    if (entry.attack === 'elite') {
      entry.fireCd = cooldown(0.9);
      [-0.36, -0.18, 0, 0.18, 0.36].forEach((spread) => addBullet(bullet(entry.x, entry.y, Math.sin(spread) * 125, Math.cos(spread) * 125, 'e', damage(11))));
    }
  }

  function hitTarget(entry, target) {
    if (entry.hit.has(target.id)) return;
    if (distance(entry, target) >= entry.r + target.r) return;
    entry.hit.add(target.id);
    if (target.shield > 0) target.shield = Math.max(0, target.shield - entry.damage);
    else target.hp -= entry.damage;
    state.p.energy = Math.min(100, state.p.energy + 1);
    spawnParticle(entry.x, entry.y, entry.laser ? '#d6ffff' : '#fff1a0', 3, 1.5);
    if (entry.pierce > 0) entry.pierce -= 1; else entry.life = 0;
  }

  function updateProjectiles(dt) {
    state.bullets.forEach((entry) => {
      entry.age = (entry.age || 0) + dt;
      entry.x += entry.vx * dt;
      entry.y += entry.vy * dt;
      if (entry.wave) entry.x += Math.sin(entry.age * entry.waveRate + entry.wavePhase) * entry.wave * dt;
      entry.life -= dt;
    });
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
    if (entry.type === 'chest') state.chests += entry.value || 1;
    if (entry.type === 'power') {
      const previous = p.fireLevel;
      p.fireLevel = Math.min(5, p.fireLevel + 1);
      if (p.fireLevel > previous) {
        p.inv = Math.max(p.inv, 0.5);
        state.upgradePulse = 0.72;
        state.timeScale = 0.42;
        announce(`FIRE UP ・ Lv${p.fireLevel}`, 0.85);
      }
    }
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
      entry.age += dt;
      entry.vx *= Math.pow(0.22, dt);
      entry.x += entry.vx * dt + Math.sin(entry.age * entry.driftSpeed + entry.drift) * entry.bob * dt;
      entry.y += (entry.vy + Math.cos(entry.age * entry.driftSpeed * 0.7 + entry.drift) * 7) * dt;
      const range = entry.type === 'gold' ? 210 : p.magnet > 0 ? 150 : 42;
      const gap = distance(entry, p);
      if (gap < range) {
        const pull = entry.type === 'gold' ? 410 : p.magnet > 0 ? 500 : 255;
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
      const defeated = state.boss;
      defeated.isBoss = true;
      defeat(defeated);
      state.boss = null;
      state.left = 0;
      announce(`${defeated.name} 已瓦解`, 0.6);
      // 主線與 Boss 挑戰立刻結算；無盡模式則不中斷地接續下一波。
      if (mode !== 'endless') finish(true);
    }
  }

  function updateParticles(dt) {
    state.particles.forEach((entry) => { entry.x += entry.vx * dt; entry.y += entry.vy * dt; entry.vy += 70 * dt; entry.life -= dt; });
    state.particles = state.particles.filter((entry) => entry.life > 0);
  }

  function frame(time) {
    let dt = Math.min(0.033, (time - state.last || 0) / 1000);
    state.last = time;
    if (!state.paused && !state.over) {
      state.upgradePulse = Math.max(0, state.upgradePulse - dt);
      state.timeScale += (1 - state.timeScale) * Math.min(1, dt * 9);
      dt *= state.timeScale;
      state.elapsed += dt;
      state.messageTimer = Math.max(0, state.messageTimer - dt);
      // 戰鬥流程全程用同一個 delta time 更新，不再因命中、補給或 Boss 事件凍結畫面。
      updatePlayer(dt); updateEnemies(dt, time); updateProjectiles(dt); resolveDefeats(); updatePickups(dt); spawnNextWave();
      state.stars.forEach((star) => { star.y = star.y > 640 ? 0 : star.y + star.speed * dt; });
      state.nebulae.forEach((cloud) => { cloud.y = cloud.y > 730 ? -cloud.r : cloud.y + cloud.speed * dt; });
      state.debris.forEach((piece) => { piece.y = piece.y > 660 ? -piece.r : piece.y + piece.speed * dt; piece.spin += dt * 1.5; });
      updateParticles(dt); state.shake = Math.max(0, state.shake - dt * 18); onHud(state);
    }
    render(ctx, state);
    if (!state.over) animationFrame = requestAnimationFrame(frame);
  }

  animationFrame = requestAnimationFrame(frame);
  return {
    pause: () => { state.paused = !state.paused; },
    ultimate,
    claim: () => { if (state.chests > 0) finish(true); },
    stop: () => { cancelAnimationFrame(animationFrame); controls.destroy?.(); }
  };
}
