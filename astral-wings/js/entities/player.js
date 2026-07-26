import { equipmentTemplates } from '../data/equipment.js';

// 單局能力不寫入存檔，重新開始或返回選單時會自然重置。
export const player = (save) => {
  const worn = Object.values(save.equipped || {}).map(id => equipmentTemplates.find(item => item.id === id)).filter(Boolean);
  const bonus = worn.reduce((total, item) => total + item.value + (save.equipment.find(entry => entry.id === item.id)?.level || 0), 0);
  return ({
  // 視覺機身維持原大小；r 為中央小核心，讓彈幕可公平閃避。
  x: 180, y: 555, r: 6,
  hp: 100 + save.level * 5 + bonus + (save.star - 1) * 8, maxHp: 100 + save.level * 5 + bonus + (save.star - 1) * 8,
  shield: 50 + save.level * 3 + Math.floor(bonus * 0.45) + (save.star - 1) * 4, maxShield: 50 + save.level * 3 + Math.floor(bonus * 0.45) + (save.star - 1) * 4,
  atk: 10 + save.level * 2 + Math.floor(bonus * 0.4) + (save.star - 1) * 2, energy: 0, inv: 0, fire: 0,
  fireLevel: 1, magnet: 0, rage: 0, doubleGold: 0, pierceBuff: 0, crit: 0, barrier: 0, rapid: 0
  });
};
