import{Combat}from'./combat.js?v=62';
import{mapFor}from'./hunting.js?v=62';
import{treasureMaterialDrop,treasureBossEquipmentDrop}from'./treasure-v30.js?v=64';
import{addItem}from'./inventory.js?v=42';
const previousWin=Combat.prototype.win;
Combat.prototype.win=function(){let p=this.s.player,map=mapFor(p.map),enemy=this.enemy;if(map.treasure&&!enemy?.boss){let material=treasureMaterialDrop(map);if(material){p.bossMaterials[material]=(p.bossMaterials[material]||0)+1;this.log(`打寶區掉落：【${material}】×1。`,'boss')}}if(enemy?.treasureBoss){let item=treasureBossEquipmentDrop(p,map);if(item){addItem(p,item);this.log(`寶4 Boss Jackpot：【${item.name}】！`,'boss')}}return previousWin.call(this)};
