import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AREAS, ENEMIES, ITEMS, SAVE_VERSION } from '../src/data.js';
import {
  canEnterArea, compareItem, createEncounter, enterArea, equipItem,
  equippedCount, getFinalStats, refreshUnlocks, resolveRound, sellItem, unequipItem
} from '../src/engine.js';
import { createState, normalize } from '../src/store.js';

let checks = 0;
const check = (value, message) => { assert.ok(value, message); checks += 1; };
const equal = (actual, expected, message) => { assert.equal(actual, expected, message); checks += 1; };
const zero = () => 0;

const state = createState('林野測試');
equal(SAVE_VERSION, 8, 'save version');
equal(canEnterArea(state, 'forest'), false, 'forest starts locked');
equal(enterArea(state, 'forest'), false, 'cannot enter early');
equal(state.location, '桃源村', 'failed entry keeps location');
state.party[0].level = 3;
equal(refreshUnlocks(state), true, 'level 3 unlocks forest');
equal(state.unlocks.forest, true, 'unlock is stored');
equal(enterArea(state, 'forest'), true, 'forest entry works');
equal(state.location, AREAS.forest.name, 'forest location is active');

for (const id of AREAS.forest.enemies) {
  createEncounter(state, id, zero);
  equal(state.battle.enemies[0].id, id, `${id} encounter`);
  check(state.battle.enemies.every(enemy => enemy.loot), `${id} has loot table`);
}

createEncounter(state, 'blackwindWolf', zero);
state.battle.enemies.forEach(enemy => { enemy.hp = 1; enemy.speed = 0; enemy.might = 0; });
const beforeGold = state.gold;
while (!state.battle.finished) resolveRound(state, 'attack', zero);
equal(state.battle.result, 'victory', 'forest battle victory');
check(state.gold > beforeGold, 'forest grants gold');
equal(state.battle.dropId, 'greenEdgeSword', 'deterministic epic drop');
equal(state.inventory.greenEdgeSword, 1, 'drop enters inventory');

const baseMight = state.party[0].might;
equal(equipItem(state, 'hero', 'greenEdgeSword').ok, true, 'equip succeeds');
equal(state.equipment.hero.weapon, 'greenEdgeSword', 'slot stores item id');
equal(getFinalStats(state, 'hero').might, baseMight + ITEMS.greenEdgeSword.stats.might, 'weapon affects final might');
equal(getFinalStats(state, 'hero').speed, state.party[0].speed + ITEMS.greenEdgeSword.stats.speed, 'weapon affects final speed');
equal(equippedCount(state, 'greenEdgeSword'), 1, 'equipped count is stable');
equal(equipItem(state, 'liu-bei', 'greenEdgeSword').ok, false, 'one copy cannot equip twice');
equal(sellItem(state, 'greenEdgeSword').ok, false, 'equipped last copy cannot sell');

state.inventory.ironSword = 1;
const comparison = compareItem(state, 'hero', 'ironSword');
equal(comparison.current.id, 'greenEdgeSword', 'comparison sees current weapon');
check(comparison.differences.some(diff => diff.stat === 'might' && diff.value < 0), 'comparison marks downgrade');
equal(equipItem(state, 'hero', 'ironSword').ok, true, 'equipment replacement succeeds');
equal(state.equipment.hero.weapon, 'ironSword', 'replacement updates slot');
equal(equippedCount(state, 'greenEdgeSword'), 0, 'old item returns to inventory availability');
equal(sellItem(state, 'greenEdgeSword').ok, true, 'unequipped item can sell');
equal(state.inventory.greenEdgeSword, 0, 'sale removes one item');
equal(unequipItem(state, 'hero', 'weapon'), true, 'unequip succeeds');
equal(getFinalStats(state, 'hero').might, baseMight, 'unequip restores base might');

state.inventory.woodRing = 4;
for (const member of state.party.filter(Boolean)) equal(equipItem(state, member.id, 'woodRing').ok, true, `${member.name} can equip own copy`);
equal(equippedCount(state, 'woodRing'), 4, 'four party slots tracked');
equal(getFinalStats(state, 'guan-yu').maxHp, state.party[2].maxHp + 8, 'accessory affects max HP');

const migrated = normalize({
  ...createState('舊存檔'), version: 4,
  inventory: { woodenSword: 1, clothArmor: 1, potion: 2 },
  equipment: { weapon: true, armor: true }
});
equal(migrated.version, 8, 'old save upgrades version');
equal(migrated.equipment.hero.weapon, 'woodenSword', 'old weapon flag migrates');
equal(migrated.equipment.hero.armor, 'clothArmor', 'old armor flag migrates');
equal(migrated.party.length, 5, 'migration keeps party');
equal(migrated.screen, 'village', 'migration keeps safe screen');

const savedForest = normalize({ ...state, battle: { fake: true }, screen: 'forest', exploration: { auto: true, active: true } });
equal(savedForest.screen, 'forest', 'forest screen survives normalization');
equal(savedForest.battle, null, 'battle never resumes from save');
equal(savedForest.exploration.auto, false, 'auto exploration safely resets');
check(Object.keys(ITEMS).filter(id => ITEMS[id].type === 'equipment').length >= 10, 'equipment catalogue is complete');
check(AREAS.forest.enemies.filter(id => id !== 'forestBandit').every(id => ITEMS.potion && ENEMIES[id].loot.supply.includes('potion')), 'forest potion sources are configured');

const unarmored = createState('防禦比較');
const armored = createState('防禦比較');
armored.inventory.ironArmor = 1;
equal(equipItem(armored, 'hero', 'ironArmor').ok, true, 'armor equips for combat test');
for (const sample of [unarmored, armored]) {
  createEncounter(sample, 'bandit', zero);
  sample.battle.enemies = [{ ...sample.battle.enemies[0], hp: 9999, maxHp: 9999, speed: 999, might: 30 }];
}
const unarmoredHp = unarmored.party[0].hp;
const armoredHp = armored.party[0].hp;
resolveRound(unarmored, 'defend', zero);
resolveRound(armored, 'defend', zero);
check(unarmoredHp - unarmored.party[0].hp > armoredHp - armored.party[0].hp, 'armor defense reduces real battle damage');

const mainSource = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
equal((mainSource.match(/let loopTimer/g) || []).length, 1, 'only one exploration timer is declared');
check(mainSource.includes('stopLoop();'), 'auto exploration clears the previous timer before scheduling');

console.log(`V0.1 PR#2 smoke test: ${checks} assertions passed`);
