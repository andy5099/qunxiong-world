import { load, save, reset } from './save.js';
import { input } from './input.js';
// 以版本參數避開先前 Service Worker 快取的損壞戰鬥模組。
import { game } from './game.js?v=20260726-v05-economy';
import { menu, equipmentView, missionsView, fusionView } from './ui.js?v=20260726-v05-fusion';
import { equipmentTemplates, fusionForms } from './data/equipment.js?v=20260726-v05-fusion';
import { C } from './config.js';

// 此檔案只負責頁面切換、遊戲實例與存檔的銜接。
let data = load();
let run = null;
const app = document.querySelector('#app');

function refreshDaily() {
  const today = new Date().toLocaleDateString('sv-SE');
  if (data.missions.date !== today) data.missions = { date: today, kills: 0, stages: 0, bosses: 0, claimed: {} };
}
refreshDaily();

function home() {
  if (run) run.stop();
  run = null;
  app.innerHTML = menu(data);
}

function equipment() { if (run) run.stop(); run = null; app.innerHTML = equipmentView(data); }
function missions() { if (run) run.stop(); run = null; app.innerHTML = missionsView(data); }
function fusion() { if (run) run.stop(); run = null; app.innerHTML = fusionView(data); }

function showResult(result) {
  const box = app.querySelector('#result');
  if (!box) return;
  box.classList.remove('hidden');
  box.innerHTML = `
    <div class="panel result-card">
      <h2>${result.win ? '關卡完成' : '戰機失聯'}</h2>
      <p>分數：${result.score}<br>擊殺：${result.kills}<br>最大連擊：${result.combo}<br>獲得金幣：${result.gold}</p>
      <button data-a="retry">重新挑戰</button>
      <button data-a="home">返回主選單</button>
    </div>`;
}

function start(mode = 'stage') {
  app.innerHTML = `
    <div class="shell game">
      <canvas width="360" height="640" aria-label="星界戰翼遊戲畫面"></canvas>
      <div class="hud">
        <b>${mode === 'endless' ? '無盡航線' : mode === 'boss' ? 'Boss 挑戰' : '第 1 關：破碎軌道'}</b>
        <div class="bar hp"><i id="hp"></i></div>
        <div class="bar shield"><i id="shield"></i></div>
        <span id="score">分數 0・連擊 0・能量 0%</span>
        <span id="progress" class="progress-label">區域進度 0%</span>
        <span id="power" class="power-label">火力 Lv1</span>
        <span id="buffs" class="buff-label"></span>
        <div id="boss-hud" class="boss-hud hidden"><b>鐵幕吞噬者</b><div class="bar boss-bar"><i id="boss-hp"></i></div></div>
      </div>
      <div class="actions">
        <button data-a="pause">暫停</button>
        <button data-a="ult">星能爆發</button>
        <button data-a="home">返回</button>
      </div>
      <div id="result" class="modal hidden"></div>
    </div>`;

  const canvas = app.querySelector('canvas');
  const controls = input(canvas);
  run = game(canvas, data, controls, (result) => {
    data.gold += result.gold;
    data.high = Math.max(data.high, result.score);
    data.maxCombo = Math.max(data.maxCombo, result.combo);
    data.missions.kills = (data.missions.kills || 0) + result.kills;
    if (result.win && result.mode === 'stage') data.missions.stages += 1;
    if (result.win && result.mode === 'boss') data.missions.bosses += 1;
    if (result.win) {
      const first = !data.complete;
      data.complete = true;
      data.materials += 8;
      if (first && !data.equipment.some(item => item.id === 'w2')) data.equipment.push({ id: 'w2', level: 0, locked: true });
      const reward = equipmentTemplates[Math.floor(Math.random() * equipmentTemplates.length)];
      if (!data.equipment.some(item => item.id === reward.id)) data.equipment.push({ id: reward.id, level: 0, locked: false });
      data.fragments += result.mode === 'boss' ? 3 : 1;
    }
    if (result.mode === 'endless') data.endlessBest = Math.max(data.endlessBest || 0, result.wave);
    if (result.mode === 'boss') data.bossBest = Math.max(data.bossBest || 0, result.score);
    save(data);
    showResult(result);
  }, (state) => {
    const hp = app.querySelector('#hp');
    const shield = app.querySelector('#shield');
    const score = app.querySelector('#score');
    const progress = app.querySelector('#progress');
    const power = app.querySelector('#power');
    const buffs = app.querySelector('#buffs');
    const bossHud = app.querySelector('#boss-hud');
    const bossHp = app.querySelector('#boss-hp');
    if (hp) hp.style.width = `${Math.max(0, state.p.hp / state.p.maxHp * 100)}%`;
    if (shield) shield.style.width = `${Math.max(0, state.p.shield / state.p.maxShield * 100)}%`;
    if (score) score.textContent = `分數 ${state.score}・連擊 ${state.combo}・能量 ${Math.floor(state.p.energy)}%`;
    if (progress) progress.textContent = state.boss ? '區域進度 100%・Boss 戰' : `區域進度 ${Math.min(99, Math.floor(state.wave / 10 * 100))}%`;
    if (power) power.textContent = `火力 Lv${state.p.fireLevel}`;
    if (buffs) {
      const active = [];
      if (state.p.magnet > 0) active.push(`磁力 ${Math.ceil(state.p.magnet).toString().padStart(2, '0')}`);
      if (state.p.rage > 0) active.push(`狂暴 ${Math.ceil(state.p.rage).toString().padStart(2, '0')}`);
      if (state.p.doubleGold > 0) active.push(`雙倍金幣 ${Math.ceil(state.p.doubleGold).toString().padStart(2, '0')}`);
      if (state.p.pierceBuff > 0) active.push(`穿透 ${Math.ceil(state.p.pierceBuff).toString().padStart(2, '0')}`);
      if (state.p.crit > 0) active.push(`暴擊 ${Math.ceil(state.p.crit).toString().padStart(2, '0')}`);
      if (state.p.barrier > 0) active.push('屏障 1');
      if (state.p.rapid > 0) active.push(`急速 ${Math.ceil(state.p.rapid).toString().padStart(2, '0')}`);
      buffs.textContent = active.join('・');
      buffs.hidden = active.length === 0;
    }
    if (bossHud && bossHp) {
      bossHud.classList.toggle('hidden', !state.boss);
      if (state.boss) bossHp.style.width = `${Math.max(0, state.boss.hp / state.boss.maxHp * 100)}%`;
    }
  }, mode);
}

app.addEventListener('click', (event) => {
  const action = event.target.closest('[data-a]')?.dataset.a;
  if (!action) return;
  if (action === 'start' || action === 'retry') start();
  if (action === 'endless') start('endless');
  if (action === 'boss') start('boss');
  if (action === 'home') home();
  if (action === 'equipment') equipment();
  if (action === 'missions') missions();
  if (action === 'fusion') fusion();
  if (action === 'pause') run?.pause();
  if (action === 'ult') run?.ultimate();
  if (action === 'upgrade') {
    const cost = C.upgradeCost(data.level);
    if (data.level < C.maxLevel && data.gold >= cost) {
      data.gold -= cost;
      data.level += 1;
      save(data);
    }
    home();
  }
  if (action === 'star') {
    const cost = data.star * 5;
    if (data.star < 5 && data.fragments >= cost) { data.fragments -= cost; data.star += 1; save(data); }
    home();
  }
  if (action.startsWith('fusion:')) {
    const id = action.split(':')[1]; const form = fusionForms.find(item => item.id === id);
    if (form && form.need.every(need => data.equipment.some(item => item.id === need))) { data.fusion = id; save(data); }
    fusion();
  }
  if (action === 'awaken') {
    const cost = 16 + data.fusionAwaken * 10;
    if (data.fusion && data.fusionAwaken < 3 && data.materials >= cost) { data.materials -= cost; data.fusionAwaken += 1; save(data); }
    fusion();
  }
  if (action === 'evolve') {
    const cost = 4 + data.fusionEvolution * 3;
    if (data.fusion && data.fusionAwaken >= 3 && data.fusionEvolution < 2 && data.fragments >= cost) { data.fragments -= cost; data.fusionEvolution += 1; save(data); }
    fusion();
  }
  if (action.startsWith('equip:')) {
    const id = action.split(':')[1];
    const template = equipmentTemplates.find(item => item.id === id);
    if (template && data.equipment.some(item => item.id === id)) { data.equipped[template.slot] = id; save(data); equipment(); }
  }
  if (action.startsWith('enhance:')) {
    const id = action.split(':')[1]; const item = data.equipment.find(entry => entry.id === id);
    if (item) { const cost = 30 + item.level * 28; if (data.materials >= cost && item.level < 20) { data.materials -= cost; item.level += 1; save(data); } equipment(); }
  }
  if (action.startsWith('dismantle:')) {
    const id = action.split(':')[1]; const item = data.equipment.find(entry => entry.id === id);
    const equipped = Object.values(data.equipped).includes(id);
    if (item && !item.locked && !equipped) { data.equipment = data.equipment.filter(entry => entry.id !== id); data.materials += 8 + item.level * 2; save(data); }
    equipment();
  }
  if (action.startsWith('claim:')) {
    const id = action.split(':')[1];
    const daily = { 'daily-kills': [data.missions.kills >= 30, 'gold', 80], 'daily-stage': [data.missions.stages >= 1, 'materials', 4], 'daily-boss': [data.missions.bosses >= 1, 'fragments', 2] };
    const achievement = { 'ach-first': [data.complete, 'gold', 150], 'ach-combo': [data.maxCombo >= 25, 'materials', 8], 'ach-endless': [data.endlessBest >= 10, 'fragments', 3] };
    const source = daily[id] || achievement[id];
    const claims = daily[id] ? data.missions.claimed : data.achievements.claimed;
    if (source && source[0] && !claims[id]) { data[source[1]] += source[2]; claims[id] = true; save(data); }
    missions();
  }
  if (action === 'craft') {
    if (data.materials >= 25) { data.materials -= 25; const missing = equipmentTemplates.filter(template => !data.equipment.some(item => item.id === template.id)); if (missing.length) data.equipment.push({ id: missing[Math.floor(Math.random() * missing.length)].id, level: 0, locked: false }); save(data); }
    equipment();
  }
  if (action === 'help') {
    window.alert('手機：按住遊戲畫面拖曳戰機。電腦：滑鼠拖曳，或使用方向鍵與 WASD 移動；空白鍵使用必殺技，Esc 暫停。');
  }
  if (action === 'reset' && window.confirm('確定要重置所有星界戰翼進度嗎？')) {
    data = reset();
    home();
  }
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    run?.ultimate();
  }
  if (event.key === 'Escape') run?.pause();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) run?.pause();
});

// 存檔損壞或其他初始化例外時，至少保留可恢復的畫面。
try {
  home();
} catch {
  app.innerHTML = '<div class="shell panel menu"><h1>星界戰翼</h1><p>遊戲初始化失敗，請重新整理頁面後再試一次。</p><button onclick="location.reload()">重新載入</button></div>';
}
