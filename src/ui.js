import { AREAS, BOSS_PITY_LIMIT, BOSS_RECOMMENDED_POWER, CHARACTER_ROLES, DUNGEON, YELLOW_DUNGEON, ENEMIES, EXP_TO_LEVEL, INN_COST, ITEMS, QUALITY_ORDER, SLOT_NAMES } from './data.js?v=v022-pinball-prototype-1';
import { compareItem, equippedCount, getEquippedSummary, getFinalStats, getMemberPower, getTeamPower, recommendMemberForItem } from './engine.js?v=v022-pinball-prototype-1';
import { getBossRarity, getPromotionChance, RANK_TALISMAN, TALISMANS } from './boss-progression.js?v=v022-pinball-prototype-1';
import { DIVINE_TALISMANS, getBlackwindResonance, getBossGearInfo } from './boss-gear-system.js?v=v022-pinball-prototype-1';
import { WORLD_BOSS, WORLD_BOSSES, getWorldBossRecordState, getWorldBossResonance, getWorldBossState } from './world-boss-system.js?v=v022-pinball-prototype-1';
import { BLACKWIND_DROPS, CODEX_MATERIALS, COLLECTION_MILESTONES, DIVINE_CODEX_MATERIALS, WORLD_BOSS_DROPS, NETHER_WORLD_BOSS_DROPS, getCodexCompletion, getHighestRank, getKnownItemName, getMasteryProfile } from './boss-codex-system.js?v=v022-pinball-prototype-1';
import { getAvailableGearCount, getNextGearTier } from './gear-tier-system.js?v=v022-pinball-prototype-1';
import { WORLD_BOSS_BREAKTHROUGH_COSTS, canBreakthrough } from './world-boss-breakthrough.js?v=v022-pinball-prototype-1';
import { CHAPTER2_BOSSES, getChapter2Resonance } from './chapter2-system.js?v=v022-pinball-prototype-1';
import { ensureFormation, FORMATION_ORBS } from './formation-puzzle.js?v=v022-pinball-prototype-1';
import { ensureMarbleBattle, getMarbleSkill, getMarbleUltimate, getUltimateEnergy } from './marble-battle.js?v=v022-pinball-prototype-1';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const button = (action, label, className = '', disabled = false) => `<button type="button" data-action="${action}" class="${className}" ${disabled ? 'disabled' : ''}>${label}</button>`;
const hpBar = (value, max, type = '') => `<div class="meter ${type}"><i style="width:${Math.max(0, value / max * 100)}%"></i></div>`;
const qualityClass = quality => `quality-${({ '普通': 'common', '精良':'fine', '稀有': 'rare', '史詩': 'epic', '傳說': 'legendary' })[quality] || 'common'}`;
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
    ${state.unlocks.chapter2?button('screen:yellowRoad','黃巾戰區',state.screen.startsWith('yellow')?'active':''):''}
    ${state.worldBoss.unlocked ? button('screen:worldBoss', '世界王', state.screen === 'worldBoss' ? 'active' : '') : ''}
    ${button('screen:bossCodex', 'Boss 圖鑑', state.screen === 'bossCodex' ? 'active' : '')}
    ${button('screen:party', '隊伍', state.screen === 'party' ? 'active' : '')}
    ${button('screen:inventory', '背包', state.screen === 'inventory' ? 'active' : '')}
    ${button('screen:shop', '商店', state.screen === 'shop' ? 'active' : '')}
    ${button('screen:settings', '設定', state.screen === 'settings' ? 'active' : '')}
  </nav>`;
}

function village(state) {
  return `<section class="scene village-scene"><div class="scene-art" aria-hidden="true"><span class="roof"></span><span class="tree"></span></div><div class="scene-copy"><p class="eyebrow">第一章・桃園初行</p><h1>桃源村</h1><p>炊煙從茅舍升起，村外偶有野獸與山賊出沒。</p></div></section>
  <section class="panel"><h2>村內設施</h2><div class="action-grid">
    ${button('screen:plain', '出村', 'primary')}${state.unlocks.chapter2?button('screen:yellowRoad','前往黃巾戰區','primary'):''}${button('inn', `客棧・${INN_COST} 金`)}${button('screen:shop', '商店')}${button('screen:party', '隊伍')}${button('screen:inventory', '背包')}${button('screen:bossCodex','Boss 圖鑑')}${state.worldBoss.unlocked?button('screen:worldBoss','世界王祭壇','boss-button'):''}${button('save', '存檔')}
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

function yellowArea(state,areaId){
  const area=AREAS[areaId],count=Math.min(BOSS_PITY_LIMIT,state.chapter2.bossPity[areaId]||0),routes=areaId==='yellowRoad'?button('screen:yellowCamp','前往黃巾營地','primary'):areaId==='yellowCamp'?`${button('screen:yellowRoad','返回荒道')}${button('screen:yellowFortress','前往黃巾主寨','primary')}`:button('screen:yellowCamp','返回黃巾營地');
  const descriptions={yellowRoad:'第二章入門區。刀兵、盾兵與弓兵沿荒道集結。',yellowCamp:'黃巾術士與力士盤據營地，古墓入口偶爾出現。',yellowFortress:'第二章高階刷寶區，張寶與高稀有敵將可能現身。'};
  return `<section class="scene yellow-scene ${areaId}"><div class="scene-copy"><p class="eyebrow">第二章・黃巾之亂</p><h1>${area.name}</h1><div class="danger-line"><span>危險度：${dangerStars(area.danger)}</span><span>建議戰力 ${area.recommendedPower.toLocaleString()}</span></div><p>${descriptions[areaId]}</p></div></section><section class="panel"><div class="progress-heading"><h2>黃巾前線探索</h2><b>${count} / ${BOSS_PITY_LIMIT}</b></div>${hpBar(count,BOSS_PITY_LIMIT,'stronghold-progress')}<div class="action-grid three">${button('explore-once','探索一次','primary',Boolean(state.battle))}${button('auto-explore',state.exploration.auto?'自動探索中':'自動探索','',state.exploration.auto||Boolean(state.battle))}${button('stop-explore','停止探索','danger',!state.exploration.auto)}</div><div class="route-action">${routes}</div><p class="notice">${esc(state.notice)}</p></section>`;
}
const yellowRoad=state=>yellowArea(state,'yellowRoad'),yellowCamp=state=>yellowArea(state,'yellowCamp'),yellowFortress=state=>yellowArea(state,'yellowFortress');

function memberCard(state, member, index) {
  if (!member) return `<article class="member empty-slot"><span>空位</span><strong>＋加入武將</strong></article>`;
  const stats = getFinalStats(state, member);
  const equipped = getEquippedSummary(state, member.id);
  const isRecruitBoss = member.id === 'blackwind-lord' || member.bossRecruit;
  const rarity = isRecruitBoss ? getBossRarity(member.rarityRank) : member.worldBoss?{rank:5,stars:'★★★★★',name:'世界王'}:null;
  const resonance = isRecruitBoss||member.worldBoss ? resonancePanel(state, member) : '';
  const worldId=member.id==='nether-thunder-beast'?'netherThunder':'crimsonTiger';
  const progression = member.id === 'blackwind-lord' ? promotionPanel(state, member) : member.worldBoss ? breakthroughPanel(state,worldId) : '';
  const mastery = member.worldBoss ? getMasteryProfile(state,worldId) : null;
  const masteryPanel = mastery ? `<section class="mastery-box"><strong>世界王熟練 Lv.${mastery.level}</strong><span>熟練：${mastery.exp}${mastery.next ? ` / ${mastery.next}` : '（MAX）'}</span><small>${mastery.level < 2 ? '下階：最大兵力 +3%' : mastery.level < 3 ? '下階：武力 +3%' : mastery.level < 4 ? '下階：烈焰撕裂 +5%' : mastery.level < 5 ? '下階：烈焰橫掃 +10%、最大兵力再 +5%' : '熟練度已達最高'}</small></section>` : '';
  const withdraw = index>0?button(`roster-withdraw:${member.id}`,'移至待命名冊','mini'):'';
  const skill=member.id==='blackwind-lord'?'強襲':member.id==='crimson-tiger'?'赤焰撕裂／虎嘯／橫掃':member.id==='nether-thunder-beast'?'幽雷爪／九幽雷陣／天罰':member.id==='zhang-bao'?'妖雷／雷動九天':member.id==='yellow-captain'?'鐵壁／盾擊':member.id==='yellow-commander'?'破軍斬／追擊':'';
  return `<article class="member ${rarity ? `boss-rank-${rarity.rank}` : ''}"><div class="member-title"><span>${index + 1}</span><h3>${esc(member.name)}</h3><b>Lv.${member.level}</b></div>${rarity ? `<div class="leader-rarity">${rarity.stars} ${rarity.name}</div>` : ''}${hpBar(member.hp, stats.maxHp)}<p>兵力 ${member.hp}/${stats.maxHp}・技力 ${member.mp}/${member.maxMp}${skill?`・技能 ${skill}`:''}</p><dl><div><dt>武力</dt><dd>${stats.might}</dd></div><div><dt>智力</dt><dd>${member.intelligence}</dd></div><div><dt>防禦</dt><dd>${stats.defense}</dd></div><div><dt>速度</dt><dd>${stats.speed}</dd></div></dl><small>EXP ${member.exp}/${EXP_TO_LEVEL(member.level)}・戰力 ${getMemberPower(state,member).toLocaleString()}</small>${masteryPanel}${resonance}${progression}${withdraw}<div class="equipped-row">${equipped.map(entry => `<div class="slot-control"><span>${entry.slotName}：${entry.item ? `<b>${entry.item.name}</b>` : '無'}</span>${button(`party-slot:${member.id}:${entry.slot}`, `更換${entry.slotName}`, 'mini')}${entry.item ? button(`unequip:${member.id}:${entry.slot}`, '卸下', 'mini') : ''}</div>`).join('')}</div></article>`;
}

function resonancePanel(state, member) {
  if(member.worldBoss){const r=getWorldBossResonance(state,member),nether=member.id==='nether-thunder-beast';return `<section class="resonance-box"><strong>世界王共鳴</strong><span>${nether?'九幽雷鳴':'赤焰共鳴'}：${r.mightPct?'啟動':'未啟動'}</span><span>${nether?'雷甲護體':'烈焰護體'}：${r.hpPct?'啟動':'未啟動'}</span><span>${nether?'雷帝威壓':'百獸之王'}：${r.skillPct?'啟動':'未啟動'}</span><span>全套：${r.set||'尚未啟動'}</span></section>`;}
  if(CHAPTER2_BOSSES[member.id]){const r=getChapter2Resonance(state,member);return `<section class="resonance-box"><strong>專屬共鳴</strong><span>${r.set||CHAPTER2_BOSSES[member.id].resonance}：${r.set?'已啟動':'尚未啟動'}</span></section>`;}
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

function breakthroughPanel(state,id='crimsonTiger'){
  const level=getWorldBossState(state,id).breakthroughLevel||0;
  if(level>=3)return `<section class="promotion-box breakthrough-box"><strong>世界王突破：Ⅲ / Ⅲ</strong><p>已達目前突破上限</p></section>`;
  const next=level+1,cost=WORLD_BOSS_BREAKTHROUGH_COSTS[next],roman=['','Ⅰ','Ⅱ','Ⅲ'];
  const legendary=state.bossProgress.talismans.legendary||0,divine=state.bossProgress.divineTalismans.advanced||0;
  return `<section class="promotion-box breakthrough-box"><strong>世界王突破：${level?roman[level]:'未突破'} / Ⅲ</strong><p>下一階：突破${roman[next]}</p><span>傳說轉職兵符 ${legendary} / ${cost.legendary}</span><span>高階神兵符 ${divine} / ${cost.divineAdvanced}</span>${button(`world-boss:breakthrough:${id}`,'突破','primary',!canBreakthrough(state,id))}</section>`;
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
  const rosterDetails=()=>state.roster.length?`<details><summary>候補武將名冊</summary><div class="party-list">${state.roster.map(member=>memberCard(state,member,-1)).join('')}</div></details>`:'';
  const swapSlot=Number.isInteger(state.ui.partySwapSlot)?state.ui.partySwapSlot:null,current=swapSlot!=null?state.party[swapSlot]:null,sort=state.ui.candidateSort||'power';
  const candidates=[...state.roster].sort((a,b)=>sort==='level'?b.level-a.level||getMemberPower(state,b)-getMemberPower(state,a):getMemberPower(state,b)-getMemberPower(state,a)||b.level-a.level);
  const candidatePanel=swapSlot==null?'':`<section class="candidate-panel"><div class="candidate-title"><h2>${current?`更換第 ${swapSlot+1} 位・${esc(current.name)}`:`加入第 ${swapSlot+1} 位`}</h2>${button('party-swap-close','關閉','mini')}</div><div class="craft-actions">${button('party-sort:power','戰力排序',sort==='power'?'active mini':'mini')}${button('party-sort:level','等級排序',sort==='level'?'active mini':'mini')}</div><div class="candidate-list">${candidates.length?candidates.map(member=>{const delta=getMemberPower(state,member)-(current?getMemberPower(state,current):0);return `<article class="candidate-card ${member.worldBoss?'boss-rank-5':''}"><div><strong>${member.worldBoss?'★★★★★ 【世界王】 ':''}${esc(member.name)}</strong><span>Lv.${member.level}｜戰力 ${getMemberPower(state,member).toLocaleString()}</span><small>${CHARACTER_ROLES[member.id]||member.role||'武將'}｜相較 ${delta>=0?'+':''}${delta.toLocaleString()}</small></div>${button(`party-swap:${swapSlot}:${member.id}`,'立即換入','primary')}</article>`;}).join(''):'<p class="empty">目前沒有候補武將。</p>'}</div></section>`;
  const formation=state.party.map((member,index)=>{const gear=member?getEquippedSummary(state,member.id).map(x=>x.item?.name).filter(Boolean).join('／')||'無裝備':'';return `<article class="formation-slot ${member?.worldBoss?'boss-rank-5':''}"><span>第 ${index+1} 位</span>${member?`<strong>${member.worldBoss?'★★★★★ 【世界王】 ':''}${esc(member.name)}</strong><small>Lv.${member.level}｜戰力 ${getMemberPower(state,member).toLocaleString()}</small><small>${CHARACTER_ROLES[member.id]||member.role||'武將'}｜${esc(gear)}</small>${index===0&&member.isPlayer?'<b>固定</b>':button(`party-swap-open:${index}`,'更換','primary mini')}`:`<strong>空位</strong>${button(`party-swap-open:${index}`,'＋加入武將','primary')}`}</article>`;}).join('');
  return `<section class="panel party-panel"><p class="eyebrow">五格出戰隊伍＋候補武將</p><h1>隊伍</h1><div class="team-power">出戰隊伍 ${state.party.filter(Boolean).length} / 5・戰力 <b>${getTeamPower(state).toLocaleString()}</b></div><div class="quick-formation">${button('party-quick-best','快速編隊・最高戰力','primary',Boolean(state.battle))}</div><div class="formation-list">${formation}</div>${candidatePanel}${partyEquipmentPicker(state)}<details><summary>詳細能力與裝備</summary><div class="party-list">${state.party.map((member,index)=>memberCard(state,member,index)).join('')}</div></details>${rosterDetails()}</section>`;
}

const rankLabel = rank => rank ? `${getBossRarity(rank).stars} ${getBossRarity(rank).name}` : '尚無';
const codexMark = value => value ? '✓' : '✕';
function milestonePanel(state, completion) {
  return `<section class="codex-milestones"><h2>收集里程碑</h2>${Object.entries(COLLECTION_MILESTONES).map(([threshold, reward]) => { const claimed = state.collectionMilestones.claimed[threshold]; const ready = completion.overall >= Number(threshold); const labels = [...Object.entries(reward.talismans).map(([id, amount]) => `${TALISMANS[id].name} ×${amount}`), ...Object.entries(reward.divineTalismans).map(([id, amount]) => `${DIVINE_TALISMANS[id].name} ×${amount}`), ...(reward.gold ? [`金錢 ${reward.gold}`] : [])]; return `<article><strong>${threshold}%</strong><span>${labels.join('・')}</span>${button(`codex:claim:${threshold}`, claimed ? '已領取' : ready ? '領取' : '未達成', ready ? 'primary mini' : 'mini', claimed || !ready)}</article>`; }).join('')}</section>`;
}

function blackwindCodexDetail(state) {
  const data = state.bossCodex.blackwind;
  const ranks = [1,2,3,4,5].map(rank => { const record=data.ranks[rank]; return `<article class="codex-rank boss-rank-${rank}"><strong>${record.encountered ? rankLabel(rank) : '???'}</strong><span>遇過 ${codexMark(record.encountered)}</span><span>擊敗 ${codexMark(record.defeated)}</span><span>招降 ${codexMark(record.captured)}</span></article>`; }).join('');
  const drops = BLACKWIND_DROPS.map(id => `<li class="${data.drops[id] ? qualityClass(ITEMS[id].quality) : ''}">${getKnownItemName(state,id)} ${data.drops[id]?'✓':''}</li>`).join('');
  const talismans = CODEX_MATERIALS.map(id=>`<li>${data.talismans[id]?TALISMANS[id].name:'???'}</li>`).join('');
  const divine = DIVINE_CODEX_MATERIALS.map(id=>`<li>${data.divineTalismans[id]?DIVINE_TALISMANS[id].name:'???'}</li>`).join('');
  return `<section class="codex-detail"><div class="codex-title"><h2>黑風寨主</h2>${button('codex:back','返回總覽','mini')}</div><div class="codex-ranks">${ranks}</div><dl class="codex-stats"><div><dt>最高遭遇</dt><dd>${rankLabel(getHighestRank(data.ranks,'encountered'))}</dd></div><div><dt>最高擊敗</dt><dd>${rankLabel(getHighestRank(data.ranks,'defeated'))}</dd></div><div><dt>最高招降</dt><dd>${rankLabel(getHighestRank(data.ranks,'captured'))}</dd></div><div><dt>總遭遇</dt><dd>${data.encounters}</dd></div><div><dt>總擊敗</dt><dd>${data.defeats}</dd></div><div><dt>招降成功／失敗</dt><dd>${data.captures} / ${data.captureFailures}</dd></div></dl><h3>Boss 專屬裝</h3><ul class="codex-list">${drops}</ul><h3>轉職兵符</h3><ul class="codex-list">${talismans}</ul><h3>神兵符</h3><ul class="codex-list">${divine}</ul></section>`;
}

function worldCodexDetail(state) {
  const data=state.worldBossCodex,w=state.worldBoss,r=state.worldBossRecords;
  const drops=WORLD_BOSS_DROPS.map(id=>`<li class="${data.drops[id]?qualityClass(ITEMS[id].quality):''}">${getKnownItemName(state,id,true)} ${data.drops[id]?'✓':''}</li>`).join('');
  return `<section class="codex-detail world-codex"><div class="codex-title"><h2>★★★★★ 世界王・赤焰魔虎</h2>${button('codex:back','返回總覽','mini')}</div><div class="world-codex-status"><span>發現 ${codexMark(data.discovered)}</span><span>挑戰 ${codexMark(data.challenged)}</span><span>擊敗 ${codexMark(data.defeated)}</span><span>收服 ${codexMark(data.captured)}</span></div><dl class="codex-stats"><div><dt>挑戰／擊敗</dt><dd>${w.attempts} / ${w.defeats}</dd></div><div><dt>招降成功／嘗試</dt><dd>${data.captureSuccesses} / ${data.captureAttempts}</dd></div><div><dt>最佳階段</dt><dd>${w.bestPhase?`第 ${w.bestPhase} 階段`:'尚無'}</dd></div><div><dt>最低 Boss HP</dt><dd>${w.lowestHpPct}%</dd></div><div><dt>最快擊敗</dt><dd>${r.fastestRound?`${r.fastestRound} 回合`:'尚無'}</dd></div><div><dt>最高單次傷害</dt><dd>${r.highestDamage}</dd></div></dl><h3>世界王專屬裝</h3><ul class="codex-list">${drops}</ul></section>`;
}

function bossCodex(state) {
  const completion=getCodexCompletion(state),detail=state.ui.codexDetail;
  if(detail==='blackwind') return `<section class="panel codex-panel">${blackwindCodexDetail(state)}</section>`;
  if(detail==='worldBoss') return `<section class="panel codex-panel">${worldCodexDetail(state)}</section>`;
  const blackwind=state.bossCodex.blackwind, world=state.worldBossCodex;
  const chapterCards=Object.entries(CHAPTER2_BOSSES).map(([id,profile])=>{const entry=state.chapter2Codex[id];return `<article><h2>${profile.name}</h2><span>最高擊敗 ${rankLabel(getHighestRank(entry.ranks,'defeated'))}</span><span>最高招降 ${rankLabel(getHighestRank(entry.ranks,'captured'))}</span><small>專裝 ${Object.values(entry.drops).filter(Boolean).length} / 3</small></article>`;}).join(''),nether=state.worldBossCodices.netherThunder;
  return `<section class="panel codex-panel"><p class="eyebrow">長期收集目標</p><h1>Boss 圖鑑</h1><div class="codex-overall"><strong>總完成度 ${completion.overall}%</strong>${hpBar(completion.overall,100,'codex-meter')}<span>${completion.done} / ${completion.total} 項</span></div><div class="codex-summary"><span>黑風寨主 ${completion.blackwind}%</span><span>第二章 ${completion.chapter2}%</span><span>赤焰魔虎 ${completion.worldBoss}%</span><span>九幽雷獸 ${completion.netherWorldBoss}%</span><span>裝備收集 ${completion.equipment}%</span><span>材料收集 ${completion.materials}%</span></div><div class="codex-cards"><article><h2>黑風寨主</h2><p>完成度 ${completion.blackwind}%</p><span>最高擊敗 ${rankLabel(getHighestRank(blackwind.ranks,'defeated'))}</span><span>最高招降 ${rankLabel(getHighestRank(blackwind.ranks,'captured'))}</span>${button('codex:view:blackwind','查看圖鑑','primary')}</article>${chapterCards}<article class="boss-rank-5"><h2>世界王・赤焰魔虎</h2><p>完成度 ${completion.worldBoss}%</p><span>${world.defeated?'已擊敗':'未擊敗'}</span><span>${world.captured?'已收服':'未收服'}</span>${button('codex:view:worldBoss','查看圖鑑','boss-button')}</article><article class="boss-rank-5"><h2>世界王・九幽雷獸</h2><p>完成度 ${completion.netherWorldBoss}%</p><span>${nether.defeated?'已擊敗':'未擊敗'}</span><span>${nether.captured?'已收服':'未收服'}</span></article></div>${milestonePanel(state,completion)}<p class="notice">${esc(state.notice)}</p></section>`;
}

function worldBoss(state){
  const cards=Object.values(WORLD_BOSSES).map(profile=>{const w=getWorldBossState(state,profile.id),r=getWorldBossRecordState(state,profile.id),locked=!w.unlocked,status=locked?'未解鎖':w.captured?'已收服':w.defeated?'已擊敗':w.attempts?'已發現':'已解鎖';return `<article class="world-boss-card boss-rank-5 ${locked?'locked':''}"><div class="danger-stars">★★★★★</div><h2>${profile.title}</h2><strong>${status}</strong>${locked?'<p>完成第二章後解鎖</p>':`<div class="danger-line"><span>建議戰力 ${profile.recommendedPower.toLocaleString()}</span><span>目前戰力 ${getTeamPower(state).toLocaleString()}</span></div><dl><div><dt>挑戰／擊敗</dt><dd>${w.attempts} / ${w.defeats}</dd></div><div><dt>最佳階段</dt><dd>${w.bestPhase?`第 ${w.bestPhase} 階段`:'尚無'}</dd></div><div><dt>最快</dt><dd>${r.fastestRound?`${r.fastestRound} 回合`:'尚無'}</dd></div><div><dt>最高傷害</dt><dd>${r.highestDamage}</dd></div></dl>${button(`world-boss:challenge:${profile.id}`,'查看／挑戰','boss-button')}`}</article>`;}).join('');
  return `<section class="scene world-boss-scene"><div class="scene-copy"><p class="eyebrow">高難終局挑戰</p><h1>世界王祭壇</h1><p>選擇已解鎖的世界王並挑戰世界王。能力採固定數值，不會依玩家動態縮放。</p></div></section><section class="panel"><div class="world-boss-list">${cards}</div></section>`;
}

function shop(state) {
  const stock = Object.values(ITEMS).filter(item => item.shop || item.type === 'consumable');
  return `<section class="panel"><p class="eyebrow">桃源村雜貨鋪</p><h1>商店</h1><div class="shop-list">${stock.map(item => `<article><div><h3>${item.name}</h3><p>${item.description}</p><small>持有 ${state.inventory[item.id] || 0}</small></div>${button(`buy:${item.id}`, `${item.price} 金`, 'primary', state.gold < item.price)}</article>`).join('')}</div><p class="notice">${esc(state.notice)}</p></section>`;
}

function inventoryCard(state, item) {
  const owned = state.inventory[item.id] || 0;
  const equipped = equippedCount(state, item.id);
  const available = owned - equipped;
  const gear = getBossGearInfo(item.id);
  const evolution = gear?.nextId ? bossGearEvolution(state, item, gear) : item.generalGear ? generalGearEvolution(state,item) : '';
  return `<article class="inventory-item ${qualityClass(item.quality)} ${state.ui.selectedItem === item.id ? 'selected' : ''}"><div><span class="quality-label">${item.quality}</span><h3>${item.name}</h3><p>${item.description}</p><small>${SLOT_NAMES[item.slot]}・持有 ${owned}・可用 ${available}${equipped ? `・已裝備 ${equipped}` : ''}</small>${evolution}</div><div class="item-actions">${button(`quick:${item.id}`, '快速裝備', 'primary', available <= 0)}${button(`inspect:${item.id}`, '比較')}${button(`sell:${item.id}`, `出售 ${item.sell} 金`, '', available <= 0)}</div></article>`;
}

function generalGearEvolution(state,item){
  const next=getNextGearTier(item.id);if(!next)return '<div class="gear-evolution"><strong>一般裝備最高階</strong><span>史詩不可再升階</span></div>';
  const available=getAvailableGearCount(state,item.id),crafts=Math.floor(available/3);
  return `<div class="gear-evolution"><strong>同名裝備升階</strong><span>可用 ${available}・可升階 ${crafts} 次</span><small>3 件${item.quality} → 1 件${next.quality}</small><div class="craft-actions">${button(`promote-gear:${item.id}`,'升階一次','mini',crafts<1)}${button(`promote-gear-all:${item.id}`,'全部升階','primary mini',crafts<1)}</div></div>`;
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
  return `<section class="panel inventory-panel"><p class="eyebrow">共用背包・同名同階堆疊</p><div class="inventory-heading"><h1>背包裝備</h1>${button('promote-all-gear','一鍵升階可合成裝備','primary',!equipment.some(item=>item.generalGear&&getAvailableGearCount(state,item.id)>=3))}${button('optimize-equipment', '一鍵最佳裝備', 'primary', !equipment.length)}</div>${divineTalismanPanel(state)}${quickEquipPanel(state)}${comparison(state)}${changes.length ? `<div class="optimize-result"><strong>最佳化結果</strong>${changes.slice(0, 12).map(change => `<span>${esc(change)}</span>`).join('')}</div>` : ''}<div class="inventory-list">${equipment.length ? equipment.map(item => inventoryCard(state, item)).join('') : '<p class="empty">尚未取得裝備。黑風森林的敵人有機會掉落裝備。</p>'}</div><p class="notice">${esc(state.notice)}</p></section>`;
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

export function renderFormationPanel(state, battle) {
  if (!battle || battle.mode !== 'puzzle' || battle.finished) return '';
  const formation = ensureFormation(battle), boss = battle.enemies.find(enemy => enemy.boss && enemy.hp > 0) || battle.enemies.find(enemy => enemy.hp > 0);
  if (!boss) return '';
  const bossName = boss.displayName || boss.name, phase = boss.worldBoss ? `第 ${boss.phase || 1} 階段` : `回合 ${battle.round}`;
  const party = state.party.map((member,slot) => {
    if(!member)return `<span class="puzzle-member empty orb-slot-${slot+1}"><b>${slot+1}・空位</b><small>此色不會生成</small></span>`;
    const stats=getFinalStats(state,member);return `<span class="puzzle-member orb-slot-${slot+1}${member.hp<=0?' defeated':''}"><b>${slot+1}・${esc(member.name)}</b><small>兵 ${Math.max(0,member.hp)} / ${stats.maxHp}</small></span>`;
  }).join('');
  const last=battle.lastPuzzleResult,summary=last?`<div class="puzzle-last"><b>${last.combos} Combo</b><span>總傷害 ${last.totalDamage}</span>${(last.characterResults||[]).map(item=>`<span>${esc(item.name)} ${item.damage}</span>`).join('')}</div>`:'';
  if (formation.active) {
    const cells = formation.board.map((cell, i) => `<button type="button" class="formation-orb orb-${cell.type}${cell.locked ? ' locked' : ''}${cell.burning ? ' burning' : ''}" data-orb-index="${i}" aria-label="${FORMATION_ORBS[cell.type].name}${cell.locked ? '，鎖定' : ''}"><i>${FORMATION_ORBS[cell.type].icon}</i></button>`).join('');
    const log=state.log.slice(-5).map(entry=>`<span>${esc(typeof entry==='string'?entry:entry.text)}</span>`).join('');
    return `<div class="formation-overlay"><section class="formation-puzzle boss-puzzle"><header><div><p class="eyebrow">Boss 五色戰陣・${phase}</p><h2>${esc(bossName)}</h2></div><strong class="formation-time" aria-live="polite">6.0</strong></header><div class="puzzle-boss-hp"><span>Boss HP ${Math.max(0,boss.hp).toLocaleString()} / ${boss.maxHp.toLocaleString()}</span>${hpBar(boss.hp,boss.maxHp,'enemy-meter')}</div><div class="puzzle-party">${party}</div><div class="puzzle-timer-track" aria-label="轉珠剩餘時間"><i class="puzzle-timer-fill"></i></div>${summary}<p>拖曳對應編號角色珠；配對到的角色才會出手。放開或時間歸零即結算。</p><div class="formation-puzzle-board" role="grid">${cells}</div><div class="puzzle-log">${log}</div></section></div>`;
  }
  return '';
}

export function renderMarblePanel(state,battle){
  if(!battle||battle.mode!=='marble'||battle.finished)return'';const marble=ensureMarbleBattle(battle,state.party),boss=battle.enemies.find(enemy=>enemy.boss&&enemy.hp>0)||battle.enemies.find(enemy=>enemy.hp>0);if(!boss)return'';
  if(marble.phase==='pinball'){
    const team=state.party.slice(0,3).map((unit,index)=>{if(!unit)return'';const slot=marble.skills[index]||{energy:0,armed:false};return `<span class="pinball-member"><b>${esc(unit.name)}</b><i><em style="width:${slot.energy}%"></em></i><button type="button" data-pinball-skill="${index}" ${slot.energy<100?'disabled':''}>${slot.armed?'技能已備妥':slot.energy>=100?'技能':'能量 '+slot.energy+'%'}</button></span>`;}).join('');
    return `<div class="marble-overlay"><section class="marble-panel pinball-panel"><header><div><p class="eyebrow">Boss 彈射戰 Prototype</p><h2>${esc(boss.displayName||boss.name)}</h2></div><strong class="marble-hit">${marble.combo||0} HIT</strong></header><div class="marble-boss-hp"><span>Boss HP ${Math.max(0,boss.hp).toLocaleString()} / ${boss.maxHp.toLocaleString()}</span>${hpBar(boss.hp,boss.maxHp,'enemy-meter')}</div><div class="pinball-break" data-pinball-break>${marble.breakTime>0?'BREAK！傷害提升':'連續命中弱點可 BREAK'}</div><canvas class="marble-canvas" aria-label="三武將彈射 Boss 戰場"></canvas><p class="pinball-hint">點擊或觸控戰場，啟動左右彈板。</p><div class="pinball-team">${team}</div></section></div>`;
  }
  const member=state.party[marble.turnIndex],stats=member?getFinalStats(state,member):null,skill=getMarbleSkill(member),ultimate=getMarbleUltimate(member),energy=getUltimateEnergy(member),phase=boss.worldBoss?`第 ${boss.phase||1} 階段`:`回合 ${battle.round}`;
  const party=state.party.map((unit,index)=>unit?`<span class="marble-party-member${index===marble.turnIndex?' active':''}${unit.hp<=0?' defeated':''}${getUltimateEnergy(unit)>=100?' ready':''}"><b>${index+1}・${esc(unit.name)}</b><small>${Math.max(0,unit.hp)}/${getFinalStats(state,unit).maxHp}</small><i><em style="width:${getUltimateEnergy(unit)}%"></em></i><small>${getUltimateEnergy(unit)>=100?'全力一擊 READY':`全力 ${getUltimateEnergy(unit)}%`}</small></span>`:'<span class="marble-party-member empty"><b>空位</b></span>').join('');
  return `<div class="marble-overlay"><section class="marble-panel"><header><div><p class="eyebrow">武將彈射 Boss 戰・${phase}</p><h2>${esc(boss.displayName||boss.name)}</h2></div><strong class="marble-hit">${marble.shot.hits||0} HIT</strong></header><div class="marble-boss-hp"><span>Boss HP ${Math.max(0,boss.hp).toLocaleString()} / ${boss.maxHp.toLocaleString()}</span>${hpBar(boss.hp,boss.maxHp,'enemy-meter')}</div><canvas class="marble-canvas" aria-label="武將彈射戰場"></canvas><div class="marble-controls"><div class="marble-current"><b>${esc(member?.name||'')}</b><small>兵 ${member?.hp||0}/${stats?.maxHp||0}・技 ${member?.mp||0}/${member?.maxMp||0}</small></div><div class="marble-action-buttons"><button type="button" data-marble-skill class="marble-skill" ${!member||member.mp<skill.cost?'disabled':''}>${esc(skill.name)}・技 ${skill.cost}</button><button type="button" data-marble-ultimate class="marble-ultimate" ${energy<100?'disabled':''}>${energy>=100?`全力一擊 READY・${esc(ultimate.name)}`:`全力一擊 ${energy}%`}</button></div><div class="marble-meter-row"><span>POWER</span><div class="marble-meter"><i class="marble-power-fill"></i></div><strong class="marble-time">6.0</strong></div><div class="marble-meter time"><i class="marble-time-fill"></i></div><small>全力一擊需先充滿並點選，再蓄力至少 30%；80% 以上為 MAX POWER。</small></div><div class="marble-party">${party}</div></section></div>`;
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
  const recruitId=battle.worldBoss?(battle.worldBossId==='netherThunder'?'nether-thunder-beast':'crimson-tiger'):(battle.bossKind||'blackwind-lord');
  const currentLeader = [...state.party,...state.roster].find(member => member?.id === recruitId);
  const captureLabel = bossRarity ? (!currentLeader ? '招降 Boss' : bossRarity.rank > (currentLeader.rarityRank || 1) ? '招降並升格' : '招降／升格') : '';
  const noDowngrade = bossRarity && currentLeader && bossRarity.rank <= (currentLeader.rarityRank || 1) ? '<small>敵方稀有度不高於現有武將；成功時不會降階，將轉化額外金錢。</small>' : '';
  const talismanLoot = Object.entries(battle.talismanDrops || {}).map(([id, amount]) => `${TALISMANS[id].name} ×${amount}`).join('、');
  const divineLoot = Object.entries(battle.divineTalismanDrops || {}).map(([id, amount]) => `${DIVINE_TALISMANS[id].name} ×${amount}`).join('、');
  const recruitName=battle.worldBoss?WORLD_BOSSES[battle.worldBossId||'crimsonTiger'].title:battle.bossKind?CHAPTER2_BOSSES[battle.bossKind].name:'黑風寨主';
  const recruitPanel = battle.awaitingRecruit && bossRarity ? `<section class="boss-recruit-first"><p class="eyebrow">Boss Victory</p><h2>${battle.worldBoss?'★★★★★ ':`${bossRarity.stars} ${bossRarity.name}・`}${recruitName}</h2><strong>${battle.worldBoss?'收服成功率 5%':`招降成功率 ${Math.round(bossRarity.captureRate * 100)}%`}</strong>${battle.worldBoss?'':noDowngrade}<div class="battle-actions">${button('battle:recruit',battle.worldBoss?'🔥 收服世界王':captureLabel,'primary recruit-primary')}${button('battle:spare','放棄')}</div><div class="victory-loot"><b>戰利品</b><span>EXP ${battle.rewardExp||0}</span><span>金錢 ${battle.rewardGold||0}</span>${battle.dropId?`<span>裝備 ${ITEMS[battle.dropId].name}</span>`:''}${talismanLoot?`<span>${talismanLoot}</span>`:''}${divineLoot?`<span class="divine-loot">${divineLoot}</span>`:''}</div></section>`:'';
  const finishedActions = battle.awaitingRecruit ? '' : `${quickDrop}${button('battle:close', battle.result === 'victory' ? (battle.dungeon ? '結束本層' : state.exploration.auto ? '自動繼續中' : '繼續探索') : '返回桃源村', 'primary')}`;
  const bossLabel=battle.worldBoss?`★★★★★ ${WORLD_BOSSES[battle.worldBossId||'crimsonTiger'].title}`:`${bossRarity?.stars||''} ${bossRarity?.name||''}・${battle.bossKind?CHAPTER2_BOSSES[battle.bossKind].name:'黑風寨主'}`;
  const dungeonName=state.dungeon.name||DUNGEON.name;
  return `<div class="battle-overlay"><section class="battle-panel ${battle.dungeon ? 'dungeon-battle' : ''} ${battle.boss ? `boss-battle boss-rank-${bossRarity.rank}` : battle.elite ? 'elite-battle' : ''}"><div class="battle-heading"><div><p class="eyebrow">${battle.dungeon ? `${dungeonName}・第 ${battle.dungeonFloor} / 4 層・` : ''}${battle.boss ? `${bossLabel}・` : battle.elite ? '精英遭遇・' : `${AREAS[battle.areaId]?.name||''}・`}回合 ${battle.round}</p><h2>${battle.finished ? (battle.boss && battle.result === 'victory' ? `${battle.worldBoss?'世界王倒下了！':`${recruitName}已敗！`}` : battle.elite && battle.result === 'victory' ? '精英敵人擊破！' : battle.result === 'victory' ? '戰鬥勝利' : '戰鬥失敗') : battle.boss ? `${bossLabel}戰` : battle.elite ? '精英遭遇戰' : '遭遇戰'}</h2></div><span>${auto ? 'AUTO ON' : '手動'}</span></div>${recruitPanel}<div class="enemy-row">${enemies}</div><div class="versus">交 戰</div><div class="party-battle-row">${members}</div><div class="battle-log">${battleLog(state.log)}</div><div class="battle-actions">${active ? `${button('battle:attack', '普通攻擊', 'primary')}${button('battle:slam', '猛擊・技力 6', '', state.party[0].mp < 6)}${button('battle:defend', '全隊防禦')}${button('battle:potion', `回復藥 ×${state.inventory.potion || 0}`, '', !state.inventory.potion)}${state.exploration.auto ? button('battle:stop-auto', '停止自動探索', 'danger') : ''}` : finishedActions}</div></section></div>`;
}

function dungeonWarning(state) {
  if (!state.dungeon.warning) return '';
  const config=state.dungeon.dungeonId==='yellowTomb'?YELLOW_DUNGEON:DUNGEON,teamPower = getTeamPower(state),risky = teamPower < config.recommendedPower;
  return `<div class="danger-overlay dungeon-overlay"><section class="danger-card dungeon-card"><p class="eyebrow">空氣突然扭曲……</p><h2>發現未知秘境！</h2><h3>【${config.name}】</h3><dl><div><dt>危險度</dt><dd>${dangerStars(config.danger)}</dd></div><div><dt>建議戰力</dt><dd>${config.recommendedPower.toLocaleString()}</dd></div><div><dt>目前隊伍</dt><dd>${teamPower.toLocaleString()}</dd></div><div><dt>層數</dt><dd>${config.floors} 層連戰</dd></div></dl><p class="challenge-rating ${risky ? 'warning' : 'safe'}">${risky ? '⚠ 高風險・仍可進入' : '隊伍已具備挑戰實力'}</p><div class="action-grid">${button('dungeon:enter', '進入秘境', 'primary')}${button('dungeon:decline', '放棄')}</div></section></div>`;
}

function dungeonProgress(state) {
  if (!state.dungeon.active || state.battle) return '';
  const loot = state.dungeon.loot;
  const items = loot.items.map(id => ITEMS[id]?.name).filter(Boolean).join('、') || '尚無';
  const config=state.dungeon.dungeonId==='yellowTomb'?YELLOW_DUNGEON:DUNGEON;return `<div class="danger-overlay dungeon-overlay"><section class="danger-card dungeon-card"><p class="eyebrow">隨機秘境</p><h2>${config.name}</h2><div class="dungeon-floor">第 ${state.dungeon.floor} / ${config.floors} 層</div><p>危險度 ${dangerStars(config.danger)}・隊伍戰力 ${getTeamPower(state).toLocaleString()}</p>${state.dungeon.floor === 3 ? '<h3>古老寶箱已開啟</h3>' : '<h3>本層已突破</h3>'}<div class="dungeon-loot"><span>累積金錢 ${loot.gold}</span><span>回復藥 ×${loot.potion}</span><span>裝備：${esc(items)}</span></div><div class="action-grid">${button('dungeon:advance', state.dungeon.floor === 3 ? '前往最深處' : '繼續深入', 'primary')}${button('dungeon:retreat', '撤離秘境')}</div></section></div>`;
}

function bossWarning(state) {
  if (!state.ui.bossWarning) return '';
  const teamPower = getTeamPower(state);
  const rarity = getBossRarity(state.ui.bossRarityRank || 1);
  const safe = teamPower >= rarity.recommendedPower;
  const rating = safe ? '適合挑戰' : rarity.rank === 5 ? '☠️ 死亡級危險' : teamPower < rarity.recommendedPower * 0.7 ? '⚠ 極度危險' : '⚠ 危險';
  const bossName=state.ui.bossKind?ENEMIES[state.ui.bossKind]?.name:'黑風寨主';return `<div class="danger-overlay"><section class="danger-card boss-rank-${rarity.rank}"><p class="eyebrow">偵測到強大的氣息……</p><div class="danger-stars">${rarity.stars}</div><h2>${rarity.name} Boss</h2><h3>【${esc(bossName)}】</h3><dl><div><dt>你的隊伍戰力</dt><dd>${teamPower.toLocaleString()}</dd></div><div><dt>建議戰力</dt><dd>${rarity.recommendedPower.toLocaleString()}</dd></div></dl><p class="challenge-rating ${safe ? 'safe' : 'warning'}">${rating}</p><div class="action-grid">${button('boss:engage', rarity.rank === 5 ? '硬闖' : '迎戰', 'boss-button')}${button('boss:retreat', '撤退')}</div></section></div>`;
}

function worldBossConfirm(state){if(!state.ui.worldBossConfirm)return '';const profile=WORLD_BOSSES[state.ui.selectedWorldBoss]||WORLD_BOSS,risky=getTeamPower(state)<profile.recommendedPower;return `<div class="danger-overlay"><section class="danger-card boss-rank-5"><div class="danger-stars">★★★★★</div><h2>${profile.title}</h2><p class="challenge-rating warning">☠️ 極度危險</p><p>${risky?'目前戰力遠低於建議戰力，仍可硬闖。':'即將挑戰世界王。'}</p><div class="action-grid">${button('world-boss:engage','硬闖','boss-button')}${button('world-boss:cancel','取消')}</div></section></div>`;}

function chapterComplete(state) {
  if (!state.ui.chapterComplete) return '';
  const equipmentCount = Object.entries(state.inventory).reduce((sum, [id, count]) => sum + (ITEMS[id]?.type === 'equipment' ? Number(count) || 0 : 0), 0);
  return `<div class="chapter-overlay"><section class="chapter-card"><p class="eyebrow">V0.1 第一章</p><h2>第一章完成！</h2><p>黑風寨主願意追隨你，五人隊伍正式集結。</p><dl><div><dt>主角等級</dt><dd>Lv.${state.party[0].level}</dd></div><div><dt>隊伍人數</dt><dd>${state.party.filter(Boolean).length}</dd></div><div><dt>新武將</dt><dd>黑風寨主</dd></div><div><dt>擊敗敵人</dt><dd>${state.progress.totalKills}</dd></div><div><dt>取得裝備</dt><dd>${equipmentCount}</dd></div></dl>${button('chapter:continue', '繼續冒險', 'primary')}</section></div>`;
}

function chapter2Complete(state){if(!state.ui.chapter2Complete)return'';return `<div class="chapter-overlay"><section class="chapter-card"><p class="eyebrow">V0.2.0 第二章</p><h2>第二章・黃巾之亂 完成！</h2><p>地公將軍張寶已敗，世界王・九幽雷獸在祭壇甦醒。</p><dl><div><dt>通關條件</dt><dd>首次擊敗張寶</dd></div><div><dt>新世界王</dt><dd>九幽雷獸</dd></div><div><dt>黃巾主寨</dt><dd>可繼續刷寶</dd></div></dl>${button('chapter2:continue','繼續冒險','primary')}</section></div>`;}

export function render(state) {
  const views = { village, plain, forest, stronghold,yellowRoad,yellowCamp,yellowFortress, worldBoss, bossCodex, party, inventory, shop, settings },dungeonConfig=state.dungeon.dungeonId==='yellowTomb'?YELLOW_DUNGEON:DUNGEON;
  return `<div class="app-shell">${header(state)}<main>${state.dungeon.active ? `<section class="dungeon-status"><strong>${dungeonConfig.name}</strong><span>第 ${state.dungeon.floor} / ${dungeonConfig.floors} 層</span><span>危險度 ${dangerStars(dungeonConfig.danger)}</span><span>戰力 ${getTeamPower(state).toLocaleString()}</span></section>` : ''}${(views[state.screen] || village)(state)}</main>${nav(state)}${battle(state)}${bossWarning(state)}${worldBossConfirm(state)}${dungeonWarning(state)}${dungeonProgress(state)}${chapterComplete(state)}${chapter2Complete(state)}</div>`;
}

export function renderCreation() {
  return `<div class="app-shell creation"><main><section class="panel hero-create"><p class="eyebrow">V0.1 第一章</p><h1>群雄世界</h1><p>桃園豪傑將與你並肩，踏出亂世旅程的第一步。</p><form id="create-form"><label>你的角色名稱<input name="playerName" maxlength="12" minlength="1" autocomplete="nickname" required placeholder="輸入 1～12 個字"></label><button class="primary" type="submit">開始新遊戲</button></form></section></main></div>`;
}
