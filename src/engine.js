import { AREAS, ENEMIES, EXP_TO_LEVEL, INN_COST, ITEMS, SLOT_NAMES, STAT_NAMES } from './data.js';

const alive = unit => unit && unit.hp > 0;
const randomInt = (min, max, rng = Math.random) => Math.floor(rng() * (max - min + 1)) + min;
const pick = (list, rng = Math.random) => list[Math.min(list.length - 1, Math.floor(rng() * list.length))];
const appendLog = (state, text, emphasis = '') => { state.log.push({ text, emphasis }); state.log = state.log.slice(-60); };

export function getMember(state, memberId) { return state.party.find(member => member?.id === memberId) || null; }

export function getFinalStats(state, memberOrId) {
  const member = typeof memberOrId === 'string' ? getMember(state, memberOrId) : memberOrId;
  if (!member) return null;
  const result = { might: member.might, defense: member.defense, maxHp: member.maxHp, speed: member.speed };
  const slots = state.equipment?.[member.id] || {};
  for (const itemId of Object.values(slots)) {
    const item = ITEMS[itemId];
    if (!item?.stats) continue;
    for (const [stat, value] of Object.entries(item.stats)) result[stat] = (result[stat] || 0) + value;
  }
  return result;
}

export function visitInn(state) {
  if (state.gold < INN_COST) return { ok: false, message: `金錢不足，客棧需要 ${INN_COST} 金。` };
  state.gold -= INN_COST;
  state.party.filter(Boolean).forEach(member => { member.hp = getFinalStats(state, member).maxHp; member.mp = member.maxMp; });
  state.notice = `全隊已在客棧休息，兵力與技力完全恢復。-${INN_COST} 金`;
  return { ok: true, message: state.notice };
}

export function buyItem(state, itemId) {
  const item = ITEMS[itemId];
  if (!item || item.price == null || state.gold < item.price) return { ok: false, message: '金錢不足。' };
  state.gold -= item.price;
  state.inventory[itemId] = (state.inventory[itemId] || 0) + 1;
  state.notice = `購買了 ${item.name}。`;
  return { ok: true, message: state.notice };
}

export function refreshUnlocks(state) {
  if (!state.unlocks.forest && state.party[0]?.level >= 3) {
    state.unlocks.forest = true;
    state.notice = '主角已達 Lv.3，黑風森林開放！';
    appendLog(state, '黑風森林已解鎖。', 'rare');
    return true;
  }
  return false;
}

export function canEnterArea(state, areaId) { return areaId !== 'forest' || state.unlocks.forest || state.party[0]?.level >= AREAS.forest.level; }

export function enterArea(state, areaId) {
  if (!AREAS[areaId]) return false;
  refreshUnlocks(state);
  if (!canEnterArea(state, areaId)) {
    state.notice = '需要 Lv.3 才能進入黑風森林。';
    return false;
  }
  state.screen = areaId;
  state.location = AREAS[areaId].name;
  state.notice = areaId === 'forest' ? '林間黑風盤旋，新的敵人與裝備正在等待。' : '你來到桃源村外的平原。';
  return true;
}

export function createEncounter(state, forcedId, rng = Math.random) {
  const area = state.location === AREAS.forest.name ? AREAS.forest : AREAS.plain;
  const id = forcedId || pick(area.enemies, rng);
  const base = ENEMIES[id];
  if (!base) return null;
  const count = area.id === 'plain' ? (id === 'wolf' ? randomInt(2, 3, rng) : randomInt(1, 2, rng)) : randomInt(1, 2, rng);
  const enemies = Array.from({ length: count }, (_, index) => ({ ...base, instanceId: `${id}-${index}`, hp: base.maxHp, guarding: false, side: 'enemy' }));
  state.party.filter(Boolean).forEach(member => { member.guarding = false; });
  state.battle = { enemies, round: 1, awaitingCommand: true, finished: false, areaId: area.id };
  state.exploration.active = false;
  state.log = [];
  appendLog(state, `遭遇 ${base.name}${count > 1 ? ` ×${count}` : ''}！`);
  return state.battle;
}

function attackPower(state, actor, skill = false, rng = Math.random) {
  const might = actor.side === 'enemy' ? actor.might : getFinalStats(state, actor).might;
  const variance = 0.9 + rng() * 0.2;
  return Math.round(might * (skill ? 1.65 : 1) * variance);
}

function dealDamage(state, actor, target, skill = false, rng = Math.random) {
  const targetDefense = target.side === 'enemy' ? target.defense : getFinalStats(state, target).defense;
  const reduced = target.guarding ? 0.48 : 1;
  const damage = Math.max(1, Math.round((attackPower(state, actor, skill, rng) - targetDefense * 0.45) * reduced));
  target.hp = Math.max(0, target.hp - damage);
  appendLog(state, `${actor.name}${skill ? '施展猛擊' : '攻擊'} ${target.name}，造成 ${damage} 傷害。${target.hp ? '' : ` ${target.name}倒下了！`}`);
  return damage;
}

function enemyTurn(state, enemy, rng) {
  const targets = state.party.filter(alive);
  if (targets.length) dealDamage(state, enemy, pick(targets, rng), false, rng);
}

function gainExp(member, amount, state) {
  member.exp += amount;
  while (member.exp >= EXP_TO_LEVEL(member.level)) {
    member.exp -= EXP_TO_LEVEL(member.level);
    member.level += 1;
    member.maxHp += 18;
    member.maxMp += 4;
    member.might += 3;
    member.defense += 2;
    member.speed += 1;
    member.hp = getFinalStats(state, member).maxHp;
    member.mp = member.maxMp;
    appendLog(state, `${member.name}升至 Lv.${member.level}！兵力、武力與防禦提升。`, 'level');
  }
}

function rollBattleDrop(enemies, rng = Math.random) {
  const sources = enemies.filter(enemy => enemy.loot);
  if (!sources.length) return null;
  const roll = rng();
  const quality = roll < 0.01 ? 'epic' : roll < 0.06 ? 'rare' : roll < 0.24 ? 'common' : roll < 0.34 ? 'supply' : null;
  if (!quality) return null;
  const source = pick(sources, rng);
  const table = source.loot[quality];
  return table?.length ? pick(table, rng) : null;
}

function finishVictory(state, rng) {
  const defeated = state.battle.enemies;
  const exp = defeated.reduce((sum, enemy) => sum + enemy.exp, 0);
  const gold = defeated.reduce((sum, enemy) => sum + randomInt(enemy.gold[0], enemy.gold[1], rng), 0);
  state.party.filter(Boolean).forEach(member => gainExp(member, exp, state));
  state.gold += gold;
  refreshUnlocks(state);
  const dropId = rollBattleDrop(defeated, rng);
  if (dropId) {
    const item = ITEMS[dropId];
    state.inventory[dropId] = (state.inventory[dropId] || 0) + 1;
    appendLog(state, `獲得【${item.name}】！`, item.quality === '史詩' ? 'epic' : item.quality === '稀有' ? 'rare' : 'drop');
    state.battle.dropId = dropId;
  }
  state.battle.finished = true;
  state.battle.result = 'victory';
  state.notice = `戰鬥勝利！全隊獲得 ${exp} EXP，取得 ${gold} 金。${dropId ? ` 獲得【${ITEMS[dropId].name}】！` : ''}`;
  appendLog(state, state.notice, dropId ? 'drop' : '');
}

function finishDefeat(state) {
  const loss = Math.min(state.gold, Math.max(5, Math.floor(state.gold * 0.1)));
  state.gold -= loss;
  state.party.filter(Boolean).forEach(member => {
    member.hp = Math.max(1, Math.ceil(getFinalStats(state, member).maxHp * 0.5));
    member.mp = Math.ceil(member.maxMp * 0.5);
  });
  state.battle.finished = true;
  state.battle.result = 'defeat';
  state.exploration.auto = false;
  state.screen = 'village';
  state.location = '桃源村';
  state.notice = `全隊戰敗，被村民救回桃源村，損失 ${loss} 金。`;
  appendLog(state, state.notice);
}

export function resolveRound(state, command = 'attack', rng = Math.random) {
  const battle = state.battle;
  if (!battle || battle.finished || !battle.awaitingCommand) return false;
  battle.awaitingCommand = false;
  const allies = state.party.filter(alive);
  const enemies = battle.enemies.filter(alive);
  if (!allies.length || !enemies.length) return false;
  state.party.filter(Boolean).forEach(member => { member.guarding = false; });
  if (command === 'defend') allies.forEach(member => { member.guarding = true; });
  const turns = [
    ...allies.map(unit => ({ unit, side: 'ally', speed: getFinalStats(state, unit).speed })),
    ...enemies.map(unit => ({ unit, side: 'enemy', speed: unit.speed }))
  ].sort((a, b) => b.speed - a.speed || rng() - 0.5);
  for (const turn of turns) {
    if (!alive(turn.unit)) continue;
    if (turn.side === 'ally') {
      const targets = battle.enemies.filter(alive);
      if (!targets.length) break;
      if (command === 'defend') { appendLog(state, `${turn.unit.name}採取防禦姿態。`); continue; }
      const useSlam = turn.unit.isPlayer && command === 'slam' && turn.unit.mp >= 6;
      if (useSlam) turn.unit.mp -= 6;
      dealDamage(state, turn.unit, targets[0], useSlam, rng);
    } else enemyTurn(state, turn.unit, rng);
    if (!state.party.some(alive)) break;
  }
  if (!battle.enemies.some(alive)) finishVictory(state, rng);
  else if (!state.party.some(alive)) finishDefeat(state);
  else { battle.round += 1; battle.awaitingCommand = true; }
  return true;
}

export function chooseAutoCommand(state, rng = Math.random) {
  const hero = state.party[0];
  return hero?.mp >= 6 && rng() < 0.3 ? 'slam' : 'attack';
}

export function usePotion(state) {
  if (!state.battle || state.battle.finished || !state.inventory.potion) return false;
  const target = state.party.filter(alive).sort((a, b) => a.hp / getFinalStats(state, a).maxHp - b.hp / getFinalStats(state, b).maxHp)[0];
  if (!target) return false;
  state.inventory.potion -= 1;
  target.hp = Math.min(getFinalStats(state, target).maxHp, target.hp + ITEMS.potion.heal);
  appendLog(state, `${target.name}使用回復藥，恢復 ${ITEMS.potion.heal} 兵力。`);
  return true;
}

export function equippedCount(state, itemId) {
  return Object.values(state.equipment).reduce((count, slots) => count + Object.values(slots).filter(id => id === itemId).length, 0);
}

export function equipItem(state, memberId, itemId) {
  const member = getMember(state, memberId), item = ITEMS[itemId];
  if (!member || item?.type !== 'equipment' || (state.inventory[itemId] || 0) <= equippedCount(state, itemId) - (state.equipment[memberId]?.[item.slot] === itemId ? 1 : 0)) return { ok: false, message: '沒有可裝備的物品。' };
  const oldId = state.equipment[memberId][item.slot];
  state.equipment[memberId][item.slot] = itemId;
  member.hp = Math.min(member.hp, getFinalStats(state, member).maxHp);
  state.notice = `${member.name}裝備了【${item.name}】。${oldId ? `【${ITEMS[oldId].name}】已放回背包。` : ''}`;
  return { ok: true, message: state.notice };
}

export function unequipItem(state, memberId, slot) {
  const member = getMember(state, memberId), itemId = state.equipment?.[memberId]?.[slot];
  if (!member || !itemId) return false;
  state.equipment[memberId][slot] = null;
  member.hp = Math.min(member.hp, getFinalStats(state, member).maxHp);
  state.notice = `${member.name}卸下了【${ITEMS[itemId].name}】。`;
  return true;
}

export function sellItem(state, itemId) {
  const item = ITEMS[itemId], owned = state.inventory[itemId] || 0;
  if (!item?.sell || owned <= equippedCount(state, itemId)) return { ok: false, message: owned ? '已裝備物品必須先卸下。' : '背包中沒有此物品。' };
  state.inventory[itemId] -= 1;
  state.gold += item.sell;
  state.notice = `出售【${item.name}】，獲得 ${item.sell} 金。`;
  return { ok: true, message: state.notice };
}

export function compareItem(state, memberId, itemId) {
  const item = ITEMS[itemId], member = getMember(state, memberId);
  if (!item || !member || item.type !== 'equipment') return null;
  const currentId = state.equipment[memberId][item.slot], current = ITEMS[currentId];
  const keys = new Set([...Object.keys(current?.stats || {}), ...Object.keys(item.stats || {})]);
  return {
    member, item, current,
    differences: [...keys].map(stat => ({ stat, name: STAT_NAMES[stat], value: (item.stats[stat] || 0) - (current?.stats?.[stat] || 0) }))
  };
}

export function getEquippedSummary(state, memberId) {
  return Object.entries(state.equipment[memberId] || {}).map(([slot, itemId]) => ({ slot, slotName: SLOT_NAMES[slot], item: ITEMS[itemId] || null }));
}

export function leaveBattle(state) { state.battle = null; state.log = []; state.exploration.active = false; }
