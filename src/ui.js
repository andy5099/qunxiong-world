import { AREAS, BOSS_PITY_LIMIT, BOSS_RECOMMENDED_POWER, DUNGEON, EXP_TO_LEVEL, INN_COST, ITEMS, QUALITY_ORDER, SLOT_NAMES } from './data.js?v=v015-world-boss';
import { compareItem, equippedCount, getEquippedSummary, getFinalStats, getTeamPower, recommendMemberForItem } from './engine.js?v=v015-world-boss';
import { getBossRarity, getPromotionChance, RANK_TALISMAN, TALISMANS } from './boss-progression.js?v=v014-boss-gear';
import { DIVINE_TALISMANS, getBlackwindResonance, getBossGearInfo } from './boss-gear-system.js?v=v014-boss-gear';
import { WORLD_BOSS, getWorldBossResonance } from './world-boss-system.js?v=v015-world-boss';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const button = (action, label, className = '', disabled = false) => `<button type="button" data-action="${action}" class="${className}" ${disabled ? 'disabled' : ''}>${label}</button>`;
const hpBar = (value, max, type = '') => `<div class="meter ${type}"><i style="width:${Math.max(0, value / max * 100)}%"></i></div>`;
const qualityClass = quality => `quality-${({ '普通': 'common', '稀有': 'rare', '史詩': 'epic', '傳說': 'legendary' })[quality] || 'common'}`;
const dangerStars = value => '★'.repeat(Math.max(1, Number(value) || 1));

function header(state) {
  return `<header class="status-bar"><div><strong>${esc(state.playerName)}</strong><small>${esc(state.location)}</small></div><div class="header-values"><span>戰力 <b>${getTeamPower(state).toLocaleString()}</b></span><span>金錢 <b>${state.gold}</b></span></div></header>`;
}

function nav(state) {
  return `<nav class="game-nav" aria-label="主要選單">
    ${button('screen:village', '桃源村', state.screen === 'village' ? 'active' : '')}
    ${button('screen:plain', '村外平原', state.screen === 'plain' ? 'active' : '')}
    ${button('screen:forest', state.unlocks.forest ? '黑風森林' : '森林 Lv.3', state.screen === 'forest' ? 'active' : '')}
    ${button('screen:stronghold', state.unlocks.stronghold ? '黑風寨' : '寨 Lv.5', state.screen === 'stronghold' ? 'active' : '')}
    ${state.worldBoss.unlocked ? button('screen:worldBoss', '世界王', state.screen === 'worldBoss' ? 'active' : '') : ''}
    ${button('screen:party', '隊伍', state.screen === 'party' ? 'active' : '')}
    ${button('screen:inventory', '背包', state.screen === 'inventory' ? 'active' : '')}
    ${button('screen:shop', '商店', state.screen === 'shop' ? 'active' : '')}
    ${button('screen:settings', '設定', state.screen === 'settings' ? 'active' : '')}
  </nav>`;
}

function village(state) {
  return `<section class="scene village-scene"><div class="scene-art" aria-hidden="true"><span class="roof"></span><span class="tree"></span></div><div class="scene-copy"><p class="eyebrow">第一章・桃園初行</p><h1>桃源村</h1><p>炊煙從茅舍升起，村外偶有野獸與山賊出沒。</p></div></section>
  <section class="panel"><h2>村內設施</h2><div class="action-grid">
    ${button('screen:plain', '出村', 'primary')}${button('inn', `客棧・${INN_COST} 金`)}${button('screen:shop', '商店')}${button('screen:party', '隊伍')}${button('screen:inventory', '背包')}${state.worldBoss.unlocked?button('screen:worldBoss','世界王祭壇','boss-button'):''}${button('save', '存檔')}
  </div><p class="notice">${esc(state.notice)}</p></section>`;
}

function explorationPanel(state, areaId) {
  const forest = areaId === 'forest';
  const locked = forest && !state.unlocks.forest;
  const area = AREAS[areaId];
  return `<section class="scene ${forest ? 'forest-scene' : 'plain-scene'}"><div class="scene-copy"><p class="eyebrow">${forest ? 'Lv.3～Lv.6 探索區' : '桃源村郊外'}</p><h1>${forest ? '黑風森林' : '村外平原'}</h1><div class="danger-line"><span>危險度：${dangerStars(area.danger)}</span><span>建議戰力 ${area.recommendedPower.toLocaleString()}</span></div><p>${locked ? '需要 Lv.3 才能進入黑風森林。' : forest ? '黑風狼、森林山賊與黃巾弓手盤據此地，勝利後有機會取得裝備。' : '野狼速度較快；山賊攻擊較高。此地不會掉落裝備。'}</p></div></section>
  <section class="panel"><h2>探索</h2><div class="action-grid three">${button('explore-once', '探索一次', 'primary', locked || Boolean(state.battle))}${button('auto-explore', state.exploration.auto ? '自動探索中' : '自動探索', '', locked || state.exploration.auto || Boolean(state.battle))}${button('stop-explore', '停止探索', 'danger', !state.exploration.auto)}</div>${forest ? `<div class="route-action">${button('screen:stronghold', state.unlocks.stronghold ? '前往黑風寨' : '黑風寨・Lv.5 後開放', 'primary', !state.unlocks.stronghold)}</div>` : ''}<p class="notice">${esc(state.notice)}</p></section>`;
}

const plain = state => explorationPanel(state, 'plain');
const forest = state => explorationPanel(state, 'forest');

function stronghold(state) {
  const locked = !state.unlocks.stronghold;
  const count = Math.min(BOSS_PITY_LIMIT, state.progress.bossEncounterCount || 0);
  const hint = count < 5 ? `前線偵察 ${count} / 5・暫未發現寨主` : count >= BOSS_PITY_LIMIT - 1 ? '危險氣息已逼近，下次探索必有強敵。' : `危險氣息累積中・保底進度 ${count} / ${BOSS_PITY_LIMIT}`;
  return `<section class="scene stronghold-scene"><div class="scene-copy"><p class="eyebrow">第一章決戰地</p><h1>黑風寨</h1><div class="danger-line"><span>危險度：${dangerStars(AREAS.stronghold.danger)}</span><span>建議戰力 ${AREAS.stronghold.recommendedPower.toLocaleString()}</span></div><p>${locked ? '黑風寨守衛森嚴，目前還不是進攻的時候。' : '寨兵、刀客與頭目據守山寨，強大敵將可能在探索途中突然現身。'}</p></div></section>
  <section class="panel"><div class="progress-heading"><h2>危險偵察</h2><b>${count} / ${BOSS_PITY_LIMIT}</b></div>${hpBar(count, BOSS_PITY_LIMIT, 'stronghold-progress')}<p class="boss-status">${hint}</p><div class="action-grid three">${button('explore-once', '探索一次', 'primary', locked || Boolean(state.battle))}${button('auto-explore', state.exploration.auto ? '自動探索中' : '自動探索', '', locked || state.exploration.auto || Boolean(state.battle))}${button('stop-explore', '停止探索', 'danger', !state.exploration.auto)}</div><div class="route-action">${button('screen:forest', '返回黑風森林')}</div><p class="notice">${esc(state.notice)}</p></section>`;
}

function memberCard(state, member, index) {
  if (!member) return `<article class="member empty-slot"><span>第五格</span><strong>空位</strong></article>`;
  const stats = getFinalStats(state, member);
  const equipped = getEquippedSummary(state, member.id);
  const rarity = member.id === 'blackwind-lord' ? getBossRarity(member.rarityRank) : member.id==='crimson-tiger'?{rank:5,stars:'★★★★★',name:'世界王'}:null;
  const resonance = ['blackwind-lord','crimson-tiger'].includes(member.id) ? resonancePanel(state, member) : '';
  const progression = member.id === 'blackwind-lord' ? promotionPanel(state, member) : member.id === 'crimson-tiger' ? '<section class="promotion-box"><strong>世界王武將</strong><p>已是特殊最高階，不使用一般 Boss 轉職。</p></section>' : '';
  const withdraw = member.id === 'crimson-tiger' ? button(`roster-withdraw:${member.id}`, '移至待命名冊', 'mini') : '';
  return `<article class="member ${rarity ? `boss-rank-${rarity.rank}` : ''}"><div class="member-title"><span>${index + 1}</span><h3>${esc(member.name)}</h3><b>Lv.${member.level}</b></div>${rarity ? `<div class="leader-rarity">${rarity.stars} ${rarity.name}</div>` : ''}${hpBar(member.hp, stats.maxHp)}<p>兵力 ${member.hp}/${stats.maxHp}・技力 ${member.mp}/${member.maxMp}${member.id === 'blackwind-lord' ? '・技能 強襲' : member.id === 'crimson-tiger' ? '・技能 赤焰撕裂／虎嘯／橫掃' : ''}</p><dl><div><dt>武力</dt><dd>${stats.might}</dd></div><div><dt>智力</dt><dd>${member.intelligence}</dd></div><div><dt>防禦</dt><dd>${stats.defense}</dd></div><div><dt>速度</dt><dd>${stats.speed}</dd></div></dl><small>EXP ${member.exp}/${EXP_TO_LEVEL(member.level)}・戰力 ${getTeamPower({ ...state, party: [member] }).toLocaleString()}</small>${resonance}${progression}${withdraw}<div class="equipped-row">${equipped.map(entry => `<div class="slot-control"><span>${entry.slotName}：${entry.item ? `<b>${entry.item.name}</b>` : '無'}</span>${button(`party-slot:${member.id}:${entry.slot}`, `更換${entry.slotName}`, 'mini')}${entry.item ? button(`unequip:${member.id}:${entry.slot}`, '卸下', 'mini') : ''}</div>`).join('')}</div></article>`;
}

function resonancePanel(state, member) {
  if(member.id==='crimson-tiger'){const r=getWorldBossResonance(state,member);return `<section class="resonance-box"><strong>世界王共鳴</strong><span>赤焰共鳴：${r.mightPct?'啟動':'未啟動'}</span><span>烈焰護體：${r.hpPct?'啟動':'未啟動'}</span><span>百獸之王：${r.skillPct?'啟動':'未啟動'}</span><span>全套：${r.set||'尚未啟動'}</span></section>`;}
  const r = getBlackwindResonance(state, member);
  const tier = value => value ? ['I', 'II', 'III'][value - 1] : '尚未啟動';
  return `<section class="resonance-box"><strong>專屬共鳴</strong><span>武器：黑風共鳴 ${tier(r.weaponTier)}</span><span>防具：寨主護體 ${tier(r.armorTier)}</span><span>飾品：寨主威勢 ${tier(r.accessoryTier)}</span><span>全套：${r.set || '尚未啟動'}</span></section>`;
}

function promotionPanel(state, member) {
  const rank = member.rarityRank || 1;
  const materials = Object.values(TALISMANS).map(item => `<span>${item.name.replace('轉職', '')} ×${state.bossProgress.talismans[item.id] || 0}</span>`).join('');
  const synthesis = `<div class="talisman-crafting"><strong>兵符合成</strong><div class="craft-actions">${button('combine-talisman:intermediate', '合成中階｜5 初階 → 1', 'mini', (state.bossProgress.talismans.novice || 0) < 5)}${button('combine-talisman:advanced', '合成高階｜5 中階 → 1', 'mini', (state.bossProgress.talismans.intermediate || 0) < 5)}${button('combine-talisman:legendary', '合成傳說｜5 高階 → 1', 'mini', (state.bossProgress.talismans.advanced || 0) < 5)}${button('combine-all-talismans', '全部可合成', 'primary', !Object.values(state.bossProgress.talismans).some((count, index) => index < 3 && count >= 5))}</div></div>`;
  if (rank >= 5) return `<section class="promotion-box"><strong>已達目前最高階</strong><div class="talisman-list">${materials}</div>${synthesis}</section>`;
  const talismanId = RANK_TALISMAN[rank];
  const blessing = state.bossProgress.blessings[rank] || 0;
  const chance = getPromotionChance(rank, blessing);
  return `<section class="promotion-box"><strong>下一階：${getBossRarity(rank + 1).stars} ${getBossRarity(rank + 1).name}</strong><p>需要：${TALISMANS[talismanId].name} ×1<br>成功率：${Math.round(chance * 100)}%${blessing ? `（祝福 +${Math.round(blessing * 100)}%）` : ''}</p>${button('promote-leader', '嘗試轉職', 'primary', !(state.bossProgress.talismans[talismanId] > 0))}<div class="talisman-list">${materials}</div>${synthesis}</section>`;
}

function partyEquipmentPicker(state) {
  const member = state.party.find(candidate => candidate?.id === state.ui.partyEquipMember);
  const slot = state.ui.partyEquipSlot;
  if (!member || !SLOT_NAMES[slot]) return '';
  const options = Object.values(ITEMS).filter(item => item.type === 'equipment' && item.slot === slot && (state.inventory[item.id] || 0) > equippedCount(state, item.id) - (state.equipment[member.id]?.[slot] === item.id ? 1 : 0)).sort((a, b) => getItemScoreForUi(b) - getItemScoreForUi(a));
  return `<section class="quick-panel"><h2>${esc(member.name)}・更換${SLOT_NAMES[slot]}</h2><div class="quick-list">${options.length ? options.map(item => `${button(`party-equip:${member.id}:${item.id}`, `${item.name}｜${item.description}`, qualityClass(item.quality))}`).join('') : '<p class="empty">沒有可用裝備。</p>'}</div></section>`;
}

const getItemScoreForUi = item => (item.stats?.might || 0) * 7 + (item.stats?.defense || 0) * 6 + (item.stats?.maxHp || 0) * 0.65 + (item.stats?.speed || 0) * 4;

function party(state) {
  const roster=state.roster.length?`<section class="roster-box"><h2>武將名冊・候補</h2>${state.roster.map(member=>`<article><strong>${esc(member.name)}</strong><span>${member.worldBoss?'★★★★★ 世界王':'候補武將'}・Lv.${member.level}</span><div class="craft-actions">${state.party.map((slot,index)=>button(`roster-deploy:${member.id}:${index}`,`編入第 ${index+1} 位${slot?`（替換${slot.name}）`:''}`,'mini')).join('')}</div></article>`).join('')}</section>`:'';
  return `<section class="panel"><p class="eyebrow">最多五人・能力已包含裝備</p><h1>隊伍</h1><div class="team-power">隊伍戰力 <b>${getTeamPower(state).toLocaleString()}</b></div>${partyEquipmentPicker(state)}<div class="party-list">${state.party.map((member, index) => memberCard(state, member, index)).join('')}</div>${roster}</section>`;
}

function worldBoss(state){const w=state.worldBoss;const phase=w.bestPhase?`第 ${w.bestPhase} 階段`:'尚未挑戰';return `<section class="scene world-boss-scene"><div class="scene-copy"><p class="eyebrow">第一章終局挑戰</p><h1>世界王祭壇</h1><p>烈焰深處傳來百獸之王的咆哮。</p></div></section><section class="panel world-boss-card"><div class="danger-stars">★★★★★</div><h2>世界王・赤焰魔虎</h2><div class="danger-line"><span>建議戰力 ${WORLD_BOSS.recommendedPower.toLocaleString()}</span><span>目前戰力 ${getTeamPower(state).toLocaleString()}</span></div><dl><div><dt>挑戰次數</dt><dd>${w.attempts}</dd></div><div><dt>最佳紀錄</dt><dd>${phase}</dd></div><div><dt>最低剩餘</dt><dd>${w.lowestHpPct}%</dd></div><div><dt>擊敗</dt><dd>${w.defeats?`已擊敗 ×${w.defeats}`:'未擊敗'}</dd></div><div><dt>收服</dt><dd>${w.captured?'已收服':'未收服'}</dd></div></dl>${button('world-boss:challenge','挑戰世界王','boss-button')}</section>`;}

function shop(state) {
  const stock = Object.values(ITEMS).filter(item => item.shop || item.type === 'consumable');
  return `<section class="panel"><p class="eyebrow">桃源村雜貨鋪</p><h1>商店</h1><div class="shop-list">${stock.map(item => `<article><div><h3>${item.name}</h3><p>${item.description}</p><small>持有 ${state.inventory[item.id] || 0}</small></div>${button(`buy:${item.id}`, `${item.price} 金`, 'primary', state.gold < item.price)}</article>`).join('')}</div><p class="notice">${esc(state.notice)}</p></section>`;
}

function inventoryCard(state, item) {
  const owned = state.inventory[item.id] || 0;
  const equipped = equippedCount(state, item.id);
  const available = owned - equipped;
  const gear = getBossGearInfo(item.id);
  const evolution = gear?.nextId ? bossGearEvolution(state, item, gear) : '';
  return `<article class="inventory-item ${qualityClass(item.quality)} ${state.ui.selectedItem === item.id ? 'selected' : ''}"><div><span class="quality-label">${item.quality}</span><h3>${item.name}</h3><p>${item.description}</p><small>${SLOT_NAMES[item.slot]}・持有 ${owned}・可用 ${available}${equipped ? `・已裝備 ${equipped}` : ''}</small>${evolution}</div><div class="item-actions">${button(`quick:${item.id}`, '快速裝備', 'primary', available <= 0)}${button(`inspect:${item.id}`, '比較')}${button(`sell:${item.id}`, `出售 ${item.sell} 金`, '', available <= 0)}</div></article>`;
}

function bossGearEvolution(state, item, gear) {
  const next = ITEMS[gear.nextId];
  const costs = Object.entries(gear.costs).map(([id, amount]) => `${DIVINE_TALISMANS[id].name} ${state.bossProgress.divineTalismans[id] || 0} / ${amount}`).join('・');
  const disabled = Object.entries(gear.costs).some(([id, amount]) => (state.bossProgress.divineTalismans[id] || 0) < amount);
  return `<div class="gear-evolution"><strong>Boss 專屬裝備進化</strong><span>目前：${'★'.repeat(gear.tier + 2)} ${item.quality}</span><span>下一階：${'★'.repeat(gear.tier + 3)} ${next.quality}</span><small>${costs}</small>${button(`evolve-boss-gear:${item.id}`, '進化', 'primary', disabled)}</div>`;
}

function divineTalismanPanel(state) {
  const d = state.bossProgress.divineTalismans;
  return `<section class="divine-panel"><h2>神兵符</h2><p>Boss 專屬裝備進化素材，與轉職兵符分開使用。</p><div class="talisman-list">${Object.values(DIVINE_TALISMANS).map(item => `<span>${item.name} ×${d[item.id] || 0}</span>`).join('')}</div><div class="craft-actions">${button('combine-divine:intermediate', '合成中階｜5 初階 → 1', 'mini', (d.novice || 0) < 5)}${button('combine-divine:advanced', '合成高階｜5 中階 → 1', 'mini', (d.intermediate || 0) < 5)}${button('combine-all-divine', '全部可合成', 'primary', (d.novice || 0) < 5 && (d.intermediate || 0) < 5)}</div></section>`;
}

function quickEquipPanel(state) {
  const itemId = state.ui.quickEquipItem;
  const item = ITEMS[itemId];
  const recommendation = recommendMemberForItem(state, itemId);
  if (!item || !recommendation) return '';
  const differences = compareItem(state, recommendation.member.id, itemId).differences;
  return `<section class="quick-panel"><p class="eyebrow">快速裝備推薦</p><h2>建議裝備給${esc(recommendation.member.name)}</h2><p>目前：${recommendation.current?.name || '無'}<br>更換：${item.name}</p><div class="difference-list">${differences.map(diff => `<span class="${diff.value > 0 ? 'positive' : diff.value < 0 ? 'negative' : ''}">${diff.name} ${diff.value > 0 ? '+' : ''}${diff.value}</span>`).join('')}</div>${button('quick-confirm', '確認裝備', 'primary')}</section>`;
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
  const changes = state.ui.optimizeChanges || [];
  return `<section class="panel inventory-panel"><p class="eyebrow">共用背包</p><div class="inventory-heading"><h1>背包裝備</h1>${button('optimize-equipment', '一鍵最佳裝備', 'primary', !equipment.length)}</div>${divineTalismanPanel(state)}${quickEquipPanel(state)}${comparison(state)}${changes.length ? `<div class="optimize-result"><strong>最佳化結果</strong>${changes.slice(0, 12).map(change => `<span>${esc(change)}</span>`).join('')}</div>` : ''}<div class="inventory-list">${equipment.length ? equipment.map(item => inventoryCard(state, item)).join('') : '<p class="empty">尚未取得裝備。黑風森林的敵人有機會掉落裝備。</p>'}</div><p class="notice">${esc(state.notice)}</p></section>`;
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
  const enemies = battle.enemies.map(enemy => `<article class="enemy ${enemy.elite ? 'elite-enemy' : ''} ${enemy.boss ? `boss-rank-${enemy.rarityRank || 1}` : ''} ${enemy.hp <= 0 ? 'defeated' : ''}"><small>${enemy.boss ? enemy.rarityStars : dangerStars(enemy.elite ? Math.max(2, enemy.danger || 2) : enemy.danger || 1)}</small><h3>${esc(enemy.displayName || enemy.name)}</h3>${hpBar(enemy.hp, enemy.maxHp, 'enemy-hp')}<span>${enemy.hp}/${enemy.maxHp}</span></article>`).join('');
  const members = state.party.filter(Boolean).map(member => { const stats = getFinalStats(state, member); return `<article class="battle-member ${member.hp <= 0 ? 'defeated' : ''}"><strong>${esc(member.name)}</strong><span>兵 ${member.hp}/${stats.maxHp}</span><span>技 ${member.mp}/${member.maxMp}</span></article>`; }).join('');
  const active = !battle.finished;
  const auto = state.settings.autoBattle || state.exploration.auto;
  const bossRarity = battle.boss ? getBossRarity(battle.bossRarityRank || 1) : null;
  const quickDrop = battle.dropId && ['稀有', '史詩'].includes(ITEMS[battle.dropId]?.quality) && !battle.awaitingRecruit && !battle.dungeon ? button('battle:quick-equip', '立即裝備', 'primary') : '';
  const currentLeader = state.party.find(member => member?.id === 'blackwind-lord');
  const captureLabel = bossRarity ? (!currentLeader ? '招降 Boss' : bossRarity.rank > (currentLeader.rarityRank || 1) ? '招降並升格' : '招降／升格') : '';
  const noDowngrade = bossRarity && currentLeader && bossRarity.rank <= (currentLeader.rarityRank || 1) ? '<small>敵方稀有度不高於現有武將；成功時不會降階，將轉化額外金錢。</small>' : '';
  const talismanLoot = Object.entries(battle.talismanDrops || {}).map(([id, amount]) => `${TALISMANS[id].name} ×${amount}`).join('、');
  const divineLoot = Object.entries(battle.divineTalismanDrops || {}).map(([id, amount]) => `${DIVINE_TALISMANS[id].name} ×${amount}`).join('、');
  const recruitPanel = battle.awaitingRecruit && bossRarity ? `<section class="boss-recruit-first"><p class="eyebrow">Boss Victory</p><h2>${battle.worldBoss?'★★★★★ 世界王・赤焰魔虎':`${bossRarity.stars} ${bossRarity.name}・黑風寨主`}</h2><strong>${battle.worldBoss?'收服成功率 5%':`招降成功率 ${Math.round(bossRarity.captureRate * 100)}%`}</strong>${battle.worldBoss?'':noDowngrade}<div class="battle-actions">${button('battle:recruit',battle.worldBoss?'🔥 收服世界王':captureLabel,'primary recruit-primary')}${button('battle:spare','放棄')}</div><div class="victory-loot"><b>戰利品</b><span>EXP ${battle.rewardExp||0}</span><span>金錢 ${battle.rewardGold||0}</span>${battle.dropId?`<span>裝備 ${ITEMS[battle.dropId].name}</span>`:''}${talismanLoot?`<span>${talismanLoot}</span>`:''}${divineLoot?`<span class="divine-loot">${divineLoot}</span>`:''}</div></section>`:'';
  const finishedActions = battle.awaitingRecruit ? '' : `${quickDrop}${button('battle:close', battle.result === 'victory' ? (battle.dungeon ? '結束本層' : state.exploration.auto ? '自動繼續中' : '繼續探索') : '返回桃源村', 'primary')}`;
  const bossLabel=battle.worldBoss?'★★★★★ 世界王・赤焰魔虎':`${bossRarity?.stars||''} ${bossRarity?.name||''}・黑風寨主`;
  return `<div class="battle-overlay"><section class="battle-panel ${battle.dungeon ? 'dungeon-battle' : ''} ${battle.boss ? `boss-battle boss-rank-${bossRarity.rank}` : battle.elite ? 'elite-battle' : ''}"><div class="battle-heading"><div><p class="eyebrow">${battle.dungeon ? `${DUNGEON.name}・第 ${battle.dungeonFloor} / ${DUNGEON.floors} 層・` : ''}${battle.boss ? `${bossLabel}・` : battle.elite ? '精英遭遇・' : battle.areaId === 'stronghold' ? '黑風寨・' : battle.areaId === 'forest' ? '黑風森林・' : ''}回合 ${battle.round}</p><h2>${battle.finished ? (battle.boss && battle.result === 'victory' ? `${battle.worldBoss?'世界王倒下了！':`${bossRarity.name}黑風寨主已敗！`}` : battle.elite && battle.result === 'victory' ? '精英敵人擊破！' : battle.result === 'victory' ? '戰鬥勝利' : '戰鬥失敗') : battle.boss ? `${bossLabel}戰` : battle.elite ? '精英遭遇戰' : '遭遇戰'}</h2></div><span>${auto ? 'AUTO ON' : '手動'}</span></div>${recruitPanel}<div class="enemy-row">${enemies}</div><div class="versus">交 戰</div><div class="party-battle-row">${members}</div><div class="battle-log">${battleLog(state.log)}</div><div class="battle-actions">${active ? `${button('battle:attack', '普通攻擊', 'primary')}${button('battle:slam', '猛擊・技力 6', '', state.party[0].mp < 6)}${button('battle:defend', '全隊防禦')}${button('battle:potion', `回復藥 ×${state.inventory.potion || 0}`, '', !state.inventory.potion)}${state.exploration.auto ? button('battle:stop-auto', '停止自動探索', 'danger') : ''}` : finishedActions}</div></section></div>`;
}

function dungeonWarning(state) {
  if (!state.dungeon.warning) return '';
  const teamPower = getTeamPower(state);
  const risky = teamPower < DUNGEON.recommendedPower;
  return `<div class="danger-overlay dungeon-overlay"><section class="danger-card dungeon-card"><p class="eyebrow">空氣突然扭曲……</p><h2>發現未知秘境！</h2><h3>【${DUNGEON.name}】</h3><dl><div><dt>危險度</dt><dd>${dangerStars(DUNGEON.danger)}</dd></div><div><dt>建議戰力</dt><dd>${DUNGEON.recommendedPower.toLocaleString()}</dd></div><div><dt>目前隊伍</dt><dd>${teamPower.toLocaleString()}</dd></div><div><dt>層數</dt><dd>${DUNGEON.floors} 層連戰</dd></div></dl><p class="challenge-rating ${risky ? 'warning' : 'safe'}">${risky ? '⚠ 高風險・仍可進入' : '隊伍已具備挑戰實力'}</p><div class="action-grid">${button('dungeon:enter', '進入秘境', 'primary')}${button('dungeon:decline', '放棄')}</div></section></div>`;
}

function dungeonProgress(state) {
  if (!state.dungeon.active || state.battle) return '';
  const loot = state.dungeon.loot;
  const items = loot.items.map(id => ITEMS[id]?.name).filter(Boolean).join('、') || '尚無';
  return `<div class="danger-overlay dungeon-overlay"><section class="danger-card dungeon-card"><p class="eyebrow">隨機秘境</p><h2>${DUNGEON.name}</h2><div class="dungeon-floor">第 ${state.dungeon.floor} / ${DUNGEON.floors} 層</div><p>危險度 ${dangerStars(DUNGEON.danger)}・隊伍戰力 ${getTeamPower(state).toLocaleString()}</p>${state.dungeon.floor === 3 ? '<h3>古老寶箱已開啟</h3>' : '<h3>本層已突破</h3>'}<div class="dungeon-loot"><span>累積金錢 ${loot.gold}</span><span>回復藥 ×${loot.potion}</span><span>裝備：${esc(items)}</span></div><div class="action-grid">${button('dungeon:advance', state.dungeon.floor === 3 ? '前往最深處' : '繼續深入', 'primary')}${button('dungeon:retreat', '撤離秘境')}</div></section></div>`;
}

function bossWarning(state) {
  if (!state.ui.bossWarning) return '';
  const teamPower = getTeamPower(state);
  const rarity = getBossRarity(state.ui.bossRarityRank || 1);
  const safe = teamPower >= rarity.recommendedPower;
  const rating = safe ? '適合挑戰' : rarity.rank === 5 ? '☠️ 死亡級危險' : teamPower < rarity.recommendedPower * 0.7 ? '⚠ 極度危險' : '⚠ 危險';
  return `<div class="danger-overlay"><section class="danger-card boss-rank-${rarity.rank}"><p class="eyebrow">偵測到強大的氣息……</p><div class="danger-stars">${rarity.stars}</div><h2>${rarity.name} Boss</h2><h3>【黑風寨主】</h3><dl><div><dt>你的隊伍戰力</dt><dd>${teamPower.toLocaleString()}</dd></div><div><dt>建議戰力</dt><dd>${rarity.recommendedPower.toLocaleString()}</dd></div></dl><p class="challenge-rating ${safe ? 'safe' : 'warning'}">${rating}</p><div class="action-grid">${button('boss:engage', rarity.rank === 5 ? '硬闖' : '迎戰', 'boss-button')}${button('boss:retreat', '撤退')}</div></section></div>`;
}

function worldBossConfirm(state){if(!state.ui.worldBossConfirm)return '';const risky=getTeamPower(state)<WORLD_BOSS.recommendedPower;return `<div class="danger-overlay"><section class="danger-card boss-rank-5"><div class="danger-stars">★★★★★</div><h2>世界王・赤焰魔虎</h2><p class="challenge-rating warning">☠️ 極度危險</p><p>${risky?'目前戰力遠低於建議戰力。仍然挑戰？':'即將挑戰目前最強敵人。'}</p><div class="action-grid">${button('world-boss:engage','硬闖','boss-button')}${button('world-boss:cancel','取消')}</div></section></div>`;}

function chapterComplete(state) {
  if (!state.ui.chapterComplete) return '';
  const equipmentCount = Object.entries(state.inventory).reduce((sum, [id, count]) => sum + (ITEMS[id]?.type === 'equipment' ? Number(count) || 0 : 0), 0);
  return `<div class="chapter-overlay"><section class="chapter-card"><p class="eyebrow">V0.1 第一章</p><h2>第一章完成！</h2><p>黑風寨主願意追隨你，五人隊伍正式集結。</p><dl><div><dt>主角等級</dt><dd>Lv.${state.party[0].level}</dd></div><div><dt>隊伍人數</dt><dd>${state.party.filter(Boolean).length}</dd></div><div><dt>新武將</dt><dd>黑風寨主</dd></div><div><dt>擊敗敵人</dt><dd>${state.progress.totalKills}</dd></div><div><dt>取得裝備</dt><dd>${equipmentCount}</dd></div></dl>${button('chapter:continue', '繼續冒險', 'primary')}</section></div>`;
}

export function render(state) {
  const views = { village, plain, forest, stronghold, worldBoss, party, inventory, shop, settings };
  return `<div class="app-shell">${header(state)}<main>${state.dungeon.active ? `<section class="dungeon-status"><strong>${DUNGEON.name}</strong><span>第 ${state.dungeon.floor} / ${DUNGEON.floors} 層</span><span>危險度 ${dangerStars(DUNGEON.danger)}</span><span>戰力 ${getTeamPower(state).toLocaleString()}</span></section>` : ''}${(views[state.screen] || village)(state)}</main>${nav(state)}${battle(state)}${bossWarning(state)}${worldBossConfirm(state)}${dungeonWarning(state)}${dungeonProgress(state)}${chapterComplete(state)}</div>`;
}

export function renderCreation() {
  return `<div class="app-shell creation"><main><section class="panel hero-create"><p class="eyebrow">V0.1 第一章</p><h1>群雄世界</h1><p>桃園豪傑將與你並肩，踏出亂世旅程的第一步。</p><form id="create-form"><label>你的角色名稱<input name="playerName" maxlength="12" minlength="1" autocomplete="nickname" required placeholder="輸入 1～12 個字"></label><button class="primary" type="submit">開始新遊戲</button></form></section></main></div>`;
}
