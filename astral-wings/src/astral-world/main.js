import { createEquipment } from './core.js';
import { IdleGame } from './game.js';
import { BattleRenderer } from './renderer.js';
import { loadState, saveState } from './save.js';
import { AstralUI } from './ui.js';
import { updateObjective, updateUnlocks } from './objective-system.js';
import { ensureTutorial } from './tutorial-system.js';
import { installVisualIconObserver } from './ui-icons.js';
import { applyUiArtAssets, getArtLoadStatus, loadArtManifest, preloadArtAssets } from './art-asset-manager.js';

const state = loadState();
loadArtManifest().then(()=>preloadArtAssets({bundle:'region01'})).then(()=>{applyUiArtAssets(document);const fallback=getArtLoadStatus().failed>0;document.getElementById('app')?.classList.toggle('art-fallback-active',fallback);const notice=document.getElementById('artFallbackNotice');if(notice)notice.hidden=!fallback;});
ensureTutorial(state);
const renderer = new BattleRenderer(document.getElementById('battleCanvas'));
let ui;
const game = new IdleGame(state, renderer, {
  onUpdate: (nextState, battle) => {
    const completed = updateObjective(nextState);
    if (completed) ui?.objectiveComplete(completed);
    for (const unlock of updateUnlocks(nextState)) ui?.unlockNotice(unlock);
    ui?.update(nextState, battle); updateSliceHud(nextState);
  },
  onEvent: event => ui?.event(event),
});
ui = new AstralUI(state, game, renderer, mapId => createEquipment(mapId));
installVisualIconObserver(document, state);
function updateSliceHud(current){const p=current.player,pet=current.pets.find(item=>item.id===current.activePetId);const set=(id,value)=>{const node=document.getElementById(id);if(node)node.textContent=value;};set('sliceHeroLevel',`Lv.${p.level}`);set('sliceHeroPower',`戰力 ${Math.floor(p.power).toLocaleString()}`);set('slicePetName',pet?.name||'尚未出戰');set('slicePetEnergy',`能量 ${Math.floor(pet?.skillEnergy||0)}`);}updateSliceHud(state);

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
