import assert from 'node:assert/strict';
import { recompute } from '../src/astral-world/core.js';
import { IdleGame } from '../src/astral-world/game.js';
import { normalizePet, getPetCombatModifiers, getPetEffectiveAttack } from '../src/astral-world/pet-system.js';
import { setPetTeamSlot } from '../src/astral-world/pet-team-system.js';
import { PET_TEAM_SYNERGY_BALANCE, getActivePetTeamSynergies, getPetTeamSynergyBonuses, validatePetTeamSynergyData } from '../src/astral-world/pet-synergy-system.js';
import { defaultState, importSave, loadState } from '../src/astral-world/save.js';
import { SAVE_KEY } from '../src/astral-world/data.js';
import { AstralUI } from '../src/astral-world/ui.js';

const saved=new Map();
globalThis.localStorage={getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value),removeItem:key=>saved.delete(key)};
const pet=(kind,rank=0)=>normalizePet({id:`team-${kind}`,speciesId:`pet_${kind}`,sourceKind:kind,level:50,stars:2,evolutionRank:rank,baseAttack:100,baseHpBonus:200,skillEnergy:100,quality:'rare'});
const renderer={pulse(){},damage(){},setScene(){},update(){}};
const teamState=(kinds,ranks=[])=>{const state=defaultState();state.pets=kinds.map((kind,index)=>pet(kind,ranks[index]||0));setPetTeamSlot(state,state.pets[0].id,'main');setPetTeamSlot(state,state.pets[1].id,'support1');setPetTeamSlot(state,state.pets[2].id,'support2');recompute(state);return state;};
const ids=state=>getActivePetTeamSynergies(state).map(item=>item.id);

assert.deepEqual(validatePetTeamSynergyData(),[]);
const incomplete=defaultState();incomplete.pets=[pet('slime'),pet('rabbit')];setPetTeamSlot(incomplete,incomplete.pets[0].id,'main');setPetTeamSlot(incomplete,incomplete.pets[1].id,'support1');assert.deepEqual(ids(incomplete),[],'incomplete teams have no synergy');
const sameRegion=teamState(['slime','rabbit','beetle']);assert.ok(ids(sameRegion).includes('region_resonance'));assert.ok(ids(sameRegion).includes('balanced_roles'));assert.equal(sameRegion.player.petSynergyAttackBonus,.07);assert.equal(sameRegion.player.petSynergyHpBonus,.07);assert.equal(sameRegion.player.petSynergyCritBonus,.02);
const crossRegion=teamState(['slime','wolf','lizard']);assert.ok(ids(crossRegion).includes('cross_region'));
const retinue=teamState(['horn','rabbit','beetle']);assert.ok(ids(retinue).includes('royal_retinue'));
const kings=teamState(['horn','guardian','dragon']);assert.ok(ids(kings).includes('three_kings'));assert.equal(getPetTeamSynergyBonuses(kings).attackIntervalMultiplier,1.05);
const evolved=teamState(['slime','rabbit','beetle'],[2,2,2]);assert.ok(ids(evolved).includes('evolution_e2'));
const finalEvolution=teamState(['slime','rabbit','beetle'],[4,4,4]);assert.ok(ids(finalEvolution).includes('evolution_e4'));assert.ok(!ids(finalEvolution).includes('evolution_e2'));
const capped=getPetTeamSynergyBonuses(finalEvolution);for(const key of ['attack','hp','crit','petDamage','bossDamage','normalDamage','goldBonus','expBonus'])assert.ok(capped[key]<=PET_TEAM_SYNERGY_BALANCE[`${key}Cap`]);
const attackOnce=sameRegion.player.attack;recompute(sameRegion);assert.equal(sameRegion.player.attack,attackOnce,'recompute must not stack synergy');

const retinueGame=new IdleGame(retinue,renderer);retinueGame.battle.enemy={id:'normal',name:'normal',alive:true,boss:false,hp:9999,maxHp:9999,defense:0,hit:0,action:'idle',actionIn:0,effects:{}};retinueGame.damageEnemy(100,'test','#fff');assert.equal(Math.round(9999-retinueGame.battle.enemy.hp),103,'normal damage applies only normal bonus');
retinueGame.battle.enemy={id:'boss',name:'boss',alive:true,boss:true,hp:9999,maxHp:9999,defense:0,hit:0,action:'idle',actionIn:0,effects:{}};retinueGame.damageEnemy(100,'test','#fff');assert.equal(Math.round(9999-retinueGame.battle.enemy.hp),106,'boss damage applies only boss bonus');

const petGame=new IdleGame(evolved,renderer);petGame.battle.enemy={id:'pet-target',name:'target',alive:true,boss:false,hp:999999,maxHp:999999,defense:0,hit:0,action:'idle',actionIn:0,effects:{}};const main=evolved.pets[0],mod=getPetCombatModifiers(main),expectedBasic=getPetEffectiveAttack(main)*(1+(evolved.player.petDamage||0)+(evolved.player.codexPetDamageBonus||0)+evolved.player.petSynergyPetDamageBonus)*mod.damageMultiplier;petGame.petAttack();assert.equal(Math.round(petGame.battle.queuedHits[0].damage),Math.round(expectedBasic),'pet basic uses synergy pet damage');
petGame.battle.queuedHits=[];main.skillEnergy=100;petGame.battle.petSkillIn=0;petGame.castPetSkill(main);assert.ok(petGame.battle.queuedHits[0].damage>getPetEffectiveAttack(main),'pet active skill uses synergy pet damage');

const rewards=teamState(['slime','wolf','lizard']);rewards.player.exp=0;rewards.player.gold=0;const rewardGame=new IdleGame(rewards,renderer);rewardGame.battle.enemy={id:'reward',name:'reward',alive:true,boss:false,hp:0,maxHp:100,defense:0,exp:40,gold:100,captureRate:0,hit:0,action:'idle',effects:{}};const originalRandom=Math.random;Math.random=()=>1;rewardGame.killEnemy();Math.random=originalRandom;assert.equal(rewards.player.exp,42);assert.equal(rewards.player.gold,105);

const switchState=teamState(['slime','rabbit','beetle']);const switchGame=new IdleGame(switchState,renderer);switchGame.battle.queuedHits=[{source:'petSkill'},{source:'playerSkill'}];switchGame.battle.petBuffs={haste:{value:.2,remaining:2}};switchGame.setPetTeamSlot(switchState.pets[2].id,'support1');assert.equal(switchGame.battle.queuedHits.length,2,'support changes preserve main queued hits');assert.ok(switchGame.battle.petBuffs.haste,'support changes preserve main buffs');switchGame.setPetTeamSlot(switchState.pets[1].id,'main');assert.deepEqual(switchGame.battle.queuedHits.map(hit=>hit.source),['playerSkill'],'main changes clear old pet hits only');assert.deepEqual(switchGame.battle.petBuffs,{});

const legacy=importSave(JSON.stringify({...defaultState(),version:9,petTeam:undefined,pets:[pet('wolf')],activePetId:'team-wolf'}));assert.equal(legacy.version,9);assert.equal(legacy.petTeam.main,'team-wolf');
const petPage={innerHTML:''};const ui=Object.create(AstralUI.prototype);ui.state=sameRegion;ui.$=id=>id==='petsPage'?petPage:null;ui.renderPets();assert.match(petPage.innerHTML,/目前羈絆/);assert.match(petPage.innerHTML,/星光共鳴/);assert.match(petPage.innerHTML,/羈絆說明/);
let modalCopy='';ui.openModal=(_title,text)=>{modalCopy=text;};ui.openSynergyInfo();assert.match(modalCopy,/跨域遠征/);assert.match(modalCopy,/已啟動/);

const offlineState=teamState(['slime','wolf','lizard']);offlineState.lastSeen=Date.now()-600000;offlineState.offlinePending=null;saved.set(SAVE_KEY,JSON.stringify(offlineState));const boostedOffline=loadState().offlinePending;const plain=defaultState();plain.lastSeen=Date.now()-600000;plain.offlinePending=null;saved.set(SAVE_KEY,JSON.stringify(plain));const plainOffline=loadState().offlinePending;assert.ok(boostedOffline.gold>plainOffline.gold&&boostedOffline.exp>plainOffline.exp,'offline rewards include synergy gold and exp');

console.log('Pet Team Synergy 1.0 smoke: PASS');
