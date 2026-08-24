import { ITEMS, SAVE_VERSION, createBasaltTurtle, createBlackwindLeader, createChapter3BossMember, createCrimsonTiger, createNetherThunderBeast, createParty, createYellowBossMember } from './data.js?v=v032a-art-1';
import { getBossRarity, normalizeBossProgress } from './boss-progression.js?v=v032a-art-1';
import { WORLD_BOSSES, normalizeWorldBoss } from './world-boss-system.js?v=v032a-art-1';
import { NETHER_WORLD_BOSS_DROPS, normalizeBossCodex, normalizeWorldBossCodex, normalizeWorldBossMastery, syncCodexFromState } from './boss-codex-system.js?v=v032a-art-1';
import { normalizeChapter2, normalizeChapter2Codex } from './chapter2-system.js?v=v032a-art-1';
import { discoverActiveBonds, normalizeBondState } from './bond-system.js?v=v032a-art-1';
import { normalizeEquipmentAwakening } from './equipment-awakening.js?v=v032a-art-1';
import { ensureWorldAnomaly, normalizeChapter3, normalizeChapter3Codex, normalizeWorldAnomaly } from './chapter3-system.js?v=v032a-art-1';
import { normalizeQuickBattle } from './quick-battle-system.js?v=v032a-art-1';

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
      ,'crimson-tiger': { weapon: null, armor: null, accessory: null },'yellow-captain':{weapon:null,armor:null,accessory:null},'yellow-commander':{weapon:null,armor:null,accessory:null},'zhang-bao':{weapon:null,armor:null,accessory:null},'nether-thunder-beast':{weapon:null,armor:null,accessory:null},'basalt-turtle':{weapon:null,armor:null,accessory:null},'storm-warden':{weapon:null,armor:null,accessory:null},'earth-brute':{weapon:null,armor:null,accessory:null},'yellow-demon-general':{weapon:null,armor:null,accessory:null},'nether-phoenix':{weapon:null,armor:null,accessory:null}
    },
    unlocks: { forest: false, stronghold: false, chapter2: false,chapter3:false },
    progress: { forestEntered: false, strongholdKills: 0, bossUnlocked: false, bossDefeated: false, bossFirstKill: false, bossRecruited: false, chapterOneComplete: false, chapter2Unlocked:false, chapter2Cleared:false,chapter3Unlocked:false,chapter3Cleared:false, totalKills: 0, elitesDefeated: 0, bossEncounterCount: 0, bossEncounters: 0 },
    bossProgress: normalizeBossProgress(),
    worldBoss: normalizeWorldBoss(),
    worldBosses: { netherThunder: normalizeWorldBoss(),basaltTurtle:normalizeWorldBoss() },
    bossCodex: normalizeBossCodex(),
    worldBossCodex: normalizeWorldBossCodex(),
    worldBossCodices: { netherThunder: normalizeWorldBossCodex({},NETHER_WORLD_BOSS_DROPS),basaltTurtle:normalizeWorldBossCodex({},['basaltShell','mountainStone','mysticTurtleCharm']) },
    collectionMilestones: { claimed: { 25: false, 50: false, 75: false, 100: false } },
    worldBossMastery: normalizeWorldBossMastery(),
    worldBossMasteries: { netherThunder: normalizeWorldBossMastery(),basaltTurtle:normalizeWorldBossMastery() },
    worldBossRecords: { fastestRound: null, highestDamage: 0 },
    worldBossRecordsById: { netherThunder: { fastestRound:null,highestDamage:0 },basaltTurtle:{fastestRound:null,highestDamage:0} },
    chapter2: normalizeChapter2(),
    chapter2Codex: normalizeChapter2Codex(),chapter3:normalizeChapter3(),chapter3Codex:normalizeChapter3Codex(),worldAnomaly:normalizeWorldAnomaly(),
    bonds: normalizeBondState(),
    equipmentAwakening: normalizeEquipmentAwakening(),
    roster: [],
    ui: { selectedItem: null, selectedMember: 'hero', chapterComplete: false, chapter2Complete:false,chapter3Complete:false,worldBossIntrusion:null, bossWarning: false, bossRarityRank: null, bossKind:null, worldBossConfirm: false, worldBossCandidate:null, selectedWorldBoss:'crimsonTiger', codexDetail: null, captureResult: null, worldBossComparison:null, quickEquipItem: null, partyEquipMember: null, partyEquipSlot: null, partySwapSlot:null, candidateSort:'power', optimizeChanges: [], awakeningItem:null, awakeningConfirm:false },
    settings: { autoBattle: false },
    exploration: { auto: false, active: false },
    dungeon: { warning: false, active: false, name: '血色洞窟', dungeonId:'bloodCavern', floor: 0, sourceScreen: null, sourceLocation: null, pity: 0, awaitingAdvance: false, completed: false, loot: { gold: 0, potion: 0, items: [], talismans: {} } },
    battle: null,
    quickBattle: normalizeQuickBattle(),
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
  safe.ultimateEnergy = Math.max(0, Math.min(100, finite(safe.ultimateEnergy, 0)));
  safe.guarding = false;
  if (safe.id === 'blackwind-lord') {
    safe.rarityRank = Math.max(1, Math.min(5, finite(safe.rarityRank, 1)));
    safe.rarityName = getBossRarity(safe.rarityRank).name;
    safe.growthMultiplier = Math.max(1, finite(safe.growthMultiplier, 1 + (safe.rarityRank - 1) * 0.12));
  }
  if (['yellow-captain','yellow-commander','zhang-bao'].includes(safe.id)) {
    safe.rarityRank=Math.max(1,Math.min(5,finite(safe.rarityRank,1)));safe.rarityName=getBossRarity(safe.rarityRank).name;safe.growthMultiplier=Math.max(1,finite(safe.growthMultiplier,1.2));
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
  const memberFallback=member=>member?.id==='crimson-tiger'?createCrimsonTiger():member?.id==='nether-thunder-beast'?createNetherThunderBeast():member?.id==='basalt-turtle'?createBasaltTurtle():['storm-warden','earth-brute','yellow-demon-general','nether-phoenix'].includes(member?.id)?createChapter3BossMember(member.id):['yellow-captain','yellow-commander','zhang-bao'].includes(member?.id)?createYellowBossMember(member.id):null;
  const roster = Array.isArray(raw.roster) ? raw.roster.map(member => normalizeMember(member, memberFallback(member))).filter(member => member && !activeIds.has(member.id)).slice(0,20) : [];
  if (progress.bossRecruited && !party.some(member => member?.id === 'blackwind-lord') && !roster.some(member => member?.id === 'blackwind-lord')) roster.push(createBlackwindLeader());
  const worldBoss = normalizeWorldBoss({ ...(raw.worldBoss || {}), unlocked: raw.worldBoss?.unlocked || progress.chapterOneComplete });
  if (party.some(member=>member?.id==='crimson-tiger') || roster.some(member=>member?.id==='crimson-tiger')) worldBoss.captured=true;
  const rawDungeon = raw.dungeon || {};
  const chapter2=normalizeChapter2({...(raw.chapter2||{}),unlocked:raw.chapter2?.unlocked||raw.unlocks?.chapter2||progress.chapterOneComplete,cleared:raw.chapter2?.cleared||progress.chapter2Cleared});
  progress.chapter2Unlocked=Boolean(progress.chapter2Unlocked||chapter2.unlocked);progress.chapter2Cleared=Boolean(progress.chapter2Cleared||chapter2.cleared);
  const netherThunder=normalizeWorldBoss(raw.worldBosses?.netherThunder,progress.chapter2Cleared);
  if(party.some(member=>member?.id==='nether-thunder-beast')||roster.some(member=>member?.id==='nether-thunder-beast'))netherThunder.captured=true;
  const chapter3=normalizeChapter3({...(raw.chapter3||{}),unlocked:raw.chapter3?.unlocked||progress.chapter2Cleared,cleared:raw.chapter3?.cleared||progress.chapter3Cleared});progress.chapter3Unlocked=Boolean(progress.chapter3Unlocked||chapter3.unlocked);progress.chapter3Cleared=Boolean(progress.chapter3Cleared||chapter3.cleared);
  const basaltTurtle=normalizeWorldBoss(raw.worldBosses?.basaltTurtle,progress.chapter3Cleared);if(party.some(member=>member?.id==='basalt-turtle')||roster.some(member=>member?.id==='basalt-turtle'))basaltTurtle.captured=true;
  for(const [id,record] of Object.entries({crimsonTiger:worldBoss,netherThunder,basaltTurtle})){
    const profile=WORLD_BOSSES[id],member=[...party,...roster].find(candidate=>candidate?.id===profile.memberId);
    if(member){record.captured=true;record.currentIndividual||={quality:member.individualQuality||'normal',talentId:member.individualTalent||null};record.highestCapturedQuality=record.highestCapturedQuality||record.currentIndividual.quality;member.individualQuality=record.currentIndividual.quality;member.individualTalent=record.currentIndividual.talentId;}
  }
  const dungeonSource = ['forest', 'stronghold','yellowCamp','yellowFortress'].includes(rawDungeon.sourceScreen) ? rawDungeon.sourceScreen : null;
  const dungeon = {
    ...base.dungeon,
    pity: Math.max(0, finite(rawDungeon.pity, 0)),
    sourceScreen: dungeonSource,
    name: rawDungeon.dungeonId==='yellowTomb'?'黃巾古墓':'血色洞窟',dungeonId:rawDungeon.dungeonId==='yellowTomb'?'yellowTomb':'bloodCavern',
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
      ,chapter2:Boolean(raw.unlocks?.chapter2||progress.chapterOneComplete),chapter3:Boolean(raw.unlocks?.chapter3||progress.chapter2Cleared)
    },
    progress,
    roster,
    worldBoss,
    worldBosses:{netherThunder,basaltTurtle},
    bossCodex: normalizeBossCodex(raw.bossCodex),
    worldBossCodex: normalizeWorldBossCodex(raw.worldBossCodex),
    worldBossCodices:{netherThunder:normalizeWorldBossCodex(raw.worldBossCodices?.netherThunder,NETHER_WORLD_BOSS_DROPS),basaltTurtle:normalizeWorldBossCodex(raw.worldBossCodices?.basaltTurtle,['basaltShell','mountainStone','mysticTurtleCharm'])},
    collectionMilestones: { claimed: { ...base.collectionMilestones.claimed, ...(raw.collectionMilestones?.claimed || {}) } },
    worldBossMastery: normalizeWorldBossMastery(raw.worldBossMastery),
    worldBossMasteries:{netherThunder:normalizeWorldBossMastery(raw.worldBossMasteries?.netherThunder),basaltTurtle:normalizeWorldBossMastery(raw.worldBossMasteries?.basaltTurtle)},
    worldBossRecords: { fastestRound: Number(raw.worldBossRecords?.fastestRound) > 0 ? Number(raw.worldBossRecords.fastestRound) : null, highestDamage: Math.max(0, Number(raw.worldBossRecords?.highestDamage) || 0) },
    worldBossRecordsById:{netherThunder:{fastestRound:Number(raw.worldBossRecordsById?.netherThunder?.fastestRound)>0?Number(raw.worldBossRecordsById.netherThunder.fastestRound):null,highestDamage:Math.max(0,Number(raw.worldBossRecordsById?.netherThunder?.highestDamage)||0)},basaltTurtle:{fastestRound:Number(raw.worldBossRecordsById?.basaltTurtle?.fastestRound)>0?Number(raw.worldBossRecordsById.basaltTurtle.fastestRound):null,highestDamage:Math.max(0,Number(raw.worldBossRecordsById?.basaltTurtle?.highestDamage)||0)}},
    chapter2,chapter2Codex:normalizeChapter2Codex(raw.chapter2Codex),chapter3,chapter3Codex:normalizeChapter3Codex(raw.chapter3Codex),worldAnomaly:normalizeWorldAnomaly(raw.worldAnomaly),
    bonds:normalizeBondState(raw.bonds),
    equipmentAwakening:normalizeEquipmentAwakening(raw.equipmentAwakening,raw.inventory),
    dungeon,
    quickBattle: normalizeQuickBattle(raw.quickBattle),
    bossProgress: normalizeBossProgress(raw.bossProgress),
    ui: { ...base.ui, ...(raw.ui || {}), bossWarning: false, bossRarityRank: null, worldBossConfirm: false, worldBossCandidate:null,worldBossIntrusion:null, captureResult: null, worldBossComparison:null, optimizeChanges: [], awakeningItem:null, awakeningConfirm:false },
    settings: { ...base.settings, ...(raw.settings || {}) },
    exploration: { ...base.exploration, ...(raw.exploration || {}), auto: false, active: false },
    battle: null,
    log: Array.isArray(raw.log) ? raw.log.slice(-60) : [],
    screen: dungeonSource && (rawDungeon.active || rawDungeon.warning) ? dungeonSource : ['village', 'plain', 'forest', 'stronghold','yellowRoad','yellowCamp','yellowFortress','desolateVillage','loessSlope','thunderValley','yellowHeavenAltar', 'worldBoss', 'quickBattle', 'bossCodex', 'bonds', 'party', 'inventory', 'shop', 'settings'].includes(raw.screen) ? raw.screen : 'village'
  };
  ensureWorldAnomaly(normalized);discoverActiveBonds(normalized);
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
