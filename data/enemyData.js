// 森林敵人的基本資料；戰鬥時會複製成獨立實例。
export const ENEMIES = [
  { id:'bandit', name:'山賊', hp:48, attack:9, defense:3, exp:28, gold:24, drops:[{id:'herb', chance:0.35}] },
  { id:'wolf', name:'野狼', hp:36, attack:11, defense:2, exp:24, gold:16, drops:[{id:'herb', chance:0.25}] },
  { id:'refugee', name:'流民', hp:58, attack:8, defense:4, exp:34, gold:30, drops:[{id:'herb', chance:0.45}] }
];
