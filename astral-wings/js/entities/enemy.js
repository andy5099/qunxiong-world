import { enemies } from '../data/enemies.js';

export const enemy = (kind, x) => {
  const data = enemies[kind];
  return {
    ...data, kind, x, y: -30, r: kind === 'armor' || kind === 'elite' ? 19 : 15,
    phase: Math.random() * Math.PI * 2, fireCd: 0.8 + Math.random() * 0.5,
    shield: data.shield || 0, maxShield: data.shield || 0, maxHp: data.hp, age: 0, lockedY: 118 + Math.random() * 120
  };
};
