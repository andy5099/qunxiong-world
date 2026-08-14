import { ITEMS, SAVE_VERSION, createBlackwindLeader, createCrimsonTiger, createParty } from './data.js?v=v017-growth';
import { getBossRarity, normalizeBossProgress } from './boss-progression.js?v=v014-boss-gear';
import { normalizeWorldBoss } from './world-boss-system.js?v=v015-world-boss';
import { normalizeBossCodex, normalizeWorldBossCodex, normalizeWorldBossMastery, syncCodexFromState } from './boss-codex-system.js?v=v017-growth';

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
      ,'crimson-tiger': { weapon: null, armor: null, accessory: null }
    },
    unlocks: { forest: false, stronghold: false },
    progress: { forestEntered: false, strongholdKills: 0, bossUnlocked: false, bossDefeated: false, bossFirstKill: false, bossRecruited: false, chapterOneComplete: false, totalKills: 0, elitesDefeated: 0, bossEncounterCount: 0, bossEncounters: 0 },
    bossProgress: normalizeBossProgress(),
    worldBoss: normalizeWorldBoss(),
    bossCodex: normalizeBossCodex(),
    worldBossCodex: normalizeWorldBossCodex(),
    collectionMilestones: { claimed: { 25: false, 50: false, 75: false, 100: false } },
    worldBossMastery: normalizeWorldBossMastery(),
    worldBossRecords: { fastestRound: null, highestDamage: 0 },
    roster: [],
    ui: { selectedItem: null, selectedMember: 'hero', chapterComplete: false, bossWarning: false, bossRarityRank: null, worldBossConfirm: false, codexDetail: null, captureResult: null, quickEquipItem: null, partyEquipMember: null, partyEquipSlot: null, optimizeChanges: [] },
    settings: { autoBattle: false },
    exploration: { auto: false, active: false },
    dungeon: { warning: false, active: false, name: '血色洞窟', floor: 0, sourceScreen: null, sourceLocation: null, pity: 0, awaitingAdvance: false, completed: false, loot: { gold: 0, potion: 0, items: [], talismans: {} } },
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
  if (safe.id === 'blackwind-lord') {
    safe.rarityRank = Math.max(1, Math.min(5, finite(safe.rarityRank, 1)));
    safe.rarityName = getBossRarity(safe.rarityRank).name;
    safe.growthMultiplier = Math.max(1, finite(safe.growthMultiplier, 1 + (safe.rarityRank - 1) * 0.12));
  }
  return safe;
}

export function normalize(raw) {
  if (!raw?.created || !raw.playerName) return null;
  const base = createState(String(raw.playerName).slice(0, 12));
  const progress = {
    ...base.progress,
    ...(raw.progress || {}),
    strongholdKills: Math.max(0, finite(raw.progress?.strongholdKills, 0)),
    totalKills: Math.max(0, finite(raw.progress?.totalKills, 0)),
    elitesDefeated: Math.max(0, finite(raw.progress?.elitesDefeated, 0)),
    bossEncounterCount: Math.max(0, finite(raw.progress?.bossEncounterCount, 0)),
    bossEncounters: Math.max(0, finite(raw.progress?.bossEncounters, 0))
  };
  if (!progress.forestEntered && raw.location === '黑風森林') progress.forestEntered = true;
  progress.bossUnlocked = Boolean(progress.bossUnlocked || progress.strongholdKills >= 10 || progress.bossDefeated);
  progress.bossFirstKill = Boolean(progress.bossFirstKill || progress.bossDefeated);
  const party = Array.from({ length: 5 }, (_, index) => normalizeMember(raw.party?.[index], index === 4 && progress.bossRecruited ? createBlackwindLeader() : base.party[index]));
  if (party[4]?.id === 'blackwind-lord') {
    progress.bossRecruited = true;
    progress.bossDefeated = true;
    progress.chapterOneComplete = true;
  }
  party[0].name = base.playerName;
  const activeIds = new Set(party.filter(Boolean).map(member => member.id));
  const roster = Array.isArray(raw.roster) ? raw.roster.map(member => normalizeMember(member, member?.id === 'crimson-tiger' ? createCrimsonTiger() : null)).filter(member => member && !activeIds.has(member.id)).slice(0,20) : [];
  if (progress.bossRecruited && !party.some(member => member?.id === 'blackwind-lord') && !roster.some(member => member?.id === 'blackwind-lord')) roster.push(createBlackwindLeader());
  const worldBoss = normalizeWorldBoss({ ...(raw.worldBoss || {}), unlocked: raw.worldBoss?.unlocked || progress.chapterOneComplete });
  if (party.some(member=>member?.id==='crimson-tiger') || roster.some(member=>member?.id==='crimson-tiger')) worldBoss.captured=true;
  const rawDungeon = raw.dungeon || {};
  const dungeonSource = ['forest', 'stronghold'].includes(rawDungeon.sourceScreen) ? rawDungeon.sourceScreen : null;
  const dungeon = {
    ...base.dungeon,
    pity: Math.max(0, finite(rawDungeon.pity, 0)),
    sourceScreen: dungeonSource,
    sourceLocation: typeof rawDungeon.sourceLocation === 'string' ? rawDungeon.sourceLocation : null,
    loot: {
      ...base.dungeon.loot,
      ...(rawDungeon.loot || {}),
      gold: Math.max(0, finite(rawDungeon.loot?.gold, 0)),
      potion: Math.max(0, finite(rawDungeon.loot?.potion, 0)),
      items: Array.isArray(rawDungeon.loot?.items) ? rawDungeon.loot.items.filter(Boolean).slice(-30) : [],
      talismans: { ...(rawDungeon.loot?.talismans || {}) }
    }
  };
  // Active combat is intentionally not serialized; resume safely at the source area.
  if (rawDungeon.active || rawDungeon.warning) {
    dungeon.active = false;
    dungeon.warning = false;
    dungeon.floor = 0;
    dungeon.awaitingAdvance = false;
  }
  const normalized = {
    ...base,
    ...raw,
    version: SAVE_VERSION,
    playerName: base.playerName,
    party,
    gold: Math.max(0, finite(raw.gold, base.gold)),
    inventory: Object.fromEntries([...new Set([...Object.keys(ITEMS),...Object.keys(raw.inventory || {})])].map(id=>[id,Math.max(0,Math.floor(finite(raw.inventory?.[id],base.inventory[id]||0)))])),
    equipment: normalizeEquipment(raw.equipment, base.equipment),
    unlocks: {
      ...base.unlocks,
      ...(raw.unlocks || {}),
      forest: Boolean(raw.unlocks?.forest || party[0].level >= 3),
      stronghold: Boolean(raw.unlocks?.stronghold || (party[0].level >= 5 && progress.forestEntered))
    },
    progress,
    roster,
    worldBoss,
    bossCodex: normalizeBossCodex(raw.bossCodex),
    worldBossCodex: normalizeWorldBossCodex(raw.worldBossCodex),
    collectionMilestones: { claimed: { ...base.collectionMilestones.claimed, ...(raw.collectionMilestones?.claimed || {}) } },
    worldBossMastery: normalizeWorldBossMastery(raw.worldBossMastery),
    worldBossRecords: { fastestRound: Number(raw.worldBossRecords?.fastestRound) > 0 ? Number(raw.worldBossRecords.fastestRound) : null, highestDamage: Math.max(0, Number(raw.worldBossRecords?.highestDamage) || 0) },
    dungeon,
    bossProgress: normalizeBossProgress(raw.bossProgress),
    ui: { ...base.ui, ...(raw.ui || {}), bossWarning: false, bossRarityRank: null, worldBossConfirm: false, captureResult: null, optimizeChanges: [] },
    settings: { ...base.settings, ...(raw.settings || {}) },
    exploration: { ...base.exploration, ...(raw.exploration || {}), auto: false, active: false },
    battle: null,
    log: Array.isArray(raw.log) ? raw.log.slice(-60) : [],
    screen: dungeonSource && (rawDungeon.active || rawDungeon.warning) ? dungeonSource : ['village', 'plain', 'forest', 'stronghold', 'worldBoss', 'bossCodex', 'party', 'inventory', 'shop', 'settings'].includes(raw.screen) ? raw.screen : 'village'
  };
  return syncCodexFromState(normalized);
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
