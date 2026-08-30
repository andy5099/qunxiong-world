export const CLASS_AFFIXES={
'王族':[['王者威壓','damagePct'],['領袖意志','hpPct'],['戰場號令','cooldown'],['王者祝福','expPct']],
'騎士':[['鋼鐵之軀','reduction'],['狂戰','lowHpDamage'],['盾牆','bossReduction'],['不屈','undying']],
'妖精':[['疾風','speedPct'],['鷹眼','crit'],['穿透箭','penetration'],['自然祝福','regen']],
'法師':[['魔力增幅','damagePct'],['元素共鳴','skillDamage'],['魔力泉源','mpRegen'],['奧術爆發','critDamage']],
'黑暗妖精':[['暗殺','bossDamage'],['影襲','crit'],['雙刃','doubleHit'],['血影','lifesteal']],
'龍騎士':[['龍血','hpPct'],['龍怒','damagePct'],['龍牙','penetration'],['逆鱗','revenge']],
'幻術士':[['精神集中','cooldown'],['幻影','dodge'],['精神侵蝕','penetration'],['虛空力量','skillDamage']]};
export const SPECIAL_AFFIXES=[['斬殺','execute'],['吸血','lifesteal'],['連擊','doubleHit'],['幸運','dropPct'],['尋寶','rareFind'],['巨人殺手','bossDamage'],['狂暴','lowHpSpeed'],['不死','undying'],['技能增幅','skillDamage']];
export const SETS=[
['狂戰士','攻擊與暴擊'],['守護者','生命與防禦'],['疾風','攻速與連擊'],['奧術','魔力與技能'],['尋寶者','掉寶與金幣'],
['皇家榮耀','王族'],['鋼鐵誓約','騎士'],['翠風神射','妖精'],['元素賢者','法師'],['永夜刺客','黑暗妖精'],['古龍之血','龍騎士'],['萬象幻夢','幻術士']
].map((x,i)=>({id:`set${i}`,name:x[0],theme:x[1],class:i<5?null:['王族','騎士','妖精','法師','黑暗妖精','龍騎士','幻術士'][i-5],effects:i===0?{2:{atkPct:10},4:{crit:8},6:{speedPct:20}}:i===1?{2:{hpPct:15},4:{defPct:20},6:{bossReduction:15}}:i===2?{2:{speedPct:10},4:{crit:10},6:{doubleHit:15}}:i===3?{2:{mpPct:20},4:{skillDamage:15},6:{cooldown:10}}:i===4?{2:{dropPct:8},4:{goldPct:15},6:{rareFind:10}}:{2:{atkPct:8,hpPct:8},4:{skillDamage:12},6:{bossDamage:18}}}));
export const BOSS_LOOT=['月影','古木','晶岩','熔心','深沼','墓王','極冬','煉獄','萬獸','蒼穹','星海','裂界'].flatMap((pre,map)=>['頭盔','盔甲','鞋子','戒指1'].map((slot,i)=>({id:`boss${map}-${i}`,map,slot,name:`${pre}${['王冠','戰甲','長靴','之戒'][i]}`})));
export function setById(id){return SETS.find(s=>s.id===id)}
