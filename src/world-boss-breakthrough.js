export const WORLD_BOSS_BREAKTHROUGH_COSTS = {
  1:{legendary:1,divineAdvanced:2}, 2:{legendary:2,divineAdvanced:4}, 3:{legendary:3,divineAdvanced:6}
};
export function normalizeBreakthrough(value){return Math.max(0,Math.min(3,Math.floor(Number(value)||0)));}
export function getBreakthroughProfile(level){
  const rank=normalizeBreakthrough(level);
  return {level:rank,hpPct:rank>=3?.18:rank>=1?.08:0,mightPct:rank>=3?.13:rank>=1?.05:0,defensePct:rank>=2?.08:0,speedPct:rank>=2?.05:0,rendPct:rank>=2?.08:0,sweepPct:rank>=3?.10:0,heavenPct:rank>=3?.10:0};
}
export function canBreakthrough(state){
  const level=normalizeBreakthrough(state.worldBoss?.breakthroughLevel),cost=WORLD_BOSS_BREAKTHROUGH_COSTS[level+1];
  if(!state.worldBoss?.captured||!cost)return false;
  return (state.bossProgress.talismans.legendary||0)>=cost.legendary&&(state.bossProgress.divineTalismans.advanced||0)>=cost.divineAdvanced;
}
export function breakthroughWorldBoss(state){
  const current=normalizeBreakthrough(state.worldBoss?.breakthroughLevel),next=current+1,cost=WORLD_BOSS_BREAKTHROUGH_COSTS[next];
  if(!cost||!canBreakthrough(state))return {ok:false};
  state.bossProgress.talismans.legendary-=cost.legendary;state.bossProgress.divineTalismans.advanced-=cost.divineAdvanced;
  state.worldBoss.breakthroughLevel=next;state.notice=`世界王・赤焰魔虎突破成功！目前突破 ${['','Ⅰ','Ⅱ','Ⅲ'][next]}。`;
  return {ok:true,level:next};
}
