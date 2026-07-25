import { createGameState, startNewGame, explore, restAtVillage, advanceMonth } from './game.js';
import { render } from './ui.js';
import { saveGame, loadGame } from './save.js';
import { buyItem } from './shop.js';
import { useHerb, equipItem, normalizePlayer } from './player.js';
import { switchFormation } from './player.js';
import { battleAction, leaveBattle, recruitDefeatedEnemy } from './battle.js';
import { createTavernRoster, hireGeneral } from './tavern.js';
import { LOCATIONS } from '../data/mapData.js';
import { spawn,win,capture,deploy,star,currentMap,unlocked } from './hunting.js';

// 應用程式入口：管理畫面切換、每月事件與所有按鈕事件。
const state=createGameState(); const app=document.querySelector('#app');
let autoBattleTimer=null;
let huntTimer=null;
function stopHunt(){if(huntTimer!==null){clearTimeout(huntTimer);huntTimer=null;}state.autoHunting=false;}
function huntOnce(){const p=state.player,e=state.huntEnemy||spawn(p);state.huntEnemy=e;if(e.kind==='boss'&&e.hp/e.maxHp<=.2){e.catchable=true;state.notice=`${e.name}生命低於 20%，可使用收服符。`;state.noticeType='good';return;}const boss=p.bossPartners?.find(x=>x.deployed);const hit=Math.max(1,(p.baseAttack+(boss?boss.attack:0))-e.defense+Math.floor(Math.random()*4));e.hp-=hit;if(e.hp<=0){const r=win(p,e);state.huntEnemy=null;state.notice=`擊敗${e.name}，獲得 EXP ${e.exp}、金錢 ${e.gold}${r.g?`，掉落【${r.g.quality}】${r.g.name}`:''}。`;state.noticeType=r.g&&['稀有','史詩','傳說','神器'].includes(r.g.quality)?'good':'';return;}p.hp=Math.max(0,p.hp-Math.max(1,e.attack-p.baseDefense));if(!p.hp){p.hp=Math.ceil(p.maxHp*.35);state.huntEnemy=null;state.notice='狩獵失敗，已返回安全地點。';state.noticeType='bad';}}
function scheduleHunt(){if(huntTimer!==null)clearTimeout(huntTimer);if(!state.autoHunting)return;huntTimer=setTimeout(()=>{huntTimer=null;huntOnce();draw();scheduleHunt();},state.player.hunting?.auto?.speed||850);}
function stopAutoBattle(){ if(autoBattleTimer!==null){ clearTimeout(autoBattleTimer); autoBattleTimer=null; } }
function scheduleAutoBattle(){ stopAutoBattle(); if(state.screen!=='battle'||!state.battle?.auto||state.battle.ended) return; autoBattleTimer=setTimeout(()=>{ autoBattleTimer=null; if(state.screen==='battle'&&state.battle?.auto&&!state.battle.ended){ battleAction(state,'attack'); draw(); } },850); }
function draw(){ app.innerHTML=render(state); scheduleAutoBattle(); }
function setNotice(result){state.notice=result.message;state.noticeType=result.ok?'good':'bad';}
app.addEventListener('click',event=>{const target=event.target.closest('button[data-action]');if(!target||target.disabled)return;const action=target.dataset.action;
 if(action.startsWith('battle:')&&state.battle?.auto){ state.battle.auto=false; stopAutoBattle(); state.battle.log.push('已停止自動攻擊，改為手動戰鬥。'); }
 if(action==='new'){state.screen='create';state.notice='';}
 else if(action==='load'){const saved=loadGame();if(saved&&!saved.error){state.player=normalizePlayer(saved);state.selectedMap=LOCATIONS[state.player.location]?.enemyTier?state.player.location:'forest';state.tavernRoster=createTavernRoster();state.screen='village';state.notice=`歡迎回來，${state.player.name}。`;state.noticeType='good';}else if(saved?.error){state.notice=saved.error;state.noticeType='bad';}}
 else if(action==='help')state.screen='help'; else if(action==='menu'){stopAutoBattle();state.screen='menu';state.notice='';}
 else if(action==='create'){const input=document.querySelector('#name-input');const name=input?.value.trim();if(!name){input?.focus();return;}startNewGame(state,name);}
 else if(action==='village')state.screen='village'; else if(action==='explore')explore(state);else if(action==='rest')restAtVillage(state);else if(action==='month')advanceMonth(state);
 else if(action==='shop'||action==='inventory'||action==='character'||action==='maps'||action==='hunting'||action==='bosses'){state.screen=action;} else if(action==='tavern'){state.screen='tavern';}
 else if(action==='save')setNotice(saveGame(state)); else if(action==='leave-battle')leaveBattle(state);
 else if(action==='recruit-enemy')setNotice(recruitDefeatedEnemy(state));
 else if(action.startsWith('hunt-map:')){state.player.hunting.mapId=action.slice(9);state.huntEnemy=null;state.screen='hunting';}
 else if(action==='hunt-on'){state.autoHunting=true;scheduleHunt();state.notice='自動狩獵已開始。';state.noticeType='good';}
 else if(action==='hunt-off'){stopHunt();state.notice='自動狩獵已停止。';}
 else if(action==='hunt-once')huntOnce();
 else if(action.startsWith('capture:'))setNotice(capture(state.player,state.huntEnemy,action.slice(8)));
 else if(action.startsWith('boss-deploy:'))setNotice(deploy(state.player,action.slice(12)));
 else if(action.startsWith('boss-star:'))setNotice(star(state.player,action.slice(10)));
 else if(action.startsWith('explore-map:'))explore(state,action.slice(12));
 else if(action.startsWith('buy:'))setNotice(buyItem(state.player,action.slice(4)));
 else if(action.startsWith('hire:'))setNotice(hireGeneral(state.player,state.tavernRoster,action.slice(5)));
 else if(action.startsWith('formation:'))setNotice(switchFormation(state.player,action.slice(10)));
 else if(action.startsWith('use:'))setNotice(useHerb(state.player));else if(action.startsWith('equip:'))setNotice(equipItem(state.player,action.slice(6)));
 else if(action.startsWith('battle:'))battleAction(state,action.slice(7)); draw();});
draw();
