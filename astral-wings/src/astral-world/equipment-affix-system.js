const all = ['weapon','helmet','armor','gloves','boots','necklace','ring','wings'];
const rate = (min, max) => ({ min, max });

export const EQUIPMENT_AFFIX_DATA = {
  attack_flat: { label:'鋒銳', stat:'attack', mode:'flat', slots:['weapon','gloves','ring'], range:rate(3,12), weight:12, minLevel:1 },
  hp_flat: { label:'堅韌', stat:'maxHp', mode:'flat', slots:['helmet','armor','boots','necklace'], range:rate(24,90), weight:12, minLevel:1 },
  defense_flat: { label:'鐵壁', stat:'defense', mode:'flat', slots:['helmet','armor','gloves','boots'], range:rate(2,9), weight:11, minLevel:1 },
  attack_percent: { label:'狂怒', stat:'attack', mode:'percent', slots:['weapon','ring','wings'], range:rate(.025,.075), weight:7, minLevel:1 },
  hp_percent: { label:'生命', stat:'maxHp', mode:'percent', slots:['armor','necklace','wings'], range:rate(.03,.09), weight:7, minLevel:1 },
  crit_rate: { label:'精準', stat:'crit', mode:'additiveRate', slots:['weapon','gloves','ring'], range:rate(.008,.03), weight:7, minLevel:1 },
  attack_speed: { label:'迅捷', stat:'attackSpeed', mode:'intervalReduction', slots:['gloves','boots','wings'], range:rate(.015,.055), weight:6, minLevel:1 },
  boss_damage: { label:'討伐', stat:'bossDamage', mode:'percent', slots:['weapon','necklace','wings'], range:rate(.025,.085), weight:5, minLevel:1 },
  normal_damage: { label:'獵殺', stat:'normalDamage', mode:'percent', slots:['weapon','gloves','boots'], range:rate(.025,.075), weight:6, minLevel:1 },
  gold_bonus: { label:'貪婪', stat:'goldBonus', mode:'percent', slots:['ring','necklace','wings'], range:rate(.025,.09), weight:5, minLevel:1 },
  exp_bonus: { label:'智慧', stat:'expBonus', mode:'percent', slots:['helmet','necklace','wings'], range:rate(.025,.09), weight:5, minLevel:1 },
  defense_percent: { label:'守護', stat:'defense', mode:'percent', slots:['helmet','armor','gloves','boots'], range:rate(.03,.09), weight:5, minLevel:1 },
  crit_damage: { label:'致命', stat:'critDamage', mode:'additiveRate', slots:['gloves','necklace','ring'], range:rate(.03,.1), weight:5, minLevel:1 },
  skill_damage: { label:'奧秘', stat:'skillDamage', mode:'additiveRate', slots:['weapon','necklace','ring'], range:rate(.025,.08), weight:4, minLevel:1 },
  pet_damage: { label:'共鳴', stat:'petDamage', mode:'additiveRate', slots:['necklace','ring','wings'], range:rate(.03,.09), weight:4, minLevel:1 },
  regen: { label:'星光再生', stat:'regen', mode:'flat', slots:['armor','necklace','wings'], range:rate(1,6), weight:3, minLevel:1 },
};

export const EQUIPMENT_AFFIX_COUNT = {
  common:[0,0], uncommon:[0,1], rare:[1,1], epic:[1,2], legendary:[2,2], mythic:[2,3], astral:[3,3],
};

export const EQUIPMENT_POWER_WEIGHTS = {
  attack:8, maxHp:.42, defense:5, crit:220, critDamage:80, attackSpeed:210,
  attackPercent:520, hpPercent:280, bossDamage:420, normalDamage:380, goldBonus:100, expBonus:100,
  skillDamage:300, petDamage:260, regen:3,
};

const legacyIds = {
  attackPercent:'attack_percent', defensePercent:'defense_percent', hpPercent:'hp_percent', crit:'crit_rate', critDamage:'crit_damage', attackSpeed:'attack_speed',
  skillDamage:'skill_damage', bossDamage:'boss_damage', goldBonus:'gold_bonus', expBonus:'exp_bonus', petDamage:'pet_damage', regen:'regen',
};
const byLegacyStat = {
  'attack|percent':'attack_percent', 'maxHp|percent':'hp_percent', 'crit|flat':'crit_rate',
  'attackSpeed|flat':'attack_speed', 'bossDamage|flat':'boss_damage', 'goldBonus|flat':'gold_bonus',
  'expBonus|flat':'exp_bonus', 'defense|percent':'defense_percent', 'critDamage|flat':'crit_damage',
  'skillDamage|flat':'skill_damage', 'petDamage|flat':'pet_damage', 'regen|flat':'regen',
};

const finite = value => Number.isFinite(Number(value));
const rounded = (value, mode) => mode === 'flat' ? Math.max(1, Math.round(value)) : +Math.max(.001, value).toFixed(4);
const levelScale = level => Math.min(2.35, 1 + Math.max(0, Number(level || 1) - 1) * .015);

function weightedPick(pool, random) {
  const total = pool.reduce((sum, entry) => sum + entry.data.weight, 0);
  let roll = random() * total;
  for (let i=0;i<pool.length;i+=1) { roll -= pool[i].data.weight; if (roll <= 0) return i; }
  return pool.length - 1;
}

export function generateEquipmentAffixes({ slot, quality='common', level=1, random=Math.random }={}) {
  if (!all.includes(slot)) return [];
  const [min,max] = EQUIPMENT_AFFIX_COUNT[quality] || [0,0];
  const count = min + Math.floor(Math.max(0, Math.min(.999999, random())) * (max-min+1));
  const pool = Object.entries(EQUIPMENT_AFFIX_DATA)
    .filter(([,data]) => data.slots.includes(slot) && level >= data.minLevel)
    .map(([id,data]) => ({id,data}));
  const result=[];
  while (result.length<count && pool.length) {
    const index=weightedPick(pool, random), picked=pool.splice(index,1)[0];
    const raw=(picked.data.range.min + random()*(picked.data.range.max-picked.data.range.min))*levelScale(level);
    result.push({ id:picked.id, value:rounded(raw,picked.data.mode), stat:picked.data.stat, mode:picked.data.mode });
  }
  return result;
}

export function normalizeEquipmentAffixes(affixes) {
  if (!Array.isArray(affixes)) return [];
  const result=[]; const seen=new Set();
  for (const old of affixes) {
    if (!old || !finite(old.value)) continue;
    const id=EQUIPMENT_AFFIX_DATA[old.id] ? old.id : legacyIds[old.id] || byLegacyStat[`${old.key||old.stat}|${old.mode}`];
    const data=EQUIPMENT_AFFIX_DATA[id];
    if (!data || seen.has(id)) continue;
    seen.add(id);
    const value=id==='attack_speed' ? Math.abs(Number(old.value)) : Number(old.value);
    result.push({ id, value:rounded(value,data.mode), stat:data.stat, mode:data.mode });
  }
  return result;
}

export function normalizeEquipment(item) {
  if (!item || typeof item !== 'object') return null;
  const stats={};
  for (const [key,value] of Object.entries(item.stats || {})) if (finite(value)) stats[key]=Number(value);
  return { ...item, level:Math.max(1,Math.floor(Number(item.level)||1)), enhance:Math.max(0,Math.floor(Number(item.enhance)||0)), stats, affixes:normalizeEquipmentAffixes(item.affixes), locked:Boolean(item.locked) };
}

export function getEquipmentAffixBonuses(item) {
  const bonus={ flat:{}, percent:{}, additiveRate:{}, intervalMultiplier:1, bossDamage:0, normalDamage:0, goldBonus:0, expBonus:0 };
  for (const affix of normalizeEquipmentAffixes(item?.affixes)) {
    if (affix.mode==='flat') bonus.flat[affix.stat]=(bonus.flat[affix.stat]||0)+affix.value;
    else if (affix.mode==='additiveRate') bonus.additiveRate[affix.stat]=(bonus.additiveRate[affix.stat]||0)+affix.value;
    else if (affix.mode==='intervalReduction') bonus.intervalMultiplier*=1-affix.value;
    else if (['bossDamage','normalDamage','goldBonus','expBonus'].includes(affix.stat)) bonus[affix.stat]+=affix.value;
    else bonus.percent[affix.stat]=(bonus.percent[affix.stat]||0)+affix.value;
  }
  return bonus;
}

export function getEquipmentStatProfile(item) {
  const profile={attack:0,maxHp:0,defense:0,crit:0,critDamage:0,attackSpeed:0,skillDamage:0,petDamage:0,regen:0,bossDamage:0,normalDamage:0,goldBonus:0,expBonus:0};
  if (!item) return profile;
  const enhance=1+(item.enhance||0)*.08;
  for (const [key,value] of Object.entries(item.stats||{})) if (key in profile) profile[key]+=Number(value||0)*enhance;
  const bonus=getEquipmentAffixBonuses(item);
  for (const [key,value] of Object.entries(bonus.flat)) if (key in profile) profile[key]+=value;
  for (const [key,value] of Object.entries(bonus.additiveRate)) if (key in profile) profile[key]+=value;
  for (const [key,value] of Object.entries(bonus.percent)) if (key in profile) profile[key]+=profile[key]*value;
  profile.attackSpeed += 1-bonus.intervalMultiplier;
  for (const key of ['bossDamage','normalDamage','goldBonus','expBonus']) profile[key]+=bonus[key];
  return profile;
}

export function equipmentPower(item) {
  const p=getEquipmentStatProfile(item);
  return Math.max(0,Math.floor(p.attack*EQUIPMENT_POWER_WEIGHTS.attack+p.maxHp*EQUIPMENT_POWER_WEIGHTS.maxHp+p.defense*EQUIPMENT_POWER_WEIGHTS.defense+p.crit*EQUIPMENT_POWER_WEIGHTS.crit+p.critDamage*EQUIPMENT_POWER_WEIGHTS.critDamage+Math.abs(p.attackSpeed)*EQUIPMENT_POWER_WEIGHTS.attackSpeed+p.skillDamage*EQUIPMENT_POWER_WEIGHTS.skillDamage+p.petDamage*EQUIPMENT_POWER_WEIGHTS.petDamage+p.regen*EQUIPMENT_POWER_WEIGHTS.regen+p.bossDamage*EQUIPMENT_POWER_WEIGHTS.bossDamage+p.normalDamage*EQUIPMENT_POWER_WEIGHTS.normalDamage+p.goldBonus*EQUIPMENT_POWER_WEIGHTS.goldBonus+p.expBonus*EQUIPMENT_POWER_WEIGHTS.expBonus));
}

export function formatEquipmentAffix(affix) {
  const data=EQUIPMENT_AFFIX_DATA[affix?.id];
  if (!data || !finite(affix?.value)) return null;
  const value=data.mode==='flat' ? Math.round(affix.value) : `${(affix.value*100).toFixed(1)}%`;
  const suffix=data.mode==='intervalReduction'?'攻擊間隔縮短':data.stat==='normalDamage'?'普通怪傷害':data.stat==='bossDamage'?'Boss 傷害':data.stat==='goldBonus'?'金幣取得':data.stat==='expBonus'?'經驗取得':data.stat==='crit'?'暴擊率':data.stat==='critDamage'?'暴擊傷害':data.stat==='skillDamage'?'技能傷害':data.stat==='petDamage'?'寵物傷害':data.stat==='regen'?'生命恢復':data.stat==='maxHp'?'生命':data.stat==='defense'?'防禦':'攻擊';
  return { label:data.label, text:`${data.label} · ${suffix} +${value}` };
}

export function validateEquipmentAffixData() {
  const errors=[];
  for (const slot of all) if (Object.values(EQUIPMENT_AFFIX_DATA).filter(data=>data.slots.includes(slot)).length<2) errors.push(`${slot} 可用詞綴不足`);
  for (const [id,data] of Object.entries(EQUIPMENT_AFFIX_DATA)) {
    if (!data.label || !data.stat || !['flat','percent','additiveRate','intervalReduction'].includes(data.mode)) errors.push(`${id} 定義無效`);
    if (!(data.range.min>=0) || !(data.range.max>=data.range.min) || !(data.weight>0)) errors.push(`${id} 數值範圍無效`);
  }
  for (const [quality,range] of Object.entries(EQUIPMENT_AFFIX_COUNT)) if (range[0]<0||range[1]<range[0]) errors.push(`${quality} 詞綴數量無效`);
  return errors;
}
