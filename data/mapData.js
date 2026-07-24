// 地點與冒險地圖資料集中管理，方便未來加入城市與劇情地圖。
export const LOCATIONS = {
  village:{ id:'village', name:'新手村', description:'亂世初起，這座小村是你暫時的立足之地。' },
  forest:{ id:'forest', name:'蒼林', description:'林深草密，危機與機緣並存。', enemyTier:'普通', label:'小怪地圖' },
  ridge:{ id:'ridge', name:'斷崖嶺', description:'山風凜冽，菁英強敵在此巡獵。', enemyTier:'菁英', label:'菁英地圖' },
  fortress:{ id:'fortress', name:'黑風寨', description:'賊寨深處，多名強敵盤據要道。', enemyTier:'頭目', label:'BOSS 地圖', recommended:'Lv.4+' },
  mistValley:{ id:'mistValley', name:'迷霧古道', description:'長年被濃霧籠罩的舊軍道，計謀與伏兵並存。', enemyTier:'頭目', label:'BOSS 地圖', recommended:'Lv.7+' },
  ragingRiver:{ id:'ragingRiver', name:'怒江水寨', description:'水勢洶湧，水寨霸主率精銳鎮守此處。', enemyTier:'頭目', label:'BOSS 地圖', recommended:'Lv.10+' },
  skyAltar:{ id:'skyAltar', name:'天穹祭壇', description:'天地異動之地，世界頭目會隨機降臨。', enemyTier:'世界頭目', label:'世界頭目', recommended:'Lv.14+' },
  ancientRuins:{ id:'ancientRuins', name:'太古遺城', description:'沉睡戰傀與赤焰巨龍盤旋的終極戰場。', enemyTier:'世界頭目', label:'世界頭目', recommended:'Lv.20+' }
};
export const ADVENTURE_MAPS = ['forest','ridge','fortress','mistValley','ragingRiver','skyAltar','ancientRuins'].map(id=>LOCATIONS[id]);
