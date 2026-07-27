import { enemies } from '../data/enemies.js?v=20260727-visual-12stage';

export const enemy = (kind, x) => {
  const data = enemies[kind];
  return {
    // AI 美術的可見機身大於舊幾何圖形，受彈半徑同步加大，避免打到邊緣卻沒有命中。
    ...data, kind, x, y: -30, r: (data.hp || 0) >= 140 || kind === 'elite' ? 32 : (data.hp || 0) >= 80 ? 28 : 24,
    phase: Math.random() * Math.PI * 2, fireCd: 0.8 + Math.random() * 0.5,
    shield: data.shield || 0, maxShield: data.shield || 0, maxHp: data.hp, age: 0, lockedY: 118 + Math.random() * 120
  };
};
