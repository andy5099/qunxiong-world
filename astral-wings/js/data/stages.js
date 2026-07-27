// 關卡資料完全由此模組管理；每一關都有固定且可預期的波次節奏。
export const stages = [
  { id: 'orbit', order: 0, name: '第 1 關：破碎軌道', subtitle: '失控的殘骸帶', boss: 'iron', palette: ['#06132b', '#243f76'], unlock: '初始開放', waves: [['scout', 4], ['sprinter', 4], ['armor', 3], ['elite', 1], ['supply', 1], ['sniper', 3], ['bomber', 3], ['shield', 2], ['support', 2], ['boss', 1]] },
  { id: 'nebula', order: 1, name: '第 2 關：靛霧星雲', subtitle: '離子風暴前線', boss: 'veil', palette: ['#17113a', '#5a2c77'], unlock: '通關破碎軌道', waves: [['scout', 5], ['sniper', 3], ['sprinter', 5], ['elite', 1], ['supply', 1], ['support', 2], ['bomber', 4], ['shield', 3], ['elite', 1], ['boss', 1]] },
  { id: 'forge', order: 2, name: '第 3 關：熔環要塞', subtitle: '環星熔爐防衛線', boss: 'forge', palette: ['#2d100d', '#713327'], unlock: '通關靛霧星雲', waves: [['armor', 4], ['bomber', 4], ['sniper', 4], ['elite', 1], ['supply', 1], ['support', 3], ['shield', 3], ['sprinter', 6], ['elite', 1], ['boss', 1]] }
  ,{ id: 'rift', order: 3, name: '第 4 關：鏡潮裂谷', subtitle: '重力潮汐禁區', boss: 'rift', palette: ['#082b36', '#23606a'], unlock: '通關熔環要塞', waves: [['sprinter', 6], ['shield', 3], ['sniper', 4], ['elite', 1], ['supply', 1], ['bomber', 5], ['support', 3], ['armor', 4], ['elite', 1], ['boss', 1]] }
  ,{ id: 'crown', order: 4, name: '第 5 關：琉焰王冠', subtitle: '恆星殘光航道', boss: 'crown', palette: ['#391610', '#7e3c20'], unlock: '通關鏡潮裂谷', waves: [['scout', 7], ['bomber', 5], ['shield', 4], ['elite', 1], ['supply', 1], ['sniper', 5], ['support', 4], ['armor', 5], ['elite', 1], ['boss', 1]] }
  ,{ id: 'void', order: 5, name: '第 6 關：寂滅星門', subtitle: '未知艦隊核心', boss: 'void', palette: ['#160b2c', '#4a236e'], unlock: '通關琉焰王冠', waves: [['sprinter', 8], ['armor', 5], ['sniper', 5], ['elite', 1], ['supply', 1], ['bomber', 6], ['support', 4], ['shield', 4], ['elite', 2], ['boss', 1]] }
  ,{ id: 'meteor', order: 6, name: '第 7 關：隕石迴廊', subtitle: '碎岩護航航線', boss: 'meteor', palette: ['#091b2d', '#31556c'], unlock: '通關寂滅星門', waves: [['flare', 8], ['reaper', 5], ['miner', 5], ['elite', 1], ['supply', 1], ['laser', 6], ['warder', 4], ['medic', 4], ['elite', 2], ['boss', 1]] }
  ,{ id: 'crystal', order: 7, name: '第 8 關：晶體行星', subtitle: '折射礦脈上空', boss: 'crystal', palette: ['#082a31', '#2b716c'], unlock: '通關隕石迴廊', waves: [['warder', 5], ['phantom', 9], ['beacon', 5], ['elite', 1], ['supply', 1], ['bastion', 6], ['laser', 6], ['splitter', 6], ['elite', 2], ['boss', 1]] }
  ,{ id: 'embersea', order: 8, name: '第 9 關：熾海星域', subtitle: '熔流噴發帶', boss: 'ember', palette: ['#321009', '#8c4024'], unlock: '通關晶體行星', waves: [['reaper', 8], ['miner', 6], ['flare', 9], ['elite', 2], ['supply', 1], ['medic', 5], ['thresher', 7], ['bastion', 5], ['elite', 2], ['boss', 1]] }
  ,{ id: 'frostmoon', order: 9, name: '第 10 關：冰封衛星', subtitle: '永夜極光層', boss: 'frost', palette: ['#0b1d36', '#4d78a0'], unlock: '通關熾海星域', waves: [['laser', 8], ['warder', 6], ['phantom', 10], ['elite', 2], ['supply', 1], ['bastion', 7], ['splitter', 7], ['beacon', 6], ['elite', 2], ['boss', 1]] }
  ,{ id: 'stormsea', order: 10, name: '第 11 關：雷暴雲海', subtitle: '電磁亂流地帶', boss: 'storm', palette: ['#181133', '#58438a'], unlock: '通關冰封衛星', waves: [['beacon', 7], ['formation', 10], ['reaper', 8], ['elite', 2], ['supply', 1], ['laser', 8], ['warder', 7], ['miner', 8], ['elite', 2], ['boss', 1]] }
  ,{ id: 'citadel', order: 11, name: '第 12 關：終焉要塞', subtitle: '失落艦隊王座', boss: 'citadel', palette: ['#221225', '#7a4c35'], unlock: '通關雷暴雲海', waves: [['miner', 9], ['phantom', 11], ['beacon', 8], ['elite', 2], ['supply', 1], ['reaper', 9], ['thresher', 9], ['bastion', 8], ['elite', 3], ['boss', 1]] }
];

// 相容舊程式與舊存檔：沒有選關資訊時，一律進入第一關。
export const stage = stages[0];
export const getStage = id => stages.find(entry => entry.id === id) || stage;
