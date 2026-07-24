// 道具資料集中管理，方便日後增加裝備與消耗品。
export const ITEMS = {
  woodenSword: { id:'woodenSword', name:'木刀', type:'weapon', price:60, attack:4, description:'樸實木刀，能讓攻擊提升 4 點。' },
  clothArmor: { id:'clothArmor', name:'布衣', type:'armor', price:50, defense:3, description:'輕便的布衣，能讓防禦提升 3 點。' },
  herb: { id:'herb', name:'藥草', type:'consumable', price:15, heal:35, description:'回復 35 點生命。' }
};
export const SHOP_ITEMS = ['woodenSword','clothArmor','herb'];
