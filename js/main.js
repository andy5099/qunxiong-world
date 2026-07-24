import { createGameState, startNewGame, explore, restAtVillage } from './game.js';
import { render } from './ui.js';
import { saveGame, loadGame } from './save.js';
import { buyItem } from './shop.js';
import { useHerb, equipItem } from './player.js';
import { battleAction, leaveBattle } from './battle.js';

// 應用程式入口：管理畫面切換與按鈕事件。
const state=createGameState(); const app=document.querySelector('#app');
let autoBattleTimer=null;
// 自動戰鬥每回合只出手一次；切換畫面或手動操作時會清除排程。
function stopAutoBattle(){ if(autoBattleTimer!==null){ clearTimeout(autoBattleTimer); autoBattleTimer=null; } }
function scheduleAutoBattle(){ stopAutoBattle(); if(state.screen!=='battle'||!state.battle?.auto||state.battle.ended) return; autoBattleTimer=setTimeout(()=>{ autoBattleTimer=null; if(state.screen==='battle'&&state.battle?.auto&&!state.battle.ended){ battleAction(state,'attack'); draw(); } },850); }
function draw(){ app.innerHTML=render(state); scheduleAutoBattle(); }
function setNotice(result){state.notice=result.message;state.noticeType=result.ok?'good':'bad';}
app.addEventListener('click',event=>{const target=event.target.closest('button[data-action]');if(!target||target.disabled)return;const action=target.dataset.action;
 if(action.startsWith('battle:')&&state.battle?.auto){ state.battle.auto=false; stopAutoBattle(); state.battle.log.push('已停止自動攻擊，改為手動戰鬥。'); }
 if(action==='new'){state.screen='create';state.notice='';}
 else if(action==='load'){const p=loadGame();if(p){state.player=p;state.screen='village';state.notice=`歡迎回來，${p.name}。`;state.noticeType='good';}}
 else if(action==='help')state.screen='help'; else if(action==='menu'){state.screen='menu';state.notice='';}
 else if(action==='create'){const input=document.querySelector('#name-input');const name=input?.value.trim();if(!name){input?.focus();return;}startNewGame(state,name);}
 else if(action==='village')state.screen='village'; else if(action==='explore')explore(state);else if(action==='rest')restAtVillage(state);
 else if(action==='shop'||action==='inventory'||action==='character')state.screen=action;
 else if(action==='save')setNotice(saveGame(state)); else if(action==='leave-battle')leaveBattle(state);
 else if(action.startsWith('buy:'))setNotice(buyItem(state.player,action.slice(4)));
 else if(action.startsWith('use:'))setNotice(useHerb(state.player));else if(action.startsWith('equip:'))setNotice(equipItem(state.player,action.slice(6)));
 else if(action.startsWith('battle:'))battleAction(state,action.slice(7)); draw();});
draw();
