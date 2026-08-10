export const SAVE_VERSION = 4;

export const ITEMS = {
  woodenSword: { id: 'woodenSword', name: '木劍', type: 'weapon', price: 60, attack: 3, description: '武力 +3' },
  clothArmor: { id: 'clothArmor', name: '布衣', type: 'armor', price: 55, defense: 3, description: '防禦 +3' },
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

export const ENEMIES = {
  wolf: { id: 'wolf', name: '野狼', maxHp: 72, might: 14, defense: 5, speed: 18, exp: 24, gold: [8, 14] },
  bandit: { id: 'bandit', name: '山賊', maxHp: 105, might: 20, defense: 8, speed: 11, exp: 38, gold: [16, 25] }
};

export const EXP_TO_LEVEL = level => 45 + (level - 1) * 35;
export const INN_COST = 18;
