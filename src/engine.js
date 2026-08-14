import { AREAS, BOSS_PITY_LIMIT, BOSS_RECOMMENDED_POWER, DUNGEON, YELLOW_DUNGEON, ENEMIES, EXP_TO_LEVEL, INN_COST, ITEMS, SLOT_NAMES, STAT_NAMES, createBlackwindLeader } from './data.js?v=v020-yellow-turban';
import { applyLeaderRarity, createRarityBoss, getBossRarity, getCaptureRate, rollBossRarity, rollTalismanDrops, TALISMANS } from './boss-progression.js?v=v014-boss-gear';
import { DIVINE_TALISMANS, getBlackwindResonance, getBossGearInfo, rollDivineTalismanDrops } from './boss-gear-system.js?v=v014-boss-gear';
import { WORLD_BOSS, WORLD_BOSSES, addWorldBossToRoster, createWorldBossEnemy, getWorldBossMasteryState, getWorldBossRecordState, getWorldBossResonance, getWorldBossState } from './world-boss-system.js?v=v020-yellow-turban';
import { awardWorldBossMastery, getMasteryProfile, recordBlackwindCapture, recordBlackwindDefeat, recordBlackwindEncounter, recordItemDrop, recordMaterials } from './boss-codex-system.js?v=v017-growth';
import { getBreakthroughProfile } from './world-boss-breakthrough.js?v=v017-growth';
import { CHAPTER2_BOSSES, getChapter2Resonance, recordChapter2Boss, recruitChapter2Boss, spareChapter2Boss } from './chapter2-system.js?v=v020-yellow-turban';
import { ensureFormation, preparePuzzleTurn, settleFormationPuzzle, startFormationPuzzle } from './formation-puzzle.js?v=v021-puzzle-polish';

const alive = unit => unit && unit.hp > 0;
const randomInt = (min, max, rng = Math.random) => Math.floor(rng() * (max - min + 1)) + min;
const pick = (list, rng = Math.random) => list[Math.min(list.length - 1, Math.floor(rng() * list.length))];
const appendLog = (state, text, emphasis = '') => { state.log.push({ text, emphasis }); state.log = state.log.slice(-60); };

export function getMember(state, memberId) { return state.party.find(member => member?.id === memberId) || null; }

export function getFinalStats(state, memberOrId) {
  const member = typeof memberOrId === 'string' ? getMember(state, memberOrId) : memberOrId;
  if (!member) return null;
  const result = { might: member.might, defense: member.defense, maxHp: member.maxHp, speed: member.speed };
  const slots = state.equipment?.[member.id] || {};
  for (const itemId of Object.values(slots)) {
    const item = ITEMS[itemId];
    if (!item?.stats) continue;
    for (const [stat, value] of Object.entries(item.stats)) result[stat] = (result[stat] || 0) + value;
  }
  const resonance = getBlackwindResonance(state, member);
  const worldResonance = getWorldBossResonance(state, member);
  const chapterResonance=getChapter2Resonance(state,member);
  const worldId=member.id==='nether-thunder-beast'?'netherThunder':member.id==='crimson-tiger'?'crimsonTiger':null;
  const mastery = worldId ? getMasteryProfile(state,worldId) : { mightPct: 0, hpPct: 0 };
  const breakthrough = worldId ? getBreakthroughProfile(getWorldBossState(state,worldId).breakthroughLevel) : {mightPct:0,hpPct:0,defensePct:0,speedPct:0};
  result.might = Math.round(result.might * (1 + resonance.mightPct + worldResonance.mightPct + chapterResonance.mightPct + mastery.mightPct + breakthrough.mightPct));
  result.defense = Math.round(result.defense * (1 + resonance.defensePct + worldResonance.defensePct + chapterResonance.defensePct + breakthrough.defensePct));
  result.maxHp = Math.round(result.maxHp * (1 + resonance.hpPct + worldResonance.hpPct + chapterResonance.hpPct + mastery.hpPct + breakthrough.hpPct));
  result.speed = Math.round(result.speed * (1 + resonance.speedPct + worldResonance.speedPct + chapterResonance.speedPct + breakthrough.speedPct));
  return result;
}

export function getMemberPower(state, memberOrId) {
  const member = typeof memberOrId === 'string' ? getMember(state, memberOrId) : memberOrId;
  const stats = getFinalStats(state, member);
  if (!member || !stats) return 0;
  return Math.round(member.level * 34 + stats.might * 7 + stats.defense * 6 + stats.maxHp * 0.65 + stats.speed * 4);
}

export function getTeamPower(state) {
  return state.party.filter(Boolean).reduce((sum, member) => sum + getMemberPower(state, member), 0);
}

export function getItemScore(item) {
  if (!item?.stats) return 0;
  return (item.stats.might || 0) * 7 + (item.stats.defense || 0) * 6 + (item.stats.maxHp || 0) * 0.65 + (item.stats.speed || 0) * 4;
}

export function createEliteEnemy(base, index = 0) {
  return {
    ...base,
    instanceId: `${base.id}-elite-${index}`,
    name: `精英・${base.name}`,
    displayName: `精英・${base.name}`,
    maxHp: Math.round(base.maxHp * 1.65),
    hp: Math.round(base.maxHp * 1.65),
    might: Math.round(base.might * 1.3),
    defense: base.defense + 3,
    exp: Math.round(base.exp * 2),
    gold: base.gold.map(value => Math.round(value * 1.8)),
    elite: true,
    danger: Math.min(3, (AREAS[base.areaId]?.danger || 1) + 1),
    guarding: false,
    side: 'enemy'
  };
}

export function getBossEncounterChance(count) {
  if (count < 6) return 0;
  if (count >= BOSS_PITY_LIMIT) return 1;
  return Math.min(0.19, 0.05 + (count - 6) * 0.01);
}

export function checkBossEncounter(state, rng = Math.random, rarityRng = rng, areaId=state.screen) {
  const chapterArea=['yellowRoad','yellowCamp','yellowFortress'].includes(areaId),counter=chapterArea?state.chapter2.bossPity:state.progress;
  const key=chapterArea?areaId:'bossEncounterCount';counter[key]=Math.max(0,Number(counter[key])||0)+1;
  const chance = getBossEncounterChance(counter[key]);
  if (!chance || rng() >= chance) return false;
  counter[key] = 0;
  state.progress.bossEncounters = (state.progress.bossEncounters || 0) + 1;
  state.exploration.auto = false;
  state.exploration.active = false;
  state.ui.bossWarning = true;
  state.ui.bossRarityRank = rollBossRarity(rarityRng).rank;
  if(chapterArea)state.ui.bossKind=pick(AREAS[areaId].bossPool,rarityRng);
  state.notice = '偵測到強大的氣息……';
  return true;
}

export function getDungeonEncounterChance(count) {
  const safeCount = Math.max(0, Number(count) || 0);
  return Math.min(0.28, DUNGEON.baseChance + Math.max(0, safeCount - DUNGEON.pityStart) * 0.025);
}

export function rollDungeonBossRarity(rng = Math.random,chances=DUNGEON.bossRarityChances) {
  const roll = rng();
  let cumulative = 0;
  for (let rank = 1; rank <= 5; rank += 1) {
    cumulative += chances[rank - 1];
    if (roll < cumulative) return rank;
  }
  return 5;
}

export function checkDungeonEncounter(state, rng = Math.random) {
  if (!['forest', 'stronghold','yellowCamp','yellowFortress'].includes(state.screen) || state.battle || state.ui.bossWarning || state.dungeon.warning || state.dungeon.active) return false;
  const config=['yellowCamp','yellowFortress'].includes(state.screen)?YELLOW_DUNGEON:DUNGEON;
  state.dungeon.pity = Math.max(0, Number(state.dungeon.pity) || 0) + 1;
  const chance=Math.min(.30,config.baseChance+Math.max(0,state.dungeon.pity-config.pityStart)*.025);
  if (rng() >= chance) return false;
  state.dungeon.warning = true;
  state.dungeon.sourceScreen = state.screen;
  state.dungeon.sourceLocation = state.location;
  state.dungeon.pity = 0;
  state.dungeon.dungeonId=config.id;state.dungeon.name=config.name;
  state.exploration.auto = false;
  state.exploration.active = false;
  state.ui.bossWarning = false;
  state.ui.bossRarityRank = null;
  state.notice = '空氣突然扭曲……發現未知秘境！';
  return true;
}

function dungeonEnemy(baseId, elite, index) {
  const base = ENEMIES[baseId];
  if (elite) {
    const enemy = createEliteEnemy({ ...base, areaId: 'stronghold' }, index);
    enemy.maxHp = Math.round(enemy.maxHp * 1.15);
    enemy.hp = enemy.maxHp;
    enemy.might = Math.round(enemy.might * 1.12);
    enemy.defense += 2;
    return enemy;
  }
  return { ...base, instanceId: `dungeon-${baseId}-${index}`, hp: base.maxHp, guarding: false, side: 'enemy', danger: 4 };
}

export function createDungeonFloor(state, forcedRank, rng = Math.random) {
  if (!state.dungeon.active || state.battle || state.dungeon.awaitingAdvance) return null;
  const floor = state.dungeon.floor;
  if (floor === 3) return openDungeonChest(state, rng);
  let enemies;
  const yellow=state.dungeon.dungeonId==='yellowTomb',config=yellow?YELLOW_DUNGEON:DUNGEON;
  if (floor === 4) {
    const rank = forcedRank || rollDungeonBossRarity(rng,config.bossRarityChances);
    const bossId=yellow?pick(AREAS[state.dungeon.sourceScreen]?.bossPool||['yellowCaptainBoss'],rng):'blackwindLord';
    const baseBoss = createRarityBoss(ENEMIES[bossId], rank);
    const boost = 1.15;
    const boss = { ...baseBoss, maxHp: Math.round(baseBoss.maxHp * boost), might: Math.round(baseBoss.might * boost), defense: Math.round(baseBoss.defense * 1.12), speed: Math.round(baseBoss.speed * 1.1), exp: Math.round(baseBoss.exp * 1.25), gold: baseBoss.gold.map(value => Math.round(value * 1.25)), assaultMultiplier: baseBoss.assaultMultiplier * 1.12 };
    boss.hp = boss.maxHp;
    enemies = [{ ...boss, instanceId: `dungeon-${bossId}`, mp: boss.maxMp, guarding: false, side: 'enemy' }];
    state.battle = { enemies, round: 1, awaitingCommand: false, finished: false, mode:'puzzle', areaId: state.dungeon.sourceScreen, boss: true, bossKind:boss.bossKind||null, dungeon: true, dungeonFloor: 4, bossRarityRank: rank, awaitingRecruit: false, recommendedPower: Math.round(boss.recommendedPower * 1.15) };
    preparePuzzleTurn(state.battle,state.party,rng);
    if(yellow)recordChapter2Boss(state,boss.bossKind,rank,'encounter');else recordBlackwindEncounter(state, rank);
  } else {
    const pool = yellow?(floor===1?['yellowBladeSoldier','yellowShieldSoldier','yellowBowSoldier']:['yellowWarlock','yellowBrute','yellowBowSoldier']):(floor === 1 ? ['blackwindWolf', 'forestBandit', 'yellowTurbanArcher'] : ['blackwindSwordsman', 'blackwindCaptain', 'yellowTurbanArcher']);
    const count = floor === 1 ? 2 : 2;
    enemies = Array.from({ length: count }, (_, index) => dungeonEnemy(pick(pool, rng), floor === 2 || rng() < 0.72, index));
    state.battle = { enemies, round: 1, awaitingCommand: true, finished: false, mode:'text', areaId: state.dungeon.sourceScreen, boss: false, elite: enemies.some(enemy => enemy.elite), dungeon: true, dungeonFloor: floor };
  }
  state.party.filter(Boolean).forEach(member => { member.guarding = false; });
  state.log = [];
  appendLog(state, `${config.name}・第 ${floor} 層戰鬥開始！`, floor === 4 ? 'epic' : 'rare');
  return state.battle;
}

export function enterDungeon(state, rng = Math.random) {
  if (!state.dungeon.warning || state.battle || state.ui.bossWarning) return false;
  state.dungeon.warning = false;
  state.dungeon.active = true;
  state.dungeon.floor = 1;
  state.dungeon.awaitingAdvance = false;
  state.dungeon.completed = false;
  state.dungeon.loot = { gold: 0, potion: 0, items: [], talismans: {} };
  state.exploration.auto = false;
  state.exploration.active = false;
  state.notice = `進入${state.dungeon.name}，連戰期間兵力與技力不會自動恢復。`;
  return Boolean(createDungeonFloor(state, null, rng));
}

export function declineDungeon(state) {
  if (!state.dungeon.warning) return false;
  state.dungeon.warning = false;
  state.dungeon.active = false;
  state.dungeon.floor = 0;
  state.dungeon.awaitingAdvance = false;
  state.battle = null;
  state.exploration.auto = false;
  state.exploration.active = false;
  state.notice = `你放棄了${state.dungeon.name}，隨時可以重新探索。`;
  return true;
}

export function openDungeonChest(state, rng = Math.random) {
  if (!state.dungeon.active || state.dungeon.floor !== 3 || state.battle) return null;
  const gold = randomInt(180, 320, rng);
  const potions = 1 + (rng() < 0.35 ? 1 : 0);
  state.gold += gold;
  state.inventory.potion = (state.inventory.potion || 0) + potions;
  state.dungeon.loot.gold += gold;
  state.dungeon.loot.potion += potions;
  if (rng() < 0.22) {
    const itemId = rng() < 0.18 ? 'overlordBlade' : pick(['greenEdgeSword', 'ironArmor', 'copperRing'], rng);
    state.inventory[itemId] = (state.inventory[itemId] || 0) + 1;
    state.dungeon.loot.items.push(itemId);
    recordItemDrop(state, itemId);
  }
  if (rng() < 0.18) {
    const talismanId = rng() < 0.22 ? 'advanced' : 'intermediate';
    state.bossProgress.talismans[talismanId] = (state.bossProgress.talismans[talismanId] || 0) + 1;
    state.dungeon.loot.talismans[talismanId] = (state.dungeon.loot.talismans[talismanId] || 0) + 1;
    recordMaterials(state, { [talismanId]: 1 });
  }
  state.dungeon.awaitingAdvance = true;
  state.notice = `第 3 層寶箱：金錢 ${gold}、回復藥 ×${potions}。`;
  return { gold, potions };
}

export function settleDungeonBattle(state) {
  if (!state.battle?.dungeon || !state.battle.finished || state.battle.result !== 'victory' || state.battle.awaitingRecruit) return false;
  state.battle = null;
  state.log = [];
  state.dungeon.awaitingAdvance = true;
  state.notice = `第 ${state.dungeon.floor} 層已突破。可繼續深入或帶著戰利品撤離。`;
  return true;
}

export function advanceDungeon(state, rng = Math.random) {
  if (!state.dungeon.active || !state.dungeon.awaitingAdvance || state.battle || state.dungeon.floor >= DUNGEON.floors) return false;
  state.dungeon.floor += 1;
  state.dungeon.awaitingAdvance = false;
  if (state.dungeon.floor === 3) return Boolean(openDungeonChest(state, rng));
  return Boolean(createDungeonFloor(state, null, rng));
}

export function exitDungeon(state, completed = false) {
  const sourceScreen = ['forest', 'stronghold','yellowCamp','yellowFortress'].includes(state.dungeon.sourceScreen) ? state.dungeon.sourceScreen : 'forest';
  const sourceLocation = state.dungeon.sourceLocation || AREAS[sourceScreen].name;
  state.battle = null;
  state.log = [];
  state.dungeon.warning = false;
  state.dungeon.active = false;
  state.dungeon.floor = 0;
  state.dungeon.awaitingAdvance = false;
  state.dungeon.completed = Boolean(completed);
  state.screen = sourceScreen;
  state.location = sourceLocation;
  state.exploration.auto = false;
  state.exploration.active = false;
  state.ui.bossWarning = false;
  state.ui.bossRarityRank = null;
  state.notice = completed ? '秘境攻略完成！已帶著全部戰利品返回。' : '已安全撤離秘境，取得的戰利品全部保留。';
  return true;
}

export function visitInn(state) {
  if (state.gold < INN_COST) return { ok: false, message: `金錢不足，客棧需要 ${INN_COST} 金。` };
  state.gold -= INN_COST;
  state.party.filter(Boolean).forEach(member => { member.hp = getFinalStats(state, member).maxHp; member.mp = member.maxMp; });
  state.notice = `全隊已在客棧休息，兵力與技力完全恢復。-${INN_COST} 金`;
  return { ok: true, message: state.notice };
}

export function buyItem(state, itemId) {
  const item = ITEMS[itemId];
  if (!item || item.price == null || state.gold < item.price) return { ok: false, message: '金錢不足。' };
  state.gold -= item.price;
  state.inventory[itemId] = (state.inventory[itemId] || 0) + 1;
  state.notice = `購買了 ${item.name}。`;
  return { ok: true, message: state.notice };
}

export function refreshUnlocks(state) {
  if (!state.unlocks.forest && state.party[0]?.level >= 3) {
    state.unlocks.forest = true;
    state.notice = '主角已達 Lv.3，黑風森林開放！';
    appendLog(state, '黑風森林已解鎖。', 'rare');
    return true;
  }
  if (!state.unlocks.stronghold && state.party[0]?.level >= 5 && state.progress.forestEntered) {
    state.unlocks.stronghold = true;
    state.notice = '黑風寨已解鎖！';
    appendLog(state, '黑風寨已解鎖！', 'epic');
    return true;
  }
  if(!state.unlocks.chapter2&&state.progress.chapterOneComplete){state.unlocks.chapter2=true;state.chapter2.unlocked=true;state.progress.chapter2Unlocked=true;state.notice='第二章・黃巾之亂已解鎖！';return true;}
  return false;
}

export function canEnterArea(state, areaId) {
  if (areaId === 'forest') return state.unlocks.forest || state.party[0]?.level >= AREAS.forest.level;
  if (areaId === 'stronghold') return Boolean(state.unlocks.stronghold);
  if(['yellowRoad','yellowCamp','yellowFortress'].includes(areaId))return Boolean(state.unlocks.chapter2||state.progress.chapterOneComplete);
  return true;
}

export function enterArea(state, areaId) {
  if (!AREAS[areaId]) return false;
  refreshUnlocks(state);
  if (!canEnterArea(state, areaId)) {
    state.notice = ['yellowRoad','yellowCamp','yellowFortress'].includes(areaId)?'完成第一章後才能前往黃巾戰區。':areaId === 'stronghold' ? '黑風寨守衛森嚴，目前還不是進攻的時候。' : '需要 Lv.3 才能進入黑風森林。';
    return false;
  }
  state.screen = areaId;
  state.location = AREAS[areaId].name;
  if (areaId === 'forest') state.progress.forestEntered = true;
  refreshUnlocks(state);
  if(areaId==='yellowRoad')state.chapter2.areas.yellowRoad=true;if(areaId==='yellowCamp')state.chapter2.areas.yellowCamp=true;if(areaId==='yellowFortress')state.chapter2.areas.yellowFortress=true;
  state.notice = areaId === 'forest' ? '林間黑風盤旋，新的敵人與裝備正在等待。' : areaId === 'stronghold' ? '你已攻入黑風寨，危險敵將可能隨時現身。' : areaId.startsWith('yellow')?'黃巾軍席捲各地，更強的敵人正在前方集結。':'你來到桃源村外的平原。';
  return true;
}

export function createEncounter(state, forcedId, rng = Math.random) {
  if (state.battle || state.ui.bossWarning || state.dungeon.warning || state.dungeon.active) return null;
  const area = Object.values(AREAS).find(candidate => candidate.name === state.location) || AREAS.plain;
  if (!forcedId && checkDungeonEncounter(state, rng)) return null;
  if (!forcedId && (area.id === 'stronghold'||area.bossPool) && checkBossEncounter(state, rng,rng,area.id)) return null;
  const id = forcedId || pick(area.enemies, rng);
  const base = ENEMIES[id];
  if (!base) return null;
  const canBeElite = !forcedId && area.id !== 'plain';
  const elite = canBeElite && rng() < 0.1;
  const count = elite ? 1 : area.id === 'plain' ? (id === 'wolf' ? randomInt(2, 3, rng) : randomInt(1, 2, rng)) : randomInt(1, 2, rng);
  const enemies = elite
    ? [createEliteEnemy({ ...base, areaId: area.id })]
    : Array.from({ length: count }, (_, index) => ({ ...base, instanceId: `${id}-${index}`, hp: base.maxHp, guarding: false, side: 'enemy', danger: area.danger }));
  state.party.filter(Boolean).forEach(member => { member.guarding = false; });
  state.battle = { enemies, round: 1, awaitingCommand: true, finished: false, mode:'text', areaId: area.id, boss: false, elite };
  state.exploration.active = false;
  state.log = [];
  appendLog(state, elite ? `精英敵人出現：精英・${base.name}！` : `遭遇 ${base.name}${count > 1 ? ` ×${count}` : ''}！`, elite ? 'rare' : '');
  return state.battle;
}

export function createBossEncounter(state, forcedRank) {
  if ((!state.ui.bossWarning && !state.progress.bossUnlocked) || state.battle || state.dungeon.warning || state.dungeon.active) return null;
  state.exploration.auto = false;
  state.exploration.active = false;
  state.ui.bossWarning = false;
  const rarityRank = forcedRank || state.ui.bossRarityRank || 1;
  const bossEnemyId=state.ui.bossKind||'blackwindLord';
  state.ui.bossRarityRank = null;
  state.ui.bossKind=null;
  const boss = createRarityBoss(ENEMIES[bossEnemyId]||ENEMIES.blackwindLord, rarityRank);
  const chapterBoss=Boolean(boss.bossKind),soldier=chapterBoss?ENEMIES.yellowBladeSoldier:ENEMIES.strongholdSoldier;
  if(rarityRank===5){if(boss.bossKind==='yellow-captain')boss.defense=Math.round(boss.defense*1.18);if(boss.bossKind==='yellow-commander')boss.assaultMultiplier=(boss.assaultMultiplier||1.55)*1.2;if(boss.bossKind==='zhang-bao')boss.skillMultiplier=1.22;}
  const enemies = [{ ...boss, instanceId: `${bossEnemyId}-0`, hp: boss.maxHp, mp: boss.maxMp, guarding: false, side: 'enemy' },...Array.from({ length:chapterBoss?1:2 },(_,index)=>({ ...soldier,instanceId:`${soldier.id}-${index}`,hp:soldier.maxHp,guarding:false,side:'enemy' }))];
  state.party.filter(Boolean).forEach(member => { member.guarding = false; });
  const areaId=chapterBoss?state.screen:'stronghold';
  state.battle = { enemies, round: 1, awaitingCommand: false, finished: false, mode:boss.battleMode||'puzzle', areaId, boss: true, bossKind:boss.bossKind||null,bossRarityRank: rarityRank, awaitingRecruit: false, recommendedPower: boss.recommendedPower };
  preparePuzzleTurn(state.battle,state.party);
  if(chapterBoss)recordChapter2Boss(state,boss.bossKind,rarityRank,'encounter');else recordBlackwindEncounter(state, rarityRank);
  state.log = [];
  appendLog(state, `${boss.displayName||boss.name}率軍迎戰！`, 'epic');
  state.notice = `${boss.name}挑戰開始！`;
  return state.battle;
}

export function createWorldBossEncounter(state,id='crimsonTiger') {
  const profile=WORLD_BOSSES[id]||WORLD_BOSS,target=getWorldBossState(state,id);
  if (!target?.unlocked || state.battle || state.dungeon.active || state.dungeon.warning || state.ui.bossWarning) return null;
  state.exploration.auto=false; state.exploration.active=false; state.ui.bossWarning=false;
  const boss=createWorldBossEnemy(id),codex=id==='crimsonTiger'?state.worldBossCodex:state.worldBossCodices[id];
  target.attempts+=1;codex.discovered=true;codex.challenged=true;
  state.battle={enemies:[boss],round:1,awaitingCommand:false,finished:false,mode:'puzzle',areaId:'worldBoss',source:'worldBoss',boss:true,worldBoss:true,worldBossId:id,bossRarityRank:5,awaitingRecruit:false,recommendedPower:profile.recommendedPower};
  preparePuzzleTurn(state.battle,state.party);
  state.party.filter(Boolean).forEach(member=>{member.guarding=false;}); state.log=[];
  appendLog(state,`★★★★★ ${profile.title}降臨！`,'epic'); state.notice='世界王挑戰開始！'; return state.battle;
}

export function retreatFromBoss(state) {
  if (!state.ui.bossWarning) return false;
  state.ui.bossWarning = false;
  state.ui.bossRarityRank = null;
  state.battle = null;
  state.progress.bossEncounterCount = 0;
  state.exploration.auto = false;
  state.exploration.active = false;
  state.notice = '你選擇撤退整備。沒有損失，危險探索將重新累積。';
  return true;
}

function attackPower(state, actor, multiplier = 1, rng = Math.random) {
  const rawMight = actor.side === 'enemy' ? actor.might : getFinalStats(state, actor).might;
  const might = actor.side === 'enemy' ? rawMight : rawMight * (actor.weakenedRounds > 0 ? 0.85 : 1);
  const variance = 0.9 + rng() * 0.2;
  return Math.round(might * multiplier * variance);
}

function dealDamage(state, actor, target, skill = false, rng = Math.random, skillName = '猛擊', multiplier = 1.65) {
  const baseDefense = target.side === 'enemy' ? target.defense : getFinalStats(state, target).defense;
  const targetDefense = Math.max(0, baseDefense - (target.intimidatedRounds > 0 ? 5 : 0));
  const reduced = target.guarding ? 0.48 : 1;
  const bossSkillReduction = actor.boss && skill && target.side !== 'enemy' && state.equipment?.[target.id]?.armor === 'crimsonWarArmor' ? 0.88 : 1;
  const formationGuard = actor.side === 'enemy' ? 1 - Math.max(0, Math.min(.45, Number(state.battle?.formationGuard) || 0)) : 1;
  const damage = Math.max(1, Math.round((attackPower(state, actor, skill ? multiplier : 1, rng) - targetDefense * 0.45) * reduced * bossSkillReduction * formationGuard));
  target.hp = Math.max(0, target.hp - damage);
  if (target.worldBoss && actor.side !== 'enemy') {const records=getWorldBossRecordState(state,target.worldBossId||'crimsonTiger');records.highestDamage=Math.max(records.highestDamage,damage);}
  const actorName = actor.displayName || actor.name;
  const targetName = target.displayName || target.name;
  appendLog(state, `${actorName}${skill ? `施展${skillName}` : '攻擊'} ${targetName}，造成 ${damage} 傷害。${target.hp ? '' : ` ${targetName}倒下了！`}`);
  return damage;
}

export function performEnemyAction(state, enemy, rng = Math.random) {
  const targets = state.party.filter(alive);
  if (!targets.length) return null;
  const target = pick(targets, rng);
  if (enemy.worldBoss) {
    const phase=enemy.phase||1, roll=rng();
    if(enemy.worldBossId==='netherThunder'){
      if(phase>=3&&roll<.44){const damage=targets.reduce((sum,unit)=>sum+dealDamage(state,enemy,unit,true,rng,'天罰',2.7),0);return{type:'divine-punishment',damage};}
      if(phase>=3&&roll<.78){const hunted=[...targets].sort((a,b)=>a.hp/getFinalStats(state,a).maxHp-b.hp/getFinalStats(state,b).maxHp)[0];return{type:'thunder-hunt',targetId:hunted.id,damage:dealDamage(state,enemy,hunted,true,rng,'雷獄獵殺',3.05)};}
      if(phase>=2&&roll<.46){const damage=targets.reduce((sum,unit)=>sum+dealDamage(state,enemy,unit,true,rng,'九幽雷陣',1.72),0);return{type:'thunder-array',damage};}
      if(phase>=2&&roll<.68){enemy.speed=Math.min(Math.round(WORLD_BOSSES.netherThunder.stats.speed*1.55),Math.round(enemy.speed*1.12));appendLog(state,'九幽雷獸化作雷影，速度大幅提升！','epic');if(rng()<.38){const extra=pick(targets,rng);dealDamage(state,enemy,extra,true,rng,'雷影追擊',1.4);}return{type:'thunder-shadow'};}
      if(roll<.56)return{type:'thunder-claw',damage:dealDamage(state,enemy,target,true,rng,'幽雷爪',2.15)};
      target.slowedRounds=2;appendLog(state,`九幽雷獸施展雷鳴，${target.name}速度下降！`,'epic');return{type:'thunder-roar'};
    }
    if(phase>=3 && roll<.42){
      const damage=targets.reduce((sum,unit)=>sum+dealDamage(state,enemy,unit,true,rng,'焚天',2.35),0); return {type:'inferno',damage};
    }
    if(phase>=3 && roll<.72){
      const hunted=[...targets].sort((a,b)=>a.hp/getFinalStats(state,a).maxHp-b.hp/getFinalStats(state,b).maxHp)[0]; return {type:'hunt',targetId:hunted.id,damage:dealDamage(state,enemy,hunted,true,rng,'獵殺',2.65)};
    }
    if(phase>=2 && roll<.55){
      const damage=targets.reduce((sum,unit)=>sum+dealDamage(state,enemy,unit,true,rng,'烈焰橫掃',1.38),0); return {type:'sweep',damage};
    }
    if(roll<.78) return {type:'rend',damage:dealDamage(state,enemy,target,true,rng,'烈焰撕裂',1.9)};
    targets.forEach(unit=>{unit.weakenedRounds=2;}); appendLog(state,'赤焰魔虎施展虎嘯，全隊武力暫時下降！','epic'); return {type:'roar'};
  }
  if (enemy.boss) {
    const roll = rng();
    if(enemy.bossKind==='yellow-captain'){
      if(roll<.38){enemy.defense=Math.min(Math.round(ENEMIES.yellowCaptainBoss.defense*2),Math.round(enemy.defense*1.18));appendLog(state,'黃巾校尉施展鐵壁，防禦提高！','epic');return{type:'iron-wall'};}
      const result={type:'shield-bash',damage:dealDamage(state,enemy,target,true,rng,'盾擊',1.65)};if(rng()<.4)target.slowedRounds=2;return result;
    }
    if(enemy.bossKind==='yellow-commander'){
      const low=targets.sort((a,b)=>a.hp/getFinalStats(state,a).maxHp-b.hp/getFinalStats(state,b).maxHp)[0],bonus=low.hp/getFinalStats(state,low).maxHp<.4?2.45:2.05;return{type:'army-breaker',damage:dealDamage(state,enemy,low,true,rng,low===target?'破軍斬':'乘勝追擊',bonus)};
    }
    if(enemy.bossKind==='zhang-bao'){
      if(roll<.42){const damage=targets.reduce((sum,unit)=>sum+dealDamage(state,enemy,unit,true,rng,'雷動九天',1.72*(enemy.skillMultiplier||1)),0);return{type:'nine-heavens',damage};}
      if(roll<.67){targets.forEach(unit=>{unit.weakenedRounds=2;unit.slowedRounds=2;});appendLog(state,'張寶施展黃天咒，全隊武力與速度下降！','epic');return{type:'yellow-curse'};}
      return{type:'demon-thunder',damage:dealDamage(state,enemy,target,true,rng,'妖雷',2.25*(enemy.skillMultiplier||1))};
    }
    if (enemy.mp >= 7 && roll < 0.45) {
      enemy.mp -= 7;
      return { type: 'assault', damage: dealDamage(state, enemy, target, true, rng, '強襲', enemy.assaultMultiplier || 1.55) };
    }
    if (roll < 0.75) {
      target.intimidatedRounds = enemy.intimidateRounds || 2;
      appendLog(state, `${enemy.displayName || enemy.name}施展威嚇，${target.name}的防禦暫時下降！`, 'epic');
      return { type: 'intimidate', targetId: target.id };
    }
  }
  return { type: 'attack', damage: dealDamage(state, enemy, target, false, rng) };
}

function gainExp(member, amount, state) {
  member.exp += amount;
  while (member.exp >= EXP_TO_LEVEL(member.level)) {
    member.exp -= EXP_TO_LEVEL(member.level);
    member.level += 1;
    const growth = member.id === 'blackwind-lord' ? (member.growthMultiplier || 1) : 1;
    member.maxHp += Math.round(18 * growth);
    member.maxMp += 4;
    member.might += Math.round(3 * growth);
    member.defense += Math.round(2 * growth);
    member.speed += Math.max(1, Math.round(growth));
    member.hp = getFinalStats(state, member).maxHp;
    member.mp = member.maxMp;
    appendLog(state, `${member.name}升至 Lv.${member.level}！兵力、武力與防禦提升。`, 'level');
  }
}

export function rollBattleDrop(enemies, rng = Math.random, bossBattle = false, firstBossKill = false) {
  const sources = enemies.filter(enemy => enemy.loot);
  if (!sources.length) return null;
  const roll = rng();
  const eliteBattle = enemies.some(enemy => enemy.elite);
  const bossRank = sources.find(enemy => enemy.boss)?.rarityRank || 1;
  const epicRate = [0, 0.08, 0.13, 0.22, 0.34, 0.48][bossRank];
  const rareRate = [0, 0.58, 0.66, 0.75, 0.84, 0.92][bossRank];
  const quality = bossBattle
    ? (roll < epicRate ? 'epic' : firstBossKill || roll < rareRate ? 'rare' : null)
    : eliteBattle
      ? (roll < 0.025 ? 'epic' : roll < 0.24 ? 'rare' : roll < 0.62 ? 'common' : roll < 0.72 ? 'supply' : null)
      : (roll < 0.01 ? 'epic' : roll < 0.06 ? 'rare' : roll < 0.24 ? 'common' : roll < 0.34 ? 'supply' : null);
  if (!quality) return null;
  // Boss battles always use the boss-exclusive table, never an escort's table.
  const source = bossBattle ? sources.find(enemy => enemy.boss) : pick(sources, rng);
  if (!source) return null;
  const table = source.loot[quality];
  return table?.length ? pick(table, rng) : null;
}

function finishVictory(state, rng) {
  const defeated = state.battle.enemies;
  const bossBattle = Boolean(state.battle.boss);
  const worldBossBattle = Boolean(state.battle.worldBoss);
  const eliteBattle = defeated.some(enemy => enemy.elite);
  const firstBossKill = bossBattle && !state.progress.bossFirstKill;
  const exp = defeated.reduce((sum, enemy) => sum + enemy.exp, 0);
  const gold = defeated.reduce((sum, enemy) => sum + randomInt(enemy.gold[0], enemy.gold[1], rng), 0);
  state.battle.rewardExp = exp;
  state.battle.rewardGold = gold;
  if (state.battle.dungeon) state.dungeon.loot.gold += gold;
  state.party.filter(Boolean).forEach(member => gainExp(member, exp, state));
  state.gold += gold;
  state.progress.totalKills += defeated.length;
  if (eliteBattle) {
    state.progress.elitesDefeated = (state.progress.elitesDefeated || 0) + defeated.filter(enemy => enemy.elite).length;
    appendLog(state, '精英敵人擊破！', 'rare');
  }
  if (state.battle.areaId === 'stronghold' && !bossBattle) {
    state.progress.strongholdKills = Math.min(10, state.progress.strongholdKills + defeated.length);
    if (state.progress.strongholdKills >= 10 && !state.progress.bossUnlocked) {
      state.progress.bossUnlocked = true;
      appendLog(state, '黑風寨擊破達 10 名，寨主挑戰已解鎖！', 'epic');
    }
  }
  if (bossBattle) {
    state.progress.bossDefeated = true;
    state.progress.bossFirstKill = true;
  }
  if (worldBossBattle) {
    const worldId=state.battle.worldBossId||'crimsonTiger',profile=WORLD_BOSSES[worldId],targetState=getWorldBossState(state,worldId),codex=worldId==='crimsonTiger'?state.worldBossCodex:state.worldBossCodices[worldId],records=getWorldBossRecordState(state,worldId);
    targetState.defeated=true; targetState.defeats+=1; targetState.bestPhase=3; targetState.lowestHpPct=0;
    const guaranteed=!targetState.firstRewardClaimed;
    const dropId=guaranteed?profile.drops[0]:pick(profile.drops,rng);
    state.inventory[dropId]=(state.inventory[dropId]||0)+1; state.battle.dropId=dropId; state.battle.dropQuality='傳說';
    state.bossProgress.talismans.advanced=(state.bossProgress.talismans.advanced||0)+2;
    if(rng()<.35) state.bossProgress.talismans.legendary=(state.bossProgress.talismans.legendary||0)+1;
    state.bossProgress.divineTalismans.advanced=(state.bossProgress.divineTalismans.advanced||0)+2;
    state.battle.worldBossLoot={advanced:2,divineAdvanced:2,itemId:dropId}; targetState.firstRewardClaimed=true;
    codex.discovered=true; codex.challenged=true; codex.defeated=true;
    recordItemDrop(state, dropId); recordMaterials(state, { advanced: 2, ...(state.bossProgress.talismans.legendary ? { legendary: 1 } : {}) }, { advanced: 2 });
    const fastest = records.fastestRound;
    records.fastestRound = fastest == null ? state.battle.round : Math.min(fastest, state.battle.round);
    state.battle.awaitingRecruit=true; state.notice=`${profile.title}倒下了！你完成了世界王挑戰！`; appendLog(state,state.notice,'epic');
  }
  refreshUnlocks(state);
  let dropId = rollBattleDrop(defeated, rng, bossBattle, firstBossKill);
  if (state.battle.dungeon && bossBattle && !dropId && rng() < 0.55) {
    const bossLoot = ENEMIES.blackwindLord.loot;
    dropId = pick(rng() < 0.38 ? bossLoot.epic : bossLoot.rare, rng);
  }
  if (dropId) {
    const item = ITEMS[dropId];
    state.inventory[dropId] = (state.inventory[dropId] || 0) + 1;
    appendLog(state, `獲得【${item.name}】！`, item.quality === '史詩' ? 'epic' : item.quality === '稀有' ? 'rare' : 'drop');
    if (bossBattle && item.quality === '史詩') appendLog(state, `★★★★★ 史詩戰利品！獲得【${item.name}】！`, 'epic');
    state.battle.dropId = dropId;
    state.battle.dropQuality = item.quality;
    if (state.battle.dungeon) state.dungeon.loot.items.push(dropId);
    recordItemDrop(state, dropId);
    if(item.generalGear){
      appendLog(state,`目前持有：${state.inventory[dropId]}`, 'drop');
      if((state.inventory[dropId]||0)-equippedCount(state,dropId)>=3)appendLog(state,'可升階！可稍後前往背包合成。','rare');
    }
  }
  if (bossBattle) {
    const rank = defeated.find(enemy => enemy.boss)?.rarityRank || 1;
    const talismanDrops = rollTalismanDrops(rank, rng);
    state.battle.talismanDrops = talismanDrops;
    Object.entries(talismanDrops).forEach(([talismanId, amount]) => {
      state.bossProgress.talismans[talismanId] = (state.bossProgress.talismans[talismanId] || 0) + amount;
      appendLog(state, `獲得【${TALISMANS[talismanId].name}】×${amount}！`, 'epic');
      if (state.battle.dungeon) state.dungeon.loot.talismans[talismanId] = (state.dungeon.loot.talismans[talismanId] || 0) + amount;
    });
    const divineDrops = rollDivineTalismanDrops(rank, Boolean(state.battle.dungeon), rng);
    state.battle.divineTalismanDrops = divineDrops;
    Object.entries(divineDrops).forEach(([id, amount]) => {
      state.bossProgress.divineTalismans[id] = (state.bossProgress.divineTalismans[id] || 0) + amount;
      appendLog(state, `獲得【${DIVINE_TALISMANS[id].name}】×${amount}！`, id === 'advanced' ? 'epic' : 'rare');
      if (id === 'advanced' && rank === 5) appendLog(state, '高階神兵素材！', 'epic');
    });
    recordMaterials(state, talismanDrops, divineDrops);
    if (!worldBossBattle){if(state.battle.bossKind)recordChapter2Boss(state,state.battle.bossKind,rank,'defeat');else recordBlackwindDefeat(state, rank);}
    if (state.battle.dungeon) {
      const completionGold = 300 + rank * 120;
      state.gold += completionGold;
      state.inventory.potion = (state.inventory.potion || 0) + 2;
      state.dungeon.loot.gold += completionGold;
      state.dungeon.loot.potion += 2;
      state.dungeon.completed = true;
      state.battle.dungeonCompletionReward = { gold: completionGold, potion: 2 };
      if (rng() < 0.12 + rank * 0.04) {
        const bonusTalisman = rank >= 4 ? 'advanced' : 'intermediate';
        state.bossProgress.talismans[bonusTalisman] = (state.bossProgress.talismans[bonusTalisman] || 0) + 1;
        state.dungeon.loot.talismans[bonusTalisman] = (state.dungeon.loot.talismans[bonusTalisman] || 0) + 1;
      }
    }
  }
  state.battle.finished = true;
  state.battle.result = 'victory';
  state.battle.awaitingRecruit = bossBattle;
  if(state.battle.bossKind==='zhang-bao'){state.chapter2.cleared=true;state.progress.chapter2Cleared=true;state.worldBosses.netherThunder.unlocked=true;state.ui.chapter2Complete=true;}
  const defeatedBossName=state.battle.bossKind?CHAPTER2_BOSSES[state.battle.bossKind].name:'黑風寨主';
  state.notice = worldBossBattle ? `${WORLD_BOSSES[state.battle.worldBossId||'crimsonTiger'].title}倒下了！` : state.battle.dungeon && bossBattle ? `秘境 Boss 已擊破！獲得 ${exp} EXP、${gold} 金與攻略完成獎勵。` : bossBattle ? `${defeatedBossName}已敗！全隊獲得 ${exp} EXP，取得 ${gold} 金。${dropId ? ` 獲得【${ITEMS[dropId].name}】！` : ''}${state.battle.bossKind==='zhang-bao'?' 第二章・黃巾之亂完成！':''}` : `戰鬥勝利！全隊獲得 ${exp} EXP，取得 ${gold} 金。${dropId ? ` 獲得【${ITEMS[dropId].name}】！` : ''}`;
  appendLog(state, state.notice, dropId ? 'drop' : '');
  const masteryGain = awardWorldBossMastery(state, state.battle);
  if(masteryGain)for(const member of state.party.filter(unit=>unit?.worldBoss)){const id=member.id==='nether-thunder-beast'?'netherThunder':'crimsonTiger';appendLog(state,`${WORLD_BOSSES[id].name}獲得世界王熟練 ${masteryGain}。`,'rare');}
}

function finishDefeat(state) {
  const loss = Math.min(state.gold, Math.max(5, Math.floor(state.gold * 0.1)));
  state.gold -= loss;
  state.party.filter(Boolean).forEach(member => {
    member.hp = Math.max(1, Math.ceil(getFinalStats(state, member).maxHp * 0.5));
    member.mp = Math.ceil(member.maxMp * 0.5);
  });
  state.battle.finished = true;
  state.battle.result = 'defeat';
  state.exploration.auto = false;
  if (state.dungeon.active || state.battle?.dungeon) {
    state.dungeon.active = false;
    state.dungeon.warning = false;
    state.dungeon.floor = 0;
    state.dungeon.awaitingAdvance = false;
  }
  state.screen = 'village';
  state.location = '桃源村';
  state.notice = `全隊戰敗，被村民救回桃源村，損失 ${loss} 金。`;
  if(state.battle?.worldBoss){const enemy=state.battle.enemies[0],pct=Math.max(0,Math.round(enemy.hp/enemy.maxHp*100)),targetState=getWorldBossState(state,state.battle.worldBossId||'crimsonTiger');targetState.bestPhase=Math.max(targetState.bestPhase,enemy.phase||1);targetState.lowestHpPct=Math.min(targetState.lowestHpPct,pct);}
  appendLog(state, state.notice);
}

function updateWorldBossPhase(state, target) {
  if (!target?.worldBoss || target.hp <= 0) return;
  const ratio = target.hp / target.maxHp, id = target.worldBossId || 'crimsonTiger', targetState = getWorldBossState(state, id);
  if (ratio <= .35 && target.phase < 3) {
    target.phase = 3; target.might = Math.round(target.might * (id === 'netherThunder' ? 1.32 : 1.28)); target.speed = Math.round(target.speed * (id === 'netherThunder' ? 1.25 : 1.18));
    appendLog(state, id === 'netherThunder' ? '九幽雷獸進入神罰階段！' : '赤焰魔虎進入焚天階段！', 'epic');
  } else if (ratio <= .70 && target.phase < 2) {
    target.phase = 2; target.might = Math.round(target.might * 1.18); target.speed = Math.round(target.speed * (id === 'netherThunder' ? 1.22 : 1.15));
    appendLog(state, id === 'netherThunder' ? '九幽雷獸展開雷鎖領域！' : '赤焰魔虎進入烈焰狂暴！', 'epic');
  }
  targetState.bestPhase = Math.max(targetState.bestPhase, target.phase); targetState.lowestHpPct = Math.min(targetState.lowestHpPct, Math.max(0, Math.round(ratio * 100)));
}

export function startFormation(state, rng = Math.random) {
  const battle = state.battle;
  if (!battle || battle.mode !== 'puzzle' || battle.finished) return false;
  if (battle.formation?.active) return true;
  const started = startFormationPuzzle(battle, state.party, rng);
  if (started) { battle.awaitingCommand = false; appendLog(state, '戰陣展開，開始轉珠！', 'epic'); }
  return started;
}

export function resolveFormationAttack(state, rng = Math.random) {
  const battle = state.battle, result = settleFormationPuzzle(battle, state.party, rng);
  if (!battle || battle.mode !== 'puzzle' || !result) return null;
  const allies = state.party.filter(alive);
  const worldTarget = battle.enemies.find(enemy => enemy.worldBoss && alive(enemy));
  const damageCap = worldTarget ? Math.floor(worldTarget.maxHp * .23) : Infinity;
  let totalDamage = 0;
  const characterResults = [];
  for (const action of result.actions.filter(entry => entry.active && alive(entry.member))) {
    const member = action.member;
    const target = battle.enemies.find(alive); if (!target || totalDamage >= damageCap) break;
    const stats = getFinalStats(state, member);
    let skillName = '', skillMultiplier = 1;
    if (member.isPlayer && member.mp >= 6 && rng() < .38) { member.mp -= 6; skillName = '猛擊'; skillMultiplier = 1.65; }
    else if (member.id === 'blackwind-lord' && member.mp >= 5 && rng() < .35) { member.mp -= 5; skillName = '強襲'; skillMultiplier = 1.55 + ((member.rarityRank || 1) - 1) * .13; }
    else if (member.worldBoss && member.mp >= 10 && rng() < .42) { member.mp -= 10; skillName = member.id === 'nether-thunder-beast' ? '幽雷爪' : '烈焰撕裂'; skillMultiplier = member.id === 'nether-thunder-beast' ? 1.95 : 1.72; }
    const variance = .92 + rng() * .16;
    let damage = Math.max(1, Math.round((stats.might * skillMultiplier * action.multiplier - target.defense * .28) * variance));
    damage = Math.min(damage, damageCap - totalDamage, target.hp);
    target.hp = Math.max(0, target.hp - damage); totalDamage += damage;
    if (target.worldBoss) { const records=getWorldBossRecordState(state,target.worldBossId||'crimsonTiger'); records.highestDamage=Math.max(records.highestDamage,damage); }
    appendLog(state, `${member.name}${skillName ? `施展${skillName}` : '攻擊'}，造成 ${damage} 傷害。`, skillName ? 'rare' : '');
    characterResults.push({ slot: action.slot, name: member.name, groups: action.groups, matched: action.matched, damage, skillName });
    updateWorldBossPhase(state, target);
  }
  if (result.burningRemaining) {
    for (const member of allies) { const damage = Math.max(1, Math.round(getFinalStats(state, member).maxHp * Math.min(.12, result.burningRemaining * .012))); member.hp = Math.max(1, member.hp - damage); }
    appendLog(state, `${result.burningRemaining} 格烈焰未消除，全隊受到灼燒！`, 'epic');
  }
  result.totalDamage = totalDamage; result.characterResults = characterResults;
  appendLog(state, `【戰陣總傷害：${totalDamage}】（${result.combos} Combo）`, 'epic');
  if (!battle.enemies.some(alive)) finishVictory(state, rng);
  else {
    for (const enemy of battle.enemies.filter(alive)) { performEnemyAction(state, enemy, rng); if (!state.party.some(alive)) break; }
    if (!state.party.some(alive)) finishDefeat(state);
    else {
      state.party.filter(Boolean).forEach(member => { if (member.intimidatedRounds > 0) member.intimidatedRounds -= 1; if (member.slowedRounds > 0) member.slowedRounds -= 1; });
      battle.round += 1; battle.awaitingCommand = false; battle.lastPuzzleResult = { combos: result.combos, totalDamage, characterResults };
      preparePuzzleTurn(battle, state.party, rng);
    }
  }
  return result;
}

export function resolveRound(state, command = 'attack', rng = Math.random) {
  const battle = state.battle;
  // Internal regression hook only. Live Boss play never calls this path: the puzzle UI settles directly.
  if (battle?.mode === 'puzzle') {
    const types=battle.formation?.activeTypes||[],board=battle.formation?.board||[];
    if(types.length){board.forEach((cell,i)=>{cell.type=types[(Math.floor(i/6)*2+i%6)%types.length];});for(let col=0;col<3;col++)if(board[col])board[col].type=types[0];}
    return Boolean(resolveFormationAttack(state, rng));
  }
  const formation = ensureFormation(battle);
  if (!battle || battle.finished || !battle.awaitingCommand || formation?.active || formation?.result) return false;
  battle.awaitingCommand = false;
  const leader = state.party.find(unit => unit?.id === 'blackwind-lord');
  const leaderResonance = getBlackwindResonance(state, leader);
  if (!battle.resonanceAnnounced && leaderResonance.set) {
    appendLog(state, `黑風寨主觸發【${leaderResonance.set}】！`, 'epic');
    battle.resonanceAnnounced = true;
    battle.freeLeaderAssault = leaderResonance.freeAssault;
  }
  const allies = state.party.filter(alive);
  const enemies = battle.enemies.filter(alive);
  if (!allies.length || !enemies.length) return false;
  state.party.filter(Boolean).forEach(member => { member.guarding = false; });
  if (command === 'defend') allies.forEach(member => { member.guarding = true; });
  const turns = [
    ...allies.map(unit => ({ unit, side: 'ally', speed: Math.round(getFinalStats(state, unit).speed*(unit.slowedRounds>0?.72:1)) })),
    ...enemies.map(unit => ({ unit, side: 'enemy', speed: unit.speed }))
  ].sort((a, b) => b.speed - a.speed || rng() - 0.5);
  for (const turn of turns) {
    if (!alive(turn.unit)) continue;
    if (turn.side === 'ally') {
      const targets = battle.enemies.filter(alive);
      if (!targets.length) break;
      if (command === 'defend') { appendLog(state, `${turn.unit.name}採取防禦姿態。`); continue; }
      const useSlam = turn.unit.isPlayer && command === 'slam' && turn.unit.mp >= 6;
      const leaderProfile = turn.unit.id === 'blackwind-lord' ? getBlackwindResonance(state, turn.unit) : null;
      const freeAssault = Boolean(turn.unit.id === 'blackwind-lord' && battle.freeLeaderAssault);
      const tigerProfile=turn.unit.worldBoss?getWorldBossResonance(state,turn.unit):null;
      const tigerSkill=turn.unit.worldBoss&&turn.unit.mp>=10&&rng()<.42;
      const leaderAssault = turn.unit.id === 'blackwind-lord' && (freeAssault || (turn.unit.mp >= 5 && rng() < 0.35));
      if (useSlam) turn.unit.mp -= 6;
      if (leaderAssault && !freeAssault) turn.unit.mp -= 5;
      if(tigerSkill)turn.unit.mp-=10;
      if (freeAssault) battle.freeLeaderAssault = false;
      const leaderMultiplier = (1.55 + ((turn.unit.rarityRank || 1) - 1) * 0.13) * (1 + (leaderProfile?.assaultPct || 0));
      const allyWorldId=turn.unit.id==='nether-thunder-beast'?'netherThunder':'crimsonTiger',breakthrough=turn.unit.worldBoss?getBreakthroughProfile(getWorldBossState(state,allyWorldId).breakthroughLevel):{rendPct:0,sweepPct:0,heavenPct:0};
      const tigerMultiplier=(turn.unit.id==='nether-thunder-beast'?1.95:1.72)*(1+(tigerProfile?.skillPct||0)+(turn.unit.worldBoss?getMasteryProfile(state,allyWorldId).skillPct+breakthrough.rendPct+breakthrough.sweepPct+breakthrough.heavenPct:0));
      dealDamage(state, turn.unit, targets[0], useSlam || leaderAssault || tigerSkill, rng, leaderAssault ? '強襲' : tigerSkill?(turn.unit.id==='nether-thunder-beast'?'幽雷爪':'烈焰撕裂'):'猛擊', leaderAssault ? leaderMultiplier : tigerSkill?tigerMultiplier:1.65);
      const worldTarget=targets[0];
      if(worldTarget.worldBoss){const ratio=worldTarget.hp/worldTarget.maxHp,id=worldTarget.worldBossId||'crimsonTiger',targetState=getWorldBossState(state,id);if(ratio<=.35&&worldTarget.phase<3){worldTarget.phase=3;worldTarget.might=Math.round(worldTarget.might*(id==='netherThunder'?1.32:1.28));worldTarget.speed=Math.round(worldTarget.speed*(id==='netherThunder'?1.25:1.18));appendLog(state,id==='netherThunder'?'九幽雷獸進入天雷暴走！':'赤焰魔虎徹底暴走！','epic');}else if(ratio<=.70&&worldTarget.phase<2){worldTarget.phase=2;worldTarget.might=Math.round(worldTarget.might*1.18);worldTarget.speed=Math.round(worldTarget.speed*(id==='netherThunder'?1.22:1.15));appendLog(state,id==='netherThunder'?'九幽雷獸引動天雷！':'赤焰魔虎進入狂暴！','epic');}targetState.bestPhase=Math.max(targetState.bestPhase,worldTarget.phase);targetState.lowestHpPct=Math.min(targetState.lowestHpPct,Math.max(0,Math.round(ratio*100)));}
    } else performEnemyAction(state, turn.unit, rng);
    if (!state.party.some(alive)) break;
  }
  battle.formationGuard = 0;
  if (!battle.enemies.some(alive)) finishVictory(state, rng);
  else if (!state.party.some(alive)) finishDefeat(state);
  else {
    state.party.filter(Boolean).forEach(member => { if (member.intimidatedRounds > 0) member.intimidatedRounds -= 1;if(member.slowedRounds>0)member.slowedRounds-=1; });
    battle.round += 1;
    battle.awaitingCommand = true;
  }
  return true;
}

export function captureWorldBoss(state,rng=Math.random){
  if(!state.battle?.worldBoss||!state.battle.awaitingRecruit)return false;
  const id=state.battle.worldBossId||'crimsonTiger',profile=WORLD_BOSSES[id],codex=id==='crimsonTiger'?state.worldBossCodex:state.worldBossCodices[id],success=rng()<profile.captureRate;
  codex.captureAttempts+=1;if(success)addWorldBossToRoster(state,id);if(success){codex.captured=true;codex.captureSuccesses+=1;}
  state.battle=null;state.screen='worldBoss';state.location='世界王祭壇';state.exploration.auto=false;state.exploration.active=false;state.ui.bossWarning=false;
  state.notice=success?`${profile.title}臣服！已加入武將名冊。`:`${profile.name}掙脫束縛並離去。戰利品全部保留。`;return success;
}

export function spareWorldBoss(state){if(!state.battle?.worldBoss||!state.battle.awaitingRecruit)return false;state.battle=null;state.screen='worldBoss';state.location='世界王祭壇';state.notice='你放棄收服，世界王戰利品全部保留。';return true;}

export function chooseAutoCommand(state, rng = Math.random) {
  const hero = state.party[0];
  return hero?.mp >= 6 && rng() < 0.3 ? 'slam' : 'attack';
}

export function usePotion(state) {
  if (!state.battle || state.battle.finished || !state.inventory.potion) return false;
  const target = state.party.filter(alive).sort((a, b) => a.hp / getFinalStats(state, a).maxHp - b.hp / getFinalStats(state, b).maxHp)[0];
  if (!target) return false;
  state.inventory.potion -= 1;
  target.hp = Math.min(getFinalStats(state, target).maxHp, target.hp + ITEMS.potion.heal);
  appendLog(state, `${target.name}使用回復藥，恢復 ${ITEMS.potion.heal} 兵力。`);
  return true;
}

export function equippedCount(state, itemId) {
  return Object.values(state.equipment).reduce((count, slots) => count + Object.values(slots).filter(id => id === itemId).length, 0);
}

export function equipItem(state, memberId, itemId) {
  const member = getMember(state, memberId), item = ITEMS[itemId];
  if (!member || item?.type !== 'equipment' || (state.inventory[itemId] || 0) <= equippedCount(state, itemId) - (state.equipment[memberId]?.[item.slot] === itemId ? 1 : 0)) return { ok: false, message: '沒有可裝備的物品。' };
  const oldId = state.equipment[memberId][item.slot];
  state.equipment[memberId][item.slot] = itemId;
  member.hp = Math.min(member.hp, getFinalStats(state, member).maxHp);
  state.notice = `${member.name}裝備了【${item.name}】。${oldId ? `【${ITEMS[oldId].name}】已放回背包。` : ''}`;
  return { ok: true, message: state.notice };
}

export function unequipItem(state, memberId, slot) {
  const member = getMember(state, memberId), itemId = state.equipment?.[memberId]?.[slot];
  if (!member || !itemId) return false;
  state.equipment[memberId][slot] = null;
  member.hp = Math.min(member.hp, getFinalStats(state, member).maxHp);
  state.notice = `${member.name}卸下了【${ITEMS[itemId].name}】。`;
  return true;
}

export function sellItem(state, itemId) {
  const item = ITEMS[itemId], owned = state.inventory[itemId] || 0;
  if (!item?.sell || owned <= equippedCount(state, itemId)) return { ok: false, message: owned ? '已裝備物品必須先卸下。' : '背包中沒有此物品。' };
  state.inventory[itemId] -= 1;
  state.gold += item.sell;
  state.notice = `出售【${item.name}】，獲得 ${item.sell} 金。`;
  return { ok: true, message: state.notice };
}

export function compareItem(state, memberId, itemId) {
  const item = ITEMS[itemId], member = getMember(state, memberId);
  if (!item || !member || item.type !== 'equipment') return null;
  const currentId = state.equipment[memberId][item.slot], current = ITEMS[currentId];
  const keys = new Set([...Object.keys(current?.stats || {}), ...Object.keys(item.stats || {})]);
  return {
    member, item, current,
    differences: [...keys].map(stat => ({ stat, name: STAT_NAMES[stat], value: (item.stats[stat] || 0) - (current?.stats?.[stat] || 0) }))
  };
}

export function getEquippedSummary(state, memberId) {
  return Object.entries(state.equipment[memberId] || {}).map(([slot, itemId]) => ({ slot, slotName: SLOT_NAMES[slot], item: ITEMS[itemId] || null }));
}

export function recommendMemberForItem(state, itemId) {
  const item = ITEMS[itemId];
  if (!item || item.type !== 'equipment') return null;
  const candidates = state.party.filter(Boolean).map(member => {
    const currentId = state.equipment[member.id]?.[item.slot];
    const delta = getItemScore(item) - getItemScore(ITEMS[currentId]);
    const affinity = item.slot === 'weapon' ? member.might : item.slot === 'armor' ? member.defense + member.maxHp * 0.08 : member.speed + member.might * 0.2;
    const correctWorldGear=(member.id==='crimson-tiger'&&item.worldBossOnly&&!item.worldBossFamily)||(member.id==='nether-thunder-beast'&&item.worldBossFamily==='nether-thunder');
    const resonanceBonus = (member.id === 'blackwind-lord' && getBossGearInfo(itemId)) || correctWorldGear ? getItemScore(item) * 0.7 : 0;
    return { member, current: ITEMS[currentId] || null, delta: delta + resonanceBonus, affinity };
  });
  return candidates.sort((a, b) => b.delta - a.delta || b.affinity - a.affinity)[0] || null;
}

export function prepareQuickEquip(state, itemId) {
  if (!ITEMS[itemId] || !(state.inventory[itemId] > 0)) return false;
  state.ui.quickEquipItem = itemId;
  state.ui.selectedItem = itemId;
  state.screen = 'inventory';
  return true;
}

export function confirmQuickEquip(state) {
  const itemId = state.ui.quickEquipItem;
  const recommendation = recommendMemberForItem(state, itemId);
  if (!recommendation) return { ok: false, message: '沒有可用的裝備建議。' };
  const result = equipItem(state, recommendation.member.id, itemId);
  if (result.ok) state.ui.quickEquipItem = null;
  return result;
}

export function optimizeEquipment(state) {
  const members = state.party.filter(Boolean);
  const previous = Object.fromEntries(members.map(member => [member.id, { ...(state.equipment[member.id] || {}) }]));
  const next = Object.fromEntries(members.map(member => [member.id, { weapon: null, armor: null, accessory: null }]));
  for (const slot of ['weapon', 'armor', 'accessory']) {
    const pool = [];
    for (const item of Object.values(ITEMS).filter(candidate => candidate.type === 'equipment' && candidate.slot === slot)) {
      for (let count = 0; count < (state.inventory[item.id] || 0); count += 1) pool.push(item);
    }
    pool.sort((a, b) => getItemScore(b) - getItemScore(a));
    const memberOrder = [...members].sort((a, b) => {
      const affinity = member => slot === 'weapon' ? member.might : slot === 'armor' ? member.defense + member.maxHp * 0.08 : member.speed + member.might * 0.2;
      return affinity(b) - affinity(a);
    });
    const leaderIndex = memberOrder.findIndex(member => member.id === 'blackwind-lord');
    const bossGearIndex = pool.findIndex(item => getBossGearInfo(item.id));
    if (leaderIndex >= 0 && bossGearIndex >= 0) {
      const [leader] = memberOrder.splice(leaderIndex, 1); memberOrder.unshift(leader);
      const [gear] = pool.splice(bossGearIndex, 1); pool.unshift(gear);
    }
    for(const [memberId,family]of [['crimson-tiger',null],['nether-thunder-beast','nether-thunder']]){const memberIndex=memberOrder.findIndex(member=>member.id===memberId),gearIndex=pool.findIndex(item=>item.worldBossOnly&&(family?item.worldBossFamily===family:!item.worldBossFamily));if(memberIndex>=0&&gearIndex>=0){const[unit]=memberOrder.splice(memberIndex,1);memberOrder.unshift(unit);const[gear]=pool.splice(gearIndex,1);pool.unshift(gear);}}
    memberOrder.forEach((member, index) => { next[member.id][slot] = pool[index]?.id || null; });
  }
  const changes = [];
  for (const member of members) {
    for (const slot of ['weapon', 'armor', 'accessory']) {
      const from = previous[member.id]?.[slot] || null;
      const to = next[member.id][slot] || null;
      if (from !== to) changes.push(`${member.name}：${SLOT_NAMES[slot]} ${ITEMS[from]?.name || '無'} → ${ITEMS[to]?.name || '無'}`);
    }
    state.equipment[member.id] = next[member.id];
    member.hp = Math.min(member.hp, getFinalStats(state, member).maxHp);
  }
  state.ui.optimizeChanges = changes;
  state.notice = changes.length ? '已最佳化隊伍裝備。' : '目前已是最佳裝備配置。';
  return changes;
}

export function recruitBlackwindLeader(state, rng = Math.random) {
  if (!state.battle?.awaitingRecruit) return false;
  const dungeonVictory = Boolean(state.battle.dungeon);
  const dropId = state.battle.dropId;
  const rank = state.battle.bossRarityRank || 1;
  const firstRecruit = !state.progress.bossRecruited;
  const success = firstRecruit && rank === 1 ? true : rng() < getCaptureRate(rank);
  if (!success) {
    const dropId = state.battle.dropId;
    state.bossProgress.records.push({ type: 'capture', rank, success: false, at: Date.now() });
    state.bossProgress.records = state.bossProgress.records.slice(-80);
    recordBlackwindCapture(state, rank, false);
    if (dropId && ['rare', 'epic'].includes(ITEMS[dropId]?.quality)) state.ui.quickEquipItem = dropId;
    state.battle = null;
    state.ui.bossWarning = false;
    state.ui.bossRarityRank = null;
    state.exploration.auto = false;
    state.exploration.active = false;
    if (dungeonVictory) exitDungeon(state, true);
    else { state.screen = 'stronghold'; state.location = AREAS.stronghold.name; }
    state.notice = `${getBossRarity(rank).stars} ${getBossRarity(rank).name}黑風寨主拒絕招降並離開。戰利品全部保留。`;
    return false;
  }
  if (!state.progress.bossRecruited) {
    state.party[4] = createBlackwindLeader();
    applyLeaderRarity(state.party[4], rank);
  } else {
    const leader = state.party.find(member => member?.id === 'blackwind-lord');
    const currentRank = leader?.rarityRank || 1;
    if (rank > currentRank) {
      applyLeaderRarity(leader, rank);
      state.notice = `發現更高階黑風寨主！目前武將已升格為${getBossRarity(rank).stars} ${getBossRarity(rank).name}。`;
    } else {
      const bonus = 80 * rank;
      state.gold += bonus;
      state.notice = `目前黑風寨主稀有度更高或相同，招降轉化為 ${bonus} 金。`;
    }
  }
  state.equipment['blackwind-lord'] ||= { weapon: null, armor: null, accessory: null };
  state.progress.bossRecruited = true;
  state.progress.chapterOneComplete = true;
  state.worldBoss.unlocked = true;
  state.ui.chapterComplete = firstRecruit;
  state.bossProgress.records.push({ type: 'capture', rank, success: true, at: Date.now() });
  state.bossProgress.records = state.bossProgress.records.slice(-80);
  recordBlackwindCapture(state, rank, true);
  if (dropId && ['rare', 'epic'].includes(ITEMS[dropId]?.quality)) state.ui.quickEquipItem = dropId;
  state.battle = null;
  state.ui.bossWarning = false;
  state.ui.bossRarityRank = null;
  state.exploration.auto = false;
  state.exploration.active = false;
  if (dungeonVictory) exitDungeon(state, true);
  else { state.screen = 'stronghold'; state.location = AREAS.stronghold.name; }
  if (firstRecruit) state.notice = `${getBossRarity(rank).stars} ${getBossRarity(rank).name}黑風寨主願意追隨你！第一章完成！`;
  return true;
}

export function spareBlackwindLeader(state) {
  if (!state.battle?.awaitingRecruit) return false;
  const dungeonVictory = Boolean(state.battle.dungeon);
  const dropId = state.battle.dropId;
  if (dropId && ['rare', 'epic'].includes(ITEMS[dropId]?.quality)) state.ui.quickEquipItem = dropId;
  state.battle = null;
  state.ui.bossWarning = false;
  state.ui.bossRarityRank = null;
  state.exploration.auto = false;
  state.exploration.active = false;
  if (dungeonVictory) exitDungeon(state, true);
  else { state.screen = 'stronghold'; state.location = AREAS.stronghold.name; }
  state.notice = '你放過了黑風寨主。之後仍可再次挑戰並招降。';
  return true;
}

export { recruitChapter2Boss, spareChapter2Boss };

export function continueAfterChapter(state) {
  state.ui.chapterComplete = false;
  if (state.ui.quickEquipItem) {
    state.screen = 'inventory';
    state.ui.selectedItem = state.ui.quickEquipItem;
  }
  state.notice = '第一章已完成，你可以繼續在現有地區冒險。';
}

export function leaveBattle(state) {
  state.battle = null;
  state.log = [];
  state.ui.bossWarning = false;
  state.ui.bossRarityRank = null;
  state.exploration.active = false;
}
