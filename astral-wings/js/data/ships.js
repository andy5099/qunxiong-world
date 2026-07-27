// 原創可操作戰機；定位改變實際戰鬥屬性，而不是只有名稱或外觀不同。
export const ships = [
  { id: 'dawn', name: '晨星突擊者', role: '平衡型', sprite: 0, unlock: 0, attack: 1, hp: 1, shield: 1, speed: 1, crit: 0.05, description: '穩定雙脈衝炮，適合熟悉彈幕。' },
  { id: 'ember', name: '燼紅破陣者', role: '高攻型', sprite: 1, unlock: 850, attack: 1.26, hp: 0.92, shield: 0.9, speed: 0.95, crit: 0.08, description: '主炮爆發更高，護盾較薄。' },
  { id: 'violet', name: '紫棱巡弋者', role: '高速型', sprite: 2, unlock: 1400, attack: 1.08, hp: 0.9, shield: 0.95, speed: 1.18, crit: 0.12, description: '機動與暴擊突出，適合穿越縫隙。' },
  { id: 'bulwark', name: '蒼穹壁壘', role: '護盾型', sprite: 4, unlock: 2200, attack: 0.94, hp: 1.2, shield: 1.42, speed: 0.9, crit: 0.04, description: '生命與護盾最高，容錯率佳。' },
  { id: 'auric', name: '金環先鋒', role: '暴擊型', sprite: 5, unlock: 3400, attack: 1.15, hp: 1.02, shield: 1.05, speed: 1.04, crit: 0.18, description: '高暴擊與高成長，適合後期挑戰。' }
];

export const getShip = id => ships.find(ship => ship.id === id) || ships[0];
