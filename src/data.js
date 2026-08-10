export const SAVE_VERSION = 6;

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
  blackwindBlade: { id: 'blackwindBlade', name: '黑風刀', type: 'equipment', slot: 'weapon', quality: '史詩', sell: 320, stats: { might: 12, speed: 2 }, description: '武力 +12・速度 +2' },
  blackwindArmor: { id: 'blackwindArmor', name: '黑風甲', type: 'equipment', slot: 'armor', quality: '史詩', sell: 300, stats: { defense: 9, maxHp: 24 }, description: '防禦 +9・最大兵力 +24' },
  blackwindCharm: { id: 'blackwindCharm', name: '黑風護符', type: 'equipment', slot: 'accessory', quality: '史詩', sell: 280, stats: { might: 3, defense: 3, maxHp: 16 }, description: '武力 +3・防禦 +3・最大兵力 +16' },
  potion: { id: 'potion', name: '回復藥', type: 'consumable', price: 20, heal: 45, description: '戰鬥中恢復 45 兵力' }
};

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
  return { ...officer('blackwind-lord', '黑風寨主', { hp: 160, mp: 26, might: 28, defense: 16, intelligence: 10, speed: 14 }), level: 5, skill: 'assault' };
}

export const ENEMIES = {
  wolf: { id: 'wolf', name: '野狼', maxHp: 72, might: 14, defense: 5, speed: 18, exp: 24, gold: [8, 14] },
  bandit: { id: 'bandit', name: '山賊', maxHp: 105, might: 20, defense: 8, speed: 11, exp: 38, gold: [16, 25] },
  blackwindWolf: { id: 'blackwindWolf', name: '黑風狼', maxHp: 92, might: 19, defense: 7, speed: 22, exp: 48, gold: [20, 30], loot: { common: ['clothShoes', 'woodRing'], rare: ['wolfBracers'], epic: ['greenEdgeSword'], supply: ['potion'] } },
  forestBandit: { id: 'forestBandit', name: '森林山賊', maxHp: 135, might: 25, defense: 12, speed: 13, exp: 58, gold: [28, 40], loot: { common: ['ironSword', 'leatherArmor'], rare: ['banditDagger', 'ironArmor'], epic: ['greenEdgeSword'] } },
  yellowTurbanArcher: { id: 'yellowTurbanArcher', name: '黃巾弓手', maxHp: 115, might: 22, defense: 9, speed: 17, exp: 53, gold: [24, 35], loot: { common: ['woodBow', 'clothShoes'], rare: ['copperRing'], epic: ['greenEdgeSword'], supply: ['potion'] } },
  strongholdSoldier: { id: 'strongholdSoldier', name: '黑風寨兵', maxHp: 145, might: 26, defense: 13, speed: 13, exp: 65, gold: [32, 45], loot: { common: ['ironSword', 'leatherArmor'], rare: ['copperRing'], epic: ['blackwindArmor'], supply: ['potion'] } },
  blackwindSwordsman: { id: 'blackwindSwordsman', name: '黑風刀客', maxHp: 125, might: 31, defense: 10, speed: 16, exp: 72, gold: [36, 50], loot: { common: ['banditDagger', 'leatherArmor'], rare: ['blackwindBlade'], epic: ['blackwindBlade'], supply: ['potion'] } },
  blackwindCaptain: { id: 'blackwindCaptain', name: '黑風頭目', maxHp: 185, might: 29, defense: 17, speed: 12, exp: 88, gold: [45, 62], loot: { common: ['ironSword', 'leatherArmor'], rare: ['ironArmor', 'blackwindCharm'], epic: ['blackwindArmor'], supply: ['potion'] } },
  blackwindLord: { id: 'blackwindLord', name: '黑風寨主', level: 7, maxHp: 390, maxMp: 36, mp: 36, might: 38, intelligence: 14, defense: 20, speed: 17, exp: 240, gold: [150, 210], boss: true, skills: ['assault', 'intimidate'], loot: { common: ['blackwindBlade', 'blackwindArmor', 'blackwindCharm'], rare: ['blackwindBlade', 'blackwindArmor', 'blackwindCharm'], epic: ['blackwindBlade', 'blackwindArmor', 'blackwindCharm'], supply: ['potion'] } }
};

export const AREAS = {
  plain: { id: 'plain', name: '村外平原', enemies: ['wolf', 'bandit'], level: 1 },
  forest: { id: 'forest', name: '黑風森林', enemies: ['blackwindWolf', 'forestBandit', 'yellowTurbanArcher'], level: 3 },
  stronghold: { id: 'stronghold', name: '黑風寨', enemies: ['strongholdSoldier', 'blackwindSwordsman', 'blackwindCaptain'], level: 5 }
};

export const SLOT_NAMES = { weapon: '武器', armor: '防具', accessory: '飾品' };
export const STAT_NAMES = { might: '武力', defense: '防禦', maxHp: '最大兵力', speed: '速度' };
export const QUALITY_ORDER = { '普通': 1, '稀有': 2, '史詩': 3 };

export const EXP_TO_LEVEL = level => 45 + (level - 1) * 35;
export const INN_COST = 18;
