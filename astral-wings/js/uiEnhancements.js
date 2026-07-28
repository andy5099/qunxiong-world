import { ships } from './data/ships.js?v=20260727-boss-routes-hangar-v3';
import { equipmentTemplates, fusionForms, slotNames } from './data/equipment.js';
import { stages } from './data/stages.js';

const button = (label, action, disabled = false) => `<button class="ui-button action-${action.split(':')[0]}" data-a="${action}" ${disabled ? 'disabled' : ''}><i aria-hidden="true"></i><span>${label}</span></button>`;
const preview = sprite => `<div class="ship-preview sprite-${sprite}" aria-hidden="true"></div>`;

const qualityMark = quality => ({ '普通': 'I', '優良': 'II', '稀有': 'III', '史詩': 'IV', '傳說': 'V', '神話': 'VI' }[quality] || '•');
const equipmentOf = (state, slot) => {
  const id = state.equipped?.[slot];
  const template = equipmentTemplates.find(item => item.id === id);
  const owned = state.equipment?.find(item => item.id === id);
  return template ? { ...template, level: owned?.level || 0 } : null;
};

/**
 * Mobile Home Hub: intentionally uses existing save data only.  It is a visual
 * adapter around the original game state rather than a second profile system.
 */
export const mobileHomeHub = state => {
  const active = ships.find(ship => ship.id === (state.activeShip || 'dawn')) || ships[0];
  const level = Math.max(1, state.shipLevels?.[active.id] || state.level || 1);
  const unlocked = stages.filter(stage => state.unlockedStages?.includes(stage.id));
  const stage = unlocked[unlocked.length - 1] || stages[0];
  const equippedCount = Object.values(state.equipped || {}).filter(Boolean).length;
  const power = Math.floor((active.attack * (10 + level * 2) + active.hp + active.shield) * (1 + (state.star || 1) * 0.12));
  const slots = ['weapon', 'secondary', 'armor', 'engine', 'core'];
  const nav = (label, icon, action, activeNav = false) => `<button class="hub-nav ${activeNav ? 'is-active' : ''}" data-a="${action}"><i class="hub-icon ${icon}" aria-hidden="true"></i><span>${label}</span></button>`;
  return `<main class="mobile-shell home-hub" aria-label="星界戰翼機庫">
    <div class="hub-space" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    <header class="hub-topbar">
      <button class="hub-profile" data-a="ships"><span class="hub-avatar">✦</span><span><b>${active.name}</b><small>駕駛員 Lv.${level}</small></span></button>
      <div class="hub-currency"><span title="金幣">◈ ${state.gold || 0}</span><span title="強化材料">✧ ${state.materials || 0}</span></div>
    </header>
    <section class="hub-hero">
      <div class="hub-planet" aria-hidden="true"></div>
      <div class="hub-ship-bay"><div class="hub-ship-glow"></div>${preview(active.sprite)}<i class="hub-engine-flame left"></i><i class="hub-engine-flame right"></i></div>
      <div class="hub-ship-copy"><span>ACTIVE CRAFT</span><h1>${active.name}</h1><p>${active.role}・${active.description}</p></div>
      <div class="hub-power"><i>⚡</i><span>戰力</span><b>${power.toLocaleString()}</b><small>Lv.${level}　★ ${state.star || 1}</small></div>
    </section>
    <button class="hub-event" data-a="battle-ready:stage:${stage.id}:home"><span class="event-orbit" aria-hidden="true"></span><span><small>主線行動</small><b>${stage.name}</b><em>${stage.subtitle}</em></span><strong>戰前整備　›</strong></button>
    <section class="hub-loadout-strip" aria-label="目前裝備">${slots.map(slot => {
      const item = equipmentOf(state, slot);
      return `<button class="hub-loadout ${item ? 'has-item' : ''}" data-a="equipment"><i class="loadout-icon slot-${slot}">${item ? qualityMark(item.quality) : '＋'}</i><span>${slotNames[slot] || slot}</span><small>${item ? `${item.name} +${item.level}` : '未裝備'}</small></button>`;
    }).join('')}</section>
    <section class="hub-actions" aria-label="主要功能">
      <button class="hub-primary-action" data-a="battle-ready:stage:${stage.id}:home"><i class="hub-icon launch" aria-hidden="true"></i><span><small>MISSION READY</small><b>開始戰鬥</b></span><em>›</em></button>
      <div class="hub-quick-grid">
        <button data-a="ships"><i class="hub-icon craft"></i><span>戰機庫</span></button>
        <button data-a="equipment"><i class="hub-icon equipment"></i><span>裝備庫</span></button>
        <button data-a="upgrade"><i class="hub-icon enhance"></i><span>強化</span></button>
        <button data-a="boss"><i class="hub-icon boss"></i><span>Boss 挑戰</span></button>
        <button data-a="missions"><i class="hub-icon mission"></i><span>任務</span></button>
        <button data-a="codex"><i class="hub-icon codex"></i><span>圖鑑</span></button>
      </div>
    </section>
    <footer class="hub-nav-bar">${nav('主頁', 'home', 'home', true)}${nav('關卡', 'stage', 'stages')}${nav('出擊', 'launch', `battle-ready:stage:${stage.id}:home`)}${nav('機庫', 'craft', 'ships')}${nav('裝備', 'equipment', 'equipment')}</footer>
    <span class="hub-progress">主線進度 ${unlocked.length}/${stages.length}　｜　已裝備 ${equippedCount}/5</span>
  </main>`;
};

/** Battle Ready is a screen adapter: ready values are calculated by main.js from live save data. */
export const battleReadyView = (state, stage, ready) => {
  const active = ships.find(ship => ship.id === (state.activeShip || 'dawn')) || ships[0];
  const slots = ['weapon', 'secondary', 'armor', 'engine', 'core'];
  const loadout = slots.map(slot => {
    const item = equipmentOf(state, slot);
    return `<article class="ready-loadout"><i class="loadout-icon slot-${slot}">${item ? qualityMark(item.quality) : '＋'}</i><span>${slotNames[slot] || slot}</span><b>${item?.name || '未裝備'}</b><small>${item ? `+${item.level}　${item.quality}` : '可在裝備庫配置'}</small></article>`;
  }).join('');
  return `<main class="mobile-shell ready-hub" aria-label="戰前整備">
    <header class="ready-header"><button class="back-button" data-a="ready-back:${ready.back}">‹</button><div><small>${ready.mode === 'boss' ? 'BOSS CHALLENGE' : 'STAGE BRIEFING'}</small><h1>戰前整備</h1></div><button class="ready-hangar" data-a="equipment">⌘</button></header>
    <section class="ready-boss-card" style="--boss-color:${ready.boss.color}"><div class="ready-threat-grid" aria-hidden="true"></div><div class="ready-boss-art"><i class="boss-wing left"></i><i class="boss-core"></i><i class="boss-wing right"></i></div><div class="ready-boss-copy"><small>目標 Boss</small><h2>${ready.boss.name}</h2><p>${stage.name}・三階段攻擊模式</p></div><span class="ready-danger">THREAT ${Math.min(99, 18 + stage.order * 7)}</span></section>
    <section class="ready-recommend"><div><small>推薦戰力</small><b>${ready.recommendation.toLocaleString()}</b></div><div class="ready-power ${ready.power >= ready.recommendation ? 'ready' : ''}"><small>目前戰力</small><b>${ready.power.toLocaleString()}</b><span>${ready.power >= ready.recommendation ? '配置完成' : '可先強化'}</span></div></section>
    <section class="ready-craft"><div class="ready-craft-visual">${preview(active.sprite)}</div><div><small>出戰戰機</small><b>${active.name}</b><p>Lv.${ready.level}　★ ${state.star || 1}　${active.role}</p></div><button data-a="ships">更換</button></section>
    <section class="ready-section"><header><h3>戰鬥配置</h3><button data-a="equipment">編輯 ›</button></header><div class="ready-loadout-grid">${loadout}</div></section>
    <section class="ready-section ready-rewards"><header><h3>預計掉落</h3><span>通關後結算</span></header><div>${ready.drops.map(drop => `<article class="ready-drop ${drop.kind}"><i>${drop.icon}</i><b>${drop.name}</b><small>${drop.detail}</small></article>`).join('')}</div></section>
    <section class="ready-tips"><i>◌</i><span>可用手指、滑鼠或 WASD 控制戰機；戰鬥中自動射擊。</span></section>
    <footer class="ready-footer"><button class="ready-cancel" data-a="ready-back:${ready.back}">返回</button><button class="ready-launch" data-a="ready-launch:${ready.mode}:${stage.id}"><i>✦</i><span>開始戰鬥<small>不消耗體力</small></span></button></footer>
  </main>`;
};

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
