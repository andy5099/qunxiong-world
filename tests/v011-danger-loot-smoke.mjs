import assert from 'node:assert/strict';
import { AREAS, BOSS_PITY_LIMIT, BOSS_RECOMMENDED_POWER, ENEMIES, ITEMS, SAVE_VERSION } from '../src/data.js';
import { createState, normalize } from '../src/store.js';
import {
  checkBossEncounter, confirmQuickEquip, createBossEncounter, createEliteEnemy,
  equipItem, getBossEncounterChance, getFinalStats, getMemberPower, getTeamPower,
  optimizeEquipment, prepareQuickEquip, retreatFromBoss, rollBattleDrop
} from '../src/engine.js';
import { render } from '../src/ui.js';

let assertions = 0;
const check = (value, message) => { assert.ok(value, message); assertions += 1; };
const equal = (actual, expected, message) => { assert.equal(actual, expected, message); assertions += 1; };

equal(SAVE_VERSION,19, 'save version is 17');
equal(AREAS.plain.danger, 1, 'plain danger');
equal(AREAS.forest.danger, 2, 'forest danger');
equal(AREAS.stronghold.danger, 3, 'stronghold danger');
check(AREAS.stronghold.recommendedPower > AREAS.forest.recommendedPower, 'recommended power rises');
equal(BOSS_PITY_LIMIT, 20, 'boss pity limit');
equal(getBossEncounterChance(5), 0, 'first five searches safe');
equal(getBossEncounterChance(6), 0.05, 'boss chance starts on sixth search');
equal(getBossEncounterChance(20), 1, 'twentieth search guaranteed');

const state = createState('測試者');
const basePower = getTeamPower(state);
check(basePower > 0, 'team power calculated');
check(getMemberPower(state, 'hero') > 0, 'member power calculated');
state.inventory.greenEdgeSword = 1;
check(equipItem(state, 'hero', 'greenEdgeSword'), 'equipment can be worn');
check(getFinalStats(state, 'hero').might > state.party[0].might, 'equipment affects stats');
check(getTeamPower(state) > basePower, 'equipment affects team power');

const elite = createEliteEnemy(ENEMIES.blackwindWolf, 0);
check(elite.elite, 'elite flag');
check(elite.name.startsWith('精英・'), 'elite name');
check(elite.maxHp > ENEMIES.blackwindWolf.maxHp, 'elite hp boost');
check(elite.might > ENEMIES.blackwindWolf.might, 'elite attack boost');
equal(elite.exp, ENEMIES.blackwindWolf.exp * 2, 'elite exp boost');
check(elite.gold[0] > ENEMIES.blackwindWolf.gold[0], 'elite gold boost');

const pity = createState('偵察者');
pity.screen = 'stronghold';
pity.progress.bossEncounterCount = 19;
check(checkBossEncounter(pity, () => 0.99), 'pity triggers boss');
equal(pity.progress.bossEncounterCount, 0, 'pity counter resets');
equal(pity.progress.bossEncounters, 1, 'boss encounter recorded');
check(pity.ui.bossWarning, 'boss warning opens');
check(!pity.exploration.auto, 'warning stops auto exploration');
const goldBeforeRetreat = pity.gold;
check(retreatFromBoss(pity), 'retreat succeeds');
equal(pity.gold, goldBeforeRetreat, 'retreat has no resource penalty');
check(!pity.ui.bossWarning, 'warning closes after retreat');

pity.ui.bossWarning = true;
pity.ui.bossRarityRank = 1;
const warningHtml = render(pity);
check(warningHtml.includes('普通 Boss'), 'warning UI title');
check(warningHtml.includes('迎戰'), 'warning engage action');
check(warningHtml.includes('撤退'), 'warning retreat action');
check(warningHtml.includes(BOSS_RECOMMENDED_POWER.toLocaleString()), 'warning recommended power');
check(createBossEncounter(pity), 'boss encounter starts');
equal(pity.battle.enemies.length, 3, 'boss has two escorts');
check(pity.battle.enemies[0].boss, 'first enemy is boss');
equal(pity.battle.enemies[0].displayName, '★ 普通・黑風寨主', 'enemy boss identity clear');

const bossOnly = Object.values(ITEMS).filter(item => item.bossOnly);
equal(bossOnly.length, 21, 'boss-exclusive rewards include chapter three additions');
equal(bossOnly.filter(item => item.quality === '稀有').length, 3, 'three rare boss rewards');
equal(bossOnly.filter(item => item.quality === '史詩').length, 15, 'chapter three adds phoenix epic rewards');
const firstDrop = rollBattleDrop([{ ...ENEMIES.blackwindLord }], () => 0.5, true, true);
check(ITEMS[firstDrop].bossOnly, 'first boss drop is exclusive');
equal(ITEMS[firstDrop].quality, '稀有', 'first boss kill guarantees rare or better');
const epicDrop = rollBattleDrop([{ ...ENEMIES.blackwindLord }], () => 0, true, false);
equal(ITEMS[epicDrop].quality, '史詩', 'boss can drop epic');
equal(rollBattleDrop([{ ...ENEMIES.blackwindLord }], () => 0.9, true, false), null, 'repeat boss can miss equipment');

const gear = createState('整備者');
gear.inventory.blackwindBlade = 1;
gear.inventory.blackwindArmor = 1;
gear.inventory.blackwindCharm = 1;
check(prepareQuickEquip(gear, 'blackwindBlade'), 'quick equip prepared');
check(gear.ui.quickEquipItem === 'blackwindBlade', 'quick item stored');
check(confirmQuickEquip(gear), 'quick equip confirmed');
check(Object.values(gear.equipment).some(slots => slots.weapon === 'blackwindBlade'), 'quick equip applies item');
const changes = optimizeEquipment(gear);
check(Array.isArray(changes), 'optimizer returns changes');
check(Object.values(gear.equipment).some(slots => slots.armor === 'blackwindArmor'), 'optimizer equips armor');
check(Object.values(gear.equipment).some(slots => slots.accessory === 'blackwindCharm'), 'optimizer equips accessory');

const inventoryHtml = render({ ...gear, screen: 'inventory' });
check(inventoryHtml.includes('一鍵最佳裝備'), 'inventory optimizer UI');
check(inventoryHtml.includes('快速裝備'), 'quick equip UI');
const partyHtml = render({ ...gear, screen: 'party' });
check(partyHtml.includes('更換'), 'party slot change UI');
check(partyHtml.includes('戰力'), 'party power UI');

const migrated = normalize({ ...createState('舊玩家'), version: 6, progress: { bossDefeated: true }, inventory: { blackwindBlade: 1 } });
equal(migrated.version, 19, 'v6 save migrates');
check(migrated.progress.bossFirstKill, 'old boss victory preserves first kill');
equal(migrated.inventory.blackwindBlade, 1, 'old inventory preserved');
equal(migrated.progress.bossEncounterCount, 0, 'new pity counter defaults safely');
check(!migrated.ui.bossWarning, 'transient warning not restored');

console.log(`V0.1.1 danger/loot smoke test: ${assertions} assertions passed`);
