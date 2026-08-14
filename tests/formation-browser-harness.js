import { createState } from '../src/store.js';
import { createBossEncounter, resolveFormationAttack, startFormation } from '../src/engine.js';
import { ensureFormation } from '../src/formation-puzzle.js';
import { mountFormationPuzzle } from '../src/formation-puzzle-ui.js';
import { renderFormationPanel } from '../src/ui.js';

const app = document.querySelector('#app'), state = createState('Pointer 驗收');
state.screen = 'stronghold'; state.ui.bossWarning = true; state.ui.bossRarityRank = 3; createBossEncounter(state, 3);
ensureFormation(state.battle).gauge = 100;
function draw() { app.innerHTML = renderFormationPanel(state, state.battle); mountFormationPuzzle(app, state.battle, () => { resolveFormationAttack(state, () => .42); draw(); }); }
app.addEventListener('click', event => { if (event.target.closest('[data-action="battle:formation"]')) { startFormation(state, () => .42); draw(); } else if (event.target.closest('[data-action="battle:formation-continue"]')) { state.battle.formation.result = null; draw(); } });
draw();
