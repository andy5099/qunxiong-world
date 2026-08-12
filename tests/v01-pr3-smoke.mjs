import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AREAS, ENEMIES, EXP_TO_LEVEL, ITEMS, SAVE_VERSION } from '../src/data.js';
import {
  canEnterArea, continueAfterChapter, createBossEncounter, createEncounter, enterArea,
  equipItem, getFinalStats, performEnemyAction, recruitBlackwindLeader, refreshUnlocks,
  resolveRound, spareBlackwindLeader
} from '../src/engine.js';
import { createState, normalize } from '../src/store.js';
import { render } from '../src/ui.js';

let checks = 0;
const equal = (actual, expected, message) => { assert.equal(actual, expected, message); checks += 1; };
const check = (value, message) => { assert.ok(value, message); checks += 1; };
const zero = () => 0;

function winCurrentBattle(state) {
  state.battle.enemies.forEach(enemy => { enemy.hp = 1; enemy.might = 0; enemy.speed = 0; });
  let guard = 0;
  while (!state.battle.finished && guard++ < 20) resolveRound(state, 'attack', zero);
  check(guard < 20, 'battle resolves safely');
}

equal(SAVE_VERSION, 8, 'save version upgraded');
const state = createState('寨主驗收');
state.party[0].level = 4;
state.progress.forestEntered = true;
refreshUnlocks(state);
equal(canEnterArea(state, 'stronghold'), false, 'level 4 cannot enter stronghold');
equal(enterArea(state, 'stronghold'), false, 'locked stronghold rejects entry');
equal(state.notice, '黑風寨守衛森嚴，目前還不是進攻的時候。', 'locked copy is exact');

state.party[0].level = 5;
equal(refreshUnlocks(state), true, 'level 5 plus forest visit unlocks stronghold');
equal(state.unlocks.stronghold, true, 'stronghold unlock persists in state');
equal(enterArea(state, 'stronghold'), true, 'stronghold entry succeeds');
equal(state.location, AREAS.stronghold.name, 'stronghold location set');

for (const id of AREAS.stronghold.enemies) {
  createEncounter(state, id, zero);
  equal(state.battle.enemies[0].id, id, `${id} spawns`);
  check(Boolean(ENEMIES[id].loot), `${id} uses existing loot data`);
  winCurrentBattle(state);
  state.battle = null;
}
check(state.progress.strongholdKills > 0, 'stronghold victories count defeated enemies');
check(Object.values(state.inventory).some(value => value > 0), 'stronghold drops enter shared inventory');

while (state.progress.strongholdKills < 10) {
  createEncounter(state, 'strongholdSoldier', zero);
  winCurrentBattle(state);
  state.battle = null;
}
equal(state.progress.strongholdKills, 10, 'kill counter caps at 10');
equal(state.progress.bossUnlocked, true, '10 kills permanently unlock boss');
const strongholdHtml = render(state);
check(strongholdHtml.includes('危險偵察'), 'stronghold UI shows danger encounter progress');
check(strongholdHtml.includes('前線偵察'), 'stronghold UI explains random boss encounter');

state.exploration.auto = true;
const bossBattle = createBossEncounter(state);
check(Boolean(bossBattle), 'boss challenge starts');
equal(state.exploration.auto, false, 'boss stops auto exploration');
equal(bossBattle.enemies.length, 3, 'boss plus two soldiers');
equal(bossBattle.enemies.filter(enemy => enemy.boss).length, 1, 'exactly one boss');
equal(bossBattle.enemies.filter(enemy => enemy.id === 'strongholdSoldier').length, 2, 'two escort soldiers');

const skillState = createState('技能驗收');
const boss = { ...ENEMIES.blackwindLord, hp: 390, mp: 36, side: 'enemy' };
const assault = performEnemyAction(skillState, boss, zero);
equal(assault.type, 'assault', 'boss strong assault executes');
check(assault.damage > 0, 'strong assault deals damage');
const rolls = [0, 0.6];
const intimidate = performEnemyAction(skillState, { ...boss, mp: 0 }, () => rolls.shift() ?? 0.6);
equal(intimidate.type, 'intimidate', 'boss intimidate executes');
equal(skillState.party[0].intimidatedRounds, 2, 'intimidate applies temporary defense debuff');

winCurrentBattle(state);
equal(state.battle.result, 'victory', 'boss victory resolves');
equal(state.progress.bossDefeated, true, 'first boss defeat persists');
equal(state.battle.awaitingRecruit, true, 'first victory presents recruitment choice');
const recruitHtml = render(state);
check(recruitHtml.includes('data-action="battle:recruit"'), 'recruit button is rendered');
check(recruitHtml.includes('data-action="battle:spare"'), 'spare button is rendered');
equal(spareBlackwindLeader(state), true, 'spare choice works');
equal(state.party[4], null, 'spare does not recruit');
equal(state.progress.bossUnlocked, true, 'spare keeps challenge unlocked');

createBossEncounter(state);
winCurrentBattle(state);
equal(recruitBlackwindLeader(state), true, 'recruit succeeds at 100 percent');
equal(state.party[4].id, 'blackwind-lord', 'leader fills fifth slot');
equal(state.party.filter(Boolean).length, 5, 'party now has five members');
equal(state.progress.bossRecruited, true, 'recruit flag set');
equal(state.progress.chapterOneComplete, true, 'chapter completion set');
equal(state.ui.chapterComplete, true, 'chapter completion panel opens');
const chapterHtml = render(state);
check(chapterHtml.includes('第一章完成！'), 'chapter completion UI renders');
check(chapterHtml.includes('data-action="chapter:continue"'), 'continue adventure button renders');
check(chapterHtml.includes('黑風寨主'), 'fifth officer renders in game UI');
equal(recruitBlackwindLeader(state), false, 'duplicate recruitment rejected');
equal(state.party.filter(member => member?.id === 'blackwind-lord').length, 1, 'only one leader exists');

state.inventory.blackwindBlade = 1;
state.inventory.blackwindArmor = 1;
state.inventory.blackwindCharm = 1;
equal(equipItem(state, 'blackwind-lord', 'blackwindBlade').ok, true, 'leader equips weapon');
equal(equipItem(state, 'blackwind-lord', 'blackwindArmor').ok, true, 'leader equips armor');
equal(equipItem(state, 'blackwind-lord', 'blackwindCharm').ok, true, 'leader equips accessory');
const leader = state.party[4];
equal(getFinalStats(state, leader).might, leader.might + 17, 'leader weapon and charm affect might');
equal(getFinalStats(state, leader).defense, leader.defense + 13, 'leader armor and charm affect defense');

continueAfterChapter(state);
equal(state.ui.chapterComplete, false, 'chapter panel closes');
const leaderExp = leader.exp;
enterArea(state, 'stronghold');
createEncounter(state, 'strongholdSoldier', zero);
winCurrentBattle(state);
check(leader.exp > leaderExp || leader.level > 5, 'recruited leader earns battle EXP');
state.battle = null;
leader.exp = EXP_TO_LEVEL(leader.level) - 1;
const levelBefore = leader.level;
createEncounter(state, 'strongholdSoldier', zero);
winCurrentBattle(state);
check(leader.level > levelBefore, 'recruited leader levels up');
state.battle = null;

createBossEncounter(state);
winCurrentBattle(state);
equal(state.battle.awaitingRecruit, true, 'repeat boss victory allows one upgrade capture attempt');
equal(state.party.filter(member => member?.id === 'blackwind-lord').length, 1, 'repeat boss keeps one leader');

const migrated = normalize({
  ...createState('PR2存檔'), version: 5, screen: 'forest', location: '黑風森林',
  inventory: { potion: 4, greenEdgeSword: 1 },
  equipment: { ...createState('PR2存檔').equipment, hero: { weapon: 'greenEdgeSword', armor: null, accessory: null } },
  party: createState('PR2存檔').party
});
equal(migrated.version, 8, 'PR2 save migrates to current version');
equal(migrated.inventory.greenEdgeSword, 1, 'migration preserves inventory');
equal(migrated.equipment.hero.weapon, 'greenEdgeSword', 'migration preserves equipment');
equal(migrated.progress.forestEntered, true, 'migration infers forest visit');
equal(migrated.party[4], null, 'migration does not invent recruit');

const restored = normalize({ ...state, battle: { unsafe: true }, exploration: { auto: true, active: true } });
equal(restored.party[4].id, 'blackwind-lord', 'reload preserves recruited leader');
equal(restored.progress.bossRecruited, true, 'reload preserves recruit flag');
equal(restored.equipment['blackwind-lord'].weapon, 'blackwindBlade', 'reload preserves leader equipment');
equal(restored.battle, null, 'reload clears active battle safely');
equal(restored.exploration.auto, false, 'reload stops background exploration');

const defeated = createState('戰敗驗收');
defeated.party[0].level = 5;
defeated.progress.forestEntered = true;
refreshUnlocks(defeated);
defeated.progress.bossUnlocked = true;
defeated.progress.strongholdKills = 10;
createBossEncounter(defeated);
defeated.gold = 100;
defeated.party.filter(Boolean).forEach(member => { member.hp = 1; member.defense = 0; member.speed = 0; });
defeated.battle.enemies.forEach(enemy => { enemy.might = 999; enemy.speed = 999; });
let defeatGuard = 0;
while (!defeated.battle.finished && defeatGuard++ < 10) resolveRound(defeated, 'attack', zero);
equal(defeated.battle.result, 'defeat', 'boss defeat resolves');
equal(defeated.screen, 'village', 'boss defeat returns to village');
equal(defeated.progress.strongholdKills, 10, 'boss defeat preserves kill progress');
equal(defeated.progress.bossUnlocked, true, 'boss defeat preserves challenge qualification');

const mainSource = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
equal((mainSource.match(/let loopTimer/g) || []).length, 1, 'only one loop timer exists');
check(mainSource.includes("['plain', 'forest', 'stronghold']"), 'stronghold reuses existing auto exploration loop');

console.log(`V0.1 PR#3 smoke test: ${checks} assertions passed`);
