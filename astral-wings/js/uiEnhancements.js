import { ships } from './data/ships.js?v=20260727-boss-routes-hangar-v3';
import { equipmentTemplates, fusionForms } from './data/equipment.js';

const button = (label, action, disabled = false) => `<button data-a="${action}" ${disabled ? 'disabled' : ''}>${label}</button>`;
const preview = sprite => `<div class="ship-preview sprite-${sprite}" aria-hidden="true"></div>`;

// 基地首頁將最常用的戰機庫與背包倉庫直接放在首屏，所有入口皆連到已實作功能。
export const homeDashboard = state => {
  const active = ships.find(ship => ship.id === (state.activeShip || 'dawn')) || ships[0];
  const level = Math.max(1, state.shipLevels?.[active.id] || state.level || 1);
  const owned = (state.unlockedShips || ['dawn']).length;
  const equipped = Object.values(state.equipped || {}).filter(Boolean).length;
  return `<div class="shell panel menu home-dashboard"><div class="art-banner"><div><h1>星界戰翼</h1><p>原創直向星際射擊基地</p></div></div><section class="active-craft-card">${preview(active.sprite)}<div><b>目前出戰：${active.name}</b><small>${active.role}・戰機 Lv.${level}/30</small><span>攻擊 ×${active.attack}・生命 ×${active.hp}・護盾 ×${active.shield}</span></div></section><p class="gold">金幣 ${state.gold}　強化材料 ${state.materials}　星核 ${state.fragments}　最高分 ${state.high}</p><div class="home-shortcuts">${button(`戰機庫（${owned} 架）`, 'ships')}${button(`背包倉庫（${state.equipment.length}/${equipmentTemplates.length}）`, 'equipment')}${button(`已裝備 ${equipped}/5 件`, 'equipment')}${button('合體、覺醒與進化', 'fusion')}</div><h3>戰鬥</h3><div class="home-actions">${button('主線關卡', 'stages')}${button(`無盡航線・最高波 ${state.endlessBest || 0}`, 'endless')}${button('Boss 挑戰', 'boss')}</div><h3>養成與目標</h3><div class="home-actions">${button(`升級目前戰機（${80 + level * 70} 金幣）`, 'upgrade')}${button(`戰機升星（${state.star * 5} 星核）`, 'star')}${button('任務與成就', 'missions')}${button('星域圖鑑', 'codex')}</div><div class="home-actions">${button('操作說明', 'help')}${button('重置存檔', 'reset')}</div></div>`;
};

// 機庫以階級排序；每架戰機有獨立升級等級，不會再互相覆蓋能力值。
export const upgradedShipView = state => {
  const unlocked = state.unlockedShips || ['dawn'];
  const ordered = [...ships].sort((a, b) => a.tier - b.tier || a.unlock - b.unlock);
  const levelOf = ship => Math.max(1, state.shipLevels?.[ship.id] || (ship.id === state.activeShip ? state.level : 1));
  const stat = (ship, level) => ({ atk: Math.floor((10 + level * 2) * ship.attack), hp: Math.floor((100 + level * 5) * ship.hp), shield: Math.floor((50 + level * 3) * ship.shield) });
  const upgraded = state.lastShipUpgrade;
  return `<div class="shell panel menu"><h2>戰機庫</h2><p class="note">由 I 階至 VIII 階排列。購買後可個別升級；每次升級會立即提高該戰機的攻擊、生命與護盾。</p>${upgraded ? `<section class="synthesis-notice"><b>戰機升級完成</b><span>${upgraded.name}　Lv.${upgraded.level}</span><small>攻擊 +${upgraded.attack}・生命 +${upgraded.hp}・護盾 +${upgraded.shield}（消耗 ${upgraded.cost} 金幣）</small></section>` : ''}<div class="ship-tier-list">${ordered.map(ship => { const owned = unlocked.includes(ship.id); const active = (state.activeShip || 'dawn') === ship.id; const level = levelOf(ship); const values = stat(ship, level); const next = stat(ship, Math.min(30, level + 1)); const cost = 80 + level * 70; return `<article class="equip ship-card ship-tier-${ship.tier} ${owned ? '' : 'locked'}"><div class="ship-tier">T${ship.tier}・${ship.role}</div>${preview(ship.sprite)}<b>${ship.name}</b><small>戰機 Lv.${level}/30</small><span>攻擊 ${values.atk}　生命 ${values.hp}<br>護盾 ${values.shield}　速度 ×${ship.speed}</span><em>${ship.description}</em>${owned ? `${button(active ? '目前出戰' : '設為出戰', `ship:${ship.id}`)}${button(level >= 30 ? '已達最高等級' : `升級：${cost} 金幣`, `shipupgrade:${ship.id}`, level >= 30)}<small class="upgrade-preview">下一級：攻擊 +${next.atk - values.atk}・生命 +${next.hp - values.hp}・護盾 +${next.shield - values.shield}</small>` : `${button(`購買解鎖（${ship.unlock} 金幣）`, `shipbuy:${ship.id}`)}<small>購買後由 Lv.1 開始培養</small>`}</article>`; }).join('')}</div>${button('返回工坊','fusion')}${button('返回主選單','home')}</div>`;
};

// 合體與覺醒把尚缺材料、裝備與階級直接列出，避免玩家只有看到灰色按鈕。
export const fusionStatusView = state => {
  const itemName = id => equipmentTemplates.find(item => item.id === id)?.name || id;
  const owned = id => state.equipment.some(item => item.id === id);
  const awakenCost = 16 + (state.fusionAwaken || 0) * 10;
  const evolveCost = 4 + (state.fusionEvolution || 0) * 3;
  const selected = fusionForms.find(form => form.id === state.fusion);
  return `<div class="shell panel menu"><h2>戰翼工坊</h2><div class="art-preview" aria-label="原創高階戰機視覺圖"></div><p class="note">合體需要指定兩件裝備；啟用後才可覺醒與進化，所有缺少條件都會列於下方。</p>${button('前往戰機庫','ships')}<div class="equip-grid">${fusionForms.map(form => { const missing = form.need.filter(id => !owned(id)); const ready = missing.length === 0; return `<article class="equip ${ready ? '' : 'locked'}"><b>${form.name}</b><small>需要：${form.need.map(id => `${owned(id) ? '✓' : '○'} ${itemName(id)}`).join('、')}</small><span>${form.effect}</span>${ready ? button(state.fusion === form.id ? '目前啟用' : '啟動合體', `fusion:${form.id}`) : `<em>尚缺：${missing.map(itemName).join('、')}</em>`}</article>`; }).join('')}</div><section class="requirement-card"><b>覺醒 ${state.fusionAwaken || 0}/3</b><span>${selected ? `目前合體：${selected.name}` : '尚未啟用合體型態'}</span><small>${selected ? `需求：${awakenCost} 強化材料（持有 ${state.materials}）` : '先完成任一合體，才可覺醒。'}</small>${button(`覺醒（${awakenCost} 材料）`, 'awaken', !selected || (state.fusionAwaken || 0) >= 3 || state.materials < awakenCost)}</section><section class="requirement-card"><b>進化 ${state.fusionEvolution || 0}/2</b><span>${(state.fusionAwaken || 0) >= 3 ? '覺醒已達 3 階' : `尚缺覺醒 ${3 - (state.fusionAwaken || 0)} 階`}</span><small>${selected ? `需求：覺醒 3/3、${evolveCost} 星核（持有 ${state.fragments}）` : '先啟用合體型態。'}</small>${button(`進化（${evolveCost} 星核）`, 'evolve', !selected || (state.fusionAwaken || 0) < 3 || (state.fusionEvolution || 0) >= 2 || state.fragments < evolveCost)}</section>${button('返回主選單','home')}</div>`;
};
