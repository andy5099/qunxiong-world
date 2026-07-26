import { C } from './config.js';

const base = () => ({
  version: 5, level: 1, star: 1, fragments: 0, gold: 0, materials: 0, high: 0, maxCombo: 0, complete: false,
  equipment: [], equipped: { weapon: null, secondary: null, armor: null, engine: null, core: null },
  endlessBest: 0, bossBest: 0, missions: {}, achievements: {}, settings: { reduceFlash: false, shake: true, showCore: false, powerSave: false }
});

// 以欄位補齊方式遷移 v1～v4，永不覆寫既有金幣與最高分。
const migrate = raw => {
  const defaults = base();
  const data = raw && typeof raw === 'object' ? raw : {};
  return { ...defaults, ...data, version: 5, settings: { ...defaults.settings, ...(data.settings || {}) }, equipped: { ...defaults.equipped, ...(data.equipped || {}) }, equipment: Array.isArray(data.equipment) ? data.equipment : [] };
};

export const load = () => { try { return migrate(JSON.parse(localStorage.getItem(C.save) || '{}')); } catch { return base(); } };
export const save = state => { try { localStorage.setItem(C.save, JSON.stringify(migrate(state))); } catch {} };
export const reset = () => { localStorage.removeItem(C.save); return load(); };
