import { SAVE_VERSION, createBlackwindLeader, createParty } from './data.js';

export const STORAGE_KEY = 'qunxiong-world-v01';
const LEGACY_KEY = 'qunxiong-world-v2';

export function createState(playerName) {
  return {
    version: SAVE_VERSION,
    created: true,
    screen: 'village',
    location: '桃源村',
    playerName,
    gold: 120,
    party: createParty(playerName),
    inventory: { woodenSword: 0, clothArmor: 0, potion: 2 },
    equipment: {
      hero: { weapon: null, armor: null, accessory: null },
      'liu-bei': { weapon: null, armor: null, accessory: null },
      'guan-yu': { weapon: null, armor: null, accessory: null },
      'zhang-fei': { weapon: null, armor: null, accessory: null },
      'blackwind-lord': { weapon: null, armor: null, accessory: null }
    },
    unlocks: { forest: false, stronghold: false },
    progress: { forestEntered: false, strongholdKills: 0, bossUnlocked: false, bossDefeated: false, bossRecruited: false, chapterOneComplete: false, totalKills: 0 },
    ui: { selectedItem: null, selectedMember: 'hero', chapterComplete: false },
    settings: { autoBattle: false },
    exploration: { auto: false, active: false },
    battle: null,
    notice: '桃源村的晨霧尚未散去，新的旅程正等待著你。',
    log: []
  };
}

const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function normalizeMember(member, fallback) {
  if (!member) return fallback ? { ...fallback } : null;
  const defaults = fallback || createBlackwindLeader();
  const safe = { ...defaults, ...member };
  for (const key of ['level', 'exp', 'maxHp', 'hp', 'maxMp', 'mp', 'might', 'defense', 'intelligence', 'speed']) {
    safe[key] = finite(safe[key], defaults[key]);
  }
  safe.hp = Math.max(0, Math.min(safe.hp, safe.maxHp));
  safe.mp = Math.max(0, Math.min(safe.mp, safe.maxMp));
  safe.guarding = false;
  return safe;
}

export function normalize(raw) {
  if (!raw?.created || !raw.playerName) return null;
  const base = createState(String(raw.playerName).slice(0, 12));
  const progress = {
    ...base.progress,
    ...(raw.progress || {}),
    strongholdKills: Math.max(0, finite(raw.progress?.strongholdKills, 0)),
    totalKills: Math.max(0, finite(raw.progress?.totalKills, 0))
  };
  if (!progress.forestEntered && raw.location === '黑風森林') progress.forestEntered = true;
  progress.bossUnlocked = Boolean(progress.bossUnlocked || progress.strongholdKills >= 10 || progress.bossDefeated);
  const party = Array.from({ length: 5 }, (_, index) => normalizeMember(raw.party?.[index], index === 4 && progress.bossRecruited ? createBlackwindLeader() : base.party[index]));
  if (party[4]?.id === 'blackwind-lord') {
    progress.bossRecruited = true;
    progress.bossDefeated = true;
    progress.chapterOneComplete = true;
  }
  if (progress.bossRecruited && !party[4]) party[4] = createBlackwindLeader();
  party[0].name = base.playerName;
  return {
    ...base,
    ...raw,
    version: SAVE_VERSION,
    playerName: base.playerName,
    party,
    gold: Math.max(0, finite(raw.gold, base.gold)),
    inventory: { ...base.inventory, ...(raw.inventory || {}) },
    equipment: normalizeEquipment(raw.equipment, base.equipment),
    unlocks: {
      ...base.unlocks,
      ...(raw.unlocks || {}),
      forest: Boolean(raw.unlocks?.forest || party[0].level >= 3),
      stronghold: Boolean(raw.unlocks?.stronghold || (party[0].level >= 5 && progress.forestEntered))
    },
    progress,
    ui: { ...base.ui, ...(raw.ui || {}) },
    settings: { ...base.settings, ...(raw.settings || {}) },
    exploration: { ...base.exploration, ...(raw.exploration || {}), auto: false, active: false },
    battle: null,
    log: Array.isArray(raw.log) ? raw.log.slice(-60) : [],
    screen: ['village', 'plain', 'forest', 'stronghold', 'party', 'inventory', 'shop', 'settings'].includes(raw.screen) ? raw.screen : 'village'
  };
}

function normalizeEquipment(rawEquipment, fallback) {
  const normalized = Object.fromEntries(Object.entries(fallback).map(([id, slots]) => [id, { ...slots }]));
  if (!rawEquipment || typeof rawEquipment !== 'object') return normalized;
  if (typeof rawEquipment.weapon === 'boolean' || typeof rawEquipment.armor === 'boolean') {
    normalized.hero.weapon = rawEquipment.weapon ? 'woodenSword' : null;
    normalized.hero.armor = rawEquipment.armor ? 'clothArmor' : null;
    return normalized;
  }
  for (const [id, slots] of Object.entries(normalized)) normalized[id] = { ...slots, ...(rawEquipment[id] || {}) };
  return normalized;
}

export function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, battle: null, exploration: { ...state.exploration, auto: false, active: false } }));
    return true;
  } catch { return false; }
}

export function load() {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) return normalize(JSON.parse(current));
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return null;
    const old = JSON.parse(legacy);
    if (!old?.player?.name) return null;
    const migrated = createState(old.player.name);
    migrated.gold = finite(old.player.gold, migrated.gold);
    return migrated;
  } catch { return null; }
}

export function clearSave() { localStorage.removeItem(STORAGE_KEY); }
