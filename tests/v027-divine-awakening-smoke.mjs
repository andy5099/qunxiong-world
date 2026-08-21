import assert from 'node:assert/strict';
import { SAVE_VERSION, ITEMS, createBlackwindLeader } from '../src/data.js';
import { createState, normalize } from '../src/store.js';
import { equipItem, getFinalStats, sellItem } from '../src/engine.js';
import { render } from '../src/ui.js';
import { AWAKENING_COSTS, EQUIPMENT_AWAKENING_DATA, awakenEquipment, canAwakenEquipment, getAwakenedDisplayName, getAwakeningLevel, getAwakeningRequirement, getAvailableAwakeningCopies, getBondAwakeningBonus, getMemberAwakening, isAwakeningEligible, isEquipmentLocked, toggleEquipmentLock } from '../src/equipment-awakening.js';

let passed=0;const check=(value,label)=>{assert.ok(value,label);passed++;};const equal=(a,b,label)=>{assert.equal(a,b,label);passed++;};
equal(SAVE_VERSION,17,'save version 17');
equal(AWAKENING_COSTS[1].copies,1,'level one duplicate cost centralized');
equal(AWAKENING_COSTS[2].talisman,'intermediate','level two material centralized');
equal(AWAKENING_COSTS[3].talisman,'advanced','level three material centralized');
check(Object.keys(EQUIPMENT_AWAKENING_DATA).length>=12,'at least twelve awakening routes');
for(const id of ['greenEdgeSword','ironSword','leatherArmor','wolfBracers','blackwindBlade','captainBlade','commanderSpear','earthLordSword','crimsonTigerClaw','netherThunderClaw'])check(isAwakeningEligible(id),`${id} eligible`);

const state=createState('覺醒測試');
equal(getAwakeningLevel(state,'greenEdgeSword'),0,'new gear starts level zero');
check(isEquipmentLocked(state,'blackwindBlade'),'boss gear defaults locked');
check(isEquipmentLocked(state,'crimsonTigerClaw'),'world boss gear defaults locked');
check(!isEquipmentLocked(state,'greenEdgeSword'),'ordinary awakening gear defaults unlocked');
state.inventory.greenEdgeSword=6;state.bossProgress.divineTalismans={novice:1,intermediate:1,advanced:1};
let req=getAwakeningRequirement(state,'greenEdgeSword');equal(req.ownedCopies,6,'available duplicate count');
check(canAwakenEquipment(state,'greenEdgeSword').ok,'level one ready');
check(awakenEquipment(state,'greenEdgeSword').ok,'level one awakening');equal(getAwakeningLevel(state,'greenEdgeSword'),1,'level one saved');equal(state.inventory.greenEdgeSword,5,'one duplicate consumed');equal(state.bossProgress.divineTalismans.novice,0,'novice talisman consumed');check(isEquipmentLocked(state,'greenEdgeSword'),'success relocks gear');
check(!canAwakenEquipment(state,'greenEdgeSword').ok,'locked gear cannot become material');toggleEquipmentLock(state,'greenEdgeSword');check(canAwakenEquipment(state,'greenEdgeSword').ok,'unlocked gear can advance');check(awakenEquipment(state,'greenEdgeSword').ok,'level two awakening');equal(getAwakeningLevel(state,'greenEdgeSword'),2,'level two saved');
toggleEquipmentLock(state,'greenEdgeSword');check(awakenEquipment(state,'greenEdgeSword').ok,'level three awakening');equal(getAwakeningLevel(state,'greenEdgeSword'),3,'level three saved');check(getAwakenedDisplayName(state,'greenEdgeSword').includes('神'),'divine display name');check(!getAwakeningRequirement(state,'greenEdgeSword'),'level three cap');

state.inventory.greenEdgeSword=Math.max(1,state.inventory.greenEdgeSword);equipItem(state,'guan-yu','greenEdgeSword');const awakenedStats=getFinalStats(state,'guan-yu');check(awakenedStats.might>state.party[2].might+ITEMS.greenEdgeSword.stats.might,'awakening stat bonus applied');const profile=getMemberAwakening(state,'guan-yu');equal(profile.level,3,'equipped awakening profile');equal(profile.effects.extraHits,2,'skill gains multi-hit evolution');const bond=getBondAwakeningBonus(state,'ten-thousand');check(bond.extraHits>=1,'bond gains extra hit');check(bond.multiplier>1,'bond multiplier enhanced');
check(!sellItem(state,'greenEdgeSword').ok,'locked awakened gear cannot sell');toggleEquipmentLock(state,'greenEdgeSword');state.inventory.greenEdgeSword++;check(sellItem(state,'greenEdgeSword').ok,'unlocked spare can sell');

const protectedState=createState('保護');protectedState.party[4]=createBlackwindLeader();protectedState.inventory.blackwindBlade=3;equipItem(protectedState,'blackwind-lord','blackwindBlade');equal(getAvailableAwakeningCopies(protectedState,'blackwindBlade'),2,'equipped copy excluded');check(!canAwakenEquipment(protectedState,'blackwindBlade').ok,'default lock blocks material');toggleEquipmentLock(protectedState,'blackwindBlade');protectedState.bossProgress.divineTalismans.novice=1;check(canAwakenEquipment(protectedState,'blackwindBlade').ok,'unlock permits explicit awakening');check(awakenEquipment(protectedState,'blackwindBlade').ok,'boss exclusive awakens');equal(protectedState.equipment['blackwind-lord'].weapon,'blackwindBlade','equipped main copy preserved');

const migrated=normalize({...createState('舊玩家'),version:16,inventory:{greenEdgeSword:4,blackwindBlade:2},equipmentAwakening:undefined});equal(migrated.version,17,'v16 migrates to v17');equal(migrated.inventory.greenEdgeSword,4,'old inventory preserved');equal(migrated.inventory.blackwindBlade,2,'old exclusive inventory preserved');equal(getAwakeningLevel(migrated,'greenEdgeSword'),0,'old gear gets zero awakening');check(isEquipmentLocked(migrated,'blackwindBlade'),'old boss gear auto locked');
const reloaded=normalize(state);equal(getAwakeningLevel(reloaded,'greenEdgeSword'),3,'awakening reload preserved');equal(getFinalStats(reloaded,'guan-yu').might,awakenedStats.might,'reload does not double stack');

reloaded.screen='inventory';reloaded.ui.awakeningItem='greenEdgeSword';const html=render(reloaded);check(html.includes('神裝覺醒'),'awakening UI rendered');check(html.includes('覺醒 3 / 3'),'level UI rendered');check(html.includes('可覺醒'),'filter UI rendered');check(html.includes('專屬裝'),'exclusive filter rendered');check(html.includes('已鎖定'),'lock filter rendered');check(html.includes('已達目前覺醒上限'),'cap UI rendered');
console.log(`V0.2.7 divine awakening smoke: ${passed} assertions passed.`);
