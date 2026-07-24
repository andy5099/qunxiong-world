import { createGameState, startNewGame, explore, restAtVillage, advanceMonth } from './game.js';
import { render } from './ui.js';
import { saveGame, loadGame } from './save.js';
import { buyItem } from './shop.js';
import { useHerb, equipItem, normalizePlayer } from './player.js';
import { switchFormation } from './player.js';
import { battleAction, leaveBattle, recruitDefeatedEnemy } from './battle.js';
import { createTavernRoster, hireGeneral } from './tavern.js';
import { LOCATIONS } from '../data/mapData.js';

// 應用程式入口：管理畫面切換、每月事件與所有按鈕事件。
const state=createGameState(); const app=document.querySelector('#app');
let autoBattleTimer=null;
function stopAutoBattle(){ if(autoBattleTimer!==null){ clearTimeout(autoBattleTimer); autoBattleTimer=null; } }
function scheduleAutoBattle(){ stopAutoBattle(); if(state.screen!=='battle'||!state.battle?.auto||state.battle.ended) return; autoBattleTimer=setTimeout(()=>{ autoBattleTimer=null; if(state.screen==='battle'&&state.battle?.auto&&!state.battle.ended){ battleAction(state,'attack'); draw(); } },850); }
function draw(){ app.innerHTML=render(state); scheduleAutoBattle(); }
function setNotice(result){state.notice=result.message;state.noticeType=result.ok?'good':'bad';}
app.addEventListener('click',event=>{const target=event.target.closest('button[data-action]');if(!target||target.disabled)return;const action=target.dataset.action;
 if(action.startsWith('battle:')&&state.battle?.auto){ state.battle.auto=false; stopAutoBattle(); state.battle.log.push('已停止自動攻擊，改為手動戰鬥。'); }
 if(action==='new'){state.screen='create';state.notice='';}
 else if(action==='load'){const saved=loadGame();if(saved){state.player=normalizePlayer(saved);state.selectedMap=LOCATIONS[state.player.location]?.enemyTier?state.player.location:'forest';state.tavernRoster=createTavernRoster();state.screen='village';state.notice=`歡迎回來，${state.player.name}。`;state.noticeType='good';}}
 else if(action==='help')state.screen='help'; else if(action==='menu'){stopAutoBattle();state.screen='menu';state.notice='';}
 else if(action==='create'){const input=document.querySelector('#name-input');const name=input?.value.trim();if(!name){input?.focus();return;}startNewGame(state,name);}
 else if(action==='village')state.screen='village'; else if(action==='explore')explore(state);else if(action==='rest')restAtVillage(state);else if(action==='month')advanceMonth(state);
 else if(action==='shop'||action==='inventory'||action==='character'||action==='maps'){state.screen=action;} else if(action==='tavern'){state.screen='tavern';}
 else if(action==='save')setNotice(saveGame(state)); else if(action==='leave-battle')leaveBattle(state);
 else if(action==='recruit-enemy')setNotice(recruitDefeatedEnemy(state));
 else if(action.startsWith('explore-map:'))explore(state,action.slice(12));
 else if(action.startsWith('buy:'))setNotice(buyItem(state.player,action.slice(4)));
 else if(action.startsWith('hire:'))setNotice(hireGeneral(state.player,state.tavernRoster,action.slice(5)));
 else if(action.startsWith('formation:'))setNotice(switchFormation(state.player,action.slice(10)));
 else if(action.startsWith('use:'))setNotice(useHerb(state.player));else if(action.startsWith('equip:'))setNotice(equipItem(state.player,action.slice(6)));
 else if(action.startsWith('battle:'))battleAction(state,action.slice(7)); draw();});
draw();
