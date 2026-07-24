import { ITEMS } from '../data/itemData.js';

// 角色物件負責能力計算、升級、背包與裝備。
export function createPlayer(name) { return { name, level:1, exp:0, gold:100, maxHp:100, hp:100, baseAttack:10, baseDefense:5, inventory:{herb:1}, equipment:{weapon:null,armor:null}, generals:[], month:1, location:'village' }; }
// 舊版存檔載入時補上新系統欄位，保留原先養成進度。
export function normalizePlayer(player) { const base=createPlayer(player.name); return {...base,...player, inventory:{...base.inventory,...(player.inventory||{})}, equipment:{...base.equipment,...(player.equipment||{})}, generals:Array.isArray(player.generals)?player.generals:[], month:Number.isFinite(player.month)?player.month:1}; }
// 最多三位忠誠尚存的武將會隨主人進入戰鬥。
export function activeGenerals(player) { return (player.generals||[]).filter(general=>general.loyalty>0).slice(0,3); }
export function expNeeded(player) { return 50 + (player.level-1)*35; }
export function stat(player, kind) { const equip = player.equipment.weapon ? ITEMS[player.equipment.weapon].attack || 0 : 0; const armor = player.equipment.armor ? ITEMS[player.equipment.armor].defense || 0 : 0; return kind==='attack' ? player.baseAttack+equip : player.baseDefense+armor; }
export function addItem(player,id,count=1) { player.inventory[id]=(player.inventory[id]||0)+count; }
export function useHerb(player) { if (!player.inventory.herb) return {ok:false,message:'背包裡沒有藥草。'}; if(player.hp>=player.maxHp) return {ok:false,message:'生命已滿，不需要使用藥草。'}; player.inventory.herb--; const healed=Math.min(ITEMS.herb.heal,player.maxHp-player.hp); player.hp+=healed; return {ok:true,message:`使用藥草，回復 ${healed} HP。`}; }
export function equipItem(player,id) { const item=ITEMS[id]; if(!item || !player.inventory[id]) return {ok:false,message:'沒有這件物品。'}; if(item.type!=='weapon' && item.type!=='armor') return {ok:false,message:'此物品無法裝備。'}; const slot=item.type; const old=player.equipment[slot]; player.inventory[id]--; if(old) addItem(player,old); player.equipment[slot]=id; return {ok:true,message:`已裝備${item.name}。`}; }
export function gainExp(player,amount) { player.exp+=amount; const levels=[]; while(player.exp>=expNeeded(player)){ player.exp-=expNeeded(player); player.level++;player.maxHp+=20;player.baseAttack+=2;player.baseDefense+=1;player.hp=player.maxHp;levels.push(player.level); } return levels; }
