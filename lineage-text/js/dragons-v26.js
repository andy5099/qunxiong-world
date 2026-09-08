const ARMOR_CLASSES=['王族','騎士','妖精','法師','黑暗妖精','龍騎士','幻術士'];
const dragon=(id,name,title,element,hp,atk,hit,ac,armorPierce,attackInterval)=>{
 const material=`${name}之心`,item={id:`dragon-armor-${id}`,name:`${name}的力量`,slot:'盔甲',ac:-12,safe:4,weight:85,price:2400000,rarity:'傳說',protected:true,dragon:true,tier:7,classes:ARMOR_CLASSES,source:{mapId:id,boss:name,rarity:'四大龍專屬'}};
 return{id,name:`${title}專屬地圖`,tier:19,fee:0,danger:5,dragon:true,directBoss:true,focus:`危險度：★★★★★・進入後直接挑戰${title}`,boss:name,mini:null,normals:[],dragonBoss:{id:`dragon-${id}`,name,title,element,level:90,hp,maxHp:hp,atk,hit,ac,exp:2500000,gold:1800000,size:'Large',boss:true,dragon:true,material,materialChance:1,armorPierce,attackInterval,bossEntry:{name,material,item}}};
};
export const DRAGON_MAPS=[
 dragon(52,'安塔瑞斯','地龍・安塔瑞斯','地',7200000,420,102,-78,.18,1.65),
 dragon(53,'巴拉卡斯','火龍・巴拉卡斯','火',6800000,475,108,-82,.24,1.45),
 dragon(54,'法利昂','水龍・法利昂','水',7600000,440,105,-84,.20,1.55),
 dragon(55,'林德拜爾','風龍・林德拜爾','風',6400000,455,112,-88,.22,1.30)
];
export const isDragonMap=id=>DRAGON_MAPS.some(x=>x.id===id);
export const dragonEnemy=map=>({...map.dragonBoss,hp:map.dragonBoss.maxHp});
export const DRAGON_T7_EQUIPMENT=DRAGON_MAPS.map(x=>x.dragonBoss.bossEntry.item);
