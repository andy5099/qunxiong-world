export const SAVE_KEY = 'astralWorldIdleV1';
export const SAVE_VERSION = 6;

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

const ability = (id, label, effect, value) => ({ id, label, effect, value });
const identity = (names, role, visualTheme, abilities) => ({ names, role, visualTheme, abilities });

// Every source kind owns its identity. IDs and fragment keys remain pet_<sourceKind>.
const PET_EVOLUTION_IDENTITIES = {
  slime: identity(['星芽史萊姆','晶核史萊姆','皇家史萊姆','星界史萊姆','星界史萊姆王'],'快速協同／泛用','crystalSlime',[ability('slime_haste','晶核律動','haste',.10),ability('slime_splash','晶液濺射','power',.18),ability('slime_split','分裂衝擊','extraHit',.32),ability('slime_astral','星界凝膠','bossDamage',.25)]),
  rabbit: identity(['月耳兔','星耳獵兔','月影躍兔','虹月兔王','星月神兔'],'高暴擊','moonRabbit',[ability('rabbit_crit','月耳直覺','crit',.10),ability('rabbit_dash','月躍追擊','extraHit',.25),ability('rabbit_lucky','幸運飛踢','power',.16),ability('rabbit_comet','月隕踢擊','bossDamage',.24)]),
  beetle: identity(['微光甲蟲','晶甲甲蟲','棘盾甲蟲','星殼衛士','天穹甲皇'],'護盾／防禦','thornBeetle',[ability('beetle_guard','甲殼護幕','shield',.045),ability('beetle_ram','棘刺衝撞','power',.15),ability('beetle_shell','星殼反擊','extraHit',.22),ability('beetle_bastion','甲皇守望','bossDamage',.20)]),
  wolf: identity(['幽影幼狼','森林狼','白月獵狼','月痕狼王','星界神狼'],'連擊','forestWolf',[ability('wolf_chase','獵群追擊','extraHit',.25),ability('wolf_crit','月牙撕咬','crit',.08),ability('wolf_rend','裂傷連爪','power',.18),ability('wolf_soul','狼魂咆哮','bossDamage',.27)]),
  flower: identity(['藍晶花妖','花冠靈','月藤花靈','聖花守望者','星庭花神'],'治療／護盾','crystalBloom',[ability('flower_guard','花瓣護盾','shield',.05),ability('flower_pulse','花粉脈衝','power',.14),ability('flower_vine','藤蔓追擊','extraHit',.22),ability('flower_bloom','星庭綻放','bossDamage',.22)]),
  spirit: identity(['森林小魔靈','符葉精靈','秘語靈使','星環法靈','森羅星靈'],'魔法追擊','runeSpirit',[ability('spirit_haste','靈光加速','haste',.10),ability('spirit_arc','秘法追擊','extraHit',.27),ability('spirit_power','星術增幅','power',.18),ability('spirit_nova','靈界爆發','bossDamage',.25)]),
  lizard: identity(['火岩蜥蜴','赤脊蜥獸','熔甲獵蜥','炎脈巨蜥','星熔龍蜥'],'破防','magmaLizard',[ability('lizard_rend','碎甲咬擊','power',.16),ability('lizard_haste','灼地疾行','haste',.08),ability('lizard_chase','尾擊追襲','extraHit',.24),ability('lizard_break','熔核破陣','bossDamage',.26)]),
  lava: identity(['熔岩魔','炎核魔靈','灼燄術士','熔爆領主','焚星魔神'],'燃燒持續傷害','emberFiend',[ability('lava_burn','熔火灼燒','power',.15),ability('lava_orb','火球連發','extraHit',.26),ability('lava_blast','熔爆術','power',.20),ability('lava_inferno','焚星烈焰','bossDamage',.30)]),
  hawk: identity(['赤焰鷹','燄羽迅鷹','流火獵鷹','日耀鷹王','星焰神鷹'],'高速攻擊','solarHawk',[ability('hawk_haste','疾風振翼','haste',.13),ability('hawk_dive','流火俯衝','extraHit',.25),ability('hawk_power','日耀爪擊','power',.17),ability('hawk_comet','星焰墜擊','bossDamage',.25)]),
  ice: identity(['冰晶史萊姆','霜核史萊姆','寒晶王冠','極冰星膠','永霜史萊姆王'],'冰晶增傷','frostSlime',[ability('ice_haste','冰晶律動','haste',.09),ability('ice_power','寒霜碎裂','power',.18),ability('ice_split','霜棱追擊','extraHit',.26),ability('ice_boss','極冰星爆','bossDamage',.24)]),
  snowwolf: identity(['雪原狼','霜牙獵狼','冰月白狼','永冬狼王','星霜神狼'],'暴擊加冰霜追擊','frostWolf',[ability('snowwolf_crit','霜牙暴擊','crit',.10),ability('snowwolf_chase','冰月追擊','extraHit',.30),ability('snowwolf_power','寒痕撕裂','power',.17),ability('snowwolf_boss','永冬獵殺','bossDamage',.27)]),
  golem: identity(['寒霜魔像','冰岩守衛','霜晶堡壘','極地巨像','永凍泰坦'],'高護盾','frostGolem',[ability('golem_guard','冰岩護壁','shield',.06),ability('golem_power','重拳震擊','power',.16),ability('golem_haste','符文驅動','haste',.08),ability('golem_boss','泰坦重壓','bossDamage',.24)]),
  ruin: identity(['遺跡守衛','符文衛兵','古代光衛','星殿裁決者','遺跡終端'],'防禦與光束','ruinSentinel',[ability('ruin_guard','遺跡護壁','shield',.05),ability('ruin_beam','符文光束','power',.17),ability('ruin_arc','裁決追擊','extraHit',.23),ability('ruin_boss','古代裁決','bossDamage',.28)]),
  orb: identity(['星核浮游體','星環浮游體','重力星核','虛空星體','天體奇點'],'範圍／額外命中','astralOrb',[ability('orb_haste','軌道加速','haste',.10),ability('orb_nova','星環爆裂','extraHit',.28),ability('orb_power','重力脈衝','power',.18),ability('orb_boss','奇點壓縮','bossDamage',.26)]),
  mech: identity(['失控機甲','超頻機甲','星核戰機','虛空機神','終焉戰術核心'],'超頻連擊','astralMech',[ability('mech_guard','能量隔板','shield',.04),ability('mech_haste','超頻連射','haste',.13),ability('mech_combo','導彈追擊','extraHit',.30),ability('mech_boss','終焉光束','bossDamage',.30)]),
  horn: identity(['王冠幼獸','王冠巨獸','王獸皇','星冠霸主','星界獸神'],'Boss 對抗與重擊','crownBeast',[ability('horn_guard','王冠護壁','shield',.06),ability('horn_smash','冠冕重擊','power',.20),ability('horn_roar','王獸追擊','extraHit',.35),ability('horn_reign','星冠威壓','bossDamage',.35)]),
  guardian: identity(['樹王幼靈','古木守衛','世界樹使','森羅聖王','永恆世界樹'],'護盾與恢復','worldTree',[ability('guardian_guard','世界樹護盾','shield',.07),ability('guardian_haste','根鬚律動','haste',.08),ability('guardian_vine','聖藤追擊','extraHit',.22),ability('guardian_boss','森羅庇護','bossDamage',.22)]),
  dragon: identity(['熔岩幼龍','炎脈飛龍','煉獄龍王','焚天魔龍','星火滅世龍'],'燃燒與爆發','infernoDragon',[ability('dragon_burn','炎脈灼燒','power',.19),ability('dragon_blast','龍息爆發','extraHit',.28),ability('dragon_power','煉獄增幅','power',.20),ability('dragon_boss','滅世吐息','bossDamage',.34)]),
  queen: identity(['冰霜精靈','寒晶女巫','極冰女王','永冬聖后','星霜女神'],'冰霜控制','frostQueen',[ability('queen_haste','寒晶咒印','haste',.09),ability('queen_crit','冰冠暴擊','crit',.08),ability('queen_arc','霜環追擊','extraHit',.26),ability('queen_boss','永冬裁決','bossDamage',.28)]),
  destroyer: identity(['星界無人機','遺跡戰機','星核機神','虛空審判者','星界毀滅神'],'Boss 傷害與光束','voidDestroyer',[ability('destroyer_guard','虛空屏障','shield',.05),ability('destroyer_beam','審判光束','power',.20),ability('destroyer_overclock','毀滅追擊','extraHit',.32),ability('destroyer_boss','星界毀滅','bossDamage',.36)]),
};

export const PET_EVOLUTION_DATA = Object.fromEntries(Object.entries(PET_EVOLUTION_IDENTITIES).map(([kind, definition]) => [kind, {
  role:definition.role,
  visualTheme:definition.visualTheme,
  stages: definition.names.map((name, rank) => ({
    rank, name, appearance:`${kind}-e${rank}`,
    glow:['#76e8ff','#8fffb3','#ffd977','#bc9aff','#ff8ee3'][rank],
    ability: rank ? definition.abilities[rank - 1] : null,
  })),
}]));
