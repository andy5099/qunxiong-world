import { createState } from '../src/store.js';
import { createBossEncounter } from '../src/engine.js';
import { renderMarblePanel } from '../src/ui.js';
import { mountMarbleBattle } from '../src/marble-battle-ui.js';

const state=createState('手機驗收');
state.screen='stronghold';state.location='黑風寨';state.unlocks.stronghold=true;state.progress.bossUnlocked=true;state.ui.bossWarning=true;state.ui.bossRarityRank=4;
createBossEncounter(state,4);
const app=document.querySelector('#app'),result=document.querySelector('#result');
function paint(){app.innerHTML=renderMarblePanel(state,state.battle);mountMarbleBattle(app,state,()=>{result.textContent=state.battle?.finished?state.battle.result:`turn-${state.battle.marble.turnIndex}`;paint();});}
paint();
