// 每隻 Boss 共用公平的三階段行為，但有獨立的外觀色彩與耐久配置。
export const bosses = {
  iron: { id: 'iron', name: '鐵幕吞噬者', hp: 2650, score: 6000, color: '#ff416d' },
  veil: { id: 'veil', name: '靛霧裁決者', hp: 3350, score: 8200, color: '#a56cff' },
  forge: { id: 'forge', name: '熔環監督者', hp: 4200, score: 10800, color: '#ff9a4c' },
  rift: { id: 'rift', name: '潮汐破界者', hp: 5200, score: 13200, color: '#57e6e8' },
  crown: { id: 'crown', name: '琉焰司祭', hp: 6300, score: 15800, color: '#ffbe56' },
  void: { id: 'void', name: '寂滅門衛', hp: 7600, score: 19000, color: '#d07aff' }
  ,meteor: { id: 'meteor', name: '隕海巡弋母艦', hp: 9000, score: 22500, color: '#8bd5ff' }
  ,crystal: { id: 'crystal', name: '晶巢共振體', hp: 10600, score: 26400, color: '#73ffdc' }
  ,ember: { id: 'ember', name: '赤潮熔核王', hp: 12400, score: 30600, color: '#ff6d4a' }
  ,frost: { id: 'frost', name: '霜環審判官', hp: 14500, score: 35200, color: '#b9ecff' }
  ,storm: { id: 'storm', name: '雷暴編織者', hp: 16900, score: 40200, color: '#b995ff' }
  ,citadel: { id: 'citadel', name: '終焉堡壘核心', hp: 19600, score: 45600, color: '#ffd16c' }
};

export const boss = bosses.iron;
export const getBoss = id => bosses[id] || boss;
