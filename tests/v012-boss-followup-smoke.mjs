import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ENEMIES } from '../src/data.js';
import { createState, normalize } from '../src/store.js';
import { createBossEncounter, recruitBlackwindLeader } from '../src/engine.js';
import { BOSS_RARITIES, combineAllTalismans, combineTalismans, createRarityBoss, rollBossRarity, rollTalismanDrops } from '../src/boss-progression.js';
import { render } from '../src/ui.js';

let checks = 0;
const check = (value, message) => { assert.ok(value, message); checks += 1; };
const equal = (actual, expected, message) => { assert.equal(actual, expected, message); checks += 1; };
const rng = value => () => value;

equal(BOSS_RARITIES[1].chance, .4, 'normal chance 40%');
equal(BOSS_RARITIES[2].chance, .27, 'elite chance 27%');
equal(BOSS_RARITIES[3].chance, .18, 'rare chance 18%');
equal(BOSS_RARITIES[4].chance, .1, 'epic chance 10%');
equal(BOSS_RARITIES[5].chance, .05, 'legendary chance 5%');
equal(rollBossRarity(rng(.96)).rank, 5, 'legendary is visible at five percent band');

for (const rank of [1, 2, 3, 4, 5]) {
  const drops = rollTalismanDrops(rank, rng(.99));
  check(Object.values(drops).reduce((sum, amount) => sum + amount, 0) > 0, `rank ${rank} always drops a talisman`);
}
check((rollTalismanDrops(5, rng(.99)).advanced || 0) >= 1, 'legendary boss always drops advanced talisman');

const craft = createState('合成驗收');
craft.bossProgress.talismans = { novice: 5, intermediate: 5, advanced: 5, legendary: 0 };
check(combineTalismans(craft, 'intermediate').ok, 'five novice combine');
equal(craft.bossProgress.talismans.novice, 0, 'novice consumed exactly');
equal(craft.bossProgress.talismans.intermediate, 6, 'intermediate added exactly');
check(combineTalismans(craft, 'advanced').ok, 'five intermediate combine');
check(combineTalismans(craft, 'legendary').ok, 'five advanced combine');
check(!combineTalismans(craft, 'legendary').ok, 'insufficient material cannot combine');
check(Object.values(craft.bossProgress.talismans).every(value => value >= 0), 'no negative material');

const cascade = createState('全部合成');
cascade.bossProgress.talismans = { novice: 25, intermediate: 0, advanced: 0, legendary: 0 };
check(combineAllTalismans(cascade).ok, 'combine all works');
equal(cascade.bossProgress.talismans.novice, 0, 'combine all consumes novice');
equal(cascade.bossProgress.talismans.intermediate, 0, 'combine all cascades intermediate');
equal(cascade.bossProgress.talismans.advanced, 1, 'combine all yields one advanced');

const victory = createState('勝利介面');
victory.progress.bossUnlocked = true;
victory.ui.bossWarning = true;
createBossEncounter(victory, 4);
victory.battle.finished = true;
victory.battle.result = 'victory';
victory.battle.awaitingRecruit = true;
victory.battle.rewardExp = 500;
victory.battle.rewardGold = 600;
victory.battle.talismanDrops = { advanced: 1 };
const victoryHtml = render(victory);
check(victoryHtml.indexOf('招降 Boss') < victoryHtml.indexOf('EXP 500'), 'capture primary action precedes loot');
check(victoryHtml.includes('招降成功率 25%'), 'capture rate shown');

const upgraded = createState('升格介面');
upgraded.party[4] = { ...normalize({ ...upgraded, progress: { bossRecruited: true }, party: [...upgraded.party.slice(0, 4), { id: 'blackwind-lord', name: '黑風寨主', level: 5, exp: 0, maxHp: 160, hp: 160, maxMp: 26, mp: 26, might: 28, defense: 16, intelligence: 10, speed: 14, rarityRank: 2 }] }).party[4] };
upgraded.progress.bossRecruited = true;
upgraded.ui.bossWarning = true;
createBossEncounter(upgraded, 4);
upgraded.battle.finished = true;
upgraded.battle.result = 'victory';
upgraded.battle.awaitingRecruit = true;
check(render(upgraded).includes('招降並升格'), 'higher enemy offers promotion capture');

const lowPower = createState('低戰力');
lowPower.progress.bossUnlocked = true;
lowPower.ui.bossWarning = true;
lowPower.ui.bossRarityRank = 5;
const warningHtml = render(lowPower);
check(warningHtml.includes('12,000'), 'legendary recommended power 12000');
check(warningHtml.includes('死亡級危險'), 'legendary death danger shown');
check(warningHtml.includes('硬闖'), 'low power can still engage');
check(createBossEncounter(lowPower, 5), 'low power not blocked');
const legendary = createRarityBoss(ENEMIES.blackwindLord, 5);
check(legendary.maxHp > ENEMIES.blackwindLord.maxHp * 3, 'legendary hp greatly increased');
check(legendary.might > ENEMIES.blackwindLord.might * 4, 'legendary might greatly increased');
check(legendary.speed > ENEMIES.blackwindLord.speed, 'legendary speed increased');

lowPower.battle.finished = true;
lowPower.battle.result = 'victory';
lowPower.battle.awaitingRecruit = true;
lowPower.battle.dropId = 'greenEdgeSword';
lowPower.inventory.greenEdgeSword = 1;
lowPower.battle.talismanDrops = { advanced: 1, legendary: 1 };
check(!recruitBlackwindLeader(lowPower, rng(.99)), 'legendary capture can fail');
equal(lowPower.inventory.greenEdgeSword, 1, 'failed capture keeps loot');
equal(lowPower.bossProgress.talismans.legendary, 0, 'capture resolution does not consume talismans');
equal(lowPower.battle, null, 'failed capture clears battle state');

const migrated7 = normalize({ ...createState('v7'), version: 7 });
const migrated8 = normalize({ ...createState('v8'), version: 8 });
equal(migrated7.version, 12, 'v7 migration');
equal(migrated8.version, 12, 'v8 remains compatible');

const sw = readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');
check(sw.includes('v016-'), 'service worker updated');

console.log(`V0.1.2 boss follow-up smoke test: ${checks} assertions passed`);
