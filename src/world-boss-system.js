import { createCrimsonTiger, createNetherThunderBeast } from './data.js?v=v022-flipper-final-1';
import { normalizeBreakthrough } from './world-boss-breakthrough.js?v=v022-flipper-final-1';

export const WORLD_BOSSES = {
  crimsonTiger: {
    id: 'crimsonTiger', memberId: 'crimson-tiger', name: '赤焰魔虎', title: '世界王・赤焰魔虎', recommendedPower: 30000, captureRate: 0.05,
    stats: { level: 28, maxHp: 12800, maxMp: 180, might: 310, defense: 145, speed: 88, exp: 6200, gold: [4200, 5600] },
    drops: ['crimsonTigerClaw','crimsonWarArmor','crimsonTigerSeal'], createMember: createCrimsonTiger
  },
  netherThunder: {
    id: 'netherThunder', memberId: 'nether-thunder-beast', name: '九幽雷獸', title: '世界王・九幽雷獸', recommendedPower: 52000, captureRate: 0.05,
    stats: { level: 42, maxHp: 22800, maxMp: 260, might: 455, defense: 220, speed: 142, exp: 10800, gold: [7600, 9800] },
    drops: ['netherThunderClaw','netherThunderArmor','thunderEmperorSeal'], createMember: createNetherThunderBeast
  }
};
export const WORLD_BOSS = WORLD_BOSSES.crimsonTiger;

export function createWorldBossEnemy(id = 'crimsonTiger') {
  const profile = WORLD_BOSSES[id] || WORLD_BOSS;
  return { id: `${profile.id}Boss`, worldBossId: profile.id, instanceId: `world-boss-${profile.id}`, name: profile.name, displayName: profile.title, ...profile.stats, hp: profile.stats.maxHp, mp: profile.stats.maxMp, side:'enemy', boss:true, worldBoss:true, battleMode:'puzzle', phase:1, rarityRank:5, rarityStars:'★★★★★', assaultMultiplier:id==='netherThunder'?2.45:2.2 };
}

export function normalizeWorldBoss(raw = {}, unlocked = false) {
  return { unlocked:Boolean(raw.unlocked || unlocked), attempts:Math.max(0,Number(raw.attempts)||0), bestPhase:Math.max(0,Math.min(3,Number(raw.bestPhase)||0)), lowestHpPct:Math.max(0,Math.min(100,Number.isFinite(Number(raw.lowestHpPct))?Number(raw.lowestHpPct):100)), defeated:Boolean(raw.defeated), defeats:Math.max(0,Number(raw.defeats)||0), captured:Boolean(raw.captured), firstRewardClaimed:Boolean(raw.firstRewardClaimed), breakthroughLevel:normalizeBreakthrough(raw.breakthroughLevel) };
}

export function getWorldBossState(state, id = 'crimsonTiger') { return id === 'crimsonTiger' ? state.worldBoss : state.worldBosses?.[id]; }
export function getWorldBossMasteryState(state, id='crimsonTiger') { return id === 'crimsonTiger' ? state.worldBossMastery : state.worldBossMasteries?.[id]; }
export function getWorldBossRecordState(state,id='crimsonTiger'){return id==='crimsonTiger'?state.worldBossRecords:state.worldBossRecordsById?.[id];}

export function getWorldBossResonance(state, memberOrId) {
  const member=typeof memberOrId==='string'?[...state.party,...(state.roster||[])].find(candidate=>candidate?.id===memberOrId):memberOrId;
  const result={mightPct:0,defensePct:0,hpPct:0,speedPct:0,skillPct:0,set:null};
  if(!member?.worldBoss)return result;
  const slots=state.equipment?.[member.id]||{};
  if(member.id==='crimson-tiger'){
    if(slots.weapon==='crimsonTigerClaw'){result.mightPct+=.10;result.speedPct+=.05;}
    if(slots.armor==='crimsonWarArmor'){result.hpPct+=.10;result.defensePct+=.10;}
    if(slots.accessory==='crimsonTigerSeal')result.skillPct+=.10;
    if(slots.weapon==='crimsonTigerClaw'&&slots.armor==='crimsonWarArmor'&&slots.accessory==='crimsonTigerSeal'){result.set='赤焰霸主';result.mightPct+=.10;result.speedPct+=.05;result.skillPct+=.10;}
  } else if(member.id==='nether-thunder-beast'){
    if(slots.weapon==='netherThunderClaw'){result.mightPct+=.12;result.speedPct+=.10;result.set='九幽雷鳴';}
    if(slots.armor==='netherThunderArmor'){result.hpPct+=.14;result.defensePct+=.12;result.set=result.set||'雷甲護體';}
    if(slots.accessory==='thunderEmperorSeal'){result.skillPct+=.14;result.set=result.set||'雷帝威壓';}
    if(slots.weapon==='netherThunderClaw'&&slots.armor==='netherThunderArmor'&&slots.accessory==='thunderEmperorSeal'){result.set='九幽雷帝';result.mightPct+=.12;result.speedPct+=.10;result.skillPct+=.14;}
  }
  return result;
}

export function addWorldBossToRoster(state,id='crimsonTiger'){
  const profile=WORLD_BOSSES[id]; if(!profile)return false;
  if([...state.party,...state.roster].some(member=>member?.id===profile.memberId))return false;
  state.roster.push(profile.createMember()); state.equipment[profile.memberId]||={weapon:null,armor:null,accessory:null};
  getWorldBossState(state,id).captured=true; return true;
}
export const addTigerToRoster=state=>addWorldBossToRoster(state,'crimsonTiger');

export function deployRosterMember(state,memberId,slotIndex){
  if(state.battle){state.notice='戰鬥結束後才能調整隊伍。';return false;}
  const index=state.roster.findIndex(member=>member?.id===memberId),slot=Math.max(0,Math.min(4,Number(slotIndex)||0));
  if(index<0||slot===0&&state.party[0]?.isPlayer){state.notice=slot===0?'主角目前固定出戰。':'找不到候補武將。';return false;}
  const incoming=state.roster.splice(index,1)[0],outgoing=state.party[slot];state.party[slot]=incoming;if(outgoing)state.roster.push(outgoing);state.notice=`${incoming.name}已替換${outgoing?.name||'空位'}。`;return true;
}

export function quickBestParty(state,getPower){
  if(state.battle){state.notice='戰鬥結束後才能調整隊伍。';return false;}
  const hero=state.party[0],pool=[...state.party.slice(1),...state.roster].filter(Boolean),unique=[...new Map(pool.map(member=>[member.id,member])).values()];
  unique.sort((a,b)=>getPower(state,b)-getPower(state,a)||b.level-a.level);
  state.party=[hero,...unique.slice(0,4)];while(state.party.length<5)state.party.push(null);
  const active=new Set(state.party.filter(Boolean).map(member=>member.id));state.roster=unique.filter(member=>!active.has(member.id));state.notice='已依目前戰力完成快速編隊，裝備保持不變。';return true;
}

export function withdrawPartyMember(state,memberId){
  if(state.battle){state.notice='戰鬥結束後才能調整隊伍。';return false;}
  const index=state.party.findIndex(member=>member?.id===memberId);if(index<=0||state.party.filter(Boolean).length<=1)return false;
  const member=state.party[index];if(state.roster.some(candidate=>candidate?.id===member.id))return false;state.roster.push(member);state.party[index]=null;state.notice=`${member.name}已移至待命名冊。`;return true;
}
