import { C } from './config.js';

const base = () => ({
  version: 5, level: 1, shipLevels: { dawn: 1 }, star: 1, fragments: 0, blueprints: 0, gold: 0, materials: 0, high: 0, maxCombo: 0, complete: false, activeShip: 'dawn', unlockedShips: ['dawn'],
  equipment: [], equipped: { weapon: null, secondary: null, armor: null, engine: null, core: null }, fusion: null, fusionAwaken: 0, fusionEvolution: 0,
  endlessBest: 0, bossBest: 0, unlockedStages: ['orbit'], stageProgress: {}, missions: { date: '', kills: 0, stages: 0, bosses: 0, claimed: {} }, achievements: { claimed: {} }, settings: { reduceFlash: false, shake: true, showCore: false, powerSave: false }
});

// 以欄位補齊方式遷移 v1～v4，永不覆寫既有金幣與最高分。
const migrate = raw => {
  const defaults = base();
  const data = raw && typeof raw === 'object' ? raw : {};
  const unlockedShips = Array.isArray(data.unlockedShips) && data.unlockedShips.length ? data.unlockedShips : defaults.unlockedShips;
  const shipLevels = { ...(data.shipLevels && typeof data.shipLevels === 'object' ? data.shipLevels : {}) };
  // 舊版只有一個戰機等級：安全保留到當前出戰戰機，其餘新機體從 Lv.1 開始。
  const legacyShip = data.activeShip || 'dawn';
  if (!Number.isFinite(shipLevels[legacyShip])) shipLevels[legacyShip] = Math.max(1, Number(data.level) || 1);
  unlockedShips.forEach(id => { if (!Number.isFinite(shipLevels[id])) shipLevels[id] = 1; });
  return { ...defaults, ...data, version: 8, shipLevels, unlockedShips, unlockedStages: Array.isArray(data.unlockedStages) && data.unlockedStages.length ? data.unlockedStages : defaults.unlockedStages, stageProgress: data.stageProgress && typeof data.stageProgress === 'object' ? data.stageProgress : {}, settings: { ...defaults.settings, ...(data.settings || {}) }, equipped: { ...defaults.equipped, ...(data.equipped || {}) }, equipment: Array.isArray(data.equipment) ? data.equipment : [], missions: { ...defaults.missions, ...(data.missions || {}), claimed: { ...defaults.missions.claimed, ...(data.missions?.claimed || {}) } }, achievements: { ...defaults.achievements, ...(data.achievements || {}), claimed: { ...defaults.achievements.claimed, ...(data.achievements?.claimed || {}) } } };
};

export const load = () => { try { return migrate(JSON.parse(localStorage.getItem(C.save) || '{}')); } catch { return base(); } };
export const save = state => { try { localStorage.setItem(C.save, JSON.stringify(migrate(state))); } catch {} };
export const reset = () => { localStorage.removeItem(C.save); return load(); };
