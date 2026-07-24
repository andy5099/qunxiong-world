import { createPlayer } from './player.js';
import { createEnemyByTier } from './enemy.js';
import { randomInt } from './utils.js';
import { addItem } from './player.js';
import { clamp, pick } from './utils.js';
import { createTavernRoster } from './tavern.js';
import { LOCATIONS } from '../data/mapData.js';
import { syncFormation } from './player.js';

// GameState 是所有畫面共用的單一遊戲狀態，後續可加入任務、勢力與地圖。
export function createGameState() { return { player:null, screen:'menu', notice:'', noticeType:'', battle:null, tavernRoster:[], selectedMap:'forest' }; }
export function startNewGame(state,name) { state.player=createPlayer(name); state.tavernRoster=createTavernRoster(); state.selectedMap='forest'; state.screen='village'; state.notice=`${name}踏入了新手村。`; state.noticeType='good'; }
export function explore(state,mapId=state.selectedMap) { const map=LOCATIONS[mapId]||LOCATIONS.forest; state.selectedMap=map.id; state.player.location=map.id; const roll=Math.random(); if(roll<.7){ const enemy=createEnemyByTier(map.enemyTier); state.battle={enemy, mapName:map.name, defending:false, auto:true, log:[`你在${map.name}遇到了${enemy.name}！自動攻擊已啟動。`], ended:false, result:null}; state.screen='battle'; return; } if(roll<.9){ addItem(state.player,'herb'); state.notice=`你在${map.name}找到一株藥草。`; state.noticeType='good'; return; } state.notice=`${map.name}暫時沒有任何動靜。`; state.noticeType=''; }
export function restAtVillage(state) { const healed=Math.min(state.player.maxHp-state.player.hp,randomInt(8,18)); state.player.hp+=healed; state.notice=healed?`村民遞來清水，你回復了 ${healed} HP。`:'你精神飽滿，已無須休息。'; state.noticeType='good'; }
// 推進一個月並結算忠誠與隨機事件；忠誠歸零的武將會自行離去。
export function advanceMonth(state) { const player=state.player; player.month++; const changes=[]; player.generals.forEach(general=>{const delta=randomInt(-5,7);general.loyalty=clamp(general.loyalty+delta,0,100);if(delta) changes.push(`${general.name}${delta>0?'+':''}${delta}`);}); const event=pick(['豐收','盜匪','操練','藥商']); let message=''; if(event==='豐收'){const gold=randomInt(25,45);player.gold+=gold;message=`春耕豐收，獲得 ${gold} 金錢。`;} if(event==='盜匪'){const gold=Math.min(player.gold,randomInt(10,28));player.gold-=gold;message=gold?`盜匪夜襲，損失 ${gold} 金錢。`:'盜匪來襲，但你已沒有可掠奪的錢財。';} if(event==='操練'){player.generals.forEach(general=>general.loyalty=clamp(general.loyalty+6,0,100));message='軍營操練順利，全體武將忠誠提升 6。';} if(event==='藥商'){addItem(player,'herb',2);message='行腳藥商來訪，獲得藥草 × 2。';} const departed=player.generals.filter(general=>general.loyalty<=0).map(general=>general.name); player.generals=player.generals.filter(general=>general.loyalty>0); syncFormation(player); state.tavernRoster=createTavernRoster(); state.notice=`第 ${player.month} 月：${message}${changes.length?` 忠誠變動：${changes.join('、')}。`:''}${departed.length?` ${departed.join('、')}因忠誠耗盡而離去。`:''}`; state.noticeType=departed.length?'bad':'good'; }
