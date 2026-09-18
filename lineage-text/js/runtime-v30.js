import{Combat}from'./combat.js?v=62';
import{mapFor}from'./hunting.js?v=62';
import{treasureMaterialDrop}from'./treasure-v30.js?v=62';
const previousWin=Combat.prototype.win;
Combat.prototype.win=function(){let p=this.s.player,map=mapFor(p.map),enemy=this.enemy;if(map.treasure&&!enemy?.boss){let material=treasureMaterialDrop(map);if(material){p.bossMaterials[material]=(p.bossMaterials[material]||0)+1;this.log(`打寶區掉落：【${material}】×1。`,'boss')}}return previousWin.call(this)};
