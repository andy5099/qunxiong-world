import assert from 'node:assert/strict';
import { createEncounter, resolveRound, chooseAutoCommand, visitInn, buyItem } from '../src/engine.js';
import { createState, normalize } from '../src/store.js';

const rng = () => 0.1;
const state = createState('測試主角');

assert.equal(state.party.length, 5);
assert.deepEqual(state.party.slice(0, 4).map(member => member.name), ['測試主角', '劉備', '關羽', '張飛']);
assert.equal(state.party[4], null);
for (const member of state.party.filter(Boolean)) {
  for (const key of ['level', 'exp', 'maxHp', 'hp', 'maxMp', 'mp', 'might', 'defense', 'intelligence', 'speed']) assert.equal(Number.isFinite(member[key]), true, `${member.name}.${key}`);
}

assert.equal(buyItem(state, 'woodenSword').ok, true);
assert.equal(state.inventory.woodenSword, 1);
state.party[0].hp = 1;
assert.equal(visitInn(state).ok, true);
assert.equal(state.party[0].hp, state.party[0].maxHp);

createEncounter(state, 'wolf', rng);
assert.equal(state.battle.enemies[0].name, '野狼');
let guard = 0;
while (!state.battle.finished && guard++ < 100) resolveRound(state, 'slam', rng);
assert.equal(state.battle.result, 'victory');
assert.ok(state.gold > 0);
assert.ok(state.party.every(member => !member || member.exp > 0 || member.level > 1));

const bandit = createState('山賊測試');
createEncounter(bandit, 'bandit', rng);
assert.equal(bandit.battle.enemies[0].name, '山賊');
assert.ok(['attack', 'slam'].includes(chooseAutoCommand(bandit, rng)));

const defeated = createState('戰敗測試');
defeated.gold = 100;
defeated.party.filter(Boolean).forEach(member => { member.hp = 1; member.defense = 0; });
createEncounter(defeated, 'bandit', rng);
defeated.battle.enemies.forEach(enemy => { enemy.might = 999; enemy.speed = 999; });
let defeatGuard = 0;
while (!defeated.battle.finished && defeatGuard++ < 20) resolveRound(defeated, 'attack', rng);
assert.equal(defeated.screen, 'village');
assert.equal(defeated.location, '桃源村');
assert.ok(defeated.gold < 100);
assert.ok(defeated.party.filter(Boolean).every(member => member.hp > 0));

const repaired = normalize({ created: true, playerName: '安全存檔', party: createState('安全存檔').party.map(member => member ? { ...member, hp: 'bad' } : null), gold: 'bad' });
assert.equal(repaired.party.every(member => !member || Number.isFinite(member.hp)), true);
assert.equal(Number.isFinite(repaired.gold), true);
assert.equal(repaired.battle, null);
assert.deepEqual(normalize({ created: true, playerName: '舊版主角' }).party.slice(0, 4).map(member => member.name), ['舊版主角', '劉備', '關羽', '張飛']);

console.log('V0.1 PR#1 smoke test: 18 assertions passed');
