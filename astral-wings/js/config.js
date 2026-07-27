// v0.5 集中平衡設定；日後調整難度不需散落修改戰鬥程式。
export const balanceConfig = {
  player: { collisionRadius: 6, invincibleSeconds: 1.45, shotInterval: 0.18 },
  boss: {
    phaseTwo: 0.7, phaseThree: 0.35, fanSpeed: 108, aimedSpeed: 118,
    ringSpeed: 92, laserWarning: 1.15, laserDuration: 0.24, rest: 1.05,
    bossHp: 2650, maxBullets: 74
  },
  drops: { power: 0.15, fragment: 0.02 },
  buffs: { magnet: 10, rage: 8, double: 20, pierce: 10, crit: 10, barrier: 8, rapid: 8 },
  equipment: { maxLevel: 20, upgradeCost: level => 30 + level * 28 }
};

export const C = {
  w: 360, h: 640, save: 'astralWingsSaveV1', maxLevel: 30,
  upgradeCost: level => 80 + level * 70,
  shot: balanceConfig.player.shotInterval,
  invincible: balanceConfig.player.invincibleSeconds
};
