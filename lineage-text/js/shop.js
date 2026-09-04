import'./transformations.js?v=38';import'./resources.js?v=38';import{CONSUMABLES}from'./data.js?v=53';
export const MAX_MANUAL_BUY=1000000;
export function buy(p,name,count){let x=CONSUMABLES[name],qty=Number(count);if(!x||!Number.isSafeInteger(qty)||qty<1||qty>MAX_MANUAL_BUY)return false;let cost=x.price*qty,have=p.consumables[name]||0;if(!Number.isSafeInteger(cost)||cost>p.gold||!Number.isSafeInteger(have+qty))return false;p.gold-=cost;p.consumables[name]=have+qty;return qty}
export function supply(){return{ok:true,partial:false,cost:0,sold:0,bought:{},missing:[],disabled:true}}
