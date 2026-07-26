// 單局能力不寫入存檔，重新開始或返回選單時會自然重置。
export const player = (save) => ({
  x: 180, y: 555, r: 11,
  hp: 100 + save.level * 5, maxHp: 100 + save.level * 5,
  shield: 50 + save.level * 3, maxShield: 50 + save.level * 3,
  atk: 10 + save.level * 2, energy: 0, inv: 0, fire: 0,
  fireLevel: 1, magnet: 0, rage: 0, doubleGold: 0
});
