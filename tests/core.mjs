import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {
  attemptCapture,
  captureChance,
  deployBoss,
  equipInstance,
  playerStats,
  sellGear,
  starBoss,
  start,
  step,
  toggleLock,
} from '../src/engine.js';
import {newState, normalize} from '../src/store.js';

const read = async name => JSON.parse(await fs.readFile(new URL(`../data/${name}.json`, import.meta.url)));
const data = {
  items: await read('items'),
  huntmaps: await read('hunt-maps'),
  huntmonsters: await read('hunt-monsters'),
  huntbosses: await read('hunt-bosses'),
  affixes: await read('affixes'),
};

const state = newState();
state.mapProgress.field.kills = data.huntmaps[0].bossThreshold;
assert.equal(start(state), true);
assert.equal(start(state), false, 'a second hunting loop must not start');
step(state, data);
assert.equal(state.exploration.enemy.id, data.huntmaps[0].boss, 'boss must appear at its fixed aura threshold');

state.exploration.enemy.hp = Math.ceil(state.exploration.enemy.maxHp * 0.19);
state.exploration.captureReady = true;
assert.ok(captureChance(state, 'capture-legendary') > captureChance(state, 'capture-normal'));
state.inventory.stacks['capture-legendary'] = 2;
const originalRandom = Math.random;
Math.random = () => 0;
assert.equal(attemptCapture(state, data, 'capture-legendary'), true);
assert.equal(state.bossPartners.length, 1);

state.exploration.enemy = {
  ...data.huntbosses[0],
  isBoss: true,
  maxHp: data.huntbosses[0].hp,
  hp: 1,
};
state.exploration.captureReady = true;
assert.equal(attemptCapture(state, data, 'capture-legendary'), true);
assert.ok(state.bossPartners[0].seals > 0, 'duplicate capture must convert into seals');

state.bossPartners[0].stars = 2;
state.bossPartners[0].seals = 5;
starBoss(state, state.bossPartners[0].id);
assert.equal(state.bossPartners[0].stars, 3);
assert.equal(state.bossPartners[0].seals, 0);
deployBoss(state, state.bossPartners[0].id);
assert.equal(state.activeBoss, state.bossPartners[0].id);
Math.random = originalRandom;

const instance = {
  instanceId: 'test-gear-1',
  templateId: 'gear-test',
  name: 'Test',
  slot: '武器',
  quality: '稀有',
  level: 1,
  baseStats: {attack: 10},
  affixes: [{id: 'attackPct', value: 10}],
  locked: false,
  obtainedAt: 1,
};
state.inventory.gear.push(instance);
const before = playerStats(state).attack;
equipInstance(state, instance.instanceId);
assert.ok(playerStats(state).attack > before);
toggleLock(state, instance.instanceId);
sellGear(state, instance.instanceId);
assert.ok(state.inventory.gear.some(gear => gear.instanceId === instance.instanceId), 'locked gear must not be sold');

const migrated = normalize({
  version: 2,
  inventory: [{id: 'gear-old', quantity: 2}],
  equipment: {武器: 'gear-old'},
  bossSouls: [{id: 'old-boss', rank: 2}],
});
assert.equal(migrated.version, 3);
assert.equal(new Set(migrated.inventory.gear.map(gear => gear.instanceId)).size, migrated.inventory.gear.length);
assert.equal(migrated.bossPartners[0].stars, 2);

const serviceWorker = await fs.readFile(new URL('../service-worker.js', import.meta.url), 'utf8');
for (const asset of ['hunt-maps.json', 'hunt-monsters.json', 'hunt-bosses.json', 'affixes.json']) {
  assert.ok(serviceWorker.includes(asset), `${asset} must be cached for offline play`);
}

console.log('core hunting tests passed');
