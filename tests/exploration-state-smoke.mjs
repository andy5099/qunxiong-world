import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createState, normalize } from '../src/store.js';
import { createBossEncounter, createEncounter, leaveBattle, prepareQuickEquip, recruitBlackwindLeader, resolveRound, retreatFromBoss, spareBlackwindLeader } from '../src/engine.js';
import { attemptPromotion, combineTalismans } from '../src/boss-progression.js';
import { render } from '../src/ui.js';

let checks = 0;
const check = (value, message) => { assert.ok(value, message); checks += 1; };
const equal = (actual, expected, message) => { assert.equal(actual, expected, message); checks += 1; };
const zero = () => 0;

function explorationState(name = '探索測試') {
  const state = createState(name);
  state.party.filter(Boolean).forEach(member => { member.level = 30; member.might = 500; member.defense = 300; member.speed = 200; member.maxHp = 5000; member.hp = 5000; });
  state.screen = 'stronghold';
  state.location = '黑風寨';
  state.unlocks.stronghold = true;
  state.progress.forestEntered = true;
  state.progress.bossUnlocked = true;
  state.exploration.auto = true;
  return state;
}

function winBattle(state) {
  let guard = 0;
  while (state.battle && !state.battle.finished && guard++ < 40) resolveRound(state, 'attack', zero);
  check(guard < 40, 'battle terminates');
}

const twenty = explorationState();
for (let index = 0; index < 20; index += 1) {
  twenty.progress.bossEncounterCount = 0;
  check(createEncounter(twenty, 'strongholdSoldier', zero), `encounter ${index + 1} starts`);
  winBattle(twenty);
  check(twenty.battle.finished, `encounter ${index + 1} finishes`);
  leaveBattle(twenty);
  check(twenty.exploration.auto && !twenty.battle, `encounter ${index + 1} can continue`);
}

const elite = explorationState('精英');
createEncounter(elite, 'strongholdCaptain', zero);
winBattle(elite);
leaveBattle(elite);
check(elite.exploration.auto && !elite.battle, 'elite flow can continue');

const recruitedNormalBattle = explorationState('normal-with-recruited-boss');
recruitedNormalBattle.party[4] = { id: 'blackwind-lord', name: '黑風寨主', level: 5, exp: 0, maxHp: 160, hp: 160, maxMp: 26, mp: 26, might: 28, defense: 16, intelligence: 10, speed: 14, rarityRank: 3 };
createEncounter(recruitedNormalBattle, 'strongholdSoldier', zero);
assert.doesNotThrow(() => render(recruitedNormalBattle), 'normal battle UI must not read missing boss rarity');
checks += 1;

const warning = explorationState('警告');
warning.progress.bossEncounterCount = 11;
let warningRoll = 0;
equal(createEncounter(warning, undefined, () => warningRoll++ === 0 ? 0.99 : 0), null, 'boss pity interrupts encounter');
check(warning.ui.bossWarning && !warning.battle && !warning.exploration.auto, 'boss warning is actionable stop state');
check(retreatFromBoss(warning), 'boss retreat works');
check(!warning.ui.bossWarning && !warning.battle && !warning.exploration.active, 'retreat clears transient state');
warning.exploration.auto = true;
check(createEncounter(warning, 'strongholdSoldier', zero), 'retreat allows restart');

const engage = explorationState('迎戰');
engage.ui.bossWarning = true;
engage.ui.bossRarityRank = 1;
check(createBossEncounter(engage), 'boss engage creates battle');
check(!engage.ui.bossWarning && Boolean(engage.battle), 'engage clears warning');

const defeated = explorationState('戰敗');
defeated.ui.bossWarning = true;
createBossEncounter(defeated, 5);
defeated.party.filter(Boolean).forEach(member => { member.hp = 1; member.defense = 0; member.speed = 0; });
defeated.battle.enemies.forEach(enemy => { enemy.might = 99999; enemy.speed = 9999; });
let defeatGuard = 0;
while (!defeated.battle.finished && defeatGuard++ < 10) resolveRound(defeated, 'attack', zero);
equal(defeated.screen, 'village', 'boss defeat returns village');
leaveBattle(defeated);
check(!defeated.battle && !defeated.ui.bossWarning, 'boss defeat can leave battle');

for (const mode of ['success', 'failure', 'spare', 'upgrade']) {
  const state = explorationState(mode);
  if (mode === 'upgrade') {
    state.party[4] = { id: 'blackwind-lord', name: '黑風寨主', level: 5, exp: 0, maxHp: 160, hp: 160, maxMp: 26, mp: 26, might: 28, defense: 16, intelligence: 10, speed: 14, rarityRank: 1 };
    state.progress.bossRecruited = true;
  }
  state.ui.bossWarning = true;
  createBossEncounter(state, mode === 'failure' ? 5 : mode === 'upgrade' ? 4 : 1);
  state.battle.finished = true;
  state.battle.result = 'victory';
  state.battle.awaitingRecruit = true;
  if (mode === 'spare') spareBlackwindLeader(state);
  else recruitBlackwindLeader(state, mode === 'failure' ? () => .99 : zero);
  check(!state.battle && !state.ui.bossWarning, `${mode} clears boss state`);
  state.exploration.auto = true;
  check(createEncounter(state, 'strongholdSoldier', zero), `${mode} allows exploration restart`);
}

const utility = explorationState('介面操作');
utility.inventory.greenEdgeSword = 1;
prepareQuickEquip(utility, 'greenEdgeSword');
check(utility.exploration.auto && !utility.battle, 'quick equipment preview keeps exploration usable');
utility.bossProgress.talismans.novice = 6;
combineTalismans(utility, 'intermediate');
check(utility.exploration.auto && !utility.battle, 'talisman crafting keeps exploration usable');
utility.party[4] = { id: 'blackwind-lord', name: '黑風寨主', level: 5, exp: 0, maxHp: 160, hp: 160, maxMp: 26, mp: 26, might: 28, defense: 16, intelligence: 10, speed: 14, rarityRank: 1 };
utility.bossProgress.talismans.novice = 2;
attemptPromotion(utility, zero);
check(utility.exploration.auto && !utility.battle, 'promotion success keeps exploration usable');
utility.party[4].rarityRank = 1;
utility.bossProgress.talismans.novice = 1;
attemptPromotion(utility, () => .99);
check(utility.exploration.auto && !utility.battle, 'promotion failure keeps exploration usable');

const repaired = normalize({ ...explorationState('重新整理'), battle: { finished: true }, ui: { bossWarning: true }, exploration: { auto: true, active: true } });
check(!repaired.battle && !repaired.ui.bossWarning && !repaired.exploration.auto, 'reload normalizes transient state');

const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
check(main.includes('if (loopTimer !== null) return;'), 'single timer guard exists');
check(main.includes("!state.battle && !state.ui.bossWarning"), 'auto explore recovery guard exists');
check(!main.includes('function schedule() {\n  stopLoop();'), 'schedule does not cancel healthy timer every draw');

console.log(`Exploration state smoke test: ${checks} assertions passed`);
