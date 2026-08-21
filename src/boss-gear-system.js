import { ITEMS } from './data.js?v=v024-high-speed-flipper-1';

export const DIVINE_TALISMANS = {
  novice: { id: 'novice', name: '初階神兵符' },
  intermediate: { id: 'intermediate', name: '中階神兵符' },
  advanced: { id: 'advanced', name: '高階神兵符' }
};

export const BOSS_GEAR_PATHS = {
  weapon: ['blackwindBlade', 'overlordBlade', 'demonOverlordBlade'],
  armor: ['blackwindArmor', 'blackwindWarArmor', 'tyrantWarArmor'],
  accessory: ['blackwindCharm', 'leaderToken', 'heavenlyLeaderToken']
};

const COSTS = { 1: { intermediate: 2 }, 2: { advanced: 3 } };

export function getBossGearInfo(itemId) {
  for (const [slot, path] of Object.entries(BOSS_GEAR_PATHS)) {
    const tier = path.indexOf(itemId) + 1;
    if (tier) return { slot, tier, path, nextId: path[tier] || null, costs: COSTS[tier] || null };
  }
  return null;
}

export function normalizeDivineTalismans(raw = {}) {
  return Object.fromEntries(Object.keys(DIVINE_TALISMANS).map(id => [id, Math.max(0, Math.floor(Number(raw[id]) || 0))]));
}

export function rollDivineTalismanDrops(rank = 1, dungeon = false, rng = Math.random) {
  const drops = {};
  const add = (id, amount = 1) => { if (amount > 0) drops[id] = (drops[id] || 0) + amount; };
  const bonus = dungeon ? 0.22 : 0;
  if (rank === 1) { if (rng() < 0.32 + bonus) add('novice'); }
  else if (rank === 2) { if (rng() < 0.68 + bonus) add('novice', 1 + (rng() < 0.25 ? 1 : 0)); if (rng() < 0.12 + bonus / 2) add('intermediate'); }
  else if (rank === 3) { if (rng() < 0.58 + bonus) add('intermediate'); if (rng() < 0.18 + bonus / 2) add('advanced'); }
  else if (rank === 4) { add('intermediate', 1 + (rng() < 0.45 ? 1 : 0)); if (rng() < 0.48 + bonus) add('advanced'); }
  else { add('intermediate'); if (rng() < 0.72 + bonus) add('advanced', 1 + (dungeon && rng() < 0.3 ? 1 : 0)); }
  return drops;
}

export function combineDivineTalismans(state, targetId, all = false) {
  const source = targetId === 'intermediate' ? 'novice' : targetId === 'advanced' ? 'intermediate' : null;
  if (!source) return { ok: false, amount: 0 };
  const available = Math.max(0, Math.floor(state.bossProgress.divineTalismans[source] || 0));
  const amount = all ? Math.floor(available / 5) : available >= 5 ? 1 : 0;
  if (!amount) return { ok: false, amount: 0 };
  state.bossProgress.divineTalismans[source] -= amount * 5;
  state.bossProgress.divineTalismans[targetId] += amount;
  state.notice = `神兵符合成成功：${DIVINE_TALISMANS[targetId].name} ×${amount}`;
  return { ok: true, amount };
}

export function combineAllDivineTalismans(state) {
  const first = combineDivineTalismans(state, 'intermediate', true);
  const second = combineDivineTalismans(state, 'advanced', true);
  const amount = first.amount + second.amount;
  if (!amount) state.notice = '目前沒有足夠的神兵符可合成。';
  return { ok: amount > 0, amount };
}

export function evolveBossGear(state, itemId) {
  const info = getBossGearInfo(itemId);
  if (!info?.nextId || !(state.inventory[itemId] > 0)) return { ok: false, reason: 'missing' };
  if (Object.entries(info.costs).some(([id, amount]) => (state.bossProgress.divineTalismans[id] || 0) < amount)) return { ok: false, reason: 'material' };
  Object.entries(info.costs).forEach(([id, amount]) => { state.bossProgress.divineTalismans[id] -= amount; });
  state.inventory[itemId] -= 1;
  state.inventory[info.nextId] = (state.inventory[info.nextId] || 0) + 1;
  for (const slots of Object.values(state.equipment)) if (slots[info.slot] === itemId) slots[info.slot] = info.nextId;
  state.notice = `進化成功！【${ITEMS[itemId].name}】進化為【${ITEMS[info.nextId].name}】。`;
  return { ok: true, nextId: info.nextId };
}

export function getBlackwindResonance(state, memberOrId) {
  const member = typeof memberOrId === 'string' ? state.party.find(unit => unit?.id === memberOrId) : memberOrId;
  const empty = { weaponTier: 0, armorTier: 0, accessoryTier: 0, mightPct: 0, defensePct: 0, hpPct: 0, speedPct: 0, assaultPct: 0, intimidateBonus: 0, set: null, freeAssault: false };
  if (member?.id !== 'blackwind-lord') return empty;
  const slots = state.equipment?.[member.id] || {};
  const tier = slot => getBossGearInfo(slots[slot])?.tier || 0;
  const result = { ...empty, weaponTier: tier('weapon'), armorTier: tier('armor'), accessoryTier: tier('accessory') };
  if (result.weaponTier) { result.assaultPct = [0, .10, .15, .25][result.weaponTier]; result.mightPct += [0, 0, .05, .10][result.weaponTier]; result.speedPct += result.weaponTier === 3 ? .05 : 0; }
  if (result.armorTier) { result.hpPct += [0, .05, .10, .15][result.armorTier]; result.defensePct += [0, 0, .05, .10][result.armorTier]; }
  if (result.accessoryTier) { result.speedPct += [0, .03, .05, .08][result.accessoryTier]; result.intimidateBonus = [0, 0, 1, 2][result.accessoryTier]; }
  const allEpic = result.weaponTier >= 2 && result.armorTier >= 2 && result.accessoryTier >= 2;
  const allLegendary = result.weaponTier === 3 && result.armorTier === 3 && result.accessoryTier === 3;
  if (allLegendary) { result.set = '鬼神霸主'; result.mightPct += .15; result.defensePct += .10; result.freeAssault = true; }
  else if (allEpic) { result.set = '黑風霸主'; result.mightPct += .10; }
  return result;
}
