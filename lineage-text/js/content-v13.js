import{HUNTING_MAPS,BOSS_CATALOG}from'./systems.js?v=27';

const gear=(id,name,slot,ac,statBonuses,source,rarity='稀有',extra={})=>({id,name,slot,ac,safe:slot==='戒指1'||slot==='項鍊'?0:4,price:80000,rarity,statBonuses,source,protected:true,...extra});
export const CLASSIC_STAT_GEAR=[
 gear('str-amulet','力量項鍊','項鍊',0,{str:1},{mapId:5,monster:'黑騎士',rarity:'稀有'}),
 gear('dex-boots-classic','敏捷長靴','鞋子',-2,{dex:1},{mapId:6,monster:'精靈弓手',rarity:'稀有'}),
 gear('con-belt','身體腰帶','斗篷',-1,{con:1},{mapId:8,monster:'熔岩高崙',rarity:'稀有'}),
 gear('int-shirt','智力T恤','內衣',-1,{int:1},{mapId:7,monster:'冰原妖魔',rarity:'稀有'}),
 gear('wis-amulet','精神項鍊','項鍊',0,{wis:1},{mapId:9,monster:'黑長者',rarity:'稀有'}),
 gear('cha-amulet','魅力項鍊','項鍊',0,{cha:1},{mapId:4,boss:'克特',rarity:'極稀有'}),
 gear('summon-ring','召喚控制戒指','戒指1',0,{cha:2},{mapId:12,boss:'騎士范德',rarity:'極稀有'},{summonControl:true})
];

export const itemSource=item=>{let s=item?.source;if(!s)return null;let m=HUNTING_MAPS.find(x=>x.id===s.mapId);return{map:m?.name||'未知地圖',floor:m?.floor||null,monster:s.monster||null,boss:s.boss||null,rarity:s.rarity||item.rarity||'稀有'}};
export const statText=item=>Object.entries(item?.statBonuses||{}).filter(([,v])=>v).map(([k,v])=>`${k.toUpperCase()} ${v>0?'+':''}${v}`).join('・');

export const PET_STONES={normal:'寵物進化石',advanced:'高級寵物進化石'};
export const PET_STONE_RATE=tier=>({normal:tier<3?.0025:tier<8?.0045:.003,advanced:tier<4?0:tier<9?.0012:.0025});

export const BOSS_PET_FORMS=[
 {id:'death-knight',name:'死亡騎士',material:'死亡騎士之魂',boss:'死亡騎士',role:'近戰／攻速',mult:1.9,speed:1.28,attack:1.15},
 {id:'baphomet',name:'巴風特',material:'巴風特之角',boss:'巴風特',role:'魔法攻擊',mult:1.78,magic:1.3},
 {id:'black-elder',name:'黑長者',material:'黑長者魔力核',boss:'黑長者',role:'魔法／MP支援',mult:1.72,mpSupport:1.25},
 {id:'ice-queen',name:'冰之女王',material:'冰之女王淚',boss:'冰之女王',role:'魔法／緩速',mult:1.82,slow:.12}
].map(x=>({...x,source:BOSS_CATALOG.find(b=>b.name===x.boss)}));

export const bossMaterialChance=tier=>tier<4?.12:tier<9?.08:.05;
