// 每一型敵機都有獨立的移動與攻擊標籤，戰鬥迴圈依資料套用行為。
export const enemies = {
  scout: { name: '掠光偵察機', hp: 25, speed: 82, score: 80, color: '#64d8ff', pattern: 'drift', attack: 'none' },
  sprinter: { name: '疾閃高速機', hp: 32, speed: 150, score: 120, color: '#97ffe0', pattern: 'dash', attack: 'needle' },
  armor: { name: '鉚甲重裝機', hp: 125, speed: 34, score: 260, color: '#e7a46c', pattern: 'heavy', attack: 'fan' },
  sniper: { name: '遠標狙擊機', hp: 55, speed: 48, score: 230, color: '#c992ff', pattern: 'hold', attack: 'aim' },
  bomber: { name: '熔芯自爆機', hp: 42, speed: 94, score: 210, color: '#ff6e6e', pattern: 'suicide', attack: 'burst' },
  shield: { name: '棱鏡護盾機', hp: 82, speed: 45, score: 280, color: '#6bb7ff', pattern: 'orbit', attack: 'fan', shield: 65 },
  support: { name: '脈衝支援機', hp: 50, speed: 58, score: 240, color: '#f3e66d', pattern: 'sweep', attack: 'ring' },
  elite: { name: '重甲鎮壓者', hp: 430, speed: 28, score: 900, color: '#ff6376', pattern: 'heavy', attack: 'elite', shield: 90 }
};
