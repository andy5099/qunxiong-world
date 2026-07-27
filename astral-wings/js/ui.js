import { equipmentTemplates, slotNames, fusionForms } from './data/equipment.js';
import { ships } from './data/ships.js?v=20260727-visual-hangar-sweep';

const button = (label, action, disabled = false) => `<button data-a="${action}" ${disabled ? 'disabled' : ''}>${label}</button>`;
const stars = count => '★'.repeat(count || 0);
const equippedIds = state => Object.values(state.equipped || {});
const shipPreview = sprite => `<div class="ship-preview sprite-${sprite}" aria-hidden="true"></div>`;
const equipmentPreview = slot => `<div class="equipment-preview ${slot}" aria-hidden="true"></div>`;

export const menu = state => `<div class="shell panel menu">
  <div class="art-banner"><div><h1>星界戰翼</h1><p>原創直向星際射擊</p></div></div>
  <p class="gold">金幣 ${state.gold}　強化材 ${state.materials}　星核 ${state.fragments}　最高分 ${state.high}</p>
  <p>晨星突擊者　Lv.${state.level}　${stars(state.star)}</p>
  <h3>戰鬥</h3>${button('主線關卡','stages')}${button(`無盡航線・最高波 ${state.endlessBest || 0}`,'endless')}${button('Boss 挑戰','boss')}
  <h3>養成</h3>${button(`戰機升級（${80 + state.level * 70} 金幣）`,'upgrade')}${button(`戰機升星（${state.star * 5} 星核）`,'star')}${button('裝備、強化與合成','equipment')}${button('合體、覺醒與進化','fusion')}
  <h3>目標</h3>${button('任務與成就','missions')}${button('星域圖鑑','codex')}
  <h3>其他</h3>${button('操作說明','help')}${button('重置存檔','reset')}
</div>`;

export const stageView = (state, stages) => `<div class="shell panel menu"><h2>主線星域</h2><p class="note">通關目前區域即可解鎖下一個星域；每關都有固定波次、補給與三階段原創 Boss。</p>${state.lastSweep ? `<section class="sweep-result"><b>掃蕩結算：${state.lastSweep.stage} ×${state.lastSweep.count}</b><span>金幣 +${state.lastSweep.gold}・強化材料 +${state.lastSweep.materials}・擊殺 +${state.lastSweep.kills}</span></section>` : ''}<div class="stage-grid">${stages.map(stage => {
  const open = state.unlockedStages.includes(stage.id); const done = Boolean(state.stageProgress?.[stage.id]);
  const sweep = done ? `<div class="sweep-actions">${button('掃蕩 ×10', `sweep:${stage.id}:10`)}${button('×50', `sweep:${stage.id}:50`)}${button('×100', `sweep:${stage.id}:100`)}</div>` : '';
  return `<article class="stage-card ${open ? '' : 'locked'}"><b>${stage.name}</b><small>${stage.subtitle}</small><span>${done ? '已通關・可掃蕩' : open ? '可出擊' : `解鎖：${stage.unlock}`}</span>${button(open ? '進入關卡' : '尚未解鎖', `stage:${stage.id}`, !open)}${sweep}</article>`;
}).join('')}</div>${button('返回主選單','home')}</div>`;

export const bossView = (state, stages) => `<div class="shell panel menu"><h2>Boss 挑戰</h2><p class="note">選擇已解鎖星域的 Boss 直接挑戰。越後段的 Boss 生命更高，掉落的裝備與碎片獎勵也更豐富。</p><div class="stage-grid">${stages.map(stage => {
  const open = state.unlockedStages.includes(stage.id);
  return `<article class="stage-card ${open ? '' : 'locked'}"><div class="boss-card-art boss-${stage.order}" aria-hidden="true"></div><b>${stage.name}・${stage.boss}</b><small>${stage.subtitle}</small><span>${open ? '可挑戰・Boss 三階段' : `解鎖：${stage.unlock}`}</span>${button(open ? '挑戰 Boss' : '尚未解鎖', `bossstage:${stage.id}`, !open)}</article>`;
}).join('')}</div>${button('返回主選單','home')}</div>`;

export const equipmentView = state => {
  const enhanceNotice = state.lastEnhance
    ? `<section class="synthesis-notice"><b>強化完成</b><span>${state.lastEnhance.name}　+${state.lastEnhance.before} → +${state.lastEnhance.after}</span><small>主屬性 +${state.lastEnhance.delta}・消耗 ${state.lastEnhance.cost} 強化材料</small></section>`
    : '';
  const synthesisNotice = state.lastSynthesis
    ? `<section class="synthesis-notice ${state.lastSynthesis.failed ? 'failed' : ''}"><b>${state.lastSynthesis.failed ? '合成未完成' : '合成完成'}</b><span>${state.lastSynthesis.failed ? state.lastSynthesis.name : `${state.lastSynthesis.from} ×3 → ${state.lastSynthesis.name}`}</span><small>${state.lastSynthesis.failed ? state.lastSynthesis.quality : `${state.lastSynthesis.quality}・基礎增幅 +${state.lastSynthesis.value}${state.lastSynthesis.duplicate ? '（重複轉為強化材料 +15）' : ''}`}</small></section>`
    : '';
  const craftNotice = state.lastCraft
    ? `<section class="synthesis-notice ${state.lastCraft.failed ? 'failed' : ''}"><b>${state.lastCraft.failed ? '製作未完成' : '製作完成'}</b><span>${state.lastCraft.name}</span><small>${state.lastCraft.quality}${state.lastCraft.failed ? '' : `・基礎增幅 +${state.lastCraft.value}`}</small></section>`
    : '';
  // 倉庫只顯示實際持有的裝備，並按品質（模板戰力）與強化等級由高至低排列。
  // 未取得模板統一保留在圖鑑，避免和可穿戴物品混在一起。
  const orderedTemplates = equipmentTemplates.filter(template => state.equipment.some(entry => entry.id === template.id)).sort((left, right) => {
    const leftItem = state.equipment.find(entry => entry.id === left.id);
    const rightItem = state.equipment.find(entry => entry.id === right.id);
    const leftLevel = leftItem?.level || 0; const rightLevel = rightItem?.level || 0;
    if (left.value !== right.value) return right.value - left.value;
    if (leftLevel !== rightLevel) return rightLevel - leftLevel;
    return left.name.localeCompare(right.name, 'zh-Hant');
  });
  const cards = enhanceNotice + orderedTemplates.map(template => {
    const item = state.equipment.find(entry => entry.id === template.id);
    const equipped = state.equipped[template.slot] === template.id;
    const controls = `${button(equipped ? '已裝備' : '穿戴', `equip:${template.id}`)}${button(`強化 +${item.level}（${30 + item.level * 28} 材料）`, `enhance:${template.id}`)}${!equipped && !item.locked ? button('分解', `dismantle:${template.id}`) : ''}`;
    const change = state.lastEquipmentChange?.id === template.id ? state.lastEquipmentChange : null;
    const changeText = change ? `<small class="equipment-change ${change.delta < 0 ? 'down' : 'up'}">攻擊力 ${change.before} → ${change.after}（${change.delta >= 0 ? '+' : ''}${change.delta}）</small>` : '';
    return `<article class="equip ${item ? '' : 'locked'}">${equipmentPreview(template.slot)}<b>${template.name}</b><small>${slotNames[template.slot]}・${template.quality}</small><span>基礎增幅 +${template.value + (item?.level || 0)}</span>${changeText}${controls}</article>`;
  }).join('');
  const qualities = ['普通','優良','稀有','史詩'];
  return `<div class="shell panel menu"><h2>裝備倉庫</h2><p class="note">只顯示目前持有的裝備，依品質與強化等級排列；未取得的裝備與戰機請至星域圖鑑查看。</p>${craftNotice}${synthesisNotice}${button('製作隨機裝備（25 材料）','craft')}<h3>三件合成升階</h3>${qualities.map((q, index) => button(`${q} → ${qualities[index + 1] || '傳說'} 合成`, `synth:${q}`, index === qualities.length - 1)).join('')}<div class="equip-grid">${cards || '<p class="note">倉庫目前沒有裝備，可從關卡、掃蕩、Boss 或製作取得。</p>'}</div>${button('查看裝備圖鑑','codex')}${button('返回主選單','home')}</div>`;
};

export const missionsView = state => {
  const m = state.missions; const claimed = m.claimed || {}; const achievements = state.achievements.claimed || {};
  const row = (id, title, ready, reward, group) => `<article class="mission"><b>${title}</b><span>${reward}</span>${ready && !(group === 'daily' ? claimed[id] : achievements[id]) ? button('領取', `claim:${id}`) : `<small>${(group === 'daily' ? claimed[id] : achievements[id]) ? '已領取' : '進行中'}</small>`}</article>`;
  return `<div class="shell panel menu"><h2>任務與成就</h2><h3>每日任務</h3>${row('daily-kills',`擊敗敵機 30 / ${m.kills || 0}`,m.kills >= 30,'80 金幣','daily')}${row('daily-stage',`完成關卡 1 / ${m.stages || 0}`,m.stages >= 1,'4 強化材料','daily')}${row('daily-boss',`擊敗 Boss 1 / ${m.bosses || 0}`,m.bosses >= 1,'2 星核','daily')}<h3>成就</h3>${row('ach-first','首次通關',state.complete,'150 金幣','achievement')}${row('ach-combo',`最高連擊 25 / ${state.maxCombo}`,state.maxCombo >= 25,'8 強化材料','achievement')}${row('ach-endless',`無盡抵達第 10 波 / ${state.endlessBest || 0}`,state.endlessBest >= 10,'3 星核','achievement')}${button('返回主選單','home')}</div>`;
};

export const fusionView = state => `<div class="shell panel menu"><h2>戰翼工坊</h2><div class="art-preview" aria-label="原創 AI 戰機與敵機設計圖"></div><p class="note">合體僅在持有對應組件時可啟動；覺醒與進化會套用到出戰戰機。</p>${button('戰機庫與機體定位','ships')}<div class="equip-grid">${fusionForms.map(form => { const ready = form.need.every(id => state.equipment.some(item => item.id === id)); return `<article class="equip ${ready ? '' : 'locked'}"><b>${form.name}</b><small>${form.need.join(' + ')}</small><span>${form.effect}</span>${ready ? button(state.fusion === form.id ? '目前啟用' : '啟動合體', `fusion:${form.id}`) : '<em>缺少組件</em>'}</article>`; }).join('')}</div><p>覺醒 ${state.fusionAwaken}/3　進化 ${state.fusionEvolution}/2</p>${button(`覺醒（${16 + state.fusionAwaken * 10} 材料）`,'awaken')}${button(`進化（${4 + state.fusionEvolution * 3} 星核）`,'evolve')}${button('返回主選單','home')}</div>`;

export const shipView = state => {
  const ownedShips = ships.filter(ship => (state.unlockedShips || ['dawn']).includes(ship.id));
  return `<div class="shell panel menu"><h2>戰機庫</h2><p class="note">只顯示目前擁有的戰機；未解鎖機體會收藏在星域圖鑑中，取得後才會出現在此處。</p><div class="equip-grid">${ownedShips.map(ship => { const active = (state.activeShip || 'dawn') === ship.id; return `<article class="equip ship-card">${shipPreview(ship.sprite)}<b>${ship.name}</b><small>${ship.role}</small><span>攻擊 ×${ship.attack}・生命 ×${ship.hp}<br>護盾 ×${ship.shield}・速度 ×${ship.speed}</span><em>${ship.description}</em>${button(active ? '目前出戰' : '設為出戰', `ship:${ship.id}`)}</article>`; }).join('')}</div>${button('查看戰機圖鑑','codex')}${button('返回工坊','fusion')}${button('返回主選單','home')}</div>`;
};

export const codexView = (state, stages) => {
  const ownedShips = state.unlockedShips || ['dawn'];
  const equipmentCards = equipmentTemplates.map(template => {
    const owned = state.equipment.some(item => item.id === template.id);
    return `<article class="equip ${owned ? '' : 'locked'}">${equipmentPreview(template.slot)}<b>${owned ? template.name : '未發現裝備'}</b><small>${slotNames[template.slot]}・${owned ? template.quality : '???'}</small><span>${owned ? `基礎增幅 +${template.value}` : '完成關卡、Boss 或製作即可取得'}</span></article>`;
  }).join('');
  const shipCards = ships.map(ship => {
    const owned = ownedShips.includes(ship.id);
    return `<article class="equip ship-card ${owned ? '' : 'locked'}">${shipPreview(ship.sprite)}<b>${owned ? ship.name : '未發現戰機'}</b><small>${owned ? ship.role : '等待解鎖'}</small><span>${owned ? ship.description : `需要 ${ship.unlock} 金幣購買或從關卡獲得`}</span>${owned ? '<em>已收入戰機庫</em>' : button(`購買並收入戰機庫（${ship.unlock} 金幣）`, `shipbuy:${ship.id}`)}</article>`;
  }).join('');
  return `<div class="shell panel menu"><h2>星域圖鑑</h2><div class="art-preview compact" aria-label="原創 AI 星際機體設計圖"></div><h3>航線紀錄</h3>${stages.map(entry => `<article class="mission"><b>${entry.name}</b><span>${state.unlockedStages.includes(entry.id) ? '已發現・Boss：' + entry.boss : '尚未發現'}</span></article>`).join('')}<h3>戰機圖鑑・${ownedShips.length} / ${ships.length}</h3><div class="equip-grid">${shipCards}</div><h3>裝備圖鑑・${state.equipment.length} / ${equipmentTemplates.length}</h3><div class="equip-grid">${equipmentCards}</div>${button('返回主選單','home')}</div>`;
};
