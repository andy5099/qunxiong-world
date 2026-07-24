import { stat, useHerb, gainExp, addItem, activeGenerals } from './player.js';
import { resolveDrops } from './enemy.js';
import { randomInt } from './utils.js';

// 戰鬥流程集中在這裡，UI 只負責顯示結果。
const damage = (attack,defense) => Math.max(1,attack-defense+randomInt(-2,3));
function finishWin(state) { const {player,battle}=state; const enemy=battle.enemy; const levels=gainExp(player,enemy.exp); player.gold+=enemy.gold; const drops=resolveDrops(enemy); drops.forEach(id=>addItem(player,id)); battle.ended=true; battle.result={win:true,exp:enemy.exp,gold:enemy.gold,drops,levels,recruited:false}; battle.log.push(`擊敗${enemy.name}！你可選擇降服對方。`); if(levels.length) battle.log.push(`升級！目前等級 ${player.level}，生命已回滿。`); }
// 隨行武將會在主人行動後協同攻擊，最多三人同時上場。
function companionTurn(state) { const {player,battle}=state; for(const general of activeGenerals(player)){const dealt=damage(general.attack,battle.enemy.defense);battle.enemy.hp=Math.max(0,battle.enemy.hp-dealt);battle.log.push(`${general.name}協同攻擊，造成 ${dealt} 點傷害。`);if(!battle.enemy.hp){finishWin(state);return true;}} return false; }
function enemyTurn(state) { const {player,battle}=state; if(battle.ended) return; const incoming=damage(battle.enemy.attack,stat(player,'defense')); const dealt=battle.defending?Math.max(1,Math.floor(incoming/2)):incoming; player.hp=Math.max(0,player.hp-dealt); battle.log.push(battle.defending?`${battle.enemy.name}攻來，你防守住一部分傷害，受到 ${dealt} 點傷害。`:`${battle.enemy.name}攻擊，你受到 ${dealt} 點傷害。`); battle.defending=false; if(!player.hp){ battle.ended=true;battle.result={win:false};battle.log.push('你倒下了，只能撤回村莊。'); } }
export function battleAction(state,action) { const {player,battle}=state; if(!battle || battle.ended) return; if(action==='attack'){ const dealt=damage(stat(player,'attack'),battle.enemy.defense); battle.enemy.hp=Math.max(0,battle.enemy.hp-dealt);battle.log.push(`你揮出武器，對${battle.enemy.name}造成 ${dealt} 點傷害。`);if(!battle.enemy.hp) return finishWin(state);if(!companionTurn(state))enemyTurn(state); }
 if(action==='defend'){ battle.defending=true;battle.log.push('你沉穩防守，本回合受到的傷害減半。');if(!companionTurn(state))enemyTurn(state); }
 if(action==='item'){ const result=useHerb(player);battle.log.push(result.message);if(result.ok&&!companionTurn(state))enemyTurn(state); }
 if(action==='flee'){ if(Math.random()<.6){ battle.ended=true;battle.result={fled:true};battle.log.push('你成功脫離戰場。'); }else{battle.log.push('逃跑失敗！');enemyTurn(state);} }
}
// 勝利後可將敵人納入麾下；同名武將只能降服一次。
export function recruitDefeatedEnemy(state) { const battle=state.battle; if(!battle?.result?.win || battle.result.recruited) return {ok:false,message:'目前沒有可降服的敵人。'}; const enemy=battle.enemy; const id=`captured-${enemy.id}`; if(state.player.generals.some(general=>general.id===id)) return {ok:false,message:`${enemy.name}已在你的麾下。`}; const loyalty=randomInt(48,68); const title=enemy.tier==='普通'?'降將':`${enemy.tier}降將`; state.player.generals.push({id,name:enemy.name,title,attack:enemy.attack,defense:enemy.defense,loyalty,price:0,source:`降服・${enemy.tier}`}); battle.result.recruited=true; battle.log.push(`${enemy.name}歸順了你，忠誠 ${loyalty}。`); return {ok:true,message:`成功降服${enemy.name}！`}; }
export function leaveBattle(state) { const result=state.battle?.result; if(result && !result.win) state.player.hp=Math.max(1,Math.ceil(state.player.maxHp*.35)); state.battle=null;state.screen='village';state.notice=result?.fled?'你平安返回新手村。':result?.win?'帶著戰利品回到了新手村。':'你被村民救回，先養精蓄銳吧。';state.noticeType=result?.win?'good':result?.fled?'':'bad'; }
