export const FORMATION_TYPES = ['might', 'hp', 'mp', 'defense', 'wind'];

export const FORMATION_ORBS = {
  might: { icon: '⚔', name: '武力' }, hp: { icon: '♥', name: '兵力' },
  mp: { icon: '✦', name: '技力' }, defense: { icon: '盾', name: '防禦' }, wind: { icon: '➤', name: '疾風' }
};

export const FORMATION_AFFINITIES = {
  hero: ['might', 'hp', 'mp', 'defense', 'wind'], liuBei: ['hp', 'mp'], guanYu: ['might'], zhangFei: ['might', 'defense'],
  blackwindLeader: ['might'], crimsonTiger: ['might', 'wind'], 'yellow-captain': ['defense'],
  'yellow-commander': ['might'], 'zhang-bao': ['mp'], netherThunder: ['wind', 'mp']
};

const index = (row, col) => row * 6 + col;
const adjacent = (a, b) => Math.abs(Math.floor(a / 6) - Math.floor(b / 6)) + Math.abs(a % 6 - b % 6) === 1;

export function getFormationMaxUses(battle) {
  if (battle?.worldBoss) return 3;
  if (battle?.boss) return 2;
  return 1;
}

export function ensureFormation(battle) {
  if (!battle) return null;
  const old = battle.formation || {};
  battle.formation = {
    gauge: Math.max(0, Math.min(100, Number(old.gauge) || 0)), uses: Math.max(0, Number(old.uses) || 0),
    maxUses: getFormationMaxUses(battle), active: Boolean(old.active), board: Array.isArray(old.board) ? old.board : [],
    result: old.result || null, lastResult: old.lastResult || null, startedAt: Number(old.startedAt) || 0
  };
  return battle.formation;
}

export function addFormationGauge(battle, amount) {
  const formation = ensureFormation(battle);
  if (!formation || formation.uses >= formation.maxUses) return formation?.gauge || 0;
  formation.gauge = Math.min(100, formation.gauge + Math.max(0, Number(amount) || 0));
  return formation.gauge;
}

function randomType(rng, board, position) {
  const row = Math.floor(position / 6), col = position % 6;
  const blocked = new Set();
  if (col >= 2 && board[position - 1]?.type === board[position - 2]?.type) blocked.add(board[position - 1].type);
  if (row >= 2 && board[position - 6]?.type === board[position - 12]?.type) blocked.add(board[position - 6].type);
  const choices = FORMATION_TYPES.filter(type => !blocked.has(type));
  return choices[Math.floor(rng() * choices.length) % choices.length];
}

export function findMatches(board) {
  const matched = new Set(), groups = [];
  for (let row = 0; row < 5; row++) {
    for (let start = 0; start < 6;) {
      let end = start + 1;
      while (end < 6 && board[index(row, end)]?.type === board[index(row, start)]?.type) end++;
      if (end - start >= 3) { const cells = []; for (let col = start; col < end; col++) { cells.push(index(row, col)); matched.add(index(row, col)); } groups.push({ type: board[index(row, start)].type, cells }); }
      start = end;
    }
  }
  for (let col = 0; col < 6; col++) {
    for (let start = 0; start < 5;) {
      let end = start + 1;
      while (end < 5 && board[index(end, col)]?.type === board[index(start, col)]?.type) end++;
      if (end - start >= 3) { const cells = []; for (let row = start; row < end; row++) { cells.push(index(row, col)); matched.add(index(row, col)); } groups.push({ type: board[index(start, col)].type, cells }); }
      start = end;
    }
  }
  return { matched: [...matched], groups };
}

export function swapBoardCells(board, from, to) {
  // A locked orb cannot start a drag, but may still be displaced by another orb.
  if (!Number.isInteger(from) || !Number.isInteger(to) || !adjacent(from, to) || board[from]?.locked) return false;
  [board[from], board[to]] = [board[to], board[from]];
  return true;
}

export function hasAvailableMove(board) {
  for (let i = 0; i < 30; i++) for (const j of [i + 1, i + 6]) if (j < 30 && adjacent(i, j) && !board[i]?.locked && !board[j]?.locked) {
    [board[i], board[j]] = [board[j], board[i]];
    const possible = findMatches(board).matched.length > 0;
    [board[i], board[j]] = [board[j], board[i]];
    if (possible) return true;
  }
  return false;
}

function interferenceFor(battle, rng) {
  const result = { locked: new Set(), burning: new Set() };
  const phase = Number(battle?.worldBossPhase ?? battle?.enemies?.find(enemy => enemy.worldBoss)?.phase) || 1;
  if (!battle?.worldBoss || phase < 2) return result;
  const key = battle.worldBossId || battle.enemies?.[0]?.id;
  const target = key === 'netherThunder' ? result.locked : result.burning;
  const count = phase >= 3 ? 5 + Math.floor(rng() * 3) : 3 + Math.floor(rng() * 3);
  while (target.size < count) target.add(Math.floor(rng() * 30));
  return result;
}

export function createFormationBoard(battle = {}, rng = Math.random) {
  const board = [];
  for (let i = 0; i < 30; i++) board.push({ id: `orb-${i}-${Math.floor(rng() * 1e6)}`, type: randomType(rng, board, i), locked: false, burning: false });
  // Always leave at least one understandable opening move without pre-clearing the board.
  if (!hasAvailableMove(board)) {
    board[0].type = 'might'; board[1].type = 'might'; board[2].type = 'hp'; board[8].type = 'might';
  }
  const interference = interferenceFor(battle, rng);
  interference.locked.forEach(i => { board[i].locked = true; });
  interference.burning.forEach(i => { board[i].burning = true; });
  return board;
}

export function comboMultiplier(combos) {
  return combos <= 1 ? 1 : combos === 2 ? 1.18 : combos === 3 ? 1.38 : combos === 4 ? 1.62 : combos === 5 ? 1.9 : 1.9 + (combos - 5) * .22;
}

export function getAffinityBonuses(party = []) {
  const bonuses = Object.fromEntries(FORMATION_TYPES.map(type => [type, 0]));
  for (const member of party.filter(Boolean)) for (const type of FORMATION_AFFINITIES[member.id] || []) bonuses[type] = Math.min(.15, bonuses[type] + .05);
  return bonuses;
}

function groupValue(size, values) { return size >= 5 ? values[2] : size === 4 ? values[1] : values[0]; }

export function getFormationEffects(resolution, party = []) {
  const affinity = getAffinityBonuses(party), effects = { mightPct: 0, healPct: 0, mp: 0, defensePct: 0, windChance: 0, affinity };
  for (const group of resolution.groups) {
    const size = group.cells.length, boost = 1 + affinity[group.type];
    if (group.type === 'might') effects.mightPct += groupValue(size, [.15, .22, .3]) * boost;
    if (group.type === 'hp') effects.healPct += groupValue(size, [.06, .09, .13]) * boost;
    if (group.type === 'mp') effects.mp += Math.round(groupValue(size, [5, 7, 10]) * boost);
    if (group.type === 'defense') effects.defensePct += groupValue(size, [.1, .15, .22]) * boost;
    if (group.type === 'wind') effects.windChance += groupValue(size, [.08, .13, .2]) * boost;
  }
  effects.mightPct = Math.min(1.2, effects.mightPct); effects.healPct = Math.min(.45, effects.healPct);
  effects.defensePct = Math.min(.45, effects.defensePct); effects.windChance = Math.min(.65, effects.windChance);
  effects.comboMultiplier = comboMultiplier(resolution.combos);
  return effects;
}

export function resolveFormationBoard(input, rng = Math.random) {
  const board = input.map(cell => ({ ...cell })), groups = [];
  let cascades = 0, removedBurning = 0;
  while (cascades < 12) {
    const match = findMatches(board);
    if (!match.matched.length) break;
    cascades++;
    for (const group of match.groups) groups.push({ ...group, cascade: cascades });
    const removed = new Set(match.matched);
    for (const i of removed) if (board[i]?.burning) removedBurning++;
    for (let col = 0; col < 6; col++) {
      const survivors = [];
      for (let row = 4; row >= 0; row--) { const cell = board[index(row, col)]; if (!removed.has(index(row, col))) survivors.push(cell); }
      for (let row = 4, n = 0; row >= 0; row--, n++) board[index(row, col)] = survivors[n] || { id: `sky-${cascades}-${row}-${col}-${Math.floor(rng() * 1e6)}`, type: FORMATION_TYPES[Math.floor(rng() * 5) % 5], locked: false, burning: false };
    }
  }
  const uniqueByTypeCascade = [];
  for (const group of groups) uniqueByTypeCascade.push(group);
  return { board, groups: uniqueByTypeCascade, combos: uniqueByTypeCascade.length, cascades, removedBurning, burningRemaining: board.filter(cell => cell.burning).length };
}

export function startFormationPuzzle(battle, party, rng = Math.random) {
  const formation = ensureFormation(battle);
  if (!formation || battle.finished || formation.active || battle.mode !== 'puzzle') return false;
  formation.gauge = 0; formation.uses++; formation.active = true; formation.result = null;
  formation.board = createFormationBoard(battle, rng); formation.startedAt = Date.now();
  return true;
}

export function preparePuzzleTurn(battle, party, rng = Math.random) {
  const formation = ensureFormation(battle);
  if (!formation || battle?.mode !== 'puzzle' || battle.finished) return false;
  formation.active = false;
  formation.result = null;
  return startFormationPuzzle(battle, party, rng);
}

export function settleFormationPuzzle(battle, party, rng = Math.random) {
  const formation = ensureFormation(battle);
  if (!formation?.active) return null;
  const resolution = resolveFormationBoard(formation.board, rng);
  const effects = getFormationEffects(resolution, party);
  formation.active = false; formation.board = resolution.board;
  formation.result = { ...resolution, effects };
  formation.lastResult = formation.result;
  return formation.result;
}
