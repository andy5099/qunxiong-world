import { ITEMS } from '../data/itemData.js';
import { CAPTURE_ITEMS } from '../data/huntingData.js';
import { addItem } from './player.js';

export function buyCaptureItem(player,id) { const item=CAPTURE_ITEMS[id]; if(!item) return {ok:false,message:'查無此收服符。'}; if(player.gold<item.price) return {ok:false,message:'金錢不足。'}; player.gold-=item.price; player.captureItems[id]=(player.captureItems[id]||0)+1; return {ok:true,message:`購買${item.name}，花費${item.price} 金錢。`}; }
// 商店交易邏輯，未來可加聲望折扣與不同商人。
export function buyItem(player,id) { const item=ITEMS[id]; if(!item) return {ok:false,message:'此商品不存在。'}; if(player.gold<item.price) return {ok:false,message:'金錢不足。'}; player.gold-=item.price;addItem(player,id);return {ok:true,message:`購得${item.name}，花費 ${item.price} 金錢。`}; }
