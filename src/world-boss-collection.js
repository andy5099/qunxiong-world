export const WORLD_BOSS_VARIANT_CONFIG = {
  qualities: {
    normal: { id:'normal', name:'普通', rank:1, chance:.55, statMultiplier:1, captureMultiplier:1 },
    rare: { id:'rare', name:'稀有', rank:2, chance:.28, statMultiplier:1.05, captureMultiplier:.8 },
    epic: { id:'epic', name:'史詩', rank:3, chance:.13, statMultiplier:1.12, captureMultiplier:.6 },
    legendary: { id:'legendary', name:'傳說', rank:4, chance:.04, statMultiplier:1.2, captureMultiplier:.4 }
  },
  pity: { softStart:10, hard:20, legendaryStep:.035 },
  talents: {
    crimsonTiger: {
      rare:[{id:'blaze',name:'烈焰',description:'高 Combo 時燃燒追擊稍微增強。'}],
      epic:[{id:'wildfire',name:'狂炎',description:'50 Combo 後追加一次火焰追擊。'},{id:'flameKing',name:'炎王',description:'Power Flip 後短時間提高火焰傷害。'}],
      legendary:[{id:'heavenBlood',name:'焚天血脈',description:'Power MAX 後進入焚天狀態，强化火焰追擊並保持高速。'}]
    },
    netherThunder: {
      rare:[{id:'thunderRush',name:'雷迅',description:'Dash 後保留更多速度。'}],
      epic:[{id:'thunderChain',name:'雷鏈',description:'穿透 Boss 後追加雷鏈 Hit。'},{id:'thunderField',name:'雷域',description:'Power Flip 後短時間追加雷擊。'}],
      legendary:[{id:'netherLightning',name:'九幽神雷',description:'Power MAX 後進入雷化，獲得穿透與追加天雷。'}]
    }
  }
};

export const WORLD_BOSS_QUALITY_ORDER=['normal','rare','epic','legendary'];
export const getWorldBossQuality=id=>WORLD_BOSS_VARIANT_CONFIG.qualities[id]||WORLD_BOSS_VARIANT_CONFIG.qualities.normal;
export const compareWorldBossQuality=(a,b)=>getWorldBossQuality(a).rank-getWorldBossQuality(b).rank;

export function normalizeWorldBossIndividual(raw={}){
  raw=raw&&typeof raw==='object'?raw:{};
  const quality=getWorldBossQuality(raw.quality).id;
  return {quality,talentId:typeof raw.talentId==='string'?raw.talentId:null};
}

export function getWorldBossTalent(bossId,talentId){
  return Object.values(WORLD_BOSS_VARIANT_CONFIG.talents[bossId]||{}).flat().find(talent=>talent.id===talentId)||null;
}

export function rollWorldBossVariant(bossId,record,rng=Math.random){
  const pity=Math.max(0,Number(record?.legendaryPity)||0),config=WORLD_BOSS_VARIANT_CONFIG;
  let quality='normal';
  if(pity>=config.pity.hard-1)quality='legendary';
  else {
    const bonus=pity>=config.pity.softStart?Math.min(.35,(pity-config.pity.softStart+1)*config.pity.legendaryStep):0;
    const legendary=config.qualities.legendary.chance+bonus,roll=rng();
    if(roll<legendary)quality='legendary';
    else if(roll<legendary+config.qualities.epic.chance)quality='epic';
    else if(roll<legendary+config.qualities.epic.chance+config.qualities.rare.chance)quality='rare';
  }
  const pool=WORLD_BOSS_VARIANT_CONFIG.talents[bossId]?.[quality]||[];
  const talent=pool.length?pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))]:null;
  return {quality,talentId:talent?.id||null};
}

export function recordWorldBossVariant(record,variant){
  const current=getWorldBossQuality(record.highestEncounterQuality),next=getWorldBossQuality(variant.quality);
  record.legendaryPity=variant.quality==='legendary'?0:Math.min(WORLD_BOSS_VARIANT_CONFIG.pity.hard,Math.max(0,Number(record.legendaryPity)||0)+1);
  if(next.rank>current.rank)record.highestEncounterQuality=next.id;
  record.discoveredTalents=Array.from(new Set([...(record.discoveredTalents||[]),...(variant.talentId?[variant.talentId]:[])]));
}

export function applyWorldBossVariant(enemy,variant){
  const quality=getWorldBossQuality(variant.quality),scaled=['maxHp','might','defense','speed'];
  for(const key of scaled)enemy[key]=Math.round(enemy[key]*quality.statMultiplier);
  enemy.hp=enemy.maxHp;enemy.individualQuality=quality.id;enemy.individualTalent=variant.talentId;
  return enemy;
}
