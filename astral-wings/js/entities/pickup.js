export const pickup = (x, y, type, value = 1) => ({
  x, y, type, value, r: 12, vy: 28 + Math.random() * 26, age: 0,
  vx: (Math.random() - 0.5) * 84, drift: Math.random() * Math.PI * 2, driftSpeed: 1.8 + Math.random() * 3.8, bob: 8 + Math.random() * 10
});
