import { AREAS } from './data.js?v=v031-quick-battle-1';
import { WORLD_BOSSES, getWorldBossState } from './world-boss-system.js?v=v031-quick-battle-1';

export const QUICK_BOSS_CATALOG = [
  { id: 'blackwindLord', group: 'normal', name: '黑風寨主', areaId: 'stronghold', unlock: state => state.progress.bossUnlocked },
  { id: 'yellowCaptainBoss', group: 'normal', name: '黃巾校尉', areaId: 'yellowRoad', unlock: state => state.unlocks.chapter2 },
  { id: 'yellowCommanderBoss', group: 'normal', name: '黃巾渠帥', areaId: 'yellowCamp', unlock: state => state.chapter2?.bossCodexUnlocked || state.chapter2?.cleared || state.progress.chapter2Cleared },
  { id: 'zhangBaoBoss', group: 'normal', name: '張寶', areaId: 'yellowFortress', unlock: state => state.progress.chapter2Cleared },
  { id: 'stormWardenBoss', group: 'normal', name: '雷谷守將・韓忠', areaId: 'thunderValley', unlock: state => state.unlocks.chapter3 },
  { id: 'earthBruteBoss', group: 'normal', name: '黃天力帥・鄧茂', areaId: 'loessSlope', unlock: state => state.unlocks.chapter3 },
  { id: 'yellowDemonGeneralBoss', group: 'normal', name: '黃巾妖將・程遠志', areaId: 'yellowHeavenAltar', unlock: state => state.progress.chapter3Cleared },
  { id: 'netherPhoenixBoss', group: 'hidden', name: '幽冥鳳凰', areaId: 'yellowHeavenAltar', unlock: state => state.chapter3?.phoenixUnlocked || state.chapter3?.phoenixDefeated }
];

export function normalizeQuickBattle(raw = {}) {
  return { selectedType: raw.selectedType === 'world' ? 'world' : 'normal', selectedId: typeof raw.selectedId === 'string' ? raw.selectedId : null, resultReady: Boolean(raw.resultReady), lastSource: null };
}

export function getQuickBattleGroups(state) {
  const normal = QUICK_BOSS_CATALOG.filter(entry => entry.group === 'normal' && entry.unlock(state));
  const hidden = QUICK_BOSS_CATALOG.filter(entry => entry.group === 'hidden' && entry.unlock(state));
  const world = Object.values(WORLD_BOSSES).filter(profile => getWorldBossState(state, profile.id)?.unlocked).map(profile => ({ id: profile.id, name: profile.name, group: 'world', recommendedPower: profile.recommendedPower }));
  return { normal, world, hidden };
}

export function selectQuickBoss(state, type, id) {
  const groups = getQuickBattleGroups(state), list = type === 'world' ? groups.world : [...groups.normal, ...groups.hidden];
  const entry = list.find(item => item.id === id);
  if (!entry) return null;
  state.quickBattle.selectedType = type === 'world' ? 'world' : 'normal';
  state.quickBattle.selectedId = id;
  state.quickBattle.resultReady = false;
  return entry;
}

export function prepareQuickBoss(state) {
  const { selectedType, selectedId } = state.quickBattle;
  if (!selectedId) return null;
  if (selectedType === 'world') return { type: 'world', id: selectedId };
  const entry = QUICK_BOSS_CATALOG.find(item => item.id === selectedId && item.unlock(state));
  if (!entry) return null;
  state.screen = entry.areaId;
  state.location = AREAS[entry.areaId]?.name || 'Boss 戰場';
  state.ui.bossWarning = true;
  state.ui.bossKind = entry.id === 'blackwindLord' ? null : entry.id;
  state.ui.bossRarityRank = 1;
  return { type: 'normal', id: entry.id };
}

export function markQuickBattle(state, battle) {
  if (!battle) return null;
  battle.sourceContext = 'quickBattle';
  battle.quickBattleType = state.quickBattle.selectedType;
  battle.quickBattleId = state.quickBattle.selectedId;
  return battle;
}

export function finishQuickBattle(state, source) {
  if (source !== 'quickBattle') return false;
  state.battle = null;
  state.screen = 'quickBattle';
  state.location = '快速 Boss 戰';
  state.quickBattle.resultReady = true;
  state.exploration.auto = false;
  state.exploration.active = false;
  return true;
}
