import assert from 'node:assert/strict';
import { EQUIPMENT_AFFIX_COUNT, EQUIPMENT_AFFIX_DATA, equipmentPower, generateEquipmentAffixes, getEquipmentAffixBonuses, normalizeEquipment, validateEquipmentAffixData } from '../src/astral-world/equipment-affix-system.js';
import { compareEquipment, recompute } from '../src/astral-world/core.js';
import { defaultState } from '../src/astral-world/save.js';

assert.deepEqual(validateEquipmentAffixData(), [], '詞綴資料必須完整有效');
assert.ok(Object.keys(EQUIPMENT_AFFIX_DATA).length >= 11);
for (const slot of ['weapon','helmet','armor','gloves','boots','necklace','ring','wings']) {
  const affixes=generateEquipmentAffixes({slot,quality:'astral',level:1,random:()=>.5});
  assert.equal(affixes.length,3,`${slot} 星界裝備必須可產生三條詞綴`);
  assert.equal(new Set(affixes.map(entry=>entry.id)).size,3);
}
for (const [quality,[min,max]] of Object.entries(EQUIPMENT_AFFIX_COUNT)) {
  const low=generateEquipmentAffixes({slot:'weapon',quality,level:30,random:()=>0});
  const high=generateEquipmentAffixes({slot:'weapon',quality,level:30,random:()=>.999});
  assert.equal(low.length,min,`${quality} 最小詞綴數`);
  assert.equal(high.length,max,`${quality} 最大詞綴數`);
  assert.equal(new Set(high.map(entry=>entry.id)).size,high.length,'詞綴不可重複');
}

const legacy=normalizeEquipment({id:'old',slot:'weapon',level:8,quality:'epic',enhance:2,locked:true,stats:{attack:20},affixes:[{id:'attackPercent',key:'attack',mode:'percent',value:.1},{id:'bossDamage',key:'bossDamage',mode:'flat',value:.08}]});
assert.equal(legacy.affixes[0].id,'attack_percent');
assert.equal(legacy.affixes[1].id,'boss_damage');
assert.equal(legacy.locked,true);
assert.equal(legacy.enhance,2);
const legacyFull=normalizeEquipment({slot:'armor',stats:{},affixes:[{id:'defensePercent',key:'defense',mode:'percent',value:.1},{id:'regen',key:'regen',mode:'flat',value:4}]});
assert.deepEqual(legacyFull.affixes.map(entry=>entry.id),['defense_percent','regen'],'舊數值詞綴不可遺失');

const item={id:'test',slot:'weapon',level:10,quality:'legendary',enhance:0,stats:{attack:30},affixes:[
  {id:'attack_flat',stat:'attack',mode:'flat',value:10},
  {id:'attack_percent',stat:'attack',mode:'percent',value:.1},
]};
const bonus=getEquipmentAffixBonuses(item);
assert.equal(bonus.flat.attack,10);
assert.equal(bonus.percent.attack,.1);
assert.ok(equipmentPower(item)>0);
assert.ok(compareEquipment(item,null).stats.attack>0);

const state=defaultState();
state.inventory=[item]; state.equipped={weapon:item};
const baseAttack=state.player.attack;
recompute(state);
assert.ok(state.player.attack>baseAttack,'裝備詞綴必須進入最終能力');
assert.equal(state.player.equipmentBossDamageBonus,0);
assert.equal(state.player.equipmentNormalDamageBonus,0);

const utility={id:'utility',slot:'wings',level:10,quality:'astral',enhance:0,stats:{},affixes:[
  {id:'boss_damage',stat:'bossDamage',mode:'percent',value:.1},
  {id:'normal_damage',stat:'normalDamage',mode:'percent',value:.08},
  {id:'gold_bonus',stat:'goldBonus',mode:'percent',value:.07},
]};
state.equipped={wings:utility}; recompute(state);
assert.equal(state.player.equipmentBossDamageBonus,.1);
assert.equal(state.player.equipmentNormalDamageBonus,.08);
assert.equal(state.player.equipmentGoldBonus,.07);

console.log('Equipment Affix Foundation smoke test passed.');
