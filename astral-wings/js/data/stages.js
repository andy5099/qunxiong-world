// 關卡資料完全由此模組管理；每一關都有固定且可預期的波次節奏。
export const stages = [
  { id: 'orbit', order: 0, name: '第 1 關：破碎軌道', subtitle: '失控的殘骸帶', boss: 'iron', palette: ['#06132b', '#243f76'], unlock: '初始開放', waves: [['scout', 4], ['sprinter', 4], ['armor', 3], ['elite', 1], ['supply', 1], ['sniper', 3], ['bomber', 3], ['shield', 2], ['support', 2], ['boss', 1]] },
  { id: 'nebula', order: 1, name: '第 2 關：靛霧星雲', subtitle: '離子風暴前線', boss: 'veil', palette: ['#17113a', '#5a2c77'], unlock: '通關破碎軌道', waves: [['scout', 5], ['sniper', 3], ['sprinter', 5], ['elite', 1], ['supply', 1], ['support', 2], ['bomber', 4], ['shield', 3], ['elite', 1], ['boss', 1]] },
  { id: 'forge', order: 2, name: '第 3 關：熔環要塞', subtitle: '環星熔爐防衛線', boss: 'forge', palette: ['#2d100d', '#713327'], unlock: '通關靛霧星雲', waves: [['armor', 4], ['bomber', 4], ['sniper', 4], ['elite', 1], ['supply', 1], ['support', 3], ['shield', 3], ['sprinter', 6], ['elite', 1], ['boss', 1]] }
  ,{ id: 'rift', order: 3, name: '第 4 關：鏡潮裂谷', subtitle: '重力潮汐禁區', boss: 'rift', palette: ['#082b36', '#23606a'], unlock: '通關熔環要塞', waves: [['sprinter', 6], ['shield', 3], ['sniper', 4], ['elite', 1], ['supply', 1], ['bomber', 5], ['support', 3], ['armor', 4], ['elite', 1], ['boss', 1]] }
  ,{ id: 'crown', order: 4, name: '第 5 關：琉焰王冠', subtitle: '恆星殘光航道', boss: 'crown', palette: ['#391610', '#7e3c20'], unlock: '通關鏡潮裂谷', waves: [['scout', 7], ['bomber', 5], ['shield', 4], ['elite', 1], ['supply', 1], ['sniper', 5], ['support', 4], ['armor', 5], ['elite', 1], ['boss', 1]] }
  ,{ id: 'void', order: 5, name: '第 6 關：寂滅星門', subtitle: '未知艦隊核心', boss: 'void', palette: ['#160b2c', '#4a236e'], unlock: '通關琉焰王冠', waves: [['sprinter', 8], ['armor', 5], ['sniper', 5], ['elite', 1], ['supply', 1], ['bomber', 6], ['support', 4], ['shield', 4], ['elite', 2], ['boss', 1]] }
];

// 相容舊程式與舊存檔：沒有選關資訊時，一律進入第一關。
export const stage = stages[0];
export const getStage = id => stages.find(entry => entry.id === id) || stage;
