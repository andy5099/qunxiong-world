import { ITEMS } from './data.js?v=v026-bonds-combo-3';
import { CHAPTER2_BOSSES, getChapter2CodexCompletion, recordChapter2Drop } from './chapter2-system.js?v=v026-bonds-combo-3';

export const BLACKWIND_DROPS = ['blackwindBlade', 'blackwindArmor', 'blackwindCharm', 'overlordBlade', 'blackwindWarArmor', 'leaderToken'];
export const WORLD_BOSS_DROPS = ['crimsonTigerClaw', 'crimsonWarArmor', 'crimsonTigerSeal'];
export const NETHER_WORLD_BOSS_DROPS=['netherThunderClaw','netherThunderArmor','thunderEmperorSeal'];
export const CODEX_MATERIALS = ['novice', 'intermediate', 'advanced', 'legendary'];
export const DIVINE_CODEX_MATERIALS = ['novice', 'intermediate', 'advanced'];
export const MASTERY_THRESHOLDS = [0, 100, 300, 700, 1500];
export const COLLECTION_MILESTONES = {
  25: { gold: 0, talismans: { novice: 5 }, divineTalismans: { novice: 3 } },
  50: { gold: 0, talismans: { intermediate: 3 }, divineTalismans: { intermediate: 2 } },
  75: { gold: 0, talismans: { advanced: 2 }, divineTalismans: { advanced: 1 } },
  100: { gold: 10000, talismans: { legendary: 1 }, divineTalismans: { advanced: 3 } }
};

const rankRecord = raw => ({ encountered: Boolean(raw?.encountered), defeated: Boolean(raw?.defeated), captured: Boolean(raw?.captured) });
const boolMap = (keys, raw = {}) => Object.fromEntries(keys.map(key => [key, Boolean(raw[key])]));

export function normalizeBossCodex(raw = {}) {
  return {
    blackwind: {
      ranks: Object.fromEntries([1, 2, 3, 4, 5].map(rank => [rank, rankRecord(raw.blackwind?.ranks?.[rank])])),
      encounters: Math.max(0, Number(raw.blackwind?.encounters) || 0),
      defeats: Math.max(0, Number(raw.blackwind?.defeats) || 0),
      captures: Math.max(0, Number(raw.blackwind?.captures) || 0),
      captureFailures: Math.max(0, Number(raw.blackwind?.captureFailures) || 0),
      drops: boolMap(BLACKWIND_DROPS, raw.blackwind?.drops),
      talismans: boolMap(CODEX_MATERIALS, raw.blackwind?.talismans),
      divineTalismans: boolMap(DIVINE_CODEX_MATERIALS, raw.blackwind?.divineTalismans)
    }
  };
}

export function normalizeWorldBossCodex(raw = {}, dropIds = WORLD_BOSS_DROPS) {
  return {
    discovered: Boolean(raw.discovered), challenged: Boolean(raw.challenged), defeated: Boolean(raw.defeated), captured: Boolean(raw.captured),
    captureAttempts: Math.max(0, Number(raw.captureAttempts) || 0), captureSuccesses: Math.max(0, Number(raw.captureSuccesses) || 0),
    drops: boolMap(dropIds, raw.drops)
  };
}

export function normalizeWorldBossMastery(raw = {}) {
  const exp = Math.max(0, Number(raw.exp) || 0);
  return { exp, level: getMasteryLevel(exp) };
}

export function getMasteryLevel(exp) {
  let level = 1;
  for (let index = 1; index < MASTERY_THRESHOLDS.length; index += 1) if (exp >= MASTERY_THRESHOLDS[index]) level = index + 1;
  return Math.min(5, level);
}

export function getMasteryProfile(state,id='crimsonTiger') {
  const mastery = normalizeWorldBossMastery(id==='crimsonTiger'?state.worldBossMastery:state.worldBossMasteries?.[id]);
  return {
    ...mastery,
    next: mastery.level < 5 ? MASTERY_THRESHOLDS[mastery.level] : null,
    hpPct: mastery.level >= 5 ? 0.08 : mastery.level >= 2 ? 0.03 : 0,
    mightPct: mastery.level >= 3 ? 0.03 : 0,
    skillPct: mastery.level >= 5 ? 0.15 : mastery.level >= 4 ? 0.05 : 0
  };
}

export function awardWorldBossMastery(state, battle) {
  let amount = battle.worldBoss ? 30 : battle.boss ? [0, 5, 5, 8, 12, 18][battle.bossRarityRank || 1] : battle.elite ? 2 : 1;
  if (battle.dungeon && battle.boss) amount = Math.ceil(amount * 1.25);
  let activeCount=0;
  for(const member of state.party.filter(member=>member?.worldBoss)){
    const id=member.id==='nether-thunder-beast'?'netherThunder':'crimsonTiger',mastery=id==='crimsonTiger'?state.worldBossMastery:state.worldBossMasteries[id];
    mastery.exp+=amount;mastery.level=getMasteryLevel(mastery.exp);activeCount+=1;
  }
  return activeCount ? amount : 0;
}

export function recordBlackwindEncounter(state, rank) {
  const entry = state.bossCodex.blackwind;
  entry.ranks[rank].encountered = true;
  entry.encounters += 1;
}

export function recordBlackwindDefeat(state, rank) {
  const entry = state.bossCodex.blackwind;
  entry.ranks[rank].encountered = true;
  entry.ranks[rank].defeated = true;
  entry.defeats += 1;
}

export function recordBlackwindCapture(state, rank, success) {
  const entry = state.bossCodex.blackwind;
  entry.ranks[rank].encountered = true;
  if (success) { entry.ranks[rank].captured = true; entry.captures += 1; }
  else entry.captureFailures += 1;
}

export function recordItemDrop(state, itemId) {
  if (BLACKWIND_DROPS.includes(itemId)) state.bossCodex.blackwind.drops[itemId] = true;
  if (WORLD_BOSS_DROPS.includes(itemId)) state.worldBossCodex.drops[itemId] = true;
  if(NETHER_WORLD_BOSS_DROPS.includes(itemId))state.worldBossCodices.netherThunder.drops[itemId]=true;
  recordChapter2Drop(state,itemId);
}

export function recordMaterials(state, talismans = {}, divineTalismans = {}) {
  for (const [id, amount] of Object.entries(talismans)) if (amount > 0 && id in state.bossCodex.blackwind.talismans) state.bossCodex.blackwind.talismans[id] = true;
  for (const [id, amount] of Object.entries(divineTalismans)) if (amount > 0 && id in state.bossCodex.blackwind.divineTalismans) state.bossCodex.blackwind.divineTalismans[id] = true;
}

export function syncCodexFromState(state) {
  const entry = state.bossCodex.blackwind;
  for (const id of BLACKWIND_DROPS) if ((state.inventory[id] || 0) > 0 || Object.values(state.equipment || {}).some(slots => Object.values(slots).includes(id))) entry.drops[id] = true;
  for (const id of WORLD_BOSS_DROPS) if ((state.inventory[id] || 0) > 0 || Object.values(state.equipment || {}).some(slots => Object.values(slots).includes(id))) state.worldBossCodex.drops[id] = true;
  for(const id of NETHER_WORLD_BOSS_DROPS)if((state.inventory[id]||0)>0||Object.values(state.equipment||{}).some(slots=>Object.values(slots).includes(id)))state.worldBossCodices.netherThunder.drops[id]=true;
  for(const profile of Object.values(CHAPTER2_BOSSES))for(const id of profile.drops)if((state.inventory[id]||0)>0||Object.values(state.equipment||{}).some(slots=>Object.values(slots).includes(id)))recordChapter2Drop(state,id);
  for (const id of CODEX_MATERIALS) if ((state.bossProgress.talismans[id] || 0) > 0) entry.talismans[id] = true;
  for (const id of DIVINE_CODEX_MATERIALS) if ((state.bossProgress.divineTalismans[id] || 0) > 0) entry.divineTalismans[id] = true;
  if (state.progress.bossDefeated) { entry.ranks[1].encountered = true; entry.ranks[1].defeated = true; }
  if (state.progress.bossRecruited) { entry.ranks[1].encountered = true; entry.ranks[1].defeated = true; entry.ranks[1].captured = true; }
  const oldCaptureRecords = (state.bossProgress.records || []).filter(record => record?.type === 'capture' && record.rank >= 1 && record.rank <= 5);
  if (oldCaptureRecords.length) {
    entry.captures = Math.max(entry.captures, oldCaptureRecords.filter(record => record.success).length);
    entry.captureFailures = Math.max(entry.captureFailures, oldCaptureRecords.filter(record => !record.success).length);
    for (const record of oldCaptureRecords) {
      entry.ranks[record.rank].encountered = true;
      if (record.success) entry.ranks[record.rank].captured = true;
    }
  }
  entry.encounters = Math.max(entry.encounters, state.progress.bossEncounters || 0);
  state.worldBossCodex.discovered ||= Boolean(state.worldBoss.unlocked);
  state.worldBossCodex.challenged ||= state.worldBoss.attempts > 0;
  state.worldBossCodex.defeated ||= Boolean(state.worldBoss.defeated);
  state.worldBossCodex.captured ||= Boolean(state.worldBoss.captured);
  const nw=state.worldBosses.netherThunder,nc=state.worldBossCodices.netherThunder;nc.discovered||=Boolean(nw.unlocked);nc.challenged||=nw.attempts>0;nc.defeated||=nw.defeated;nc.captured||=nw.captured;
  return state;
}

const countTrue = values => values.filter(Boolean).length;
export function getCodexCompletion(state) {
  const blackwind = state.bossCodex.blackwind;
  const rankDone = Object.values(blackwind.ranks).reduce((sum, rank) => sum + countTrue([rank.encountered, rank.defeated, rank.captured]), 0);
  const blackwindDone = rankDone + countTrue(Object.values(blackwind.drops));
  const blackwindTotal = 21;
  const materialsDone = countTrue(Object.values(blackwind.talismans)) + countTrue(Object.values(blackwind.divineTalismans));
  const worldDone = countTrue([state.worldBossCodex.discovered, state.worldBossCodex.challenged, state.worldBossCodex.defeated, state.worldBossCodex.captured]) + countTrue(Object.values(state.worldBossCodex.drops));
  const worldTotal = 7;
  const nether=state.worldBossCodices.netherThunder,netherDone=countTrue([nether.discovered,nether.challenged,nether.defeated,nether.captured])+countTrue(NETHER_WORLD_BOSS_DROPS.map(id=>nether.drops[id])),chapter2=getChapter2CodexCompletion(state);
  const includeChapter2=Boolean(state.unlocks?.chapter2||state.progress?.chapter2Unlocked||state.chapter2?.cleared);
  const includeNether=Boolean(state.worldBosses?.netherThunder?.unlocked||state.worldBosses?.netherThunder?.attempts||state.worldBosses?.netherThunder?.captured);
  const total = blackwindTotal + 7 + worldTotal + (includeNether?7:0) + (includeChapter2?chapter2.total:0);
  const done = blackwindDone + materialsDone + worldDone + (includeNether?netherDone:0) + (includeChapter2?chapter2.done:0);
  const pct = (value, maximum) => Math.round(value / maximum * 100);
  return { done, total, overall: pct(done, total), blackwind: pct(blackwindDone, blackwindTotal), materials: pct(materialsDone, 7), worldBoss: pct(worldDone, worldTotal), netherWorldBoss:pct(netherDone,7),chapter2:chapter2.pct,equipment:pct(countTrue(Object.values(blackwind.drops))+countTrue(Object.values(state.worldBossCodex.drops))+countTrue(Object.values(nether.drops)),12) };
}

export function claimCollectionMilestone(state, threshold) {
  const key = String(threshold);
  const reward = COLLECTION_MILESTONES[threshold];
  if (!reward || getCodexCompletion(state).overall < threshold || state.collectionMilestones.claimed[key]) return false;
  state.collectionMilestones.claimed[key] = true;
  state.gold += reward.gold;
  for (const [id, amount] of Object.entries(reward.talismans)) state.bossProgress.talismans[id] += amount;
  for (const [id, amount] of Object.entries(reward.divineTalismans)) state.bossProgress.divineTalismans[id] += amount;
  recordMaterials(state, reward.talismans, reward.divineTalismans);
  state.notice = `Boss 圖鑑 ${threshold}% 里程碑獎勵已領取！`;
  return true;
}

export function getHighestRank(ranks, field) {
  for (let rank = 5; rank >= 1; rank -= 1) if (ranks[rank]?.[field]) return rank;
  return 0;
}

export function getKnownItemName(state, itemId, world = false) {
  const known = world ? state.worldBossCodex.drops[itemId] : state.bossCodex.blackwind.drops[itemId];
  return known ? ITEMS[itemId]?.name : '???';
}
