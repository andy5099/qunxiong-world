// 森林敵人的基本資料；戰鬥時會複製成獨立實例。
export const ENEMIES = [
  { id:'bandit', tier:'普通', name:'山賊', hp:48, attack:9, defense:3, exp:28, gold:24, drops:[{id:'herb', chance:0.35}] },
  { id:'wolf', tier:'普通', name:'野狼', hp:36, attack:11, defense:2, exp:24, gold:16, drops:[{id:'herb', chance:0.25}] },
  { id:'refugee', tier:'普通', name:'流民', hp:58, attack:8, defense:4, exp:34, gold:30, drops:[{id:'herb', chance:0.45}] },
  { id:'eliteBandit', tier:'菁英', name:'山賊精英', hp:84, attack:14, defense:6, exp:58, gold:56, drops:[{id:'herb', chance:0.7}] },
  { id:'eliteWolf', tier:'菁英', name:'狼王親衛', hp:74, attack:16, defense:4, exp:54, gold:46, drops:[{id:'herb', chance:0.6}] },
  { id:'banditChief', tier:'頭目', name:'山賊頭目', hp:132, attack:18, defense:8, exp:108, gold:115, drops:[{id:'herb', chance:1}] }
];
