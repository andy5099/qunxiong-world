import { PET_EVOLUTION_DATA, PET_VISUALS } from './data.js';
import { getPetEvolutionStage, normalizePet } from './pet-system.js';

export const PET_CODEX_BALANCE = Object.freeze({
  speciesCount: 20,
  discoveryAttackPerSpecies: .003,
  discoveryHpPerSpecies: .003,
  discoveryCap: .06,
  starsPerPetDamageStep: 10,
  petDamagePerStep: .01,
  petDamageCap: .10,
  evolutionPerBossDamageStep: 5,
  bossDamagePerStep: .005,
  bossDamageCap: .08,
});

const entry = (baseName, category, region, sourceHint, rarity) => ({ baseName, category, region, sourceHint, rarity });
export const PET_CODEX_DATA = Object.freeze({
  slime: entry('星芽史萊姆', '史萊姆', 1, '在星光草原擊敗星芽史萊姆。', 'normal'),
  rabbit: entry('月耳兔', '野獸', 1, '在星光草原追上月耳兔。', 'normal'),
  beetle: entry('微光甲蟲', '甲蟲', 1, '在星光草原擊敗微光甲蟲。', 'normal'),
  wolf: entry('幽影狼', '野獸', 2, '在幽藍森林擊敗幽影狼。', 'uncommon'),
  flower: entry('藍晶花妖', '植物', 2, '在幽藍森林擊敗藍晶花妖。', 'uncommon'),
  spirit: entry('森林小魔靈', '精靈', 2, '在幽藍森林擊敗森林小魔靈。', 'uncommon'),
  lizard: entry('火岩蜥蜴', '爬蟲', 3, '在灼熱峽谷擊敗火岩蜥蜴。', 'rare'),
  lava: entry('熔岩魔', '元素', 3, '在灼熱峽谷擊敗熔岩魔。', 'rare'),
  hawk: entry('赤焰鷹', '飛行', 3, '在灼熱峽谷擊敗赤焰鷹。', 'rare'),
  ice: entry('冰晶史萊姆', '史萊姆', 4, '在冰晶高原擊敗冰晶史萊姆。', 'rare'),
  snowwolf: entry('雪原狼', '野獸', 4, '在冰晶高原擊敗雪原狼。', 'rare'),
  golem: entry('寒霜魔像', '魔像', 4, '在冰晶高原擊敗寒霜魔像。', 'epic'),
  ruin: entry('遺跡守衛', '構裝', 5, '在星界遺跡擊敗遺跡守衛。', 'epic'),
  orb: entry('星核浮游體', '浮游體', 5, '在星界遺跡擊敗星核浮游體。', 'epic'),
  mech: entry('失控機甲', '機械', 5, '在星界遺跡擊敗失控機甲。', 'epic'),
  horn: entry('星冠巨獸', '區域 Boss', 1, '擊敗星光草原 Boss 才有機會收服。', 'boss'),
  guardian: entry('幽森古樹王', '區域 Boss', 2, '擊敗幽藍森林 Boss 才有機會收服。', 'boss'),
  dragon: entry('熔核暴君', '區域 Boss', 3, '擊敗灼熱峽谷 Boss 才有機會收服。', 'boss'),
  queen: entry('冰霜遺跡守護者', '區域 Boss', 4, '擊敗冰晶高原 Boss 才有機會收服。', 'boss'),
  destroyer: entry('星界審判者', '區域 Boss', 5, '擊敗星界遺跡 Boss 才有機會收服。', 'boss'),
});

export const PET_CODEX_REWARDS = Object.freeze([
  { id:'discover_5', type:'discoveries', target:5, gold:10000, label:'收錄 5 種：10,000 金幣' },
  { id:'discover_10', type:'discoveries', target:10, gold:50000, label:'收錄 10 種：50,000 金幣' },
  { id:'discover_15', type:'discoveries', target:15, gold:150000, label:'收錄 15 種：150,000 金幣' },
  { id:'discover_20', type:'discoveries', target:20, gold:500000, title:'星靈收藏家', label:'全收錄：500,000 金幣與稱號' },
  { id:'stars_25', type:'stars', target:25, cores:2, label:'總星級 25：2 進化核心' },
  { id:'stars_50', type:'stars', target:50, cores:5, label:'總星級 50：5 進化核心' },
  { id:'stars_75', type:'stars', target:75, cores:8, label:'總星級 75：8 進化核心' },
  { id:'stars_100', type:'stars', target:100, cores:15, label:'總星級 100：15 進化核心' },
]);

const finite = value => Math.max(0, Math.floor(Number(value) || 0));
const emptyEntry = () => ({ discovered:false, firstCapturedAt:0, highestLevel:0, highestStars:0, highestEvolutionRank:0 });

export function ensurePetCodex(state) {
  const raw = state.petCodex && typeof state.petCodex === 'object' ? state.petCodex : {};
  state.petCodex = { version:1, species:{ ...(raw.species || {}) }, claimedRewards:Array.isArray(raw.claimedRewards) ? [...new Set(raw.claimedRewards)] : [] };
  for (const kind of Object.keys(PET_CODEX_DATA)) {
    const current = state.petCodex.species[kind] || emptyEntry();
    state.petCodex.species[kind] = { ...emptyEntry(), ...current, discovered:Boolean(current.discovered), firstCapturedAt:finite(current.firstCapturedAt), highestLevel:finite(current.highestLevel), highestStars:finite(current.highestStars), highestEvolutionRank:Math.min(4, finite(current.highestEvolutionRank)) };
  }
  if (state.playerTitle === '星界馴獸師') state.playerTitle = '星靈收藏家';
  return state.petCodex;
}

export function updatePetCodexFromPet(state, pet, capturedAt = Date.now()) {
  if (!pet) return null;
  const normalized = normalizePet(pet); const kind = normalized.sourceKind;
  if (!PET_CODEX_DATA[kind]) return null;
  const codex = ensurePetCodex(state); const item = codex.species[kind];
  item.discovered = true;
  item.firstCapturedAt ||= finite(capturedAt);
  item.highestLevel = Math.max(item.highestLevel, finite(normalized.level || 1));
  item.highestStars = Math.max(item.highestStars, finite(normalized.stars || 1));
  item.highestEvolutionRank = Math.max(item.highestEvolutionRank, finite(normalized.evolutionRank));
  return item;
}

export function syncPetCodex(state) {
  ensurePetCodex(state);
  for (const pet of state.pets || []) updatePetCodexFromPet(state, pet, pet.obtainedAt || Date.now());
  return state.petCodex;
}

export function getPetCodexSummary(state) {
  const codex = ensurePetCodex(state); const values = Object.values(codex.species);
  const captures = values.filter(item => item.discovered).length;
  const totalStars = values.reduce((sum, item) => sum + (item.discovered ? item.highestStars : 0), 0);
  const totalEvolutionRank = values.reduce((sum, item) => sum + (item.discovered ? item.highestEvolutionRank : 0), 0);
  return { captures, totalStars, totalEvolutionRank, completion:Math.floor(captures / PET_CODEX_BALANCE.speciesCount * 100) };
}

export function getPetCodexBonuses(state) {
  const summary = getPetCodexSummary(state); const discovered = Math.min(summary.captures, PET_CODEX_BALANCE.speciesCount);
  return {
    attack:Math.min(PET_CODEX_BALANCE.discoveryCap, discovered * PET_CODEX_BALANCE.discoveryAttackPerSpecies),
    hp:Math.min(PET_CODEX_BALANCE.discoveryCap, discovered * PET_CODEX_BALANCE.discoveryHpPerSpecies),
    petDamage:Math.min(PET_CODEX_BALANCE.petDamageCap, Math.floor(summary.totalStars / PET_CODEX_BALANCE.starsPerPetDamageStep) * PET_CODEX_BALANCE.petDamagePerStep),
    bossDamage:Math.min(PET_CODEX_BALANCE.bossDamageCap, Math.floor(summary.totalEvolutionRank / PET_CODEX_BALANCE.evolutionPerBossDamageStep) * PET_CODEX_BALANCE.bossDamagePerStep),
    ...summary,
  };
}

export function getCodexRewardProgress(state, reward) { const summary = getPetCodexSummary(state); return reward.type === 'stars' ? summary.totalStars : summary.captures; }
export function canClaimPetCodexReward(state, rewardId) { const reward = PET_CODEX_REWARDS.find(item => item.id === rewardId); return Boolean(reward) && !ensurePetCodex(state).claimedRewards.includes(rewardId) && getCodexRewardProgress(state, reward) >= reward.target; }
export function claimPetCodexReward(state, rewardId) {
  const reward = PET_CODEX_REWARDS.find(item => item.id === rewardId); if (!reward || !canClaimPetCodexReward(state, rewardId)) return null;
  const codex = ensurePetCodex(state); codex.claimedRewards.push(rewardId);
  state.player.gold = finite(state.player.gold) + finite(reward.gold);
  state.evolutionCores = finite(state.evolutionCores) + finite(reward.cores);
  if (reward.title) state.playerTitle = reward.title;
  return reward;
}

export function getPetCodexDisplay(kind, record) {
  const data = PET_CODEX_DATA[kind]; const rank = record?.highestEvolutionRank || 0;
  const stage = PET_EVOLUTION_DATA[kind]?.stages?.[rank];
  return { ...data, sourceKind:kind, discovered:Boolean(record?.discovered), highestName:stage?.name || data.baseName, role:PET_EVOLUTION_DATA[kind]?.role || '', evolutionRank:rank, abilities:PET_EVOLUTION_DATA[kind]?.stages?.slice(1, rank + 1).map(item => item.ability?.label).filter(Boolean) || [] };
}

export function getPetCodexStage(pet) { return getPetEvolutionStage(pet); }

export function validatePetCodexData() {
  const issues=[]; const kinds=Object.keys(PET_CODEX_DATA); const visualKinds=Object.keys(PET_VISUALS);
  if(kinds.length!==20)issues.push(`expected 20 records, got ${kinds.length}`);
  for(const kind of kinds){const data=PET_CODEX_DATA[kind], evo=PET_EVOLUTION_DATA[kind];if(!visualKinds.includes(kind))issues.push(`${kind}: missing visual`);if(!evo)issues.push(`${kind}: missing evolution`);if(!Number.isInteger(data.region)||data.region<1||data.region>5)issues.push(`${kind}: invalid region`);if(!['normal','uncommon','rare','epic','boss'].includes(data.rarity))issues.push(`${kind}: invalid rarity`);if(!data.sourceHint?.trim())issues.push(`${kind}: missing source hint`);}
  if(kinds.filter(kind=>PET_CODEX_DATA[kind].rarity==='boss').length!==5)issues.push('expected 5 boss species');
  if(kinds.filter(kind=>PET_CODEX_DATA[kind].rarity!=='boss').length!==15)issues.push('expected 15 regular species');
  const ids=PET_CODEX_REWARDS.map(item=>item.id);if(new Set(ids).size!==ids.length)issues.push('duplicate reward id');if(PET_CODEX_REWARDS.some(item=>!Number.isInteger(item.target)||item.target<1))issues.push('invalid reward target');
  if(issues.length)console.warn('[Astral World] Pet Codex data validation:',issues);return issues;
}
