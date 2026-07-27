// 每一型敵機都有獨立的移動與攻擊標籤，戰鬥迴圈依資料套用行為。
export const enemies = {
  scout: { name: '掠光偵察機', hp: 25, speed: 82, score: 80, color: '#64d8ff', pattern: 'drift', attack: 'none' },
  sprinter: { name: '疾閃高速機', hp: 32, speed: 150, score: 120, color: '#97ffe0', pattern: 'dash', attack: 'needle' },
  armor: { name: '鉚甲重裝機', hp: 125, speed: 34, score: 260, color: '#e7a46c', pattern: 'heavy', attack: 'fan' },
  sniper: { name: '遠標狙擊機', hp: 55, speed: 48, score: 230, color: '#c992ff', pattern: 'hold', attack: 'aim' },
  bomber: { name: '熔芯自爆機', hp: 42, speed: 94, score: 210, color: '#ff6e6e', pattern: 'suicide', attack: 'burst' },
  shield: { name: '棱鏡護盾機', hp: 82, speed: 45, score: 280, color: '#6bb7ff', pattern: 'orbit', attack: 'fan', shield: 65 },
  support: { name: '脈衝支援機', hp: 50, speed: 58, score: 240, color: '#f3e66d', pattern: 'sweep', attack: 'ring' },
  elite: { name: '重甲鎮壓者', hp: 430, speed: 28, score: 900, color: '#ff6376', pattern: 'heavy', attack: 'elite', shield: 90 },
  flare: { name: '耀斑掠翼', hp: 38, speed: 116, score: 150, color: '#ffd377', pattern: 'drift', attack: 'needle' },
  formation: { name: '列陣蜂群機', hp: 44, speed: 72, score: 170, color: '#78caff', pattern: 'sweep', attack: 'needle' },
  thresher: { name: '裂甲割裂機', hp: 92, speed: 46, score: 340, color: '#ff9e78', pattern: 'hold', attack: 'fan' },
  reaper: { name: '幽航收割機', hp: 58, speed: 108, score: 290, color: '#d387ff', pattern: 'suicide', attack: 'burst' },
  bastion: { name: '環盾堡壘機', hp: 150, speed: 30, score: 410, color: '#69dfff', pattern: 'heavy', attack: 'fan', shield: 85 },
  medic: { name: '晶脈補給機', hp: 64, speed: 54, score: 310, color: '#8dffce', pattern: 'sweep', attack: 'ring' },
  laser: { name: '折光狙射機', hp: 70, speed: 42, score: 350, color: '#ffa1d9', pattern: 'hold', attack: 'aim' },
  phantom: { name: '影折突襲機', hp: 50, speed: 142, score: 320, color: '#a59cff', pattern: 'dash', attack: 'needle' },
  miner: { name: '深岩鑽擊機', hp: 176, speed: 27, score: 470, color: '#cda977', pattern: 'heavy', attack: 'burst' },
  warder: { name: '守域巡弋機', hp: 108, speed: 48, score: 440, color: '#65e4ef', pattern: 'orbit', attack: 'fan', shield: 42 },
  beacon: { name: '引導中繼機', hp: 76, speed: 52, score: 380, color: '#ffe576', pattern: 'sweep', attack: 'ring' },
  splitter: { name: '虛像分裂機', hp: 66, speed: 86, score: 360, color: '#bb8cff', pattern: 'drift', attack: 'fan' }
};
