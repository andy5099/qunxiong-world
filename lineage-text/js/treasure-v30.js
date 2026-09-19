import{BOSS_CATALOG,BOSS_SETS}from'./systems.js?v=60';
const monster=(name,level,hp,ac,atk,hit,exp,gold)=>({name,level,hp,ac,atk,hit,exp,gold,size:'Large'});
const map=(id,stage,label,tier,normals,bosses)=>({id,name:`寶${stage}`,treasure:true,treasureStage:stage,tier,fee:0,danger:stage+3,focus:`推薦：${label}・無門檻直接進入・Boss群：${bosses.join('、')}`,normals,bosses,boss:bosses[0],mini:null});
export const TREASURE_MAPS=[
 map(56,1,'中高階',10,[monster('黑騎士',46,880,-28,62,48,2300,330),monster('食人妖精王',48,980,-30,67,50,2550,360),monster('冰霜騎士',50,1080,-32,72,52,2800,390),monster('黑長者',52,950,-34,76,55,3000,420)],['巴風特','克特','死亡騎士']),
 map(57,2,'高階',13,[monster('地龍近衛',56,1450,-38,86,61,3900,520),monster('骨龍',58,1580,-40,92,64,4300,570),monster('混沌司祭',59,1380,-42,96,66,4550,610),monster('死亡騎士近衛',60,1660,-44,101,69,4800,650)],['黑長者','冰之女王','死亡騎士','惡魔']),
 map(58,3,'極高階',16,[monster('堕落祭司',64,2250,-48,116,76,6500,820),monster('暗影魔獸',66,2480,-50,124,79,7100,890),monster('殘暴骷髏槍兵',67,2620,-52,130,82,7600,950),monster('深淵法師',68,2320,-54,136,85,8100,1020)],['死亡騎士','騎士范德','惡魔','巫妖']),
 map(59,4,'終極打寶',18,[monster('艾莉絲',72,3400,-58,154,91,10800,1320),monster('木乃伊王',74,3750,-60,164,94,11800,1430),monster('巫妖',76,3550,-62,174,98,12900,1550),monster('鐵刀死神',78,4200,-65,188,103,14200,1700)],['騎士范德','惡魔','巫妖','鐵刀死神'])];
const STAGE_BOSS_INDEX={1:[1,4,10],2:[1,4,6,7,10,13],3:[6,7,10,12,13,14],4:[4,6,7,10,12,13,14,15]};
const STAGE_SET_IDS={1:['set0'],2:['set0','set4'],3:['set0','set4'],4:['set0','set4']};
const RATES={1:{gear:.042,weapon:.0025,set:.002},2:{gear:.048,weapon:.0035,set:.003},3:{gear:.054,weapon:.0048,set:.0042},4:{gear:.06,weapon:.006,set:.0055}};
const dreamWeapon=(id,name,type,small,large,classes,feature,extra={})=>({id,name,slot:'武器',type,small,large,hit:6,safe:6,price:1200000,rarity:'夢幻',tier:6,sourceType:'TREASURE_EXCLUSIVE',treasureStage:4,classes,feature,protected:true,...extra});
export const TREASURE_DREAM_WEAPONS=[
 dreamWeapon('treasure-doom-blade','末日刀','單手劍',26,30,['王族','騎士'],'高速連擊',{attackSpeed:.12,doubleStrike:.1}),
 dreamWeapon('treasure-dragon-slayer','屠龍劍','雙手劍',34,39,['騎士','龍騎士'],'Boss／龍族特化',{two:true,bossDamage:.18,dragonDamage:.12}),
 dreamWeapon('treasure-starfall-bow','星隕神弓','弓',27,31,['妖精'],'高速遠距離',{attackSpeed:.08,rangedDamage:5}),
 dreamWeapon('treasure-eternal-staff','永夜魔杖','法杖',23,25,['法師'],'MP／法術特化',{statBonuses:{int:4,wis:3},magic:7,mpRegen:4}),
 dreamWeapon('treasure-shadow-blades','影皇雙刀','雙刀',29,33,['黑暗妖精'],'爆發雙擊',{two:true,doubleStrike:.14}),
 dreamWeapon('treasure-abyss-claw','深淵鋼爪','鋼爪',31,35,['黑暗妖精'],'高單擊',{two:true,critical:.12}),
 dreamWeapon('treasure-azure-chain','蒼龍鎖鏈劍','鎖鏈劍',32,37,['龍騎士'],'Boss破甲',{two:true,bossDamage:.12,statBonuses:{str:3}}),
 dreamWeapon('treasure-phantasm-kiringku','幻界奇古獸','法杖',24,28,['幻術士'],'精神魔攻',{statBonuses:{int:3,wis:3},magic:6})
];
const dreamArmor=(id,name,slot,ac,classes,statBonuses,feature)=>({id,name,slot,ac,safe:4,price:750000,rarity:'夢幻',tier:6,sourceType:'TREASURE_EXCLUSIVE',treasureStage:4,classes,statBonuses,feature,treasureSet:'寶版夢幻套裝',protected:true});
export const TREASURE_DREAM_ARMOR=[
 dreamArmor('treasure-war-helm','末日戰盔','頭盔',-7,['王族','騎士','黑暗妖精','龍騎士'],{str:2,con:1},'近戰'),dreamArmor('treasure-moon-helm','星月冠冕','頭盔',-6,['妖精','法師','幻術士'],{dex:2,int:2},'遠距／魔法'),
 dreamArmor('treasure-war-armor','屠龍戰甲','盔甲',-13,['王族','騎士','黑暗妖精','龍騎士'],{str:2,con:2},'防禦'),dreamArmor('treasure-arcane-robe','永夜法袍','盔甲',-10,['妖精','法師','幻術士'],{int:3,wis:2},'魔法'),
 dreamArmor('treasure-shirt','夢境T恤','內衣',-4,null,{str:1,dex:1,int:1},'共用'),dreamArmor('treasure-cloak','星界斗篷','斗篷',-7,null,{wis:2,con:1},'回復'),dreamArmor('treasure-gloves','破軍手套','手套',-5,['王族','騎士','黑暗妖精','龍騎士'],{str:2},'近戰'),dreamArmor('treasure-boots','流星長靴','鞋子',-6,null,{dex:2},'機動'),
 dreamArmor('treasure-shield','永恆神盾','盾牌',-8,['王族','騎士','幻術士'],{con:2},'防禦'),dreamArmor('treasure-necklace','七曜項鍊','項鍊',-2,null,{str:1,dex:1,int:1},'全能'),dreamArmor('treasure-ring-a','夢幻之戒','戒指1',-2,null,{con:1,wis:1},'生存'),dreamArmor('treasure-ring-b','夢幻之戒','戒指2',-2,null,{con:1,wis:1},'生存')
];
export const TREASURE_EXCLUSIVE_GEAR=[...TREASURE_DREAM_WEAPONS,...TREASURE_DREAM_ARMOR];
export const treasureBosses=stage=>(STAGE_BOSS_INDEX[stage]||[]).map(i=>BOSS_CATALOG[i]).filter(Boolean);
export const treasureSets=stage=>BOSS_SETS.filter(s=>(STAGE_SET_IDS[stage]||[]).includes(s.id));
export function treasureEquipmentDrop(player,map,ordinaryPool,rng=Math.random){if(!map?.treasure)return null;let cfg=RATES[map.treasureStage],roll=rng(),bosses=treasureBosses(map.treasureStage);if(map.treasureStage===4&&roll<.00045){let pool=TREASURE_EXCLUSIVE_GEAR.filter(x=>!x.classes||x.classes.includes(player.cls));return pool[Math.floor(rng()*pool.length)]||null}if(roll<cfg.weapon){let pool=bosses.map(x=>x.item).filter(x=>x.slot==='武器'&&(!x.classes||x.classes.includes(player.cls)));return pool.length?pool[Math.floor(rng()*pool.length)]:null}if(roll<cfg.weapon+cfg.set){let pool=treasureSets(map.treasureStage).flatMap(x=>x.pieces).filter(x=>!x.classes||x.classes.includes(player.cls));return pool.length?pool[Math.floor(rng()*pool.length)]:null}if(roll<cfg.weapon+cfg.set+cfg.gear){let cap=[0,4,5,5,6][map.treasureStage],weighted=ordinaryPool.filter(x=>(x.__tier||0)<=cap),upper=weighted.filter(x=>(x.__tier||0)>=Math.max(2,cap-1)),pool=rng()<(.35+map.treasureStage*.1)&&upper.length?upper:weighted;return pool.length?pool[Math.floor(rng()*pool.length)]:null}return null}
export function treasureBossEquipmentDrop(player,map,rng=Math.random){if(!map?.treasure||map.treasureStage!==4||rng()>=.018)return null;let pool=TREASURE_EXCLUSIVE_GEAR.filter(x=>!x.classes||x.classes.includes(player.cls));return pool[Math.floor(rng()*pool.length)]||null}
export function treasureMaterialDrop(map,rng=Math.random){if(!map?.treasure)return null;let rates=[0,.0012,.0018,.0025,.0032],bosses=treasureBosses(map.treasureStage);if(rng()>=rates[map.treasureStage]||!bosses.length)return null;return bosses[Math.floor(rng()*bosses.length)].material}
export function treasureEnemy(map,rng=Math.random){let isBoss=rng()<.018;if(!isBoss){let base=map.normals[Math.floor(rng()*map.normals.length)];return{...base,id:`treasure-${map.treasureStage}-${base.name}`,maxHp:base.hp,hp:base.hp}}let entry=treasureBosses(map.treasureStage)[Math.floor(rng()*treasureBosses(map.treasureStage).length)],stage=map.treasureStage,hp=Math.floor(9000*Math.pow(2.05,stage-1));return{name:entry.name,id:`treasure-boss-${entry.id}`,level:52+stage*7,hp,maxHp:hp,ac:-38-stage*7,atk:92+stage*34,hit:62+stage*10,exp:18000*stage,gold:2400*stage,size:'Large',boss:true,treasureBoss:true,material:entry.material,materialChance:.15,bossEntry:entry}}
export const TREASURE_EXCLUDED_NAMES=['安塔瑞斯之心','巴拉卡斯之心','法利昂之心','林德拜爾之心','安塔瑞斯的力量','巴拉卡斯的力量','法利昂的力量','林德拜爾的力量','防爆武器強化卷軸','防爆防具強化卷軸'];
