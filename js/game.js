import { createPlayer } from './player.js';
import { createRandomEnemy } from './enemy.js';
import { randomInt } from './utils.js';
import { addItem } from './player.js';

// GameState 是所有畫面共用的單一遊戲狀態，後續可加入任務、勢力與地圖。
export function createGameState() { return { player:null, screen:'menu', notice:'', noticeType:'', battle:null }; }
export function startNewGame(state,name) { state.player=createPlayer(name); state.screen='village'; state.notice=`${name}踏入了新手村。`; state.noticeType='good'; }
export function explore(state) { const roll=Math.random(); if(roll<.7){ const enemy=createRandomEnemy(); state.battle={enemy, defending:false, auto:true, log:[`你在蒼林遇到了${enemy.name}！自動攻擊已啟動。`], ended:false, result:null}; state.screen='battle'; return; } if(roll<.9){ addItem(state.player,'herb'); state.notice='你在草叢中找到一株藥草。'; state.noticeType='good'; return; } state.notice='林間只聽見風聲，這次沒有發生任何事。'; state.noticeType=''; }
export function restAtVillage(state) { const healed=Math.min(state.player.maxHp-state.player.hp,randomInt(8,18)); state.player.hp+=healed; state.notice=healed?`村民遞來清水，你回復了 ${healed} HP。`:'你精神飽滿，已無須休息。'; state.noticeType='good'; }
