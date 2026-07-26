export const bullet = (x, y, vx, vy, from, damage = 10, pierce = 0) => ({
  x, y, vx, vy, from, damage, pierce,
  r: from === 'p' ? 3.5 : 6, life: 5, hit: new Set()
});
