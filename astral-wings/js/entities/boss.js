import { getBoss } from '../data/bosses.js';
export const makeBoss = (id) => {
  const boss = getBoss(id);
  return ({
  ...boss, x: 180, y: 90, r: 46, maxHp: boss.hp,
  fireCd: 0, phase: 1, dir: 1, laserWarn: 0, laserActive: 0,
  rest: 1.1, telegraph: 0, attack: 'fan', sequence: 0, volley: 0, summonCd: 6
  });
};
