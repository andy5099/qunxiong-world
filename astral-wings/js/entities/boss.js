import { boss } from '../data/bosses.js';
export const makeBoss = () => ({
  ...boss, x: 180, y: 90, r: 46, maxHp: boss.hp,
  fireCd: 1.3, phase: 1, dir: 1, laserWarn: 0,
  laserActive: 0, summonCd: 3.2
});
