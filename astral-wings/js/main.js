import { load, save, reset } from './save.js';
import { input } from './input.js';
// 以版本參數避開先前 Service Worker 快取的損壞戰鬥模組。
import { game } from './game.js?v=20260726-v02-power';
import { menu } from './ui.js';
import { C } from './config.js';

// 此檔案只負責頁面切換、遊戲實例與存檔的銜接。
let data = load();
let run = null;
const app = document.querySelector('#app');

function home() {
  if (run) run.stop();
  run = null;
  app.innerHTML = menu(data);
}

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

function start() {
  app.innerHTML = `
    <div class="shell game">
      <canvas width="360" height="640" aria-label="星界戰翼遊戲畫面"></canvas>
      <div class="hud">
        <b>第 1 關：破碎軌道</b>
        <div class="bar hp"><i id="hp"></i></div>
        <div class="bar shield"><i id="shield"></i></div>
        <span id="score">分數 0・連擊 0・能量 0%</span>
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
    if (result.win) data.complete = true;
    save(data);
    showResult(result);
  }, (state) => {
    const hp = app.querySelector('#hp');
    const shield = app.querySelector('#shield');
    const score = app.querySelector('#score');
    const power = app.querySelector('#power');
    const buffs = app.querySelector('#buffs');
    const bossHud = app.querySelector('#boss-hud');
    const bossHp = app.querySelector('#boss-hp');
    if (hp) hp.style.width = `${Math.max(0, state.p.hp / state.p.maxHp * 100)}%`;
    if (shield) shield.style.width = `${Math.max(0, state.p.shield / state.p.maxShield * 100)}%`;
    if (score) score.textContent = `分數 ${state.score}・連擊 ${state.combo}・能量 ${Math.floor(state.p.energy)}%`;
    if (power) power.textContent = `火力 Lv${state.p.fireLevel}`;
    if (buffs) {
      const active = [];
      if (state.p.magnet > 0) active.push(`磁力 ${Math.ceil(state.p.magnet).toString().padStart(2, '0')}`);
      if (state.p.rage > 0) active.push(`狂暴 ${Math.ceil(state.p.rage).toString().padStart(2, '0')}`);
      if (state.p.doubleGold > 0) active.push(`雙倍金幣 ${Math.ceil(state.p.doubleGold).toString().padStart(2, '0')}`);
      buffs.textContent = active.join('・');
      buffs.hidden = active.length === 0;
    }
    if (bossHud && bossHp) {
      bossHud.classList.toggle('hidden', !state.boss);
      if (state.boss) bossHp.style.width = `${Math.max(0, state.boss.hp / state.boss.maxHp * 100)}%`;
    }
  });
}

app.addEventListener('click', (event) => {
  const action = event.target.closest('[data-a]')?.dataset.a;
  if (!action) return;
  if (action === 'start' || action === 'retry') start();
  if (action === 'home') home();
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
