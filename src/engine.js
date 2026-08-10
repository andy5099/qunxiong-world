import { ENEMIES, EXP_TO_LEVEL, INN_COST, ITEMS } from './data.js';

const alive = unit => unit && unit.hp > 0;
const randomInt = (min, max, rng = Math.random) => Math.floor(rng() * (max - min + 1)) + min;
const appendLog = (state, text) => { state.log.push(text); state.log = state.log.slice(-60); };

export function visitInn(state) {
  if (state.gold < INN_COST) return { ok: false, message: `金錢不足，客棧需要 ${INN_COST} 金。` };
  state.gold -= INN_COST;
  state.party.filter(Boolean).forEach(member => { member.hp = member.maxHp; member.mp = member.maxMp; });
  state.notice = `全隊已在客棧休息，兵力與技力完全恢復。-${INN_COST} 金`;
  return { ok: true, message: state.notice };
}

export function buyItem(state, itemId) {
  const item = ITEMS[itemId];
  if (!item || state.gold < item.price) return { ok: false, message: '金錢不足。' };
  state.gold -= item.price;
  state.inventory[itemId] = (state.inventory[itemId] || 0) + 1;
  if (item.type === 'weapon' && !state.equipment.weapon) state.equipment.weapon = true;
  if (item.type === 'armor' && !state.equipment.armor) state.equipment.armor = true;
  state.notice = `購買了 ${item.name}。`;
  return { ok: true, message: state.notice };
}

export function createEncounter(state, forcedId, rng = Math.random) {
  const id = forcedId || (rng() < 0.55 ? 'wolf' : 'bandit');
  const base = ENEMIES[id];
  const count = id === 'wolf' ? randomInt(2, 3, rng) : randomInt(1, 2, rng);
  const enemies = Array.from({ length: count }, (_, index) => ({
    ...base, instanceId: `${id}-${index}`, hp: base.maxHp, guarding: false, side: 'enemy'
  }));
  state.party.filter(Boolean).forEach(member => { member.guarding = false; });
  state.battle = { enemies, round: 1, awaitingCommand: true, finished: false };
  state.exploration.active = false;
  state.log = [`遭遇 ${base.name}${count > 1 ? ` ×${count}` : ''}！`];
  return state.battle;
}

function attackPower(state, actor, skill = false, rng = Math.random) {
  const equipment = actor.isPlayer ? (state.equipment.weapon ? ITEMS.woodenSword.attack : 0) : 0;
  const variance = 0.9 + rng() * 0.2;
  return Math.round((actor.might + equipment) * (skill ? 1.65 : 1) * variance);
}

function dealDamage(state, actor, target, skill = false, rng = Math.random) {
  const armor = target.isPlayer && state.equipment.armor ? ITEMS.clothArmor.defense : 0;
  const reduced = target.guarding ? 0.48 : 1;
  const damage = Math.max(1, Math.round((attackPower(state, actor, skill, rng) - (target.defense + armor) * 0.45) * reduced));
  target.hp = Math.max(0, target.hp - damage);
  appendLog(state, `${actor.name}${skill ? '施展猛擊' : '攻擊'} ${target.name}，造成 ${damage} 傷害。${target.hp ? '' : ` ${target.name}倒下了！`}`);
}

function enemyTurn(state, enemy, rng) {
  const targets = state.party.filter(alive);
  if (!targets.length) return;
  dealDamage(state, enemy, targets[randomInt(0, targets.length - 1, rng)], false, rng);
}

function gainExp(member, amount, state) {
  if (!member) return;
  member.exp += amount;
  while (member.exp >= EXP_TO_LEVEL(member.level)) {
    member.exp -= EXP_TO_LEVEL(member.level);
    member.level += 1;
    member.maxHp += 18;
    member.maxMp += 4;
    member.might += 3;
    member.defense += 2;
    member.speed += 1;
    member.hp = member.maxHp;
    member.mp = member.maxMp;
    appendLog(state, `${member.name}升至 Lv.${member.level}！兵力、武力與防禦提升。`);
  }
}

function finishVictory(state, rng) {
  const defeated = state.battle.enemies;
  const exp = defeated.reduce((sum, enemy) => sum + enemy.exp, 0);
  const gold = defeated.reduce((sum, enemy) => sum + randomInt(enemy.gold[0], enemy.gold[1], rng), 0);
  state.party.filter(Boolean).forEach(member => gainExp(member, exp, state));
  state.gold += gold;
  state.battle.finished = true;
  state.battle.result = 'victory';
  state.notice = `戰鬥勝利！全隊獲得 ${exp} EXP，取得 ${gold} 金。`;
  appendLog(state, state.notice);
}

function finishDefeat(state) {
  const loss = Math.min(state.gold, Math.max(5, Math.floor(state.gold * 0.1)));
  state.gold -= loss;
  state.party.filter(Boolean).forEach(member => { member.hp = Math.max(1, Math.ceil(member.maxHp * 0.5)); member.mp = Math.ceil(member.maxMp * 0.5); });
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
  const turns = [...allies.map(unit => ({ unit, side: 'ally' })), ...enemies.map(unit => ({ unit, side: 'enemy' }))]
    .sort((a, b) => b.unit.speed - a.unit.speed || rng() - 0.5);
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
  const target = state.party.filter(alive).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  if (!target) return false;
  state.inventory.potion -= 1;
  target.hp = Math.min(target.maxHp, target.hp + ITEMS.potion.heal);
  appendLog(state, `${target.name}使用回復藥，恢復 ${ITEMS.potion.heal} 兵力。`);
  return true;
}

export function leaveBattle(state) {
  state.battle = null;
  state.log = [];
  state.exploration.active = false;
}
