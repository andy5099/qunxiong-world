import { buyItem, chooseAutoCommand, createEncounter, leaveBattle, resolveRound, usePotion, visitInn } from './engine.js';
import { clearSave, createState, load, save } from './store.js';
import { render, renderCreation } from './ui.js';

const app = document.querySelector('#app');
let state = load();
let loopTimer = null;

function stopLoop() {
  if (loopTimer !== null) clearTimeout(loopTimer);
  loopTimer = null;
}

function schedule() {
  stopLoop();
  if (!state) return;
  const shouldAutoFight = state.battle && !state.battle.finished && state.settings.autoBattle;
  const shouldAutoExplore = !state.battle && state.screen === 'plain' && state.exploration.auto;
  if (!shouldAutoFight && !shouldAutoExplore) return;
  loopTimer = window.setTimeout(() => {
    loopTimer = null;
    if (shouldAutoFight) resolveRound(state, chooseAutoCommand(state));
    else if (shouldAutoExplore) createEncounter(state);
    persistAndDraw();
  }, shouldAutoFight ? 680 : 1100);
}

function draw() {
  app.innerHTML = state ? render(state) : renderCreation();
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
    stopLoop();
    state.screen = action.slice(7);
    state.location = state.screen === 'plain' ? '村外平原' : '桃源村';
    state.exploration.auto = false;
  } else if (action === 'leave-village') {
    state.screen = 'plain'; state.location = '村外平原'; state.notice = '你離開桃源村，來到遼闊的村外平原。';
  } else if (action === 'inn') visitInn(state);
  else if (action.startsWith('buy:')) buyItem(state, action.slice(4));
  else if (action === 'explore-once') createEncounter(state);
  else if (action === 'auto-explore') { state.exploration.auto = true; state.notice = '開始自動探索。'; }
  else if (action === 'stop-explore') { state.exploration.auto = false; stopLoop(); state.notice = '已停止探索。'; }
  else if (action.startsWith('battle:') && action !== 'battle:close') {
    const command = action.slice(7);
    if (command === 'potion') usePotion(state); else resolveRound(state, command);
  } else if (action === 'battle:close') {
    const lost = state.battle?.result === 'defeat';
    leaveBattle(state);
    if (!lost && state.exploration.auto) state.notice = '稍作整備後繼續探索。';
  } else if (action === 'save') state.notice = save(state) ? '進度已保存。' : '無法寫入存檔。';
  else if (action === 'reset') {
    if (target.dataset.confirm === 'yes') { clearSave(); state = null; stopLoop(); draw(); return; }
    target.dataset.confirm = 'yes'; target.textContent = '再次點擊確認重開'; return;
  }
  persistAndDraw();
});

app.addEventListener('change', event => {
  if (!state || !event.target.dataset.setting) return;
  state.settings[event.target.dataset.setting] = event.target.checked;
  persistAndDraw();
});

document.addEventListener('visibilitychange', () => { if (document.hidden) { stopLoop(); if (state) save(state); } else schedule(); });
window.addEventListener('pagehide', () => { stopLoop(); if (state) save(state); });

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
draw();
