import { SAVE_VERSION, createParty } from './data.js';

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
    equipment: { weapon: false, armor: false },
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
  const safe = { ...fallback, ...member };
  for (const key of ['level', 'exp', 'maxHp', 'hp', 'maxMp', 'mp', 'might', 'defense', 'intelligence', 'speed']) {
    safe[key] = finite(safe[key], fallback[key]);
  }
  safe.hp = Math.max(0, Math.min(safe.hp, safe.maxHp));
  safe.mp = Math.max(0, Math.min(safe.mp, safe.maxMp));
  safe.guarding = false;
  return safe;
}

export function normalize(raw) {
  if (!raw?.created || !raw.playerName) return null;
  const base = createState(String(raw.playerName).slice(0, 12));
  const party = Array.from({ length: 5 }, (_, index) => normalizeMember(raw.party?.[index], base.party[index]));
  party[0].name = base.playerName;
  return {
    ...base,
    ...raw,
    version: SAVE_VERSION,
    playerName: base.playerName,
    party,
    gold: Math.max(0, finite(raw.gold, base.gold)),
    inventory: { ...base.inventory, ...(raw.inventory || {}) },
    equipment: { ...base.equipment, ...(raw.equipment || {}) },
    settings: { ...base.settings, ...(raw.settings || {}) },
    exploration: { ...base.exploration, ...(raw.exploration || {}), auto: false, active: false },
    battle: null,
    log: Array.isArray(raw.log) ? raw.log.slice(-60) : [],
    screen: ['village', 'plain', 'party', 'shop', 'settings'].includes(raw.screen) ? raw.screen : 'village'
  };
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
