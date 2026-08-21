import { ITEMS, SAVE_VERSION, createBlackwindLeader } from '../src/data.js';
import { createState, normalize } from '../src/store.js';
import { equipItem, getFinalStats, getTeamPower, optimizeEquipment, resolveRound } from '../src/engine.js';
import { combineAllDivineTalismans, combineDivineTalismans, evolveBossGear, getBlackwindResonance, rollDivineTalismanDrops } from '../src/boss-gear-system.js';
import { render } from '../src/ui.js';

let passed = 0;
const check = (value, label) => { if (!value) throw new Error(label); passed += 1; };
const equal = (actual, expected, label) => check(actual === expected, `${label}: ${actual} !== ${expected}`);
const rng = value => () => value;
const leaderState = () => { const state = createState('神兵測試'); state.party[4] = createBlackwindLeader(); state.progress.bossRecruited = true; return state; };

equal(SAVE_VERSION, 15, 'save version');
check((rollDivineTalismanDrops(1, false, rng(0)).novice || 0) >= 1, 'novice divine talisman drops');
check((rollDivineTalismanDrops(3, false, rng(0)).intermediate || 0) >= 1, 'intermediate divine talisman drops');
check((rollDivineTalismanDrops(4, false, rng(0)).advanced || 0) >= 1, 'advanced divine talisman drops');
let normalTotal = 0, dungeonTotal = 0;
for (let i = 0; i < 100; i += 1) { const value = (i + .5) / 100; normalTotal += Object.values(rollDivineTalismanDrops(2, false, rng(value))).reduce((a,b)=>a+b,0); dungeonTotal += Object.values(rollDivineTalismanDrops(2, true, rng(value))).reduce((a,b)=>a+b,0); }
check(dungeonTotal > normalTotal, 'dungeon boss divine yield is higher');

const craft = leaderState(); craft.bossProgress.divineTalismans = { novice: 5, intermediate: 5, advanced: 0 };
check(combineDivineTalismans(craft, 'intermediate').ok, 'novice combines'); equal(craft.bossProgress.divineTalismans.novice, 0, 'novice consumed'); equal(craft.bossProgress.divineTalismans.intermediate, 6, 'intermediate added');
check(combineDivineTalismans(craft, 'advanced').ok, 'intermediate combines'); equal(craft.bossProgress.divineTalismans.advanced, 1, 'advanced added');
const cascade = leaderState(); cascade.bossProgress.divineTalismans = { novice: 25, intermediate: 0, advanced: 0 }; combineAllDivineTalismans(cascade); equal(cascade.bossProgress.divineTalismans.advanced, 1, 'combine all cascades'); check(Object.values(cascade.bossProgress.divineTalismans).every(v => v >= 0), 'materials never negative');

const evolve = leaderState(); evolve.inventory.blackwindBlade = 1; evolve.inventory.blackwindArmor = 1; evolve.inventory.blackwindCharm = 1; evolve.bossProgress.divineTalismans = { novice: 0, intermediate: 6, advanced: 9 };
equipItem(evolve, 'blackwind-lord', 'blackwindBlade'); check(evolveBossGear(evolve, 'blackwindBlade').ok, 'blackwind blade evolves'); equal(evolve.equipment['blackwind-lord'].weapon, 'overlordBlade', 'equipped weapon stays equipped'); equal(evolve.inventory.blackwindBlade, 0, 'old weapon consumed once'); equal(evolve.inventory.overlordBlade, 1, 'new weapon created once');
check(evolveBossGear(evolve, 'overlordBlade').ok, 'overlord blade evolves'); equal(evolve.equipment['blackwind-lord'].weapon, 'demonOverlordBlade', 'legendary weapon equipped');
check(evolveBossGear(evolve, 'blackwindArmor').ok, 'armor evolves'); check(evolveBossGear(evolve, 'blackwindCharm').ok, 'accessory evolves');

const rare = leaderState(); rare.inventory.blackwindBlade = 1; equipItem(rare, 'blackwind-lord', 'blackwindBlade'); const rareProfile = getBlackwindResonance(rare, 'blackwind-lord'); equal(rareProfile.weaponTier, 1, 'leader weapon resonance'); equal(getBlackwindResonance(rare, 'guan-yu').weaponTier, 0, 'other hero no resonance');
const baseMight = rare.party[4].might + ITEMS.blackwindBlade.stats.might; check(getFinalStats(rare, 'blackwind-lord').might >= baseMight, 'resonance affects stats');

const set = leaderState(); Object.assign(set.inventory, { overlordBlade:1, blackwindWarArmor:1, leaderToken:1 }); equipItem(set,'blackwind-lord','overlordBlade'); equipItem(set,'blackwind-lord','blackwindWarArmor'); equipItem(set,'blackwind-lord','leaderToken'); equal(getBlackwindResonance(set,'blackwind-lord').set,'黑風霸主','epic set active');
Object.assign(set.inventory, { demonOverlordBlade:1, tyrantWarArmor:1, heavenlyLeaderToken:1 }); equipItem(set,'blackwind-lord','demonOverlordBlade'); equipItem(set,'blackwind-lord','tyrantWarArmor'); equipItem(set,'blackwind-lord','heavenlyLeaderToken'); const legendProfile=getBlackwindResonance(set,'blackwind-lord'); equal(legendProfile.set,'鬼神霸主','legendary set active'); check(legendProfile.freeAssault,'free assault active');
const stableMight=set.party[4].might; getFinalStats(set,'blackwind-lord'); getFinalStats(set,'blackwind-lord'); equal(set.party[4].might,stableMight,'base stats unchanged'); const powerBefore=getTeamPower(set); set.equipment['blackwind-lord'].weapon='overlordBlade'; check(getTeamPower(set)<powerBefore,'power updates immediately'); set.equipment['blackwind-lord'].armor=null; equal(getBlackwindResonance(set,'blackwind-lord').set,null,'set disappears when item removed');

const optimize=leaderState(); Object.assign(optimize.inventory,{demonOverlordBlade:1,tyrantWarArmor:1,heavenlyLeaderToken:1,greenEdgeSword:1,ironArmor:1,copperRing:1}); optimizeEquipment(optimize); equal(optimize.equipment['blackwind-lord'].weapon,'demonOverlordBlade','optimizer gives boss weapon to owner');
const migrated=normalize({...set,version:9,bossProgress:{...set.bossProgress,divineTalismans:{novice:7,intermediate:2,advanced:1}}}); equal(migrated.bossProgress.divineTalismans.novice,7,'migration preserves divine talismans'); equal(migrated.inventory.demonOverlordBlade,1,'migration preserves gear');
const old=normalize({...createState('舊檔'),version:9,bossProgress:{talismans:{novice:2}}}); equal(old.bossProgress.divineTalismans.advanced,0,'old save gains defaults');
set.screen='inventory'; check(render(set).includes('神兵符'),'inventory UI renders divine talismans'); set.screen='party'; check(render(set).includes('專屬共鳴'),'party UI renders resonance');

const battle=leaderState(); Object.assign(battle.inventory,{demonOverlordBlade:1,tyrantWarArmor:1,heavenlyLeaderToken:1}); equipItem(battle,'blackwind-lord','demonOverlordBlade'); equipItem(battle,'blackwind-lord','tyrantWarArmor'); equipItem(battle,'blackwind-lord','heavenlyLeaderToken'); battle.party.slice(0,4).forEach(m=>m.hp=0); battle.battle={enemies:[{id:'dummy',name:'木樁',instanceId:'dummy',hp:9999,maxHp:9999,might:0,defense:999,speed:0,gold:[0,0],exp:0,side:'enemy'}],round:1,awaitingCommand:true,finished:false}; resolveRound(battle,'attack',rng(0)); check(battle.log.some(x=>x.text.includes('鬼神霸主')),'battle logs set activation'); equal(battle.party[4].mp,battle.party[4].maxMp,'first assault costs no mp');

console.log(`V0.1.4 boss gear smoke: ${passed} assertions passed.`);
