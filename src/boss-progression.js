export const BOSS_RARITIES = {
  1: { rank: 1, name: '普通', stars: '★', chance: 0.55, multiplier: 1, reward: 1, recommendedPower: 3200, captureRate: 1, assault: 1.55, intimidateRounds: 2 },
  2: { rank: 2, name: '精英', stars: '★★', chance: 0.25, multiplier: 1.25, reward: 1.35, recommendedPower: 4300, captureRate: 0.7, assault: 1.7, intimidateRounds: 2 },
  3: { rank: 3, name: '稀有', stars: '★★★', chance: 0.13, multiplier: 1.52, reward: 1.75, recommendedPower: 5600, captureRate: 0.45, assault: 1.82, intimidateRounds: 3 },
  4: { rank: 4, name: '史詩', stars: '★★★★', chance: 0.06, multiplier: 1.9, reward: 2.3, recommendedPower: 6800, captureRate: 0.25, assault: 2.05, intimidateRounds: 3, aura: 0.12 },
  5: { rank: 5, name: '傳說', stars: '★★★★★', chance: 0.01, multiplier: 2.4, reward: 3.1, recommendedPower: 8800, captureRate: 0.1, assault: 2.3, intimidateRounds: 3, aura: 0.22 }
};

export const TALISMANS = {
  novice: { id: 'novice', name: '初階轉職兵符', fromRank: 1 },
  intermediate: { id: 'intermediate', name: '中階轉職兵符', fromRank: 2 },
  advanced: { id: 'advanced', name: '高階轉職兵符', fromRank: 3 },
  legendary: { id: 'legendary', name: '傳說轉職兵符', fromRank: 4 }
};

export const PROMOTION_RATES = { 1: 0.8, 2: 0.6, 3: 0.35, 4: 0.15 };
export const RANK_TALISMAN = { 1: 'novice', 2: 'intermediate', 3: 'advanced', 4: 'legendary' };

export function getBossRarity(rank = 1) { return BOSS_RARITIES[Math.max(1, Math.min(5, Number(rank) || 1))]; }

export function rollBossRarity(rng = Math.random) {
  const roll = rng();
  let cumulative = 0;
  for (let rank = 1; rank <= 5; rank += 1) {
    cumulative += BOSS_RARITIES[rank].chance;
    if (roll < cumulative) return BOSS_RARITIES[rank];
  }
  return BOSS_RARITIES[5];
}

export function createRarityBoss(base, rank = 1) {
  const rarity = getBossRarity(rank);
  const mightMultiplier = rarity.multiplier * (1 + (rarity.aura || 0));
  return {
    ...base,
    rarityRank: rarity.rank,
    rarityName: rarity.name,
    rarityStars: rarity.stars,
    displayName: `${rarity.stars} ${rarity.name}・${base.name}`,
    maxHp: Math.round(base.maxHp * rarity.multiplier),
    hp: Math.round(base.maxHp * rarity.multiplier),
    might: Math.round(base.might * mightMultiplier),
    defense: Math.round(base.defense * rarity.multiplier),
    speed: Math.round(base.speed * (1 + (rarity.multiplier - 1) * 0.45)),
    exp: Math.round(base.exp * rarity.reward),
    gold: base.gold.map(value => Math.round(value * rarity.reward)),
    assaultMultiplier: rarity.assault,
    intimidateRounds: rarity.intimidateRounds,
    recommendedPower: rarity.recommendedPower
  };
}

export function getCaptureRate(rank = 1) { return getBossRarity(rank).captureRate; }

export function rollTalisman(rank = 1, rng = Math.random) {
  const roll = rng();
  if (rank === 1) return roll < 0.38 ? 'novice' : null;
  if (rank === 2) return roll < 0.22 ? 'intermediate' : roll < 0.62 ? 'novice' : null;
  if (rank === 3) return roll < 0.16 ? 'advanced' : roll < 0.58 ? 'intermediate' : null;
  if (rank === 4) return roll < 0.1 ? 'legendary' : roll < 0.58 ? 'advanced' : null;
  return roll < 0.24 ? 'legendary' : roll < 0.82 ? 'advanced' : null;
}

export function getPromotionChance(rank, blessing = 0) {
  return Math.min(0.9, (PROMOTION_RATES[rank] || 0) + Math.max(0, Number(blessing) || 0));
}

export function normalizeBossProgress(raw = {}) {
  const talismans = Object.fromEntries(Object.keys(TALISMANS).map(id => [id, Math.max(0, Math.floor(Number(raw.talismans?.[id]) || 0))]));
  const blessings = Object.fromEntries([1, 2, 3, 4].map(rank => [rank, Math.max(0, Math.min(0.75, Number(raw.blessings?.[rank]) || 0))]));
  return { talismans, blessings, records: Array.isArray(raw.records) ? raw.records.slice(-80) : [] };
}

export function applyLeaderRarity(member, targetRank) {
  const rank = Math.max(1, Math.min(5, Number(targetRank) || 1));
  const oldRank = Math.max(1, Number(member.rarityRank) || 1);
  if (rank <= oldRank) return false;
  const oldScale = getBossRarity(oldRank).multiplier;
  const newScale = getBossRarity(rank).multiplier;
  const hpRatio = member.maxHp > 0 ? member.hp / member.maxHp : 1;
  member.maxHp = Math.round(member.maxHp / oldScale * newScale);
  member.hp = Math.max(1, Math.round(member.maxHp * hpRatio));
  member.might = Math.round(member.might / oldScale * newScale);
  member.defense = Math.round(member.defense / oldScale * newScale);
  member.speed = Math.round(member.speed / (1 + (oldScale - 1) * 0.25) * (1 + (newScale - 1) * 0.25));
  member.rarityRank = rank;
  member.rarityName = getBossRarity(rank).name;
  member.growthMultiplier = 1 + (rank - 1) * 0.12;
  return true;
}

export function attemptPromotion(state, rng = Math.random) {
  const member = state.party.find(unit => unit?.id === 'blackwind-lord');
  if (!member) return { ok: false, reason: 'missing' };
  const rank = Math.max(1, Number(member.rarityRank) || 1);
  if (rank >= 5) return { ok: false, reason: 'max' };
  const talismanId = RANK_TALISMAN[rank];
  if (!(state.bossProgress.talismans[talismanId] > 0)) return { ok: false, reason: 'material' };
  state.bossProgress.talismans[talismanId] -= 1;
  const blessing = state.bossProgress.blessings[rank] || 0;
  const chance = getPromotionChance(rank, blessing);
  const success = rng() < chance;
  if (success) {
    applyLeaderRarity(member, rank + 1);
    state.bossProgress.blessings[rank] = 0;
    state.notice = `${getBossRarity(rank + 1).stars} 轉職成功！黑風寨主晉升為${getBossRarity(rank + 1).name}武將！`;
  } else {
    state.bossProgress.blessings[rank] = Math.min(0.75, blessing + 0.05);
    state.notice = `轉職失敗！祝福提升至 +${Math.round(state.bossProgress.blessings[rank] * 100)}%。`;
  }
  state.bossProgress.records.push({ type: 'promotion', rank, success, chance, at: Date.now() });
  state.bossProgress.records = state.bossProgress.records.slice(-80);
  return { ok: true, success, chance, rank: member.rarityRank };
}
