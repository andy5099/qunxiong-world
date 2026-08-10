import { EXP_TO_LEVEL, INN_COST, ITEMS, QUALITY_ORDER, SLOT_NAMES } from './data.js';
import { compareItem, equippedCount, getEquippedSummary, getFinalStats } from './engine.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const button = (action, label, className = '', disabled = false) => `<button type="button" data-action="${action}" class="${className}" ${disabled ? 'disabled' : ''}>${label}</button>`;
const hpBar = (value, max, type = '') => `<div class="meter ${type}"><i style="width:${Math.max(0, value / max * 100)}%"></i></div>`;
const qualityClass = quality => `quality-${quality || '普通'}`;

function header(state) {
  return `<header class="status-bar"><div><strong>${esc(state.playerName)}</strong><small>${esc(state.location)}</small></div><span>金錢 <b>${state.gold}</b></span></header>`;
}

function nav(state) {
  return `<nav class="game-nav" aria-label="主要選單">
    ${button('screen:village', '桃源村', state.screen === 'village' ? 'active' : '')}
    ${button('screen:plain', '村外平原', state.screen === 'plain' ? 'active' : '')}
    ${button('screen:forest', state.unlocks.forest ? '黑風森林' : '森林 Lv.3', state.screen === 'forest' ? 'active' : '')}
    ${button('screen:party', '隊伍', state.screen === 'party' ? 'active' : '')}
    ${button('screen:inventory', '背包', state.screen === 'inventory' ? 'active' : '')}
    ${button('screen:shop', '商店', state.screen === 'shop' ? 'active' : '')}
    ${button('screen:settings', '設定', state.screen === 'settings' ? 'active' : '')}
  </nav>`;
}

function village(state) {
  return `<section class="scene village-scene"><div class="scene-art" aria-hidden="true"><span class="roof"></span><span class="tree"></span></div><div class="scene-copy"><p class="eyebrow">第一章・桃園初行</p><h1>桃源村</h1><p>炊煙從茅舍升起，村外偶有野獸與山賊出沒。</p></div></section>
  <section class="panel"><h2>村內設施</h2><div class="action-grid">
    ${button('screen:plain', '出村', 'primary')}${button('inn', `客棧・${INN_COST} 金`)}${button('screen:shop', '商店')}${button('screen:party', '隊伍')}${button('screen:inventory', '背包')}${button('save', '存檔')}
  </div><p class="notice">${esc(state.notice)}</p></section>`;
}

function explorationPanel(state, areaId) {
  const forest = areaId === 'forest';
  const locked = forest && !state.unlocks.forest;
  return `<section class="scene ${forest ? 'forest-scene' : 'plain-scene'}"><div class="scene-copy"><p class="eyebrow">${forest ? 'Lv.3～Lv.6 探索區' : '桃源村郊外'}</p><h1>${forest ? '黑風森林' : '村外平原'}</h1><p>${locked ? '需要 Lv.3 才能進入黑風森林。' : forest ? '黑風狼、森林山賊與黃巾弓手盤據此地，勝利後有機會取得裝備。' : '野狼速度較快；山賊攻擊較高。此地不會掉落裝備。'}</p></div></section>
  <section class="panel"><h2>探索</h2><div class="action-grid three">${button('explore-once', '探索一次', 'primary', locked || Boolean(state.battle))}${button('auto-explore', state.exploration.auto ? '自動探索中' : '自動探索', '', locked || state.exploration.auto || Boolean(state.battle))}${button('stop-explore', '停止探索', 'danger', !state.exploration.auto)}</div><p class="notice">${esc(state.notice)}</p></section>`;
}

const plain = state => explorationPanel(state, 'plain');
const forest = state => explorationPanel(state, 'forest');

function memberCard(state, member, index) {
  if (!member) return `<article class="member empty-slot"><span>第五格</span><strong>空位</strong></article>`;
  const stats = getFinalStats(state, member);
  const equipped = getEquippedSummary(state, member.id);
  return `<article class="member"><div class="member-title"><span>${index + 1}</span><h3>${esc(member.name)}</h3><b>Lv.${member.level}</b></div>${hpBar(member.hp, stats.maxHp)}<p>兵力 ${member.hp}/${stats.maxHp}・技力 ${member.mp}/${member.maxMp}</p><dl><div><dt>武力</dt><dd>${stats.might}</dd></div><div><dt>智力</dt><dd>${member.intelligence}</dd></div><div><dt>防禦</dt><dd>${stats.defense}</dd></div><div><dt>速度</dt><dd>${stats.speed}</dd></div></dl><small>EXP ${member.exp}/${EXP_TO_LEVEL(member.level)}</small><div class="equipped-row">${equipped.map(entry => `<span>${entry.slotName}：${entry.item ? `<b>${entry.item.name}</b>` : '無'}</span>${entry.item ? button(`unequip:${member.id}:${entry.slot}`, '卸下', 'mini') : ''}`).join('')}</div></article>`;
}

function party(state) {
  return `<section class="panel"><p class="eyebrow">最多五人・能力已包含裝備</p><h1>隊伍</h1><div class="party-list">${state.party.map((member, index) => memberCard(state, member, index)).join('')}</div></section>`;
}

function shop(state) {
  const stock = Object.values(ITEMS).filter(item => item.shop || item.type === 'consumable');
  return `<section class="panel"><p class="eyebrow">桃源村雜貨鋪</p><h1>商店</h1><div class="shop-list">${stock.map(item => `<article><div><h3>${item.name}</h3><p>${item.description}</p><small>持有 ${state.inventory[item.id] || 0}</small></div>${button(`buy:${item.id}`, `${item.price} 金`, 'primary', state.gold < item.price)}</article>`).join('')}</div><p class="notice">${esc(state.notice)}</p></section>`;
}

function inventoryCard(state, item) {
  const owned = state.inventory[item.id] || 0;
  const equipped = equippedCount(state, item.id);
  const available = owned - equipped;
  return `<article class="inventory-item ${qualityClass(item.quality)} ${state.ui.selectedItem === item.id ? 'selected' : ''}"><div><span class="quality-label">${item.quality}</span><h3>${item.name}</h3><p>${item.description}</p><small>${SLOT_NAMES[item.slot]}・持有 ${owned}・可用 ${available}${equipped ? `・已裝備 ${equipped}` : ''}</small></div><div class="item-actions">${button(`inspect:${item.id}`, '比較')}${button(`sell:${item.id}`, `出售 ${item.sell} 金`, '', available <= 0)}</div></article>`;
}

function comparison(state) {
  const itemId = state.ui.selectedItem;
  if (!itemId) return '<p class="empty">點選裝備的「比較」，即可查看各武將目前裝備與能力差異。</p>';
  const item = ITEMS[itemId];
  if (!item || !(state.inventory[itemId] > 0)) return '<p class="empty">此裝備已不在背包。</p>';
  const memberId = state.ui.selectedMember || 'hero';
  const comparisonData = compareItem(state, memberId, itemId);
  const memberOptions = state.party.filter(Boolean).map(member => `<option value="${member.id}" ${member.id === memberId ? 'selected' : ''}>${esc(member.name)}</option>`).join('');
  return `<section class="comparison"><h2>裝備比較</h2><label>裝備給誰<select data-member-select>${memberOptions}</select></label><div class="compare-grid"><article><small>目前裝備</small><h3>${comparisonData.current?.name || '無'}</h3><p>${comparisonData.current?.description || '沒有能力加成'}</p></article><article class="${qualityClass(item.quality)}"><small>新裝備・${item.quality}</small><h3>${item.name}</h3><p>${item.description}</p></article></div><div class="difference-list">${comparisonData.differences.map(diff => `<span class="${diff.value > 0 ? 'positive' : diff.value < 0 ? 'negative' : ''}">${diff.name} ${diff.value > 0 ? '+' : ''}${diff.value}</span>`).join('')}</div>${button(`equip:${item.id}`, `裝備給${comparisonData.member.name}`, 'primary', (state.inventory[item.id] || 0) <= equippedCount(state, item.id) - (state.equipment[memberId]?.[item.slot] === item.id ? 1 : 0))}</section>`;
}

function inventory(state) {
  const equipment = Object.values(ITEMS).filter(item => item.type === 'equipment' && (state.inventory[item.id] || 0) > 0).sort((a, b) => QUALITY_ORDER[b.quality] - QUALITY_ORDER[a.quality] || a.name.localeCompare(b.name, 'zh-Hant'));
  return `<section class="panel inventory-panel"><p class="eyebrow">共用背包</p><h1>背包裝備</h1>${comparison(state)}<div class="inventory-list">${equipment.length ? equipment.map(item => inventoryCard(state, item)).join('') : '<p class="empty">尚未取得裝備。黑風森林的敵人有機會掉落裝備。</p>'}</div><p class="notice">${esc(state.notice)}</p></section>`;
}

function settings(state) {
  return `<section class="panel"><h1>設定與存檔</h1><label class="toggle"><span><strong>自動戰鬥</strong><small>戰鬥中自動普通攻擊；主角偶爾使用猛擊</small></span><input type="checkbox" data-setting="autoBattle" ${state.settings.autoBattle ? 'checked' : ''}></label><div class="action-grid">${button('save', '立即存檔', 'primary')}${button('reset', '重開新遊戲', 'danger')}</div><p class="notice">${esc(state.notice)}</p></section>`;
}

function battleLog(log) {
  return log.map(entry => {
    const normalized = typeof entry === 'string' ? { text: entry, emphasis: '' } : entry;
    return `<p class="log-${normalized.emphasis || 'normal'}">${esc(normalized.text)}</p>`;
  }).join('');
}

function battle(state) {
  const battle = state.battle;
  if (!battle) return '';
  const enemies = battle.enemies.map(enemy => `<article class="enemy ${enemy.hp <= 0 ? 'defeated' : ''}"><h3>${enemy.name}</h3>${hpBar(enemy.hp, enemy.maxHp, 'enemy-hp')}<span>${enemy.hp}/${enemy.maxHp}</span></article>`).join('');
  const members = state.party.filter(Boolean).map(member => { const stats = getFinalStats(state, member); return `<article class="battle-member ${member.hp <= 0 ? 'defeated' : ''}"><strong>${esc(member.name)}</strong><span>兵 ${member.hp}/${stats.maxHp}</span><span>技 ${member.mp}/${member.maxMp}</span></article>`; }).join('');
  const active = !battle.finished;
  const auto = state.settings.autoBattle || state.exploration.auto;
  return `<div class="battle-overlay"><section class="battle-panel"><div class="battle-heading"><div><p class="eyebrow">${battle.areaId === 'forest' ? '黑風森林・' : ''}回合 ${battle.round}</p><h2>${battle.finished ? (battle.result === 'victory' ? '戰鬥勝利' : '戰鬥失敗') : '遭遇戰'}</h2></div><span>${auto ? 'AUTO ON' : '手動'}</span></div><div class="enemy-row">${enemies}</div><div class="versus">交 戰</div><div class="party-battle-row">${members}</div><div class="battle-log">${battleLog(state.log)}</div><div class="battle-actions">${active ? `${button('battle:attack', '普通攻擊', 'primary')}${button('battle:slam', '猛擊・技力 6', '', state.party[0].mp < 6)}${button('battle:defend', '全隊防禦')}${button('battle:potion', `回復藥 ×${state.inventory.potion || 0}`, '', !state.inventory.potion)}${state.exploration.auto ? button('battle:stop-auto', '停止自動探索', 'danger') : ''}` : button('battle:close', battle.result === 'victory' ? (state.exploration.auto ? '自動繼續中' : '繼續探索') : '返回桃源村', 'primary')}</div></section></div>`;
}

export function render(state) {
  const views = { village, plain, forest, party, inventory, shop, settings };
  return `<div class="app-shell">${header(state)}<main>${(views[state.screen] || village)(state)}</main>${nav(state)}${battle(state)}</div>`;
}

export function renderCreation() {
  return `<div class="app-shell creation"><main><section class="panel hero-create"><p class="eyebrow">V0.1 第一章</p><h1>群雄世界</h1><p>桃園豪傑將與你並肩，踏出亂世旅程的第一步。</p><form id="create-form"><label>你的角色名稱<input name="playerName" maxlength="12" minlength="1" autocomplete="nickname" required placeholder="輸入 1～12 個字"></label><button class="primary" type="submit">開始新遊戲</button></form></section></main></div>`;
}
