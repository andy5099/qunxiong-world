import { equipmentTemplates, fusionForms } from '../data/equipment.js';
import { getShip } from '../data/ships.js?v=20260727-boss-routes-hangar-v3';

// 單局能力不寫入存檔，重新開始或返回選單時會自然重置。
export const player = (save) => {
  const ship = getShip(save.activeShip);
  const shipLevel = Math.max(1, save.shipLevels?.[ship.id] || save.level || 1);
  const worn = Object.values(save.equipped || {}).map(id => equipmentTemplates.find(item => item.id === id)).filter(Boolean);
  const bonus = worn.reduce((total, item) => total + item.value + (save.equipment.find(entry => entry.id === item.id)?.level || 0), 0);
  const form = fusionForms.find(item => item.id === save.fusion);
  const fusionGrowth = (save.fusionAwaken || 0) * 0.06 + (save.fusionEvolution || 0) * 0.1;
  const vitality = form?.stat.vitality || 0;
  const attack = form?.stat.attack || 0;
  return ({
  // 視覺機身維持原大小；r 為中央小核心，讓彈幕可公平閃避。
  x: 180, y: 555, r: 6,
  hp: Math.floor((100 + shipLevel * 5 + bonus + (save.star - 1) * 8) * (1 + vitality) * ship.hp), maxHp: Math.floor((100 + shipLevel * 5 + bonus + (save.star - 1) * 8) * (1 + vitality) * ship.hp),
  shield: Math.floor((50 + shipLevel * 3 + Math.floor(bonus * 0.45) + (save.star - 1) * 4) * (1 + vitality) * ship.shield), maxShield: Math.floor((50 + shipLevel * 3 + Math.floor(bonus * 0.45) + (save.star - 1) * 4) * (1 + vitality) * ship.shield),
  atk: Math.floor((10 + shipLevel * 2 + Math.floor(bonus * 0.4) + (save.star - 1) * 2) * (1 + attack + fusionGrowth) * ship.attack), speed: 260 * ship.speed, critBase: ship.crit, shipId: ship.id, shipLevel, sprite: ship.sprite, shipName: ship.name, energy: 0, inv: 0, fire: 0,
  fireLevel: 1, magnet: 0, rage: 0, doubleGold: 0, pierceBuff: 0, crit: 0, barrier: 0, rapid: 0
  });
};
