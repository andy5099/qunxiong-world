import{CONSUMABLES}from'./data.js?v=53';
import{ARROWS}from'./resources.js?v=38';

const prices={紅色藥水:35,藍色藥水:400,綠色藥水:220,勇敢藥水:700,木箭:1,銀箭:3,米索莉箭:8};
for(const[name,price]of Object.entries(prices)){if(CONSUMABLES[name])CONSUMABLES[name].price=price;if(ARROWS[name])ARROWS[name].price=price}
