import { createEquipment } from './core.js';
import { IdleGame } from './game.js';
import { BattleRenderer } from './renderer.js';
import { loadState, saveState } from './save.js';
import { AstralUI } from './ui.js';
import { updateObjective, updateUnlocks } from './objective-system.js';
import { ensureTutorial } from './tutorial-system.js';

const state = loadState();
ensureTutorial(state);
const renderer = new BattleRenderer(document.getElementById('battleCanvas'));
let ui;
const game = new IdleGame(state, renderer, {
  onUpdate: (nextState, battle) => {
    const completed = updateObjective(nextState);
    if (completed) ui?.objectiveComplete(completed);
    for (const unlock of updateUnlocks(nextState)) ui?.unlockNotice(unlock);
    ui?.update(nextState, battle);
  },
  onEvent: event => ui?.event(event),
});
ui = new AstralUI(state, game, renderer, mapId => createEquipment(mapId));

document.addEventListener('visibilitychange', () => {
  if (document.hidden) saveState(game.state);
});
window.addEventListener('beforeunload', () => saveState(game.state));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('../../service-worker.js').catch(() => {}));
}

if (state.offlinePending) setTimeout(() => ui.openOffline(), 350);
game.start();
window.AstralWorld = { game, get state() { return game.state; }, save: () => saveState(game.state) };
