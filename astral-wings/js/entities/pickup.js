export const pickup = (x, y, type, value = 1) => ({
  x, y, type, value, r: 12, vy: 42, age: 0,
  drift: Math.random() * Math.PI * 2
});
