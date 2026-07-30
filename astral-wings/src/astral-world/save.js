import { SAVE_KEY, SAVE_VERSION, MAPS } from './data.js';
import { addExp, basePlayer, dailyQuests, normalizePet, recompute } from './core.js';
import { ensureTutorial } from './tutorial-system.js';
import { ensureObjectives, ensureUnlocks } from './objective-system.js';

const now = () => Date.now();
const dayKey = () => new Date().toISOString().slice(0, 10);

export function defaultState() {
  const state = {
    version: SAVE_VERSION,
    player: basePlayer(),
    mapId: 1,
    stage: 1,
    highestMap: 1,
    killsInStage: 0,
    inventory: [],
    equipped: {},
    pets: [],
    activePetId: null,
    petFragments: {},
    skills: [1, 1, 1, 1],
    skillAuto: [true, true, true, true],
    settings: {
      autoBoss: false,
      autoAdvance: true,
      autoEquip: true,
      autoSell: 'none',
      vibration: true,
      damageNumbers: true,
      powerSave: false,
      music: false,
      sound: false,
    },
    quests: { date: dayKey(), progress: {}, claimed: {} },
    stats: { kills: 0, bosses: 0, equipment: 0, captures: 0, battleSeconds: 0 },
    tutorial: { active: true, step: 0, completed: false, skipped: false, rewardsClaimed: [], manualSkills: 0, inspected: 0 },
    objectives: { currentId: 'kill_first', completed: [], claimed: [] },
    unlocks: { claimed: [] },
    lastSeen: now(),
    offlinePending: null,
  };
  ensureTutorial(state);
  ensureObjectives(state);
  ensureUnlocks(state);
  recompute(state);
  return state;
}

function merge(base, raw) {
  const state = { ...base, ...(raw || {}) };
  state.version = SAVE_VERSION;
  state.player = { ...base.player, ...(raw?.player || {}) };
  state.inventory = Array.isArray(raw?.inventory) ? raw.inventory : [];
  state.equipped = raw?.equipped && typeof raw.equipped === 'object' ? raw.equipped : {};
  state.pets = Array.isArray(raw?.pets) ? raw.pets.map(normalizePet) : [];
  state.petFragments = raw?.petFragments && typeof raw.petFragments === 'object' ? raw.petFragments : {};
  state.skills = Array.isArray(raw?.skills) ? raw.skills.slice(0, 4).map(n => Math.max(1, Number(n) || 1)) : base.skills;
  while (state.skills.length < 4) state.skills.push(1);
  state.skillAuto = Array.isArray(raw?.skillAuto) ? raw.skillAuto.slice(0, 4).map(Boolean) : base.skillAuto;
  while (state.skillAuto.length < 4) state.skillAuto.push(true);
  state.settings = { ...base.settings, ...(raw?.settings || {}) };
  state.stats = { ...base.stats, ...(raw?.stats || {}) };
  state.tutorial = { ...base.tutorial, ...(raw?.tutorial || {}) };
  state.objectives = { ...base.objectives, ...(raw?.objectives || {}) };
  state.unlocks = { ...base.unlocks, ...(raw?.unlocks || {}) };
  state.quests = { ...base.quests, ...(raw?.quests || {}) };
  state.quests.progress = { ...(raw?.quests?.progress || {}) };
  state.quests.claimed = { ...(raw?.quests?.claimed || {}) };
  state.mapId = Math.min(MAPS.length, Math.max(1, Number(state.mapId) || 1));
  state.highestMap = Math.min(MAPS.length, Math.max(1, Number(state.highestMap) || 1));
  state.stage = Math.min(5, Math.max(1, Number(state.stage) || 1));
  state.killsInStage = Math.max(0, Number(state.killsInStage) || 0);
  state.lastSeen = Number(state.lastSeen) || now();
  ensureTutorial(state);
  ensureObjectives(state);
  ensureUnlocks(state);
  recompute(state);
  return state;
}

function makeOffline(state, elapsedMs) {
  const seconds = Math.min(8 * 60 * 60, Math.max(0, Math.floor(elapsedMs / 1000)));
  if (seconds < 60) return null;
  const map = MAPS[state.highestMap - 1] || MAPS[0];
  const baseline = map.base || { exp: map.mobs?.[0]?.[5] || 12, gold: map.mobs?.[0]?.[6] || 6 };
  const cycle = 4.5;
  const battles = Math.floor(seconds / cycle);
  const multiplier = 0.35;
  return {
    seconds,
    exp: Math.floor(baseline.exp * battles * multiplier),
    gold: Math.floor(baseline.gold * battles * multiplier),
    equipment: Math.min(8, Math.floor(battles / 42)),
    fragments: Math.min(12, Math.floor(battles / 70)),
    claimed: false,
  };
}

function refreshDaily(state) {
  if (state.quests.date !== dayKey()) {
    state.quests = { date: dayKey(), progress: {}, claimed: {} };
  }
  for (const quest of dailyQuests()) {
    if (!(quest.id in state.quests.progress)) state.quests.progress[quest.id] = 0;
  }
}

export function loadState() {
  const base = defaultState();
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    const state = saved ? merge(base, JSON.parse(saved)) : base;
    refreshDaily(state);
    if (!state.offlinePending) {
      state.offlinePending = makeOffline(state, now() - state.lastSeen);
      state.lastSeen = now();
    }
    saveState(state);
    return state;
  } catch (error) {
    console.warn('[Astral World] save recovered with safe defaults.', error);
    return base;
  }
}

export function saveState(state) {
  try {
    state.lastSeen = now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.warn('[Astral World] save failed.', error);
    return false;
  }
}

export function claimOffline(state, makeItem) {
  const reward = state.offlinePending;
  if (!reward || reward.claimed) return null;
  addExp(state, reward.exp);
  state.player.gold += reward.gold;
  state.petFragments.starling = (state.petFragments.starling || 0) + reward.fragments;
  for (let i = 0; i < reward.equipment && state.inventory.length < 100; i += 1) state.inventory.push(makeItem(state.highestMap));
  reward.claimed = true;
  state.offlinePending = null;
  recompute(state);
  saveState(state);
  return reward;
}

export function exportSave(state) {
  return JSON.stringify({ ...state, lastSeen: now(), exportedAt: new Date().toISOString() }, null, 2);
}

export function importSave(text) {
  const parsed = JSON.parse(text);
  const state = merge(defaultState(), parsed);
  state.offlinePending = null;
  saveState(state);
  return state;
}

export function resetSave() {
  localStorage.removeItem(SAVE_KEY);
  return defaultState();
}
