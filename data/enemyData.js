// 森林敵人的基本資料；戰鬥時會複製成獨立實例。
export const ENEMIES = [
  { id:'bandit', tier:'普通', name:'山賊', hp:48, attack:9, defense:3, exp:28, gold:24, drops:[{id:'herb', chance:0.35}] },
  { id:'wolf', tier:'普通', name:'野狼', hp:36, attack:11, defense:2, exp:24, gold:16, drops:[{id:'herb', chance:0.25}] },
  { id:'refugee', tier:'普通', name:'流民', hp:58, attack:8, defense:4, exp:34, gold:30, drops:[{id:'herb', chance:0.45}] },
  { id:'eliteBandit', tier:'菁英', name:'山賊精英', hp:84, attack:14, defense:6, exp:58, gold:56, drops:[{id:'herb', chance:0.7}] },
  { id:'eliteWolf', tier:'菁英', name:'狼王親衛', hp:74, attack:16, defense:4, exp:54, gold:46, drops:[{id:'herb', chance:0.6}] },
  { id:'banditChief', tier:'頭目', name:'黑風寨主', hp:132, attack:18, defense:8, exp:108, gold:115, skills:[{name:'裂地斬',multiplier:1.45,chance:0.25}], drops:[{id:'herb', chance:1}] },
  { id:'ironCaptain', tier:'頭目', name:'鐵甲都尉', hp:176, attack:21, defense:13, exp:145, gold:150, skills:[{name:'鐵壁衝鋒',multiplier:1.55,chance:0.25}], drops:[{id:'herb', chance:1}] },
  { id:'mistStrategist', tier:'頭目', name:'霧谷軍師', hp:154, attack:25, defense:9, exp:165, gold:175, skills:[{name:'迷霧火計',multiplier:1.7,chance:0.3}], drops:[{id:'herb', chance:1}] },
  { id:'riverTyrant', tier:'頭目', name:'怒江霸主', hp:220, attack:28, defense:12, exp:210, gold:230, skills:[{name:'驚濤破陣',multiplier:1.8,chance:0.32}], drops:[{id:'herb', chance:1}] },
  { id:'skyBeast', tier:'世界頭目', name:'蒼穹巨獸', hp:680, attack:32, defense:15, exp:520, gold:620, recruitable:false, enrageAt:0.35, skills:[{name:'天雷震野',multiplier:1.85,chance:0.3}], drops:[{id:'herb', chance:1}] },
  { id:'ancientGuardian', tier:'世界頭目', name:'太古戰傀', hp:820, attack:36, defense:19, exp:680, gold:780, recruitable:false, enrageAt:0.4, skills:[{name:'千鈞崩擊',multiplier:2,chance:0.32}], drops:[{id:'herb', chance:1}] },
  { id:'crimsonDragon', tier:'世界頭目', name:'赤焰天龍', hp:1050, attack:42, defense:22, exp:900, gold:1080, recruitable:false, enrageAt:0.45, skills:[{name:'赤焰焚城',multiplier:2.15,chance:0.35}], drops:[{id:'herb', chance:1}] }
];
