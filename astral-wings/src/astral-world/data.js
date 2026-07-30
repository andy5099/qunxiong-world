export const SAVE_KEY = 'astralWorldIdleV1';
export const SAVE_VERSION = 5;

export const BALANCE = {
  attackInterval: 1.2,
  inventoryCap: 100,
  quality: [
    { id: 'common', label: '普通', color: '#d7e0ef', weight: 53, power: 1 },
    { id: 'uncommon', label: '優良', color: '#69dd99', weight: 25, power: 1.22 },
    { id: 'rare', label: '稀有', color: '#70bfff', weight: 14, power: 1.55 },
    { id: 'epic', label: '史詩', color: '#ca8cff', weight: 6, power: 2.05 },
    { id: 'legendary', label: '傳說', color: '#ffce69', weight: 1.7, power: 2.85 },
    { id: 'mythic', label: '神話', color: '#ff778d', weight: .25, power: 4.1 },
    { id: 'astral', label: '星界', color: '#79f1ff', weight: .05, power: 5.8 },
  ],
};

const mob = (name, kind, level, hp, attack, exp, gold, capturable = true) => [name, kind, level, hp, attack, exp, gold, capturable];
export const MAPS = [
  { id: 1, name: '星光草原', description: '被星塵覆蓋的平靜草海。', colors: ['#172758', '#392261', '#799bff'], mobs: [mob('星芽史萊姆','slime',1,90,8,12,6),mob('月耳兔','rabbit',2,110,10,14,8),mob('微光甲蟲','beetle',3,135,12,16,10)], boss: mob('草原巨角王','horn',5,980,22,120,100) },
  { id: 2, name: '幽藍森林', description: '蒼藍古木在迷霧中低語。', colors: ['#103447', '#173e65', '#53bbcf'], mobs: [mob('幽影狼','wolf',6,290,22,27,22),mob('藍晶花妖','flower',7,330,26,31,25),mob('森林小魔靈','spirit',8,375,30,35,29)], boss: mob('森林守護獸','guardian',10,2500,48,260,260) },
  { id: 3, name: '灼熱峽谷', description: '熔流穿過破碎的紅岩裂谷。', colors: ['#4a1b31', '#7a3028', '#ff8d61'], mobs: [mob('火岩蜥蜴','lizard',12,760,55,62,56),mob('熔岩魔','lava',13,850,62,69,62),mob('赤焰鷹','hawk',14,940,69,76,68)], boss: mob('炎獄巨龍','dragon',16,6200,108,590,640) },
  { id: 4, name: '冰晶高原', description: '極光照亮永不融化的高原。', colors: ['#122c52', '#2c6282', '#8eeaff'], mobs: [mob('冰晶史萊姆','ice',18,1750,118,125,130),mob('雪原狼','snowwolf',19,1940,128,136,140),mob('寒霜魔像','golem',20,2160,139,147,150,false)], boss: mob('冰霜女王','queen',22,14200,205,1200,1420) },
  { id: 5, name: '星界遺跡', description: '失控古代機甲守護著遺跡核心。', colors: ['#211744', '#35266c', '#d88cff'], mobs: [mob('遺跡守衛','ruin',24,3700,210,210,230,false),mob('星核浮游體','orb',25,4100,228,228,248),mob('失控機甲','mech',26,4550,247,245,268,false)], boss: mob('星界毀滅者','destroyer',28,29800,365,2100,3150) },
];
export const PET_SOURCE_KINDS = Object.fromEntries(MAPS.flatMap(map => [...map.mobs, map.boss].map(([name, kind]) => [name, kind])));

export const SKILLS = [
  { id:'slash', name:'星刃斬', cooldown:4, power:1.6, perLevel:.08, description:'對單一敵人造成高額斬擊。' },
  { id:'meteor', name:'流星連擊', cooldown:7, power:.75, perLevel:.04, description:'以三段殘影連續斬擊敵人。' },
  { id:'shield', name:'星光護盾', cooldown:12, power:.2, perLevel:.015, description:'獲得最大生命比例的暫時護盾。' },
  { id:'burst', name:'星爆終結', cooldown:18, power:3.5, perLevel:.16, description:'對殘血敵人造成額外傷害的星爆。' },
];

export const SLOTS = { weapon:{label:'武器'}, helmet:{label:'頭盔'}, armor:{label:'鎧甲'}, gloves:{label:'手套'}, boots:{label:'鞋子'}, necklace:{label:'項鍊'}, ring:{label:'戒指'}, wings:{label:'翅膀'} };
export const QUALITY = Object.fromEntries(BALANCE.quality.map(entry => [entry.id, entry]));
export const AFFIXES = [
  {id:'attackPercent',label:'攻擊力',key:'attack',mode:'percent',min:.03,max:.12}, {id:'defensePercent',label:'防禦力',key:'defense',mode:'percent',min:.04,max:.14}, {id:'hpPercent',label:'最大生命',key:'maxHp',mode:'percent',min:.04,max:.16},
  {id:'crit',label:'暴擊率',key:'crit',mode:'flat',min:.01,max:.04}, {id:'critDamage',label:'暴擊傷害',key:'critDamage',mode:'flat',min:.04,max:.15}, {id:'attackSpeed',label:'攻擊速度',key:'attackSpeed',mode:'flat',min:-.08,max:-.02},
  {id:'skillDamage',label:'技能傷害',key:'skillDamage',mode:'flat',min:.03,max:.12}, {id:'bossDamage',label:'Boss 傷害',key:'bossDamage',mode:'flat',min:.03,max:.12}, {id:'expBonus',label:'經驗獲得',key:'expBonus',mode:'flat',min:.03,max:.12}, {id:'goldBonus',label:'金幣獲得',key:'goldBonus',mode:'flat',min:.03,max:.12}, {id:'petDamage',label:'寵物傷害',key:'petDamage',mode:'flat',min:.04,max:.14}, {id:'regen',label:'生命恢復',key:'regen',mode:'flat',min:1,max:6},
];

export const MONSTER_VISUALS = {
  slime:{visualType:'slime',species:'slime',palette:'meadow',bodyScale:1,accentColor:'#a7eeff',attackStyle:'bounce',eliteVariant:'crystal'}, rabbit:{visualType:'rabbit',species:'beast',palette:'moon',bodyScale:1,accentColor:'#f5d4ff',attackStyle:'leap',eliteVariant:'horned'}, beetle:{visualType:'beetle',species:'beast',palette:'sprout',bodyScale:1,accentColor:'#d9f5a8',attackStyle:'melee',eliteVariant:'thorn'},
  wolf:{visualType:'wolf',species:'beast',palette:'forest',bodyScale:1,accentColor:'#79ffd5',attackStyle:'leap',eliteVariant:'fang'}, flower:{visualType:'bloom',species:'plant',palette:'crystal',bodyScale:1,accentColor:'#8df08c',attackStyle:'ranged',eliteVariant:'thorn'}, spirit:{visualType:'spirit',species:'plant',palette:'mist',bodyScale:.92,accentColor:'#96eaff',attackStyle:'ranged',eliteVariant:'rune'},
  lizard:{visualType:'lizard',species:'beast',palette:'lava',bodyScale:1,accentColor:'#ff9a5b',attackStyle:'melee',eliteVariant:'magma'}, lava:{visualType:'fiend',species:'fiend',palette:'ember',bodyScale:1,accentColor:'#ffce68',attackStyle:'ranged',eliteVariant:'flame'}, hawk:{visualType:'hawk',species:'flying',palette:'ember',bodyScale:.94,accentColor:'#ffc36a',attackStyle:'dive',eliteVariant:'solar'},
  ice:{visualType:'iceSlime',species:'slime',palette:'frost',bodyScale:1,accentColor:'#bff7ff',attackStyle:'bounce',eliteVariant:'prism'}, snowwolf:{visualType:'frostWolf',species:'beast',palette:'frost',bodyScale:1,accentColor:'#a6ecff',attackStyle:'leap',eliteVariant:'crystal'}, golem:{visualType:'golem',species:'construct',palette:'frost',bodyScale:1.12,accentColor:'#d5fbff',attackStyle:'melee',eliteVariant:'ancient'},
  ruin:{visualType:'sentinel',species:'construct',palette:'ruin',bodyScale:1,accentColor:'#b996ff',attackStyle:'melee',eliteVariant:'warded'}, orb:{visualType:'floater',species:'flying',palette:'astral',bodyScale:1,accentColor:'#e2afff',attackStyle:'ranged',eliteVariant:'nova'}, mech:{visualType:'mech',species:'construct',palette:'astral',bodyScale:1.08,accentColor:'#fb9dff',attackStyle:'beam',eliteVariant:'overclock'},
  horn:{visualType:'crownBeast',bodyScale:1.85,accentColor:'#ffd878',attackStyle:'charge'}, guardian:{visualType:'ancientTree',bodyScale:1.85,accentColor:'#8bffbd',attackStyle:'root'}, dragon:{visualType:'coreTyrant',bodyScale:1.9,accentColor:'#ff835c',attackStyle:'fire'}, queen:{visualType:'frostWarden',bodyScale:1.9,accentColor:'#aaf3ff',attackStyle:'ice'}, destroyer:{visualType:'astralJudge',bodyScale:1.95,accentColor:'#ed91ff',attackStyle:'beam'},
};

// Pet visuals remain static data: combat captures only store the source kind and these fields
// are also re-applied to older saves during load.
export const PET_VISUALS = {
  slime:{visualType:'slimePet',species:'slime',palette:'meadow'}, rabbit:{visualType:'rabbitPet',species:'beast',palette:'moon'}, beetle:{visualType:'beetlePet',species:'beast',palette:'sprout'},
  wolf:{visualType:'wolfPet',species:'beast',palette:'forest'}, flower:{visualType:'bloomPet',species:'plant',palette:'crystal'}, spirit:{visualType:'spiritPet',species:'spirit',palette:'mist'},
  lizard:{visualType:'lizardPet',species:'beast',palette:'lava'}, lava:{visualType:'fiendPet',species:'fiend',palette:'ember'}, hawk:{visualType:'hawkPet',species:'flying',palette:'ember'},
  ice:{visualType:'iceSlimePet',species:'slime',palette:'frost'}, snowwolf:{visualType:'frostWolfPet',species:'beast',palette:'frost'}, golem:{visualType:'golemPet',species:'construct',palette:'frost'},
  ruin:{visualType:'sentinelPet',species:'construct',palette:'ruin'}, orb:{visualType:'orbPet',species:'flying',palette:'astral'}, mech:{visualType:'astralDrone',species:'construct',palette:'astral'},
  horn:{visualType:'crownCub',species:'bossBeast',palette:'crown'}, guardian:{visualType:'treeSprite',species:'bossPlant',palette:'grove'}, dragon:{visualType:'lavaWhelp',species:'bossDragon',palette:'magma'},
  queen:{visualType:'frostSprite',species:'bossSpirit',palette:'frost'}, destroyer:{visualType:'astralDrone',species:'bossConstruct',palette:'astral'},
};

export const PET_STAR_BALANCE = {
  maxStars: 6,
  starStep: .18,
  costs: { 1: 10, 2: 20, 3: 35, 4: 55, 5: 80 },
  duplicateFragments: { normal: 5, elite: 8, boss: 15 },
};

export const PET_EVOLUTION_COST = {
  0: { level:30, fragments:50, gold:50000, core:1 },
  1: { level:50, fragments:100, gold:150000, core:2 },
  2: { level:70, fragments:180, gold:400000, core:3 },
  3: { level:90, fragments:300, gold:1000000, core:5 },
};

const evolutionFamilies = {
  slime: { names:['星芽史萊姆','晶核史萊姆','皇家史萊姆','星界史萊姆','星界史萊姆王'], abilities:[['gel_haste','晶核律動','haste',.10],['gel_splash','晶液濺射','power',.18],['gel_split','分裂衝擊','extraHit',.32],['gel_astral','星界凝膠','bossDamage',.25]] },
  beast: { names:['幼獸','森林獵獸','月影巨獸','星痕獸王','神域獸皇'], abilities:[['beast_crit','獵手本能','crit',.08],['beast_chase','追獵','extraHit',.28],['beast_rend','裂傷利爪','power',.18],['beast_soul','獸魂咆哮','bossDamage',.28]] },
  plant: { names:['嫩芽靈','花冠精靈','古樹守衛','星藤靈王','森羅之心'], abilities:[['plant_guard','綠蔭護體','shield',.035],['plant_spore','孢子爆發','power',.16],['plant_vine','藤蔓追擊','extraHit',.25],['plant_root','星根束縛','bossDamage',.24]] },
  fiend: { names:['火苗魔靈','熾翼魔靈','炎核惡魔','鳳焰領主','焚星魔王'], abilities:[['fiend_burn','灼熱脈動','power',.14],['fiend_fireball','火球連發','extraHit',.26],['fiend_blast','熔爆','power',.20],['fiend_phoenix','鳳凰烈焰','bossDamage',.30]] },
  construct: { names:['機械核心','符文機偶','水晶重裝','星界機神','永恆審判機'], abilities:[['construct_guard','能量屏障','shield',.05],['construct_beam','聚焦光束','power',.16],['construct_overclock','超頻連擊','haste',.12],['construct_judge','審判協定','bossDamage',.30]] },
  flying: { names:['浮游幼體','流光翼獸','星羽領航者','虛空翼王','天穹神翼'], abilities:[['flying_haste','疾風振翼','haste',.12],['flying_dive','俯衝追擊','extraHit',.27],['flying_nova','星羽爆發','power',.18],['flying_comet','彗星俯衝','bossDamage',.27]] },
  boss: { names:['王冠幼獸','王冠巨獸','王獸皇','星冠霸主','星界獸神'], abilities:[['boss_guard','王者護壁','shield',.06],['boss_smash','冠冕重擊','power',.20],['boss_roar','皇者追擊','extraHit',.35],['boss_reign','星冠威壓','bossDamage',.35]] },
};

const petFamilyFor = kind => {
  if (['horn','guardian','dragon','queen','destroyer'].includes(kind)) return 'boss';
  const species = PET_VISUALS[kind]?.species;
  if (species === 'slime') return 'slime';
  if (species === 'construct') return 'construct';
  if (species === 'plant' || species === 'spirit') return 'plant';
  if (species === 'fiend' || kind === 'lava') return 'fiend';
  if (species === 'flying') return 'flying';
  return 'beast';
};

export const PET_EVOLUTION_DATA = Object.fromEntries(Object.keys(PET_VISUALS).map(kind => {
  const family = petFamilyFor(kind); const definition = evolutionFamilies[family];
  return [kind, {
    family,
    stages: definition.names.map((name, rank) => ({
      rank, name, appearance:`${kind}-e${rank}`,
      glow:['#76e8ff','#8fffb3','#ffd977','#bc9aff','#ff8ee3'][rank],
      ability: rank ? { id:definition.abilities[rank - 1][0], label:definition.abilities[rank - 1][1], effect:definition.abilities[rank - 1][2], value:definition.abilities[rank - 1][3] } : null,
    })),
  }];
}));
