import { GENERAL_POOL } from '../data/generalData.js';
import { addToFormation } from './player.js';

// 酒館負責提供每月人選與招募交易，不直接處理畫面。
export function createTavernRoster() {
  return [...GENERAL_POOL].sort(() => Math.random() - 0.5).slice(0,3).map(general => ({...general}));
}
export function hireGeneral(player, roster, id) {
  const general=roster.find(candidate => candidate.id===id);
  if(!general) return {ok:false,message:'這位武將已經離開酒館。'};
  if(player.generals.some(member => member.id===id)) return {ok:false,message:`${general.name}已在你的麾下。`};
  if(player.gold<general.price) return {ok:false,message:'金錢不足，無法支付招募費。'};
  player.gold-=general.price;
  player.generals.push({...general, source:'酒館'});
  addToFormation(player,general.id);
  roster.splice(roster.indexOf(general),1);
  return {ok:true,message:`${general.name}願意加入麾下，初始忠誠 ${general.loyalty}。`};
}
