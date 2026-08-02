import assert from 'node:assert/strict';
import { recompute } from '../src/astral-world/core.js';
import { IdleGame } from '../src/astral-world/game.js';
import { defaultState, importSave } from '../src/astral-world/save.js';
import { normalizePet } from '../src/astral-world/pet-system.js';
import { getPetSupportBonuses, setPetTeamSlot } from '../src/astral-world/pet-team-system.js';
import { AstralUI } from '../src/astral-world/ui.js';
import { SAVE_VERSION } from '../src/astral-world/data.js';

const saved = new Map();
globalThis.localStorage = { getItem:key=>saved.get(key) || null, setItem:(key,value)=>saved.set(key,value), removeItem:key=>saved.delete(key) };

const pet = (id, kind, attack, hp, rank = 0) => normalizePet({ id, speciesId:`pet_${kind}`, sourceKind:kind, level:30, stars:1, evolutionRank:rank, baseAttack:attack, baseHpBonus:hp, skillEnergy:0, quality:'rare' });
const state = defaultState();
state.pets = [pet('main','slime',1000,600), pet('support-a','rabbit',500,1000,4), pet('support-b','golem',300,1400,4)];
setPetTeamSlot(state, 'main', 'main');
setPetTeamSlot(state, 'support-a', 'support1');
setPetTeamSlot(state, 'support-b', 'support2');
recompute(state);

const bonuses = getPetSupportBonuses(state);
assert.equal(state.activePetId, 'main', 'legacy combat alias must follow team main');
assert.equal(state.player.petSupportAttack, bonuses.attack, 'support attack must be included once');
assert.equal(state.player.petSupportHp, bonuses.hp, 'support hp must be included once');
assert.ok(bonuses.attack > 0 && bonuses.hp > 0, 'two supports must contribute 20% stats');
assert.ok(bonuses.crit > 0 && bonuses.shieldRatio > 0 && bonuses.bossDamage > 0, 'support evolution passives must remain active');
const attackAfterFirstCompute = state.player.attack;
recompute(state);
assert.equal(state.player.attack, attackAfterFirstCompute, 'recompute must not stack team bonuses');

setPetTeamSlot(state, 'main', 'support2');
assert.equal(state.petTeam.main, 'support-b', 'occupied slots must swap');
assert.equal(state.petTeam.support[1], 'main');
setPetTeamSlot(state, 'main', 'support2');
assert.equal(state.petTeam.support[1], null, 'clicking the occupied slot must clear it');
assert.equal(new Set([state.petTeam.main, ...state.petTeam.support].filter(Boolean)).size, [state.petTeam.main, ...state.petTeam.support].filter(Boolean).length, 'team cannot contain duplicates');

setPetTeamSlot(state, 'main', 'main');
setPetTeamSlot(state, 'support-a', 'support1');
const renderer = { pulse(){}, damage(){}, setScene(){}, update(){} };
const game = new IdleGame(state, renderer);
game.battle.enemy = { id:'target', name:'target', alive:true, boss:false, hp:999999, maxHp:999999, defense:0, hit:0, action:'idle', actionIn:0, effects:{} };
const supportEnergy = state.pets.find(entry => entry.id === 'support-a').skillEnergy;
assert.equal(game.petAttack(), true);
assert.equal(game.battle.queuedHits.length, 1, 'only the main pet may queue its basic attack');
assert.ok(state.pets.find(entry => entry.id === 'main').skillEnergy > 0, 'main pet must gain skill energy');
assert.equal(state.pets.find(entry => entry.id === 'support-a').skillEnergy, supportEnergy, 'support must not gain skill energy');

const legacy = importSave(JSON.stringify({ ...defaultState(), version:8, pets:[pet('legacy-main','wolf',90,50)], activePetId:'legacy-main', petTeam:undefined }));
assert.equal(legacy.version, SAVE_VERSION);
assert.equal(legacy.petTeam.main, 'legacy-main');
assert.deepEqual(legacy.petTeam.support, [null, null]);
assert.equal(legacy.activePetId, 'legacy-main');

const petPage = { innerHTML:'' };
const ui = Object.create(AstralUI.prototype);
ui.state = state; ui.$ = id => id === 'petsPage' ? petPage : null;
ui.renderPets();
assert.match(petPage.innerHTML, /寵物隊伍/);
assert.match(petPage.innerHTML, /主戰/);
assert.match(petPage.innerHTML, /支援 1/);
assert.match(petPage.innerHTML, /data-slot="support2"/);

console.log('Pet Team 1.0 smoke: PASS');
