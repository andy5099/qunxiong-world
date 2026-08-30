import'./transformations.js?v=10';import{CONSUMABLES}from'./data.js?v=10';import{weight}from'./player.js?v=10';import{autoSell}from'./inventory.js?v=10';
export function buy(p,name,count){let x=CONSUMABLES[name],cost=x.price*count;if(!x||count<1||p.gold<cost||weight(p).current+x.weight*count>weight(p).max)return false;p.gold-=cost;p.statsLog.supplyCost+=cost;p.consumables[name]=(p.consumables[name]||0)+count;return true}
export function supply(p,map){let sold=p.settings.autoSell?autoSell(p):0,cost=0,ok=true;for(let n of['紅色藥水','橙色藥水','白色藥水','藍色藥水',...(p.settings.autoSupplyGreen?['綠色藥水']:[]),...(p.settings.autoSupplyBrave?['勇敢藥水']:[]),...(p.settings.autoSupplyTransform?['變身卷軸']:[])]){let need=Math.max(0,p.settings.target[n]-p.consumables[n]);if(need){let affordable=Math.min(need,Math.floor(p.gold/CONSUMABLES[n].price));if(!buy(p,n,affordable))ok=false;cost+=affordable*CONSUMABLES[n].price;if(affordable<need)ok=false}}let fee=map.fee;if(p.gold>=fee){p.gold-=fee;p.statsLog.supplyCost+=fee;cost+=fee}else ok=false;return{ok,cost,sold}}




