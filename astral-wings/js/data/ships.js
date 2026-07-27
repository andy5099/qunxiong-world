// 原創戰機資料：tier 決定機庫排序與購買成長節奏；sprite 對應本地原創戰機圖集。
export const ships = [
  { id: 'dawn', name: '晨星突擊者', role: '平衡脈衝型', tier: 1, sprite: 0, unlock: 0, attack: 1, hp: 1, shield: 1, speed: 1, crit: 0.05, description: '雙翼脈衝炮與穩定護盾，適合熟悉彈幕節奏。' },
  { id: 'ember', name: '燼焰破陣者', role: '高攻爆發型', tier: 2, sprite: 1, unlock: 850, attack: 1.26, hp: 0.92, shield: 0.90, speed: 0.95, crit: 0.08, description: '灼紅核心會讓主炮爆發更集中，換取少量耐久。' },
  { id: 'violet', name: '紫曜巡獵者', role: '高速暴擊型', tier: 2, sprite: 2, unlock: 1400, attack: 1.08, hp: 0.90, shield: 0.95, speed: 1.18, crit: 0.12, description: '偏折翼與紫曜尾焰，適合在彈幕縫隙中高速穿梭。' },
  { id: 'bulwark', name: '天穹壁壘', role: '重盾防禦型', tier: 3, sprite: 4, unlock: 2200, attack: 0.94, hp: 1.20, shield: 1.42, speed: 0.90, crit: 0.04, description: '厚重裝甲與雙層護盾，容錯高、轉向沉穩。' },
  { id: 'auric', name: '鎏金日冕', role: '暴擊能量型', tier: 3, sprite: 5, unlock: 3400, attack: 1.15, hp: 1.02, shield: 1.05, speed: 1.04, crit: 0.18, description: '日冕環繞機身，擅長在高火力時製造暴擊連鎖。' },
  { id: 'specter', name: '幽熒幻影', role: '高速連射型', tier: 4, sprite: 3, unlock: 5000, attack: 1.12, hp: 0.90, shield: 0.92, speed: 1.26, crit: 0.14, description: '幽藍折光外殼，主炮會形成四束高速幻影彈。' },
  { id: 'tide', name: '潮汐巡弋者', role: '廣域散射型', tier: 4, sprite: 2, unlock: 6400, attack: 1.07, hp: 1.10, shield: 1.16, speed: 1.05, crit: 0.10, description: '扇面潮汐彈可壓制側翼敵群，攻擊範圍尤其寬廣。' },
  { id: 'rime', name: '霜界裁決', role: '穿透主炮型', tier: 5, sprite: 1, unlock: 7900, attack: 1.30, hp: 1.03, shield: 1.02, speed: 0.94, crit: 0.08, description: '冰白棱鏡主炮可貫穿敵群，專長是直線壓制。' },
  { id: 'nova', name: '星環曙光', role: '多重能量型', tier: 5, sprite: 5, unlock: 9800, attack: 1.20, hp: 1.08, shield: 1.18, speed: 1.08, crit: 0.16, description: '環形能量翼同時射出多道能量束，攻守均衡。' },
  { id: 'helix', name: '螺旋熾羽', role: '旋流暴擊型', tier: 6, sprite: 0, unlock: 12500, attack: 1.28, hp: 0.98, shield: 1.05, speed: 1.15, crit: 0.22, description: '雙層旋翼包覆橘金離子流，連續命中更容易觸發暴擊。' },
  { id: 'aurora', name: '極光聖槍', role: '精準能量型', tier: 6, sprite: 4, unlock: 15800, attack: 1.38, hp: 1.05, shield: 1.12, speed: 1.02, crit: 0.15, description: '極光晶翼聚焦主炮，能在 Boss 戰中維持穩定高輸出。' },
  { id: 'caldera', name: '熔核獵皇', role: '熾焰重擊型', tier: 7, sprite: 1, unlock: 19600, attack: 1.48, hp: 1.12, shield: 1.04, speed: 0.96, crit: 0.12, description: '熔核裝甲在機腹凝聚重炮能量，火力極強但操縱較沉。' },
  { id: 'seraph', name: '星穹熾天使', role: '全能傳奇型', tier: 7, sprite: 5, unlock: 24500, attack: 1.42, hp: 1.15, shield: 1.25, speed: 1.12, crit: 0.20, description: '六翼能量結構同步強化攻擊、護盾與吸附表現。' },
  { id: 'voidlance', name: '虛界天槍', role: '極速穿透型', tier: 8, sprite: 3, unlock: 31000, attack: 1.56, hp: 1.02, shield: 1.10, speed: 1.30, crit: 0.24, description: '暗紫槍翼拖出星塵軌跡，極高速度與穿透火力適合熟練駕駛。' },
  { id: 'solaris', name: '永晝神冕', role: '終階日耀型', tier: 8, sprite: 5, unlock: 39000, attack: 1.62, hp: 1.20, shield: 1.32, speed: 1.10, crit: 0.22, description: '金白日耀核心與多環機翼，提供本作最高階的全域火力。' }
];

export const getShip = id => ships.find(ship => ship.id === id) || ships[0];
