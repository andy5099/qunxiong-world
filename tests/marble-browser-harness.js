import { createState } from '../src/store.js';
import { createBossEncounter } from '../src/engine.js';
import { renderMarblePanel } from '../src/ui.js';
import { mountMarbleBattle } from '../src/marble-battle-ui.js';

function makeState(){const next=createState('手機驗收');next.screen='stronghold';next.location='黑風寨';next.unlocks.stronghold=true;next.progress.bossUnlocked=true;next.ui.bossWarning=true;next.ui.bossRarityRank=4;createBossEncounter(next,4);return next;}
let state=makeState();
const app=document.querySelector('#app'),result=document.querySelector('#result');
function paint(){app.innerHTML=renderMarblePanel(state,state.battle);mountMarbleBattle(app,state,()=>{result.textContent=state.battle?.finished?state.battle.result:`turn-${state.battle.marble.turnIndex}`;paint();});}
window.__marbleHarness={state,paint,errors:[],reset(){state=makeState();this.state=state;paint();}};
window.addEventListener('error',event=>window.__marbleHarness.errors.push(String(event.error||event.message)));
window.addEventListener('unhandledrejection',event=>window.__marbleHarness.errors.push(String(event.reason)));
paint();
