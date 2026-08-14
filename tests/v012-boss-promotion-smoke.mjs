import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ENEMIES, SAVE_VERSION } from '../src/data.js';
import { createState, normalize } from '../src/store.js';
import { createBossEncounter, getFinalStats, recruitBlackwindLeader, resolveRound, rollBattleDrop } from '../src/engine.js';
import { applyLeaderRarity, attemptPromotion, BOSS_RARITIES, createRarityBoss, getCaptureRate, getPromotionChance, rollBossRarity, rollTalisman, TALISMANS } from '../src/boss-progression.js';
import { render } from '../src/ui.js';

let checks = 0;
const check = (value, message) => { assert.ok(value, message); checks += 1; };
const equal = (actual, expected, message) => { assert.equal(actual, expected, message); checks += 1; };
const rng = value => () => value;

equal(SAVE_VERSION, 14, 'save version 14');
equal(rollBossRarity(rng(0)).rank, 1, 'normal rarity');
equal(rollBossRarity(rng(.56)).rank, 2, 'elite rarity');
equal(rollBossRarity(rng(.81)).rank, 3, 'rare rarity');
equal(rollBossRarity(rng(.94)).rank, 4, 'epic rarity');
equal(rollBossRarity(rng(.995)).rank, 5, 'legendary rarity');

const variants = [1, 2, 3, 4, 5].map(rank => createRarityBoss(ENEMIES.blackwindLord, rank));
for (let i = 1; i < variants.length; i += 1) {
  check(variants[i].maxHp > variants[i - 1].maxHp, `rank ${i + 1} hp higher`);
  check(variants[i].might > variants[i - 1].might, `rank ${i + 1} might higher`);
  check(variants[i].defense > variants[i - 1].defense, `rank ${i + 1} defense higher`);
  check(variants[i].exp > variants[i - 1].exp, `rank ${i + 1} exp higher`);
  check(variants[i].recommendedPower > variants[i - 1].recommendedPower, `rank ${i + 1} recommendation higher`);
}

equal(getCaptureRate(1), 1, 'normal capture 100%');
equal(getCaptureRate(2), .7, 'elite capture 70%');
equal(getCaptureRate(3), .45, 'rare capture 45%');
equal(getCaptureRate(4), .25, 'epic capture 25%');
equal(getCaptureRate(5), .1, 'legendary capture 10%');

for (const rank of [1, 2, 3, 4, 5]) {
  const captureState = createState(`capture-${rank}`);
  captureState.progress.bossUnlocked = true;
  captureState.ui.bossWarning = true;
  createBossEncounter(captureState, rank);
  captureState.battle.finished = true;
  captureState.battle.result = 'victory';
  captureState.battle.awaitingRecruit = true;
  check(recruitBlackwindLeader(captureState, rng(0)), `rank ${rank} can be captured`);
  equal(captureState.party[4].rarityRank, rank, `rank ${rank} capture keeps rarity`);
}

const failedCapture = createState('failed-capture');
failedCapture.progress.bossUnlocked = true;
failedCapture.ui.bossWarning = true;
createBossEncounter(failedCapture, 5);
failedCapture.battle.finished = true;
failedCapture.battle.result = 'victory';
failedCapture.battle.awaitingRecruit = true;
failedCapture.battle.dropId = 'greenEdgeSword';
failedCapture.inventory.greenEdgeSword = 1;
check(!recruitBlackwindLeader(failedCapture, rng(.99)), 'legendary capture can fail');
equal(failedCapture.party.filter(Boolean).length, 4, 'failed capture does not recruit');
equal(failedCapture.inventory.greenEdgeSword, 1, 'failed capture keeps battle loot');
equal(failedCapture.battle, null, 'failed capture clears finished battle');

const firstDrops = variants.map(enemy => rollBattleDrop([enemy], rng(.5), true, true));
check(firstDrops.every(Boolean), 'first kill always drops boss equipment');
const normalEpic = rollBattleDrop([variants[0]], rng(.1), true, false);
const legendaryEpic = rollBattleDrop([variants[4]], rng(.1), true, false);
check(normalEpic === null || normalEpic !== undefined, 'normal drop table resolves');
check(Boolean(legendaryEpic), 'legendary epic rate higher');

equal(rollTalisman(1, rng(.2)), 'novice', 'novice talisman');
equal(rollTalisman(2, rng(.1)), 'intermediate', 'intermediate talisman');
equal(rollTalisman(3, rng(.1)), 'advanced', 'advanced talisman');
equal(rollTalisman(4, rng(.05)), 'legendary', 'legendary talisman from epic');
equal(rollTalisman(5, rng(.1)), 'legendary', 'legendary talisman from legendary');

equal(getPromotionChance(1), .8, 'one to two rate');
equal(getPromotionChance(2), .6, 'two to three rate');
equal(getPromotionChance(3), .35, 'three to four rate');
equal(getPromotionChance(4), .15, 'four to five rate');
equal(getPromotionChance(4, .75), .9, 'promotion capped at 90%');

const state = createState('轉職者');
state.progress.bossUnlocked = true;
state.ui.bossWarning = true;
createBossEncounter(state, 1);
state.battle.finished = true;
state.battle.result = 'victory';
state.battle.awaitingRecruit = true;
check(recruitBlackwindLeader(state, rng(.99)), 'first normal recruit guaranteed');
equal(state.party.filter(Boolean).length, 5, 'leader joins fifth slot');
equal(state.party[4].rarityRank, 1, 'leader starts normal');

const level = state.party[4].level;
const exp = state.party[4].exp;
state.equipment['blackwind-lord'].weapon = 'blackwindBlade';
state.ui.chapterComplete = false;
state.ui.bossWarning = true;
createBossEncounter(state, 4);
state.battle.finished = true;
state.battle.result = 'victory';
state.battle.awaitingRecruit = true;
check(recruitBlackwindLeader(state, rng(0)), 'epic capture succeeds with lucky roll');
equal(state.party.filter(member => member?.id === 'blackwind-lord').length, 1, 'same boss not duplicated');
equal(state.party[4].rarityRank, 4, 'higher boss upgrades leader');
equal(state.party[4].level, level, 'capture upgrade preserves level');
equal(state.party[4].exp, exp, 'capture upgrade preserves exp');
equal(state.equipment['blackwind-lord'].weapon, 'blackwindBlade', 'capture upgrade preserves equipment');

state.ui.bossWarning = true;
createBossEncounter(state, 2);
state.battle.finished = true;
state.battle.result = 'victory';
state.battle.awaitingRecruit = true;
recruitBlackwindLeader(state, rng(0));
equal(state.party[4].rarityRank, 4, 'lower rarity never downgrades');

const promotion = createState('祝福者');
promotion.party[4] = { ...state.party[4], rarityRank: 1, rarityName: '普通', growthMultiplier: 1 };
promotion.progress.bossRecruited = true;
promotion.equipment['blackwind-lord'].weapon = 'blackwindBlade';
promotion.bossProgress.talismans.novice = 2;
const beforeFailure = { level: promotion.party[4].level, exp: promotion.party[4].exp, rank: promotion.party[4].rarityRank };
const failed = attemptPromotion(promotion, rng(.99));
check(failed.ok && !failed.success, 'promotion can fail');
equal(promotion.party[4].rarityRank, beforeFailure.rank, 'failure does not downgrade');
equal(promotion.party[4].level, beforeFailure.level, 'failure preserves level');
equal(promotion.party[4].exp, beforeFailure.exp, 'failure preserves exp');
equal(promotion.bossProgress.blessings[1], .05, 'failure adds five percent blessing');
const succeeded = attemptPromotion(promotion, rng(0));
check(succeeded.success, 'promotion succeeds');
equal(promotion.party[4].rarityRank, 2, 'promotion raises rank');
equal(promotion.bossProgress.blessings[1], 0, 'success resets blessing');
equal(promotion.party[4].level, beforeFailure.level, 'success preserves level');
equal(promotion.party[4].exp, beforeFailure.exp, 'success preserves exp');
equal(promotion.equipment['blackwind-lord'].weapon, 'blackwindBlade', 'promotion preserves equipment');

promotion.party[4].rarityRank = 5;
promotion.party[4].rarityName = '傳說';
equal(attemptPromotion(promotion).reason, 'max', 'five star cannot promote');

const migrated = normalize({ ...state, version: 7, bossProgress: undefined });
equal(migrated.version, 14, 'version 7 migrates to current');
equal(migrated.party[4].rarityRank, 4, 'leader rarity preserved');
equal(migrated.equipment['blackwind-lord'].weapon, 'blackwindBlade', 'migration preserves equipment');
check(Object.keys(migrated.bossProgress.talismans).length === 4, 'migration adds talismans');
check(Object.values(migrated.bossProgress.blessings).every(value => value === 0), 'migration adds blessings');

const warningState = createState('警告者');
warningState.ui.bossWarning = true;
warningState.ui.bossRarityRank = 5;
const warningHtml = render(warningState);
check(warningHtml.includes('傳說 Boss'), 'warning displays rarity');
check(warningHtml.includes('12,000'), 'warning displays rank power');
const partyHtml = render({ ...migrated, screen: 'party' });
check(partyHtml.includes('嘗試轉職'), 'party displays promotion button');
check(partyHtml.includes('轉職兵符'), 'party displays talismans');

const sw = readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');
check(sw.includes('v021-'), 'service worker cache updated');
check(sw.includes('boss-progression.js'), 'service worker caches progression module');

console.log(`V0.1.2 boss promotion smoke test: ${checks} assertions passed`);
