import{CLASSES}from'./data.js?v=10';import{weight}from'./player.js?v=10';
export function canEquip(p,item){if(item.slot==='武器'&&item.classes&&!item.classes.includes(p.cls))return false;if(item.slot==='武器'&&!CLASSES[p.cls].weapon.includes(item.type))return false;if(item.slot==='盾牌'){let w=p.equipment.武器;if(w&&(w.two||w.type==='弓'||['雙刀','鋼爪'].includes(w.type)))return false}return true}
export function equip(p,id){let i=p.bag.find(x=>x.uid===id);if(!i||!canEquip(p,i))return false;if(i.slot==='武器'&&(i.two||i.type==='弓'||['雙刀','鋼爪'].includes(i.type))&&p.equipment.盾牌)p.bag.push(p.equipment.盾牌),delete p.equipment.盾牌;let old=p.equipment[i.slot];p.bag=p.bag.filter(x=>x.uid!==id);if(old)p.bag.push(old);p.equipment[i.slot]=i;return true}
export function addItem(p,item,important=false){if(weight(p).ratio>=1&&!important)return false;p.bag.push({...item,uid:Date.now().toString(36)+Math.random().toString(36).slice(2),enhance:item.enhance||0,protected:!!item.protected||!!item.boss||!!item.world||!!item.special});return true}
export function sell(p,id){let i=p.bag.find(x=>x.uid===id);if(!i||i.protected||i.enhance>0)return false;p.gold+=Math.floor((i.price||100)/3);p.bag=p.bag.filter(x=>x.uid!==id);return true}
export function autoSell(p){let list=p.bag.filter(i=>!i.protected&&!i.enhance);let gold=list.reduce((n,i)=>n+Math.floor((i.price||100)/3),0);p.gold+=gold;p.bag=p.bag.filter(i=>i.protected||i.enhance);return gold}
export function moveWarehouse(p,id,toWarehouse=true){let from=toWarehouse?p.bag:p.warehouse,to=toWarehouse?p.warehouse:p.bag,i=from.find(x=>x.uid===id);if(!i)return false;from.splice(from.indexOf(i),1);to.push(i);return true}



