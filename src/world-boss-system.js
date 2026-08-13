import { createCrimsonTiger } from './data.js?v=v015-world-boss';

export const WORLD_BOSS = {
  id: 'crimsonTiger',
  name: '赤焰魔虎',
  title: '世界王・赤焰魔虎',
  recommendedPower: 30000,
  captureRate: 0.05,
  stats: {
    level: 28,
    maxHp: 12800,
    maxMp: 180,
    might: 310,
    defense: 145,
    speed: 88,
    exp: 6200,
    gold: [4200, 5600]
  }
};

export function createWorldBossEnemy() {
  return {
    id: 'crimsonTigerBoss',
    instanceId: 'world-boss-crimson-tiger',
    name: WORLD_BOSS.name,
    displayName: WORLD_BOSS.title,
    ...WORLD_BOSS.stats,
    hp: WORLD_BOSS.stats.maxHp,
    mp: WORLD_BOSS.stats.maxMp,
    side: 'enemy',
    boss: true,
    worldBoss: true,
    phase: 1,
    rarityRank: 5,
    rarityStars: '★★★★★',
    assaultMultiplier: 2.2
  };
}

export function normalizeWorldBoss(raw = {}) {
  return {
    unlocked: Boolean(raw.unlocked),
    attempts: Math.max(0, Number(raw.attempts) || 0),
    bestPhase: Math.max(0, Math.min(3, Number(raw.bestPhase) || 0)),
    lowestHpPct: Math.max(0, Math.min(100, Number.isFinite(Number(raw.lowestHpPct)) ? Number(raw.lowestHpPct) : 100)),
    defeated: Boolean(raw.defeated),
    defeats: Math.max(0, Number(raw.defeats) || 0),
    captured: Boolean(raw.captured),
    firstRewardClaimed: Boolean(raw.firstRewardClaimed)
  };
}

export function getWorldBossResonance(state, memberOrId) {
  const member = typeof memberOrId === 'string' ? state.party.find(candidate => candidate?.id === memberOrId) : memberOrId;
  const result = { mightPct: 0, defensePct: 0, hpPct: 0, speedPct: 0, skillPct: 0, set: null };
  if (member?.id !== 'crimson-tiger') return result;
  const slots = state.equipment?.[member.id] || {};
  if (slots.weapon === 'crimsonTigerClaw') {
    result.mightPct += 0.10;
    result.speedPct += 0.05;
  }
  if (slots.armor === 'crimsonWarArmor') {
    result.hpPct += 0.10;
    result.defensePct += 0.10;
  }
  if (slots.accessory === 'crimsonTigerSeal') result.skillPct += 0.10;
  if (slots.weapon === 'crimsonTigerClaw' && slots.armor === 'crimsonWarArmor' && slots.accessory === 'crimsonTigerSeal') {
    result.set = '赤焰霸主';
    result.mightPct += 0.10;
    result.speedPct += 0.05;
    result.skillPct += 0.10;
  }
  return result;
}

export function addTigerToRoster(state) {
  if (state.roster.some(member => member?.id === 'crimson-tiger') || state.party.some(member => member?.id === 'crimson-tiger')) return false;
  state.roster.push(createCrimsonTiger());
  state.equipment['crimson-tiger'] ||= { weapon: null, armor: null, accessory: null };
  state.worldBoss.captured = true;
  return true;
}

export function deployRosterMember(state, memberId, slotIndex) {
  const index = state.roster.findIndex(member => member?.id === memberId);
  const slot = Math.max(0, Math.min(4, Number(slotIndex) || 0));
  if (index < 0) return false;
  const incoming = state.roster.splice(index, 1)[0];
  const outgoing = state.party[slot];
  state.party[slot] = incoming;
  if (outgoing) state.roster.push(outgoing);
  state.notice = `${incoming.name}已編入第 ${slot + 1} 隊伍格。`;
  return true;
}

export function withdrawPartyMember(state, memberId) {
  const index = state.party.findIndex(member => member?.id === memberId);
  if (index < 0 || state.party.filter(Boolean).length <= 1) return false;
  const member = state.party[index];
  if (state.roster.some(candidate => candidate?.id === member.id)) return false;
  state.roster.push(member);
  state.party[index] = null;
  state.notice = `${member.name}已移至待命名冊。`;
  return true;
}
