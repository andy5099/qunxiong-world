import { ITEMS } from '../data/itemData.js';
import { addItem } from './player.js';
// 商店交易邏輯，未來可加聲望折扣與不同商人。
export function buyItem(player,id) { const item=ITEMS[id]; if(!item) return {ok:false,message:'此商品不存在。'}; if(player.gold<item.price) return {ok:false,message:'金錢不足。'}; player.gold-=item.price;addItem(player,id);return {ok:true,message:`購得${item.name}，花費 ${item.price} 金錢。`}; }
