import { GEAR_QUALITIES, ITEMS } from './data.js?v=v030-yellow-heaven-1';

const equippedCount = (state, itemId) => Object.values(state.equipment || {}).reduce((sum, slots) => sum + Object.values(slots || {}).filter(id => id === itemId).length, 0);
export const getAvailableGearCount = (state, itemId) => Math.max(0, (state.inventory[itemId] || 0) - equippedCount(state,itemId));
export const getNextGearTier = itemId => {
  const item=ITEMS[itemId]; if(!item?.generalGear || item.gearTier >= 3) return null;
  return Object.values(ITEMS).find(candidate=>candidate.generalGear && candidate.baseItemId===item.baseItemId && candidate.gearTier===item.gearTier+1) || null;
};
export function promoteGear(state,itemId,all=false){
  const next=getNextGearTier(itemId), available=getAvailableGearCount(state,itemId);
  if(!next) return {ok:false,reason:'max'};
  const count=all?Math.floor(available/3):available>=3?1:0;
  if(count<1)return {ok:false,reason:'material'};
  state.inventory[itemId]-=count*3;
  state.inventory[next.id]=(state.inventory[next.id]||0)+count;
  state.notice=`升階成功！${ITEMS[itemId].name} ×${count*3} → ${next.name} ×${count}。`;
  return {ok:true,count,nextId:next.id};
}
export function promoteAllGear(state){
  let total=0, changed=true;
  while(changed){changed=false;for(const item of Object.values(ITEMS).filter(item=>item.generalGear && item.gearTier<3)){
    const result=promoteGear(state,item.id,true); if(result.ok){total+=result.count;changed=true;}
  }}
  state.notice=total?`一鍵升階完成，共合成 ${total} 件高階裝備。`:'目前沒有可升階的裝備。';
  return total;
}
export function getGearFamily(state,baseItemId){
  return Object.values(ITEMS).filter(item=>item.generalGear&&item.baseItemId===baseItemId).sort((a,b)=>a.gearTier-b.gearTier).map(item=>({item,owned:state.inventory[item.id]||0,available:getAvailableGearCount(state,item.id),crafts:Math.floor(getAvailableGearCount(state,item.id)/3)}));
}
