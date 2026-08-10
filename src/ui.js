import { EXP_TO_LEVEL, INN_COST, ITEMS } from './data.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const button = (action, label, className = '', disabled = false) => `<button type="button" data-action="${action}" class="${className}" ${disabled ? 'disabled' : ''}>${label}</button>`;
const hpBar = (value, max, type = '') => `<div class="meter ${type}"><i style="width:${Math.max(0, value / max * 100)}%"></i></div>`;

function header(state) {
  return `<header class="status-bar"><div><strong>${esc(state.playerName)}</strong><small>${esc(state.location)}</small></div><span>金錢 <b>${state.gold}</b></span></header>`;
}

function nav(state) {
  return `<nav class="game-nav" aria-label="主要選單">
    ${button('screen:village', '桃源村', state.screen === 'village' ? 'active' : '')}
    ${button('screen:plain', '村外平原', state.screen === 'plain' ? 'active' : '')}
    ${button('screen:party', '隊伍', state.screen === 'party' ? 'active' : '')}
    ${button('screen:shop', '商店', state.screen === 'shop' ? 'active' : '')}
    ${button('screen:settings', '設定', state.screen === 'settings' ? 'active' : '')}
  </nav>`;
}

function village(state) {
  return `<section class="scene village-scene"><div class="scene-art" aria-hidden="true"><span class="roof"></span><span class="tree"></span></div><div class="scene-copy"><p class="eyebrow">第一章・桃園初行</p><h1>桃源村</h1><p>炊煙從茅舍升起，村外偶有野獸與山賊出沒。</p></div></section>
  <section class="panel"><h2>村內設施</h2><div class="action-grid">
    ${button('leave-village', '出村', 'primary')}${button('inn', `客棧・${INN_COST} 金`)}${button('screen:shop', '商店')}${button('screen:party', '隊伍')}${button('save', '存檔')}
  </div><p class="notice">${esc(state.notice)}</p></section>`;
}

function plain(state) {
  return `<section class="scene plain-scene"><div class="scene-copy"><p class="eyebrow">桃源村郊外</p><h1>村外平原</h1><p>野狼速度較快；山賊攻擊較高。此地不會掉落裝備。</p></div></section>
  <section class="panel"><h2>探索</h2><div class="action-grid three">${button('explore-once', '探索一次', 'primary', Boolean(state.battle))}${button('auto-explore', state.exploration.auto ? '自動探索中' : '自動探索', '', state.exploration.auto || Boolean(state.battle))}${button('stop-explore', '停止探索', 'danger', !state.exploration.auto)}</div><p class="notice">${esc(state.notice)}</p></section>`;
}

function memberCard(member, index) {
  if (!member) return `<article class="member empty-slot"><span>第五格</span><strong>空位</strong></article>`;
  return `<article class="member"><div class="member-title"><span>${index + 1}</span><h3>${esc(member.name)}</h3><b>Lv.${member.level}</b></div>${hpBar(member.hp, member.maxHp)}<p>兵力 ${member.hp}/${member.maxHp}・技力 ${member.mp}/${member.maxMp}</p><dl><div><dt>武力</dt><dd>${member.might}</dd></div><div><dt>智力</dt><dd>${member.intelligence}</dd></div><div><dt>防禦</dt><dd>${member.defense}</dd></div><div><dt>速度</dt><dd>${member.speed}</dd></div></dl><small>EXP ${member.exp}/${EXP_TO_LEVEL(member.level)}</small></article>`;
}

function party(state) {
  return `<section class="panel"><p class="eyebrow">最多五人</p><h1>隊伍</h1><div class="party-list">${state.party.map(memberCard).join('')}</div></section>`;
}

function shop(state) {
  return `<section class="panel"><p class="eyebrow">桃源村雜貨鋪</p><h1>商店</h1><div class="shop-list">${Object.values(ITEMS).map(item => `<article><div><h3>${item.name}</h3><p>${item.description}</p><small>持有 ${state.inventory[item.id] || 0}</small></div>${button(`buy:${item.id}`, `${item.price} 金`, 'primary', state.gold < item.price)}</article>`).join('')}</div><p class="notice">${esc(state.notice)}</p></section>`;
}

function settings(state) {
  return `<section class="panel"><h1>設定與存檔</h1><label class="toggle"><span><strong>自動戰鬥</strong><small>戰鬥中自動普通攻擊；主角偶爾使用猛擊</small></span><input type="checkbox" data-setting="autoBattle" ${state.settings.autoBattle ? 'checked' : ''}></label><div class="action-grid">${button('save', '立即存檔', 'primary')}${button('reset', '重開新遊戲', 'danger')}</div><p class="notice">${esc(state.notice)}</p></section>`;
}

function battle(state) {
  const battle = state.battle;
  if (!battle) return '';
  const enemies = battle.enemies.map(enemy => `<article class="enemy ${enemy.hp <= 0 ? 'defeated' : ''}"><h3>${enemy.name}</h3>${hpBar(enemy.hp, enemy.maxHp, 'enemy-hp')}<span>${enemy.hp}/${enemy.maxHp}</span></article>`).join('');
  const members = state.party.filter(Boolean).map(member => `<article class="battle-member ${member.hp <= 0 ? 'defeated' : ''}"><strong>${esc(member.name)}</strong><span>兵 ${member.hp}/${member.maxHp}</span><span>技 ${member.mp}/${member.maxMp}</span></article>`).join('');
  const active = !battle.finished;
  return `<div class="battle-overlay"><section class="battle-panel"><div class="battle-heading"><div><p class="eyebrow">回合 ${battle.round}</p><h2>${battle.finished ? (battle.result === 'victory' ? '戰鬥勝利' : '戰鬥失敗') : '遭遇戰'}</h2></div><span>${state.settings.autoBattle ? 'AUTO ON' : '手動'}</span></div><div class="enemy-row">${enemies}</div><div class="versus">交 戰</div><div class="party-battle-row">${members}</div><div class="battle-log">${state.log.map(line => `<p>${esc(line)}</p>`).join('')}</div><div class="battle-actions">${active ? `${button('battle:attack', '普通攻擊', 'primary')}${button('battle:slam', '猛擊・技力 6', '', state.party[0].mp < 6)}${button('battle:defend', '全隊防禦')}${button('battle:potion', `回復藥 ×${state.inventory.potion || 0}`, '', !state.inventory.potion)}` : button('battle:close', battle.result === 'victory' ? '繼續探索' : '返回桃源村', 'primary')}</div></section></div>`;
}

export function render(state) {
  const views = { village, plain, party, shop, settings };
  return `<div class="app-shell">${header(state)}<main>${(views[state.screen] || village)(state)}</main>${nav(state)}${battle(state)}</div>`;
}

export function renderCreation() {
  return `<div class="app-shell creation"><main><section class="panel hero-create"><p class="eyebrow">V0.1 第一章</p><h1>群雄世界</h1><p>桃園豪傑將與你並肩，踏出亂世旅程的第一步。</p><form id="create-form"><label>你的角色名稱<input name="playerName" maxlength="12" minlength="1" autocomplete="nickname" required placeholder="輸入 1～12 個字"></label><button class="primary" type="submit">開始新遊戲</button></form></section></main></div>`;
}
