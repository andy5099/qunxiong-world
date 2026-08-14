import { createState, normalize } from '../src/store.js';
import { createBossEncounter, createEncounter, createWorldBossEncounter, performEnemyAction, resolveFormationAttack, resolveRound, startFormation } from '../src/engine.js';
import { FORMATION_AFFINITIES, FORMATION_ORBS, FORMATION_TYPES, addFormationGauge, comboMultiplier, createFormationBoard, ensureFormation, findMatches, getAffinityBonuses, getFormationEffects, getFormationMaxUses, hasAvailableMove, resolveFormationBoard, settleFormationPuzzle, startFormationPuzzle, swapBoardCells } from '../src/formation-puzzle.js';
import { render, renderFormationPanel } from '../src/ui.js';
import fs from 'node:fs';

let passed = 0;
const check = (condition, label) => { if (!condition) throw new Error(label); passed++; };
const equal = (actual, expected, label) => check(JSON.stringify(actual) === JSON.stringify(expected), `${label}: ${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`);
const sequence = values => { let i = 0; return () => values[i++ % values.length]; };
const stateFor = screen => { const state = createState('戰陣測試'); state.screen = screen; state.location = screen; state.settings.autoBattle = false; state.exploration.auto = false; return state; };

equal(FORMATION_TYPES.length, 5, 'five orb types');
for (const type of FORMATION_TYPES) { check(FORMATION_ORBS[type]?.icon, `${type} icon`); check(FORMATION_ORBS[type]?.name, `${type} name`); }
check(FORMATION_AFFINITIES.hero.length === 5, 'hero balanced affinities');
check(FORMATION_AFFINITIES.liuBei.includes('hp'), 'Liu Bei hp affinity');
check(FORMATION_AFFINITIES.guanYu.includes('might'), 'Guan Yu might affinity');
check(FORMATION_AFFINITIES.zhangFei.includes('defense'), 'Zhang Fei defense affinity');
equal(getFormationMaxUses({}), 1, 'normal use count');
equal(getFormationMaxUses({ boss: true }), 2, 'boss use count');
equal(getFormationMaxUses({ worldBoss: true, boss: true }), 3, 'world boss use count');

const battle = { enemies: [], boss: false };
let formation = ensureFormation(battle);
equal(formation.gauge, 0, 'initial gauge'); equal(formation.uses, 0, 'initial uses'); equal(formation.maxUses, 1, 'initial max uses');
equal(addFormationGauge(battle, 8), 8, 'attack charge'); equal(addFormationGauge(battle, 12), 20, 'skill charge'); equal(addFormationGauge(battle, 1000), 100, 'gauge cap');
const board = createFormationBoard({}, sequence([.01, .21, .41, .61, .81]));
equal(board.length, 30, 'board has 30 orbs'); check(board.every(cell => FORMATION_TYPES.includes(cell.type)), 'board types valid'); check(!findMatches(board).matched.length, 'board starts without matches'); check(hasAvailableMove(board), 'board has available move');
check(!swapBoardCells(board, 0, 7), 'diagonal swap rejected'); check(!swapBoardCells(board, 0, 2), 'distant swap rejected'); check(swapBoardCells(board, 2, 8), 'adjacent swap accepted'); check(findMatches(board).matched.length >= 3, 'swap creates match');

const lockedBoard = createFormationBoard({ worldBoss: true, worldBossId: 'netherThunder', worldBossPhase: 2 }, sequence([.1, .3, .5, .7, .9]));
check(lockedBoard.filter(cell => cell.locked).length >= 3, 'nether boss locks at least three');
const lockedAt = lockedBoard.findIndex(cell => cell.locked), neighbor = [lockedAt - 1, lockedAt + 1, lockedAt - 6, lockedAt + 6].find(i => i >= 0 && i < 30 && Math.abs(Math.floor(i / 6) - Math.floor(lockedAt / 6)) + Math.abs(i % 6 - lockedAt % 6) === 1);
check(!swapBoardCells(lockedBoard, lockedAt, neighbor), 'locked orb cannot move');
const burningBoard = createFormationBoard({ worldBoss: true, worldBossId: 'crimsonTiger', worldBossPhase: 2 }, sequence([.12, .32, .52, .72, .92]));
check(burningBoard.filter(cell => cell.burning).length >= 3, 'tiger creates burning cells');
const livePhaseBoard = createFormationBoard({ worldBoss: true, worldBossId: 'netherThunder', enemies: [{ worldBoss: true, phase: 3 }] }, sequence([.14, .34, .54, .74, .94]));
check(livePhaseBoard.some(cell => cell.locked), 'interference reads live world boss phase');

equal(comboMultiplier(1), 1, 'one combo multiplier'); equal(comboMultiplier(2), 1.18, 'two combo multiplier'); equal(comboMultiplier(3), 1.38, 'three combo multiplier'); check(comboMultiplier(6) > comboMultiplier(5), 'large combo scales');
const affinity = getAffinityBonuses([{ id: 'hero' }, { id: 'guanYu' }, { id: 'zhangFei' }, { id: 'blackwindLeader' }]);
equal(affinity.might, .15, 'affinity capped at 15 percent'); check(affinity.hp > 0 && affinity.mp > 0 && affinity.wind > 0, 'balanced hero contributes affinities');
const effectFixture = { combos: 5, groups: FORMATION_TYPES.map(type => ({ type, cells: [0, 1, 2, 3, 4] })) };
const effects = getFormationEffects(effectFixture, [{ id: 'hero' }]);
check(effects.mightPct > .3, 'might effect'); check(effects.healPct > .13, 'heal effect'); check(effects.mp > 10, 'mp effect'); check(effects.defensePct > .22, 'defense effect'); check(effects.windChance > .2, 'wind effect'); check(effects.comboMultiplier === comboMultiplier(5), 'effect combo multiplier');

const cascadeBoard = Array.from({ length: 30 }, (_, i) => ({ id: String(i), type: ['might', 'might', 'might', 'hp', 'mp', 'wind'][i % 6], locked: false, burning: i === 0 }));
const resolution = resolveFormationBoard(cascadeBoard, sequence([.15, .35, .55, .75, .95]));
check(resolution.combos >= 5, 'multiple rows resolve'); check(resolution.cascades >= 1, 'cascade count'); check(resolution.removedBurning === 1, 'matched burning cell removed'); check(resolution.board.length === 30, 'refilled board size');

const puzzleBattle = { enemies: [{ hp: 100 }], awaitingCommand: true };
ensureFormation(puzzleBattle).gauge = 100;
check(startFormationPuzzle(puzzleBattle, [], sequence([.1, .3, .5, .7, .9])), 'puzzle starts at full gauge'); check(puzzleBattle.formation.active, 'active state'); equal(puzzleBattle.formation.gauge, 0, 'gauge consumed'); equal(puzzleBattle.formation.uses, 1, 'use consumed'); check(!startFormationPuzzle(puzzleBattle, []), 'cannot start twice');
const settled = settleFormationPuzzle(puzzleBattle, [], sequence([.1, .3, .5, .7, .9])); check(settled && !puzzleBattle.formation.active, 'settle exits active'); check(puzzleBattle.formation.result === settled, 'result retained'); check(!startFormationPuzzle(puzzleBattle, []), 'normal battle use limit');

const normal = stateFor('plain'); createEncounter(normal, 'wolf', () => .1); ensureFormation(normal.battle).gauge = 100;
check(startFormation(normal, sequence([.1, .3, .5, .7, .9])), 'engine starts formation'); normal.battle.formation.board.slice(0,3).forEach(cell=>cell.type='might'); check(!normal.battle.awaitingCommand, 'round paused during puzzle');
const hpBefore = normal.battle.enemies[0].hp; const engineResult = resolveFormationAttack(normal, sequence([0, .2, .4, .6, .8]));
check(engineResult, 'engine settles formation'); check(normal.battle.enemies[0].hp < hpBefore || normal.battle.finished, 'formation damages enemy');

const auto = stateFor('plain'); createEncounter(auto, 'wolf', () => .1); ensureFormation(auto.battle).gauge = 100; auto.exploration.auto = true;
check(!startFormation(auto), 'auto exploration never starts puzzle'); auto.exploration.auto = false; auto.settings.autoBattle = true; check(!startFormation(auto), 'auto battle never starts puzzle');

const boss = stateFor('stronghold'); boss.ui.bossWarning = true; boss.ui.bossRarityRank = 5; createBossEncounter(boss, 5); ensureFormation(boss.battle).gauge = 100; const bossMax = boss.battle.enemies[0].maxHp;
startFormation(boss, sequence([.1, .3, .5, .7, .9])); boss.battle.formation.board.slice(0,3).forEach(cell=>cell.type='might'); resolveFormationAttack(boss, () => 0); check(bossMax - boss.battle.enemies[0].hp <= Math.floor(bossMax * .35), 'boss damage cap 35 percent');

const world = stateFor('worldBoss'); world.worldBoss.unlocked = true; createWorldBossEncounter(world, 'crimsonTiger'); ensureFormation(world.battle).gauge = 100; const worldMax = world.battle.enemies[0].maxHp;
startFormation(world, sequence([.1, .3, .5, .7, .9])); world.battle.formation.board.slice(0,3).forEach(cell=>cell.type='might'); resolveFormationAttack(world, () => 0); check(worldMax - world.battle.enemies[0].hp <= Math.floor(worldMax * .23), 'world boss damage cap 23 percent');

const charge = stateFor('stronghold'); charge.ui.bossWarning = true; charge.ui.bossRarityRank = 1; createBossEncounter(charge, 1); const beforeGauge = ensureFormation(charge.battle).gauge;
resolveRound(charge, 'attack', () => .99); check(charge.battle.formation.gauge >= beforeGauge + 8 || charge.battle.finished, 'normal attack charges 8');
if (!charge.battle.finished) { const gaugeBeforeSkill = charge.battle.formation.gauge; charge.battle.enemies[0].mp = 99; performEnemyAction(charge, charge.battle.enemies[0], () => 0); check(charge.battle.formation.gauge >= gaugeBeforeSkill + 10, 'receiving boss skill charges 10'); }

const html = render(normal), panel = renderFormationPanel(normal, normal.battle);
check(html.includes('battle-overlay'), 'existing battle still renders'); check(panel.includes('formation-gauge'), 'formation gauge renders');
ensureFormation(normal.battle).gauge = 100; check(renderFormationPanel(normal, normal.battle).includes('battle:formation'), 'formation action renders');
normal.battle.formation.active = true; normal.battle.formation.board = createFormationBoard({}, () => .2); const puzzleHtml = renderFormationPanel(normal, normal.battle);
check(puzzleHtml.includes('formation-puzzle-board'), '6x5 board renders'); equal((puzzleHtml.match(/data-orb-index=/g) || []).length, 30, '30 DOM orbs'); check(puzzleHtml.includes('6.0'), 'six second timer renders');

const migrated = normalize({ ...createState('舊檔'), version: 14, battle: { formation: { active: true } } });
equal(migrated.battle, null, 'active puzzle is not persisted through migration');
const main = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8'), css = fs.readFileSync(new URL('../style.css', import.meta.url), 'utf8'), sw = fs.readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');
check(main.includes('mountFormationPuzzle'), 'pointer controller mounted'); check(main.includes("visibilitychange"), 'visibility guard exists'); check(main.includes('formationPaused'), 'schedule pauses for puzzle'); check(css.includes('touch-action:none'), 'touch scrolling disabled on board'); check(css.includes('@media(max-width:430px)'), 'mobile layout exists');
check(sw.includes('formation-puzzle.js'), 'service worker caches puzzle core'); check(sw.includes('formation-puzzle-ui.js'), 'service worker caches puzzle ui');

console.log(`V0.2.1 formation puzzle smoke: ${passed} assertions passed.`);
