const TIER_BY_NAME={
 短劍:1,銀劍:1,'獵人之弓':1,'橡木魔法杖':1,'皮頭盔':1,'皮盔甲':1,'T恤':1,'腕甲':1,'精靈盾牌':1,'短統靴':1,'骷髏項鍊':1,
 '大馬士革刀':2,'武士刀':2,'銀長劍':2,'雙手劍':2,'十字弓':2,'瑪那魔杖':2,'黑暗雙刀':2,'黑暗鋼爪':2,'消滅者鎖鏈劍':2,'鋼鐵頭盔':2,'鋼鐵盔甲':2,'長靴':2,'守護戒指':2,
 '精靈弓':3,'尤米弓':3,'力量魔法杖':3,'幽暗雙刀':3,'幽暗鋼爪':3,'酷寒鎖鏈劍':3,'魔法頭盔':3,'精靈鏈甲':3,'保護者斗篷':3,'武官頭盔':3,'武官長靴':3,'敏捷長靴':3,'力量項鍊':3,'魅力項鍊':3,'象牙塔長袍':3,'曼波帽':2,
 '瑟魯基之劍':4,'巨劍':4,'武官雙手劍':4,'幽暗十字弓':4,'鋼鐵瑪那魔杖':4,'水晶魔杖':4,'抗魔法頭盔':4,'抗魔法鏈甲':4,'瑪那斗篷':4,'黑暗長靴':4,
 '騎士范德之劍':5,'沙哈之弓':5,'熾炎天使弓':5,'巴風特魔杖':5,'冰之女王魔杖':5,'暗黑雙刀':5,'破壞鋼爪':5,'極寒鎖鏈劍':5,'共鳴奇古獸':5,'古代之劍':5,'古代巨劍':5,'古代頭盔':5,'古代鱗甲':5,'巨蟻女皇的銀翅膀':5,'黑長者涼鞋':5,'曼波兔長靴':5,'召喚控制戒指':5
};
export const maxEquipmentTier=mapTier=>mapTier<=2?1:mapTier<=4?2:mapTier<=7?3:mapTier<=10?4:5;
export const equipmentTier=item=>item?.dragon||item?.tier===7?7:item?.boss||item?.bossSet?6:TIER_BY_NAME[item?.name]||null;
export const eligibleForMap=(item,map)=>{let tier=equipmentTier(item);return tier!==null&&tier<=maxEquipmentTier(map.tier)&&!item?.boss&&!item?.source?.boss};
export const EQUIPMENT_AUDIT={confirmed:Object.keys(TIER_BY_NAME),rename:[],remove:[],needsVerification:['身體腰帶','智力T恤','賢者戒指']};
