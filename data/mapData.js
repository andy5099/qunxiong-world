// 地點與冒險地圖資料集中管理，方便未來加入城市與劇情地圖。
export const LOCATIONS = {
  village:{ id:'village', name:'新手村', description:'亂世初起，這座小村是你暫時的立足之地。' },
  forest:{ id:'forest', name:'蒼林', description:'林深草密，危機與機緣並存。', enemyTier:'普通', label:'小怪地圖' },
  ridge:{ id:'ridge', name:'斷崖嶺', description:'山風凜冽，菁英強敵在此巡獵。', enemyTier:'菁英', label:'菁英地圖' },
  fortress:{ id:'fortress', name:'黑風寨', description:'賊寨深處，頭目正等待來犯者。', enemyTier:'頭目', label:'BOSS 地圖' }
};
export const ADVENTURE_MAPS = ['forest','ridge','fortress'].map(id=>LOCATIONS[id]);
