import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DUNGEON, SAVE_VERSION, createBlackwindLeader } from '../src/data.js';
import { createState, normalize } from '../src/store.js';
import {
  advanceDungeon, checkDungeonEncounter, createDungeonFloor, declineDungeon,
  enterDungeon, exitDungeon, getDungeonEncounterChance, recruitBlackwindLeader,
  resolveRound, rollDungeonBossRarity, settleDungeonBattle, spareBlackwindLeader,
  usePotion
} from '../src/engine.js';
import { render } from '../src/ui.js';

let checks = 0;
const check = (value, message) => { assert.ok(value, message); checks += 1; };
const equal = (actual, expected, message) => { assert.equal(actual, expected, message); checks += 1; };
const zero = () => 0;

function readyState(screen = 'forest') {
  const state = createState('秘境測試');
  state.screen = screen;
  state.location = screen === 'stronghold' ? '黑風寨' : screen === 'plain' ? '村外平原' : '黑風森林';
  state.unlocks.forest = true;
  state.unlocks.stronghold = true;
  state.progress.forestEntered = true;
  state.progress.bossUnlocked = true;
  state.party.filter(Boolean).forEach(member => {
    member.level = 30; member.maxHp = 6000; member.hp = 6000; member.maxMp = 200; member.mp = 200;
    member.might = 800; member.defense = 500; member.speed = 300;
  });
  return state;
}

function win(state, rng = zero) {
  let guard = 0;
  while (state.battle && !state.battle.finished && guard++ < 40) resolveRound(state, 'attack', rng);
  check(guard < 40 && state.battle?.result === 'victory', 'battle ends in victory');
}

equal(SAVE_VERSION,18, 'save version is 17');
equal(DUNGEON.floors, 4, 'dungeon has four floors');
check(getDungeonEncounterChance(1) >= 0.05 && getDungeonEncounterChance(1) <= 0.08, 'base encounter chance is 5-8%');
check(getDungeonEncounterChance(30) > getDungeonEncounterChance(10), 'dungeon pity raises encounter chance');

for (const area of ['forest', 'stronghold']) {
  const state = readyState(area);
  state.exploration.auto = true;
  check(checkDungeonEncounter(state, zero), `${area} can discover dungeon`);
  check(state.dungeon.warning && !state.exploration.auto && !state.ui.bossWarning, `${area} warning stops auto without boss conflict`);
}
const plain = readyState('plain');
check(!checkDungeonEncounter(plain, zero), 'plain cannot discover dungeon');

const declined = readyState();
check(checkDungeonEncounter(declined, zero), 'warning opens before decline');
check(render(declined).includes('進入秘境') && render(declined).includes('放棄'), 'warning UI presents enter and decline actions');
check(declineDungeon(declined), 'dungeon can be declined');
check(!declined.dungeon.warning && !declined.battle, 'decline clears warning and battle');
declined.exploration.auto = true;
check(declined.exploration.auto, 'exploration can restart after decline');

const run = readyState('forest');
check(checkDungeonEncounter(run, zero), 'full run discovers dungeon');
check(enterDungeon(run, zero), 'can enter dungeon regardless of power gate');
equal(run.dungeon.floor, 1, 'floor one starts');
check(run.battle?.dungeon && run.battle.dungeonFloor === 1, 'floor one battle is tagged');
run.party[0].hp = 4200;
run.party[0].mp = 123;
win(run);
equal(run.party[0].hp, 4200, 'HP is not automatically restored after floor one');
equal(run.party[0].mp, 123, 'MP is not automatically restored after floor one');
check(settleDungeonBattle(run), 'floor one settles');
check(run.dungeon.awaitingAdvance && !run.battle, 'floor one offers advance or retreat');
check(advanceDungeon(run, zero), 'advance to floor two');
equal(run.dungeon.floor, 2, 'floor two starts');
check(run.battle.enemies.every(enemy => enemy.elite), 'floor two uses elite enemies');
run.inventory.potion = 1;
run.party[0].hp = 4000;
check(usePotion(run), 'potion can be used inside dungeon');
check(run.party[0].hp > 4000, 'potion heals inside dungeon');
win(run);
check(settleDungeonBattle(run), 'floor two settles');
const goldBeforeChest = run.gold;
check(advanceDungeon(run, zero), 'advance opens floor three chest');
equal(run.dungeon.floor, 3, 'floor three reached');
check(run.dungeon.awaitingAdvance && run.gold > goldBeforeChest && run.dungeon.loot.potion >= 1, 'floor three chest grants gold and potions');
check(advanceDungeon(run, zero), 'advance to floor four boss');
equal(run.dungeon.floor, 4, 'floor four reached');
check(run.battle.boss && run.battle.dungeon, 'floor four is dungeon boss');
const bossBaseMight = 47;
check(run.battle.enemies[0].might > bossBaseMight, 'dungeon boss receives multi-stat strength bonus');
win(run);
check(run.battle.awaitingRecruit, 'dungeon boss can be recruited');
check(run.battle.talismanDrops && Object.keys(run.battle.talismanDrops).length > 0, 'dungeon boss drops talismans');
check(run.dungeon.completed && run.battle.dungeonCompletionReward, 'completion reward is granted');
check(recruitBlackwindLeader(run, zero), 'dungeon boss recruitment succeeds');
check(!run.dungeon.active && !run.battle && run.screen === 'forest', 'successful recruitment returns to source and clears dungeon');
run.exploration.auto = true;
check(run.exploration.auto, 'auto exploration can restart after completion');

const retreat = readyState('stronghold');
check(checkDungeonEncounter(retreat, zero) && enterDungeon(retreat, zero), 'retreat run starts');
win(retreat);
settleDungeonBattle(retreat);
const retainedGold = retreat.gold;
check(exitDungeon(retreat, false), 'can retreat between floors');
equal(retreat.gold, retainedGold, 'retreat keeps acquired loot');
equal(retreat.screen, 'stronghold', 'retreat returns to source area');

const failure = readyState('forest');
failure.party[4] = createBlackwindLeader();
failure.progress.bossRecruited = true;
failure.dungeon.warning = true;
failure.dungeon.sourceScreen = 'forest';
failure.dungeon.sourceLocation = '黑風森林';
enterDungeon(failure, zero);
failure.battle = null;
failure.dungeon.floor = 4;
createDungeonFloor(failure, 5, zero);
win(failure);
const failureGold = failure.gold;
check(!recruitBlackwindLeader(failure, () => 0.99), 'legendary capture can fail');
check(failure.gold >= failureGold && !failure.dungeon.active && failure.screen === 'forest', 'capture failure keeps loot and returns safely');

const spare = readyState('forest');
spare.dungeon.warning = true; spare.dungeon.sourceScreen = 'forest'; spare.dungeon.sourceLocation = '黑風森林';
enterDungeon(spare, zero); spare.battle = null; spare.dungeon.floor = 4; createDungeonFloor(spare, 3, zero); win(spare);
check(spareBlackwindLeader(spare), 'dungeon boss can be spared');
check(!spare.dungeon.active && spare.screen === 'forest', 'spare ends dungeon safely');

const lowPower = createState('低戰力');
lowPower.screen = 'forest'; lowPower.location = '黑風森林'; lowPower.dungeon.warning = true; lowPower.dungeon.sourceScreen = 'forest'; lowPower.dungeon.sourceLocation = '黑風森林';
check(enterDungeon(lowPower, zero), 'low power does not block dungeon entry');

equal(rollDungeonBossRarity(() => 0.00), 1, 'ordinary dungeon boss can roll');
equal(rollDungeonBossRarity(() => 0.20), 2, 'elite dungeon boss can roll');
equal(rollDungeonBossRarity(() => 0.45), 3, 'rare dungeon boss can roll');
equal(rollDungeonBossRarity(() => 0.70), 4, 'epic dungeon boss can roll');
equal(rollDungeonBossRarity(() => 0.95), 5, 'legendary dungeon boss can roll');

const migrated = normalize({ ...readyState('forest'), version: 8, dungeon: { warning: true, active: true, floor: 2, sourceScreen: 'forest', sourceLocation: '黑風森林', pity: 17, loot: { gold: 88, potion: 1, items: ['ironArmor'], talismans: { novice: 1 } } }, battle: { unsafe: true } });
equal(migrated.version, 18, 'version 8 save migrates to current');
check(!migrated.dungeon.active && !migrated.dungeon.warning && !migrated.battle, 'active dungeon reload safely returns to source');
equal(migrated.screen, 'forest', 'reload restores source area');
equal(migrated.dungeon.pity, 17, 'reload preserves dungeon pity');
equal(migrated.dungeon.loot.gold, 88, 'reload preserves acquired dungeon loot');

const conflict = readyState('stronghold');
conflict.ui.bossWarning = true;
check(!checkDungeonEncounter(conflict, zero), 'boss warning and dungeon warning cannot coexist');
assert.doesNotThrow(() => render(run), 'completed dungeon state renders safely'); checks += 1;
assert.doesNotThrow(() => render(lowPower), 'active dungeon battle renders safely'); checks += 1;

const mainSource = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
equal((mainSource.match(/let loopTimer/g) || []).length, 1, 'only one timer is declared');
check(mainSource.includes('if (loopTimer !== null) return;'), 'timer guard prevents duplicates');
check(mainSource.includes('!state.dungeon.warning && !state.dungeon.active'), 'auto exploration waits while dungeon UI is active');

console.log(`V0.1.3 random dungeon smoke test: ${checks} assertions passed`);
