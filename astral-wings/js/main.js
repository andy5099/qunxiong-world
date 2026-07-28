import { load, save, reset } from './save.js?v=20260727-ships';
import { input } from './input.js';
// 以版本參數避開先前 Service Worker 快取的損壞戰鬥模組。
import { game } from './game.js?v=20260728-arcade-craft-bolts';
import { menu, equipmentView, missionsView, fusionView, stageView, bossView, codexView, shipView } from './ui.js?v=20260728-visual-stage-rewards';
import { fusionStatusView, mobileHomeHub, upgradedShipView, battleReadyView } from './uiEnhancements.js?v=20260728-mobile-home-hub';
import { ships } from './data/ships.js?v=20260727-boss-routes-hangar-v3';
import { equipmentTemplates, fusionForms } from './data/equipment.js?v=20260726-v05-boss-loot';
import { stages, getStage } from './data/stages.js?v=20260727-visual-12stage';
import { getBoss } from './data/bosses.js?v=20260728-mobile-home-hub';
import { C } from './config.js';

// 此檔案只負責頁面切換、遊戲實例與存檔的銜接。
let data = load();
let run = null;
// Single UI state boundary: battle code owns the canvas, while this object owns screen transitions.
const uiState = { screen: 'home', ready: null };
const app = document.querySelector('#app');

function setScreen(name, ready = null) {
  uiState.screen = name;
  uiState.ready = ready;
}

// 與戰鬥角色相同的裝備加總公式，用於在穿戴瞬間顯示真正的攻擊變化。
function currentAttack(state) {
  const bonus = Object.values(state.equipped || {}).map(id => {
    const template = equipmentTemplates.find(entry => entry.id === id);
    const owned = state.equipment.find(entry => entry.id === id);
    return template ? template.value + (owned?.level || 0) : 0;
  }).reduce((total, value) => total + value, 0);
  const ship = ships.find(entry => entry.id === (state.activeShip || 'dawn')) || ships[0];
  const shipLevel = Math.max(1, state.shipLevels?.[ship.id] || state.level || 1);
  const form = fusionForms.find(entry => entry.id === state.fusion);
  const multiplier = 1 + (form?.stat.attack || 0) + (state.fusionAwaken || 0) * 0.06 + (state.fusionEvolution || 0) * 0.1;
  return Math.floor((10 + shipLevel * 2 + Math.floor(bonus * 0.4) + (state.star - 1) * 2) * multiplier * ship.attack);
}

function bossLootTemplate() {
  const roll = Math.random();
  const quality = roll < 0.02 ? '傳說' : roll < 0.1 ? '史詩' : roll < 0.3 ? '稀有' : roll < 0.62 ? '優良' : '普通';
  const pool = equipmentTemplates.filter(item => item.quality === quality);
  return pool[Math.floor(Math.random() * pool.length)];
}

function refreshDaily() {
  const today = new Date().toLocaleDateString('sv-SE');
  if (data.missions.date !== today) data.missions = { date: today, kills: 0, stages: 0, bosses: 0, claimed: {} };
}
refreshDaily();

function home() {
  if (run) run.stop();
  run = null;
  setScreen('home');
  app.innerHTML = mobileHomeHub(data);
}

function recommendedStage() {
  const available = stages.filter(stage => data.unlockedStages?.includes(stage.id));
  return available[available.length - 1] || stages[0];
}

function battleReady(mode = 'stage', stageId = 'orbit', back = 'home') {
  if (run) run.stop();
  run = null;
  const selectedStage = getStage(stageId);
  const activeShip = ships.find(ship => ship.id === (data.activeShip || 'dawn')) || ships[0];
  const level = Math.max(1, data.shipLevels?.[activeShip.id] || data.level || 1);
  const power = Math.max(1, Math.floor(currentAttack(data) * 140 + activeShip.hp * 5 + activeShip.shield * 6 + level * 35));
  const recommendation = Math.floor((850 + selectedStage.order * 980) * (mode === 'boss' ? 1.12 : 1));
  const boss = getBoss(selectedStage.boss);
  const drops = [
    { kind: 'gold', icon: '◈', name: `金幣 ${40 + selectedStage.order * 24}～${90 + selectedStage.order * 42}`, detail: '戰鬥結算' },
    { kind: 'material', icon: '✧', name: `強化材料 +${4 + Math.floor(selectedStage.order / 2)}`, detail: '通關獎勵' },
    { kind: 'crate', icon: '▣', name: mode === 'boss' ? 'Boss 裝備箱' : '裝備掉落機率', detail: mode === 'boss' ? '必定獲得一份獎勵' : '品質隨關卡提升' }
  ];
  const ready = { mode, back, level, power, recommendation, boss, drops };
  setScreen('ready', { mode, stageId, back });
  app.innerHTML = battleReadyView(data, selectedStage, ready);
}

function equipment(keepPosition = false) {
  if (run) run.stop(); run = null;
  setScreen('equipment');
  const previousScroll = keepPosition ? (app.querySelector('.menu')?.scrollTop || 0) : 0;
  app.innerHTML = equipmentView(data);
  if (keepPosition) requestAnimationFrame(() => { const panel = app.querySelector('.menu'); if (panel) panel.scrollTop = previousScroll; });
}
function missions() { if (run) run.stop(); run = null; setScreen('missions'); app.innerHTML = missionsView(data); }
function fusion() { if (run) run.stop(); run = null; setScreen('fusion'); app.innerHTML = fusionStatusView(data); }
function shipHangar() { if (run) run.stop(); run = null; setScreen('ships'); app.innerHTML = upgradedShipView(data); }
function stagesMenu() { if (run) run.stop(); run = null; setScreen('stages'); app.innerHTML = stageView(data, stages); }
function bossMenu() { if (run) run.stop(); run = null; setScreen('boss'); app.innerHTML = bossView(data, stages); }
function codex() { if (run) run.stop(); run = null; setScreen('codex'); app.innerHTML = codexView(data, stages); }

function showResult(result, drops = []) {
  const box = app.querySelector('#result');
  if (!box) return;
  box.classList.remove('hidden');
  box.innerHTML = `
    <div class="panel result-card">
      <h2>${result.win ? '關卡完成' : '戰機失聯'}</h2>
      <div class="result-summary"><span class="result-score">${result.score}</span><small>擊殺 ${result.kills}・最高連擊 ${result.combo}</small></div>
      <section class="result-loot"><h3>本次獎勵</h3><ul><li>金幣 +${result.gold}</li>${result.win ? drops.filter(drop => !drop.startsWith('金幣 +')).map(drop => `<li>${drop}</li>`).join('') : '<li>挑戰失敗仍保留本場獲得金幣</li>'}</ul></section>
      <button class="ui-button action-retry" data-a="retry"><i aria-hidden="true"></i><span>重新挑戰</span></button>
      <button class="ui-button action-home" data-a="home"><i aria-hidden="true"></i><span>返回主選單</span></button>
    </div>`;
}

function start(mode = 'stage', stageId = 'orbit') {
  setScreen('battle', { mode, stageId });
  const selectedStage = getStage(stageId);
  app.innerHTML = `
    <div class="shell game">
      <canvas width="360" height="640" aria-label="星界戰翼遊戲畫面"></canvas>
      <div class="hud">
        <b>${mode === 'endless' ? '無盡航線' : mode === 'boss' ? `${selectedStage.name}・Boss 挑戰` : selectedStage.name}</b>
        <span id="hp-text">HP</span>
        <div class="bar hp"><i id="hp"></i></div>
        <span id="shield-text">Shield</span>
        <div class="bar shield"><i id="shield"></i></div>
        <span id="score">分數 0・連擊 0・能量 0%</span>
        <span id="progress" class="progress-label">區域進度 0%</span>
        <span id="power" class="power-label">火力 Lv1</span>
        <span id="fusion-skill" class="fusion-label"></span>
        <span id="buffs" class="buff-label"></span>
        <div id="boss-hud" class="boss-hud hidden"><b>鐵幕吞噬者</b><div class="bar boss-bar"><i id="boss-hp"></i></div></div>
      </div>
      <div class="actions">
        <button class="ui-button action-pause" data-a="pause"><i aria-hidden="true"></i><span>暫停</span></button>
        <button class="ui-button action-ult" data-a="ult"><i aria-hidden="true"></i><span>星能爆發</span></button>
        ${mode === 'endless' ? '<button class="ui-button action-endless-claim" data-a="endless-claim"><i aria-hidden="true"></i><span>結算並領取</span></button>' : '<button class="ui-button action-home" data-a="home"><i aria-hidden="true"></i><span>返回</span></button>'}
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
    if (result.win && result.mode === 'stage') {
      data.missions.stages += 1;
      data.stageProgress[selectedStage.id] = Math.max(data.stageProgress[selectedStage.id] || 0, result.score);
      const next = stages[selectedStage.order + 1];
      if (next && !data.unlockedStages.includes(next.id)) data.unlockedStages.push(next.id);
    }
    if (result.win && result.mode === 'boss') data.missions.bosses += 1;
    const drops = [`金幣 +${result.gold}`];
    if (result.win) {
      const first = !data.complete;
      data.complete = true;
      data.materials += 8; drops.push('強化材料 +8');
      if (first && !data.equipment.some(item => item.id === 'w2')) { data.equipment.push({ id: 'w2', level: 0, locked: true }); drops.push('首通裝備：晨弧脈衝槍'); }
      const reward = bossLootTemplate();
      if (!data.equipment.some(item => item.id === reward.id)) { data.equipment.push({ id: reward.id, level: 0, locked: false }); drops.push(`裝備掉落：${reward.name}`); }
      else drops.push(`裝備碎片：${reward.name}`);
      const fragments = result.mode === 'boss' ? 3 : 1;
      const blueprints = result.mode === 'boss' ? 2 : 1;
      data.fragments += fragments; data.blueprints += blueprints;
      drops.push(`戰機碎片 +${fragments}`, `藍圖 +${blueprints}`);
    }
    if (result.mode === 'endless' && result.chests > 0) {
      const qualityOrder = ['普通', '優良', '稀有', '史詩', '傳說'];
      const maxQuality = Math.min(4, Math.floor(result.wave / 12));
      drops.push(`無盡星匣 ×${result.chests}`);
      for (let index = 0; index < result.chests; index += 1) {
        const quality = qualityOrder[Math.floor(Math.random() * (maxQuality + 1))];
        const pool = equipmentTemplates.filter(item => item.quality === quality);
        const reward = pool[Math.floor(Math.random() * pool.length)];
        if (reward && !data.equipment.some(item => item.id === reward.id)) {
          data.equipment.push({ id: reward.id, level: 0, locked: false });
          drops.push(`星匣 ${index + 1}：${reward.quality}【${reward.name}】`);
        } else {
          const materialRefund = 10 + qualityOrder.indexOf(quality) * 5;
          data.materials += materialRefund;
          drops.push(`星匣 ${index + 1}：重複裝備 → 強化材料 +${materialRefund}`);
        }
      }
    }
    if (result.mode === 'endless') data.endlessBest = Math.max(data.endlessBest || 0, result.wave);
    if (result.mode === 'boss') data.bossBest = Math.max(data.bossBest || 0, result.score);
    save(data);
    showResult(result, drops);
  }, (state) => {
    const hp = app.querySelector('#hp');
    const shield = app.querySelector('#shield');
    const hpText = app.querySelector('#hp-text');
    const shieldText = app.querySelector('#shield-text');
    const score = app.querySelector('#score');
    const progress = app.querySelector('#progress');
    const power = app.querySelector('#power');
    const fusionSkill = app.querySelector('#fusion-skill');
    const buffs = app.querySelector('#buffs');
    const bossHud = app.querySelector('#boss-hud');
    const bossHp = app.querySelector('#boss-hp');
    if (hp) hp.style.width = `${Math.max(0, state.p.hp / state.p.maxHp * 100)}%`;
    if (shield) shield.style.width = `${Math.max(0, state.p.shield / state.p.maxShield * 100)}%`;
    if (hpText) hpText.textContent = `HP ${Math.ceil(Math.max(0, state.p.hp))}/${state.p.maxHp}`;
    if (shieldText) shieldText.textContent = `護盾 ${Math.ceil(Math.max(0, state.p.shield))}/${state.p.maxShield}`;
    if (score) score.textContent = `分數 ${state.score}・連擊 ${state.combo}・能量 ${Math.floor(state.p.energy)}%${mode === 'endless' ? `・星匣 ${state.chests}` : ''}`;
    if (progress) progress.textContent = state.boss ? '區域進度 100%・Boss 戰' : `區域進度 ${Math.min(99, Math.floor(state.wave / 10 * 100))}%`;
    if (power) power.textContent = `火力 Lv${state.p.fireLevel}`;
    if (fusionSkill) {
      const labels = { nova: '新星協調・合體技：新星貫流', aegis: '天穹協調・合體技：天穹壁壘', comet: '彗尾協調・合體技：彗尾超載' };
      fusionSkill.textContent = labels[state.fusion] || '';
      fusionSkill.hidden = !state.fusion;
    }
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
      if (state.boss) {
        bossHp.style.width = `${Math.max(0, state.boss.hp / state.boss.maxHp * 100)}%`;
        const label = bossHud.querySelector('b');
        if (label) label.textContent = `${state.boss.name}・第 ${state.boss.phase} 階段`;
      }
    }
  }, mode, selectedStage);
}

app.addEventListener('click', (event) => {
  const action = event.target.closest('[data-a]')?.dataset.a;
  if (!action) return;
  if (action === 'start') battleReady('stage', recommendedStage().id);
  if (action === 'retry') start();
  if (action === 'stages') stagesMenu();
  if (action === 'codex') codex();
  if (action.startsWith('sweep:')) {
    const [, stageId, rawCount] = action.split(':'); const count = Number(rawCount);
    const selected = getStage(stageId);
    if (data.stageProgress?.[stageId] && [10, 50, 100].includes(count)) {
      const gold = count * (18 + selected.order * 8);
      const materials = count * (1 + Math.floor(selected.order / 2));
      data.gold += gold; data.materials += materials; data.missions.kills += count * 3;
      data.stageProgress[stageId] = Math.max(data.stageProgress[stageId], data.stageProgress[stageId] + count);
      let equipment = '';
      if (count >= 50 || Math.random() < count / 160) {
        const candidates = equipmentTemplates.filter(item => !data.equipment.some(owned => owned.id === item.id));
        const reward = candidates[Math.floor(Math.random() * candidates.length)];
        if (reward) { data.equipment.push({ id: reward.id, level: 0, locked: false }); equipment = `${reward.quality} 裝備【${reward.name}】`; }
      }
      data.lastSweep = { stage: selected.name, count, gold, materials, kills: count * 3, equipment };
      save(data);
    }
    stagesMenu();
  }
  if (action.startsWith('battle-ready:')) {
    const [, mode, stageId, requestedBack] = action.split(':');
    const back = requestedBack || (mode === 'boss' ? 'boss' : 'stages');
    if (data.unlockedStages.includes(stageId)) battleReady(mode, stageId, back);
  }
  if (action.startsWith('ready-launch:')) {
    const [, mode, stageId] = action.split(':');
    start(mode, stageId);
  }
  if (action.startsWith('ready-back:')) {
    const target = action.split(':')[1];
    if (target === 'stages') stagesMenu();
    else if (target === 'boss') bossMenu();
    else home();
  }
  if (action.startsWith('stage:')) {
    const stageId = action.split(':')[1];
    if (data.unlockedStages.includes(stageId)) battleReady('stage', stageId, 'stages');
  }
  if (action === 'endless') start('endless');
  if (action === 'endless-claim') run?.claim();
  if (action === 'boss') bossMenu();
  if (action.startsWith('bossstage:')) {
    const stageId = action.split(':')[1];
    if (data.unlockedStages.includes(stageId)) battleReady('boss', stageId, 'boss');
  }
  if (action === 'home') home();
  if (action === 'equipment') equipment();
  if (action === 'missions') missions();
  if (action === 'fusion') fusion();
  if (action === 'ships') shipHangar();
  if (action.startsWith('ship:')) {
    const id = action.split(':')[1];
    data.unlockedShips ||= ['dawn'];
    if (data.unlockedShips.includes(id)) { data.activeShip = id; save(data); shipHangar(); }
  }
  if (action.startsWith('shipbuy:')) {
    const id = action.split(':')[1]; const ship = ships.find(item => item.id === id);
    data.unlockedShips ||= ['dawn'];
    if (ship && !data.unlockedShips.includes(id) && data.gold >= ship.unlock) { data.gold -= ship.unlock; data.unlockedShips.push(id); data.shipLevels ||= {}; data.shipLevels[id] = 1; data.activeShip = id; save(data); }
    shipHangar();
  }
  if (action.startsWith('shipupgrade:')) {
    const id = action.split(':')[1];
    const ship = ships.find(item => item.id === id);
    data.shipLevels ||= {};
    const level = Math.max(1, data.shipLevels[id] || (id === data.activeShip ? data.level : 1));
    const cost = C.upgradeCost(level);
    if (ship && data.unlockedShips?.includes(id) && level < C.maxLevel && data.gold >= cost) {
      data.gold -= cost;
      data.shipLevels[id] = level + 1;
      if (id === data.activeShip) data.level = level + 1;
      data.lastShipUpgrade = { id, name: ship.name, level: level + 1, cost, attack: Math.floor(2 * ship.attack), hp: Math.floor(5 * ship.hp), shield: Math.floor(3 * ship.shield) };
      save(data);
    }
    shipHangar();
  }
  if (action === 'pause') run?.pause();
  if (action === 'ult') run?.ultimate();
  if (action === 'upgrade') {
    const active = data.activeShip || 'dawn';
    data.shipLevels ||= {};
    const level = Math.max(1, data.shipLevels[active] || data.level || 1);
    const cost = C.upgradeCost(level);
    if (level < C.maxLevel && data.gold >= cost) { data.gold -= cost; data.shipLevels[active] = level + 1; data.level = level + 1; save(data); }
    shipHangar();
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
    if (template && data.equipment.some(item => item.id === id)) {
      const before = currentAttack(data);
      const previous = data.equipped[template.slot];
      data.equipped[template.slot] = id;
      const after = currentAttack(data);
      const oldTemplate = equipmentTemplates.find(item => item.id === previous);
      data.lastEquipmentChange = { id, name: template.name, replaced: oldTemplate?.name || '空欄位', before, after, delta: after - before };
      save(data);
      equipment(true);
    }
  }
  if (action.startsWith('enhance:')) {
    const id = action.split(':')[1]; const item = data.equipment.find(entry => entry.id === id);
    if (item) {
      const cost = 30 + item.level * 28;
      if (data.materials >= cost && item.level < 20) {
        const template = equipmentTemplates.find(entry => entry.id === id);
        const before = item.level;
        data.materials -= cost;
        item.level += 1;
        data.lastEnhance = { id, name: template?.name || id, before, after: item.level, delta: 1, cost };
        save(data);
      } else {
        data.lastEnhance = { id, name: '強化條件不足', before: item.level, after: item.level, delta: 0, cost: item.level >= 20 ? '已達上限' : `需要 ${cost}` };
      }
      equipment(true);
    }
  }
  if (action.startsWith('dismantle:')) {
    const id = action.split(':')[1]; const item = data.equipment.find(entry => entry.id === id);
    const equipped = Object.values(data.equipped).includes(id);
    if (item && !item.locked && !equipped) { data.equipment = data.equipment.filter(entry => entry.id !== id); data.materials += 8 + item.level * 2; save(data); }
    equipment(true);
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
    if (data.materials >= 25) {
      data.materials -= 25;
      const missing = equipmentTemplates.filter(template => !data.equipment.some(item => item.id === template.id));
      if (missing.length) {
        const reward = missing[Math.floor(Math.random() * missing.length)];
        data.equipment.push({ id: reward.id, level: 0, locked: false });
        data.lastCraft = { name: reward.name, quality: reward.quality, value: reward.value };
      } else {
        data.materials += 25;
        data.lastCraft = { name: '所有裝備已收集', quality: '材料已返還 +25', value: 0, failed: true };
      }
      save(data);
    } else data.lastCraft = { name: '強化材料不足', quality: '製作需要 25 強化材料', value: 0, failed: true };
    equipment(true);
  }
  if (action.startsWith('synth:')) {
    const quality = action.split(':')[1];
    const order = ['普通', '優良', '稀有', '史詩', '傳說'];
    const next = order[order.indexOf(quality) + 1];
    const candidates = data.equipment.filter(item => { const template = equipmentTemplates.find(entry => entry.id === item.id); return template?.quality === quality && !item.locked && !Object.values(data.equipped).includes(item.id); });
    if (next && candidates.length >= 3) {
      const consumed = candidates.slice(0, 3).map(item => item.id);
      data.equipment = data.equipment.filter(item => !consumed.includes(item.id));
      const pool = equipmentTemplates.filter(item => item.quality === next);
      const reward = pool[Math.floor(Math.random() * pool.length)];
      const duplicate = data.equipment.some(item => item.id === reward.id);
      if (!duplicate) data.equipment.push({ id: reward.id, level: 0, locked: false });
      else data.materials += 15;
      // 合成後立即留下可閱讀的結果卡，包含實際產物與品質。
      data.lastSynthesis = { from: quality, name: reward.name, quality: reward.quality, value: reward.value, duplicate };
      save(data);
    } else {
      data.lastSynthesis = { from: quality, name: '合成材料不足', quality: '請先準備三件未鎖定、未裝備的同品質裝備', value: 0, duplicate: false, failed: true };
    }
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
