import'./transformations.js?v=38';import'./resources.js?v=38';import{CONSUMABLES}from'./data.js?v=38';
export function buy(p,name,count){let x=CONSUMABLES[name];count=Math.floor(count);if(!x||count<1)return false;let qty=Math.min(count,Math.floor(p.gold/x.price));if(qty<1)return false;let cost=x.price*qty;p.gold-=cost;p.statsLog.supplyCost+=cost;p.consumables[name]=(p.consumables[name]||0)+qty;return qty}
export function supply(){return{ok:true,partial:false,cost:0,sold:0,bought:{},missing:[],disabled:true}}
