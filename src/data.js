export const SAVE_VERSION = 16;

export const DUNGEON = {
  id: 'bloodCavern', name: '血色洞窟', floors: 4, danger: 4, recommendedPower: 7500,
  baseChance: 0.06, pityStart: 20,
  bossRarityChances: [0.20, 0.25, 0.25, 0.20, 0.10]
};

export const YELLOW_DUNGEON = {
  id: 'yellowTomb', name: '黃巾古墓', floors: 4, danger: 5, recommendedPower: 15000,
  baseChance: 0.065, pityStart: 18,
  bossRarityChances: [0.14, 0.22, 0.28, 0.23, 0.13]
};

export const ITEMS = {
  woodenSword: { id: 'woodenSword', name: '木劍', type: 'equipment', slot: 'weapon', quality: '普通', price: 60, sell: 18, stats: { might: 3 }, description: '武力 +3', shop: true },
  ironSword: { id: 'ironSword', name: '鐵劍', type: 'equipment', slot: 'weapon', quality: '普通', price: 130, sell: 38, stats: { might: 6 }, description: '武力 +6', shop: true },
  banditDagger: { id: 'banditDagger', name: '山賊短刀', type: 'equipment', slot: 'weapon', quality: '稀有', sell: 95, stats: { might: 7, speed: 1 }, description: '武力 +7・速度 +1' },
  woodBow: { id: 'woodBow', name: '木弓', type: 'equipment', slot: 'weapon', quality: '普通', sell: 34, stats: { might: 5, speed: 1 }, description: '武力 +5・速度 +1' },
  greenEdgeSword: { id: 'greenEdgeSword', name: '青鋒劍', type: 'equipment', slot: 'weapon', quality: '史詩', sell: 260, stats: { might: 10, speed: 2 }, description: '武力 +10・速度 +2' },
  clothArmor: { id: 'clothArmor', name: '布衣', type: 'equipment', slot: 'armor', quality: '普通', price: 55, sell: 16, stats: { defense: 2 }, description: '防禦 +2', shop: true },
  leatherArmor: { id: 'leatherArmor', name: '皮甲', type: 'equipment', slot: 'armor', quality: '普通', price: 125, sell: 36, stats: { defense: 4, maxHp: 10 }, description: '防禦 +4・最大兵力 +10', shop: true },
  wolfBracers: { id: 'wolfBracers', name: '狼皮護腕', type: 'equipment', slot: 'armor', quality: '稀有', sell: 88, stats: { defense: 2, speed: 1 }, description: '防禦 +2・速度 +1' },
  clothShoes: { id: 'clothShoes', name: '布鞋', type: 'equipment', slot: 'armor', quality: '普通', sell: 28, stats: { defense: 1, speed: 2 }, description: '防禦 +1・速度 +2' },
  ironArmor: { id: 'ironArmor', name: '鐵甲', type: 'equipment', slot: 'armor', quality: '稀有', sell: 110, stats: { defense: 7, maxHp: 18 }, description: '防禦 +7・最大兵力 +18' },
  woodRing: { id: 'woodRing', name: '木戒', type: 'equipment', slot: 'accessory', quality: '普通', sell: 24, stats: { maxHp: 8 }, description: '最大兵力 +8' },
  copperRing: { id: 'copperRing', name: '銅戒', type: 'equipment', slot: 'accessory', quality: '稀有', sell: 75, stats: { might: 2, maxHp: 12 }, description: '武力 +2・最大兵力 +12' },
  blackwindBlade: { id: 'blackwindBlade', name: '黑風刀', type: 'equipment', slot: 'weapon', quality: '稀有', bossOnly: true, sell: 320, stats: { might: 13, speed: 2 }, description: '武力 +13・速度 +2' },
  blackwindArmor: { id: 'blackwindArmor', name: '黑風甲', type: 'equipment', slot: 'armor', quality: '稀有', bossOnly: true, sell: 300, stats: { defense: 10, maxHp: 28 }, description: '防禦 +10・最大兵力 +28' },
  blackwindCharm: { id: 'blackwindCharm', name: '黑風護符', type: 'equipment', slot: 'accessory', quality: '稀有', bossOnly: true, sell: 280, stats: { might: 4, defense: 3, speed: 2 }, description: '武力 +4・防禦 +3・速度 +2' },
  overlordBlade: { id: 'overlordBlade', name: '寨主霸王刀', type: 'equipment', slot: 'weapon', quality: '史詩', bossOnly: true, sell: 620, stats: { might: 18, speed: 4 }, description: '武力 +18・速度 +4' },
  blackwindWarArmor: { id: 'blackwindWarArmor', name: '黑風戰甲', type: 'equipment', slot: 'armor', quality: '史詩', bossOnly: true, sell: 580, stats: { defense: 15, maxHp: 48 }, description: '防禦 +15・最大兵力 +48' },
  leaderToken: { id: 'leaderToken', name: '寨主令牌', type: 'equipment', slot: 'accessory', quality: '史詩', bossOnly: true, sell: 560, stats: { might: 7, defense: 7, speed: 4 }, description: '武力 +7・防禦 +7・速度 +4' },
  demonOverlordBlade: { id: 'demonOverlordBlade', name: '寨主霸王刀・鬼神', type: 'equipment', slot: 'weapon', quality: '傳說', bossOnly: true, bossGearFamily: 'blackwind', evolutionTier: 3, sell: 1180, stats: { might: 27, speed: 7 }, description: '武力 +27・速度 +7' },
  tyrantWarArmor: { id: 'tyrantWarArmor', name: '黑風戰甲・霸者', type: 'equipment', slot: 'armor', quality: '傳說', bossOnly: true, bossGearFamily: 'blackwind', evolutionTier: 3, sell: 1120, stats: { defense: 23, maxHp: 78 }, description: '防禦 +23・最大兵力 +78' },
  heavenlyLeaderToken: { id: 'heavenlyLeaderToken', name: '寨主令牌・天威', type: 'equipment', slot: 'accessory', quality: '傳說', bossOnly: true, bossGearFamily: 'blackwind', evolutionTier: 3, sell: 1080, stats: { might: 11, defense: 11, speed: 7 }, description: '武力 +11・防禦 +11・速度 +7' },
  crimsonTigerClaw: { id: 'crimsonTigerClaw', name: '赤焰虎爪', type: 'equipment', slot: 'weapon', quality: '傳說', worldBossOnly: true, sell: 1600, stats: { might: 34, speed: 9 }, description: '武力 +34・速度 +9' },
  crimsonWarArmor: { id: 'crimsonWarArmor', name: '赤焰戰甲', type: 'equipment', slot: 'armor', quality: '傳說', worldBossOnly: true, bossSkillReduction: .12, sell: 1540, stats: { defense: 27, maxHp: 110 }, description: '防禦 +27・最大兵力 +110・Boss 技能減傷 12%' },
  crimsonTigerSeal: { id: 'crimsonTigerSeal', name: '赤焰虎符', type: 'equipment', slot: 'accessory', quality: '傳說', worldBossOnly: true, sell: 1480, stats: { might: 15, speed: 10, maxHp: 55 }, description: '武力 +15・速度 +10・最大兵力 +55' },
  yellowIronBlade: { id: 'yellowIronBlade', name: '黃巾鐵刀', type: 'equipment', slot: 'weapon', quality: '普通', sell: 58, stats: { might: 9 }, description: '武力 +9' },
  yellowSpear: { id: 'yellowSpear', name: '黃巾長槍', type: 'equipment', slot: 'weapon', quality: '普通', sell: 64, stats: { might: 8, speed: 2 }, description: '武力 +8・速度 +2' },
  yellowHardBow: { id: 'yellowHardBow', name: '黃巾硬弓', type: 'equipment', slot: 'weapon', quality: '普通', sell: 62, stats: { might: 7, speed: 3 }, description: '武力 +7・速度 +3' },
  yellowBattleGarb: { id: 'yellowBattleGarb', name: '黃巾戰衣', type: 'equipment', slot: 'armor', quality: '普通', sell: 55, stats: { defense: 6, speed: 2 }, description: '防禦 +6・速度 +2' },
  yellowIronArmor: { id: 'yellowIronArmor', name: '黃巾鐵甲', type: 'equipment', slot: 'armor', quality: '普通', sell: 72, stats: { defense: 9, maxHp: 24 }, description: '防禦 +9・最大兵力 +24' },
  yellowCharm: { id: 'yellowCharm', name: '黃巾護符', type: 'equipment', slot: 'accessory', quality: '普通', sell: 60, stats: { might: 3, defense: 3, speed: 2 }, description: '武力 +3・防禦 +3・速度 +2' },
  captainBlade: { id: 'captainBlade', name: '校尉戰刀', type: 'equipment', slot: 'weapon', quality: '史詩', bossOnly: true, bossGearFamily: 'yellow-captain', sell: 760, stats: { might: 22, defense: 4 }, description: '武力 +22・防禦 +4' },
  yellowHeavyArmor: { id: 'yellowHeavyArmor', name: '黃巾重甲', type: 'equipment', slot: 'armor', quality: '史詩', bossOnly: true, bossGearFamily: 'yellow-captain', sell: 740, stats: { defense: 20, maxHp: 72 }, description: '防禦 +20・最大兵力 +72' },
  captainToken: { id: 'captainToken', name: '校尉令牌', type: 'equipment', slot: 'accessory', quality: '史詩', bossOnly: true, bossGearFamily: 'yellow-captain', sell: 700, stats: { defense: 9, maxHp: 38 }, description: '防禦 +9・最大兵力 +38' },
  commanderSpear: { id: 'commanderSpear', name: '渠帥長槍', type: 'equipment', slot: 'weapon', quality: '史詩', bossOnly: true, bossGearFamily: 'yellow-commander', sell: 790, stats: { might: 25, speed: 6 }, description: '武力 +25・速度 +6' },
  breakerArmor: { id: 'breakerArmor', name: '破軍戰甲', type: 'equipment', slot: 'armor', quality: '史詩', bossOnly: true, bossGearFamily: 'yellow-commander', sell: 750, stats: { defense: 16, maxHp: 54, speed: 3 }, description: '防禦 +16・最大兵力 +54・速度 +3' },
  commanderTalisman: { id: 'commanderTalisman', name: '渠帥兵符', type: 'equipment', slot: 'accessory', quality: '史詩', bossOnly: true, bossGearFamily: 'yellow-commander', sell: 730, stats: { might: 10, speed: 7 }, description: '武力 +10・速度 +7' },
  earthLordSword: { id: 'earthLordSword', name: '地公法劍', type: 'equipment', slot: 'weapon', quality: '史詩', bossOnly: true, bossGearFamily: 'zhang-bao', sell: 860, stats: { might: 24, speed: 5 }, description: '武力 +24・速度 +5・技能增幅' },
  yellowSkyRobe: { id: 'yellowSkyRobe', name: '黃天法袍', type: 'equipment', slot: 'armor', quality: '史詩', bossOnly: true, bossGearFamily: 'zhang-bao', sell: 820, stats: { defense: 18, maxHp: 68 }, description: '防禦 +18・最大兵力 +68' },
  earthLordSeal: { id: 'earthLordSeal', name: '地公令', type: 'equipment', slot: 'accessory', quality: '史詩', bossOnly: true, bossGearFamily: 'zhang-bao', sell: 800, stats: { might: 12, speed: 8, maxHp: 38 }, description: '武力 +12・速度 +8・最大兵力 +38' },
  netherThunderClaw: { id: 'netherThunderClaw', name: '九幽雷爪', type: 'equipment', slot: 'weapon', quality: '傳說', worldBossOnly: true, worldBossFamily: 'nether-thunder', sell: 2300, stats: { might: 46, speed: 16 }, description: '武力 +46・速度 +16' },
  netherThunderArmor: { id: 'netherThunderArmor', name: '九幽雷甲', type: 'equipment', slot: 'armor', quality: '傳說', worldBossOnly: true, worldBossFamily: 'nether-thunder', sell: 2200, stats: { defense: 35, maxHp: 150 }, description: '防禦 +35・最大兵力 +150' },
  thunderEmperorSeal: { id: 'thunderEmperorSeal', name: '雷帝之印', type: 'equipment', slot: 'accessory', quality: '傳說', worldBossOnly: true, worldBossFamily: 'nether-thunder', sell: 2150, stats: { might: 20, speed: 17, maxHp: 75 }, description: '武力 +20・速度 +17・最大兵力 +75' },
  potion: { id: 'potion', name: '回復藥', type: 'consumable', price: 20, heal: 45, description: '戰鬥中恢復 45 兵力' }
};

export const GENERAL_GEAR_IDS = ['woodenSword','ironSword','banditDagger','woodBow','clothArmor','leatherArmor','wolfBracers','clothShoes','ironArmor','woodRing','copperRing','greenEdgeSword','yellowIronBlade','yellowSpear','yellowHardBow','yellowBattleGarb','yellowIronArmor','yellowCharm'];
export const GEAR_QUALITIES = ['普通','精良','稀有','史詩'];
export const GEAR_MULTIPLIERS = { '普通': 1, '精良': 1.20, '稀有': 1.45, '史詩': 1.80 };
export const GEAR_SELL_MULTIPLIERS = { '普通': 1, '精良': 1.5, '稀有': 2.5, '史詩': 4 };

const qualitySuffix = { '精良': 'fine', '稀有': 'rare', '史詩': 'epic' };
for (const baseId of GENERAL_GEAR_IDS) {
  const source = ITEMS[baseId];
  if (!source || source.bossOnly || source.worldBossOnly) continue;
  const sourceRank = GEAR_QUALITIES.indexOf(source.quality);
  const normalizedStats = Object.fromEntries(Object.entries(source.stats || {}).map(([key,value]) => [key, value / GEAR_MULTIPLIERS[source.quality]]));
  Object.assign(source, { baseItemId: baseId, generalGear: true, gearTier: sourceRank, baseStats: normalizedStats });
  for (let rank = sourceRank + 1; rank < GEAR_QUALITIES.length; rank += 1) {
    const quality = GEAR_QUALITIES[rank], id = `${baseId}__${qualitySuffix[quality]}`;
    const stats = Object.fromEntries(Object.entries(normalizedStats).map(([key,value]) => [key, Math.max(1, Math.round(value * GEAR_MULTIPLIERS[quality]))]));
    const statLabels={might:'武力',defense:'防禦',maxHp:'最大兵力',speed:'速度'};
    const description = Object.entries(stats).map(([key,value]) => `${statLabels[key]} +${value}`).join('・');
    ITEMS[id] = { ...source, id, name: `${quality}${source.name}`, quality, sell: Math.round((source.sell || 1) / GEAR_SELL_MULTIPLIERS[source.quality] * GEAR_SELL_MULTIPLIERS[quality]), stats, description, baseItemId: baseId, generalGear: true, gearTier: rank, baseStats: normalizedStats, shop: false };
  }
}

const officer = (id, name, stats) => ({
  id, name, level: 1, exp: 0, maxHp: stats.hp, hp: stats.hp,
  maxMp: stats.mp, mp: stats.mp, might: stats.might, defense: stats.defense,
  intelligence: stats.intelligence, speed: stats.speed, guarding: false
});

export function createParty(playerName) {
  return [
    { ...officer('hero', playerName, { hp: 105, mp: 28, might: 18, defense: 12, intelligence: 14, speed: 15 }), isPlayer: true },
    officer('liu-bei', '劉備', { hp: 100, mp: 32, might: 16, defense: 13, intelligence: 17, speed: 13 }),
    officer('guan-yu', '關羽', { hp: 120, mp: 22, might: 22, defense: 15, intelligence: 12, speed: 12 }),
    officer('zhang-fei', '張飛', { hp: 130, mp: 18, might: 24, defense: 12, intelligence: 8, speed: 10 }),
    null
  ];
}

export function createBlackwindLeader() {
  return { ...officer('blackwind-lord', '黑風寨主', { hp: 160, mp: 26, might: 28, defense: 16, intelligence: 10, speed: 14 }), level: 5, skill: 'assault', rarityRank: 1, rarityName: '普通', growthMultiplier: 1 };
}

export function createCrimsonTiger() {
  return { ...officer('crimson-tiger', '赤焰魔虎', { hp: 520, mp: 72, might: 82, defense: 48, intelligence: 14, speed: 38 }), level: 12, worldBoss: true, rarityRank: 5, rarityName: '世界王', growthMultiplier: 1.45, skills: ['flameRend', 'flameSweep', 'roar'] };
}

export function createYellowBossMember(kind = 'yellow-captain') {
  const profiles = {
    'yellow-captain': ['黃巾校尉', { hp: 310, mp: 44, might: 42, defense: 35, intelligence: 14, speed: 18 }, '坦克'],
    'yellow-commander': ['黃巾渠帥', { hp: 280, mp: 48, might: 51, defense: 24, intelligence: 18, speed: 27 }, '物理輸出'],
    'zhang-bao': ['張寶', { hp: 265, mp: 76, might: 44, defense: 22, intelligence: 52, speed: 25 }, '群攻']
  };
  const [name, stats, role] = profiles[kind] || profiles['yellow-captain'];
  return { ...officer(kind, name, stats), level: kind === 'zhang-bao' ? 18 : 14, bossRecruit: true, rarityRank: 1, rarityName: '普通', growthMultiplier: 1.2, role };
}

export function createNetherThunderBeast() {
  return { ...officer('nether-thunder-beast', '九幽雷獸', { hp: 760, mp: 110, might: 112, defense: 68, intelligence: 36, speed: 70 }), level: 24, worldBoss: true, worldBossId: 'netherThunder', rarityRank: 5, rarityName: '世界王', growthMultiplier: 1.65, role: '世界王／高速', skills: ['thunderClaw', 'thunderArray', 'divinePunishment'] };
}

export const ENEMIES = {
  wolf: { id: 'wolf', name: '野狼', maxHp: 72, might: 14, defense: 5, speed: 18, exp: 24, gold: [8, 14] },
  bandit: { id: 'bandit', name: '山賊', maxHp: 105, might: 20, defense: 8, speed: 11, exp: 38, gold: [16, 25] },
  blackwindWolf: { id: 'blackwindWolf', name: '黑風狼', maxHp: 92, might: 19, defense: 7, speed: 22, exp: 48, gold: [20, 30], loot: { common: ['clothShoes', 'woodRing'], rare: ['wolfBracers'], epic: ['greenEdgeSword'], supply: ['potion'] } },
  forestBandit: { id: 'forestBandit', name: '森林山賊', maxHp: 135, might: 25, defense: 12, speed: 13, exp: 58, gold: [28, 40], loot: { common: ['ironSword', 'leatherArmor'], rare: ['banditDagger', 'ironArmor'], epic: ['greenEdgeSword'] } },
  yellowTurbanArcher: { id: 'yellowTurbanArcher', name: '黃巾弓手', maxHp: 115, might: 22, defense: 9, speed: 17, exp: 53, gold: [24, 35], loot: { common: ['woodBow', 'clothShoes'], rare: ['copperRing'], epic: ['greenEdgeSword'], supply: ['potion'] } },
  strongholdSoldier: { id: 'strongholdSoldier', name: '黑風寨兵', maxHp: 145, might: 26, defense: 13, speed: 13, exp: 65, gold: [32, 45], loot: { common: ['ironSword', 'leatherArmor'], rare: ['copperRing', 'ironArmor'], epic: ['greenEdgeSword'], supply: ['potion'] } },
  blackwindSwordsman: { id: 'blackwindSwordsman', name: '黑風刀客', maxHp: 125, might: 31, defense: 10, speed: 16, exp: 72, gold: [36, 50], loot: { common: ['banditDagger', 'leatherArmor'], rare: ['ironArmor', 'copperRing'], epic: ['greenEdgeSword'], supply: ['potion'] } },
  blackwindCaptain: { id: 'blackwindCaptain', name: '黑風頭目', maxHp: 185, might: 29, defense: 17, speed: 12, exp: 88, gold: [45, 62], loot: { common: ['ironSword', 'leatherArmor'], rare: ['ironArmor', 'banditDagger'], epic: ['greenEdgeSword'], supply: ['potion'] } },
  blackwindLord: { id: 'blackwindLord', name: '黑風寨主', displayName: '敵將・黑風寨主', level: 9, maxHp: 620, maxMp: 48, mp: 48, might: 47, intelligence: 16, defense: 28, speed: 18, exp: 420, gold: [260, 360], boss: true, battleMode: 'puzzle', skills: ['assault', 'intimidate'], loot: { rare: ['blackwindBlade', 'blackwindArmor', 'blackwindCharm'], epic: ['overlordBlade', 'blackwindWarArmor', 'leaderToken'] } }
  ,yellowBladeSoldier: { id: 'yellowBladeSoldier', name: '黃巾刀兵', maxHp: 205, might: 43, defense: 16, speed: 22, exp: 115, gold: [58, 82], loot: { common: ['yellowIronBlade','yellowBattleGarb'], rare: ['yellowIronArmor'], epic: ['yellowCharm'], supply: ['potion'] } }
  ,yellowShieldSoldier: { id: 'yellowShieldSoldier', name: '黃巾盾兵', maxHp: 275, might: 34, defense: 31, speed: 13, exp: 128, gold: [62, 88], loot: { common: ['yellowIronArmor','yellowCharm'], rare: ['yellowIronBlade'], epic: ['yellowSpear'], supply: ['potion'] } }
  ,yellowBowSoldier: { id: 'yellowBowSoldier', name: '黃巾弓兵', maxHp: 185, might: 39, defense: 15, speed: 34, exp: 122, gold: [60, 86], loot: { common: ['yellowHardBow','yellowBattleGarb'], rare: ['yellowCharm'], epic: ['yellowIronArmor'], supply: ['potion'] } }
  ,yellowWarlock: { id: 'yellowWarlock', name: '黃巾術士', maxHp: 172, might: 46, defense: 12, speed: 27, exp: 142, gold: [70, 96], magicEnemy: true, loot: { common: ['yellowCharm','yellowBattleGarb'], rare: ['yellowHardBow'], epic: ['yellowIronBlade'], supply: ['potion'] } }
  ,yellowBrute: { id: 'yellowBrute', name: '黃巾力士', maxHp: 335, might: 50, defense: 22, speed: 11, exp: 158, gold: [76, 104], loot: { common: ['yellowSpear','yellowIronArmor'], rare: ['yellowIronBlade'], epic: ['yellowCharm'], supply: ['potion'] } }
  ,yellowCaptainBoss: { id: 'yellowCaptainBoss', bossKind: 'yellow-captain', name: '黃巾校尉', displayName: '敵將・黃巾校尉', level: 16, maxHp: 1650, maxMp: 76, mp: 76, might: 73, intelligence: 24, defense: 58, speed: 25, exp: 980, gold: [620, 820], boss: true, battleMode: 'puzzle', skills: ['ironWall','shieldBash'], loot: { rare: ['captainBlade','yellowHeavyArmor','captainToken'], epic: ['captainBlade','yellowHeavyArmor','captainToken'] } }
  ,yellowCommanderBoss: { id: 'yellowCommanderBoss', bossKind: 'yellow-commander', name: '黃巾渠帥', displayName: '敵將・黃巾渠帥', level: 18, maxHp: 1750, maxMp: 82, mp: 82, might: 91, intelligence: 28, defense: 43, speed: 38, exp: 1220, gold: [760, 980], boss: true, battleMode: 'puzzle', skills: ['armyBreaker','pursuit'], loot: { rare: ['commanderSpear','breakerArmor','commanderTalisman'], epic: ['commanderSpear','breakerArmor','commanderTalisman'] } }
  ,zhangBaoBoss: { id: 'zhangBaoBoss', bossKind: 'zhang-bao', name: '張寶', displayName: '地公將軍・張寶', level: 21, maxHp: 2200, maxMp: 140, mp: 140, might: 96, intelligence: 72, defense: 49, speed: 41, exp: 1800, gold: [1100, 1450], boss: true, battleMode: 'puzzle', skills: ['demonThunder','nineHeavens','yellowSkyCurse'], loot: { rare: ['earthLordSword','yellowSkyRobe','earthLordSeal'], epic: ['earthLordSword','yellowSkyRobe','earthLordSeal'] } }
};

export const AREAS = {
  plain: { id: 'plain', name: '村外平原', enemies: ['wolf', 'bandit'], level: 1, danger: 1, recommendedPower: 850 },
  forest: { id: 'forest', name: '黑風森林', enemies: ['blackwindWolf', 'forestBandit', 'yellowTurbanArcher'], level: 3, danger: 2, recommendedPower: 1650 },
  stronghold: { id: 'stronghold', name: '黑風寨', enemies: ['strongholdSoldier', 'blackwindSwordsman', 'blackwindCaptain'], level: 5, danger: 3, recommendedPower: 2450 }
  ,yellowRoad: { id: 'yellowRoad', name: '黃巾荒道', enemies: ['yellowBladeSoldier','yellowShieldSoldier','yellowBowSoldier'], level: 8, danger: 3, recommendedPower: 6500, bossPool: ['yellowCaptainBoss'] }
  ,yellowCamp: { id: 'yellowCamp', name: '黃巾營地', enemies: ['yellowShieldSoldier','yellowBowSoldier','yellowWarlock','yellowBrute'], level: 11, danger: 4, recommendedPower: 9200, bossPool: ['yellowCaptainBoss','yellowCommanderBoss'] }
  ,yellowFortress: { id: 'yellowFortress', name: '黃巾主寨', enemies: ['yellowBladeSoldier','yellowWarlock','yellowBrute'], level: 14, danger: 5, recommendedPower: 12800, bossPool: ['yellowCommanderBoss','zhangBaoBoss'] }
};

export const CHARACTER_ROLES = {
  hero:'均衡','liu-bei':'輔助／均衡','guan-yu':'物理輸出','zhang-fei':'前排／輸出','blackwind-lord':'爆發','crimson-tiger':'世界王／爆發',
  'yellow-captain':'坦克','yellow-commander':'物理輸出','zhang-bao':'群攻','nether-thunder-beast':'世界王／高速'
};

export const BOSS_RECOMMENDED_POWER = 3200;
export const BOSS_PITY_LIMIT = 20;

export const SLOT_NAMES = { weapon: '武器', armor: '防具', accessory: '飾品' };
export const STAT_NAMES = { might: '武力', defense: '防禦', maxHp: '最大兵力', speed: '速度' };
export const QUALITY_ORDER = { '普通': 1, '精良': 2, '稀有': 3, '史詩': 4, '傳說': 5 };

export const EXP_TO_LEVEL = level => 45 + (level - 1) * 35;
export const INN_COST = 18;
