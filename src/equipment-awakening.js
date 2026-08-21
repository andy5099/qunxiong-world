import { ITEMS } from './data.js?v=v031-quick-battle-1';

export const AWAKENING_COSTS = Object.freeze({
  1: { copies: 1, talisman: 'novice', amount: 1 },
  2: { copies: 2, talisman: 'intermediate', amount: 1 },
  3: { copies: 2, talisman: 'advanced', amount: 1 }
});

const stages = (name, characterId, skill, effects, bondIds = []) => ({ name, characterId, skill, effects, bondIds });
export const EQUIPMENT_AWAKENING_DATA = Object.freeze({
  greenEdgeSword: stages('青龍偃月刀・神','guan-yu','青龍偃月',[{mightPct:.04,weakDamage:.08},{mightPct:.07,weakDamage:.12,extraHits:1},{mightPct:.1,weakDamage:.18,extraHits:2,ultimateBonus:.12}],['peach-oath','ten-thousand','saint-thunder']),
  ironSword: stages('龍膽星鋒・神','hero','龍膽突擊',[{mightPct:.04,counterBonus:.08},{mightPct:.07,counterBonus:.12,extraHits:1},{mightPct:.1,counterBonus:.18,extraHits:2}],['zhaolie-spirit']),
  leatherArmor: stages('仁德玄甲・神','liu-bei','仁德軍陣',[{hpPct:.05,healBonus:.08},{hpPct:.08,healBonus:.12,gaugeBonus:5},{hpPct:.12,healBonus:.18,gaugeBonus:10}],['peach-oath','zhaolie-spirit']),
  wolfBracers: stages('萬軍破陣腕・神','zhang-fei','震軍破陣',[{defensePct:.05,breakBonus:8},{defensePct:.08,breakBonus:14,counterBonus:.1},{defensePct:.12,breakBonus:22,counterBonus:.16}],['peach-oath','ten-thousand']),
  blackwindBlade: stages('黑風鬼神刀','blackwind-lord','黑風亂舞',[{mightPct:.05,wallBonus:.08},{mightPct:.08,wallBonus:.14,extraHits:1},{mightPct:.12,wallBonus:.22,extraHits:2}],['blackwind-thunder']),
  overlordBlade: stages('寨主霸王刀・神','blackwind-lord','黑風亂舞',[{mightPct:.05,wallBonus:.08},{mightPct:.09,wallBonus:.16,extraHits:1},{mightPct:.14,wallBonus:.25,extraHits:2}],['blackwind-thunder']),
  demonOverlordBlade: stages('寨主霸王刀・天魔','blackwind-lord','黑風亂舞',[{mightPct:.06,wallBonus:.1},{mightPct:.1,wallBonus:.18,extraHits:1},{mightPct:.15,wallBonus:.28,extraHits:2}],['blackwind-thunder']),
  captainBlade: stages('黃天守軍刃・神','yellow-captain','鐵壁軍陣',[{defensePct:.06,guardBonus:.08},{defensePct:.1,guardBonus:.14,counterBonus:.08},{defensePct:.15,guardBonus:.22,counterBonus:.15}],['yellow-heaven','yellow-vanguard']),
  commanderSpear: stages('破軍追魂槍・神','yellow-commander','破軍追殺',[{mightPct:.05,executeBonus:.08},{mightPct:.09,executeBonus:.14,extraHits:1},{mightPct:.14,executeBonus:.22,extraHits:2}],['yellow-heaven','yellow-vanguard']),
  earthLordSword: stages('黃天神雷劍','zhang-bao','黃天雷陣',[{mightPct:.05,lightningBonus:.08},{mightPct:.09,lightningBonus:.14,extraHits:1},{mightPct:.14,lightningBonus:.22,extraHits:2}],['yellow-heaven','blackwind-thunder','saint-thunder']),
  crimsonTigerClaw: stages('赤焰天災爪・神','crimson-tiger','焚天狂襲',[{mightPct:.05,burnBonus:.08},{mightPct:.1,burnBonus:.15,extraHits:1},{mightPct:.16,burnBonus:.24,extraHits:2,ultimateBonus:.12}],['fire-thunder']),
  netherThunderClaw: stages('九幽天罰爪・神','nether-thunder-beast','雷影穿界',[{mightPct:.05,lightningBonus:.08},{mightPct:.1,lightningBonus:.15,extraHits:1},{mightPct:.16,lightningBonus:.24,extraHits:2,ultimateBonus:.12}],['fire-thunder']),
  mountainStone:stages('鎮岳神石・神','basalt-turtle','天地鎮壓',[{defensePct:.06,breakBonus:10},{defensePct:.11,breakBonus:18,extraHits:1},{defensePct:.17,breakBonus:28,extraHits:2,ultimateBonus:.12}],['earth-thunder']),
  phoenixFeatherBlade:stages('幽冥鳳羽刃・神','nether-phoenix','涅槃穿焰',[{mightPct:.05,burnBonus:.08},{mightPct:.1,burnBonus:.15,extraHits:1},{mightPct:.16,burnBonus:.24,extraHits:2}],['phoenix-fire']),
  yellowHeavenSeal:stages('黃天秘印・神','yellow-demon-general','黃天祭雷',[{mightPct:.04,lightningBonus:.07},{mightPct:.08,lightningBonus:.13,extraHits:1},{mightPct:.13,lightningBonus:.2,extraHits:2}],['yellow-demon'])
});

export function normalizeEquipmentAwakening(raw = {}, inventory = {}) {
  const records = {};
  for (const [id, item] of Object.entries(ITEMS)) {
    if (item.type !== 'equipment') continue;
    const old = raw.records?.[id] || raw[id] || {};
    records[id] = { level: Math.max(0, Math.min(3, Math.floor(Number(old.level ?? old.awakeningLevel) || 0))), locked: old.locked === undefined ? Boolean(item.bossOnly || item.worldBossOnly) : Boolean(old.locked) };
  }
  return { records, filter: ['all','awakening','exclusive','locked'].includes(raw.filter) ? raw.filter : 'all' };
}

export const isAwakeningEligible = itemId => Boolean(EQUIPMENT_AWAKENING_DATA[itemId]);
export const getAwakeningRecord = (state,itemId) => state.equipmentAwakening?.records?.[itemId] || { level:0,locked:Boolean(ITEMS[itemId]?.bossOnly||ITEMS[itemId]?.worldBossOnly) };
export const getAwakeningLevel = (state,itemId) => getAwakeningRecord(state,itemId).level;
export const isEquipmentLocked = (state,itemId) => Boolean(getAwakeningRecord(state,itemId).locked);
export function toggleEquipmentLock(state,itemId){const record=state.equipmentAwakening?.records?.[itemId];if(!record)return false;record.locked=!record.locked;return record.locked;}
export function getAwakenedDisplayName(state,itemId){const item=ITEMS[itemId],data=EQUIPMENT_AWAKENING_DATA[itemId],level=getAwakeningLevel(state,itemId);return level>=3&&data?data.name:level?`${item?.name||itemId}・覺醒${['','Ⅰ','Ⅱ','Ⅲ'][level]}`:item?.name||itemId;}
export function getAwakeningEffects(state,itemId){const data=EQUIPMENT_AWAKENING_DATA[itemId],level=getAwakeningLevel(state,itemId);return data&&level?{...data.effects[level-1]}:{};}
const equippedCount=(state,itemId)=>Object.values(state.equipment||{}).reduce((n,slots)=>n+Object.values(slots||{}).filter(id=>id===itemId).length,0);
export const getAvailableAwakeningCopies=(state,itemId)=>Math.max(0,(state.inventory?.[itemId]||0)-equippedCount(state,itemId));
export function getAwakeningRequirement(state,itemId){const level=getAwakeningLevel(state,itemId),next=level+1,cost=AWAKENING_COSTS[next];if(!cost)return null;return{next,...cost,ownedCopies:getAvailableAwakeningCopies(state,itemId),ownedTalisman:state.bossProgress?.divineTalismans?.[cost.talisman]||0};}
export function canAwakenEquipment(state,itemId){const requirement=getAwakeningRequirement(state,itemId);if(!isAwakeningEligible(itemId))return{ok:false,reason:'此裝備尚無神裝覺醒路線。'};if(!requirement)return{ok:false,reason:'已達神裝覺醒上限。'};if(isEquipmentLocked(state,itemId))return{ok:false,reason:'請先解除裝備鎖定。'};if(requirement.ownedCopies<requirement.copies)return{ok:false,reason:'同名裝備素材不足。'};if(requirement.ownedTalisman<requirement.amount)return{ok:false,reason:'神兵符不足。'};return{ok:true,requirement};}
export function awakenEquipment(state,itemId){const check=canAwakenEquipment(state,itemId);if(!check.ok)return check;const {requirement}=check,record=state.equipmentAwakening.records[itemId];state.inventory[itemId]-=requirement.copies;state.bossProgress.divineTalismans[requirement.talisman]-=requirement.amount;record.level=requirement.next;record.locked=true;return{ok:true,level:record.level,name:getAwakenedDisplayName(state,itemId)};}
export function getMemberAwakening(state,memberOrId){const id=typeof memberOrId==='string'?memberOrId:memberOrId?.id,slots=state.equipment?.[id]||{};let best=null;for(const itemId of Object.values(slots)){const data=EQUIPMENT_AWAKENING_DATA[itemId],level=getAwakeningLevel(state,itemId);if(data&&level&&(!data.characterId||data.characterId===id)&&(!best||level>best.level)){best={itemId,level,data,effects:getAwakeningEffects(state,itemId)};}}return best||{level:0,effects:{},data:null,itemId:null};}
export function getBondAwakeningBonus(state,bondId){let extraHits=0,multiplier=1;for(const member of state.party||[]){const awakening=getMemberAwakening(state,member);if(awakening.data?.bondIds.includes(bondId)){extraHits+=awakening.level>=2?1:0;multiplier+=awakening.level*.035;}}return{extraHits:Math.min(3,extraHits),multiplier};}
