import { advanceDungeon, buyItem, captureWorldBoss, chooseAutoCommand, confirmQuickEquip, continueAfterChapter, createBossEncounter, createEncounter, createWorldBossEncounter, declineDungeon, enterArea, enterDungeon, equipItem, exitDungeon, leaveBattle, optimizeEquipment, prepareQuickEquip, recruitBlackwindLeader, recruitChapter2Boss, refreshUnlocks, resolveFormationAttack, resolveRound, retreatFromBoss, sellItem, settleDungeonBattle, spareBlackwindLeader, spareChapter2Boss, spareWorldBoss, startFormation, unequipItem, usePotion, visitInn, getMemberPower } from './engine.js?v=v021-boss-puzzle';
import { attemptPromotion, combineAllTalismans, combineTalismans } from './boss-progression.js?v=v014-boss-gear';
import { combineAllDivineTalismans, combineDivineTalismans, evolveBossGear } from './boss-gear-system.js?v=v014-boss-gear';
import { clearSave, createState, load, save } from './store.js?v=v020-yellow-turban';
import { render, renderCreation, renderMarblePanel } from './ui.js?v=v021-marble-boss';
import { cleanupMarbleBattle, mountMarbleBattle } from './marble-battle-ui.js?v=v021-marble-boss';
import { deployRosterMember, quickBestParty, withdrawPartyMember } from './world-boss-system.js?v=v020-yellow-turban';
import { claimCollectionMilestone } from './boss-codex-system.js?v=v020-yellow-turban';
import { promoteAllGear, promoteGear } from './gear-tier-system.js?v=v020-yellow-turban';
import { breakthroughWorldBoss } from './world-boss-breakthrough.js?v=v020-yellow-turban';

const app = document.querySelector('#app');
let state = load();
let loopTimer = null;

function stopLoop() {
  if (loopTimer !== null) clearTimeout(loopTimer);
  loopTimer = null;
}

function schedule() {
  if (!state) return;
  const baseExploreScreens = ['plain', 'forest', 'stronghold'];
  const exploreScreens=[...baseExploreScreens,'yellowRoad','yellowCamp','yellowFortress'];
  const formationPaused = state.battle?.formation?.active || state.battle?.formation?.result;
  const shouldAutoFight = !['puzzle', 'marble'].includes(state.battle?.mode) && state.battle && !state.battle.finished && !formationPaused && (state.settings.autoBattle || state.exploration.auto);
  const shouldAutoContinue = state.battle?.finished && state.battle.result === 'victory' && !state.battle.awaitingRecruit && !state.battle.boss && state.exploration.auto;
  const shouldAutoExplore = !state.battle && !state.ui.bossWarning && !state.dungeon.warning && !state.dungeon.active && exploreScreens.includes(state.screen) && state.exploration.auto && !state.ui.chapterComplete&&!state.ui.chapter2Complete;
  if (!shouldAutoFight && !shouldAutoContinue && !shouldAutoExplore) { stopLoop(); return; }
  if (loopTimer !== null) return;
  loopTimer = window.setTimeout(() => {
    loopTimer = null;
    if (!state) return;
    if (state.battle && !['puzzle', 'marble'].includes(state.battle.mode) && !state.battle.finished && !state.battle.formation?.active && !state.battle.formation?.result && (state.settings.autoBattle || state.exploration.auto)) resolveRound(state, chooseAutoCommand(state));
    else if (state.battle?.finished && state.battle.result === 'victory' && !state.battle.awaitingRecruit && !state.battle.boss && state.exploration.auto) { leaveBattle(state); state.notice = '自動探索繼續前進。'; }
    else if (!state.battle && !state.ui.bossWarning && !state.dungeon.warning && !state.dungeon.active && exploreScreens.includes(state.screen) && state.exploration.auto && !state.ui.chapterComplete&&!state.ui.chapter2Complete) createEncounter(state);
    persistAndDraw();
  }, shouldAutoFight ? 680 : 950);
}

function draw() {
  if (state) refreshUnlocks(state);
  cleanupMarbleBattle();
  app.innerHTML = state ? render(state) : renderCreation();
  if (state?.battle) {
    app.insertAdjacentHTML('beforeend', renderMarblePanel(state, state.battle));
    mountMarbleBattle(app, state, () => persistAndDraw());
  }
  requestAnimationFrame(() => {
    const log = app.querySelector('.battle-log');
    if (log) log.scrollTop = log.scrollHeight;
  });
  schedule();
}

function persistAndDraw() { if (state) save(state); draw(); }

app.addEventListener('submit', event => {
  if (event.target.id !== 'create-form') return;
  event.preventDefault();
  const name = new FormData(event.target).get('playerName')?.toString().trim();
  if (!name) return;
  state = createState(name);
  persistAndDraw();
});

app.addEventListener('click', event => {
  const target = event.target.closest('[data-action]');
  if (!target || !state) return;
  const action = target.dataset.action;
  if (action.startsWith('screen:')) {
    const screen = action.slice(7);
    stopLoop();
    state.exploration.auto = false;
    if (['plain','forest','stronghold','yellowRoad','yellowCamp','yellowFortress'].includes(screen)) enterArea(state, screen);
    else { state.screen = screen; if (screen === 'village' || screen === 'shop') state.location = '桃源村'; if(screen==='worldBoss')state.location='世界王祭壇'; if(screen==='bossCodex'){state.location='Boss 圖鑑';state.ui.codexDetail=null;} }
  } else if (action === 'inn') visitInn(state);
  else if (action.startsWith('buy:')) buyItem(state, action.slice(4));
  else if (action === 'explore-once') createEncounter(state);
  else if (action === 'auto-explore') {
    if (state.dungeon.warning || state.dungeon.active) state.notice = '請先完成或離開目前秘境。';
    else { stopLoop(); state.battle = null; state.ui.bossWarning = false; state.ui.bossRarityRank = null; state.exploration.active = false; state.exploration.auto = true; state.notice = '開始自動探索。'; }
  }
  else if (action === 'stop-explore') { state.exploration.auto = false; stopLoop(); state.notice = '已停止探索。'; }
  else if (action === 'challenge-boss') { state.exploration.auto = false; stopLoop(); createBossEncounter(state); }
  else if (action === 'boss:engage') { state.exploration.auto = false; stopLoop(); createBossEncounter(state); }
  else if (action === 'boss:retreat') { stopLoop(); retreatFromBoss(state); }
  else if (action.startsWith('world-boss:view:')) state.ui.selectedWorldBoss=action.slice(16);
  else if (action.startsWith('world-boss:challenge')) { const id=action.split(':')[2]||state.ui.selectedWorldBoss||'crimsonTiger';state.ui.selectedWorldBoss=id;state.screen='worldBoss'; state.location='世界王祭壇'; state.ui.worldBossConfirm=true; }
  else if (action === 'world-boss:engage') { state.ui.worldBossConfirm=false; stopLoop(); createWorldBossEncounter(state,state.ui.selectedWorldBoss||'crimsonTiger'); }
  else if (action === 'world-boss:cancel') state.ui.worldBossConfirm=false;
  else if (action === 'dungeon:enter') { stopLoop(); enterDungeon(state); }
  else if (action === 'dungeon:decline') { stopLoop(); declineDungeon(state); }
  else if (action === 'dungeon:advance') { stopLoop(); advanceDungeon(state); }
  else if (action === 'dungeon:retreat') { stopLoop(); exitDungeon(state, false); }
  else if (action === 'battle:stop-auto') { state.exploration.auto = false; stopLoop(); state.notice = '已停止自動探索，本場戰鬥改為手動。'; }
  else if (action === 'battle:formation') { stopLoop(); startFormation(state); }
  else if (action === 'battle:formation-continue') { if (state.battle?.formation) state.battle.formation.result = null; }
  else if (action === 'battle:recruit') { stopLoop(); state.battle?.worldBoss ? captureWorldBoss(state) : state.battle?.bossKind?recruitChapter2Boss(state):recruitBlackwindLeader(state); }
  else if (action === 'battle:spare') { stopLoop(); state.battle?.worldBoss ? spareWorldBoss(state) : state.battle?.bossKind?spareChapter2Boss(state):spareBlackwindLeader(state); }
  else if (action === 'battle:quick-equip') {
    const dropId = state.battle?.dropId;
    if (dropId && !state.battle.awaitingRecruit) { leaveBattle(state); prepareQuickEquip(state, dropId); }
  }
  else if (action.startsWith('battle:') && action !== 'battle:close') {
    const command = action.slice(7);
    if (command === 'potion') usePotion(state); else resolveRound(state, command);
  } else if (action === 'battle:close') {
    const lost = state.battle?.result === 'defeat';
    if (state.battle?.dungeon && !lost) settleDungeonBattle(state); else leaveBattle(state);
    if (!lost && state.exploration.auto) state.notice = '稍作整備後繼續探索。';
  } else if (action.startsWith('inspect:')) {
    state.ui.selectedItem = action.slice(8);
    if (!state.ui.selectedMember) state.ui.selectedMember = 'hero';
  } else if (action.startsWith('quick:')) prepareQuickEquip(state, action.slice(6));
  else if (action === 'quick-confirm') confirmQuickEquip(state);
  else if (action === 'optimize-equipment') optimizeEquipment(state);
  else if(action==='promote-all-gear')promoteAllGear(state);
  else if(action.startsWith('promote-gear-all:'))promoteGear(state,action.slice(17),true);
  else if(action.startsWith('promote-gear:'))promoteGear(state,action.slice(13),false);
  else if(action.startsWith('world-boss:breakthrough'))breakthroughWorldBoss(state,action.split(':')[2]||'crimsonTiger');
  else if (action === 'promote-leader') attemptPromotion(state);
  else if (action === 'combine-all-talismans') combineAllTalismans(state);
  else if (action.startsWith('combine-talisman:')) combineTalismans(state, action.slice(17));
  else if (action === 'combine-all-divine') combineAllDivineTalismans(state);
  else if (action.startsWith('combine-divine:')) combineDivineTalismans(state, action.slice(16));
  else if (action.startsWith('evolve-boss-gear:')) evolveBossGear(state, action.slice(17));
  else if (action.startsWith('roster-deploy:')) { const [,id,slot]=action.split(':'); deployRosterMember(state,id,slot); }
  else if(action.startsWith('party-swap-open:'))state.ui.partySwapSlot=Number(action.slice(16));
  else if(action==='party-swap-close')state.ui.partySwapSlot=null;
  else if(action.startsWith('party-swap:')){const[,slot,id]=action.split(':');deployRosterMember(state,id,Number(slot));state.ui.partySwapSlot=null;}
  else if(action==='party-quick-best'){quickBestParty(state,getMemberPower);state.ui.partySwapSlot=null;}
  else if(action.startsWith('party-sort:'))state.ui.candidateSort=action.slice(11);
  else if (action.startsWith('roster-withdraw:')) withdrawPartyMember(state,action.slice(16));
  else if (action.startsWith('codex:view:')) state.ui.codexDetail=action.slice(11);
  else if (action === 'codex:back') state.ui.codexDetail=null;
  else if (action.startsWith('codex:claim:')) claimCollectionMilestone(state,Number(action.slice(12)));
  else if (action.startsWith('party-slot:')) {
    const [, memberId, slot] = action.split(':');
    state.ui.partyEquipMember = memberId;
    state.ui.partyEquipSlot = slot;
  } else if (action.startsWith('party-equip:')) {
    const [, memberId, itemId] = action.split(':');
    equipItem(state, memberId, itemId);
    state.ui.partyEquipMember = null;
    state.ui.partyEquipSlot = null;
  } else if (action.startsWith('equip:')) equipItem(state, state.ui.selectedMember, action.slice(6));
  else if (action.startsWith('unequip:')) {
    const [, memberId, slot] = action.split(':');
    unequipItem(state, memberId, slot);
  } else if (action.startsWith('sell:')) {
    const itemId = action.slice(5);
    sellItem(state, itemId);
    if (!(state.inventory[itemId] > 0)) state.ui.selectedItem = null;
  } else if (action === 'chapter:continue') continueAfterChapter(state);
  else if(action==='chapter2:continue'){state.ui.chapter2Complete=false;state.screen='yellowFortress';state.location='黃巾主寨';state.notice='第二章已完成，黃巾主寨仍可繼續探索。';}
  else if (action === 'save') state.notice = save(state) ? '進度已保存。' : '無法寫入存檔。';
  else if (action === 'reset') {
    if (target.dataset.confirm === 'yes') { clearSave(); state = null; stopLoop(); draw(); return; }
    target.dataset.confirm = 'yes'; target.textContent = '再次點擊確認重開'; return;
  }
  persistAndDraw();
});

app.addEventListener('change', event => {
  if (!state) return;
  if (event.target.dataset.setting) state.settings[event.target.dataset.setting] = event.target.checked;
  if (event.target.matches('[data-member-select]')) state.ui.selectedMember = event.target.value;
  persistAndDraw();
});

document.addEventListener('visibilitychange', () => { if (document.hidden) { stopLoop(); cleanupMarbleBattle(state?.battle, true); if (state) save(state); } else draw(); });
window.addEventListener('pagehide', () => { stopLoop(); cleanupMarbleBattle(state?.battle, true); if (state) save(state); });

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
draw();
